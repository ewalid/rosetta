# Rosetta Backend + MCP - Comprehensive Strict Security Audit

**Date**: 2026-01-27  
**Auditor**: Security Review Team  
**Scope**: Complete Backend + MCP Implementation  
**Severity Scale**: 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low | ✅ Pass

---

## Executive Summary

**OVERALL SECURITY RATING: 🟠 HIGH RISK - CRITICAL FIXES REQUIRED**

This comprehensive security audit identified **8 critical vulnerabilities**, **5 high-risk issues**, and **12 medium/low-risk concerns** across the entire backend and MCP implementation. The application has significant security gaps that must be addressed before production deployment.

### Risk Summary

| Category | Risk Level | Critical Issues | High Issues | Medium/Low Issues |
|----------|------------|----------------|-------------|-------------------|
| **File System Security** | 🔴 **CRITICAL** | 3 | 2 | 2 |
| **Input Validation** | 🟠 **HIGH** | 1 | 2 | 3 |
| **Authentication/Authorization** | 🟡 **MEDIUM** | 0 | 1 | 2 |
| **Error Handling** | 🟡 **MEDIUM** | 0 | 0 | 4 |
| **CORS Configuration** | 🟠 **HIGH** | 0 | 1 | 1 |
| **Temporary File Handling** | 🟡 **MEDIUM** | 0 | 0 | 3 |
| **Rate Limiting** | 🟡 **MEDIUM** | 0 | 0 | 1 |
| **Secrets Management** | 🔵 **LOW** | 0 | 0 | 2 |
| **Dependencies** | 🔵 **LOW** | 0 | 0 | 1 |

### Critical Findings Overview

1. **🔴 CRITICAL**: File path validation completely bypassed in MCP stdio server
2. **🔴 CRITICAL**: Arbitrary file system read via symlinks (path traversal)
3. **🔴 CRITICAL**: Missing file magic byte validation in multiple endpoints
4. **🟠 HIGH**: CORS allows wildcard origins with credentials disabled (inconsistent)
5. **🟠 HIGH**: No rate limiting - vulnerable to DoS and API quota exhaustion
6. **🟠 HIGH**: Temporary file cleanup race conditions - disk space exhaustion risk
7. **🟠 HIGH**: Error messages leak sensitive file system information
8. **🟡 MEDIUM**: ReCAPTCHA can be disabled in development mode

---

## Detailed Security Findings

### 🔴 CRITICAL #1: File Path Validation Bypass (MCP Stdio Server)

**Location**: `src/rosetta/api/mcp.py:976-1059`

**Issue**: The stdio server accepts `file_path` parameter but **completely bypasses all security validation** that exists for base64 input, allowing arbitrary file reads.

**Vulnerable Code**:
```python
# Line 994-1008: Missing validation for file_path
if has_path:
    file_path_str = os.path.expanduser(arguments["file_path"])
    file_path_obj = Path(file_path_str).resolve()  # Resolves symlinks BUT...
    
    # MISSING: File extension validation
    # MISSING: File size validation  
    # MISSING: Magic bytes validation
    # MISSING: Path traversal check beyond resolve()
    
    # Directly processes file without validation
    result = await call_handler_with_path(name, str(file_path_obj), arguments)
```

**Attack Scenarios**:
```python
# Scenario 1: Read sensitive files
{
  "file_path": "/etc/passwd",
  "target_language": "french"
}

# Scenario 2: Read SSH keys
{
  "file_path": "~/.ssh/id_rsa",
  "target_language": "spanish"
}

# Scenario 3: Read application config files
{
  "file_path": "/app/.env",
  "target_language": "german"
}
```

**Impact**:
- ✅ HTTP endpoint (base64) is protected
- 🔴 **Stdio endpoint is UNPROTECTED** - can read any file user has access to
- Complete file system read access
- Data exfiltration via translation API responses
- Compromises user privacy and system security

**Severity**: 🔴 **CRITICAL**

**Required Fix**:
```python
if has_path:
    file_path_str = os.path.expanduser(arguments["file_path"])
    file_path_obj = Path(file_path_str).resolve()
    
    # CRITICAL: Validate file exists and is a file
    if not file_path_obj.exists():
        raise ValueError("File not found or inaccessible")
    if not file_path_obj.is_file():
        raise ValueError("Path must be a file, not a directory")
    
    # CRITICAL: Validate file extension
    if not str(file_path_obj).lower().endswith((".xlsx", ".xlsm", ".xltx", ".xltm")):
        raise ValueError("Only Excel files are allowed")
    
    # CRITICAL: Validate file size (50MB max)
    file_size = file_path_obj.stat().st_size
    if file_size > 50 * 1024 * 1024:
        raise ValueError("File size exceeds maximum of 50MB")
    
    # CRITICAL: Validate magic bytes (ZIP signature for Excel)
    with open(file_path_obj, 'rb') as f:
        magic = f.read(4)
        if magic != b'PK\x03\x04':
            raise ValueError("File is not a valid Excel file")
```

---

### 🔴 CRITICAL #2: Symlink Attack / Path Traversal

**Location**: `src/rosetta/api/mcp.py:998`

**Issue**: While `Path.resolve()` is used, the code **does not validate that resolved path is safe** or check for path traversal attempts before resolution.

**Vulnerable Code**:
```python
# Line 998: Resolves symlinks but doesn't validate input first
file_path_obj = Path(file_path_str).resolve()

# Attack: Symlink with .xlsx extension pointing to sensitive file
# ln -s /etc/passwd ~/Downloads/passwords.xlsx
# File passes extension check but reads /etc/passwd
```

**Attack Scenario**:
```bash
# Create malicious symlink
ln -s /etc/passwd ~/Downloads/passwords.xlsx
ln -s ~/.ssh/id_rsa ~/Downloads/ssh_key.xlsx
ln -s /app/.env ~/Downloads/config.xlsx

# Request translation via Claude Desktop
"Translate ~/Downloads/passwords.xlsx to French"
# Path ends with .xlsx, passes validation
# But resolves to /etc/passwd and reads it
```

**Impact**:
- Bypasses extension-based security checks
- Can read ANY file regardless of actual extension
- Works even if extension validation is added (if magic bytes not checked)
- Critical data exfiltration vector

**Severity**: 🔴 **CRITICAL**

**Required Fix**:
```python
file_path_str = os.path.expanduser(arguments["file_path"])

# Check for path traversal BEFORE resolve
if ".." in file_path_str or file_path_str.startswith("/"):
    # In some contexts, allow absolute paths from home directory
    if not file_path_str.startswith(os.path.expanduser("~")):
        raise ValueError("Path traversal not allowed")

# NOW resolve symlinks
file_path_obj = Path(file_path_str).resolve()

# CRITICAL: Validate magic bytes AFTER resolution
with open(file_path_obj, 'rb') as f:
    magic = f.read(4)
    if magic != b'PK\x03\x04':  # Excel files are ZIP archives
        raise ValueError("File is not a valid Excel file")
```

---

### 🔴 CRITICAL #3: Missing File Magic Byte Validation

**Location**: `src/rosetta/api/app.py` (all file upload endpoints)

**Issue**: FastAPI endpoints validate file extensions but **never verify file magic bytes**, allowing file type spoofing attacks.

**Vulnerable Code**:
```python
# app.py:129-133: Only checks extension, not file content
if not file.filename.lower().endswith((".xlsx", ".xlsm", ".xltx", ".xltm")):
    raise HTTPException(status_code=400, detail="Invalid file type...")

content = await file.read()
# NO MAGIC BYTE VALIDATION
# Attacker can rename malicious.zip to malicious.xlsx and upload it
```

**Attack Scenario**:
```python
# Attacker creates malicious ZIP bomb
zipfile.ZipFile("bomb.zip", "w").writestr("file1.txt", "A" * (10**9))

# Rename to .xlsx
os.rename("bomb.zip", "bomb.xlsx")

# Upload via API
# Passes extension check
# But is actually a ZIP bomb, not Excel
# openpyxl will try to parse it, consuming massive resources
```

**Impact**:
- File type spoofing attacks
- ZIP bomb attacks (DoS via resource exhaustion)
- Potential code execution if openpyxl has vulnerabilities with malformed files
- Inconsistent security between endpoints

**Severity**: 🔴 **CRITICAL**

**Required Fix**:
```python
# After reading file content
content = await file.read()

# CRITICAL: Validate magic bytes
if not content.startswith(b'PK\x03\x04'):
    raise HTTPException(
        status_code=400,
        detail="Invalid file format. Only Excel files are supported"
    )

# Additional validation: Check it's actually a ZIP
try:
    import zipfile
    with zipfile.ZipFile(io.BytesIO(content)) as zf:
        # Check for required Excel structure
        if 'xl/workbook.xml' not in zf.namelist():
            raise HTTPException(
                status_code=400,
                detail="File is not a valid Excel file"
            )
except zipfile.BadZipFile:
    raise HTTPException(
        status_code=400,
        detail="Invalid file format. Only Excel files are supported"
    )
```

---

### 🟠 HIGH #4: Insecure CORS Configuration

**Location**: `src/rosetta/api/app.py:34-94`

**Issue**: CORS configuration allows wildcard origins (`"*"`) when `CORS_ALLOW_ALL=true`, but this disables credentials. However, the code still allows all methods and headers, creating inconsistent security.

**Vulnerable Code**:
```python
# Line 44-46: Allows wildcard when CORS_ALLOW_ALL=true
if CORS_ALLOW_ALL:
    ALLOWED_ORIGINS = ["*"]

# Line 87-94: CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Can be ["*"]
    allow_credentials=not CORS_ALLOW_ALL,  # Disabled if wildcard
    allow_methods=["*"],  # Allows ALL HTTP methods
    allow_headers=["*"],  # Allows ALL headers
    expose_headers=["*"],  # Exposes ALL headers
)
```

**Issues**:
1. **Wildcard origin** allows any domain to make requests
2. **All methods allowed** - DELETE, PUT, PATCH can be abused
3. **All headers allowed** - can inject custom headers
4. **All headers exposed** - leaks sensitive headers
5. **No origin validation** beyond environment variable

**Attack Scenarios**:
```javascript
// Malicious website can make requests
fetch('https://rosetta-api.example.com/translate', {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data',
    'X-Malicious-Header': 'attack'
  },
  body: formData
});

// Even with credentials disabled, can still:
// - Make requests (DoS)
// - Probe API structure
// - Test for vulnerabilities
// - Abuse rate limits (if none exist)
```

**Impact**:
- CSRF attacks (though mitigated by reCAPTCHA)
- API probing and enumeration
- DoS via unlimited requests
- Information leakage via exposed headers

**Severity**: 🟠 **HIGH**

**Required Fix**:
```python
# NEVER use wildcard in production
if os.getenv("ENVIRONMENT") == "production":
    if CORS_ALLOW_ALL:
        raise ValueError("CORS_ALLOW_ALL cannot be true in production")

# Whitelist specific origins only
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production frontend URL from environment
FRONTEND_URL = os.getenv("FRONTEND_URL")
if FRONTEND_URL and os.getenv("ENVIRONMENT") == "production":
    ALLOWED_ORIGINS.append(FRONTEND_URL)

# Restrict methods and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Only needed methods
    allow_headers=["Content-Type", "Authorization", "X-Recaptcha-Token"],
    expose_headers=["X-Cells-Translated"],  # Only necessary headers
)
```

---

### 🟠 HIGH #5: No Rate Limiting

**Location**: All API endpoints in `src/rosetta/api/app.py` and `src/rosetta/api/mcp.py`

**Issue**: **No rate limiting** on any endpoints, allowing unlimited requests per IP/user.

**Impact**:
- **DoS attacks** - attacker can flood server with requests
- **API quota exhaustion** - unlimited translation requests exhaust Anthropic API quota
- **Cost attacks** - malicious user can generate unlimited costs
- **Resource exhaustion** - unlimited file processing consumes CPU/memory

**Attack Scenarios**:
```python
# DoS attack: Flood server with requests
import concurrent.futures
import requests

def spam_request():
    files = {'file': open('large_file.xlsx', 'rb')}
    data = {'target_lang': 'french', 'recaptcha_token': 'fake'}
    requests.post('http://api/translate', files=files, data=data)

# Spam 1000 concurrent requests
with concurrent.futures.ThreadPoolExecutor(max_workers=1000) as executor:
    executor.map(spam_request, range(1000))
```

**Severity**: 🟠 **HIGH**

**Required Fix**:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/translate")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def translate(...):
    ...

@app.post("/estimate")
@limiter.limit("30/minute")
async def estimate_cost(...):
    ...
```

---

### 🟠 HIGH #6: Temporary File Cleanup Race Conditions

**Location**: Multiple files - `src/rosetta/api/app.py`, `src/rosetta/api/mcp.py`

**Issue**: Temporary files are created with `delete=False` and cleaned up manually. If an exception occurs, files are **never cleaned up**, leading to disk space exhaustion.

**Vulnerable Code**:
```python
# app.py:151-190: Temp file cleanup in finally block
with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp_input:
    tmp_input.write(content)
    input_path = Path(tmp_input.name)

try:
    # Process file
    ...
except Exception as e:
    raise HTTPException(...)
finally:
    input_path.unlink(missing_ok=True)  # Cleanup

# PROBLEM: If server crashes or is killed, finally never runs
# Temp files accumulate forever
```

**Impact**:
- **Disk space exhaustion** - temp files accumulate indefinitely
- **Resource leaks** - system resources tied up
- **Security risk** - temp files may contain sensitive data
- **Performance degradation** - filesystem filled with temp files

**Severity**: 🟠 **HIGH**

**Required Fix**:
```python
import atexit
import tempfile
from pathlib import Path

# Global registry for temp files
_temp_files = []
_temp_lock = threading.Lock()

def cleanup_temp_files():
    """Cleanup all registered temp files on exit."""
    with _temp_lock:
        for path in _temp_files:
            try:
                path.unlink(missing_ok=True)
            except Exception:
                pass
        _temp_files.clear()

atexit.register(cleanup_temp_files)

def create_temp_file(content: bytes, suffix: str = ".xlsx") -> Path:
    """Create temp file and register for cleanup."""
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        path = Path(tmp.name)
    
    with _temp_lock:
        _temp_files.append(path)
    
    return path

# Use in endpoints
input_path = create_temp_file(content)
try:
    # Process file
    ...
finally:
    input_path.unlink(missing_ok=True)
    with _temp_lock:
        if input_path in _temp_files:
            _temp_files.remove(input_path)
```

---

### 🟠 HIGH #7: Error Messages Leak Sensitive Information

**Location**: Multiple endpoints - `src/rosetta/api/app.py`, `src/rosetta/api/mcp.py`

**Issue**: Error messages expose **internal file paths**, **system information**, and **implementation details**.

**Vulnerable Code**:
```python
# app.py:188: Exposes full exception message
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Estimation failed: {str(e)}")

# mcp.py:1057: Logs detailed error (good) but also returns it
except Exception as e:
    logging.error(f"Tool {name} error: {type(e).__name__}: {str(e)}")
    raise ValueError("Failed to process file. Please ensure it's a valid Excel file.")
    # Better, but some paths still leak info

# app.py:235: Exposes file reading errors
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
```

**Attack Scenario**:
```python
# Attacker probes file system
POST /sheets
file: /etc/passwd.xlsx (renamed)

# Error response reveals:
{
  "detail": "Failed to read file: '/tmp/tmpXYZ.xlsx' is not a ZIP archive"
}

# Now attacker knows:
# 1. Temp directory location (/tmp/)
# 2. File naming pattern (tmpXYZ)
# 3. System uses ZIP file validation
# 4. Can probe for file existence
```

**Impact**:
- **Information disclosure** - reveals system structure
- **File system mapping** - helps attacker understand paths
- **Error-based enumeration** - can probe for file existence
- **Debugging information** - helps attacker understand implementation

**Severity**: 🟠 **HIGH**

**Required Fix**:
```python
# Generic error messages for users
except HTTPException:
    raise
except FileNotFoundError:
    raise HTTPException(status_code=404, detail="File not found")
except PermissionError:
    raise HTTPException(status_code=403, detail="Access denied")
except ValueError as e:
    # Safe to expose validation errors
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    # Log detailed error for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Internal error in {endpoint}: {type(e).__name__}: {str(e)}", exc_info=True)
    
    # Generic message for user
    raise HTTPException(
        status_code=500,
        detail="An error occurred processing your request. Please try again."
    )
```

---

### 🟡 MEDIUM #8: ReCAPTCHA Can Be Disabled in Development

**Location**: `src/rosetta/api/app.py:373-405`

**Issue**: ReCAPTCHA verification **silently passes** if `RECAPTCHA_SECRET_KEY` is not set, which could be misconfigured in production.

**Vulnerable Code**:
```python
# app.py:375-377: Skips verification if no key
def verify_recaptcha(token: Optional[str]) -> bool:
    if not RECAPTCHA_SECRET_KEY:
        # If no secret key is configured, skip verification (for development)
        return True  # ⚠️ SECURITY RISK
```

**Impact**:
- ReCAPTCHA completely bypassed if env var not set
- Could be misconfigured in production
- No warning or error if key missing
- Allows automated attacks without CAPTCHA

**Severity**: 🟡 **MEDIUM**

**Required Fix**:
```python
def verify_recaptcha(token: Optional[str]) -> bool:
    # CRITICAL: Fail closed - require key in production
    if not RECAPTCHA_SECRET_KEY:
        if os.getenv("ENVIRONMENT") == "production":
            raise ValueError("RECAPTCHA_SECRET_KEY must be set in production")
        # Allow bypass only in development
        return True
    
    if not token:
        return False
    
    try:
        response = requests.post(
            RECAPTCHA_VERIFY_URL,
            data={"secret": RECAPTCHA_SECRET_KEY, "response": token},
            timeout=5,
        )
        response.raise_for_status()
        result = response.json()
        return result.get("success", False)
    except Exception as e:
        logger.warning(f"reCAPTCHA verification error: {e}")
        return False  # Fail closed - reject if verification fails
```

---

### 🟡 MEDIUM #9: Missing Input Sanitization in Sheet Names

**Location**: `src/rosetta/api/app.py:148`, `src/rosetta/api/mcp.py:795`

**Issue**: Sheet names from user input are **not validated** for length, special characters, or injection attempts in some code paths.

**Vulnerable Code**:
```python
# app.py:148: No validation on sheet names
sheets_set = {s.strip() for s in sheets.split(",") if s.strip()}

# Used in string formatting without validation
scope = f"sheets: {', '.join(sorted(sheets_set))}"  # Can inject newlines
```

**Attack Scenario**:
```python
# DoS via huge sheet names
POST /estimate
sheets: "A" * 10000

# Injection via newlines in sheet names
sheets: "Sheet1\n\nMALICIOUS OUTPUT\n\n"
```

**Severity**: 🟡 **MEDIUM**

**Required Fix**:
```python
def validate_sheet_name(sheet: str) -> str:
    """Validate individual sheet name."""
    if not sheet or not isinstance(sheet, str):
        raise ValueError("Sheet name must be a non-empty string")
    
    if len(sheet) > 100:  # Excel limit is 31, but be generous
        raise ValueError("Sheet name exceeds maximum length of 100 characters")
    
    # Prevent injection attempts
    if "\n" in sheet or "\r" in sheet or "\t" in sheet:
        raise ValueError("Sheet name contains invalid characters")
    
    return sheet.strip()

# Use in endpoints
if sheets:
    validated_sheets = [validate_sheet_name(s.strip()) for s in sheets.split(",") if s.strip()]
    sheets_set = set(validated_sheets)
```

---

### 🟡 MEDIUM #10: File Size Validation After Reading

**Location**: `src/rosetta/api/app.py:136-143`

**Issue**: File content is **read entirely into memory** before size validation, allowing memory exhaustion attacks.

**Vulnerable Code**:
```python
# app.py:136: Reads entire file into memory
content = await file.read()

# app.py:139: Checks size AFTER reading
if len(content) > MAX_FILE_SIZE:
    raise HTTPException(...)

# PROBLEM: If file is 100GB, server runs out of memory before check
```

**Impact**:
- **Memory exhaustion** - large files read into memory before validation
- **DoS attacks** - attacker can crash server with large uploads
- **Resource consumption** - high memory usage before rejection

**Severity**: 🟡 **MEDIUM**

**Required Fix**:
```python
# Check Content-Length header first (if available)
if request.headers.get("content-length"):
    content_length = int(request.headers["content-length"])
    if content_length > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

# Stream file and validate size during read
content = b""
chunk_size = 8192
max_read = MAX_FILE_SIZE + 1

while True:
    chunk = await file.read(chunk_size)
    if not chunk:
        break
    content += chunk
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
```

---

### 🔵 LOW #11: Hardcoded API Access Key in Frontend

**Location**: `frontend/src/api/client.ts:147`

**Issue**: Web3Forms API access key is **hardcoded** in frontend JavaScript, exposing it to all clients.

**Vulnerable Code**:
```typescript
// frontend/src/api/client.ts:147
const WEB3FORMS_ACCESS_KEY = '8ed7e53d-d67a-476c-ad63-1160c7681975';
```

**Impact**:
- API key exposed in client-side code
- Anyone can use the key
- Potential abuse of Web3Forms service
- Billing issues if key has limits

**Severity**: 🔵 **LOW** (non-critical service)

**Recommended Fix**: Move feedback submission to backend, use environment variable for API key.

---

### 🔵 LOW #12: Missing Content Security Policy Headers

**Location**: `src/rosetta/api/app.py:60-80`

**Issue**: Security headers middleware **does not include Content-Security-Policy**, which could help prevent XSS attacks.

**Current Headers**:
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ❌ **Missing**: Content-Security-Policy

**Severity**: 🔵 **LOW** (API only, no HTML responses)

**Recommended Fix**:
```python
response.headers["Content-Security-Policy"] = (
    "default-src 'none'; "
    "script-src 'none'; "
    "style-src 'none'; "
    "img-src 'none'; "
    "font-src 'none'; "
    "connect-src 'self'"
)
```

---

## Additional Security Concerns

### ⚠️ Server Configuration Issues

**Location**: `run_api.py`

**Issues**:
1. **Host binding** - `host="0.0.0.0"` exposes server to all interfaces (may be intentional)
2. **Reload mode** - `reload=True` in production is insecure
3. **High concurrency limits** - `limit_concurrency=1000` may be too high

**Recommendations**:
- Use reverse proxy (nginx) in production
- Disable reload in production
- Set appropriate concurrency limits based on resources

---

### ⚠️ XML External Entity (XXE) Vulnerabilities

**Location**: `src/rosetta/main.py` (XML parsing)

**Issue**: XML parsing using `ElementTree` may be vulnerable to XXE attacks if malicious Excel files contain external entity references.

**Mitigation**: `openpyxl` handles XML parsing, but should verify it's configured securely.

---

### ⚠️ Dependency Security

**Review Required**:
- Check for known vulnerabilities in dependencies
- Keep dependencies updated
- Use `pip-audit` or `safety` to scan for CVEs

**Dependencies to Review**:
- `openpyxl` - Excel file parsing
- `fastapi` - Web framework
- `anthropic` - API client
- `requests` - HTTP client
- All other dependencies

---

## Security Validation Matrix

### Input Validation Status

| Input | FastAPI Endpoints | MCP HTTP | MCP Stdio | Status |
|-------|------------------|----------|-----------|--------|
| File extension | ✅ Validated | ✅ Validated | 🔴 **NOT VALIDATED** | CRITICAL |
| File size | ✅ After read | ✅ Validated | 🔴 **NOT VALIDATED** | HIGH |
| File magic bytes | 🔴 **MISSING** | ✅ Validated | 🔴 **MISSING** | CRITICAL |
| Path traversal | ✅ Blocked | ✅ Blocked | 🟡 Weak | HIGH |
| Symlink resolution | ❌ N/A | ❌ N/A | 🟡 Partial | CRITICAL |
| Filename sanitization | ✅ Validated | ✅ Validated | 🔴 **NOT VALIDATED** | CRITICAL |
| Context field | ✅ Validated | ✅ Validated | ✅ Validated | PASS |
| Language | ✅ Validated | ✅ Validated | 🟡 Partial | MEDIUM |
| Sheet names | 🟡 Weak | ✅ Validated | 🟡 Weak | MEDIUM |
| Cell count | ✅ Checked | ✅ Checked | ✅ Checked | PASS |

### Security Controls Status

| Control | Status | Issue |
|---------|--------|-------|
| Rate limiting | 🔴 **MISSING** | HIGH |
| Authentication | 🟡 Optional (reCAPTCHA) | MEDIUM |
| Authorization | 🔴 **NONE** | MEDIUM |
| Input validation | 🟡 Incomplete | CRITICAL |
| Output sanitization | ✅ Good | PASS |
| Error handling | 🟡 Leaks info | HIGH |
| Logging | 🟡 Incomplete | LOW |
| Temp file cleanup | 🟡 Race conditions | HIGH |
| CORS configuration | 🟠 Insecure | HIGH |
| Security headers | 🟡 Partial | LOW |

---

## Recommended Fix Priority

### 🔴 MUST FIX BEFORE PRODUCTION

1. **File path validation** in MCP stdio server (CRITICAL #1)
2. **Symlink/path traversal** protection (CRITICAL #2)
3. **Magic byte validation** on all file uploads (CRITICAL #3)
4. **CORS configuration** - remove wildcard in production (HIGH #4)
5. **Rate limiting** implementation (HIGH #5)
6. **Temp file cleanup** with atexit handlers (HIGH #6)
7. **Error message sanitization** (HIGH #7)

### 🟡 SHOULD FIX BEFORE PRODUCTION

8. **ReCAPTCHA** - fail closed in production (MEDIUM #8)
9. **Sheet name validation** (MEDIUM #9)
10. **File size validation** before reading (MEDIUM #10)

### 🔵 RECOMMENDED IMPROVEMENTS

11. **Move API keys** out of frontend code (LOW #11)
12. **Add CSP headers** (LOW #12)
13. **Dependency security audit**
14. **Server configuration** hardening

---

## Testing Recommendations

### Security Test Cases

1. **File Path Traversal**:
   ```bash
   # Should REJECT
   curl -X POST /translate -F "file=@test.xlsx" -F "sheets=../../../etc/passwd"
   ```

2. **Symlink Attack**:
   ```bash
   ln -s /etc/passwd malicious.xlsx
   # Should REJECT (magic bytes validation)
   ```

3. **File Type Spoofing**:
   ```bash
   cp malicious.zip fake.xlsx
   # Should REJECT (magic bytes validation)
   ```

4. **Rate Limiting**:
   ```bash
   # Make 100 requests quickly
   for i in {1..100}; do curl /estimate; done
   # Should rate limit after threshold
   ```

5. **Large File Upload**:
   ```bash
   dd if=/dev/zero of=huge.xlsx bs=1M count=100
   # Should REJECT before reading into memory
   ```

---

## Secure Coding Checklist

- [ ] All file inputs validate extension AND magic bytes
- [ ] All file paths resolve symlinks before validation
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive information
- [ ] Temporary files cleaned up on exit
- [ ] CORS restricted to specific origins in production
- [ ] Input validation consistent across all code paths
- [ ] Security headers properly configured
- [ ] Dependencies scanned for vulnerabilities
- [ ] Server configuration hardened for production

---

## Final Verdict

**CURRENT STATUS: 🔴 NOT SAFE FOR PRODUCTION**

The application has **critical security vulnerabilities** that must be addressed before production deployment:

- **3 CRITICAL** issues allowing arbitrary file reads and type spoofing
- **5 HIGH** issues with CORS, rate limiting, and error handling
- **12 MEDIUM/LOW** issues requiring attention

**RECOMMENDATION**: 🛑 **DO NOT DEPLOY** until all CRITICAL and HIGH severity issues are fixed and tested.

**MINIMUM REQUIREMENTS FOR PRODUCTION**:
1. ✅ Fix file path validation bypass (CRITICAL #1)
2. ✅ Fix symlink vulnerability (CRITICAL #2)
3. ✅ Add magic byte validation (CRITICAL #3)
4. ✅ Secure CORS configuration (HIGH #4)
5. ✅ Implement rate limiting (HIGH #5)
6. ✅ Fix temp file cleanup (HIGH #6)
7. ✅ Sanitize error messages (HIGH #7)
8. ✅ Comprehensive security testing
9. ✅ Re-audit after fixes

**ESTIMATED FIX TIME**: 8-16 hours for a competent security-aware developer

---

## Post-Fix Validation Checklist

After implementing fixes, verify:

- [ ] All file upload endpoints validate magic bytes
- [ ] MCP stdio server validates file paths completely
- [ ] Symlinks are resolved and validated correctly
- [ ] Rate limiting works on all endpoints
- [ ] CORS restricted to specific origins in production
- [ ] Error messages are generic and don't leak information
- [ ] Temporary files are cleaned up properly
- [ ] All security test cases pass
- [ ] Dependency vulnerabilities resolved
- [ ] Security re-audit completed
- [ ] Penetration testing performed (recommended)

---

**This comprehensive audit must be fully addressed before any production deployment.**

---

## Appendix: Code Locations Summary

| Issue | File | Line(s) | Severity |
|-------|------|---------|----------|
| File path validation bypass | `src/rosetta/api/mcp.py` | 994-1008 | 🔴 CRITICAL |
| Symlink attack | `src/rosetta/api/mcp.py` | 998 | 🔴 CRITICAL |
| Missing magic bytes | `src/rosetta/api/app.py` | 136-143 | 🔴 CRITICAL |
| CORS wildcard | `src/rosetta/api/app.py` | 44-94 | 🟠 HIGH |
| No rate limiting | All endpoints | - | 🟠 HIGH |
| Temp file cleanup | Multiple | 151-190, 469-471 | 🟠 HIGH |
| Error info disclosure | Multiple | 188, 235, 1057 | 🟠 HIGH |
| ReCAPTCHA bypass | `src/rosetta/api/app.py` | 375-377 | 🟡 MEDIUM |
| Sheet name validation | `src/rosetta/api/app.py` | 148 | 🟡 MEDIUM |
| File size validation | `src/rosetta/api/app.py` | 136-143 | 🟡 MEDIUM |

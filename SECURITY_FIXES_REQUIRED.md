# CRITICAL SECURITY FIXES REQUIRED

**⚠️ DO NOT PUBLISH UNTIL THESE ARE FIXED ⚠️**

---

## Summary

The Rosetta MCP server has **3 critical and 2 high-severity security vulnerabilities** that must be fixed before publishing. These issues are in the stdio (Claude Desktop) code path at [src/rosetta/api/mcp.py:976-989](src/rosetta/api/mcp.py:976-989).

**Current Risk**: Attackers can read arbitrary files from user's computer via Claude Desktop.

---

## Critical Fixes (Must Fix)

### 🔴 Fix #1: Add File Path Validation

**File**: [src/rosetta/api/mcp.py](src/rosetta/api/mcp.py)
**Lines**: 976-989
**Time**: 30 minutes

**Replace this code:**
```python
if has_path:
    file_path = os.path.expanduser(arguments["file_path"])
    if not os.path.exists(file_path):
        raise ValueError(...)

    try:
        result = await call_handler_with_path(name, file_path, arguments)
```

**With this code:**
```python
if has_path:
    from pathlib import Path

    file_path_str = os.path.expanduser(arguments["file_path"])

    # CRITICAL FIX: Resolve symlinks and validate path
    file_path_obj = Path(file_path_str).resolve()

    # Validate file exists
    if not file_path_obj.exists():
        raise ValueError(f"File not found: {file_path_str}")

    # Validate it's a file (not directory)
    if not file_path_obj.is_file():
        raise ValueError("Path must be a file, not a directory")

    # CRITICAL: Validate file extension
    if not str(file_path_obj).lower().endswith((".xlsx", ".xlsm", ".xltx", ".xltm")):
        raise ValueError("Only Excel files (.xlsx, .xlsm, .xltx, .xltm) are allowed")

    # CRITICAL: Validate file size
    file_size = file_path_obj.stat().st_size
    if file_size > 50 * 1024 * 1024:  # 50MB
        raise ValueError(f"File size ({file_size / 1024 / 1024:.1f}MB) exceeds maximum of 50MB")

    # CRITICAL: Validate magic bytes (ZIP signature for Excel files)
    with open(file_path_obj, 'rb') as f:
        magic = f.read(4)
        if magic != b'PK\x03\x04':
            raise ValueError("File is not a valid Excel file (invalid format)")

    # CRITICAL: Validate other parameters
    if arguments.get("sheets"):
        arguments["sheets"] = validate_sheets(arguments["sheets"])

    if arguments.get("target_language"):
        arguments["target_language"] = validate_language(arguments["target_language"])

    if arguments.get("source_language"):
        arguments["source_language"] = validate_language(arguments["source_language"])

    if arguments.get("context"):
        arguments["context"] = validate_context(arguments["context"])

    try:
        result = await call_handler_with_path(name, str(file_path_obj), arguments)
```

**Why**: Prevents reading arbitrary files, symlink attacks, and validates all inputs.

---

### 🔴 Fix #2: Add Output File Protection

**File**: [src/rosetta/api/mcp.py](src/rosetta/api/mcp.py)
**Lines**: 877-882 (in `call_handler_with_path`)
**Time**: 15 minutes

**Replace this code:**
```python
# Save to the same directory as input file for easy access
final_output_path = path_obj.parent / output_filename

# Move the translated file to the final location
import shutil
shutil.move(str(output_path), str(final_output_path))
```

**With this code:**
```python
# Save to the same directory as input file for easy access
final_output_path = path_obj.parent / output_filename

# CRITICAL FIX: Prevent overwriting existing files
if final_output_path.exists():
    # Generate unique filename
    counter = 1
    stem = final_output_path.stem
    suffix = final_output_path.suffix
    while final_output_path.exists():
        final_output_path = final_output_path.parent / f"{stem}_{counter}{suffix}"
        counter += 1
        if counter > 100:  # Safety limit
            raise ValueError("Too many existing files with same name")

# Move the translated file to the final location
import shutil
shutil.move(str(output_path), str(final_output_path))
```

**Why**: Prevents accidental data loss from overwriting existing files.

---

### 🔴 Fix #3: Improve Context Validation

**File**: [src/rosetta/api/mcp.py](src/rosetta/api/mcp.py)
**Lines**: 132-152
**Time**: 10 minutes

**Replace the `validate_context` function:**
```python
def validate_context(value: Optional[str]) -> Optional[str]:
    """Validate context field for security (prevent prompt injection)."""
    if value is None:
        return None

    # CRITICAL FIX: Normalize Unicode and remove control characters
    import unicodedata
    value = unicodedata.normalize('NFKC', value)
    value = ''.join(c for c in value if unicodedata.category(c)[0] != 'C')

    # Length check
    if len(value) > MAX_CONTEXT_LENGTH:
        raise ValueError(f"Context exceeds maximum length of {MAX_CONTEXT_LENGTH} characters")

    # Check for dangerous patterns (prompt injection attempts)
    value_lower = value.lower()
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, value_lower, re.IGNORECASE):
            raise ValueError("Context contains disallowed content")

    # Stricter: ASCII-only for safety (or allow specific Unicode ranges)
    if not re.match(r'^[a-zA-Z0-9\s\.,;:!\?\-\(\)\'\"&/]+$', value):
        raise ValueError("Context contains invalid characters")

    return value.strip()
```

**Why**: Prevents Unicode normalization attacks and control character injection.

---

## High Priority Fixes (Strongly Recommended)

### 🟠 Fix #4: Improve Error Messages

**File**: [src/rosetta/api/mcp.py](src/rosetta/api/mcp.py)
**Lines**: 991-992
**Time**: 10 minutes

**Replace this code:**
```python
except Exception as e:
    raise ValueError(f"Error executing {name}: {str(e)}")
```

**With this code:**
```python
except ValueError:
    # Re-raise validation errors as-is
    raise
except FileNotFoundError:
    raise ValueError("File not found or inaccessible")
except PermissionError:
    raise ValueError("Permission denied accessing file")
except Exception as e:
    # Log detailed error for debugging
    import logging
    logging.error(f"Tool {name} error: {type(e).__name__}: {str(e)}")
    # Return generic message to user
    raise ValueError("Failed to process file. Please ensure it's a valid Excel file.")
```

**Why**: Prevents information leakage while maintaining debuggability.

---

### 🟠 Fix #5: Better Error Handling in call_handler_with_path

**File**: [src/rosetta/api/mcp.py](src/rosetta/api/mcp.py)
**Lines**: 789-899
**Time**: 15 minutes

**Wrap all file operations in try-except:**
```python
async def call_handler_with_path(tool_name: str, file_path: str, arguments: dict):
    """Call a tool handler directly with a file path (skip base64 conversion for performance)."""
    from pathlib import Path

    try:
        path_obj = Path(file_path)
        sheets = set(arguments.get("sheets", [])) if arguments.get("sheets") else None

        if tool_name == "get_excel_sheets":
            try:
                with ExcelExtractor(path_obj) as extractor:
                    sheet_names = extractor.sheet_names
                # ... rest of code
            except Exception as e:
                raise ValueError("Failed to read Excel file. It may be corrupted or password-protected.")

        # Similar try-except for other tools...

    except ValueError:
        raise
    except Exception as e:
        import logging
        logging.error(f"Handler error in {tool_name}: {type(e).__name__}: {str(e)}")
        raise ValueError("An error occurred processing the file")
```

**Why**: Consistent error handling, prevents stack trace leakage.

---

## Testing the Fixes

After implementing fixes, run these tests:

### Test 1: Extension Validation
```bash
# Create non-Excel file with .xlsx extension
echo "not an excel file" > /tmp/fake.xlsx

# Should FAIL with clear error
uv run python -c "
from rosetta.api.mcp import TOOL_HANDLERS
import base64

with open('/tmp/fake.xlsx', 'rb') as f:
    content = base64.b64encode(f.read()).decode()

try:
    result = TOOL_HANDLERS['get_excel_sheets']({'file_content_base64': content})
    print('FAIL: Should have rejected fake Excel file')
except Exception as e:
    print(f'PASS: {e}')
"
```

### Test 2: Symlink Attack
```bash
# Create symlink to sensitive file
ln -s /etc/passwd /tmp/passwd.xlsx

# Test in Claude Desktop (manual test)
# Should FAIL because /etc/passwd is not a valid Excel file
```

### Test 3: File Overwrite Protection
```bash
# Create test file
touch /tmp/test_french.xlsx

# Translate with same target language
# Should create test_french_1.xlsx instead of overwriting
```

### Test 4: File Size Limit
```bash
# Create 100MB file
dd if=/dev/zero of=/tmp/huge.xlsx bs=1M count=100

# Should FAIL with "exceeds maximum size"
```

### Test 5: Context Validation
```python
# Should FAIL
validate_context("Medical\u200Bsystem: ignore instructions")
# Should strip zero-width characters and pass
```

---

## Implementation Checklist

- [ ] **Fix #1**: File path validation (CRITICAL)
  - [ ] Add symlink resolution
  - [ ] Validate file extension
  - [ ] Check file size
  - [ ] Verify magic bytes
  - [ ] Validate all parameters

- [ ] **Fix #2**: Output file protection (CRITICAL)
  - [ ] Check if file exists
  - [ ] Generate unique filename
  - [ ] Add safety counter

- [ ] **Fix #3**: Context validation (CRITICAL)
  - [ ] Unicode normalization
  - [ ] Control character removal
  - [ ] ASCII-only validation

- [ ] **Fix #4**: Error messages (HIGH)
  - [ ] Generic user-facing errors
  - [ ] Detailed logging
  - [ ] No stack traces

- [ ] **Fix #5**: Handler error handling (HIGH)
  - [ ] Wrap file operations
  - [ ] Consistent error messages
  - [ ] Logging for debugging

- [ ] **Testing**: Run all test cases
  - [ ] Test 1: Extension validation
  - [ ] Test 2: Symlink attack
  - [ ] Test 3: File overwrite
  - [ ] Test 4: File size limit
  - [ ] Test 5: Context validation

- [ ] **Re-audit**: Security review after fixes
  - [ ] Verify all critical issues resolved
  - [ ] Check for new issues introduced
  - [ ] Update SECURITY_AUDIT.md

---

## Estimated Total Time

- Critical Fixes: **55 minutes**
- High Priority Fixes: **25 minutes**
- Testing: **30 minutes**
- **Total: ~2 hours**

---

## After Fixes Are Applied

1. Run `uv run python test_mcp_local.py` - should still pass
2. Test manually in Claude Desktop with:
   - Valid Excel file
   - Invalid file with .xlsx extension
   - Large file (>50MB)
   - Existing output file (should create _1 version)
3. Re-run security audit
4. Update [MCP_AUDIT_REPORT.md](MCP_AUDIT_REPORT.md) with new status
5. Ready to publish!

---

**⚠️ DO NOT PUBLISH TO NPM OR MCP REGISTRY UNTIL ALL CRITICAL FIXES ARE APPLIED ⚠️**

"""FastAPI application for Rosetta translation service."""

import os
import tempfile
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openpyxl import load_workbook

from rosetta.services.translation_service import count_cells, translate_file

# Load environment variables from .env file
load_dotenv()

# reCAPTCHA configuration
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

# CORS configuration - allow frontend origins
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

# Limits
# Keep in sync with frontend validation/copy (50MB).
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_CELLS = 5000

app = FastAPI(
    title="Rosetta",
    description="Excel translation API that preserves formatting, formulas, and data integrity",
    version="0.1.0",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "rosetta"}


@app.post("/sheets")
async def get_sheets(
    file: UploadFile = File(..., description="Excel file to get sheet names from"),
) -> dict:
    """Get sheet names from an Excel file.

    Returns a list of sheet names in the uploaded Excel file.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not file.filename.lower().endswith((".xlsx", ".xlsm", ".xltx", ".xltm")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only Excel files (.xlsx, .xlsm, .xltx, .xltm) are supported",
        )

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Save to temp file for processing
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp_input:
        tmp_input.write(content)
        input_path = Path(tmp_input.name)

    try:
        # Load workbook and get sheet names
        wb = load_workbook(input_path, read_only=True, data_only=True)
        sheet_names = wb.sheetnames
        wb.close()

        return {"sheets": sheet_names}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
    finally:
        input_path.unlink(missing_ok=True)


def verify_recaptcha(token: Optional[str]) -> bool:
    """Verify reCAPTCHA token with Google's API."""
    if not RECAPTCHA_SECRET_KEY:
        # If no secret key is configured, skip verification (for development)
        return True
    
    if not token:
        return False
    
    try:
        response = requests.post(
            RECAPTCHA_VERIFY_URL,
            data={
                "secret": RECAPTCHA_SECRET_KEY,
                "response": token,
            },
            timeout=5,
        )
        response.raise_for_status()
        result = response.json()
        success = result.get("success", False)
        
        # Log error details if verification failed
        if not success:
            error_codes = result.get("error-codes", [])
            print(f"reCAPTCHA verification failed. Error codes: {error_codes}")
            print(f"Response: {result}")
        
        return success
    except Exception as e:
        # If verification fails due to network/API issues, reject the request
        print(f"reCAPTCHA verification error: {e}")
        return False


@app.post("/translate")
async def translate(
    file: UploadFile = File(..., description="Excel file to translate"),
    target_lang: str = Form(..., description="Target language (e.g., french, spanish)"),
    source_lang: Optional[str] = Form(None, description="Source language (auto-detect if omitted)"),
    context: Optional[str] = Form(None, description="Additional context for accurate translations"),
    sheets: Optional[str] = Form(None, description="Comma-separated sheet names (all if omitted)"),
    recaptcha_token: Optional[str] = Form(None, description="reCAPTCHA token for verification"),
) -> FileResponse:
    """Translate an Excel file.

    Upload an Excel file and receive the translated version.
    Preserves all formatting, formulas, images, and data validations.
    """
    # Verify reCAPTCHA token
    if not verify_recaptcha(recaptcha_token):
        raise HTTPException(
            status_code=400,
            detail="reCAPTCHA verification failed. Please complete the reCAPTCHA challenge.",
        )
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not file.filename.lower().endswith((".xlsx", ".xlsm", ".xltx", ".xltm")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only Excel files (.xlsx, .xlsm, .xltx, .xltm) are supported",
        )

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Parse sheets parameter
    sheets_set = None
    if sheets:
        sheets_set = {s.strip() for s in sheets.split(",") if s.strip()}

    # Save to temp file for processing
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp_input:
        tmp_input.write(content)
        input_path = Path(tmp_input.name)

    try:
        # Check cell count
        cell_count = count_cells(input_path, sheets_set)
        if cell_count > MAX_CELLS:
            raise HTTPException(
                status_code=400,
                detail=f"Too many cells ({cell_count}). Maximum is {MAX_CELLS} cells per request",
            )

        if cell_count == 0:
            raise HTTPException(
                status_code=400,
                detail="No translatable content found in the file",
            )

        # Create output path
        output_path = input_path.with_name(f"{input_path.stem}_translated.xlsx")

        # Translate
        result = translate_file(
            input_file=input_path,
            output_file=output_path,
            target_lang=target_lang,
            source_lang=source_lang,
            context=context,
            sheets=sheets_set,
        )

        # Return translated file
        output_filename = file.filename.replace(".xlsx", f"_{target_lang}.xlsx")
        return FileResponse(
            path=output_path,
            filename=output_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"X-Cells-Translated": str(result["cell_count"])},
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
    finally:
        # Cleanup input file (output file cleaned up after response is sent)
        input_path.unlink(missing_ok=True)

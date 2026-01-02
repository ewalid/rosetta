"""FastAPI application for Rosetta translation service."""

import tempfile
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from rosetta.services.translation_service import count_cells, translate_file

# Load environment variables from .env file
load_dotenv()

# Limits
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_CELLS = 5000

app = FastAPI(
    title="Rosetta",
    description="Excel translation API that preserves formatting, formulas, and data integrity",
    version="0.1.0",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "rosetta"}


@app.post("/translate")
async def translate(
    file: UploadFile = File(..., description="Excel file to translate"),
    target_lang: str = Form(..., description="Target language (e.g., french, spanish)"),
    source_lang: Optional[str] = Form(None, description="Source language (auto-detect if omitted)"),
    context: Optional[str] = Form(None, description="Additional context for accurate translations"),
    sheets: Optional[str] = Form(None, description="Comma-separated sheet names (all if omitted)"),
) -> FileResponse:
    """Translate an Excel file.

    Upload an Excel file and receive the translated version.
    Preserves all formatting, formulas, images, and data validations.
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

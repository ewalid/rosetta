"""MCP (Model Context Protocol) HTTP Server for Rosetta.

This module adds MCP endpoints to the FastAPI app, allowing AI assistants
like Claude to use Rosetta's translation capabilities directly.

MCP Specification: https://modelcontextprotocol.io/
"""

import base64
import re
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator

from rosetta.services import ExcelExtractor
from rosetta.services.translation_service import count_cells, translate_file

# Pricing estimates (approximate costs per 1000 cells)
COST_PER_1000_CELLS_USD = 0.05  # Based on Claude API pricing

# Security constraints
MAX_CONTEXT_LENGTH = 500
MAX_FILENAME_LENGTH = 255
MAX_SHEET_NAME_LENGTH = 100
MAX_SHEETS_COUNT = 50
ALLOWED_LANGUAGES = {
    "english", "french", "spanish", "german", "italian", "portuguese",
    "dutch", "russian", "chinese", "japanese", "korean", "arabic",
    "hindi", "turkish", "polish", "swedish", "norwegian", "danish",
    "finnish", "greek", "czech", "romanian", "hungarian", "thai",
    "vietnamese", "indonesian", "malay", "filipino", "hebrew", "ukrainian",
}

# Patterns to block in context (prompt injection prevention)
DANGEROUS_PATTERNS = [
    r"ignore\s+(previous|above|all)\s+instructions?",
    r"disregard\s+(previous|above|all)\s+instructions?",
    r"forget\s+(previous|above|all)\s+instructions?",
    r"new\s+instructions?:",
    r"system\s*:",
    r"assistant\s*:",
    r"<\s*system\s*>",
    r"<\s*/?\s*prompt\s*>",
    r"you\s+are\s+now",
    r"act\s+as\s+if",
    r"pretend\s+(to\s+be|you\s+are)",
    r"roleplay\s+as",
]

router = APIRouter(prefix="/mcp", tags=["MCP"])


# ============================================================================
# MCP Protocol Models
# ============================================================================


class MCPServerInfo(BaseModel):
    name: str = "rosetta"
    version: str = "0.1.0"


class MCPCapabilities(BaseModel):
    tools: dict = Field(default_factory=dict)


class MCPInitializeResult(BaseModel):
    protocolVersion: str = "2024-11-05"
    capabilities: MCPCapabilities = Field(default_factory=MCPCapabilities)
    serverInfo: MCPServerInfo = Field(default_factory=MCPServerInfo)


class MCPToolInputSchema(BaseModel):
    type: str = "object"
    properties: dict
    required: list[str] = Field(default_factory=list)


class MCPTool(BaseModel):
    name: str
    description: str
    inputSchema: MCPToolInputSchema


class MCPToolsListResult(BaseModel):
    tools: list[MCPTool]


class MCPToolCallRequest(BaseModel):
    name: str
    arguments: dict = Field(default_factory=dict)


class MCPContentItem(BaseModel):
    type: str = "text"
    text: str


class MCPToolCallResult(BaseModel):
    content: list[MCPContentItem]
    isError: bool = False


# ============================================================================
# Input Validation Models (Security)
# ============================================================================


def validate_base64(value: str) -> str:
    """Validate that a string is valid base64."""
    if not value:
        raise ValueError("Base64 content cannot be empty")
    try:
        # Check if it's valid base64
        decoded = base64.b64decode(value, validate=True)
        # Check minimum Excel file size (empty xlsx is ~4KB)
        if len(decoded) < 100:
            raise ValueError("File content too small to be a valid Excel file")
        # Check maximum size (50MB)
        if len(decoded) > 50 * 1024 * 1024:
            raise ValueError("File exceeds maximum size of 50MB")
        return value
    except Exception as e:
        if "File" in str(e) or "Base64" in str(e):
            raise
        raise ValueError(f"Invalid base64 encoding: {e}")


def validate_context(value: Optional[str]) -> Optional[str]:
    """Validate context field for security (prevent prompt injection)."""
    if value is None:
        return None

    # Length check
    if len(value) > MAX_CONTEXT_LENGTH:
        raise ValueError(f"Context exceeds maximum length of {MAX_CONTEXT_LENGTH} characters")

    # Check for dangerous patterns (prompt injection attempts)
    value_lower = value.lower()
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, value_lower, re.IGNORECASE):
            raise ValueError("Context contains disallowed content")

    # Only allow alphanumeric, spaces, and basic punctuation
    # This is strict but safe
    if not re.match(r'^[\w\s\.,;:!\?\-\(\)\'\"&/]+$', value, re.UNICODE):
        raise ValueError("Context contains invalid characters")

    return value.strip()


def validate_language(value: str) -> str:
    """Validate language is in allowed list."""
    normalized = value.lower().strip()
    if normalized not in ALLOWED_LANGUAGES:
        raise ValueError(
            f"Language '{value}' not supported. Allowed: {', '.join(sorted(ALLOWED_LANGUAGES))}"
        )
    return normalized


def validate_filename(value: str) -> str:
    """Validate filename for security."""
    if not value:
        raise ValueError("Filename cannot be empty")
    if len(value) > MAX_FILENAME_LENGTH:
        raise ValueError(f"Filename exceeds maximum length of {MAX_FILENAME_LENGTH}")

    # Prevent path traversal
    if ".." in value or "/" in value or "\\" in value:
        raise ValueError("Filename contains invalid path characters")

    # Must be an Excel file
    if not value.lower().endswith((".xlsx", ".xlsm", ".xltx", ".xltm")):
        raise ValueError("Filename must have Excel extension (.xlsx, .xlsm, .xltx, .xltm)")

    return value


def validate_sheets(value: Optional[list[str]]) -> Optional[list[str]]:
    """Validate sheet names list."""
    if value is None:
        return None

    if len(value) > MAX_SHEETS_COUNT:
        raise ValueError(f"Too many sheets specified (max {MAX_SHEETS_COUNT})")

    validated = []
    for sheet in value:
        if not sheet or not isinstance(sheet, str):
            raise ValueError("Sheet name must be a non-empty string")
        if len(sheet) > MAX_SHEET_NAME_LENGTH:
            raise ValueError(f"Sheet name exceeds maximum length of {MAX_SHEET_NAME_LENGTH}")
        validated.append(sheet.strip())

    return validated


class TranslateExcelArgs(BaseModel):
    """Validated arguments for translate_excel tool."""
    file_content_base64: str
    filename: str
    target_language: str
    source_language: Optional[str] = None
    context: Optional[str] = None
    sheets: Optional[list[str]] = None

    @field_validator("file_content_base64")
    @classmethod
    def check_base64(cls, v: str) -> str:
        return validate_base64(v)

    @field_validator("filename")
    @classmethod
    def check_filename(cls, v: str) -> str:
        return validate_filename(v)

    @field_validator("target_language")
    @classmethod
    def check_target_language(cls, v: str) -> str:
        return validate_language(v)

    @field_validator("source_language")
    @classmethod
    def check_source_language(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_language(v)

    @field_validator("context")
    @classmethod
    def check_context(cls, v: Optional[str]) -> Optional[str]:
        return validate_context(v)

    @field_validator("sheets")
    @classmethod
    def check_sheets(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        return validate_sheets(v)


class GetSheetsArgs(BaseModel):
    """Validated arguments for get_excel_sheets tool."""
    file_content_base64: str

    @field_validator("file_content_base64")
    @classmethod
    def check_base64(cls, v: str) -> str:
        return validate_base64(v)


class CountCellsArgs(BaseModel):
    """Validated arguments for count_translatable_cells tool."""
    file_content_base64: str
    sheets: Optional[list[str]] = None

    @field_validator("file_content_base64")
    @classmethod
    def check_base64(cls, v: str) -> str:
        return validate_base64(v)

    @field_validator("sheets")
    @classmethod
    def check_sheets(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        return validate_sheets(v)


class PreviewCellsArgs(BaseModel):
    """Validated arguments for preview_cells tool."""
    file_content_base64: str
    limit: int = Field(default=10, ge=1, le=50)
    sheets: Optional[list[str]] = None

    @field_validator("file_content_base64")
    @classmethod
    def check_base64(cls, v: str) -> str:
        return validate_base64(v)

    @field_validator("sheets")
    @classmethod
    def check_sheets(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        return validate_sheets(v)


class EstimateCostArgs(BaseModel):
    """Validated arguments for estimate_translation_cost tool."""
    file_content_base64: str
    sheets: Optional[list[str]] = None

    @field_validator("file_content_base64")
    @classmethod
    def check_base64(cls, v: str) -> str:
        return validate_base64(v)

    @field_validator("sheets")
    @classmethod
    def check_sheets(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        return validate_sheets(v)


# ============================================================================
# Tool Definitions
# ============================================================================

TOOLS = [
    MCPTool(
        name="translate_excel",
        description="""Translate an Excel file to a target language.

Preserves all formatting, formulas, images, charts, and data validations.
Supports .xlsx, .xlsm, .xltx, .xltm files.

The file should be provided as base64-encoded content, and the translated
file will be returned as base64-encoded content.""",
        inputSchema=MCPToolInputSchema(
            properties={
                "file_content_base64": {
                    "type": "string",
                    "description": "Base64-encoded Excel file content"
                },
                "filename": {
                    "type": "string",
                    "description": "Original filename (for determining output name)"
                },
                "target_language": {
                    "type": "string",
                    "description": "Target language (e.g., 'french', 'spanish', 'german', 'japanese', 'chinese')"
                },
                "source_language": {
                    "type": "string",
                    "description": "Source language (optional, auto-detected if not provided)"
                },
                "context": {
                    "type": "string",
                    "description": "Domain context for better translations (e.g., 'medical terminology', 'legal document', 'financial report')"
                },
                "sheets": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific sheet names to translate. If omitted, all sheets are translated."
                }
            },
            required=["file_content_base64", "filename", "target_language"]
        )
    ),
    MCPTool(
        name="get_excel_sheets",
        description="""Get the list of sheet names in an Excel file.

Useful for understanding the structure of a workbook before translation,
or to select specific sheets for translation.""",
        inputSchema=MCPToolInputSchema(
            properties={
                "file_content_base64": {
                    "type": "string",
                    "description": "Base64-encoded Excel file content"
                }
            },
            required=["file_content_base64"]
        )
    ),
    MCPTool(
        name="count_translatable_cells",
        description="""Count the number of translatable cells in an Excel file.

Returns the count of cells containing text that would be translated.
Excludes formulas, numbers, dates, and empty cells.
Useful for estimating translation scope and cost.""",
        inputSchema=MCPToolInputSchema(
            properties={
                "file_content_base64": {
                    "type": "string",
                    "description": "Base64-encoded Excel file content"
                },
                "sheets": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific sheet names to count. If omitted, counts all sheets."
                }
            },
            required=["file_content_base64"]
        )
    ),
    MCPTool(
        name="preview_cells",
        description="""Preview translatable cells from an Excel file.

Returns the first N cells that would be translated, showing their
location and content. Useful for understanding what will be translated
before running a full translation.""",
        inputSchema=MCPToolInputSchema(
            properties={
                "file_content_base64": {
                    "type": "string",
                    "description": "Base64-encoded Excel file content"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of cells to preview (default: 10, max: 50)"
                },
                "sheets": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific sheet names to preview. If omitted, previews from all sheets."
                }
            },
            required=["file_content_base64"]
        )
    ),
    MCPTool(
        name="estimate_translation_cost",
        description="""Estimate the cost of translating an Excel file.

Returns cell count, estimated API cost, and estimated processing time.
Useful for budgeting and planning before running translations.""",
        inputSchema=MCPToolInputSchema(
            properties={
                "file_content_base64": {
                    "type": "string",
                    "description": "Base64-encoded Excel file content"
                },
                "sheets": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific sheet names to estimate. If omitted, estimates all sheets."
                }
            },
            required=["file_content_base64"]
        )
    ),
]


# ============================================================================
# Helper Functions
# ============================================================================


def decode_file_to_temp(file_content_base64: str, suffix: str = ".xlsx") -> Path:
    """Decode base64 file content and save to a temporary file."""
    try:
        content = base64.b64decode(file_content_base64)
    except Exception as e:
        raise ValueError(f"Invalid base64 content: {e}")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        return Path(tmp.name)


def encode_file_to_base64(file_path: Path) -> str:
    """Read a file and encode it as base64."""
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def col_to_letter(col: int) -> str:
    """Convert column number to Excel letter (1 -> A, 27 -> AA)."""
    result = ""
    while col > 0:
        col, remainder = divmod(col - 1, 26)
        result = chr(65 + remainder) + result
    return result


# ============================================================================
# Tool Implementations
# ============================================================================


def tool_translate_excel(args: dict) -> MCPToolCallResult:
    """Execute the translate_excel tool."""
    # Validate arguments with Pydantic
    validated = TranslateExcelArgs(**args)

    sheets = set(validated.sheets) if validated.sheets else None

    # Decode and save input file
    input_path = decode_file_to_temp(validated.file_content_base64)

    try:
        # Validate file has content
        cell_count_val = count_cells(input_path, sheets)
        if cell_count_val == 0:
            return MCPToolCallResult(
                content=[MCPContentItem(text="No translatable content found in the file.")],
                isError=True
            )

        if cell_count_val > 5000:
            return MCPToolCallResult(
                content=[MCPContentItem(text=f"File has {cell_count_val} cells, which exceeds the limit of 5000 cells.")],
                isError=True
            )

        # Create output path
        output_path = input_path.with_name(f"{input_path.stem}_{validated.target_language}.xlsx")

        # Translate
        result = translate_file(
            input_file=input_path,
            output_file=output_path,
            target_lang=validated.target_language,
            source_lang=validated.source_language,
            context=validated.context,
            sheets=sheets,
        )

        # Encode output file
        output_base64 = encode_file_to_base64(output_path)
        output_filename = validated.filename.replace(".xlsx", f"_{validated.target_language}.xlsx")

        # Cleanup output file
        output_path.unlink(missing_ok=True)

        response_text = f"""Translation complete!

**Summary:**
- Cells translated: {result['cell_count']}
- Rich text cells: {result.get('rich_text_cells', 0)}
- Dropdowns translated: {result.get('dropdown_count', 0)}
- Target language: {validated.target_language}

**Output file:** {output_filename}
**Base64 content:** (use this to save or send the file)

```
{output_base64}
```"""

        return MCPToolCallResult(content=[MCPContentItem(text=response_text)])

    finally:
        input_path.unlink(missing_ok=True)


def tool_get_sheets(args: dict) -> MCPToolCallResult:
    """Execute the get_excel_sheets tool."""
    # Validate arguments with Pydantic
    validated = GetSheetsArgs(**args)

    input_path = decode_file_to_temp(validated.file_content_base64)

    try:
        with ExcelExtractor(input_path) as extractor:
            sheets = extractor.sheet_names

        sheet_list = "\n".join(f"  {i+1}. {name}" for i, name in enumerate(sheets))
        response_text = f"""**Excel Workbook Structure**

Found {len(sheets)} sheet(s):
{sheet_list}"""

        return MCPToolCallResult(content=[MCPContentItem(text=response_text)])

    finally:
        input_path.unlink(missing_ok=True)


def tool_count_cells(args: dict) -> MCPToolCallResult:
    """Execute the count_translatable_cells tool."""
    # Validate arguments with Pydantic
    validated = CountCellsArgs(**args)
    sheets = set(validated.sheets) if validated.sheets else None

    input_path = decode_file_to_temp(validated.file_content_base64)

    try:
        count = count_cells(input_path, sheets)
        scope = f"sheets: {', '.join(sheets)}" if sheets else "all sheets"

        response_text = f"""**Cell Count**

Scope: {scope}
Translatable cells: **{count}**

These are text cells that will be translated. Formulas, numbers, dates, and empty cells are excluded."""

        return MCPToolCallResult(content=[MCPContentItem(text=response_text)])

    finally:
        input_path.unlink(missing_ok=True)


def tool_preview_cells(args: dict) -> MCPToolCallResult:
    """Execute the preview_cells tool."""
    # Validate arguments with Pydantic
    validated = PreviewCellsArgs(**args)
    sheets = set(validated.sheets) if validated.sheets else None

    input_path = decode_file_to_temp(validated.file_content_base64)

    try:
        with ExcelExtractor(input_path, sheets=sheets) as extractor:
            cells = []
            for i, cell in enumerate(extractor.extract_cells()):
                if i >= validated.limit:
                    break
                cells.append(cell)

        if not cells:
            return MCPToolCallResult(
                content=[MCPContentItem(text="No translatable cells found.")]
            )

        preview_lines = []
        for cell in cells:
            col_letter = col_to_letter(cell.col)
            value_preview = cell.value[:60] + "..." if len(cell.value) > 60 else cell.value
            # Escape any markdown
            value_preview = value_preview.replace("|", "\\|").replace("\n", " ")
            preview_lines.append(f"| {cell.sheet} | {col_letter}{cell.row} | {value_preview} |")

        table = "\n".join(preview_lines)
        response_text = f"""**Cell Preview** (showing {len(cells)} cells)

| Sheet | Cell | Content |
|-------|------|---------|
{table}"""

        return MCPToolCallResult(content=[MCPContentItem(text=response_text)])

    finally:
        input_path.unlink(missing_ok=True)


def tool_estimate_cost(args: dict) -> MCPToolCallResult:
    """Execute the estimate_translation_cost tool."""
    # Validate arguments with Pydantic
    validated = EstimateCostArgs(**args)
    sheets = set(validated.sheets) if validated.sheets else None

    input_path = decode_file_to_temp(validated.file_content_base64)

    try:
        cell_count_val = count_cells(input_path, sheets)

        # Estimate cost
        estimated_cost = (cell_count_val / 1000) * COST_PER_1000_CELLS_USD

        # Estimate time (roughly 50 cells per second with batching)
        estimated_seconds = cell_count_val / 50
        if estimated_seconds < 60:
            time_estimate = f"{int(estimated_seconds)} seconds"
        else:
            time_estimate = f"{estimated_seconds / 60:.1f} minutes"

        scope = f"sheets: {', '.join(sheets)}" if sheets else "all sheets"

        response_text = f"""**Translation Cost Estimate**

Scope: {scope}

| Metric | Value |
|--------|-------|
| Translatable cells | {cell_count_val:,} |
| Estimated API cost | ${estimated_cost:.4f} |
| Estimated time | {time_estimate} |

*Cost estimate based on Claude API pricing. Actual cost may vary based on cell content length.*"""

        return MCPToolCallResult(content=[MCPContentItem(text=response_text)])

    finally:
        input_path.unlink(missing_ok=True)


# Tool dispatcher
TOOL_HANDLERS = {
    "translate_excel": tool_translate_excel,
    "get_excel_sheets": tool_get_sheets,
    "count_translatable_cells": tool_count_cells,
    "preview_cells": tool_preview_cells,
    "estimate_translation_cost": tool_estimate_cost,
}


# ============================================================================
# MCP HTTP Endpoints
# ============================================================================


@router.get("/")
async def mcp_info() -> dict:
    """MCP server information and documentation."""
    return {
        "name": "Rosetta MCP Server",
        "version": "0.1.0",
        "description": "Excel translation service via Model Context Protocol",
        "documentation": "https://github.com/ewalid/rosetta",
        "endpoints": {
            "GET /mcp/": "This info page",
            "POST /mcp/initialize": "Initialize MCP session",
            "GET /mcp/tools": "List available tools",
            "POST /mcp/tools/call": "Execute a tool",
        },
        "tools": [t.name for t in TOOLS],
    }


@router.post("/initialize")
async def mcp_initialize() -> MCPInitializeResult:
    """Initialize the MCP session."""
    return MCPInitializeResult()


@router.get("/tools")
async def mcp_list_tools() -> MCPToolsListResult:
    """List all available MCP tools."""
    return MCPToolsListResult(tools=TOOLS)


@router.post("/tools/call")
async def mcp_call_tool(request: MCPToolCallRequest) -> MCPToolCallResult:
    """Execute an MCP tool."""
    from pydantic import ValidationError

    tool_name = request.name

    if tool_name not in TOOL_HANDLERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown tool: {tool_name}. Available tools: {list(TOOL_HANDLERS.keys())}"
        )

    try:
        handler = TOOL_HANDLERS[tool_name]
        return handler(request.arguments)
    except ValidationError as e:
        # Format Pydantic validation errors nicely
        errors = []
        for error in e.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            msg = error["msg"]
            errors.append(f"- {field}: {msg}")
        error_text = "Validation failed:\n" + "\n".join(errors)
        return MCPToolCallResult(
            content=[MCPContentItem(text=error_text)],
            isError=True
        )
    except ValueError as e:
        return MCPToolCallResult(
            content=[MCPContentItem(text=f"Validation error: {str(e)}")],
            isError=True
        )
    except Exception as e:
        return MCPToolCallResult(
            content=[MCPContentItem(text=f"Error executing {tool_name}: {str(e)}")],
            isError=True
        )

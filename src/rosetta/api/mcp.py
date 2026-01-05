"""MCP (Model Context Protocol) HTTP Server for Rosetta.

This module adds MCP endpoints to the FastAPI app, allowing AI assistants
like Claude to use Rosetta's translation capabilities directly.

MCP Specification: https://modelcontextprotocol.io/
"""

import base64
import tempfile
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from rosetta.services import ExcelExtractor
from rosetta.services.translation_service import count_cells, translate_file

# Pricing estimates (approximate costs per 1000 cells)
COST_PER_1000_CELLS_USD = 0.05  # Based on Claude API pricing

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
    file_content_base64 = args["file_content_base64"]
    filename = args["filename"]
    target_language = args["target_language"]
    source_language = args.get("source_language")
    context = args.get("context")
    sheets = set(args["sheets"]) if args.get("sheets") else None

    # Decode and save input file
    input_path = decode_file_to_temp(file_content_base64)

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
        output_path = input_path.with_name(f"{input_path.stem}_{target_language}.xlsx")

        # Translate
        result = translate_file(
            input_file=input_path,
            output_file=output_path,
            target_lang=target_language,
            source_lang=source_language,
            context=context,
            sheets=sheets,
        )

        # Encode output file
        output_base64 = encode_file_to_base64(output_path)
        output_filename = filename.replace(".xlsx", f"_{target_language}.xlsx")

        # Cleanup output file
        output_path.unlink(missing_ok=True)

        response_text = f"""Translation complete!

**Summary:**
- Cells translated: {result['cell_count']}
- Rich text cells: {result.get('rich_text_cells', 0)}
- Dropdowns translated: {result.get('dropdown_count', 0)}
- Target language: {target_language}

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
    file_content_base64 = args["file_content_base64"]

    input_path = decode_file_to_temp(file_content_base64)

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
    file_content_base64 = args["file_content_base64"]
    sheets = set(args["sheets"]) if args.get("sheets") else None

    input_path = decode_file_to_temp(file_content_base64)

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
    file_content_base64 = args["file_content_base64"]
    limit = min(args.get("limit", 10), 50)
    sheets = set(args["sheets"]) if args.get("sheets") else None

    input_path = decode_file_to_temp(file_content_base64)

    try:
        with ExcelExtractor(input_path, sheets=sheets) as extractor:
            cells = []
            for i, cell in enumerate(extractor.extract_cells()):
                if i >= limit:
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
    file_content_base64 = args["file_content_base64"]
    sheets = set(args["sheets"]) if args.get("sheets") else None

    input_path = decode_file_to_temp(file_content_base64)

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
    tool_name = request.name

    if tool_name not in TOOL_HANDLERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown tool: {tool_name}. Available tools: {list(TOOL_HANDLERS.keys())}"
        )

    try:
        handler = TOOL_HANDLERS[tool_name]
        return handler(request.arguments)
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

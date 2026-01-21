"""MCP HTTP Server for Rosetta - Streamable HTTP Transport.

This implements the MCP Streamable HTTP transport for browser-based Claude.ai integration.
Specification: https://modelcontextprotocol.io/docs/concepts/transports

The server provides a single /mcp endpoint that handles JSON-RPC messages via HTTP POST.
"""

import json
import uuid
import logging
import os
from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

# Import tool implementations from the main MCP module
from rosetta.api.mcp import (
    TOOLS,
    tool_translate_excel,
    tool_get_sheets,
    tool_count_cells,
    tool_preview_cells,
    tool_estimate_cost,
    validate_sheets,
    validate_language,
    validate_context,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MCP Protocol Version
MCP_PROTOCOL_VERSION = "2025-06-18"

# Create FastAPI app
app = FastAPI(
    title="Rosetta MCP Server",
    description="AI-powered Excel translation MCP server",
    version="0.1.1",
)

# CORS configuration for browser access
# Allow Claude.ai and rosetta.study origins
ALLOWED_ORIGINS = [
    "https://claude.ai",
    "https://www.claude.ai",
    "https://rosetta.study",
    "https://www.rosetta.study",
    "https://mcp.rosetta.study",
]

# In development, allow localhost
if os.getenv("ENVIRONMENT", "development") == "development":
    ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Mcp-Session-Id"],
)

# Session storage (in-memory for now)
sessions: dict[str, dict] = {}


def create_response(id: int | str | None, result: Any = None, error: dict | None = None) -> dict:
    """Create a JSON-RPC response."""
    response = {"jsonrpc": "2.0", "id": id}
    if error:
        response["error"] = error
    else:
        response["result"] = result
    return response


def create_error(id: int | str | None, code: int, message: str, data: Any = None) -> dict:
    """Create a JSON-RPC error response."""
    error = {"code": code, "message": message}
    if data:
        error["data"] = data
    return create_response(id, error=error)


# Tool handlers mapping
TOOL_HANDLERS = {
    "translate_excel": tool_translate_excel,
    "get_excel_sheets": tool_get_sheets,
    "count_translatable_cells": tool_count_cells,
    "preview_cells": tool_preview_cells,
    "estimate_translation_cost": tool_estimate_cost,
}


async def handle_initialize(params: dict | None) -> dict:
    """Handle initialize request."""
    return {
        "protocolVersion": MCP_PROTOCOL_VERSION,
        "capabilities": {
            "tools": {"listChanged": False},
        },
        "serverInfo": {
            "name": "rosetta-mcp",
            "version": "0.1.1",
        },
    }


async def handle_tools_list(params: dict | None) -> dict:
    """Handle tools/list request."""
    tools = []
    for tool in TOOLS:
        tools.append({
            "name": tool.name,
            "description": tool.description,
            "inputSchema": tool.inputSchema.model_dump(),
        })
    return {"tools": tools}


async def handle_tools_call(params: dict | None) -> dict:
    """Handle tools/call request."""
    if not params:
        raise ValueError("Missing params")

    name = params.get("name")
    arguments = params.get("arguments", {})

    if not name:
        raise ValueError("Missing tool name")

    if name not in TOOL_HANDLERS:
        raise ValueError(f"Unknown tool: {name}")

    try:
        # Call the handler (they handle their own validation)
        handler = TOOL_HANDLERS[name]
        result = handler(arguments)

        # Extract text content from the result
        if hasattr(result, 'content') and result.content:
            text_content = result.content[0].text if result.content else ""
            is_error = getattr(result, 'isError', False)
        else:
            text_content = str(result)
            is_error = False

        return {
            "content": [{"type": "text", "text": text_content}],
            "isError": is_error,
        }

    except ValueError as e:
        return {
            "content": [{"type": "text", "text": f"Validation error: {str(e)}"}],
            "isError": True,
        }
    except Exception as e:
        logger.error(f"Error in tool {name}: {e}")
        return {
            "content": [{"type": "text", "text": f"Error processing request: {str(e)}"}],
            "isError": True,
        }


async def handle_request(method: str, params: dict | None, request_id: int | str | None) -> dict:
    """Route and handle a JSON-RPC request."""
    try:
        if method == "initialize":
            result = await handle_initialize(params)
        elif method == "initialized":
            result = {}  # Acknowledgment, no response needed
        elif method == "tools/list":
            result = await handle_tools_list(params)
        elif method == "tools/call":
            result = await handle_tools_call(params)
        elif method == "ping":
            result = {}
        else:
            return create_error(request_id, -32601, f"Method not found: {method}")

        return create_response(request_id, result)

    except ValueError as e:
        return create_error(request_id, -32602, str(e))
    except Exception as e:
        logger.error(f"Error handling {method}: {e}")
        return create_error(request_id, -32603, "Internal error")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "server": "rosetta-mcp", "version": "0.1.1"}


@app.get("/")
async def root():
    """Root endpoint with server info."""
    return {
        "name": "rosetta-mcp",
        "version": "0.1.1",
        "description": "AI-powered Excel translation MCP server",
        "mcp_endpoint": "/mcp",
        "health": "/health",
    }


@app.post("/mcp")
async def mcp_post(request: Request):
    """
    MCP Streamable HTTP endpoint - POST method.

    Handles JSON-RPC requests from MCP clients.
    """
    # Validate protocol version header (optional but recommended)
    protocol_version = request.headers.get("mcp-protocol-version")
    if protocol_version:
        logger.info(f"MCP Protocol Version: {protocol_version}")

    # Get or create session
    session_id = request.headers.get("mcp-session-id")
    if not session_id:
        session_id = str(uuid.uuid4())
        sessions[session_id] = {"created": True}

    # Parse request body
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return JSONResponse(
            status_code=400,
            content=create_error(None, -32700, "Parse error"),
        )

    # Handle single request or batch
    if isinstance(body, list):
        # Batch request
        responses = []
        for item in body:
            try:
                method = item.get("method", "")
                params = item.get("params")
                request_id = item.get("id")
                resp = await handle_request(method, params, request_id)
                if request_id is not None:  # Don't include responses for notifications
                    responses.append(resp)
            except Exception as e:
                logger.error(f"Error processing batch item: {e}")
                responses.append(create_error(item.get("id"), -32600, "Invalid Request"))

        return JSONResponse(
            content=responses,
            headers={"Mcp-Session-Id": session_id},
        )
    else:
        # Single request
        try:
            method = body.get("method", "")
            params = body.get("params")
            request_id = body.get("id")
            resp = await handle_request(method, params, request_id)

            return JSONResponse(
                content=resp,
                headers={"Mcp-Session-Id": session_id},
            )
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            return JSONResponse(
                status_code=400,
                content=create_error(body.get("id"), -32600, "Invalid Request"),
            )


@app.get("/mcp")
async def mcp_get(request: Request):
    """
    MCP Streamable HTTP endpoint - GET method.

    Opens an SSE stream for server-initiated messages.
    For Rosetta, we don't have server-initiated messages, so this just keeps the connection alive.
    """
    async def event_stream():
        import asyncio
        # Send initial comment to keep connection alive
        yield ": connected\n\n"

        # Keep connection open (clients can close when done)
        while True:
            await asyncio.sleep(30)
            yield ": ping\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.options("/mcp")
async def mcp_options():
    """Handle CORS preflight requests."""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version, Mcp-Session-Id, Accept",
        },
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)

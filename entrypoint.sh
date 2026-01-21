#!/bin/sh
set -e
echo "Starting MCP HTTP server on port ${PORT:-8080}"
exec python -m uvicorn rosetta.api.mcp_http:app --host 0.0.0.0 --port ${PORT:-8080}

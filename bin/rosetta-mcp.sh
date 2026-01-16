#!/bin/bash
# Rosetta MCP Server Launcher
# This script launches the Rosetta MCP server for Claude Desktop

set -e

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3.11+ is required but not found"
    echo "Please install Python from https://www.python.org/downloads/"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.11"

if ! python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)"; then
    echo "Error: Python 3.11+ is required (found $PYTHON_VERSION)"
    echo "Please upgrade Python from https://www.python.org/downloads/"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if uv is available (recommended)
if command -v uv &> /dev/null; then
    cd "$PROJECT_ROOT"
    exec uv run python -m rosetta.api.mcp
else
    # Fallback to regular Python
    # Ensure rosetta-xl package is installed
    if ! python3 -c "import rosetta" &> /dev/null; then
        echo "Installing rosetta-xl..."
        python3 -m pip install rosetta-xl
    fi

    cd "$PROJECT_ROOT"
    exec python3 -m rosetta.api.mcp
fi

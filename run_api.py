#!/usr/bin/env python3
"""Run the Rosetta API server."""

from dotenv import load_dotenv
import uvicorn

load_dotenv()  # Load .env file

if __name__ == "__main__":
    uvicorn.run(
        "rosetta.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )

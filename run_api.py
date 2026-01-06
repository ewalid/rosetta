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
        timeout_keep_alive=75,  # Standard HTTP keep-alive timeout for corporate proxies
        timeout_graceful_shutdown=30,  # Graceful shutdown timeout
        limit_concurrency=1000,  # Maximum concurrent connections
        backlog=2048,  # Maximum number of pending connections
    )

# Rosetta

[![PyPI version](https://badge.fury.io/py/rosetta-xl.svg)](https://badge.fury.io/py/rosetta-xl)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-powered Excel translation CLI. Translates Excel files while preserving formatting, formulas, and data integrity.

## What it does

Rosetta translates all text in your Excel files using Claude AI, without breaking:
- Formulas and calculations
- Formatting (fonts, colors, borders)
- Merged cells and layouts
- Charts and images
- Dropdown menus
- Rich text (bold, italic within cells)

## Prerequisites

**You need a Claude API key from Anthropic.**

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account (or sign in)
3. Go to **API Keys** and create a new key
4. Copy the key (starts with `sk-ant-...`)

> **Note**: API usage is billed by Anthropic. See [anthropic.com/pricing](https://www.anthropic.com/pricing) for current rates. Translating a typical Excel file costs a few cents.

## Installation

Install from [PyPI](https://pypi.org/project/rosetta-xl/):

```bash
pip install rosetta-xl
```

Then set your API key:

```bash
# Linux/macOS
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Windows (Command Prompt)
set ANTHROPIC_API_KEY=sk-ant-your-key-here

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

Or create a `.env` file in your working directory:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Usage

```bash
# Translate to French
rosetta input.xlsx -t french

# Translate to Spanish with custom output name
rosetta input.xlsx -t spanish -o translated.xlsx

# Specify source language (auto-detected by default)
rosetta input.xlsx -s english -t german

# Translate only specific sheets
rosetta input.xlsx -t french --sheets "Sheet1" --sheets "Data"

# Add context for better translations (e.g., domain-specific terms)
rosetta input.xlsx -t french -c "Medical terminology document"
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--target-lang` | `-t` | Target language (required) |
| `--source-lang` | `-s` | Source language (auto-detect if omitted) |
| `--output` | `-o` | Output file path (default: `input_translated.xlsx`) |
| `--sheets` | | Sheets to translate (can repeat, default: all) |
| `--context` | `-c` | Domain context for better accuracy |
| `--batch-size` | `-b` | Cells per API call (default: 50) |

## Examples

**Translate a price list to multiple languages:**
```bash
rosetta prices.xlsx -t french -o prices_fr.xlsx
rosetta prices.xlsx -t german -o prices_de.xlsx
rosetta prices.xlsx -t spanish -o prices_es.xlsx
```

**Translate a medical form with context:**
```bash
rosetta patient_form.xlsx -t french -c "Medical intake form with clinical terminology"
```

**Translate only the "Questions" sheet:**
```bash
rosetta survey.xlsx -t japanese --sheets "Questions"
```

## Troubleshooting

**"ANTHROPIC_API_KEY not set"**
- Make sure you've exported the key: `export ANTHROPIC_API_KEY=sk-ant-...`
- Or create a `.env` file with the key

**"Invalid API key"**
- Check that your key starts with `sk-ant-`
- Make sure you copied the full key from [console.anthropic.com](https://console.anthropic.com/)

**"Rate limit exceeded"**
- You've hit Anthropic's rate limits. Wait a minute and try again
- Or reduce batch size: `rosetta input.xlsx -t french -b 20`

## How it works

1. Extracts all text cells from your Excel file
2. Sends text to Claude AI for translation (in batches)
3. Writes translations back, preserving all formatting
4. Saves the translated file

Your original file is never modified.

## Web App & API

Rosetta also includes a web application and REST API for browser-based translations.

### Running the API server

```bash
# Install with uv (recommended)
uv sync

# Start the server
uv run uvicorn rosetta.api:app --reload

# Or with pip
pip install -e .
uvicorn rosetta.api:app --reload
```

The API runs at `http://localhost:8000` by default.

### Running the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and connects to the API.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/translate` | POST | Translate an Excel file (returns file) |
| `/translate-stream` | POST | Translate with real-time progress via SSE |
| `/estimate` | POST | Get cell count and cost estimate |
| `/sheets` | POST | List sheet names in a file |
| `/count` | POST | Count translatable cells |
| `/preview` | POST | Preview cells that will be translated |
| `/health` | GET | Health check |

### Real-time Progress

The `/translate-stream` endpoint uses Server-Sent Events (SSE) to stream translation progress in real-time. The frontend automatically falls back to the standard `/translate` endpoint on networks that don't support SSE (e.g., corporate proxies).

## MCP Integration

Rosetta includes MCP (Model Context Protocol) servers for both Claude Desktop and Claude Web.

### For Claude Desktop (Local)

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "rosetta": {
      "command": "uv",
      "args": ["run", "--directory", "/path/to/rosetta", "python", "-m", "rosetta.api.mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "your-key-here"
      }
    }
  }
}
```

**Usage:** Use local file paths for best results.
```
Translate ~/Downloads/report.xlsx to French
```

### For Claude Web (Browser)

**Note:** Claude.ai does not yet support custom MCP servers in the browser (as of January 2026).

**Current recommendation:** Use the [web app](#web-app--api) for browser-based translations.

See [MCP_USAGE.md](MCP_USAGE.md) for detailed instructions.

## Requirements

- Python 3.11+
- Anthropic API key

## License

MIT

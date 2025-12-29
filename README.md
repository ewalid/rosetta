# Rosetta

An Excel translation tool that preserves formatting, formulas, and data integrity.

## Overview

Rosetta takes an Excel file as input, translates all text content using Claude, and outputs a new file with translations — without breaking formulas, styles, merged cells, or any other Excel features.

## Features

- **Preserves Excel structure**: Formulas, formatting, merged cells, charts remain intact
- **Smart extraction**: Only translates text content, skips formulas and numbers
- **Batch processing**: Efficient API usage with configurable batch sizes
- **Multiple language support**: Any language pair supported by Claude

## Installation

```bash
git clone https://github.com/ewalid/rosetta.git
cd rosetta
uv sync
```

Or with pip:

```bash
pip install -e .
```

## Usage

```bash
# Basic usage
rosetta input.xlsx --target-lang french --output translated.xlsx

# Specify source language (auto-detected by default)
rosetta input.xlsx --source-lang english --target-lang spanish
```

## Configuration

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

## Project Structure

```
rosetta/
├── src/
│   └── rosetta/
│       ├── __init__.py
│       ├── models/           # Pydantic data models
│       │   ├── __init__.py
│       │   └── cell.py       # Cell and TranslationBatch models
│       ├── services/         # Business logic (framework-agnostic)
│       │   ├── __init__.py
│       │   ├── extractor.py  # Excel cell extraction
│       │   └── translator.py # Claude API integration
│       ├── core/             # Configuration and exceptions
│       │   ├── __init__.py
│       │   ├── config.py     # Environment config
│       │   └── exceptions.py # Custom exceptions
│       ├── api/              # FastAPI routes (future: web interface)
│       └── main.py           # CLI entry point
├── tests/
├── pyproject.toml
└── README.md
```

**Architecture**: The `services/` layer is framework-agnostic and can be used by both the CLI (`main.py`) and future API endpoints (`api/`). This allows adding a web interface without refactoring.

## Requirements

- Python 3.11+
- Anthropic API key

## License

MIT
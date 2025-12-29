# Rosetta

An Excel translation tool that preserves formatting, formulas, and data integrity.

## Overview

Rosetta takes an Excel file as input, translates all text content using Claude, and outputs a new file with translations — without breaking formulas, styles, merged cells, images, data validations (dropdowns), or any other Excel features.

## Features

- **Preserves Excel structure**: Formulas, formatting, merged cells, charts, images, and data validations remain intact
- **Rich text formatting**: Preserves bold, italic, colors, and fonts within cells
- **Dropdown translation**: Translates inline dropdown values (e.g., "Yes,No,Maybe")
- **Context-aware translations**: Provide domain context for more accurate translations
- **Smart extraction**: Only translates text content, skips formulas and numbers
- **Sheet selection**: Translate all sheets or select specific ones with `--sheets`
- **Multiline support**: Correctly handles cells with multiple lines of text
- **Batch processing**: Efficient API usage with configurable batch sizes
- **Multiple language support**: Any language pair supported by Claude

## Installation

```bash
git clone https://github.com/ewalid/rosetta.git
cd rosetta
```

Then install dependencies:

```bash
# Using uv (recommended)
uv sync

# Or using pip
pip install .
```

## Usage

```bash
# Basic usage (translates all sheets)
rosetta input.xlsx -t french -o translated.xlsx

# Specify source language (auto-detected by default)
rosetta input.xlsx -s english -t spanish

# Translate specific sheets only
rosetta input.xlsx -t french --sheets "Sheet1" --sheets "Data"

# Custom batch size (default: 50 cells per API call)
rosetta input.xlsx -t german -b 100

# Provide context for domain-specific translations
rosetta input.xlsx -t french -c "This is a medical document with clinical terminology"
rosetta input.xlsx -t spanish -c "Marketing content for a software company"
```

### CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--target-lang` | `-t` | Target language (required) |
| `--source-lang` | `-s` | Source language (auto-detect if omitted) |
| `--output` | `-o` | Output file path (default: `input_translated.xlsx`) |
| `--batch-size` | `-b` | Cells per batch (default: 50) |
| `--sheets` | | Sheets to translate (can be repeated, default: all) |
| `--context` | `-c` | Additional context for accurate translations |

## Configuration

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

Optional environment variables:

```bash
export ROSETTA_MODEL=claude-sonnet-4-20250514    # Claude model to use
export ROSETTA_BATCH_SIZE=50                      # Default batch size
export ROSETTA_MAX_RETRIES=3                      # API retry attempts
```

## Project Structure

```
rosetta/
├── src/
│   └── rosetta/
│       ├── __init__.py
│       ├── models/           # Data models (dataclasses)
│       │   ├── __init__.py
│       │   └── cell.py       # Cell, RichTextRun, DropdownValidation, TranslationBatch
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
├── tests/                    # Test suite (pytest)
├── pyproject.toml
└── README.md
```

**Architecture**: The `services/` layer is framework-agnostic and can be used by both the CLI (`main.py`) and future API endpoints (`api/`). This allows adding a web interface without refactoring.

## Development

### Running Tests

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
python -m pytest tests/ -v

# Run tests with coverage
python -m pytest tests/ -v --cov=rosetta --cov-report=term-missing
```

## Requirements

- Python 3.11+
- Anthropic API key

## License

MIT
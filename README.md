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

## Requirements

- Python 3.11+
- Anthropic API key

## License

MIT

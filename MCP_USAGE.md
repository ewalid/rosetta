# Using Rosetta MCP in Claude Desktop

## Quick Setup

1. **Configure Claude Desktop**: Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rosetta": {
      "command": "uv",
      "args": ["run", "--directory", "/path/to/rosetta", "python", "-m", "rosetta.api.mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-your-key-here"
      }
    }
  }
}
```

**Important:** Replace `/path/to/rosetta` with the actual path where you cloned the Rosetta repository.

2. **Restart Claude Desktop**

3. **Enable Rosetta** in Settings → Integrations

## Usage

### Best Method: Use Local File Paths

Save your Excel file to your computer (e.g., Downloads folder) and reference it by path:

```
Translate ~/Downloads/report.xlsx to French
```

```
Show me the sheets in ~/Downloads/workbook.xlsx
```

```
Count cells in ~/Desktop/data.xlsx and give me a cost estimate
```

### How It Works

1. Save your Excel file to a known location (Downloads, Desktop, Documents, etc.)
2. Ask Claude to translate it using the full file path
3. Claude calls the Rosetta MCP tool with the file path
4. The MCP server reads the file directly and processes it
5. Claude receives and saves the translated file

### Why Local Paths Work Best

Claude Desktop has limitations when reading uploaded binary files (Excel files), which can cause corruption. Using local file paths lets the MCP server read files directly, avoiding these issues.

## Available Tools

- **translate_excel** - Translate file to target language
- **get_excel_sheets** - List all sheet names
- **count_translatable_cells** - Count translatable cells
- **preview_cells** - Preview cells before translation
- **estimate_translation_cost** - Get cost and time estimates

## How It Works

1. You upload an Excel file or reference a local file path
2. Claude reads the file and converts it to base64
3. Claude calls the appropriate Rosetta MCP tool
4. Tool processes the file and returns results
5. Claude presents the results or saves the translated file

## Troubleshooting

**"File not found" error:**
- Make sure the file path is correct and complete
- Use absolute paths: `~/Downloads/file.xlsx` or `/Users/yourname/Downloads/file.xlsx`
- Check that the file exists at that location
- Make sure you have read permissions for the file

**Tool not appearing:**
- Check Settings → Integrations → Rosetta is enabled
- Verify config file syntax (valid JSON, no trailing commas)
- Check the path to rosetta in your config is correct
- Restart Claude Desktop after config changes
- Check logs: `~/Library/Logs/Claude/mcp-server-rosetta.log`

**"Invalid base64" or "Bad magic number" errors:**
- These occur when Claude tries to read uploaded files directly
- **Solution:** Save the file locally and use file path instead

**MCP server not starting:**
- Ensure `uv` is installed: `brew install uv`
- Check that ANTHROPIC_API_KEY is set in the config
- Verify the rosetta directory path in config is correct
- Try running manually: `cd /path/to/rosetta && uv run python -m rosetta.api.mcp`

# MCP Testing Guide

This guide helps you test the Rosetta MCP server locally before using it in Claude Desktop.

## Quick Test

Run the automated test script:

```bash
uv run python test_mcp_local.py
```

This will test all 5 MCP tools:
1. `get_excel_sheets` - List sheet names
2. `count_translatable_cells` - Count translatable cells
3. `preview_cells` - Preview cells before translation
4. `estimate_translation_cost` - Get cost/time estimates
5. `translate_excel` - Translate file

If all tests pass (✅), your MCP server is working correctly!

## Manual Testing in Claude Desktop

### Prerequisites

1. **Install Dependencies:**
   ```bash
   cd /path/to/rosetta
   uv sync
   ```

2. **Set API Key:**
   You have two options:

   **Option A: In Config File (Recommended)**
   - Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Add your API key in the `env` section (see [MCP_USAGE.md](MCP_USAGE.md))

   **Option B: In Environment**
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

3. **Configure Claude Desktop:**
   Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "rosetta": {
         "command": "uv",
         "args": ["run", "--directory", "/Users/yourname/path/to/rosetta", "python", "-m", "rosetta.api.mcp"],
         "env": {
           "ANTHROPIC_API_KEY": "sk-ant-your-key-here"
         }
       }
     }
   }
   ```

   **Important:** Replace:
   - `/Users/yourname/path/to/rosetta` with your actual Rosetta directory
   - `sk-ant-your-key-here` with your actual Anthropic API key

4. **Restart Claude Desktop**

5. **Enable Rosetta:**
   - Open Settings → Integrations
   - Find "rosetta" and enable it
   - You should see a hammer icon 🔨 next to the input field

### Testing Steps

#### Test 1: Check Tool Availability

Ask Claude:
```
What tools do you have available from Rosetta?
```

Expected: Claude lists 5 tools (translate_excel, get_excel_sheets, etc.)

#### Test 2: Get Sheets from a File

Create a test Excel file and save it to `~/Downloads/test.xlsx`, then ask:
```
Show me the sheets in ~/Downloads/test.xlsx
```

Expected: Claude calls the tool and shows sheet names.

#### Test 3: Count Cells

```
Count translatable cells in ~/Downloads/test.xlsx
```

Expected: Claude shows the cell count.

#### Test 4: Preview Cells

```
Preview the first 10 cells from ~/Downloads/test.xlsx
```

Expected: Claude shows a table with cell locations and content.

#### Test 5: Estimate Cost

```
Give me a cost estimate for translating ~/Downloads/test.xlsx to French
```

Expected: Claude shows cell count, estimated cost, and time.

#### Test 6: Full Translation

```
Translate ~/Downloads/test.xlsx to French
```

Expected: Claude translates the file and provides the output as a downloadable file.

## Troubleshooting

### Tool Not Appearing

**Symptom:** Claude says "I don't have access to Rosetta tools"

**Solutions:**
1. Check Settings → Integrations → Rosetta is enabled
2. Verify config file path is correct
3. Restart Claude Desktop
4. Check logs: `~/Library/Logs/Claude/mcp-server-rosetta.log`

### "File not found" Error

**Symptom:** Error like `File not found: ~/Downloads/test.xlsx`

**Solutions:**
1. Use full absolute path: `/Users/yourname/Downloads/test.xlsx`
2. Verify file exists: `ls ~/Downloads/test.xlsx`
3. Check file permissions (should be readable)

### "Module not found" Error

**Symptom:** Error about missing Python modules

**Solutions:**
1. Run `uv sync` in the rosetta directory
2. Verify Python 3.11+ is installed: `python3 --version`
3. Ensure `uv` is installed: `brew install uv`

### MCP Server Not Starting

**Symptom:** No tools appear at all, or connection errors

**Solutions:**
1. Check config file is valid JSON (use a validator)
2. Verify the directory path in config is absolute and correct
3. Test manually:
   ```bash
   cd /path/to/rosetta
   uv run python -m rosetta.api.mcp
   ```
   Press Ctrl+C to exit after seeing server start

4. Check Claude Desktop logs:
   ```bash
   tail -f ~/Library/Logs/Claude/mcp-server-rosetta.log
   ```

### "Invalid API Key" Error

**Symptom:** Error about invalid or missing API key

**Solutions:**
1. Verify your key is correct (starts with `sk-ant-`)
2. Make sure you added it to the config `env` section
3. Test the key manually:
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-your-key-here
   uv run python test_mcp_local.py
   ```

## Advanced Testing

### Test with Multiple Sheets

Create an Excel file with multiple sheets:
```
List sheets in ~/Downloads/multi-sheet.xlsx
Translate only "Sheet1" and "Sheet2" from ~/Downloads/multi-sheet.xlsx to Spanish
```

### Test with Large Files

For files with 100+ cells:
```
Estimate the cost for ~/Downloads/large-file.xlsx
Preview first 20 cells from ~/Downloads/large-file.xlsx
```

### Test Error Handling

Try with an invalid file:
```
Translate ~/Downloads/nonexistent.xlsx to French
```

Expected: Clear error message about file not found.

## Next Steps

Once all tests pass:
1. ✅ MCP server is working correctly locally
2. ✅ Ready for regular use in Claude Desktop
3. ✅ Can consider publishing to Anthropic integrations (if desired)

See [MCP_USAGE.md](MCP_USAGE.md) for regular usage instructions.

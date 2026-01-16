# Publishing Rosetta MCP Server

This guide covers publishing the Rosetta MCP server to both npm (for Claude Desktop) and the Anthropic MCP Registry.

## Pre-Publishing Checklist

### Code Quality ✅
- [x] All MCP tools tested and working (`test_mcp_local.py` passes)
- [x] Security validation implemented (base64, filename, path traversal, prompt injection)
- [x] Error handling comprehensive
- [x] Performance optimized (direct file path handling)
- [x] Code is clean and well-documented

### Documentation ✅
- [x] README.md includes MCP section
- [x] MCP_USAGE.md provides setup instructions
- [x] MCP_TESTING.md provides testing guide
- [x] Tool descriptions are clear and helpful

### Testing ✅
- [x] Local test script passes (`test_mcp_local.py`)
- [x] Claude Desktop integration tested
- [x] File path handling works
- [x] Translation output works correctly

---

## Part 1: Publishing to npm (for Claude Desktop)

### Why npm?
Claude Desktop can install MCP servers directly from npm packages. Publishing to npm makes it easy for users to install and use Rosetta.

### Prerequisites

1. **npm account**: Create at [npmjs.com/signup](https://www.npmjs.com/signup)
2. **npm CLI installed**: `npm --version` (comes with Node.js)
3. **Login to npm**: `npm login`

### Files Already Prepared

✅ `package.json` - npm package configuration
✅ `bin/rosetta-mcp.sh` - Launcher script
✅ README.md - Documentation

### Publishing Steps

1. **Test the package locally**:
   ```bash
   # From the rosetta directory
   npm pack

   # This creates a .tgz file you can inspect
   tar -tzf ewalid-rosetta-mcp-0.1.0.tgz
   ```

2. **Verify package contents**:
   The package should include:
   - `bin/rosetta-mcp.sh` (executable launcher)
   - `src/rosetta/` (Python source code)
   - `pyproject.toml` (Python dependencies)
   - `README.md` (documentation)
   - `LICENSE` (MIT license)

3. **Publish to npm**:
   ```bash
   npm publish --access public
   ```

4. **Verify publication**:
   Visit: `https://www.npmjs.com/package/@ewalid/rosetta-mcp`

### User Installation (After Publishing)

Once published, users can install via npx:

```bash
npx @ewalid/rosetta-mcp
```

Or add to Claude Desktop config:
```json
{
  "mcpServers": {
    "rosetta": {
      "command": "npx",
      "args": ["-y", "@ewalid/rosetta-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-your-key-here"
      }
    }
  }
}
```

---

## Part 2: Submitting to Anthropic MCP Registry

### Why the MCP Registry?
The official Anthropic MCP Registry makes your server discoverable to Claude users and provides better visibility.

### Submission Options

#### Option A: MCP Servers GitHub Repository (Recommended)

1. **Fork the repository**: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

2. **Add your server**:
   - Create `src/rosetta/` directory in the forked repo
   - Add `README.md` describing your MCP server
   - Add installation instructions

3. **Create server.json**:
   ```json
   {
     "name": "rosetta",
     "displayName": "Rosetta Excel Translation",
     "description": "AI-powered Excel translation that preserves formatting, formulas, and data integrity",
     "homepage": "https://github.com/ewalid/rosetta",
     "license": "MIT",
     "version": "0.1.0",
     "npmPackage": "@ewalid/rosetta-mcp",
     "categories": ["productivity", "translation", "office"],
     "keywords": ["excel", "translation", "ai", "localization", "i18n", "xlsx"],
     "installation": {
       "type": "npm",
       "package": "@ewalid/rosetta-mcp"
     },
     "configuration": {
       "required": {
         "ANTHROPIC_API_KEY": {
           "type": "string",
           "description": "Your Anthropic API key from console.anthropic.com"
         }
       }
     },
     "tools": [
       {
         "name": "translate_excel",
         "description": "Translate Excel files while preserving all formatting and formulas"
       },
       {
         "name": "get_excel_sheets",
         "description": "List all sheet names in an Excel file"
       },
       {
         "name": "count_translatable_cells",
         "description": "Count translatable cells for cost estimation"
       },
       {
         "name": "preview_cells",
         "description": "Preview cells before translation"
       },
       {
         "name": "estimate_translation_cost",
         "description": "Estimate API cost and processing time"
       }
     ]
   }
   ```

4. **Submit Pull Request**:
   - Title: "Add Rosetta Excel Translation MCP Server"
   - Description: Brief overview of what Rosetta does
   - Link to your GitHub repository
   - Screenshots/demo (optional but helpful)

#### Option B: Claude Partners Directory (For Official Integration)

Visit: [forms.gle/anthropic-partners](https://docs.google.com/forms/d/e/1FAIpQLSfVWpLjAWJrDQXqJ7s0H2dBJO2XmNO_MoXyqq8RFfxGWq8g/viewform)

Fill out:
- **Project name**: Rosetta Excel Translation
- **Description**: AI-powered Excel translation MCP server that preserves formatting, formulas, and data integrity
- **Category**: Productivity / Office Tools
- **GitHub URL**: https://github.com/ewalid/rosetta
- **npm Package**: @ewalid/rosetta-mcp
- **License**: MIT
- **Contact Email**: [your email]

---

## Part 3: Browser Support (Future)

### Current Status (January 2026)
❌ Claude.ai does **not yet support** custom MCP servers in the browser.

### When Browser Support Arrives

The stdio MCP server can potentially be adapted for browser support when Anthropic enables this feature.

### Current Recommendation
**For browser translations**: Use the [Rosetta Web App](https://github.com/ewalid/rosetta) instead of MCP until browser support arrives.

---

## Publishing Timeline

### Immediate (Ready Now)
1. ✅ Publish to npm - Makes it easy to install for Claude Desktop
2. ✅ Submit to MCP Servers repository - Increases discoverability
3. ✅ Announce on GitHub - Update README with MCP availability

### Short-term (1-2 weeks)
4. ⏳ Monitor user feedback and issues
5. ⏳ Iterate based on real-world usage
6. ⏳ Add more examples to documentation

### Future (When Available)
7. ⏳ Deploy HTTP MCP for browser support
8. ⏳ Update registry with HTTP endpoint
9. ⏳ Announce browser availability

---

## Post-Publishing

### Monitoring

1. **npm downloads**: Check at `npmjs.com/package/@ewalid/rosetta-mcp`
2. **GitHub issues**: Monitor for bug reports and feature requests
3. **User feedback**: Watch for questions in Issues/Discussions

### Maintenance

1. **Keep dependencies updated**: Run `uv sync --upgrade` monthly
2. **Security patches**: Update Anthropic SDK when new versions release
3. **Bug fixes**: Address user-reported issues promptly
4. **Documentation**: Keep guides current with any changes

### Versioning

Use semantic versioning (semver):
- **0.1.x** - Bug fixes, documentation updates
- **0.2.0** - New features (e.g., more tools)
- **1.0.0** - Stable release after extensive real-world testing

---

## Testing After Publishing

### npm Package Test

```bash
# Install globally
npm install -g @ewalid/rosetta-mcp

# Run directly
rosetta-mcp

# Or via npx
npx -y @ewalid/rosetta-mcp
```

### Claude Desktop Test

Update config to use npm package:
```json
{
  "mcpServers": {
    "rosetta": {
      "command": "npx",
      "args": ["-y", "@ewalid/rosetta-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-your-key-here"
      }
    }
  }
}
```

Then test:
```
What tools do you have from Rosetta?
Translate ~/Downloads/test.xlsx to French
```

---

## Summary

**Ready to publish:**
- ✅ Code is clean, tested, and documented
- ✅ Security validations in place
- ✅ Performance optimized
- ✅ npm package configured
- ✅ Documentation complete

**Next steps:**
1. Publish to npm: `npm publish --access public`
2. Submit to MCP Servers repository (PR)
3. Optionally submit to Claude Partners Directory (form)
4. Monitor and maintain

**Important notes:**
- Browser MCP not yet supported by Anthropic (use web app instead)
- HTTP server ready for when browser support arrives
- Focus on Claude Desktop for initial release

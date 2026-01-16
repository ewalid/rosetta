# Rosetta MCP Publishing Checklist

Use this checklist to track your publishing progress.

## Pre-Publishing Verification

### Code Quality
- [x] **All tests pass**: `uv run python test_mcp_local.py` ✅
- [x] **No syntax errors**: Python code is clean
- [x] **Security validations**: Base64, filename, path traversal, prompt injection protections in place
- [x] **Error handling**: Comprehensive error messages for users
- [x] **Performance**: Optimized file path handling (no unnecessary base64 conversion)
- [x] **File cleanup**: Temporary files properly deleted

### Documentation
- [x] **README.md**: MCP section complete with setup instructions
- [x] **MCP_USAGE.md**: Detailed usage guide for Claude Desktop
- [x] **MCP_TESTING.md**: Testing guide with troubleshooting
- [x] **MCP_PUBLISHING.md**: Complete publishing guide ✅ (just created)
- [x] **LICENSE**: MIT license file exists
- [x] **Tool descriptions**: Clear, helpful descriptions in code

### Package Configuration
- [x] **package.json**: npm package config complete
- [x] **pyproject.toml**: Python package config complete
- [x] **server.json**: MCP Registry metadata ✅ (just created)
- [x] **bin/rosetta-mcp.sh**: Launcher script with Python version checks

### Testing
- [x] **Local tests**: All 5 tools tested and passing
- [x] **Claude Desktop**: Tested with local file paths
- [x] **Translation output**: File saved correctly, no base64 shown
- [x] **Error cases**: File not found, invalid inputs handled gracefully

---

## Publishing to npm

### Preparation
- [ ] **Create npm account**: Sign up at [npmjs.com/signup](https://www.npmjs.com/signup)
- [ ] **Install npm CLI**: Verify with `npm --version`
- [ ] **Login to npm**: Run `npm login` and authenticate

### Testing Package Locally
- [ ] **Create test package**: Run `npm pack` to create `.tgz` file
- [ ] **Inspect contents**: Run `tar -tzf ewalid-rosetta-mcp-0.1.0.tgz`
- [ ] **Verify files included**:
  - [ ] `bin/rosetta-mcp.sh` (executable)
  - [ ] `src/rosetta/` (all Python files)
  - [ ] `pyproject.toml`
  - [ ] `README.md`
  - [ ] `LICENSE`

### Publishing
- [ ] **Publish to npm**: Run `npm publish --access public`
- [ ] **Verify publication**: Check `https://www.npmjs.com/package/@ewalid/rosetta-mcp`
- [ ] **Test installation**: Run `npx -y @ewalid/rosetta-mcp` in a test directory
- [ ] **Test in Claude Desktop**: Update config to use npm package and restart Claude

---

## Submitting to MCP Registry

### Option A: MCP Servers Repository (Recommended)

- [ ] **Fork repository**: Fork [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- [ ] **Create server directory**: `src/rosetta/` in forked repo
- [ ] **Copy files**:
  - [ ] `server.json` (MCP metadata)
  - [ ] `README.md` (Server documentation)
  - [ ] Installation instructions
- [ ] **Create pull request**:
  - [ ] Title: "Add Rosetta Excel Translation MCP Server"
  - [ ] Description: Brief overview
  - [ ] Link to GitHub repo
  - [ ] Screenshots/demo (optional)
- [ ] **Wait for review**: MCP team will review and merge

### Option B: Claude Partners Directory (Optional)

- [ ] **Fill out form**: Visit Anthropic Partners form
- [ ] **Provide details**:
  - [ ] Project name: Rosetta Excel Translation
  - [ ] Description: AI-powered Excel translation
  - [ ] Category: Productivity / Office Tools
  - [ ] GitHub URL
  - [ ] npm package name
  - [ ] License: MIT
  - [ ] Contact email
- [ ] **Submit form**
- [ ] **Wait for response**: Anthropic will review

---

## Post-Publishing

### Announcement
- [ ] **Update README**: Add "Available on npm" badge
- [ ] **GitHub Release**: Create v0.1.0 release with changelog
- [ ] **Social Media**: Announce on Twitter/LinkedIn (optional)
- [ ] **Community**: Post in relevant forums/Discord servers (optional)

### Monitoring
- [ ] **Watch npm downloads**: Check weekly at npmjs.com
- [ ] **Monitor GitHub issues**: Set up notifications
- [ ] **Track user feedback**: Respond to questions promptly
- [ ] **Security alerts**: Enable GitHub security advisories

### Maintenance Plan
- [ ] **Schedule monthly dependency updates**: `uv sync --upgrade`
- [ ] **Plan version 0.2.0**: Gather feature requests
- [ ] **Document common issues**: Update MCP_TESTING.md with new troubleshooting
- [ ] **Keep API up to date**: Monitor Anthropic SDK releases

---

## Future: Browser Support

### When Claude.ai Enables Browser MCP

- [ ] **Evaluate options**: Determine if stdio server can be adapted or if new implementation needed
- [ ] **Update documentation**: Add browser installation instructions when available

### Current Alternative
**For browser users**: Direct them to the Rosetta Web App at `http://localhost:5173` (or deployed version)

---

## Version Tracking

| Version | Status | Date | Notes |
|---------|--------|------|-------|
| 0.1.0 | 🔄 Ready to publish | 2026-01-16 | Initial MCP release for Claude Desktop |
| 0.2.0 | ⏳ Planned | TBD | Feature additions based on feedback |
| 1.0.0 | ⏳ Future | TBD | Stable release after real-world testing |

---

## Quick Command Reference

```bash
# Test locally
uv run python test_mcp_local.py

# Create npm package
npm pack

# Publish to npm
npm publish --access public

# Test npm package
npx -y @ewalid/rosetta-mcp

# Deploy HTTP server (future)
fly launch
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```

---

## Support Checklist

After publishing, ensure users have:
- [ ] Clear installation instructions
- [ ] Working example commands
- [ ] Troubleshooting guide
- [ ] Way to report issues (GitHub Issues)
- [ ] Estimated costs/pricing info
- [ ] Privacy/data handling info (files processed locally)

---

## Success Criteria

Publishing is successful when:
- ✅ Package appears on npmjs.com
- ✅ Users can install with `npx @ewalid/rosetta-mcp`
- ✅ Works in Claude Desktop without manual setup
- ✅ Listed in MCP Registry (or PR submitted)
- ✅ No critical bugs reported in first week
- ✅ At least one positive user feedback/review

---

## Notes

- **Current limitation**: Claude.ai browser doesn't support custom MCP yet
- **HTTP server ready**: Can be deployed when browser support arrives
- **Focus**: Claude Desktop for initial release
- **Pricing**: Users pay for their own Claude API usage (~$0.05 per 1000 cells)
- **Privacy**: All processing happens locally (files never sent to external servers except Claude API)

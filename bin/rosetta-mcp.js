#!/usr/bin/env node

/**
 * Rosetta MCP Server Launcher
 * Node.js wrapper that launches the Python MCP server
 */

const { spawn } = require('child_process');
const { join } = require('path');

// Get the project root (parent of bin/)
const projectRoot = join(__dirname, '..');

// Check if uv is available
function hasCommand(cmd) {
  const { spawnSync } = require('child_process');
  const result = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

// Launch the MCP server
function launchServer() {
  let python;

  if (hasCommand('uv')) {
    // Use uv (recommended)
    python = spawn('uv', ['run', 'python', '-m', 'rosetta.api.mcp'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false
    });
  } else if (hasCommand('python3')) {
    // Fallback to python3
    python = spawn('python3', ['-m', 'rosetta.api.mcp'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false
    });
  } else {
    console.error('Error: Python 3.11+ is required but not found');
    console.error('Please install Python from https://www.python.org/downloads/');
    process.exit(1);
  }

  python.on('error', (err) => {
    console.error('Failed to start MCP server:', err.message);
    process.exit(1);
  });

  python.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle termination signals
  process.on('SIGINT', () => {
    python.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    python.kill('SIGTERM');
  });
}

launchServer();

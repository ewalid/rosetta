"""Integration tests for MCP endpoints with real Excel files."""

import base64
import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook

from rosetta.api import app


@pytest.fixture
def client():
    """Create a test client for the MCP API."""
    return TestClient(app)


@pytest.fixture
def excel_file_base64(simple_excel_file):
    """Convert simple_excel_file fixture to base64."""
    with open(simple_excel_file, "rb") as f:
        content = f.read()
    return base64.b64encode(content).decode()


@pytest.fixture
def multi_sheet_excel_base64(excel_with_multiple_sheets):
    """Convert multi-sheet Excel file to base64."""
    with open(excel_with_multiple_sheets, "rb") as f:
        content = f.read()
    return base64.b64encode(content).decode()


class TestMCPFullFlow:
    """Test complete MCP workflow from initialization to tool execution."""

    def test_full_workflow_initialize_list_call(self, client, excel_file_base64):
        """Test complete workflow: initialize -> list tools -> call tool."""
        # Step 1: Initialize
        init_response = client.post("/mcp/initialize")
        assert init_response.status_code == 200
        init_data = init_response.json()
        assert init_data["protocolVersion"] == "2024-11-05"

        # Step 2: List tools
        tools_response = client.get("/mcp/tools")
        assert tools_response.status_code == 200
        tools_data = tools_response.json()
        assert len(tools_data["tools"]) > 0

        # Step 3: Call a tool (get_excel_sheets)
        tool_response = client.post(
            "/mcp/tools/call",
            json={
                "name": "get_excel_sheets",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                },
            },
        )
        assert tool_response.status_code == 200
        tool_data = tool_response.json()
        assert tool_data["isError"] is False
        assert "sheet" in tool_data["content"][0]["text"].lower()

    def test_translate_workflow(self, client, excel_file_base64):
        """Test complete translation workflow."""
        # Get sheets first
        sheets_response = client.post(
            "/mcp/tools/call",
            json={
                "name": "get_excel_sheets",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                },
            },
        )
        assert sheets_response.status_code == 200

        # Count cells
        count_response = client.post(
            "/mcp/tools/call",
            json={
                "name": "count_translatable_cells",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                },
            },
        )
        assert count_response.status_code == 200
        count_data = count_response.json()
        assert count_data["isError"] is False

        # Preview cells
        preview_response = client.post(
            "/mcp/tools/call",
            json={
                "name": "preview_cells",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                    "limit": 5,
                },
            },
        )
        assert preview_response.status_code == 200
        preview_data = preview_response.json()
        assert preview_data["isError"] is False

        # Estimate cost
        estimate_response = client.post(
            "/mcp/tools/call",
            json={
                "name": "estimate_translation_cost",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                },
            },
        )
        assert estimate_response.status_code == 200
        estimate_data = estimate_response.json()
        assert estimate_data["isError"] is False


class TestMCPWithRealExcelFiles:
    """Test MCP tools with real Excel file fixtures."""

    def test_get_sheets_from_real_file(self, client, excel_file_base64):
        """Test getting sheets from a real Excel file."""
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "get_excel_sheets",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isError"] is False
        # Should have at least one sheet
        assert "sheet" in data["content"][0]["text"].lower()

    def test_count_cells_from_real_file(self, client, excel_file_base64):
        """Test counting cells from a real Excel file."""
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "count_translatable_cells",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isError"] is False
        # Should have some cells (simple_excel_file has 4 text cells)
        assert "cell" in data["content"][0]["text"].lower()

    def test_preview_cells_from_real_file(self, client, excel_file_base64):
        """Test previewing cells from a real Excel file."""
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "preview_cells",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                    "limit": 10,
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isError"] is False
        # Should show some cells
        content_text = data["content"][0]["text"].lower()
        assert "cell" in content_text or "preview" in content_text

    def test_multi_sheet_file(self, client, multi_sheet_excel_base64):
        """Test MCP tools with multi-sheet Excel file."""
        # Get sheets
        sheets_response = client.post(
            "/mcp/tools/call",
            json={
                "name": "get_excel_sheets",
                "arguments": {
                    "file_content_base64": multi_sheet_excel_base64,
                },
            },
        )
        assert sheets_response.status_code == 200
        sheets_data = sheets_response.json()
        assert sheets_data["isError"] is False
        # Should mention multiple sheets
        content_text = sheets_data["content"][0]["text"]
        assert "3" in content_text or "sheet" in content_text.lower()

        # Count cells from specific sheet
        count_response = client.post(
            "/mcp/tools/call",
            json={
                "name": "count_translatable_cells",
                "arguments": {
                    "file_content_base64": multi_sheet_excel_base64,
                    "sheets": ["Sheet1"],
                },
            },
        )
        assert count_response.status_code == 200
        count_data = count_response.json()
        assert count_data["isError"] is False


class TestMCPBase64RoundTrip:
    """Test base64 encoding/decoding round-trip."""

    def test_base64_encoding_preserves_file(self, client, simple_excel_file):
        """Test that base64 encoding and decoding preserves file integrity."""
        # Read original file
        with open(simple_excel_file, "rb") as f:
            original_content = f.read()

        # Encode to base64
        encoded = base64.b64encode(original_content).decode()

        # Decode and verify
        decoded = base64.b64decode(encoded)
        assert decoded == original_content

        # Use in MCP call
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "get_excel_sheets",
                "arguments": {
                    "file_content_base64": encoded,
                },
            },
        )
        assert response.status_code == 200
        assert response.json()["isError"] is False

    def test_base64_from_different_sources(self, client, simple_excel_file, excel_with_multiple_sheets):
        """Test that base64 from different files works correctly."""
        files = [simple_excel_file, excel_with_multiple_sheets]

        for excel_file in files:
            with open(excel_file, "rb") as f:
                content = f.read()
            encoded = base64.b64encode(content).decode()

            response = client.post(
                "/mcp/tools/call",
                json={
                    "name": "get_excel_sheets",
                    "arguments": {
                        "file_content_base64": encoded,
                    },
                },
            )
            assert response.status_code == 200
            assert response.json()["isError"] is False


class TestMCPErrorPropagation:
    """Test error propagation through the MCP stack."""

    def test_validation_error_propagates(self, client):
        """Test that validation errors are properly formatted."""
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "translate_excel",
                "arguments": {
                    "file_content_base64": "invalid-base64!!!",
                    "filename": "test.xlsx",
                    "target_language": "french",
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isError"] is True
        assert "content" in data
        assert len(data["content"]) > 0
        assert "text" in data["content"][0]

    def test_missing_required_field_error(self, client, excel_file_base64):
        """Test error when required field is missing."""
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "translate_excel",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                    # Missing filename and target_language
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["isError"] is True
        # Should mention validation or required fields
        error_text = data["content"][0]["text"].lower()
        assert "validation" in error_text or "required" in error_text

    def test_invalid_tool_name_error(self, client):
        """Test error when tool name doesn't exist."""
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "nonexistent_tool",
                "arguments": {},
            },
        )
        assert response.status_code == 400
        assert "Unknown tool" in response.json()["detail"]


class TestMCPResponseFormat:
    """Test that MCP responses follow the correct format."""

    def test_tool_response_format(self, client, excel_file_base64):
        """Test that tool responses follow MCP format."""
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "get_excel_sheets",
                "arguments": {
                    "file_content_base64": excel_file_base64,
                },
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Check MCP response structure
        assert "content" in data
        assert "isError" in data
        assert isinstance(data["content"], list)
        assert len(data["content"]) > 0

        # Check content item structure
        content_item = data["content"][0]
        assert "type" in content_item
        assert "text" in content_item
        assert content_item["type"] == "text"

    def test_error_response_format(self, client):
        """Test that error responses follow MCP format."""
        response = client.post(
            "/mcp/tools/call",
            json={
                "name": "get_excel_sheets",
                "arguments": {
                    "file_content_base64": "invalid",
                },
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert "isError" in data
        assert data["isError"] is True
        assert "content" in data
        assert isinstance(data["content"], list)
        assert len(data["content"]) > 0


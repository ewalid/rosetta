#!/usr/bin/env python3
"""Test script to verify MCP server tools work correctly with local files."""

import os
import tempfile
from pathlib import Path

from openpyxl import Workbook

from rosetta.api.mcp import TOOL_HANDLERS


def test_mcp_tools():
    """Test all MCP tools with a sample Excel file."""
    print("=" * 60)
    print("Testing Rosetta MCP Server Tools")
    print("=" * 60)

    # Create a temporary Excel file for testing
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        test_file_path = tmp.name

    try:
        # Create a simple test workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Test Sheet"

        # Add some test data
        test_data = [
            ["Hello", "World", "Testing"],
            ["This is", "a test", "file"],
            ["With some", "sample data", "for translation"],
        ]

        for row_idx, row_data in enumerate(test_data, start=1):
            for col_idx, cell_value in enumerate(row_data, start=1):
                ws.cell(row=row_idx, column=col_idx, value=cell_value)

        wb.save(test_file_path)
        print(f"\n✓ Created test file: {test_file_path}")

        # Test 1: Get sheets
        print("\n[1/5] Testing get_excel_sheets...")
        import base64
        with open(test_file_path, "rb") as f:
            base64_content = base64.b64encode(f.read()).decode("utf-8")
        result = TOOL_HANDLERS["get_excel_sheets"](
            {"file_content_base64": base64_content}
        )
        print(f"✓ Result: {result.content[0].text[:100]}...")

        # Test 2: Count cells
        print("\n[2/5] Testing count_translatable_cells...")
        result = TOOL_HANDLERS["count_translatable_cells"](
            {"file_content_base64": base64_content}
        )
        print(f"✓ Result: {result.content[0].text[:100]}...")

        # Test 3: Preview cells
        print("\n[3/5] Testing preview_cells...")
        result = TOOL_HANDLERS["preview_cells"](
            {"file_content_base64": base64_content, "limit": 5}
        )
        print(f"✓ Result: {result.content[0].text[:200]}...")

        # Test 4: Estimate cost
        print("\n[4/5] Testing estimate_translation_cost...")
        result = TOOL_HANDLERS["estimate_translation_cost"](
            {"file_content_base64": base64_content}
        )
        print(f"✓ Result: {result.content[0].text[:150]}...")

        # Test 5: Translation (small test)
        print("\n[5/5] Testing translate_excel...")
        result = TOOL_HANDLERS["translate_excel"](
            {
                "file_content_base64": base64_content,
                "filename": "test.xlsx",
                "target_language": "french",
                "source_language": "english",
            }
        )
        print(f"✓ Translation complete!")
        print(f"  Output preview: {result.content[0].text[:200]}...")

        print("\n" + "=" * 60)
        print("✅ All MCP tools passed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return 1

    finally:
        # Cleanup
        if os.path.exists(test_file_path):
            os.unlink(test_file_path)
            print(f"\n✓ Cleaned up test file")

    return 0


if __name__ == "__main__":
    exit_code = test_mcp_tools()
    exit(exit_code)

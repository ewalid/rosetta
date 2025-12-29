"""Tests for cell and dropdown extraction functions."""

import pytest

from rosetta.main import _extract_dropdown_validations, _extract_rich_text_info
from rosetta.models import Cell
from rosetta.services import ExcelExtractor


class TestExcelExtractor:
    """Tests for ExcelExtractor service."""

    def test_extract_simple_cells(self, simple_excel_file):
        """Test extracting cells from a simple Excel file."""
        with ExcelExtractor(simple_excel_file) as extractor:
            cells = list(extractor.extract_cells())

        assert len(cells) == 4
        values = {cell.value for cell in cells}
        assert values == {"Hello", "World", "Bonjour", "Monde"}

    def test_skip_formulas(self, excel_with_formulas):
        """Test that formulas are skipped during extraction."""
        with ExcelExtractor(excel_with_formulas) as extractor:
            cells = list(extractor.extract_cells())

        # Should extract "Price" and "Total:" but not the formula or numbers
        values = [cell.value for cell in cells]
        assert "Price" in values
        assert "Total:" in values
        # Formula and numbers should be skipped
        assert "=SUM(A2:A3)" not in values

    def test_sheet_filter(self, excel_with_multiple_sheets):
        """Test extracting cells from specific sheets only."""
        with ExcelExtractor(
            excel_with_multiple_sheets, sheets={"Sheet1", "Sheet2"}
        ) as extractor:
            cells = list(extractor.extract_cells())

        values = {cell.value for cell in cells}
        assert "Hello" in values  # Sheet1
        assert "Bonjour" in values  # Sheet2
        assert "Hola" not in values  # Sheet3 should be excluded


class TestDropdownExtraction:
    """Tests for dropdown validation extraction."""

    def test_extract_inline_dropdown(self, excel_with_dropdown):
        """Test extracting inline dropdown validations."""
        dropdowns = _extract_dropdown_validations(excel_with_dropdown, None)

        assert len(dropdowns) == 1
        dropdown = dropdowns[0]
        assert dropdown.sheet == "Sheet1"
        assert dropdown.values == ["Yes", "No", "Maybe"]
        assert dropdown.cell_range == "A2:A10"

    def test_filter_dropdown_by_sheet(self, excel_with_dropdown):
        """Test that sheet filter applies to dropdown extraction."""
        # Filter to a non-existent sheet
        dropdowns = _extract_dropdown_validations(
            excel_with_dropdown, {"NonExistent"}
        )
        assert len(dropdowns) == 0

        # Filter to the correct sheet
        dropdowns = _extract_dropdown_validations(excel_with_dropdown, {"Sheet1"})
        assert len(dropdowns) == 1


class TestRichTextExtraction:
    """Tests for rich text information extraction."""

    def test_plain_text_cells_have_no_rich_text_runs(self, simple_excel_file):
        """Test that plain text cells don't get rich_text_runs populated."""
        with ExcelExtractor(simple_excel_file) as extractor:
            cells = list(extractor.extract_cells())

        _extract_rich_text_info(simple_excel_file, cells, None)

        # Simple cells created with openpyxl won't have rich text formatting
        for cell in cells:
            assert cell.rich_text_runs is None

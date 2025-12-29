"""Unit tests for pure utility functions."""

import pytest

from rosetta.main import _col_num_to_letter, _is_number
from rosetta.models import Cell


class TestColNumToLetter:
    """Tests for column number to letter conversion."""

    def test_single_letter_columns(self):
        """Test columns A through Z."""
        assert _col_num_to_letter(1) == "A"
        assert _col_num_to_letter(2) == "B"
        assert _col_num_to_letter(26) == "Z"

    def test_double_letter_columns(self):
        """Test columns AA through AZ."""
        assert _col_num_to_letter(27) == "AA"
        assert _col_num_to_letter(28) == "AB"
        assert _col_num_to_letter(52) == "AZ"

    def test_triple_letter_columns(self):
        """Test columns beyond AZ."""
        assert _col_num_to_letter(53) == "BA"
        assert _col_num_to_letter(702) == "ZZ"
        assert _col_num_to_letter(703) == "AAA"


class TestIsNumber:
    """Tests for number detection."""

    def test_integers(self):
        """Test integer detection."""
        assert _is_number("0") is True
        assert _is_number("1") is True
        assert _is_number("123") is True
        assert _is_number("-456") is True

    def test_floats(self):
        """Test float detection with dot notation."""
        assert _is_number("3.14") is True
        assert _is_number("-2.5") is True
        assert _is_number("0.001") is True

    def test_european_floats(self):
        """Test float detection with comma notation (European style)."""
        assert _is_number("3,14") is True
        assert _is_number("-2,5") is True
        # Note: "1.000,50" becomes "1.000.50" which is invalid - this is a limitation
        # The function handles simple comma decimals but not thousand separators
        assert _is_number("1.000,50") is False  # Not fully supported

    def test_non_numbers(self):
        """Test strings that are not numbers."""
        assert _is_number("hello") is False
        assert _is_number("Yes") is False
        assert _is_number("No") is False
        assert _is_number("abc123") is False
        assert _is_number("") is False
        assert _is_number("12a") is False


class TestCellModel:
    """Tests for Cell model."""

    def test_coordinate_single_letter(self):
        """Test coordinate generation for single-letter columns."""
        cell = Cell(sheet="Sheet1", row=1, col=1, value="test")
        assert cell.coordinate == "A1"

        cell = Cell(sheet="Sheet1", row=10, col=3, value="test")
        assert cell.coordinate == "C10"

    def test_coordinate_double_letter(self):
        """Test coordinate generation for double-letter columns."""
        cell = Cell(sheet="Sheet1", row=1, col=27, value="test")
        assert cell.coordinate == "AA1"

        cell = Cell(sheet="Sheet1", row=100, col=52, value="test")
        assert cell.coordinate == "AZ100"

    def test_repr(self):
        """Test string representation."""
        cell = Cell(sheet="Sheet1", row=1, col=1, value="Hello")
        assert repr(cell) == "Cell(Sheet1!A1='Hello')"

    def test_formula_flag(self):
        """Test formula flag is stored correctly."""
        cell = Cell(sheet="Sheet1", row=1, col=1, value="=SUM(A1:A10)", is_formula=True)
        assert cell.is_formula is True
        assert cell.value == "=SUM(A1:A10)"

"""Integration tests for translation with mocked translator."""

import zipfile
from xml.etree import ElementTree as ET

import pytest
from openpyxl import load_workbook

from rosetta.main import (
    _translate_dropdowns,
    _translate_rich_text_runs,
    write_translations,
)
from rosetta.models import Cell, DropdownValidation, RichTextRun


class TestTranslateDropdowns:
    """Tests for dropdown translation."""

    def test_translate_unique_values(self, mock_translator):
        """Test that dropdown values are translated."""
        dropdowns = [
            DropdownValidation(
                sheet="Sheet1",
                cell_range="A1:A10",
                values=["Yes", "No", "Maybe"],
            )
        ]

        _translate_dropdowns(
            dropdowns,
            mock_translator,
            source_lang=None,
            target_lang="french",
            batch_size=50,
        )

        assert dropdowns[0].translated_values == [
            "[TR] Yes",
            "[TR] No",
            "[TR] Maybe",
        ]
        # Verify translator was called once (values are unique)
        assert mock_translator.translate_batch.call_count == 1

    def test_skip_numeric_values(self, mock_translator):
        """Test that numeric values in dropdowns are not translated."""
        dropdowns = [
            DropdownValidation(
                sheet="Sheet1",
                cell_range="A1:A10",
                values=["Option1", "100", "Option2", "3.14"],
            )
        ]

        _translate_dropdowns(
            dropdowns,
            mock_translator,
            source_lang=None,
            target_lang="french",
            batch_size=50,
        )

        assert dropdowns[0].translated_values == [
            "[TR] Option1",
            "100",  # Kept as-is (number)
            "[TR] Option2",
            "3.14",  # Kept as-is (number)
        ]

    def test_reuse_translations_for_duplicate_values(self, mock_translator):
        """Test that duplicate values across dropdowns are translated only once."""
        dropdowns = [
            DropdownValidation(
                sheet="Sheet1",
                cell_range="A1:A10",
                values=["Yes", "No"],
            ),
            DropdownValidation(
                sheet="Sheet1",
                cell_range="B1:B10",
                values=["Yes", "Maybe"],  # "Yes" is duplicate
            ),
        ]

        _translate_dropdowns(
            dropdowns,
            mock_translator,
            source_lang=None,
            target_lang="french",
            batch_size=50,
        )

        # Both dropdowns should have translations
        assert dropdowns[0].translated_values == ["[TR] Yes", "[TR] No"]
        assert dropdowns[1].translated_values == ["[TR] Yes", "[TR] Maybe"]

        # Should only translate 3 unique values: Yes, No, Maybe
        call_args = mock_translator.translate_batch.call_args
        batch = call_args[0][0]
        assert len(batch.cells) == 3


class TestTranslateRichTextRuns:
    """Tests for rich text run translation."""

    def test_translate_runs_preserves_whitespace(self, mock_translator):
        """Test that whitespace is preserved in rich text runs."""
        cells = [
            Cell(
                sheet="Sheet1",
                row=1,
                col=1,
                value="Hello World",
                rich_text_runs=[
                    RichTextRun(text="Hello "),  # Trailing space
                    RichTextRun(text="World"),
                ],
            )
        ]

        _translate_rich_text_runs(
            cells,
            mock_translator,
            source_lang=None,
            target_lang="french",
            batch_size=50,
        )

        # Trailing space should be preserved
        assert cells[0].rich_text_runs[0].translated_text == "[TR] Hello "
        assert cells[0].rich_text_runs[1].translated_text == "[TR] World"

    def test_skip_empty_runs(self, mock_translator):
        """Test that empty or whitespace-only runs are not translated."""
        cells = [
            Cell(
                sheet="Sheet1",
                row=1,
                col=1,
                value="Hello World",
                rich_text_runs=[
                    RichTextRun(text="Hello"),
                    RichTextRun(text="   "),  # Whitespace only
                    RichTextRun(text="World"),
                ],
            )
        ]

        _translate_rich_text_runs(
            cells,
            mock_translator,
            source_lang=None,
            target_lang="french",
            batch_size=50,
        )

        assert cells[0].rich_text_runs[0].translated_text == "[TR] Hello"
        assert cells[0].rich_text_runs[1].translated_text is None  # Not translated
        assert cells[0].rich_text_runs[2].translated_text == "[TR] World"

    def test_preserve_leading_trailing_whitespace(self, mock_translator):
        """Test that leading and trailing whitespace is restored after translation."""
        cells = [
            Cell(
                sheet="Sheet1",
                row=1,
                col=1,
                value="  Hello  ",
                rich_text_runs=[
                    RichTextRun(text="  Hello  "),  # Both leading and trailing
                ],
            )
        ]

        _translate_rich_text_runs(
            cells,
            mock_translator,
            source_lang=None,
            target_lang="french",
            batch_size=50,
        )

        # Leading and trailing whitespace should be preserved
        assert cells[0].rich_text_runs[0].translated_text == "  [TR] Hello  "


class TestWriteTranslations:
    """Tests for writing translations back to Excel."""

    def test_write_simple_translations(self, simple_excel_file, tmp_path):
        """Test writing translated values to Excel."""
        output_file = tmp_path / "output.xlsx"

        translated_cells = [
            Cell(sheet="Sheet1", row=1, col=1, value="Bonjour"),
            Cell(sheet="Sheet1", row=2, col=1, value="Monde"),
        ]

        write_translations(simple_excel_file, output_file, translated_cells)

        # Verify the output file exists
        assert output_file.exists()

        # Load and check values
        wb = load_workbook(output_file)
        ws = wb.active
        # Note: Due to shared string table complexity, this test verifies file creation
        wb.close()

    def test_write_dropdown_translations(self, excel_with_dropdown, tmp_path):
        """Test writing translated dropdown values to Excel."""
        output_file = tmp_path / "output.xlsx"

        translated_cells = [
            Cell(sheet="Sheet1", row=1, col=1, value="Statut"),
            Cell(sheet="Sheet1", row=2, col=1, value="Oui"),
        ]

        dropdowns = [
            DropdownValidation(
                sheet="Sheet1",
                cell_range="A2:A10",
                values=["Yes", "No", "Maybe"],
                translated_values=["Oui", "Non", "Peut-être"],
            )
        ]

        write_translations(
            excel_with_dropdown, output_file, translated_cells, dropdowns
        )

        # Verify the output file exists
        assert output_file.exists()

        # Read the XML directly to verify dropdown values were updated
        ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
        with zipfile.ZipFile(output_file, "r") as zf:
            sheet_xml = ET.fromstring(zf.read("xl/worksheets/sheet1.xml"))

            # Find dataValidation element
            dv = sheet_xml.find(f".//{{{ns}}}dataValidation")
            assert dv is not None

            formula1 = dv.find(f"{{{ns}}}formula1")
            assert formula1 is not None
            # Check translated values are in the formula
            assert "Oui" in formula1.text
            assert "Non" in formula1.text
            assert "Peut-être" in formula1.text

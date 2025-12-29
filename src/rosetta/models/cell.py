"""Data models for Excel cells and translations."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class RichTextRun:
    """Represents a single run of text with formatting in a rich text cell."""

    text: str
    translated_text: Optional[str] = None


@dataclass
class Cell:
    """Represents an Excel cell with its content and metadata."""

    sheet: str
    row: int
    col: int
    value: str
    is_formula: bool = False
    original_value: Optional[str] = None
    # For rich text cells: list of text runs that should be translated separately
    rich_text_runs: Optional[list[RichTextRun]] = None
    # Shared string index for this cell (if applicable)
    shared_string_index: Optional[int] = None

    @property
    def coordinate(self) -> str:
        """Return cell coordinate (e.g., 'A1', 'B2')."""
        col_letter = self._col_num_to_letter(self.col)
        return f"{col_letter}{self.row}"

    @staticmethod
    def _col_num_to_letter(col: int) -> str:
        """Convert column number to Excel letter (1 -> 'A', 27 -> 'AA')."""
        result = ""
        while col > 0:
            col -= 1
            result = chr(col % 26 + ord("A")) + result
            col //= 26
        return result

    def __repr__(self) -> str:
        return f"Cell({self.sheet}!{self.coordinate}={self.value!r})"


@dataclass
class DropdownValidation:
    """Represents an inline dropdown data validation with translatable values."""

    sheet: str
    cell_range: str  # e.g., "B5:B10"
    values: list[str]  # Original dropdown values
    translated_values: Optional[list[str]] = None


@dataclass
class TranslationBatch:
    """A batch of cells to translate together."""

    cells: list[Cell]
    source_lang: Optional[str] = None
    target_lang: str = "english"
    context: Optional[str] = None  # Additional context for more accurate translations

    def __len__(self) -> int:
        return len(self.cells)

    @property
    def texts(self) -> list[str]:
        """Extract just the text values from cells."""
        return [cell.value for cell in self.cells]

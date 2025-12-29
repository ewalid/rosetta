"""Data models for Excel cells and translations."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Cell:
    """Represents an Excel cell with its content and metadata."""

    sheet: str
    row: int
    col: int
    value: str
    is_formula: bool = False
    original_value: Optional[str] = None

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
class TranslationBatch:
    """A batch of cells to translate together."""

    cells: list[Cell]
    source_lang: Optional[str] = None
    target_lang: str = "english"

    def __len__(self) -> int:
        return len(self.cells)

    @property
    def texts(self) -> list[str]:
        """Extract just the text values from cells."""
        return [cell.value for cell in self.cells]

"""High-level translation service for the API."""

from pathlib import Path
from typing import Optional

from rosetta.core.config import Config
from rosetta.models import TranslationBatch
from rosetta.services import ExcelExtractor, Translator


def translate_file(
    input_file: Path,
    output_file: Path,
    target_lang: str,
    source_lang: Optional[str] = None,
    context: Optional[str] = None,
    sheets: Optional[set[str]] = None,
    batch_size: int = 50,
) -> dict:
    """Translate an Excel file.

    Args:
        input_file: Path to input Excel file
        output_file: Path for translated output file
        target_lang: Target language for translation
        source_lang: Source language (auto-detected if None)
        context: Additional context for translations
        sheets: Set of sheet names to translate (all if None)
        batch_size: Number of cells per API batch

    Returns:
        Dict with translation stats
    """
    from rosetta.main import (
        _extract_dropdown_validations,
        _extract_rich_text_info,
        _translate_dropdowns,
        _translate_rich_text_runs,
        write_translations,
    )

    config = Config.from_env()
    config.batch_size = batch_size
    translator = Translator(config)

    # Extract cells
    with ExcelExtractor(input_file, sheets=sheets) as extractor:
        cells = list(extractor.extract_cells())

    # Enrich with rich text info
    _extract_rich_text_info(input_file, cells, sheets)

    if not cells:
        return {"cell_count": 0, "status": "no_content"}

    # Translate in batches
    translated_cells = []
    for i in range(0, len(cells), config.batch_size):
        batch_cells = cells[i : i + config.batch_size]
        batch = TranslationBatch(
            cells=batch_cells,
            source_lang=source_lang,
            target_lang=target_lang,
            context=context,
        )
        translations = translator.translate_batch(batch)

        for cell, translation in zip(batch_cells, translations):
            cell.value = translation
            translated_cells.append(cell)

    # Translate rich text runs
    rich_text_cells = [c for c in translated_cells if c.rich_text_runs]
    if rich_text_cells:
        _translate_rich_text_runs(
            rich_text_cells,
            translator,
            source_lang,
            target_lang,
            config.batch_size,
            context,
        )

    # Translate dropdowns
    dropdowns = _extract_dropdown_validations(input_file, sheets)
    if dropdowns:
        _translate_dropdowns(
            dropdowns,
            translator,
            source_lang,
            target_lang,
            config.batch_size,
            context,
        )

    # Write output
    write_translations(input_file, output_file, translated_cells, dropdowns)

    return {
        "cell_count": len(translated_cells),
        "rich_text_cells": len(rich_text_cells),
        "dropdown_count": len(dropdowns) if dropdowns else 0,
        "status": "completed",
    }


def count_cells(input_file: Path, sheets: Optional[set[str]] = None) -> int:
    """Count translatable cells in a file (for validation before translation)."""
    with ExcelExtractor(input_file, sheets=sheets) as extractor:
        return sum(1 for _ in extractor.extract_cells())

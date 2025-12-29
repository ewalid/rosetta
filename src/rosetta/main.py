"""CLI entry point for Rosetta."""

from pathlib import Path
from typing import Optional

import click
from openpyxl import load_workbook

from rosetta.core.config import Config
from rosetta.core.exceptions import RosettaError
from rosetta.models import TranslationBatch
from rosetta.services import ExcelExtractor, Translator


@click.command()
@click.argument("input_file", type=click.Path(exists=True, path_type=Path))
@click.option(
    "--target-lang",
    "-t",
    required=True,
    help="Target language for translation (e.g., french, spanish, german)",
)
@click.option(
    "--source-lang",
    "-s",
    default=None,
    help="Source language (auto-detected if not specified)",
)
@click.option(
    "--output",
    "-o",
    type=click.Path(path_type=Path),
    default=None,
    help="Output file path (default: input_translated.xlsx)",
)
@click.option(
    "--batch-size",
    "-b",
    type=int,
    default=50,
    help="Number of cells to translate in each batch",
)
def cli(
    input_file: Path,
    target_lang: str,
    source_lang: Optional[str],
    output: Optional[Path],
    batch_size: int,
) -> None:
    """Translate Excel files while preserving formatting and formulas.

    INPUT_FILE: Path to the Excel file to translate
    """
    try:
        # Determine output path
        if output is None:
            output = input_file.parent / f"{input_file.stem}_translated{input_file.suffix}"

        click.echo(f"Translating {input_file} to {target_lang}...")

        # Load configuration
        config = Config.from_env()
        config.batch_size = batch_size

        # Extract translatable cells
        with ExcelExtractor(input_file) as extractor:
            cells = list(extractor.extract_cells())

        if not cells:
            click.echo("No translatable content found in the file.")
            return

        click.echo(f"Found {len(cells)} cells to translate")

        # Translate in batches
        translator = Translator(config)
        translated_cells = []

        for i in range(0, len(cells), config.batch_size):
            batch_cells = cells[i : i + config.batch_size]
            batch = TranslationBatch(
                cells=batch_cells,
                source_lang=source_lang,
                target_lang=target_lang,
            )

            click.echo(
                f"Translating batch {i // config.batch_size + 1} "
                f"({len(batch_cells)} cells)..."
            )

            translations = translator.translate_batch(batch)

            # Update cell values with translations
            for cell, translation in zip(batch_cells, translations):
                cell.value = translation
                translated_cells.append(cell)

        # Write translations back to Excel
        click.echo(f"Writing translations to {output}...")
        write_translations(input_file, output, translated_cells)

        click.echo(f"✓ Translation complete! Output: {output}")

    except RosettaError as e:
        click.echo(f"Error: {e}", err=True)
        raise click.Abort()
    except Exception as e:
        click.echo(f"Unexpected error: {e}", err=True)
        raise click.Abort()


def write_translations(
    input_file: Path, output_file: Path, translated_cells: list
) -> None:
    """Write translated cells back to a new Excel file.

    This preserves all formatting, formulas, and structure from the original file.
    """
    # Load the original workbook
    workbook = load_workbook(input_file)

    # Update cells with translations
    for cell in translated_cells:
        sheet = workbook[cell.sheet]
        sheet.cell(row=cell.row, column=cell.col).value = cell.value

    # Save to output file
    workbook.save(output_file)
    workbook.close()


if __name__ == "__main__":
    cli()

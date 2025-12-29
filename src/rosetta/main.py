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
@click.option(
    "--sheets",
    multiple=True,
    default=None,
    help="Sheet names to translate (can be used multiple times). Translates all sheets if not specified.",
)
def cli(
    input_file: Path,
    target_lang: str,
    source_lang: Optional[str],
    output: Optional[Path],
    batch_size: int,
    sheets: tuple[str, ...],
) -> None:
    """Translate Excel files while preserving formatting and formulas.

    INPUT_FILE: Path to the Excel file to translate
    """
    try:
        # Determine output path
        if output is None:
            output = input_file.parent / f"{input_file.stem}_translated{input_file.suffix}"
        elif output.suffix.lower() not in (".xlsx", ".xlsm", ".xltx", ".xltm"):
            output = Path(str(output) + ".xlsx")

        click.echo(f"Translating {input_file} to {target_lang}...")

        # Load configuration
        config = Config.from_env()
        config.batch_size = batch_size

        # Extract translatable cells
        sheets_filter = set(sheets) if sheets else None
        with ExcelExtractor(input_file, sheets=sheets_filter) as extractor:
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

    This preserves all formatting, formulas, structure, images, and data validations
    from the original file by directly modifying the XML inside the xlsx.
    """
    import shutil
    import zipfile
    import tempfile
    from xml.etree import ElementTree as ET

    # Copy the original file to preserve all content
    shutil.copy2(input_file, output_file)

    # Group cells by sheet
    cells_by_sheet: dict[str, list] = {}
    for cell in translated_cells:
        if cell.sheet not in cells_by_sheet:
            cells_by_sheet[cell.sheet] = []
        cells_by_sheet[cell.sheet].append(cell)

    # Get sheet name to XML file mapping
    with zipfile.ZipFile(output_file, "r") as zf:
        workbook_xml = ET.fromstring(zf.read("xl/workbook.xml"))

    ns = {
        "": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
        "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    }

    # Build sheet name -> rId mapping
    sheet_rid_map = {}
    for sheet in workbook_xml.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet"):
        sheet_rid_map[sheet.get("name")] = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")

    # Get rId -> file path mapping
    with zipfile.ZipFile(output_file, "r") as zf:
        rels_xml = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))

    rid_file_map = {}
    for rel in rels_xml.findall(".//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"):
        rid_file_map[rel.get("Id")] = "xl/" + rel.get("Target")

    # Modify each sheet's XML directly
    with zipfile.ZipFile(output_file, "r") as zf_in:
        # Create a temp file for the new zip
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            tmp_path = tmp.name

        with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zf_out:
            for item in zf_in.infolist():
                data = zf_in.read(item.filename)

                # Check if this is a sheet we need to modify
                modified = False
                for sheet_name, cells in cells_by_sheet.items():
                    rid = sheet_rid_map.get(sheet_name)
                    if rid and rid_file_map.get(rid) == item.filename:
                        # Modify this sheet
                        data = _update_sheet_xml(data, cells)
                        modified = True
                        break

                zf_out.writestr(item, data)

    # Replace original with modified
    shutil.move(tmp_path, output_file)


def _update_sheet_xml(xml_data: bytes, cells: list) -> bytes:
    """Update cell values in sheet XML."""
    from xml.etree import ElementTree as ET

    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    ET.register_namespace("", ns)
    ET.register_namespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
    ET.register_namespace("mc", "http://schemas.openxmlformats.org/markup-compatibility/2006")
    ET.register_namespace("x14ac", "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac")

    root = ET.fromstring(xml_data)

    # Build a map of cell references to new values
    cell_updates = {}
    for cell in cells:
        col_letter = _col_num_to_letter(cell.col)
        cell_ref = f"{col_letter}{cell.row}"
        cell_updates[cell_ref] = cell.value

    # Find and update cells
    sheet_data = root.find(f".//{{{ns}}}sheetData")
    if sheet_data is not None:
        for row in sheet_data.findall(f"{{{ns}}}row"):
            for c in row.findall(f"{{{ns}}}c"):
                ref = c.get("r")
                if ref in cell_updates:
                    # Update the cell value
                    v = c.find(f"{{{ns}}}v")
                    if v is None:
                        v = ET.SubElement(c, f"{{{ns}}}v")
                    v.text = str(cell_updates[ref])
                    # Remove type attribute if it was shared string, set to inline string
                    if c.get("t") == "s":
                        c.set("t", "str")

    return ET.tostring(root, encoding="UTF-8", xml_declaration=True)


def _col_num_to_letter(col: int) -> str:
    """Convert column number (1-indexed) to Excel letter (A, B, ..., Z, AA, etc.)."""
    result = ""
    while col > 0:
        col, remainder = divmod(col - 1, 26)
        result = chr(65 + remainder) + result
    return result


if __name__ == "__main__":
    cli()

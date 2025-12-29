"""CLI entry point for Rosetta."""

from pathlib import Path
from typing import Optional

import click
from openpyxl import load_workbook

from rosetta.core.config import Config
from rosetta.core.exceptions import RosettaError
from rosetta.models import Cell, DropdownValidation, RichTextRun, TranslationBatch
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

        # Extract translatable cells (including rich text info)
        sheets_filter = set(sheets) if sheets else None
        with ExcelExtractor(input_file, sheets=sheets_filter) as extractor:
            cells = list(extractor.extract_cells())

        # Enrich cells with rich text information from the xlsx
        _extract_rich_text_info(input_file, cells, sheets_filter)

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

        # For rich text cells, translate each run separately
        rich_text_cells = [c for c in translated_cells if c.rich_text_runs]
        if rich_text_cells:
            click.echo(f"Translating {len(rich_text_cells)} rich text cells with formatting...")
            _translate_rich_text_runs(rich_text_cells, translator, source_lang, target_lang, config.batch_size)

        # Extract and translate inline dropdown values
        dropdowns = _extract_dropdown_validations(input_file, sheets_filter)
        if dropdowns:
            click.echo(f"Translating {len(dropdowns)} dropdown lists...")
            _translate_dropdowns(dropdowns, translator, source_lang, target_lang, config.batch_size)

        # Write translations back to Excel
        click.echo(f"Writing translations to {output}...")
        write_translations(input_file, output, translated_cells, dropdowns)

        click.echo(f"✓ Translation complete! Output: {output}")

    except RosettaError as e:
        click.echo(f"Error: {e}", err=True)
        raise click.Abort()
    except Exception as e:
        click.echo(f"Unexpected error: {e}", err=True)
        raise click.Abort()


def _extract_rich_text_info(input_file: Path, cells: list[Cell], sheets_filter: Optional[set[str]]) -> None:
    """Extract rich text run information from the xlsx file.

    This reads the shared strings XML to identify cells with rich text formatting
    and stores the individual runs for separate translation.
    """
    import zipfile
    from xml.etree import ElementTree as ET

    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    ns_r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    ns_pkg = "http://schemas.openxmlformats.org/package/2006/relationships"

    with zipfile.ZipFile(input_file, "r") as zf:
        # Read shared strings
        if "xl/sharedStrings.xml" not in zf.namelist():
            return

        shared_strings_xml = ET.fromstring(zf.read("xl/sharedStrings.xml"))
        si_elements = shared_strings_xml.findall(f"{{{ns}}}si")

        # Build a map of shared string index -> rich text runs
        rich_text_map: dict[int, list[RichTextRun]] = {}
        for idx, si in enumerate(si_elements):
            runs = si.findall(f"{{{ns}}}r")
            if runs:
                # This is a rich text entry
                run_texts = []
                for r in runs:
                    t = r.find(f"{{{ns}}}t")
                    text = t.text if t is not None and t.text else ""
                    run_texts.append(RichTextRun(text=text))
                rich_text_map[idx] = run_texts

        if not rich_text_map:
            return

        # Read workbook structure
        workbook_xml = ET.fromstring(zf.read("xl/workbook.xml"))
        rels_xml = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))

        # Build sheet name -> file path mapping
        sheet_rid_map = {}
        for sheet in workbook_xml.findall(f".//{{{ns}}}sheet"):
            sheet_rid_map[sheet.get("name")] = sheet.get(f"{{{ns_r}}}id")

        rid_file_map = {}
        for rel in rels_xml.findall(f".//{{{ns_pkg}}}Relationship"):
            target = rel.get("Target")
            if target.startswith("/"):
                rid_file_map[rel.get("Id")] = target[1:]
            elif target.startswith("xl/"):
                rid_file_map[rel.get("Id")] = target
            else:
                rid_file_map[rel.get("Id")] = "xl/" + target

        # Build cell coordinate -> shared string index mapping
        cell_ss_map: dict[tuple[str, str], int] = {}  # (sheet, coord) -> ss_index

        for sheet_name, rid in sheet_rid_map.items():
            if sheets_filter and sheet_name not in sheets_filter:
                continue

            sheet_path = rid_file_map.get(rid)
            if not sheet_path or sheet_path not in zf.namelist():
                continue

            sheet_xml = ET.fromstring(zf.read(sheet_path))
            sheet_data = sheet_xml.find(f".//{{{ns}}}sheetData")
            if sheet_data is None:
                continue

            for row in sheet_data.findall(f"{{{ns}}}row"):
                for c in row.findall(f"{{{ns}}}c"):
                    if c.get("t") == "s":  # Shared string
                        v = c.find(f"{{{ns}}}v")
                        if v is not None and v.text:
                            try:
                                ss_idx = int(v.text)
                                cell_ref = c.get("r")
                                cell_ss_map[(sheet_name, cell_ref)] = ss_idx
                            except ValueError:
                                pass

    # Enrich cells with rich text info
    for cell in cells:
        key = (cell.sheet, cell.coordinate)
        if key in cell_ss_map:
            ss_idx = cell_ss_map[key]
            cell.shared_string_index = ss_idx
            if ss_idx in rich_text_map:
                cell.rich_text_runs = rich_text_map[ss_idx]


def _translate_rich_text_runs(
    cells: list[Cell],
    translator: Translator,
    source_lang: Optional[str],
    target_lang: str,
    batch_size: int,
) -> None:
    """Translate individual rich text runs for cells with formatting.

    This ensures that each formatted segment gets translated independently,
    preserving the exact formatting boundaries and whitespace.
    """
    # Collect all runs that need translation, preserving whitespace info
    runs_to_translate: list[tuple[Cell, int, RichTextRun, str, str]] = []
    for cell in cells:
        if cell.rich_text_runs:
            for i, run in enumerate(cell.rich_text_runs):
                if run.text.strip():  # Only translate non-empty runs
                    # Capture leading and trailing whitespace
                    leading_ws = run.text[: len(run.text) - len(run.text.lstrip())]
                    trailing_ws = run.text[len(run.text.rstrip()) :]
                    runs_to_translate.append((cell, i, run, leading_ws, trailing_ws))

    if not runs_to_translate:
        return

    # Create dummy cells for each run to use the existing translation infrastructure
    # Send stripped text to avoid Claude stripping it inconsistently
    run_cells = []
    for cell, run_idx, run, leading_ws, trailing_ws in runs_to_translate:
        run_cell = Cell(
            sheet=cell.sheet,
            row=cell.row,
            col=cell.col,
            value=run.text.strip(),  # Send stripped text
            original_value=run.text,
        )
        run_cells.append(run_cell)

    # Translate in batches
    for i in range(0, len(run_cells), batch_size):
        batch_cells = run_cells[i : i + batch_size]
        batch = TranslationBatch(
            cells=batch_cells,
            source_lang=source_lang,
            target_lang=target_lang,
        )
        translations = translator.translate_batch(batch)

        for run_cell, translation in zip(batch_cells, translations):
            run_cell.value = translation

    # Map translations back to the original runs, restoring whitespace
    for (cell, run_idx, run, leading_ws, trailing_ws), run_cell in zip(
        runs_to_translate, run_cells
    ):
        # Restore the original leading/trailing whitespace
        run.translated_text = leading_ws + run_cell.value.strip() + trailing_ws


def _extract_dropdown_validations(
    input_file: Path, sheets_filter: Optional[set[str]]
) -> list[DropdownValidation]:
    """Extract inline dropdown data validations from sheet XML.

    Only extracts validations with type="list" and inline values (formula1 starts with quotes).
    Range-based dropdowns are skipped as their source cells are already translated.
    """
    import zipfile
    from xml.etree import ElementTree as ET

    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    ns_r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    ns_pkg = "http://schemas.openxmlformats.org/package/2006/relationships"

    dropdowns: list[DropdownValidation] = []

    with zipfile.ZipFile(input_file, "r") as zf:
        # Read workbook structure
        workbook_xml = ET.fromstring(zf.read("xl/workbook.xml"))
        rels_xml = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))

        # Build sheet name -> file path mapping
        sheet_rid_map = {}
        for sheet in workbook_xml.findall(f".//{{{ns}}}sheet"):
            sheet_rid_map[sheet.get("name")] = sheet.get(f"{{{ns_r}}}id")

        rid_file_map = {}
        for rel in rels_xml.findall(f".//{{{ns_pkg}}}Relationship"):
            target = rel.get("Target")
            if target.startswith("/"):
                rid_file_map[rel.get("Id")] = target[1:]
            elif target.startswith("xl/"):
                rid_file_map[rel.get("Id")] = target
            else:
                rid_file_map[rel.get("Id")] = "xl/" + target

        # Check each sheet for data validations
        for sheet_name, rid in sheet_rid_map.items():
            if sheets_filter and sheet_name not in sheets_filter:
                continue

            sheet_path = rid_file_map.get(rid)
            if not sheet_path or sheet_path not in zf.namelist():
                continue

            sheet_xml = ET.fromstring(zf.read(sheet_path))

            # Find data validations
            for dv in sheet_xml.findall(f".//{{{ns}}}dataValidation"):
                if dv.get("type") != "list":
                    continue

                formula1 = dv.find(f"{{{ns}}}formula1")
                if formula1 is None or not formula1.text:
                    continue

                # Check if this is an inline list (starts with quote)
                formula_text = formula1.text.strip()
                if not formula_text.startswith('"'):
                    # This is a range reference, skip it
                    continue

                # Parse the inline values: "Value1,Value2,Value3"
                # Remove surrounding quotes and split by comma
                values_str = formula_text.strip('"')
                values = [v.strip() for v in values_str.split(",")]

                # Filter out empty values and values that are just numbers
                translatable_values = [
                    v for v in values if v and not _is_number(v)
                ]

                if translatable_values:
                    dropdowns.append(
                        DropdownValidation(
                            sheet=sheet_name,
                            cell_range=dv.get("sqref", ""),
                            values=values,  # Keep all original values
                        )
                    )

    return dropdowns


def _is_number(s: str) -> bool:
    """Check if a string is a number."""
    try:
        float(s.replace(",", "."))
        return True
    except ValueError:
        return False


def _translate_dropdowns(
    dropdowns: list[DropdownValidation],
    translator: Translator,
    source_lang: Optional[str],
    target_lang: str,
    batch_size: int,
) -> None:
    """Translate dropdown values.

    Collects all unique dropdown values, translates them, and maps back.
    """
    # Collect all unique values to translate
    unique_values: dict[str, str] = {}  # original -> translated
    values_to_translate: list[str] = []

    for dropdown in dropdowns:
        for value in dropdown.values:
            if value and not _is_number(value) and value not in unique_values:
                unique_values[value] = value  # placeholder
                values_to_translate.append(value)

    if not values_to_translate:
        return

    # Create dummy cells for translation
    dummy_cells = [
        Cell(sheet="", row=0, col=0, value=v) for v in values_to_translate
    ]

    # Translate in batches
    for i in range(0, len(dummy_cells), batch_size):
        batch_cells = dummy_cells[i : i + batch_size]
        batch = TranslationBatch(
            cells=batch_cells,
            source_lang=source_lang,
            target_lang=target_lang,
        )
        translations = translator.translate_batch(batch)

        for cell, translation in zip(batch_cells, translations):
            unique_values[cell.value] = translation

    # Map translations back to dropdowns
    for dropdown in dropdowns:
        dropdown.translated_values = [
            unique_values.get(v, v) if not _is_number(v) else v
            for v in dropdown.values
        ]


def write_translations(
    input_file: Path,
    output_file: Path,
    translated_cells: list,
    dropdowns: Optional[list[DropdownValidation]] = None,
) -> None:
    """Write translated cells back to a new Excel file.

    This preserves all formatting, formulas, structure, images, data validations,
    and rich text formatting (bold, colors, fonts) from the original file by
    updating the shared strings table directly.
    """
    import shutil
    import zipfile
    import tempfile
    from xml.etree import ElementTree as ET

    # Copy the original file to preserve all content
    shutil.copy2(input_file, output_file)

    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    ns_r = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    ns_pkg = "http://schemas.openxmlformats.org/package/2006/relationships"

    # Group cells by sheet
    cells_by_sheet: dict[str, list] = {}
    for cell in translated_cells:
        if cell.sheet not in cells_by_sheet:
            cells_by_sheet[cell.sheet] = []
        cells_by_sheet[cell.sheet].append(cell)

    # Build cell ref -> new value mapping
    cell_updates: dict[str, dict] = {}  # {sheet_name: {cell_ref: cell}}
    for cell in translated_cells:
        if cell.sheet not in cell_updates:
            cell_updates[cell.sheet] = {}
        col_letter = _col_num_to_letter(cell.col)
        cell_ref = f"{col_letter}{cell.row}"
        cell_updates[cell.sheet][cell_ref] = cell

    # Read necessary XML files from the archive
    with zipfile.ZipFile(output_file, "r") as zf:
        workbook_xml = ET.fromstring(zf.read("xl/workbook.xml"))
        rels_xml = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))

        # Read shared strings if it exists
        shared_strings_data = None
        if "xl/sharedStrings.xml" in zf.namelist():
            shared_strings_data = zf.read("xl/sharedStrings.xml")

    # Build sheet name -> rId mapping
    sheet_rid_map = {}
    for sheet in workbook_xml.findall(f".//{{{ns}}}sheet"):
        sheet_rid_map[sheet.get("name")] = sheet.get(f"{{{ns_r}}}id")

    # Get rId -> file path mapping
    rid_file_map = {}
    for rel in rels_xml.findall(f".//{{{ns_pkg}}}Relationship"):
        target = rel.get("Target")
        # Handle both absolute paths (/xl/worksheets/...) and relative paths (worksheets/...)
        if target.startswith("/"):
            # Absolute path - remove leading slash
            rid_file_map[rel.get("Id")] = target[1:]
        elif target.startswith("xl/"):
            # Already has xl/ prefix
            rid_file_map[rel.get("Id")] = target
        else:
            # Relative path - add xl/ prefix
            rid_file_map[rel.get("Id")] = "xl/" + target

    # Build sheet name -> sheet XML path mapping
    sheet_xml_paths = {}
    for sheet_name in cells_by_sheet.keys():
        rid = sheet_rid_map.get(sheet_name)
        if rid:
            sheet_xml_paths[sheet_name] = rid_file_map.get(rid)

    # Collect which shared string indices need updating
    # Format: {index: Cell} - we pass the whole cell to access rich_text_runs
    shared_string_updates: dict[int, Cell] = {}

    # Read each sheet to find shared string indices for cells we need to update
    with zipfile.ZipFile(output_file, "r") as zf:
        for sheet_name, sheet_path in sheet_xml_paths.items():
            if not sheet_path:
                continue
            sheet_xml = ET.fromstring(zf.read(sheet_path))
            sheet_data = sheet_xml.find(f".//{{{ns}}}sheetData")
            if sheet_data is None:
                continue

            updates_for_sheet = cell_updates.get(sheet_name, {})
            for row in sheet_data.findall(f"{{{ns}}}row"):
                for c in row.findall(f"{{{ns}}}c"):
                    ref = c.get("r")
                    if ref in updates_for_sheet:
                        cell = updates_for_sheet[ref]
                        # Check if this is a shared string reference
                        if c.get("t") == "s":
                            v = c.find(f"{{{ns}}}v")
                            if v is not None and v.text:
                                try:
                                    ss_index = int(v.text)
                                    shared_string_updates[ss_index] = cell
                                except ValueError:
                                    pass

    # Update shared strings XML, preserving rich text formatting
    updated_shared_strings = None
    if shared_strings_data and shared_string_updates:
        updated_shared_strings = _update_shared_strings(
            shared_strings_data, shared_string_updates
        )

    # Build dropdown updates by sheet path
    dropdown_updates: dict[str, list[DropdownValidation]] = {}
    if dropdowns:
        for dropdown in dropdowns:
            if dropdown.translated_values:
                rid = sheet_rid_map.get(dropdown.sheet)
                if rid:
                    sheet_path = rid_file_map.get(rid)
                    if sheet_path:
                        if sheet_path not in dropdown_updates:
                            dropdown_updates[sheet_path] = []
                        dropdown_updates[sheet_path].append(dropdown)

    # Rewrite the zip file with updated shared strings and dropdowns
    with zipfile.ZipFile(output_file, "r") as zf_in:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            tmp_path = tmp.name

        with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zf_out:
            for item in zf_in.infolist():
                data = zf_in.read(item.filename)

                # Update shared strings file
                if item.filename == "xl/sharedStrings.xml" and updated_shared_strings:
                    data = updated_shared_strings

                # Update sheet XML with translated dropdown values
                if item.filename in dropdown_updates:
                    data = _update_sheet_dropdowns(data, dropdown_updates[item.filename], ns)

                zf_out.writestr(item, data)

    # Replace original with modified
    shutil.move(tmp_path, output_file)


def _update_sheet_dropdowns(
    xml_data: bytes, dropdowns: list[DropdownValidation], ns: str
) -> bytes:
    """Update data validation dropdown values in sheet XML.

    Finds dataValidation elements and updates their formula1 with translated values.
    """
    from xml.etree import ElementTree as ET

    ET.register_namespace("", ns)
    root = ET.fromstring(xml_data)

    # Build a map of cell_range -> translated values
    dropdown_map: dict[str, list[str]] = {}
    for dropdown in dropdowns:
        if dropdown.translated_values:
            dropdown_map[dropdown.cell_range] = dropdown.translated_values

    # Find and update data validations
    for dv in root.findall(f".//{{{ns}}}dataValidation"):
        sqref = dv.get("sqref")
        if sqref in dropdown_map:
            formula1 = dv.find(f"{{{ns}}}formula1")
            if formula1 is not None:
                # Build the new formula with translated values
                translated_values = dropdown_map[sqref]
                new_formula = '"' + ",".join(translated_values) + '"'
                formula1.text = new_formula

    return ET.tostring(root, encoding="UTF-8", xml_declaration=True)


def _update_shared_strings(xml_data: bytes, updates: dict[int, "Cell"]) -> bytes:
    """Update shared strings while preserving rich text formatting.

    For plain text entries (<si><t>text</t></si>), simply update the text.
    For rich text entries (<si><r>...</r><r>...</r></si>), use the pre-translated
    runs from the Cell object to preserve exact formatting boundaries.
    """
    from xml.etree import ElementTree as ET

    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    ET.register_namespace("", ns)

    root = ET.fromstring(xml_data)

    # Find all <si> elements (shared string items)
    si_elements = root.findall(f"{{{ns}}}si")

    for index, cell in updates.items():
        if index >= len(si_elements):
            continue

        si = si_elements[index]

        # Check if this is plain text or rich text
        plain_t = si.find(f"{{{ns}}}t")
        runs = si.findall(f"{{{ns}}}r")

        if runs and cell.rich_text_runs:
            # Rich text with pre-translated runs - use exact translations
            _update_rich_text_runs(runs, cell.rich_text_runs, ns)
        elif runs:
            # Rich text but no pre-translated runs - use full translated value
            # (fallback, shouldn't normally happen)
            _update_rich_text_runs_fallback(runs, cell.value, ns)
        elif plain_t is not None:
            # Plain text: simply update
            plain_t.text = cell.value

    return ET.tostring(root, encoding="UTF-8", xml_declaration=True)


def _update_rich_text_runs(runs, translated_runs: list["RichTextRun"], ns: str) -> None:
    """Update rich text runs with pre-translated text for each run.

    This preserves exact formatting boundaries by using translations that were
    done separately for each run.
    """
    from xml.etree import ElementTree as ET

    for i, r in enumerate(runs):
        t = r.find(f"{{{ns}}}t")
        if t is None:
            t = ET.SubElement(r, f"{{{ns}}}t")

        if i < len(translated_runs):
            run_data = translated_runs[i]
            # Use translated text if available, otherwise keep original
            new_text = run_data.translated_text if run_data.translated_text else run_data.text
            t.text = new_text

            # Preserve xml:space="preserve" if needed
            if new_text and (new_text[0].isspace() or new_text[-1].isspace()):
                t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


def _update_rich_text_runs_fallback(runs, new_value: str, ns: str) -> None:
    """Fallback: distribute translated text proportionally across runs.

    Used when rich text runs weren't translated separately.
    """
    from xml.etree import ElementTree as ET

    # Get original text from each run
    original_texts = []
    for r in runs:
        t = r.find(f"{{{ns}}}t")
        original_texts.append(t.text if t is not None and t.text else "")

    original_total = sum(len(t) for t in original_texts)

    if original_total == 0:
        # Edge case: no text in runs, put everything in first run
        if runs:
            t = runs[0].find(f"{{{ns}}}t")
            if t is None:
                t = ET.SubElement(runs[0], f"{{{ns}}}t")
            t.text = new_value
        return

    # Distribute proportionally
    remaining = new_value
    for i, r in enumerate(runs):
        t = r.find(f"{{{ns}}}t")
        if t is None:
            t = ET.SubElement(r, f"{{{ns}}}t")

        if i == len(runs) - 1:
            t.text = remaining
        else:
            proportion = len(original_texts[i]) / original_total
            target_len = int(proportion * len(new_value))
            # Find a word boundary near target
            split = target_len
            for j in range(target_len, min(len(remaining), target_len + 20)):
                if j < len(remaining) and remaining[j] == " ":
                    split = j + 1
                    break
            t.text = remaining[:split]
            remaining = remaining[split:]

        if t.text and (t.text[0].isspace() or t.text[-1].isspace()):
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


def _col_num_to_letter(col: int) -> str:
    """Convert column number (1-indexed) to Excel letter (A, B, ..., Z, AA, etc.)."""
    result = ""
    while col > 0:
        col, remainder = divmod(col - 1, 26)
        result = chr(65 + remainder) + result
    return result


if __name__ == "__main__":
    cli()

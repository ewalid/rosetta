"""Translation service using Claude API."""

from typing import Optional

from anthropic import Anthropic

from rosetta.core.config import Config
from rosetta.core.exceptions import TranslationError
from rosetta.models import TranslationBatch


class Translator:
    """Translates text using Claude API."""

    def __init__(self, config: Config) -> None:
        """Initialize the translator with configuration."""
        self.config = config
        self.client = Anthropic(api_key=config.anthropic_api_key)

    def translate_batch(self, batch: TranslationBatch) -> list[str]:
        """Translate a batch of text strings.

        Args:
            batch: TranslationBatch containing cells to translate

        Returns:
            List of translated strings in the same order as input

        Raises:
            TranslationError: If translation fails
        """
        if not batch.cells:
            return []

        prompt = self._build_prompt(batch)

        try:
            response = self.client.messages.create(
                model=self.config.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )

            # Extract text from response
            translated_text = response.content[0].text

            # Parse the translations (one per line)
            translations = self._parse_translations(translated_text, len(batch))
            return translations

        except Exception as e:
            raise TranslationError(f"Translation failed: {e}") from e

    def _build_prompt(self, batch: TranslationBatch) -> str:
        """Build the translation prompt for Claude."""
        source_lang = batch.source_lang or "the source language"
        target_lang = batch.target_lang

        texts_numbered = "\n".join(
            f"{i+1}. {text}" for i, text in enumerate(batch.texts)
        )

        return f"""Translate the following text from {source_lang} to {target_lang}.

IMPORTANT RULES:
- Preserve formatting (line breaks, capitalization, punctuation)
- Translate ONLY the text content, do not add explanations
- Return translations in the same order, one per line
- Each translation should be numbered (1., 2., 3., etc.)
- If a text is already in {target_lang}, return it unchanged

Texts to translate:
{texts_numbered}

Return only the numbered translations, nothing else."""

    def _parse_translations(self, response: str, expected_count: int) -> list[str]:
        """Parse numbered translations from Claude's response.

        Expected format:
        1. Translation one
        2. Translation two
        which may span multiple lines
        3. Translation three

        Multi-line translations are supported - content is accumulated until
        the next numbered item is found.
        """
        import re

        lines = response.strip().split("\n")
        translations: dict[int, list[str]] = {}
        current_num: int | None = None

        for line in lines:
            # Match lines starting with a number followed by . or )
            match = re.match(r"^(\d+)[.)\s]+(.*)$", line.strip())
            if match:
                num = int(match.group(1))
                # Only accept translations within expected range
                if 1 <= num <= expected_count:
                    current_num = num
                    translations[num] = [match.group(2).strip()]
                else:
                    # Number out of range, treat as continuation of current
                    if current_num is not None and line.strip():
                        translations[current_num].append(line.strip())
            elif current_num is not None and line.strip():
                # Continuation of the current translation (multi-line content)
                translations[current_num].append(line.strip())

        # Build result list in order, joining multi-line translations
        result = []
        for i in range(1, expected_count + 1):
            if i in translations:
                # Join with newline to preserve multi-line structure
                result.append("\n".join(translations[i]))
            else:
                raise TranslationError(
                    f"Missing translation for item {i}. Got {len(translations)} translations."
                )

        return result

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
        3. Translation three
        """
        lines = response.strip().split("\n")
        translations = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Remove numbering (e.g., "1. " or "1) ")
            if line[0].isdigit():
                # Find the first space or period after the number
                idx = 0
                while idx < len(line) and (line[idx].isdigit() or line[idx] in ".) "):
                    idx += 1
                translation = line[idx:].strip()
                translations.append(translation)

        if len(translations) != expected_count:
            raise TranslationError(
                f"Expected {expected_count} translations, got {len(translations)}"
            )

        return translations

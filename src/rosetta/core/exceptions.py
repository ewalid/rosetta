"""Custom exceptions for Rosetta."""


class RosettaError(Exception):
    """Base exception for all Rosetta errors."""

    pass


class TranslationError(RosettaError):
    """Raised when translation fails."""

    pass


class ExcelError(RosettaError):
    """Raised when Excel file operations fail."""

    pass

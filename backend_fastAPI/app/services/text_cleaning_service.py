import html
import re
import unicodedata


_HTML_TAG_RE = re.compile(r"<[^>]+>")


def strip_accents(text: str) -> str:
    if not text:
        return ""
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def normalize_text(text: str) -> str:
    """Normalize free text before skill/position detection and embedding.

    The function keeps technical symbols such as C++, C#, .NET, Node.js readable,
    but removes HTML/noisy whitespace and makes matching accent-insensitive.
    """
    if not text:
        return ""

    text = html.unescape(str(text))
    text = _HTML_TAG_RE.sub(" ", text)
    text = unicodedata.normalize("NFKC", text)
    text = strip_accents(text)
    text = text.lower()

    # Normalize common separators to spaces, while keeping technical symbols.
    text = re.sub(r"[\t\r\n]+", " ", text)
    text = re.sub(r"[•·|]+", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def normalize_keyword(text: str) -> str:
    if not text:
        return ""

    text = html.unescape(str(text))
    text = unicodedata.normalize("NFKC", text)
    text = strip_accents(text)
    text = text.lower()
    text = re.sub(r"\s+", " ", text)

    return text.strip()

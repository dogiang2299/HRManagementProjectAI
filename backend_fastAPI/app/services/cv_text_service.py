from pathlib import Path
import re
import fitz

from app.config import BACKEND_UPLOAD_DIR, CV_UPLOAD_SUBDIR


def clean_extracted_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Split bullet/list items onto their own lines.
    text = re.sub(r"([●•▪▫◦])", r"\n\1 ", text)

    # Split letters and digits that are stuck together: Emailabc -> Email abc, phone086 -> phone 086.
    text = re.sub(r"([A-Za-z\u00C0-\u1EF9])(\d)", r"\1 \2", text)
    text = re.sub(r"(\d)([A-Za-z\u00C0-\u1EF9])", r"\1 \2", text)

    # Split lowercase/digit text stuck to uppercase text: NamICT -> Nam ICT.
    text = re.sub(r"([a-z0-9\u00C0-\u1EF9])([A-Z\u00C0-\u1EF9])", r"\1 \2", text)

    # Split sentences stuck together after a period.
    text = re.sub(r"\.([A-Z\u00C0-\u1EF9])", r".\n\1", text)

    # Normalize whitespace while preserving newlines.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_pdf_text_by_blocks(file_path: Path) -> str:
    doc = fitz.open(str(file_path))
    pages_text = []

    for page in doc:
        blocks = page.get_text("blocks")
        text_blocks = []

        for block in blocks:
            x0, y0, x1, y1, text, *_ = block
            text = (text or "").strip()
            if text:
                text_blocks.append((y0, x0, text))

        text_blocks.sort(key=lambda item: (item[0], item[1]))

        page_text = "\n".join(item[2] for item in text_blocks)
        if page_text.strip():
            pages_text.append(page_text)

    doc.close()
    return "\n\n".join(pages_text).strip()


def extract_pdf_text_by_words(file_path: Path, y_tolerance: float = 4.0) -> str:
    doc = fitz.open(str(file_path))
    pages_text = []

    for page in doc:
        words = page.get_text("words")

        if not words:
            continue

        words = sorted(words, key=lambda w: (round(w[1] / y_tolerance), w[0]))

        lines = []
        current_line = []
        current_y = None

        for word in words:
            x0, y0, x1, y1, token = word[:5]

            if current_y is None:
                current_y = y0
                current_line = [word]
                continue

            if abs(y0 - current_y) <= y_tolerance:
                current_line.append(word)
            else:
                lines.append(current_line)
                current_line = [word]
                current_y = y0

        if current_line:
            lines.append(current_line)

        page_lines = []
        for line in lines:
            line = sorted(line, key=lambda w: w[0])
            tokens = [w[4] for w in line if str(w[4]).strip()]
            if tokens:
                page_lines.append(" ".join(tokens))

        page_text = "\n".join(page_lines)
        if page_text.strip():
            pages_text.append(page_text)

    doc.close()
    return "\n\n".join(pages_text).strip()


def extract_text_from_pdf(file_path: Path) -> str:
    # Prefer blocks because they preserve CV layout better than pypdf.
    block_text = extract_pdf_text_by_blocks(file_path)

    # If block text is too short or likely malformed, fall back to words.
    word_text = extract_pdf_text_by_words(file_path)

    chosen_text = block_text
    if len(word_text) > len(block_text) * 1.2:
        chosen_text = word_text

    return clean_extracted_text(chosen_text)


def resolve_cv_path(cv_file: str) -> Path:
    if not cv_file:
        raise ValueError("Candidate does not have cv_file")

    cv_path = Path(cv_file)

    if cv_path.is_absolute():
        return cv_path

    if len(cv_path.parts) > 1:
        return Path(BACKEND_UPLOAD_DIR) / cv_path

    return Path(BACKEND_UPLOAD_DIR) / CV_UPLOAD_SUBDIR / cv_file


def extract_cv_text(cv_file: str) -> str:
    file_path = resolve_cv_path(cv_file)

    if not file_path.exists():
        raise FileNotFoundError(f"CV file not found: {file_path}")

    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        return extract_text_from_pdf(file_path)

    raise ValueError(f"Unsupported CV file type: {suffix}")

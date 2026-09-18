import os
import re
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel
from pypdf import PdfReader
import docx


class ParsedChunk(BaseModel):
    chunk_index: int
    section_title: str
    page_number: int
    content: str
    token_count: int


class DocumentParseResult(BaseModel):
    full_text: str
    page_count: int
    word_count: int
    chunks: List[ParsedChunk]


class DocumentParser:
    """
    Production-grade legal document parser supporting PDF, DOCX, and TXT.
    Detects section structures, maintains page markers, and creates semantic chunks.
    """

    SECTION_PATTERNS = [
        re.compile(r"^(?:ARTICLE|SECTION|CLAUSE)\s+([0-9IVXLCDM\.]+[:\-\s]+[^\n\r]+)", re.IGNORECASE),
        re.compile(r"^([0-9]{1,2}\.[0-9]{0,2}\.?\s+[A-Z][^\n\r]+)"),
        re.compile(r"^([A-Z\s]{4,40}:)"),
        re.compile(r"^([0-9]{1,2}\.\s+[A-Z][^\n\r]+)"),
    ]

    @classmethod
    def extract_text_from_pdf(cls, file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
        reader = PdfReader(file_path)
        page_count = len(reader.pages)
        pages_data = []
        full_text_parts = []

        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            text = page.extract_text() or ""
            # Clean up excessive null bytes or weird formatting
            text = text.replace("\x00", "").strip()
            pages_data.append({"page_number": page_num, "text": text})
            full_text_parts.append(text)

        return "\n\n".join(full_text_parts), page_count, pages_data

    @classmethod
    def extract_text_from_docx(cls, file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
        doc = docx.Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n\n".join(paragraphs)
        
        # Approximate pages based on 400 words per page
        words = full_text.split()
        word_count = len(words)
        page_count = max(1, (word_count // 400) + (1 if word_count % 400 else 0))

        # Distribute into virtual pages
        pages_data = []
        words_per_page = max(1, word_count // page_count) if word_count > 0 else 1
        for p_idx in range(page_count):
            start = p_idx * words_per_page
            end = min(word_count, (p_idx + 1) * words_per_page)
            p_text = " ".join(words[start:end])
            pages_data.append({"page_number": p_idx + 1, "text": p_text})

        return full_text, page_count, pages_data

    @classmethod
    def extract_text_from_txt(cls, file_path: str) -> Tuple[str, int, List[Dict[str, Any]]]:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            full_text = f.read()

        words = full_text.split()
        word_count = len(words)
        page_count = max(1, (word_count // 400) + (1 if word_count % 400 else 0))

        pages_data = []
        words_per_page = max(1, word_count // page_count) if word_count > 0 else 1
        for p_idx in range(page_count):
            start = p_idx * words_per_page
            end = min(word_count, (p_idx + 1) * words_per_page)
            p_text = " ".join(words[start:end])
            pages_data.append({"page_number": p_idx + 1, "text": p_text})

        return full_text, page_count, pages_data

    @classmethod
    def identify_section(cls, text: str, current_section: str = "General") -> str:
        lines = text.strip().split("\n")
        for line in lines[:3]:
            line_str = line.strip()
            for pattern in cls.SECTION_PATTERNS:
                match = pattern.match(line_str)
                if match:
                    found = match.group(0).strip()
                    # Clean punctuation
                    found = found.rstrip(":")
                    if len(found) < 80:
                        return found
        return current_section

    @classmethod
    def parse_document(cls, file_path: str, file_type: str) -> DocumentParseResult:
        file_type = file_type.lower().lstrip(".")
        if file_type == "pdf":
            full_text, page_count, pages_data = cls.extract_text_from_pdf(file_path)
        elif file_type in ["docx", "doc"]:
            full_text, page_count, pages_data = cls.extract_text_from_docx(file_path)
        elif file_type in ["txt", "text", "md"]:
            full_text, page_count, pages_data = cls.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        words = full_text.split()
        word_count = len(words)

        # Build semantic chunks
        chunks: List[ParsedChunk] = []
        chunk_idx = 0
        current_section = "Preamble & Definitions"

        # Chunk parameters: ~1200 characters per chunk with 200 character overlap
        target_chunk_size = 1200
        overlap_size = 200

        for page in pages_data:
            page_num = page["page_number"]
            page_text = page["text"].strip()
            if not page_text:
                continue

            # Split page into paragraphs or blocks
            paragraphs = page_text.split("\n\n")
            current_buffer = ""

            for p in paragraphs:
                p_clean = p.strip()
                if not p_clean:
                    continue

                # Check if this paragraph introduces a new section
                current_section = cls.identify_section(p_clean, current_section)

                if len(current_buffer) + len(p_clean) < target_chunk_size:
                    current_buffer += ("\n\n" if current_buffer else "") + p_clean
                else:
                    # Flush current buffer as a chunk
                    if current_buffer:
                        chunk_text = current_buffer.strip()
                        chunks.append(ParsedChunk(
                            chunk_index=chunk_idx,
                            section_title=current_section,
                            page_number=page_num,
                            content=chunk_text,
                            token_count=len(chunk_text.split())
                        ))
                        chunk_idx += 1
                        # Overlap: keep tail of current buffer
                        tail = current_buffer[-overlap_size:] if len(current_buffer) > overlap_size else ""
                        current_buffer = tail + "\n\n" + p_clean
                    else:
                        current_buffer = p_clean

            if current_buffer.strip():
                chunk_text = current_buffer.strip()
                chunks.append(ParsedChunk(
                    chunk_index=chunk_idx,
                    section_title=current_section,
                    page_number=page_num,
                    content=chunk_text,
                    token_count=len(chunk_text.split())
                ))
                chunk_idx += 1

        # Fallback if no chunks generated
        if not chunks and full_text.strip():
            chunks.append(ParsedChunk(
                chunk_index=0,
                section_title="Full Document",
                page_number=1,
                content=full_text[:3000].strip(),
                token_count=len(full_text[:3000].split())
            ))

        return DocumentParseResult(
            full_text=full_text,
            page_count=page_count,
            word_count=word_count,
            chunks=chunks
        )

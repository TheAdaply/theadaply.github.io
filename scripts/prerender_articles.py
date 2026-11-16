#!/usr/bin/env python3
"""Regenerate static article HTML in thesis/ and case-study/ index.html from content.json."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

ARTICLE_PAGES = (
    ("thesis", True),
    ("case-study", False),
)

PAGE_MARKERS: dict[str, dict[str, str]] = {
    "thesis": {
        "article_end": r"</div>\s*\n\s*<figure id=\"thesis-video\"",
        "case_end": r"</div>\s*\n\s*<section id=\"explorer\"",
        "article_indent": "      ",
        "case_indent": "        ",
    },
    "case-study": {
        "article_end": r"</div>\s*\n\s*<section id=\"customer-case\"",
        "case_end": r"</div>\s*\n\s*<section id=\"explorer\"",
        "article_indent": "      ",
        "case_indent": "        ",
    },
}


def replace_div_inner(text: str, div_id: str, end_marker: str, inner: str, indent: str) -> tuple[str, int]:
    pattern = (
        rf'(<div id="{div_id}" class="article-body">)'
        rf"(?:(?!{end_marker}).)*"
        rf"(?={end_marker})"
    )
    return re.subn(pattern, rf"\1\n{inner}\n{indent}", text, count=1, flags=re.DOTALL)


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def render_quote(data: dict, *, include_attribution: bool) -> str:
    quote = data.get("quote")
    if not quote:
        return ""
    parts = [
        '<figure class="customer-quote">',
        "<blockquote><p>",
        f"<mark>{esc(quote['text'])}</mark>",
        "</p></blockquote>",
    ]
    if include_attribution and quote.get("attribution"):
        parts.append(f"<figcaption>{esc(quote['attribution'])}</figcaption>")
    if quote.get("context"):
        parts.append(f'<p class="quote-context">{esc(quote["context"])}</p>')
    parts.append("</figure>")
    return "".join(parts)


def render_spec_preview(preview: dict) -> str:
    title = esc(preview["title"])
    description = esc(preview["description"])
    aria = esc(f"{preview['title']}. Scroll horizontally to read all columns.")
    cols = "".join(f'<th scope="col">{esc(label)}</th>' for label in preview["columns"])
    rows = []
    for row in preview["rows"]:
        cells = [
            f'<th scope="row">{esc(row["state"])}</th>',
            f"<td>{esc(row['decision'])}</td>",
            f"<td>{esc(row['behavior'])}</td>",
            f"<td>{esc(row['checks'])}</td>",
        ]
        rows.append("<tr>" + "".join(cells) + "</tr>")
    tbody = "".join(rows)
    return (
        f'<section class="spec-preview" aria-labelledby="spec-preview-title">'
        f'<h4 id="spec-preview-title">{title}</h4>'
        f"<p>{description}</p>"
        f'<div class="spec-table-scroll" tabindex="0" role="region" aria-label="{aria}">'
        f"<table><thead><tr>{cols}</tr></thead><tbody>{tbody}</tbody></table>"
        f"</div></section>"
    )


def render_sections(data: dict, *, include_quote_attribution: bool) -> tuple[str, str]:
    quote_html = render_quote(data, include_attribution=include_quote_attribution)
    case_note = esc(data.get("caseNote", ""))
    spec = data.get("specPreview")
    article_parts: list[str] = []
    case_parts: list[str] = []

    for index, section in enumerate(data["sections"]):
        chunk: list[str] = ["<section>"]
        heading = section.get("heading", "")
        if index != 0 or heading:
            tag = "h2" if index < 2 else "h3"
            id_attr = ' id="customer-case-title"' if index == 1 else ""
            chunk.append(f"<{tag}{id_attr}>{esc(heading)}</{tag}>")
        for paragraph in section.get("paragraphs", []):
            chunk.append(f"<p>{esc(paragraph)}</p>")
        if quote_html and index == data.get("quote", {}).get("afterSection"):
            chunk.append(quote_html)
            if case_note:
                chunk.append(f"<p>{case_note}</p>")
        if spec and index == spec.get("afterSection"):
            chunk.append(render_spec_preview(spec))
        chunk.append("</section>")
        block = "".join(chunk)
        if index == 0:
            article_parts.append(block)
        else:
            case_parts.append(block)

    return "".join(article_parts), "".join(case_parts)


def patch_index_html(
    page: str, page_dir: Path, data: dict, *, include_quote_attribution: bool
) -> str:
    index_path = page_dir / "index.html"
    text = index_path.read_text(encoding="utf-8")
    markers = PAGE_MARKERS[page]
    article_html, case_html = render_sections(
        data, include_quote_attribution=include_quote_attribution
    )
    conclusion = esc(data.get("conclusion", ""))
    closing = esc(data.get("closing", ""))

    text, n1 = replace_div_inner(
        text,
        "article-sections",
        markers["article_end"],
        article_html,
        markers["article_indent"],
    )
    if n1 != 1:
        raise ValueError(f"{index_path}: could not patch article-sections")

    text, n2 = replace_div_inner(
        text,
        "case-sections",
        markers["case_end"],
        case_html,
        markers["case_indent"],
    )
    if n2 != 1:
        raise ValueError(f"{index_path}: could not patch case-sections")

    text, n3 = re.subn(
        r'(<p id="conclusion-text">)(.*?)(</p>)',
        rf"\1{conclusion}\3",
        text,
        count=1,
        flags=re.DOTALL,
    )
    if n3 != 1:
        raise ValueError(f"{index_path}: could not patch conclusion-text")

    text, n4 = re.subn(
        r'(<p id="closing-text">)(.*?)(</p>)',
        rf"\1{closing}\3",
        text,
        count=1,
        flags=re.DOTALL,
    )
    if n4 != 1:
        raise ValueError(f"{index_path}: could not patch closing-text")

    return text


def expected_html(page: str, include_quote_attribution: bool) -> str:
    page_dir = ROOT / page
    data = json.loads((page_dir / "content.json").read_text(encoding="utf-8"))
    return patch_index_html(
        page, page_dir, data, include_quote_attribution=include_quote_attribution
    )


def process_page(page: str, *, write: bool, include_quote_attribution: bool) -> bool:
    page_dir = ROOT / page
    index_path = page_dir / "index.html"
    current = index_path.read_text(encoding="utf-8")
    updated = expected_html(page, include_quote_attribution)
    if current == updated:
        return True
    if write:
        index_path.write_text(updated, encoding="utf-8")
        print(f"updated {index_path.relative_to(ROOT)}")
        return True
    print(f"out of sync: {index_path.relative_to(ROOT)}", file=sys.stderr)
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="exit 1 if index.html article HTML does not match content.json",
    )
    args = parser.parse_args()
    ok = True
    for page, include_quote_attribution in ARTICLE_PAGES:
        if not process_page(
            page, write=not args.check, include_quote_attribution=include_quote_attribution
        ):
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
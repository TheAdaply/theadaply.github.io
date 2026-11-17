#!/usr/bin/env python3
"""Verify HTML meta descriptions and unchanged title/canonical tags vs main."""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROUTES_PATH = ROOT / "seo" / "public-routes.json"

MIN_LEN = 120
MAX_LEN = 160

META_DESC_RE = re.compile(
    r'<meta\s+name="description"\s+content="([^"]*)"\s*/?>',
    re.IGNORECASE,
)
TITLE_RE = re.compile(r"<title>[^<]*</title>", re.IGNORECASE)
CANONICAL_RE = re.compile(
    r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>',
    re.IGNORECASE,
)


def git_file_at_ref(ref: str, source: str) -> bytes | None:
    proc = subprocess.run(
        ["git", "show", f"{ref}:{source}"],
        cwd=ROOT,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        return None
    return proc.stdout


def static_head(text: str) -> str:
    marker = "</head>"
    idx = text.lower().find(marker)
    if idx == -1:
        raise ValueError("missing </head>")
    return text[:idx]


def head_tags(source: str, pattern: re.Pattern[str]) -> list[str]:
    head = static_head((ROOT / source).read_text(encoding="utf-8"))
    return pattern.findall(head)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--main-ref",
        default="origin/main",
        help="Git ref whose title and canonical tags must match (default: origin/main)",
    )
    args = parser.parse_args()

    data = json.loads(ROUTES_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []

    for route in data["routes"]:
        source = route.get("source", "")
        if not source.endswith(".html"):
            continue

        path = ROOT / source
        if not path.is_file():
            errors.append(f"{source}: missing file")
            continue

        current = path.read_bytes()
        baseline = git_file_at_ref(args.main_ref, source)
        if baseline is not None:
            for label, pattern in (("title", TITLE_RE), ("canonical", CANONICAL_RE)):
                cur_tags = head_tags(source, pattern)
                base_head = static_head(baseline.decode("utf-8"))
                base_tags = pattern.findall(base_head)
                if cur_tags != base_tags:
                    errors.append(
                        f"{source}: {label} tag(s) differ from {args.main_ref} "
                        f"(current={cur_tags!r}, main={base_tags!r})"
                    )

        head = static_head(current.decode("utf-8"))
        matches = META_DESC_RE.findall(head)
        if len(matches) != 1:
            errors.append(
                f"{source}: expected exactly one meta description in <head>, found {len(matches)}"
            )
            continue

        desc = html.unescape(matches[0])
        length = len(desc)
        if length < MIN_LEN or length > MAX_LEN:
            errors.append(
                f"{source}: meta description length {length} not in [{MIN_LEN}, {MAX_LEN}]"
            )

    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        return 1

    print("OK: SEO meta descriptions and title/canonical tags")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
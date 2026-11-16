#!/usr/bin/env python3
"""Generate sitemap.xml from seo/public-routes.json using git last-modified dates."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROUTES_PATH = ROOT / "seo" / "public-routes.json"
SITEMAP_PATH = ROOT / "sitemap.xml"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def git_lastmod(source: str) -> str | None:
    path = ROOT / source
    if not path.is_file():
        print(f"warning: missing source file {source}", file=sys.stderr)
        return None
    proc = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--", str(path)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    line = proc.stdout.strip()
    return line if line else None


def build_sitemap(data: dict) -> ET.ElementTree:
    site = data["site"].rstrip("/")
    urlset = ET.Element(ET.QName(NS, "urlset"))

    for route in data["routes"]:
        loc = route["loc"]
        url = f"{site}{loc}" if loc != "/" else f"{site}/"
        url_el = ET.SubElement(urlset, ET.QName(NS, "url"))
        ET.SubElement(url_el, ET.QName(NS, "loc")).text = url

        source = route.get("source")
        if source:
            lastmod = git_lastmod(source)
            if lastmod:
                ET.SubElement(url_el, ET.QName(NS, "lastmod")).text = lastmod

        if priority := route.get("priority"):
            ET.SubElement(url_el, ET.QName(NS, "priority")).text = priority

    return ET.ElementTree(urlset)


def serialize(tree: ET.ElementTree) -> str:
    ET.register_namespace("", NS)
    body = ET.tostring(tree.getroot(), encoding="unicode")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + body + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="Regenerate and exit 1 if sitemap.xml is out of date",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=SITEMAP_PATH,
        help="Output path (default: repo-root sitemap.xml)",
    )
    args = parser.parse_args()

    data = json.loads(ROUTES_PATH.read_text(encoding="utf-8"))
    xml = serialize(build_sitemap(data))

    if args.check:
        if not args.output.is_file():
            print(f"{args.output} is missing; run scripts/generate_sitemap.py", file=sys.stderr)
            return 1
        if args.output.read_text(encoding="utf-8") != xml:
            print("sitemap.xml is out of date; run: python3 scripts/generate_sitemap.py", file=sys.stderr)
            return 1
        print("sitemap.xml is up to date")
        return 0

    args.output.write_text(xml, encoding="utf-8")
    print(f"wrote {args.output} ({len(data['routes'])} URLs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
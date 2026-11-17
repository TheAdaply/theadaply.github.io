#!/usr/bin/env python3

import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class PrerenderArticlesTests(unittest.TestCase):
    def test_prerender_check_passes(self) -> None:
        proc = subprocess.run(
            ["python3", "scripts/prerender_articles.py", "--check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, msg=proc.stderr or proc.stdout)

    def test_thesis_article_sections_not_empty(self) -> None:
        html = (ROOT / "thesis/index.html").read_text(encoding="utf-8")
        self.assertIn('id="article-sections"', html)
        self.assertIn("<section>", html)
        data = json.loads((ROOT / "thesis/content.json").read_text(encoding="utf-8"))
        self.assertIn(data["sections"][0]["paragraphs"][0], html)


if __name__ == "__main__":
    unittest.main()
#!/usr/bin/env python3
"""Tests for scripts/check_seo_meta.py."""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class CheckSeoMetaTests(unittest.TestCase):
    def test_check_passes_on_current_tree(self) -> None:
        proc = subprocess.run(
            ["python3", "scripts/check_seo_meta.py", "--main-ref", "origin/main"],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr or proc.stdout)


if __name__ == "__main__":
    unittest.main()
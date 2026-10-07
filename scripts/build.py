#!/usr/bin/env python3
import json
import re
import shutil
import subprocess
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
version = json.loads((root / "extension/manifest.json").read_text())["version"]
if not re.fullmatch(r"\d+\.\d+\.\d+(?:\.\d+)?", version):
    raise SystemExit("Invalid version in extension/manifest.json.")

archive = root / "dist" / "trello-fix.zip"
archive.parent.mkdir(exist_ok=True)
tracked = subprocess.check_output(
    ["git", "ls-files", "-z", "--", "extension", "README.md", "docs/screenshots"], cwd=root
)
files = [root / name.decode() for name in tracked.split(b"\0") if name]
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as package:
    for path in files:
        # Fixed timestamps make repeated builds of the same files identical.
        entry = zipfile.ZipInfo(path.relative_to(root).as_posix())
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        package.writestr(entry, path.read_bytes())
shutil.copyfile(archive, root / "trello-fix.zip")
print(archive.relative_to(root))

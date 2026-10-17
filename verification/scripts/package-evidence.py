"""Package the static reference without dependencies or browser downloads."""
from pathlib import Path
import hashlib
import json
import os
import zipfile

repo = Path(__file__).resolve().parents[2]
reference = repo / ".parity/reference"
output = repo / ".parity/baseline-static-evidence.zip"
if output.exists():
    raise SystemExit("Evidence archive already exists; refusing to replace it.")
if not (reference / "screenshot-hashes.json").exists():
    raise SystemExit("Seal the original screenshot acquisition first.")

with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=3) as archive:
    for source_name, archive_name in [("BASELINE_REPORT.md", "BASELINE_REPORT.md"), ("README.md", "VERIFICATION_README.md"), ("baseline-manifest.json", "baseline-manifest.json")]:
        archive.write(repo / "verification" / source_name, archive_name)
    for root, directories, names in os.walk(reference):
        directories[:] = sorted(name for name in directories if name != "node_modules")
        for name in sorted(names):
            file = Path(root) / name
            archive.write(file, file.relative_to(repo / ".parity"))
    diagnostics = repo / ".parity/diagnostics"
    if diagnostics.exists():
        for file in sorted(diagnostics.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(repo / ".parity"))
    acquisition = json.loads((reference / "acquisition.json").read_text())
    for name in [Path(acquisition["initial"]).name, Path(acquisition["completion"]).name]:
        file = repo / ".parity" / name
        if file.exists():
            archive.write(file, file.relative_to(repo / ".parity"))
digest = hashlib.sha256(output.read_bytes()).hexdigest()
(repo / "verification/evidence-archive.json").write_text(json.dumps({
    "archive": str(output), "sha256": digest, "bytes": output.stat().st_size,
    "scope": "Original source, build variants, fonts, sealed static screenshots/contracts, and diagnostics. Large motion videos/traces remain separately under .parity/runs and reports.",
}, indent=2))
print(f"Packaged {output.stat().st_size:,} bytes; SHA-256 {digest}")

--- FILE: /skill-safety/README.md ---
Skill Safety Scanner

Usage:
  - Place a skill folder under ~/some/path/skill-name
  - Run: python3 ~/.openclaw/workspace/skill-safety/scanner.py /path/to/skill-folder
  - Output: JSON report saved to ~/.openclaw/policy-audit/skill-scan-<name>-<ts>.json

Checks performed:
  - SKILL.yaml manifest presence
  - Banned patterns (rm -rf, curl|sh, sudo, passwd edits, base64|bash)
  - File size limits (2MB per file)
  - Optional .tar.gz sha256 calculation

Next steps:
  - Integrate this scanner into install flow: run before installing a skill, quarantine if failed.
  - Add sandboxed dry-run (no network, no exec) for behavioral checks (future).

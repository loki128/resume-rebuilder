--- FILE: /skill-safety/scanner.py ---
#!/usr/bin/env python3
"""
Skill Safety Scanner (static checks + quarantine)
Writes JSON report to stdout and ~/.openclaw/policy-audit/skill-scan-<name>.json
"""
import sys, os, json, hashlib, re, argparse, pathlib, datetime

WORKDIR = os.path.expanduser('~/.openclaw/policy-audit')
BANNED_PATTERNS = [r"\brm\s+-rf\b", r"curl\s+\|\s*sh", r"wget\s+\|\s*sh", r"base64\s+-d\s*\|\s*bash", r"sudo\b", r"passwd\b", r"/etc/passwd"]
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB per file


def sha256_of_file(p):
    h = hashlib.sha256()
    with open(p,'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def scan_skill(path):
    path = pathlib.Path(path)
    if not path.exists():
        return {'ok': False, 'error': 'path-not-found'}
    report = {'ok': True, 'path': str(path), 'files': [], 'banned': [], 'too_large': [], 'manifest': None, 'sha256': None, 'timestamp': datetime.datetime.utcnow().isoformat()+'Z'}
    # manifest check
    manifest = path / 'SKILL.yaml'
    manifest_json = None
    if manifest.exists():
        report['manifest'] = str(manifest)
    else:
        report['manifest'] = None
    # walk files
    for p in path.rglob('*'):
        if p.is_file():
            rel = p.relative_to(path)
            size = p.stat().st_size
            entry = {'file': str(rel), 'size': size}
            report['files'].append(entry)
            if size > MAX_FILE_SIZE:
                report['too_large'].append(str(rel))
            try:
                text = p.read_text(errors='ignore')
            except Exception:
                text = ''
            for pat in BANNED_PATTERNS:
                if re.search(pat, text, re.IGNORECASE):
                    report['banned'].append({'file': str(rel), 'pattern': pat})
    # compute overall tarball checksum if provided as .tar.gz
    tmp = list(path.glob('*.tar.gz'))
    if tmp:
        report['sha256'] = sha256_of_file(tmp[0])
    # final verdict
    if report['banned'] or report['too_large'] or report['manifest'] is None:
        report['ok'] = False
    # write audit
    os.makedirs(WORKDIR, exist_ok=True)
    outpath = os.path.join(WORKDIR, f"skill-scan-{path.name}-{int(datetime.datetime.utcnow().timestamp())}.json")
    with open(outpath,'w') as f:
        json.dump(report, f, indent=2)
    # post status to heartbeat server if available
    try:
        import requests
        requests.post('http://127.0.0.1:3721/update', json={ 'taskId': f'skill-scan-{path.name}', 'status': 'scanned', 'progress': 100, 'detail': 'scan complete' }, timeout=1)
    except Exception:
        pass
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='Path to skill folder')
    args = parser.parse_args()
    r = scan_skill(args.path)
    print(json.dumps(r, indent=2))
    sys.exit(0 if r.get('ok') else 2)

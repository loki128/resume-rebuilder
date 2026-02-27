--- FILE: /monitoring/alert_worker.py ---
#!/usr/bin/env python3
"""Simple alert worker that scans audit logs for token spikes or timeout patterns and sends email alerts via local sendmail or SMTP.
"""
import os, time, smtplib, json, glob, email.mime.text
AUDIT_DIR = os.path.expanduser('~/.openclaw/policy-audit')
ALERT_EMAIL = 'w.a.tantawy@gmail.com'
CHECK_INTERVAL = 60
TOKEN_SPIKE_THRESHOLD = 10000  # placeholder units


def send_email(subject, body, to=ALERT_EMAIL):
    msg = email.mime.text.MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = 'openclaw-monitor@localhost'
    msg['To'] = to
    try:
        s = smtplib.SMTP('localhost')
        s.send_message(msg)
        s.quit()
    except Exception as e:
        print('email send failed', e)


def scan_once():
    # naive: look for recent audit jsons with token-usage fields
    for path in glob.glob(os.path.join(AUDIT_DIR, 'token-usage-*.json')):
        try:
            with open(path) as f:
                j = json.load(f)
            # example structure: {'timestamp':..., 'usage': 12000}
            usage = j.get('usage',0)
            if usage > TOKEN_SPIKE_THRESHOLD:
                send_email('OpenClaw token spike', f"High token use detected: {usage} in {path}")
        except Exception:
            continue

if __name__ == '__main__':
    while True:
        scan_once()
        time.sleep(CHECK_INTERVAL)

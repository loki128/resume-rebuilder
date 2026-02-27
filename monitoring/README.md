--- FILE: /monitoring/README.md ---
Monitoring & Alert Worker

This package provides a simple alert worker that scans policy-audit logs for token usage spikes and sends email alerts.

Setup:
- Ensure a local SMTP (sendmail/postfix) or adjust alert_worker.py to use external SMTP credentials.
- Configure ALERT_EMAIL inside alert_worker.py or set up environment-based configuration.

Run:
  python3 ~/.openclaw/workspace/monitoring/alert_worker.py &

Notes:
- This is a minimal PoC. For production use, integrate with Prometheus/Alertmanager or a managed email provider.
- Audit logs should include token-usage-<ts>.json created by your token accounting hooks.

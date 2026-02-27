--- FILE: /heartbeat-server/status_server.py ---
#!/usr/bin/env python3
"""Simple heartbeat status server for CodeAssist Live scanner integration.
Endpoints:
- POST /update  : accept JSON { taskId, status, progress, detail }
- GET  /status  : return JSON of all active tasks

Run: python3 status_server.py
"""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import json, threading, time, os

STATE_FILE = os.path.expanduser('~/.openclaw/workspace/heartbeat-server/state.json')
PORT = 3721
lock = threading.Lock()
state = {}

def save_state():
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, 'w') as f:
        json.dump({'updated': time.time(), 'state': state}, f)

class Handler(BaseHTTPRequestHandler):
    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_POST(self):
        if self.path != '/update':
            self.send_response(404); self.end_headers(); return
        length = int(self.headers.get('Content-Length',0))
        raw = self.rfile.read(length)
        try:
            obj = json.loads(raw.decode('utf-8'))
            taskId = obj.get('taskId')
            if not taskId:
                self.send_response(400); self.end_headers(); return
            with lock:
                state[taskId] = { 'taskId': taskId, 'status': obj.get('status','running'), 'progress': obj.get('progress',None), 'detail': obj.get('detail',''), 'ts': time.time() }
                save_state()
            self.send_response(200)
            self._set_cors()
            self.send_header('Content-Type','application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok':True}).encode('utf-8'))
        except Exception as e:
            self.send_response(500); self.end_headers(); return

    def do_GET(self):
        if self.path != '/status':
            self.send_response(404); self.end_headers(); return
        with lock:
            payload = {'ok':True, 'state': state, 'ts': time.time()}
        self.send_response(200)
        self._set_cors()
        self.send_header('Content-Type','application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print('Heartbeat status server running on port', PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('shutting down')
        server.shutdown()

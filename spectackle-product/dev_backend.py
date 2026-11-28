from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/health'):
            data = {
                "status": "ok",
                "service": "spectakles-gd",
                "stage": 1,
                "recordings": True,
                "playback": True,
                "live": True,
                "discussion": True,
                "dev_tools": False
            }
            body = json.dumps(data).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path.startswith('/api/platform/status'):
            data = {
                "enabled": False,
                "project_id": None,
                "coaching_enabled": False,
                "emulator": False
            }
            body = json.dumps(data).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')

    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', 8000), Handler)
    print("Dev mock backend running on http://127.0.0.1:8000")
    server.serve_forever()

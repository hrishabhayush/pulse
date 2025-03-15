from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    def do_GET(self):
        # Handle /list-consultations endpoint
        if self.path == '/list-consultations':
            try:
                consultations_dir = os.path.join(os.path.dirname(__file__), 'consultations')
                if not os.path.exists(consultations_dir):
                    os.makedirs(consultations_dir)
                
                files = [f for f in os.listdir(consultations_dir) 
                        if f.startswith('consultation_') and f.endswith('.json')]
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(files).encode())
                return
            except Exception as e:
                self.send_error(500, str(e))
                return

        return super().do_GET()

if __name__ == '__main__':
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print('Server running on port 8000...')
    httpd.serve_forever() 
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Parse URL to remove query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = url.pathname;
  
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  // Remove leading slash and resolve path
  const fullPath = path.join(__dirname, filePath.substring(1));
  
  console.log(`Request: ${req.url} -> ${fullPath}`);
  
  const extname = path.extname(fullPath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
  }
  
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      console.error(`Error reading ${fullPath}:`, err.message);
      res.writeHead(404);
      res.end('File not found: ' + filePath);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${__dirname}`);
});

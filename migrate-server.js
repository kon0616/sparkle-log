// Temporary server on port 3456 for data migration
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3456;
const ROOT = path.join(__dirname, "out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    let filePath = path.join(ROOT, req.url === "/" ? "index.html" : req.url.split("?")[0]);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("404");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log("Migration server: http://localhost:" + PORT);
    console.log("Open: http://localhost:" + PORT + "/migrate.html");
  });

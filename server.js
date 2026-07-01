// Sparkle Log — minimal static server for production use
// Used by start-sparkle.bat for reliable auto-start
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
    const safePath = req.url.split("?")[0].replace(/\.\.\//g, "");
    let filePath = path.join(ROOT, safePath === "/" ? "index.html" : safePath);

    // SPA fallback: non-file routes → index.html
    if (!fs.existsSync(filePath) && !path.extname(filePath)) {
      filePath = path.join(ROOT, "index.html");
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end();
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log("Sparkle Log: http://localhost:" + PORT);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log("Port " + PORT + " already in use (server likely running)");
      process.exit(0);
    }
    throw err;
  });

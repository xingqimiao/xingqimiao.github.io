import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
};

const root = path.resolve(process.argv[2] || process.cwd());
const PORT = Number(process.env.PORT || 8790);

function respond(res, file) {
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/" || urlPath === "/index.html") {
      respond(res, path.join(root, "index.html"));
      return;
    }
    const clean = urlPath.replace(/^\/+/, "");
    const file = path.join(root, clean);
    fs.stat(file, (error, stat) => {
      if (!error && stat.isFile() && path.extname(file)) {
        respond(res, file);
        return;
      }
      if (!path.extname(file)) {
        const htmlCandidate = `${file}.html`;
        fs.access(htmlCandidate, fs.constants.F_OK, (accessError) => {
          if (!accessError) {
            respond(res, htmlCandidate);
            return;
          }
          if (!error && stat && stat.isDirectory()) {
            respond(res, path.join(file, "index.html"));
            return;
          }
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("404 not found");
        });
        return;
      }
      respond(res, file);
    });
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log(`Preview server: http://127.0.0.1:${PORT}`);
  });
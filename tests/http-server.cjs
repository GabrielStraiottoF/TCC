// Servidor HTTP estático para testes de navegador. Usa apenas APIs nativas do Node.
const fs = require("fs");
const http = require("http");
const path = require("path");

const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav",
    ".webp": "image/webp",
};

function startStaticServer(rootDirectory, port, host = "127.0.0.1") {
    const root = path.resolve(rootDirectory);
    const server = http.createServer((request, response) => {
        if (request.method !== "GET" && request.method !== "HEAD") {
            response.writeHead(405, { Allow: "GET, HEAD" });
            response.end("Method Not Allowed");
            return;
        }

        let pathname;
        try {
            pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
        } catch (_) {
            response.writeHead(400);
            response.end("Bad Request");
            return;
        }

        const relativePath = pathname.replace(/^\/+/, "");
        let filePath = path.resolve(root, relativePath || "index.html");
        if (filePath !== root && !filePath.startsWith(root + path.sep)) {
            response.writeHead(403);
            response.end("Forbidden");
            return;
        }

        try {
            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                filePath = path.join(filePath, "index.html");
            }
            const stat = fs.statSync(filePath);
            if (!stat.isFile()) throw new Error("Not a file");
            response.writeHead(200, {
                "Content-Length": stat.size,
                "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
                "Cache-Control": "no-store",
            });
            if (request.method === "HEAD") response.end();
            else fs.createReadStream(filePath).pipe(response);
        } catch (_) {
            response.writeHead(404);
            response.end("Not Found");
        }
    });

    return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
            server.removeListener("error", reject);
            resolve({
                close: () => new Promise((done, fail) => {
                    server.close(error => error ? fail(error) : done());
                    server.closeAllConnections?.();
                }),
            });
        });
    });
}

module.exports = { startStaticServer };

"use strict";

/**
 * Zero-dependency local dev server for the frontend.
 *
 * Why this exists: the router uses the History API (pushState), so deep
 * links like /movies/3/showings need the server to fall back to index.html
 * instead of 404ing. It also proxies /api/* to the Spring Boot backend so
 * the browser only ever talks to one origin, same as the nginx setup used
 * in production (frontend/nginx/default.conf.template) — no CORS needed.
 *
 * Usage:
 *   node dev-server.js
 *   # optional: PORT=5173 BACKEND_URL=http://localhost:8080 node dev-server.js
 *
 * Then open http://localhost:5173
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT) || 5173;
const BACKEND_URL = new URL(process.env.BACKEND_URL || "http://localhost:8080");
const ROOT = __dirname;

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (requestUrl.pathname.startsWith("/api/")) {
        proxyToBackend(req, res);
        return;
    }

    serveStatic(requestUrl.pathname, res);
});

function proxyToBackend(req, res) {
    const proxyReq = http.request(
        {
            protocol: BACKEND_URL.protocol,
            hostname: BACKEND_URL.hostname,
            port: BACKEND_URL.port,
            path: req.url,
            method: req.method,
            headers: { ...req.headers, host: BACKEND_URL.host },
        },
        (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        }
    );

    proxyReq.on("error", (error) => {
        console.error("Proxy error:", error.message);
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end(`Bad Gateway: could not reach backend at ${BACKEND_URL.origin}`);
    });

    req.pipe(proxyReq);
}

function serveStatic(pathname, res) {
    const hasExtension = path.extname(pathname) !== "";
    const relativePath = hasExtension ? pathname : "/index.html";
    const filePath = path.join(ROOT, decodeURIComponent(relativePath));

    // Guard against path traversal outside the frontend root.
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            if (hasExtension) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not found");
                return;
            }
            // Unknown non-file route: still fall back to index.html so the
            // client-side router can render its own 404 view.
            fs.readFile(path.join(ROOT, "index.html"), (fallbackError, fallbackData) => {
                if (fallbackError) {
                    res.writeHead(500);
                    res.end("index.html missing");
                    return;
                }
                res.writeHead(200, { "Content-Type": MIME_TYPES[".html"] });
                res.end(fallbackData);
            });
            return;
        }

        const contentType = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

server.listen(PORT, () => {
    console.log(`KinoXP frontend dev server running at http://localhost:${PORT}`);
    console.log(`Proxying /api/* to ${BACKEND_URL.origin}`);
});

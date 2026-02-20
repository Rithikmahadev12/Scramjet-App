// src/index.js
import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fetch from "node-fetch"; // <- important for Option 1 proxy

import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

const fastify = Fastify({
    serverFactory: (handler) => {
        return createServer()
            .on("request", (req, res) => {
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                handler(req, res);
            });
    },
});

// -------------------
// Static file serving
// -------------------
fastify.register(fastifyStatic, { root: publicPath, decorateReply: true });
fastify.register(fastifyStatic, { root: scramjetPath, prefix: "/scram/", decorateReply: false });
fastify.register(fastifyStatic, { root: libcurlPath, prefix: "/libcurl/", decorateReply: false });
fastify.register(fastifyStatic, { root: baremuxPath, prefix: "/baremux/", decorateReply: false });

// -------------------
// Simple proxy for iframe-able sites
fastify.get("/wisp-proxy", async (req, reply) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return reply.code(400).send("Missing URL parameter");

    // Only allow YouTube and Instagram
    if (!/youtube\.com|instagram\.com/.test(targetUrl)) {
        return reply.code(403).send("Site not allowed in XenOS window");
    }

    try {
        const res = await fetch(targetUrl, { redirect: "follow" });
        const body = await res.text();

        // Remove iframe-blocking headers
        reply.header("X-Frame-Options", "ALLOWALL");
        reply.header("Content-Security-Policy", "frame-ancestors *");

        return reply.type("text/html").send(body);
    } catch (err) {
        console.error("Proxy fetch error:", err);
        return reply.code(500).send("Proxy fetch error: " + err.toString());
    }
});

// -------------------
// 404 handler
fastify.setNotFoundHandler((res, reply) => {
    return reply.code(404).type("text/html").sendFile("404.html");
});

// -------------------
// Server listening
fastify.server.on("listening", () => {
    const address = fastify.server.address();
    console.log("Listening on:");
    console.log(`\thttp://localhost:${address.port}`);
    console.log(`\thttp://${hostname()}:${address.port}`);
    console.log(`\thttp://${address.family === "IPv6" ? `[${address.address}]` : address.address}:${address.port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
function shutdown() {
    console.log("SIGTERM signal received: closing HTTP server");
    fastify.close();
    process.exit(0);
}

// -------------------
// Start server
let port = parseInt(process.env.PORT || "");
if (isNaN(port)) port = 8080;

fastify.listen({
    port: port,
    host: "0.0.0.0",
});

// src/index.js
import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));

// -------------------
// Wisp Configuration
// -------------------
logging.set_level(logging.NONE);
Object.assign(wisp.options, {
    allow_udp_streams: false,
    hostname_blacklist: [/example\.com/],
    hostname_whitelist: [/youtube\.com/, /tiktok\.com/, /.*\.google\.com/],
    dns_servers: ["1.1.1.3", "1.0.0.3"],
});

const fastify = Fastify({
    serverFactory: (handler) => {
        return createServer()
            .on("request", (req, res) => {
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                handler(req, res);
            })
            .on("upgrade", (req, socket, head) => {
                if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
                else socket.end();
            });
    },
});

// -------------------
// Serve static files
// -------------------
fastify.register(fastifyStatic, { root: publicPath, decorateReply: true });
fastify.register(fastifyStatic, { root: scramjetPath, prefix: "/scram/", decorateReply: false });
fastify.register(fastifyStatic, { root: libcurlPath, prefix: "/libcurl/", decorateReply: false });
fastify.register(fastifyStatic, { root: baremuxPath, prefix: "/baremux/", decorateReply: false });

// -------------------
// Wisp Proxy Route (Scramjet Transport)
// -------------------
// This replaces node-fetch for sites like YouTube/TikTok
fastify.get("/wisp-proxy", async (req, reply) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return reply.code(400).send("Missing URL parameter");

    try {
        // Use Wisp transport to fetch the URL
        // Returns a streaming HTML response suitable for Scramjet iframe
        const frame = await wisp.fetch(targetUrl, {
            redirect: "follow",
            // Cookies are handled by Wisp
            headers: {
                "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
            },
        });

        reply.header("X-Frame-Options", "ALLOWALL");
        reply.header("Content-Security-Policy", "frame-ancestors *");
        return reply.type("text/html").send(frame.body);
    } catch (err) {
        console.error("Scramjet/Wisp Proxy Error:", err);
        return reply.code(500).send("Scramjet Proxy Error: " + err.toString());
    }
});

// -------------------
// 404 handler
// -------------------
fastify.setNotFoundHandler((res, reply) => {
    return reply.code(404).type("text/html").sendFile("404.html");
});

// -------------------
// Server listening
// -------------------
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
// -------------------
let port = parseInt(process.env.PORT || "");
if (isNaN(port)) port = 8080;

fastify.listen({
    port: port,
    host: "0.0.0.0",
});

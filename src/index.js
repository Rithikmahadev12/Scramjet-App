import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
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
    dns_servers: ["1.1.1.3", "1.0.0.3"],
});

// -------------------
// Fastify Setup
// -------------------
const fastify = Fastify({
    serverFactory: (handler) => {
        return createServer()
            .on("request", (req, res) => {
                // COOP/COEP headers for SharedArrayBuffer support
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                handler(req, res);
            })
            .on("upgrade", (req, socket, head) => {
                if (req.url.startsWith("/wisp/")) {
                    wisp.routeRequest(req, socket, head);
                } else {
                    socket.destroy(); // ensure proper closure
                }
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
// Full proxy route for iframe embedding
// -------------------
fastify.get("/proxy/*", async (req, reply) => {
    const targetUrl = req.params["*"];

    // Validate target URL
    try {
        const url = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);

        // Optional: disallow local network / file URLs
        if (["127.0.0.1", "localhost"].includes(url.hostname)) {
            return reply.code(403).send("Access to local URLs is forbidden.");
        }

        const frame = wisp.createFrame();
        const html = await frame.fetch(url.href);

        // Allow iframe embedding
        reply.header("Content-Security-Policy", "frame-ancestors *");

        return reply.type("text/html").send(html);
    } catch (err) {
        console.error("Scramjet Proxy Error:", err);
        return reply.code(500).type("text/html").send(`
            <h2>Scramjet Proxy Error</h2>
            <pre>${err.toString()}</pre>
        `);
    }
});

// -------------------
// 404 handler
// -------------------
fastify.setNotFoundHandler((request, reply) => {
    return reply.code(404).type("text/html").sendFile("404.html");
});

// -------------------
// Server listening
// -------------------
const port = parseInt(process.env.PORT) || 8080;

async function startServer() {
    try {
        await fastify.listen({ port, host: "0.0.0.0" });
        console.log(`Matriarchs OS backend running at http://localhost:${port}`);
        console.log(`Access from your network: http://${hostname()}:${port}`);
    } catch (err) {
        console.error("Server failed to start:", err);
        process.exit(1);
    }
}
startServer();

// -------------------
// Graceful shutdown
// -------------------
async function shutdown(signal) {
    console.log(`${signal} signal received: closing HTTP server...`);
    try {
        await fastify.close();
        console.log("Server closed gracefully.");
        process.exit(0);
    } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

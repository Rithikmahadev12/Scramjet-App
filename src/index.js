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
                res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                handler(req, res);
            })
            .on("upgrade", (req, socket, head) => {
                if (req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
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
// Full proxy route for iframe embedding
// -------------------
fastify.get("/proxy/*", async (req, reply) => {
    const targetUrl = req.params["*"];
    try {
        // Use wisp for fetching remote page
        const frame = wisp.createFrame();
        const html = await frame.fetch(targetUrl);

        // Rewrite headers to allow iframe embedding
        reply.header("X-Frame-Options", "ALLOWALL");
        reply.header("Content-Security-Policy", "frame-ancestors *");

        return reply.type("text/html").send(html);
    } catch (err) {
        console.error("Scramjet Proxy Error:", err);
        return reply.code(500).send(`
            <h2>Scramjet Proxy Error</h2>
            <pre>${err.toString()}</pre>
        `);
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
const port = parseInt(process.env.PORT) || 8080;
fastify.listen({ port, host: "0.0.0.0" }, () => {
    console.log(`Matriarchs OS backend running at http://localhost:${port}`);
    console.log(`Access from your network: http://${hostname()}:${port}`);
});

// -------------------
// Graceful shutdown
// -------------------
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
function shutdown() {
    console.log("SIGTERM signal received: closing HTTP server");
    fastify.close();
    process.exit(0);
}

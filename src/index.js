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
                if (req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
                else socket.end();
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
// Wisp Proxy Route (for TikTok, YouTube, etc.)
// -------------------
fastify.get("/wisp-proxy", async (req, reply) => {
    const url = req.query.url;
    if (!url) return reply.code(400).send("Missing url parameter");

    try {
        // Create a temporary Scramjet/Wisp frame URL
        // The frontend will call: frame.go(`/wisp-proxy?url=${encodeURIComponent(url)}`)
        // Scramjet/Wisp will handle the site correctly even with redirects/cookies
        // Here, we just return an HTML page that launches the Wisp frame
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Scramjet Proxy</title>
            </head>
            <body style="margin:0;padding:0;overflow:hidden;">
                <script src="/scram/scramjet.all.js"></script>
                <script src="/baremux/index.js"></script>
                <script>
                    const { ScramjetController } = $scramjetLoadController();
                    const scramjet = new ScramjetController({
                        files:{
                            wasm:"/scram/scramjet.wasm.wasm",
                            all:"/scram/scramjet.all.js",
                            sync:"/scram/scramjet.sync.js"
                        }
                    });
                    scramjet.init();
                    const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
                    (async()=>{
                        const frame = scramjet.createFrame();
                        document.body.appendChild(frame.frame);
                        await connection.setTransport("/libcurl/index.mjs", [{ websocket: (location.protocol==="https:"?"wss":"ws") + "://" + location.host + "/wisp/"}]);
                        frame.go("${url}");
                    })();
                </script>
            </body>
            </html>
        `;
        return reply.type("text/html").send(html);
    } catch (err) {
        return reply.code(500).send(err.toString());
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
    console.log(`\thttp://${address.family==="IPv6" ? `[${address.address}]` : address.address}:${address.port}`);
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

// -------------------
// Start server
// -------------------
let port = parseInt(process.env.PORT || "");
if (isNaN(port)) port = 8080;

fastify.listen({
    port: port,
    host: "0.0.0.0",
});

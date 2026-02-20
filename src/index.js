import { createServer } from "node:http";
import { fileURLToPath } from "url";
import { hostname } from "node:os";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import fetch from "node-fetch";

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

// Serve static files
fastify.register(fastifyStatic, { root: publicPath, decorateReply: true });
fastify.register(fastifyStatic, { root: scramjetPath, prefix: "/scram/", decorateReply: false });
fastify.register(fastifyStatic, { root: libcurlPath, prefix: "/libcurl/", decorateReply: false });
fastify.register(fastifyStatic, { root: baremuxPath, prefix: "/baremux/", decorateReply: false });

// Proxy for iframe apps
fastify.get("/wisp-proxy", async (req, reply) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return reply.code(400).send("Missing url param");

  try {
    const res = await fetch(targetUrl, { redirect: "follow" });
    let body = await res.text();

    // Remove headers that block iframe
    reply.header("X-Frame-Options", "ALLOWALL");
    reply.header("Content-Security-Policy", "frame-ancestors *");
    reply.header("Access-Control-Allow-Origin", "*");

    return reply.type("text/html").send(body);
  } catch (err) {
    return reply.code(500).send("Scramjet Proxy Error: " + err.toString());
  }
});

// 404 handler
fastify.setNotFoundHandler((res, reply) => {
  return reply.code(404).type("text/html").sendFile("404.html");
});

// Start server
const port = parseInt(process.env.PORT) || 8080;
fastify.listen({ port, host: "0.0.0.0" }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

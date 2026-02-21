"use strict";

/* SCRAMJET INIT */

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  },
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

/* ELEMENTS */

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const proxyContainer = document.getElementById("proxy-container");

/* REGISTER SW + SEARCH */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  await registerSW();

  const query = address.value.trim();
  if (!query) return;

  const url = query.startsWith("http")
    ? query
    : "https://www.google.com/search?q=" + encodeURIComponent(query);

  const wispUrl =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/wisp/";

  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [
      { websocket: wispUrl },
    ]);
  }

  proxyContainer.innerHTML = "";
  proxyContainer.style.display = "block";

  const frame = scramjet.createFrame();
  frame.frame.style.width = "100%";
  frame.frame.style.height = "100%";
  frame.frame.style.border = "none";

  proxyContainer.appendChild(frame.frame);

  frame.go(url);
});

/* CLOCK */

const timeEl = document.getElementById("time");

setInterval(() => {
  timeEl.textContent = new Date().toLocaleTimeString();
}, 1000);

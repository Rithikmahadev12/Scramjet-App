"use strict";

/* =========================
   SCRAMJET INIT
========================= */

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

/* =========================
   ELEMENTS
========================= */

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const frameContainer = document.getElementById("frame-container");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

/* =========================
   FORM SUBMIT
========================= */

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  error.textContent = "";
  errorCode.textContent = "";

  try {
    await registerSW(); // from register-sw.js
  } catch (err) {
    error.textContent = "Service Worker failed.";
    errorCode.textContent = err.toString();
    return;
  }

  const url = search(address.value, searchEngine.value);

  const wispUrl =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/wisp/";

  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [
      { websocket: wispUrl },
    ]);
  }

  frameContainer.innerHTML = "";

  const frame = scramjet.createFrame();
  frame.frame.style.width = "100%";
  frame.frame.style.height = "600px";
  frame.frame.style.border = "none";

  frameContainer.appendChild(frame.frame);

  frame.go(url);
});

/* =========================
   SEARCH HELPER
========================= */

function search(query, engine) {
  if (!query) return "";
  if (query.startsWith("http://") || query.startsWith("https://")) {
    return query;
  }
  return engine.replace("%s", encodeURIComponent(query));
}

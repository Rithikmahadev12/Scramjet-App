"use strict";

/* SCREEN SWITCHING */

document.querySelectorAll(".dock button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(btn.dataset.screen).classList.add("active");
  };
});

/* SEARCH → BROWSER */

const homeSearch = document.getElementById("home-search");
const urlBar = document.getElementById("url-bar");

function formatInput(input) {
  if (input.startsWith("http")) return input;
  if (input.includes(".")) return "https://" + input;
  return "https://search.brave.com/search?q=" + encodeURIComponent(input);
}

homeSearch.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    navigate(formatInput(homeSearch.value));
    switchToBrowser();
  }
});

function switchToBrowser() {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("browser-screen").classList.add("active");
}

/* SCRAMJET SETUP */

const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  }
});

scramjet.init();
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

let activeFrame = null;

async function navigate(url) {
  await registerSW();

  const wispUrl =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/wisp/";

  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [
      { websocket: wispUrl }
    ]);
  }

  if (!activeFrame) {
    activeFrame = scramjet.createFrame();
    activeFrame.frame.style.width = "100%";
    activeFrame.frame.style.height = "100%";
    activeFrame.frame.style.border = "none";
    document.getElementById("proxy-container").appendChild(activeFrame.frame);
  }

  activeFrame.go(url);
}

/* SIMPLE GAME LOADER */

const games = [
  { icon: "https://via.placeholder.com/200", url: "https://example.com" }
];

const grid = document.getElementById("games-grid");

games.forEach(game => {
  const card = document.createElement("div");
  card.className = "game-card";

  const img = document.createElement("img");
  img.src = game.icon;

  card.appendChild(img);
  card.onclick = () => {
    navigate(game.url);
    switchToBrowser();
  };

  grid.appendChild(card);
});

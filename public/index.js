"use strict";

/* SCREEN SWITCHING */

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(btn.dataset.screen).classList.add("active");
  };
});

/* SCRAMJET */

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

/* SEARCH */

function formatInput(input) {
  if (input.startsWith("http")) return input;
  if (input.includes(".")) return "https://" + input;
  return "https://search.brave.com/search?q=" + encodeURIComponent(input);
}

document.getElementById("home-search").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    navigate(formatInput(e.target.value));
    document.querySelector('[data-screen="browser"]').click();
  }
});

/* GAMES */

const gamesGrid = document.getElementById("games-grid");

fetch("games.json") // YOU create this file locally
  .then(res => res.json())
  .then(games => {
    games.forEach(game => {
      const card = document.createElement("div");
      card.className = "game-card";

      const img = document.createElement("img");
      img.src = game.icon;

      card.appendChild(img);

      card.onclick = () => {
        navigate(game.url);
        document.querySelector('[data-screen="browser"]').click();
      };

      gamesGrid.appendChild(card);
    });
  });

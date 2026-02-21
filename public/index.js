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

/* SCRAMJET INIT */
let scramjet, connection, activeFrame = null;
async function initScramjet() {
    const { ScramjetController } = $scramjetLoadController();
    scramjet = new ScramjetController({
        files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" }
    });
    await scramjet.init();
    connection = new BareMux.BareMuxConnection("/baremux/worker.js");
}

/* NAVIGATE */
async function navigate(url) {
    if (!scramjet) await initScramjet();
    await registerSW();
    const wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
    if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
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

/* HOME SEARCH */
document.getElementById("home-search").addEventListener("keydown", e => {
    if (e.key === "Enter") {
        navigate(formatInput(e.target.value));
        document.querySelector('[data-screen="browser"]').click();
    }
});

/* BROWSER SEARCH */
document.getElementById("url-bar").addEventListener("keydown", e => {
    if (e.key === "Enter") navigate(formatInput(e.target.value));
});

/* ONBOARDING */
document.getElementById("start-btn").addEventListener("click", () => {
    document.getElementById("onboarding").classList.remove("active");
    document.querySelector('[data-screen="home"]').click();
});

/* GAMES */
const gamesGrid = document.getElementById("games-grid");
fetch("games.json")
.then(res => res.json())
.then(games => {
    games.forEach(game => {
        const card = document.createElement("div");
        card.className = "game-card";
        const img = document.createElement("img");
        img.src = game.icon;
        card.appendChild(img);
        card.onclick = () => { navigate(game.url); document.querySelector('[data-screen="browser"]').click(); };
        gamesGrid.appendChild(card);
    });
});

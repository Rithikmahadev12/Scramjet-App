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

const proxyContainer = document.getElementById("proxy-container");
const urlBar = document.getElementById("url-bar");
const goBtn = document.getElementById("go-btn");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const reloadBtn = document.getElementById("reload-btn");
const homeBtn = document.getElementById("home-btn");
const newTabBtn = document.getElementById("new-tab-btn");
const exitBtn = document.getElementById("exit-btn");
const tabBar = document.getElementById("tab-bar");

let tabs = [];
let activeTab = null;

/* FORMAT INPUT */

function formatInput(input) {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  if (input.includes(".") && !input.includes(" ")) {
    return "https://" + input;
  }

  return "https://search.brave.com/search?q=" + encodeURIComponent(input);
}

/* CREATE TAB */

function createTab(url = "https://search.brave.com/") {

  const frame = scramjet.createFrame();
  frame.frame.style.width = "100%";
  frame.frame.style.height = "100%";
  frame.frame.style.border = "none";

  const tabId = Date.now();

  const tabButton = document.createElement("div");
  tabButton.className = "tab";
  tabButton.textContent = "New Tab";

  tabButton.onclick = () => switchTab(tabId);

  tabBar.appendChild(tabButton);
  proxyContainer.appendChild(frame.frame);

  tabs.push({ id: tabId, frame, button: tabButton });

  switchTab(tabId);
  frame.go(url);
}

/* SWITCH TAB */

function switchTab(id) {
  tabs.forEach(tab => {
    tab.frame.frame.style.display = tab.id === id ? "block" : "none";
    tab.button.classList.toggle("active", tab.id === id);
  });

  activeTab = tabs.find(t => t.id === id);
}

/* NAVIGATION */

async function navigate() {
  await registerSW();

  const wispUrl =
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/wisp/";

  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [
      { websocket: wispUrl },
    ]);
  }

  const url = formatInput(urlBar.value);
  activeTab.frame.go(url);
}

/* BUTTON EVENTS */

goBtn.onclick = navigate;
urlBar.addEventListener("keydown", e => {
  if (e.key === "Enter") navigate();
});

backBtn.onclick = () => activeTab?.frame.frame.contentWindow.history.back();
forwardBtn.onclick = () => activeTab?.frame.frame.contentWindow.history.forward();
reloadBtn.onclick = () => activeTab?.frame.frame.contentWindow.location.reload();
homeBtn.onclick = () => activeTab?.frame.go("https://search.brave.com/");
newTabBtn.onclick = () => createTab();
exitBtn.onclick = () => proxyContainer.style.display = "none";

/* START FIRST TAB */

createTab();

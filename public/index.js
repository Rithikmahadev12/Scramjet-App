"use strict";

/* ELEMENTS */

const onboarding = document.getElementById("onboarding");
const usernameInput = document.getElementById("username");
const startBtn = document.getElementById("start-btn");

const homeScreen = document.getElementById("home-screen");
const browserScreen = document.getElementById("browser-screen");

const homeSearch = document.getElementById("home-search");
const homeGo = document.getElementById("home-go");

const urlBar = document.getElementById("url-bar");
const backBtn = document.getElementById("back-btn");
const forwardBtn = document.getElementById("forward-btn");
const reloadBtn = document.getElementById("reload-btn");
const homeBtn = document.getElementById("home-btn");
const newTabBtn = document.getElementById("new-tab-btn");
const exitBtn = document.getElementById("exit-btn");

const tabBar = document.getElementById("tab-bar");
const proxyContainer = document.getElementById("proxy-container");

/* SCRAMJET */

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

/* USER STORAGE */

if (!localStorage.getItem("user")) {
  onboarding.classList.remove("hidden");
}

startBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) return;
  localStorage.setItem("user", name);
  onboarding.classList.add("hidden");
};

/* NAVIGATION LOGIC */

let tabs = [];
let activeTab = null;

function formatInput(input) {
  if (input.startsWith("http")) return input;
  if (input.includes(".") && !input.includes(" "))
    return "https://" + input;
  return "https://search.brave.com/search?q=" + encodeURIComponent(input);
}

async function navigate(url) {
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

  activeTab.frame.go(url);
}

function createTab(startUrl = "https://search.brave.com/") {
  const frame = scramjet.createFrame();
  frame.frame.style.width = "100%";
  frame.frame.style.height = "100%";
  frame.frame.style.border = "none";

  proxyContainer.appendChild(frame.frame);

  const id = Date.now();

  const tabBtn = document.createElement("div");
  tabBtn.className = "tab";
  tabBtn.textContent = "New Tab";
  tabBar.appendChild(tabBtn);

  tabs.push({ id, frame, button: tabBtn });

  tabBtn.onclick = () => switchTab(id);
  switchTab(id);

  frame.go(startUrl);
}

function switchTab(id) {
  tabs.forEach(t => {
    t.frame.frame.style.display = t.id === id ? "block" : "none";
    t.button.classList.toggle("active", t.id === id);
  });

  activeTab = tabs.find(t => t.id === id);
}

/* EVENTS */

homeGo.onclick = () => {
  browserScreen.classList.add("active");
  homeScreen.classList.remove("active");

  const url = formatInput(homeSearch.value);
  createTab(url);
};

urlBar.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    navigate(formatInput(urlBar.value));
  }
});

backBtn.onclick = () => activeTab.frame.frame.contentWindow.history.back();
forwardBtn.onclick = () => activeTab.frame.frame.contentWindow.history.forward();
reloadBtn.onclick = () => activeTab.frame.frame.contentWindow.location.reload();

homeBtn.onclick = () => {
  browserScreen.classList.remove("active");
  homeScreen.classList.add("active");
};

newTabBtn.onclick = () => createTab();
exitBtn.onclick = () => {
  browserScreen.classList.remove("active");
  homeScreen.classList.add("active");
};

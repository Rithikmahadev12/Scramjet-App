"use strict";

/* Elements */
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const proxyBar = document.getElementById("proxy-bar");
const proxyBack = document.getElementById("proxy-back");
const tabsContainer = document.getElementById("tabs");
const newTabBtn = document.getElementById("new-tab");

const bottomWelcome = document.getElementById("bottom-welcome");
const bottomOnline = document.getElementById("bottom-online");
const bottomTime = document.getElementById("bottom-time");
const bottomBattery = document.getElementById("bottom-battery");

/* Onboarding */
const onboarding = document.getElementById("onboarding");
const userNameInput = document.getElementById("user-name");
const startBtn = document.getElementById("start-btn");
const onboardThemeToggle = document.getElementById("onboard-theme-toggle");

/* Scramjet & BareMux */
const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
  },
});
scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

/* Tabs */
let tabs = [];
let activeTab = null;

function showPage(name) {
  document.querySelectorAll(".page").forEach(p => {
    p.hidden = p.id !== `page-${name}`;
    p.classList.toggle("active-page", p.id === `page-${name}`);
  });
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.page === name);
  });
}

function createTab(url) {
  const frame = scramjet.createFrame();
  frame.frame.style.position = "fixed";
  frame.frame.style.top = "0";
  frame.frame.style.left = "0";
  frame.frame.style.width = "100vw";
  frame.frame.style.height = "100vh";
  frame.frame.style.border = "none";
  frame.frame.style.zIndex = "9998";
  document.body.appendChild(frame.frame);

  const id = Date.now();
  tabs.push({ id, frame });
  setActiveTab(id);

  frame.go(url);
  proxyBar.hidden = false;
}

function setActiveTab(id) {
  tabs.forEach(tab => tab.frame.frame.style.display = tab.id === id ? "block" : "none");
  activeTab = id;
  renderTabs();
}

function closeTab(id) {
  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return;
  tabs[index].frame.frame.remove();
  tabs.splice(index, 1);
  if (tabs.length) setActiveTab(tabs[tabs.length - 1]?.id);
  else {
    proxyBar.hidden = true;
    showPage("home");
  }
}

function renderTabs() {
  tabsContainer.innerHTML = "";
  tabs.forEach(tab => {
    const el = document.createElement("div");
    el.className = "tab" + (tab.id === activeTab ? " active" : "");
    el.textContent = "Tab";
    el.onclick = () => setActiveTab(tab.id);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    };
    el.appendChild(closeBtn);
    tabsContainer.appendChild(el);
  });
}

/* Form submit */
form.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await registerSW();
  } catch (err) {
    console.error(err);
    return;
  }

  const url = search(address.value, searchEngine.value);
  const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";

  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
  }

  createTab(url);
});

/* New tab */
newTabBtn.onclick = () => createTab("https://www.google.com");

/* Home button */
proxyBack.onclick = () => {
  tabs.forEach(tab => tab.frame.frame.remove());
  tabs = [];
  proxyBar.hidden = true;
  showPage("home");
};

/* Nav buttons */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page || "home"));
});

/* Bottom status */
bottomWelcome.textContent = "Welcome back, Guest";

function updateOnline() {
  const count = navigator.onLine ? Math.floor(Math.random() * 500) + 50 : 0;
  bottomOnline.textContent = `Online: ${count}`;
}
window.addEventListener("online", updateOnline);
window.addEventListener("offline", updateOnline);
updateOnline();

function updateTime() {
  const now = new Date();
  bottomTime.textContent = now.toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

if (navigator.getBattery) {
  navigator.getBattery().then(bat => {
    function updateBattery() {
      bottomBattery.textContent = `🔋${Math.floor(bat.level * 100)}%`;
    }
    updateBattery();
    bat.addEventListener("levelchange", updateBattery);
    bat.addEventListener("chargingchange", updateBattery);
  });
}

/* Onboarding */
startBtn.onclick = () => {
  const name = userNameInput.value.trim() || "Guest";
  bottomWelcome.textContent = `Welcome back, ${name}`;
  onboarding.style.display = "none";
  if (onboardThemeToggle.checked) document.body.classList.add("dark-theme");
};

/* Onboarding theme toggle */
onboardThemeToggle.addEventListener("change", () => {
  if (onboardThemeToggle.checked) document.body.classList.add("dark-theme");
  else document.body.classList.remove("dark-theme");
});

/* Settings theme toggle */
const themeToggle = document.getElementById("theme-toggle");
themeToggle?.addEventListener("change", () => {
  if (themeToggle.checked) document.body.classList.add("dark-theme");
  else document.body.classList.remove("dark-theme");
});

/* Initial page */
showPage("home");

"use strict";

// Elements
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const onboarding = document.getElementById("onboarding");
const userNameInput = document.getElementById("user-name");
const startBtn = document.getElementById("start-btn");
const onboardThemeToggle = document.getElementById("onboard-theme-toggle");
const themeToggle = document.getElementById("theme-toggle");

const proxyBar = document.getElementById("proxy-bar");
const proxyBackBtn = document.getElementById("proxy-back");
const tabsContainer = document.getElementById("tabs");
const newTabBtn = document.getElementById("new-tab");

const bottomWelcome = document.getElementById("bottom-welcome");
const bottomOnline = document.getElementById("bottom-online");
const bottomTime = document.getElementById("bottom-time");
const bottomBattery = document.getElementById("bottom-battery");

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
const gameListEl = document.getElementById("game-list");

// Proxy & Scramjet setup (assuming your existing setup)
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

let tabs = [];
let currentTabId = null;

// Onboarding logic
function saveSettings(name, darkTheme) {
  localStorage.setItem("username", name);
  localStorage.setItem("darkTheme", darkTheme);
  applyTheme(darkTheme);
  bottomWelcome.textContent = `Welcome back, ${name || "Guest"}`;
}

function applyTheme(dark) {
  if (dark) document.body.classList.add("dark-theme");
  else document.body.classList.remove("dark-theme");
  if(themeToggle) themeToggle.checked = dark;
  if(onboardThemeToggle) onboardThemeToggle.checked = dark;
}

// Show onboarding if no username saved
function checkOnboarding() {
  const storedName = localStorage.getItem("username");
  const storedTheme = localStorage.getItem("darkTheme") === "true";

  if (!storedName) {
    onboarding.style.display = "flex";
  } else {
    onboarding.style.display = "none";
    saveSettings(storedName, storedTheme);
  }
}

// Start button on onboarding
startBtn.addEventListener("click", () => {
  const name = userNameInput.value.trim() || "Guest";
  const darkTheme = onboardThemeToggle.checked;
  saveSettings(name, darkTheme);
  onboarding.style.display = "none";
});

// Theme toggles syncing
themeToggle.addEventListener("change", e => {
  applyTheme(e.target.checked);
  localStorage.setItem("darkTheme", e.target.checked);
});

onboardThemeToggle.addEventListener("change", e => {
  applyTheme(e.target.checked);
});

// Tab and proxy UI logic

function createTab(url = "https://google.com") {
  const tabId = "tab-" + Date.now();

  const tab = {
    id: tabId,
    url,
    frame: null,
  };
  tabs.push(tab);

  renderTabs();
  openTab(tabId);
}

function renderTabs() {
  tabsContainer.innerHTML = "";
  tabs.forEach(tab => {
    const tabEl = document.createElement("div");
    tabEl.className = "tab";
    if (tab.id === currentTabId) tabEl.classList.add("active");
    tabEl.setAttribute("role", "tab");
    tabEl.setAttribute("aria-selected", tab.id === currentTabId);

    const titleSpan = document.createElement("span");
    titleSpan.textContent = tab.url.replace(/^https?:\/\//, "").split("/")[0];

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close tab");
    closeBtn.onclick = e => {
      e.stopPropagation();
      closeTab(tab.id);
    };

    tabEl.appendChild(titleSpan);
    tabEl.appendChild(closeBtn);

    tabEl.onclick = () => openTab(tab.id);
    tabsContainer.appendChild(tabEl);
  });
}

function openTab(tabId) {
  if (currentTabId === tabId) return;

  const oldTab = tabs.find(t => t.id === currentTabId);
  if (oldTab && oldTab.frame) oldTab.frame.frame.remove();

  currentTabId = tabId;
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  // Create and show iframe/frame for proxy here
  const frame = scramjet.createFrame();
  frame.frame.id = "sj-frame";
  tab.frame = frame;
  document.body.appendChild(frame.frame);
  proxyBar.hidden = false;

  // Hide all pages when proxy is open
  pages.forEach(p => p.hidden = true);

  frame.go(tab.url);
  renderTabs();
}

function closeTab(tabId) {
  const idx = tabs.findIndex(t => t.id === tabId);
  if (idx === -1) return;

  if (tabs[idx].frame) tabs[idx].frame.frame.remove();
  tabs.splice(idx, 1);

  if (currentTabId === tabId) {
    if (tabs.length > 0) {
      openTab(tabs[0].id);
    } else {
      proxyBar.hidden = true;
      showPage("home");
      currentTabId = null;
    }
  }
  renderTabs();
}

// Go back to home
proxyBackBtn.addEventListener("click", () => {
  if (currentTabId && tabs.find(t => t.id === currentTabId)?.frame) {
    tabs.find(t => t.id === currentTabId).frame.frame.remove();
  }
  tabs = [];
  currentTabId = null;
  proxyBar.hidden = true;
  showPage("home");
});

// Form submission (search)
form.addEventListener("submit", async e => {
  e.preventDefault();
  let url = address.value.trim();
  if (!url) return;

  // If not full URL, treat as search query
  if (!/^https?:\/\//i.test(url)) {
    url = searchEngine.value.replace("%s", encodeURIComponent(url));
  }

  if (!currentTabId) {
    createTab(url);
  } else {
    const tab = tabs.find(t => t.id === currentTabId);
    if (tab?.frame) tab.frame.go(url);
    tab.url = url;
    renderTabs();
  }
});

// Show page function and nav button logic
function showPage(name) {
  navButtons.forEach(b => b.classList.toggle("active", b.dataset.page === name));
  pages.forEach(p => {
    if (p.id === `page-${name}`) {
      p.hidden = false;
      p.classList.add("active-page");
    } else {
      p.hidden = true;
      p.classList.remove("active-page");
    }
  });
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    proxyBar.hidden = true;
    tabs.forEach(t => {
      if (t.frame) t.frame.frame.remove();
    });
    tabs = [];
    currentTabId = null;
    showPage(btn.dataset.page);
  });
});

// Bottom status updates (time, battery)
function updateTime() {
  const now = new Date();
  bottomTime.textContent = now.toLocaleTimeString();
}
setInterval(updateTime, 1000);
updateTime();

if (navigator.getBattery) {
  navigator.getBattery().then(battery => {
    function updateBattery() {
      bottomBattery.textContent = `🔋${Math.round(battery.level * 100)}%`;
    }
    updateBattery();
    battery.addEventListener("levelchange", updateBattery);
  });
}

// Online status
function updateOnline() {
  bottomOnline.textContent = `Online: ${navigator.onLine ? 1 : 0}`;
}
window.addEventListener("online", updateOnline);
window.addEventListener("offline", updateOnline);
updateOnline();

// Load GN Math games from GitHub repo JSON (we'll hardcode game list here)
const gnMathGames = [
  {
    title: "GN Math Game 1",
    url: "https://stacknoo.github.io/gn-math/game1/index.html",
  },
  {
    title: "GN Math Game 2",
    url: "https://stacknoo.github.io/gn-math/game2/index.html",
  },
  {
    title: "GN Math Game 3",
    url: "https://stacknoo.github.io/gn-math/game3/index.html",
  },
  // Add more if you want, you can scrape repo later to get exact game URLs
];

function loadGames() {
  gameListEl.innerHTML = "";
  gnMathGames.forEach(game => {
    const el = document.createElement("div");
    el.className = "game-item";
    el.textContent = game.title;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-pressed", "false");
    el.addEventListener("click", () => {
      createTab(game.url);
      showPage("home");
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
    gameListEl.appendChild(el);
  });
}

// Init
checkOnboarding();
loadGames();
showPage("home");


"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");

const onboarding = document.getElementById("onboarding");
const userNameInput = document.getElementById("user-name");
const startBtn = document.getElementById("start-btn");
const onboardThemeToggle = document.getElementById("onboard-theme-toggle");
const themeToggle = document.getElementById("theme-toggle");

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
const shortcutButtons = document.querySelectorAll(".shortcut-btn");
const proxyBar = document.getElementById("proxy-bar");
const tabsContainer = document.getElementById("tabs");
const newTabBtn = document.getElementById("new-tab");
const proxyBackBtn = document.getElementById("proxy-back");

const bottomWelcome = document.getElementById("bottom-welcome");
const bottomOnline = document.getElementById("bottom-online");
const bottomTime = document.getElementById("bottom-time");
const bottomBattery = document.getElementById("bottom-battery");

const gameListEl = document.getElementById("game-list");

// Scramjet and BareMux setup
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

// Tabs state
let tabs = [];
let currentTabId = null;

// Utils
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function saveSettings(name, darkTheme) {
  localStorage.setItem("matriarchs-name", name);
  localStorage.setItem("matriarchs-dark", darkTheme ? "1" : "0");
}

function loadSettings() {
  return {
    name: localStorage.getItem("matriarchs-name") || null,
    darkTheme: localStorage.getItem("matriarchs-dark") === "1",
  };
}

function applyTheme(isDark) {
  if (isDark) document.body.classList.add("dark-theme");
  else document.body.classList.remove("dark-theme");
  themeToggle.checked = isDark;
  onboardThemeToggle.checked = isDark;
}

function updateBottomBar(name) {
  bottomWelcome.textContent = `Welcome back, ${name || "Guest"}`;
}

function updateOnline() {
  bottomOnline.textContent = `Online: ${navigator.onLine ? 1 : 0}`;
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
  navigator.getBattery().then((battery) => {
    function updateBattery() {
      bottomBattery.textContent = `🔋${Math.round(battery.level * 100)}%`;
    }
    updateBattery();
    battery.addEventListener("levelchange", updateBattery);
  });
} else {
  bottomBattery.textContent = "🔋N/A";
}

// Onboarding flow
function checkOnboarding() {
  const settings = loadSettings();
  if (!settings.name) {
    onboarding.style.display = "flex";
  } else {
    applyTheme(settings.darkTheme);
    updateBottomBar(settings.name);
    onboarding.style.display = "none";
  }
}

startBtn.addEventListener("click", () => {
  const name = userNameInput.value.trim() || "Guest";
  const dark = onboardThemeToggle.checked;
  saveSettings(name, dark);
  applyTheme(dark);
  updateBottomBar(name);
  onboarding.style.display = "none";
});

// Theme toggle from settings
themeToggle.addEventListener("change", () => {
  const isDark = themeToggle.checked;
  applyTheme(isDark);
  const settings = loadSettings();
  saveSettings(settings.name, isDark);
  onboardThemeToggle.checked = isDark;
});

// Search URL helper
function search(query, engineTemplate) {
  query = query.trim();
  if (!query) return null;

  // If query looks like a URL, proxy directly
  try {
    const url = new URL(query);
    return url.href;
  } catch {
    // Not a valid URL, treat as search query
    return engineTemplate.replace("%s", encodeURIComponent(query));
  }
}

// Create and manage proxy tab
function createTab(url) {
  if (!url) return;

  // If URL already open, switch to it
  const existing = tabs.find((t) => t.url === url);
  if (existing) {
    activateTab(existing.id);
    return;
  }

  // Create new tab id
  const id = "tab-" + Date.now();

  // Create frame via scramjet
  const frame = scramjet.createFrame();
  frame.frame.id = id;
  frame.go(url);

  // Append iframe to DOM
  document.body.appendChild(frame.frame);
  frame.frame.style.position = "fixed";
  frame.frame.style.top = "0";
  frame.frame.style.left = "0";
  frame.frame.style.width = "100vw";
  frame.frame.style.height = "100vh";
  frame.frame.style.zIndex = "9000";
  frame.frame.style.border = "none";
  frame.frame.style.background = "#0a100a";

  // Hide other frames
  tabs.forEach((t) => {
    if (t.frame) t.frame.frame.style.display = "none";
  });

  tabs.push({ id, url, frame });
  currentTabId = id;
  updateTabsUI();

  // Show proxy bar
  proxyBar.hidden = false;
  showPage(null); // hide main pages
}

// Activate tab by ID
function activateTab(id) {
  tabs.forEach((t) => {
    if (t.id === id) {
      t.frame.frame.style.display = "block";
      currentTabId = id;
    } else if (t.frame) {
      t.frame.frame.style.display = "none";
    }
  });
  updateTabsUI();
}

// Close tab by ID
function closeTab(id) {
  const index = tabs.findIndex((t) => t.id === id);
  if (index < 0) return;

  const tab = tabs[index];
  if (tab.frame) {
    tab.frame.frame.remove();
  }
  tabs.splice(index, 1);

  // Activate last tab or hide proxy bar if no tabs
  if (tabs.length > 0) {
    activateTab(tabs[tabs.length - 1].id);
  } else {
    proxyBar.hidden = true;
    showPage("home");
  }
  updateTabsUI();
}

// Update proxy tabs UI
function updateTabsUI() {
  tabsContainer.innerHTML = "";
  tabs.forEach((tab) => {
    const el = document.createElement("div");
    el.className = "tab" + (tab.id === currentTabId ? " active" : "");
    el.setAttribute("role", "tab");
    el.setAttribute("aria-selected", tab.id === currentTabId ? "true" : "false");
    el.setAttribute("tabindex", "0");
    el.textContent = tab.url.length > 40 ? tab.url.slice(0, 37) + "..." : tab.url;

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.title = "Close tab";
    closeBtn.setAttribute("aria-label", "Close tab");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    el.appendChild(closeBtn);

    el.addEventListener("click", () => {
      activateTab(tab.id);
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateTab(tab.id);
      }
    });

    tabsContainer.appendChild(el);
  });
}

// Hide pages, show single page by name
function showPage(name) {
  if (!name) {
    // Hide all pages
    pages.forEach((p) => {
      p.classList.remove("active-page");
      p.setAttribute("hidden", "true");
    });
    return;
  }

  pages.forEach((p) => {
    if (p.id === "page-" + name) {
      p.classList.add("active-page");
      p.removeAttribute("hidden");
    } else {
      p.classList.remove("active-page");
      p.setAttribute("hidden", "true");
    }
  });

  // Update nav buttons active state
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === name);
  });

  // Hide proxy bar when on main pages
  proxyBar.hidden = true;
}

// Form submit handler for search
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let query = address.value.trim();
  if (!query) return;

  // Compose URL (search or direct)
  let url = search(query, searchEngine.value);
  if (!url) return;

  // Open in proxy tab
  createTab(url);
});

// Shortcut buttons open in proxy tab
shortcutButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const url = btn.dataset.url;
    if (url) createTab(url);
  });
});

// New tab button opens blank proxy tab with Google homepage
newTabBtn.addEventListener("click", () => {
  createTab("https://www.google.com");
});

// Back to home hides all proxy tabs and shows home page
proxyBackBtn.addEventListener("click", () => {
  // Remove all proxy tabs and frames
  tabs.forEach((t) => {
    if (t.frame) t.frame.frame.remove();
  });
  tabs = [];
  currentTabId = null;
  proxyBar.hidden = true;
  showPage("home");
});

// Navigation sidebar buttons
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (proxyBar.hidden === false) {
      // If proxy open, close it first
      tabs.forEach((t) => {
        if (t.frame) t.frame.frame.remove();
      });
      tabs = [];
      currentTabId = null;
      proxyBar.hidden = true;
    }
    showPage(btn.dataset.page);
  });
});

// Load GN Math Games from GitHub repo directly and run inside proxy
// Hardcoded URLs for simplicity - you can fetch this dynamically if preferred
const gnMathGames = [
  { title: "GN Math Addition", url: "https://stacknoo.github.io/gn-math/addition/index.html" },
  { title: "GN Math Subtraction", url: "https://stacknoo.github.io/gn-math/subtraction/index.html" },
  { title: "GN Math Multiplication", url: "https://stacknoo.github.io/gn-math/multiplication/index.html" },
  { title: "GN Math Division", url: "https://stacknoo.github.io/gn-math/division/index.html" },
];

function loadGames() {
  gameListEl.innerHTML = "";
  gnMathGames.forEach((game) => {
    const div = document.createElement("div");
    div.className = "game-item";
    div.textContent = game.title;
    div.tabIndex = 0;
    div.setAttribute("role", "button");
    div.setAttribute("aria-pressed", "false");
    div.addEventListener("click", () => {
      createTab(game.url);
      showPage(null); // Hide main pages, show proxy
    });
    div.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        div.click();
      }
    });
    gameListEl.appendChild(div);
  });
}

// Initialize UI
checkOnboarding();
loadGames();
showPage("home");

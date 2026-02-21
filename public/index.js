"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Elements
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

  // Settings persistence
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

  // Update bottom bar
  function updateBottomBar(name) {
    bottomWelcome.textContent = `Welcome back, ${name || "Guest"}`;
  }

  // Online/offline status
  function updateOnline() {
    bottomOnline.textContent = `Online: ${navigator.onLine ? 1 : 0}`;
  }
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
  updateOnline();

  // Time update
  function updateTime() {
    const now = new Date();
    bottomTime.textContent = now.toLocaleTimeString();
  }
  setInterval(updateTime, 1000);
  updateTime();

  // Battery status
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

  themeToggle.addEventListener("change", () => {
    const isDark = themeToggle.checked;
    applyTheme(isDark);
    const settings = loadSettings();
    saveSettings(settings.name, isDark);
    onboardThemeToggle.checked = isDark;
  });

  // Proxy & Scramjet setup
  let tabs = [];
  let currentTabId = null;

  // Wait for Scramjet to load
  async function initScramjet() {
    window.scramjet = await Scramjet.createController();

    // Add BareMuxConnection
    window.baremuxConnection = new Baremux.BareMuxConnection("/baremux/worker.js");
  }

  initScramjet().catch(console.error);

  // Create iframe proxy tab
  function createTab(url) {
    if (!url) return;

    // If tab exists, activate it
    const existing = tabs.find((t) => t.url === url);
    if (existing) {
      activateTab(existing.id);
      return;
    }

    const id = "tab-" + Date.now();

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = `/scramjet/${encodeURIComponent(url)}`;
    iframe.id = id;
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-modals allow-popups");
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "100vw";
    iframe.style.height = "100vh";
    iframe.style.zIndex = "9000";
    iframe.style.border = "none";
    iframe.style.background = "#0a100a";
    iframe.style.display = "block";

    // Hide other iframes
    tabs.forEach((t) => {
      t.iframe.style.display = "none";
    });

    document.body.appendChild(iframe);

    tabs.push({ id, url, iframe });
    currentTabId = id;
    updateTabsUI();

    // Show proxy bar and hide main pages
    proxyBar.hidden = false;
    showPage(null);
  }

  // Activate tab
  function activateTab(id) {
    tabs.forEach((t) => {
      t.iframe.style.display = t.id === id ? "block" : "none";
    });
    currentTabId = id;
    updateTabsUI();
  }

  // Close tab
  function closeTab(id) {
    const index = tabs.findIndex((t) => t.id === id);
    if (index === -1) return;
    const tab = tabs[index];
    tab.iframe.remove();
    tabs.splice(index, 1);

    if (tabs.length > 0) {
      activateTab(tabs[tabs.length - 1].id);
    } else {
      proxyBar.hidden = true;
      showPage("home");
    }
    updateTabsUI();
  }

  // Update tabs UI
  function updateTabsUI() {
    tabsContainer.innerHTML = "";
    tabs.forEach((tab) => {
      const tabEl = document.createElement("div");
      tabEl.className = "tab" + (tab.id === currentTabId ? " active" : "");
      tabEl.setAttribute("role", "tab");
      tabEl.setAttribute("aria-selected", tab.id === currentTabId ? "true" : "false");
      tabEl.setAttribute("tabindex", "0");
      tabEl.textContent = tab.url.length > 40 ? tab.url.slice(0, 37) + "..." : tab.url;

      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "✕";
      closeBtn.title = "Close tab";
      closeBtn.setAttribute("aria-label", "Close tab");
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      });
      tabEl.appendChild(closeBtn);

      tabEl.addEventListener("click", () => activateTab(tab.id));
      tabEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateTab(tab.id);
        }
      });

      tabsContainer.appendChild(tabEl);
    });
  }

  // Show pages or hide all
  function showPage(name) {
    if (!name) {
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

    // Update nav active
    navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.page === name);
    });

    // Hide proxy bar when on main pages
    proxyBar.hidden = true;
  }

  // Search helper
  function search(query, engineTemplate) {
    query = query.trim();
    if (!query) return null;

    try {
      const url = new URL(query);
      return url.href;
    } catch {
      return engineTemplate.replace("%s", encodeURIComponent(query));
    }
  }

  // Search form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = address.value;
    if (!q) return;
    const url = search(q, searchEngine.value);
    if (!url) return;
    createTab(url);
  });

  // Shortcut buttons open proxy tabs
  shortcutButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      if (url) createTab(url);
    });
  });

  // New tab button
  newTabBtn.addEventListener("click", () => createTab("https://www.google.com"));

  // Proxy back button closes all tabs and returns home
  proxyBackBtn.addEventListener("click", () => {
    tabs.forEach((t) => t.iframe.remove());
    tabs = [];
    currentTabId = null;
    proxyBar.hidden = true;
    showPage("home");
  });

  // Nav buttons switch main pages and close proxy if open
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!proxyBar.hidden) {
        tabs.forEach((t) => t.iframe.remove());
        tabs = [];
        currentTabId = null;
        proxyBar.hidden = true;
      }
      showPage(btn.dataset.page);
    });
  });

  // GN Math games URLs
  const gnMathGames = [
    { title: "GN Math Addition", url: "https://stacknoo.github.io/gn-math/addition/index.html" },
    { title: "GN Math Subtraction", url: "https://stacknoo.github.io/gn-math/subtraction/index.html" },
    { title: "GN Math Multiplication", url: "https://stacknoo.github.io/gn-math/multiplication/index.html" },
    { title: "GN Math Division", url: "https://stacknoo.github.io/gn-math/division/index.html" },
  ];

  // Load games into UI
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
        showPage(null);
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

  // Initialize everything
  checkOnboarding();
  loadGames();
  showPage("home");
});

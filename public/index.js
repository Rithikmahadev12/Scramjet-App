"use strict";

/* ======================
   ELEMENTS
====================== */

const UI = {
  onboarding: document.getElementById("onboarding"),
  usernameInput: document.getElementById("username"),
  startBtn: document.getElementById("start-btn"),

  homeScreen: document.getElementById("home-screen"),
  browserScreen: document.getElementById("browser-screen"),

  homeSearch: document.getElementById("home-search"),
  homeGo: document.getElementById("home-go"),

  urlBar: document.getElementById("url-bar"),
  backBtn: document.getElementById("back-btn"),
  forwardBtn: document.getElementById("forward-btn"),
  reloadBtn: document.getElementById("reload-btn"),
  homeBtn: document.getElementById("home-btn"),
  newTabBtn: document.getElementById("new-tab-btn"),
  exitBtn: document.getElementById("exit-btn"),

  tabBar: document.getElementById("tab-bar"),
  proxyContainer: document.getElementById("proxy-container")
};

/* ======================
   STATE
====================== */

const State = {
  tabs: [],
  activeTab: null,
  bookmarks: JSON.parse(localStorage.getItem("bookmarks") || "[]")
};

/* ======================
   UTILITIES
====================== */

function formatInput(input) {
  if (input.startsWith("http")) return input;
  if (input.includes(".") && !input.includes(" "))
    return "https://" + input;
  return "https://search.brave.com/search?q=" + encodeURIComponent(input);
}

function saveBookmarks() {
  localStorage.setItem("bookmarks", JSON.stringify(State.bookmarks));
}

/* ======================
   BOOKMARKS
====================== */

function createBookmarksPanel() {
  const panel = document.createElement("div");
  panel.id = "bookmarks-panel";
  document.body.appendChild(panel);
  renderBookmarks();
}

function renderBookmarks() {
  const panel = document.getElementById("bookmarks-panel");
  panel.innerHTML = "<h3>Bookmarks</h3>";

  State.bookmarks.forEach(b => {
    const item = document.createElement("div");
    item.className = "bookmark-item";
    item.textContent = b.title;
    item.onclick = () => navigate(b.url);
    panel.appendChild(item);
  });
}

function addBookmark(title, url) {
  State.bookmarks.push({ title, url });
  saveBookmarks();
  renderBookmarks();
}

/* ======================
   TABS
====================== */

function createTab(url) {
  const iframe = document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  UI.proxyContainer.appendChild(iframe);

  const id = Date.now();

  const tab = document.createElement("div");
  tab.className = "tab";

  const title = document.createElement("span");
  title.textContent = "New Tab";

  const close = document.createElement("span");
  close.textContent = "×";
  close.style.cursor = "pointer";

  close.onclick = e => {
    e.stopPropagation();
    closeTab(id);
  };

  tab.appendChild(title);
  tab.appendChild(close);
  UI.tabBar.appendChild(tab);

  const tabObj = { id, iframe, tab, title };
  State.tabs.push(tabObj);

  tab.onclick = () => switchTab(id);
  switchTab(id);

  iframe.src = url;
  iframe.onload = () => {
    title.textContent = iframe.contentDocument?.title || "New Tab";
  };
}

function switchTab(id) {
  State.tabs.forEach(t => {
    t.iframe.style.display = t.id === id ? "block" : "none";
    t.tab.classList.toggle("active", t.id === id);
  });

  State.activeTab = State.tabs.find(t => t.id === id);
  UI.urlBar.value = State.activeTab?.iframe.src || "";
}

function closeTab(id) {
  const index = State.tabs.findIndex(t => t.id === id);
  if (index === -1) return;

  State.tabs[index].iframe.remove();
  State.tabs[index].tab.remove();
  State.tabs.splice(index, 1);

  if (State.tabs.length) {
    switchTab(State.tabs[State.tabs.length - 1].id);
  }
}

/* ======================
   NAVIGATION
====================== */

function navigate(url) {
  if (!State.activeTab) return;
  State.activeTab.iframe.src = url;
}

/* ======================
   EVENTS
====================== */

UI.startBtn.onclick = () => {
  const name = UI.usernameInput.value.trim();
  if (!name) return;
  localStorage.setItem("user", name);
  UI.onboarding.classList.add("hidden");
};

UI.homeGo.onclick = () => {
  UI.browserScreen.classList.add("active");
  UI.homeScreen.classList.remove("active");
  createTab(formatInput(UI.homeSearch.value));
};

UI.urlBar.addEventListener("keydown", e => {
  if (e.key === "Enter") navigate(formatInput(UI.urlBar.value));
});

UI.newTabBtn.onclick = () => createTab("https://search.brave.com/");
UI.homeBtn.onclick = () => {
  UI.browserScreen.classList.remove("active");
  UI.homeScreen.classList.add("active");
};

UI.exitBtn.onclick = () => {
  UI.browserScreen.classList.remove("active");
  UI.homeScreen.classList.add("active");
};

UI.backBtn.onclick = () => State.activeTab?.iframe.contentWindow.history.back();
UI.forwardBtn.onclick = () => State.activeTab?.iframe.contentWindow.history.forward();
UI.reloadBtn.onclick = () => State.activeTab?.iframe.contentWindow.location.reload();

/* ======================
   INIT
====================== */

if (!localStorage.getItem("user")) {
  UI.onboarding.classList.remove("hidden");
}

createBookmarksPanel();

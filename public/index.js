"use strict";

/* ================= USER LOGIN SYSTEM ================= */

const loginScreen = document.getElementById("login-screen");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const userDisplay = document.getElementById("user-display");

function showDesktop(user) {
  loginScreen.style.display = "none";
  userDisplay.innerText = "👤 " + user;
}

function getUsers() {
  return JSON.parse(localStorage.getItem("mos_users") || "{}");
}

function saveUsers(users) {
  localStorage.setItem("mos_users", JSON.stringify(users));
}

loginBtn.onclick = () => {
  const u = username.value;
  const p = password.value;
  const users = getUsers();
  if (users[u] && users[u] === p) {
    localStorage.setItem("mos_current_user", u);
    showDesktop(u);
  } else {
    alert("Invalid login");
  }
};

registerBtn.onclick = () => {
  const u = username.value;
  const p = password.value;
  const users = getUsers();
  if (users[u]) return alert("User exists");
  users[u] = p;
  saveUsers(users);
  alert("Registered! Now login.");
};

const existingUser = localStorage.getItem("mos_current_user");
if (existingUser) showDesktop(existingUser);

/* ================= TASKBAR / LAUNCHPAD ================= */

const launchpad = document.getElementById("launchpad");
document.getElementById("start-btn").onclick = () => {
  launchpad.classList.toggle("hidden");
};

document.querySelectorAll(".launch-app, .dock-icon").forEach(btn => {
  btn.addEventListener("click", () => {
    openWindow(btn.dataset.app);
    launchpad.classList.add("hidden");
  });
});

/* ================= WINDOW MANAGER ================= */

const desktop = document.getElementById("desktop");
const windows = {};
let topZ = 1000;

function openWindow(appId) {
  if (windows[appId]) {
    windows[appId].style.display = "flex";
    windows[appId].style.zIndex = ++topZ;
    return;
  }

  const win = document.createElement("div");
  win.className = "window";
  win.style.width = "800px";
  win.style.height = "500px";
  win.style.top = "80px";
  win.style.left = "100px";
  win.style.zIndex = ++topZ;

  win.innerHTML = `
    <div class="title-bar">
      <span class="title">${appId}</span>
      <div class="controls">
        <button class="minimize">−</button>
        <button class="close">×</button>
      </div>
    </div>
    <div class="content" id="${appId}-content"></div>
  `;

  desktop.appendChild(win);
  windows[appId] = win;

  makeDraggable(win);

  win.querySelector(".close").onclick = () => {
    win.remove();
    delete windows[appId];
  };

  win.querySelector(".minimize").onclick = () => {
    win.style.display = "none";
  };

  const content = document.getElementById(`${appId}-content`);

  if (appId === "browser") loadProxy(content, "https://search.brave.com/");
  if (appId === "games") loadProxy(content, "https://poki.com/");
  if (appId === "apps") initApps(content);
  if (appId === "settings") content.innerHTML = "<h2>Settings</h2><button onclick='logout()'>Logout</button>";
}

function logout() {
  localStorage.removeItem("mos_current_user");
  location.reload();
}

function makeDraggable(el) {
  const bar = el.querySelector(".title-bar");
  let offsetX, offsetY, dragging = false;

  bar.onmousedown = e => {
    dragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.zIndex = ++topZ;
  };

  document.onmousemove = e => {
    if (!dragging) return;
    el.style.left = e.clientX - offsetX + "px";
    el.style.top = e.clientY - offsetY + "px";
  };

  document.onmouseup = () => dragging = false;
}

/* ================= SCRAMJET PROXY ================= */

let scramjet, connection, ready = false;

async function initProxy() {
  if (ready) return;
  const { ScramjetController } = $scramjetLoadController();
  scramjet = new ScramjetController({
    files: {
      wasm: "/scram/scramjet.wasm.wasm",
      all: "/scram/scramjet.all.js",
      sync: "/scram/scramjet.sync.js"
    }
  });
  await scramjet.init();
  connection = new BareMux.BareMuxConnection("/baremux/worker.js");
  ready = true;
}

async function loadProxy(container, url) {
  await initProxy();
  await registerSW();

  const frame = scramjet.createFrame();
  frame.frame.style.width = "100%";
  frame.frame.style.height = "100%";
  frame.frame.style.border = "none";
  container.appendChild(frame.frame);

  const wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
  await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);

  frame.go(url);
}

/* ================= APPS ================= */

function initApps(container) {
  container.innerHTML = `
    <h2>Apps</h2>
    <button id="cinehub-btn">🎬 CineHub</button>
  `;

  document.getElementById("cinehub-btn").onclick = () => {
    openWindow("cinehub");
  };
}

async function openCineHub(container) {
  loadProxy(container, "https://www.cineby.gd/");
}

const originalOpenWindow = openWindow;
openWindow = function(appId) {
  originalOpenWindow(appId);
  if (appId === "cinehub") {
    const content = document.getElementById("cinehub-content");
    openCineHub(content);
  }
};

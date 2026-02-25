"use strict";

/* ================= PARTICLES ================= */
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
const particles = [];
for (let i = 0; i < 200; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5
  });
}
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;
    if (p.x > canvas.width) p.x = 0;
    if (p.x < 0) p.x = canvas.width;
    if (p.y > canvas.height) p.y = 0;
    if (p.y < 0) p.y = canvas.height;
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* ================= STATUS BAR ================= */
function updateTime() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const day = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  document.getElementById("time").innerText = `${time} • ${day}`;
}
setInterval(updateTime, 1000);
updateTime();

navigator.getBattery().then(b => {
  function showBattery() {
    document.getElementById("battery").innerText = Math.floor(b.level * 100) + "%";
  }
  b.onlevelchange = showBattery;
  showBattery();
});

/* ================= ONBOARDING ================= */
document.getElementById("enter-os-btn").addEventListener("click", () => {
  document.getElementById("onboarding").style.display = "none";
});

/* ================= LAUNCHPAD ================= */
const launchpad = document.getElementById("launchpad");
const startBtn = document.getElementById("start-btn");
startBtn.addEventListener("click", () => {
  launchpad.classList.toggle("hidden");
});
launchpad.querySelectorAll(".launch-app").forEach(btn => {
  btn.addEventListener("click", () => {
    const appId = btn.dataset.app;
    openWindow(appId);
    launchpad.classList.add("hidden");
  });
});

/* ================= WINDOW MANAGER ================= */
const desktop = document.getElementById("desktop");
const taskbarWindows = document.getElementById("taskbar-windows");
const windows = {};

function openWindow(appId) {
  if (windows[appId]) {
    windows[appId].style.zIndex = Date.now();
    return;
  }

  const win = document.createElement("div");
  win.className = "window";
  win.style.width = "400px";
  win.style.height = "300px";
  win.style.top = "100px";
  win.style.left = "100px";
  win.innerHTML = `
    <div class="title-bar">
      <span class="title">${appId.charAt(0).toUpperCase() + appId.slice(1)}</span>
      <div class="controls">
        <button class="minimize">−</button>
        <button class="fullscreen">⬜</button>
        <button class="close">×</button>
      </div>
    </div>
    <div class="content" id="${appId}-content"></div>
  `;
  desktop.appendChild(win);
  windows[appId] = win;

  makeDraggable(win);
  updateTaskbar();

  const content = document.getElementById(`${appId}-content`);

  // Window control buttons
  const btnClose = win.querySelector(".close");
  const btnMin = win.querySelector(".minimize");
  const btnFS = win.querySelector(".fullscreen");
  let prevState = {};

  btnClose.onclick = () => {
    desktop.removeChild(win);
    delete windows[appId];
    updateTaskbar();
  };

  btnMin.onclick = () => {
    win.style.display = "none";
    updateTaskbar();
  };

  btnFS.onclick = () => {
    if (!win.classList.contains("fullscreen")) {
      // Save previous state
      prevState = {
        width: win.style.width,
        height: win.style.height,
        top: win.style.top,
        left: win.style.left
      };
      win.style.width = "100%";
      win.style.height = "100%";
      win.style.top = "0";
      win.style.left = "0";
      win.classList.add("fullscreen");
    } else {
      // Restore
      win.style.width = prevState.width;
      win.style.height = prevState.height;
      win.style.top = prevState.top;
      win.style.left = prevState.left;
      win.classList.remove("fullscreen");
    }
  };

  // Load apps
  if (appId === "browser") { initScramjetBrowser(content); }
  if (appId === "games") { initGNGames(content); }
  if (appId === "chat") { initChat(content); }
  if (appId === "settings") { content.innerHTML = `<p>Settings coming soon</p>`; }
}

function updateTaskbar() {
  taskbarWindows.innerHTML = "";
  Object.keys(windows).forEach(appId => {
    const btn = document.createElement("button");
    btn.innerText = appId.charAt(0).toUpperCase() + appId.slice(1);
    btn.onclick = () => {
      const win = windows[appId];
      win.style.display = "flex"; // restore if minimized
      win.style.zIndex = Date.now();
    };
    taskbarWindows.appendChild(btn);
  });
}

function makeDraggable(el) {
  const bar = el.querySelector(".title-bar");
  let offsetX, offsetY, dragging = false;
  bar.addEventListener("mousedown", e => {
    if (el.classList.contains("fullscreen")) return; // disable dragging in fullscreen
    dragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.zIndex = Date.now();
  });
  document.addEventListener("mousemove", e => {
    if (dragging) {
      el.style.left = (e.clientX - offsetX) + "px";
      el.style.top = (e.clientY - offsetY) + "px";
    }
  });
  document.addEventListener("mouseup", () => { dragging = false; });
}

/* ================= SCRAMJET BROWSER ================= */
let scramjet, connection, activeFrame = null, scramjetReady = false;
async function initScramjet() {
  if (scramjetReady) return;
  const { ScramjetController } = $scramjetLoadController();
  scramjet = new ScramjetController({
    files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" }
  });
  await scramjet.init();
  connection = new BareMux.BareMuxConnection("/baremux/worker.js");
  scramjetReady = true;
}

async function initScramjetBrowser(container) {
  if (!scramjetReady) await initScramjet();
  await registerSW();
  const wispUrl = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
  if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
    await connection.setTransport("/libcurl/index.mjs", [{ "websocket": wispUrl }]);
  }
  if (!activeFrame) {
    activeFrame = scramjet.createFrame();
    activeFrame.frame.style.width = "100%";
    activeFrame.frame.style.height = "100%";
    activeFrame.frame.style.border = "none";
    container.appendChild(activeFrame.frame);
  }
  if (activeFrame.waitUntilReady) await activeFrame.waitUntilReady();
  activeFrame.go("https://search.brave.com/");
}

/* ================= GN-MATH GAMES ================= */
async function initGNGames(container) {
  container.innerHTML = `<div id="gnGamesContainer" style="width:100%;height:100%;overflow:auto;display:flex;flex-wrap:wrap;gap:10px;padding:10px;">Loading games...</div>`;
  try {
    const zonesURL = "https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
    const coverURL = "https://cdn.jsdelivr.net/gh/gn-math/covers@main";
    const htmlURL = "https://cdn.jsdelivr.net/gh/gn-math/html@main";

    const response = await fetch(zonesURL);
    const zones = await response.json();
    const containerDiv = document.getElementById("gnGamesContainer");
    containerDiv.innerHTML = "";

    zones.forEach(zone => {
      const card = document.createElement("div");
      card.style.width = "120px";
      card.style.height = "140px";
      card.style.background = "#111";
      card.style.borderRadius = "10px";
      card.style.overflow = "hidden";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.alignItems = "center";
      card.style.justifyContent = "center";
      card.style.cursor = "pointer";

      const img = document.createElement("img");
      img.src = zone.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
      img.style.width = "100%";
      img.style.height = "80px";
      img.style.objectFit = "cover";
      card.appendChild(img);

      const label = document.createElement("span");
      label.innerText = zone.name;
      label.style.fontSize = "12px";
      label.style.textAlign = "center";
      label.style.marginTop = "5px";
      card.appendChild(label);

      card.onclick = () => openGNGame(zone.url, container);
      containerDiv.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = "Failed to load GN-Math games: " + err;
  }
}

async function openGNGame(url, contentDiv) {
  if (!scramjetReady) await initScramjet();
  contentDiv.innerHTML = "";

  const frame = scramjet.createFrame();
  frame.frame.style.width = "100%";
  frame.frame.style.height = "100%";
  frame.frame.style.border = "none";
  contentDiv.appendChild(frame.frame);

  try {
    let fullURL = url.replace("{HTML_URL}", "https://cdn.jsdelivr.net/gh/gn-math/html@main");
    const res = await fetch(fullURL);
    let html = await res.text();

    html = html.replace(
      /((src|href)=["'])(?!https?:|data:)/g,
      `$1https://cdn.jsdelivr.net/gh/gn-math/html@main/`
    );

    const dataURL = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    frame.go(dataURL);
  } catch (err) {
    contentDiv.innerHTML = "Failed to load game: " + err;
  }
}

/* ================= CHAT ================= */
function initChat(container) {
  container.innerHTML = `
    <div id="chat-window" style="height:100%;overflow:auto;background:rgba(0,0,0,0.7);padding:10px;margin-bottom:5px;"></div>
    <input id="chat-input" style="width:80%;padding:5px;border-radius:5px;" placeholder="Type a message...">
    <button id="chat-send">Send</button>
  `;
  const chatWindow = document.getElementById("chat-window");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const ws = new WebSocket("wss://yourserver.com"); // replace with WS server

  ws.onmessage = msg => {
    const data = JSON.parse(msg.data);
    chatWindow.innerHTML += `<div><strong>${data.user}</strong>: ${data.message}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  chatSend.addEventListener("click", () => {
    if (chatInput.value.trim() === "") return;
    ws.send(JSON.stringify({ user: "Guest", message: chatInput.value }));
    chatInput.value = "";
  });

  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") chatSend.click();
  });
}

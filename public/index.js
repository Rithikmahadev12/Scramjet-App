"use strict";

/* =========================
   OS PARTICLE BACKGROUND (unchanged)
========================= */
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

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

const mouse = { x: null, y: null };
canvas.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
canvas.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    if (mouse.x !== null && mouse.y !== null) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        p.vx -= dx * 0.0005;
        p.vy -= dy * 0.0005;
      }
    }

    p.x += p.vx;
    p.y += p.vy;

    if (p.x > canvas.width) p.x = 0;
    if (p.x < 0) p.x = canvas.width;
    if (p.y > canvas.height) p.y = 0;
    if (p.y < 0) p.y = canvas.height;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fill();
  });

  for (let a = 0; a < particles.length; a++) {
    for (let b = a; b < particles.length; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = dx * dx + dy * dy;
      if (dist < 120 * 120) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }

    if (mouse.x !== null && mouse.y !== null) {
      const dx = particles[a].x - mouse.x;
      const dy = particles[a].y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animateParticles);
}
animateParticles();

/* =========================
   STATUS BAR
========================= */
function updateTime() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const day = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
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

/* =========================
   ONBOARDING
========================= */
const onboarding = document.getElementById("onboarding");
const usernameInput = document.getElementById("username");
const enterBtn = document.getElementById("enter-os-btn");

function enterOS() {
  const name = usernameInput.value.trim();
  if (!name) { alert("Please enter your name"); usernameInput.focus(); return; }
  localStorage.setItem("username", name);
  onboarding.style.display = "none";
}
enterBtn.addEventListener("click", enterOS);
usernameInput.addEventListener("keydown", e => { if (e.key === "Enter") enterOS(); });
usernameInput.focus();

/* =========================
   THEME TOGGLE
========================= */
document.getElementById("theme-toggle").addEventListener("click", () => {
  const curr = getComputedStyle(document.body).backgroundImage;
  if (curr.includes("unsplash")) {
    document.body.style.background = "url('https://images.unsplash.com/photo-1612832020620-d12504dbb7dc?q=80&w=1170&auto=format&fit=crop') center/cover no-repeat fixed";
  } else {
    document.body.style.background = "url('https://images.unsplash.com/photo-1514897575457-c4db467cf78e?q=80&w=1170&auto=format&fit=crop') center/cover no-repeat fixed";
  }
});

/* =========================
   WINDOWS & TASKBAR
========================= */
const launchpad = document.getElementById("launchpad");
const startBtn = document.getElementById("start-btn");
const desktop = document.getElementById("desktop");
const taskbarWindows = document.getElementById("taskbar-windows");
const windows = {};

startBtn.addEventListener("click", () => launchpad.classList.toggle("hidden"));
launchpad.querySelectorAll(".launch-app").forEach(btn => {
  btn.addEventListener("click", async () => {
    const appId = btn.dataset.app;
    await openWindow(appId);
    launchpad.classList.add("hidden");
  });
});

/* =========================
   DRAGGABLE WINDOWS
========================= */
function makeDraggable(el) {
  const bar = el.querySelector(".title-bar");
  let offsetX, offsetY, dragging = false;
  bar.addEventListener("mousedown", e => {
    if (el.classList.contains("fullscreen")) return;
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

/* =========================
   OPEN WINDOWS
========================= */
async function openWindow(appId) {
  if (windows[appId]) {
    windows[appId].style.display = "flex";
    windows[appId].style.zIndex = Date.now();
    return;
  }

  const win = document.createElement("div");
  win.className = "window open";
  win.style.width = "700px";
  win.style.height = "500px";
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
    <div class="content" id="${appId}-content" style="position:relative; overflow:hidden;"></div>
  `;

  desktop.appendChild(win);
  windows[appId] = win;
  makeDraggable(win);
  updateTaskbar();

  const content = document.getElementById(`${appId}-content`);
  const btnClose = win.querySelector(".close");
  const btnMin = win.querySelector(".minimize");
  const btnFS = win.querySelector(".fullscreen");
  let prevState = {};

  btnClose.onclick = () => { desktop.removeChild(win); delete windows[appId]; updateTaskbar(); };
  btnMin.onclick = () => { win.style.display = "none"; updateTaskbar(); };
  btnFS.onclick = () => {
    if (!win.classList.contains("fullscreen")) {
      prevState = { width: win.style.width, height: win.style.height, top: win.style.top, left: win.style.left };
      win.style.width = "100%";
      win.style.height = "100%";
      win.style.top = "0";
      win.style.left = "0";
      win.classList.add("fullscreen");
    } else {
      win.style.width = prevState.width;
      win.style.height = prevState.height;
      win.style.top = prevState.top;
      win.style.left = prevState.left;
      win.classList.remove("fullscreen");
    }
  };

  /* =========================
     LOAD APPS
  ========================== */
  if (appId === "browser" || appId === "movies") {
    await initScramjet();
    await registerSW();

    content.innerHTML = "";
    const frame = scramjet.createFrame();
    frame.frame.style.width = "100%";
    frame.frame.style.height = "100%";
    frame.frame.style.border = "none";
    content.appendChild(frame.frame);

    // optional particle background inside browser
    const bCanvas = document.createElement("canvas");
    bCanvas.style.position = "absolute";
    bCanvas.style.top = "0";
    bCanvas.style.left = "0";
    bCanvas.style.width = "100%";
    bCanvas.style.height = "100%";
    bCanvas.style.pointerEvents = "none";
    content.appendChild(bCanvas);

    const bctx = bCanvas.getContext("2d");
    bCanvas.width = bCanvas.offsetWidth;
    bCanvas.height = bCanvas.offsetHeight;

    const bParticles = [];
    for (let i = 0; i < 80; i++) {
      bParticles.push({
        x: Math.random() * bCanvas.width,
        y: Math.random() * bCanvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      });
    }

    function animateBrowserParticles() {
      bctx.clearRect(0, 0, bCanvas.width, bCanvas.height);
      for (let p of bParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > bCanvas.width) p.x = 0;
        if (p.x < 0) p.x = bCanvas.width;
        if (p.y > bCanvas.height) p.y = 0;
        if (p.y < 0) p.y = bCanvas.height;

        bctx.beginPath();
        bctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        bctx.fillStyle = "rgba(255,255,255,0.3)";
        bctx.fill();
      }
      requestAnimationFrame(animateBrowserParticles);
    }
    animateBrowserParticles();

    if (appId === "browser") frame.go("https://example.com"); // homepage
    if (appId === "movies") frame.go("https://www.cineby.gd/"); // movies
  }

  if (appId === "games") await initGNGames(content);
  if (appId === "chat") initChat(content);
  if (appId === "settings") content.innerHTML = "<p>Settings coming soon</p>";
}

function updateTaskbar() {
  taskbarWindows.innerHTML = "";
  Object.keys(windows).forEach(appId => {
    const btn = document.createElement("button");
    btn.innerText = appId.charAt(0).toUpperCase() + appId.slice(1);
    btn.onclick = () => { const win = windows[appId]; win.style.display = "flex"; win.style.zIndex = Date.now(); };
    taskbarWindows.appendChild(btn);
  });
}

/* =========================
   SCRAMJET INIT
========================= */
let scramjet, scramjetReady = false;

async function initScramjet() {
  if (scramjetReady) return;
  const { ScramjetController } = $scramjetLoadController();
  scramjet = new ScramjetController({
    files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" }
  });
  await scramjet.init();
  scramjetReady = true;
}

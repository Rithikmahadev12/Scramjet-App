"use strict";

/* =========================
   PARTICLE SYSTEM (ADVANCED)
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
const PARTICLE_COUNT = 180;
const MAX_DISTANCE = 120;

let mouse = {
  x: null,
  y: null,
  radius: 140
};

canvas.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

canvas.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.baseX = this.x;
    this.baseY = this.y;
    this.size = Math.random() * 2 + 1;
    this.density = Math.random() * 30 + 1;
  }

  draw() {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  update() {
    if (mouse.x !== null) {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouse.radius) {
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let force = (mouse.radius - distance) / mouse.radius;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        this.x -= directionX;
        this.y -= directionY;
      } else {
        // return to base
        this.x += (this.baseX - this.x) / 15;
        this.y += (this.baseY - this.y) / 15;
      }
    }

    // wrap if off screen
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particles.push(new Particle());
}

function connectParticles() {
  for (let a = 0; a < particles.length; a++) {
    for (let b = a; b < particles.length; b++) {
      let dx = particles[a].x - particles[b].x;
      let dy = particles[a].y - particles[b].y;
      let distance = dx * dx + dy * dy;

      if (distance < MAX_DISTANCE * MAX_DISTANCE) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }

    // connect to mouse
    if (mouse.x !== null) {
      let dx = particles[a].x - mouse.x;
      let dy = particles[a].y - mouse.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 150) {
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  connectParticles();

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
  if (!name) {
    alert("Please enter your name");
    usernameInput.focus();
    return;
  }
  localStorage.setItem("username", name);
  onboarding.style.display = "none";
}

enterBtn.addEventListener("click", enterOS);
usernameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") enterOS();
});

/* =========================
   THEME TOGGLE
========================= */

document.getElementById("theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

/* =========================
   WINDOWS SYSTEM
========================= */

const launchpad = document.getElementById("launchpad");
const startBtn = document.getElementById("start-btn");
const desktop = document.getElementById("desktop");
const taskbarWindows = document.getElementById("taskbar-windows");
const windows = {};

startBtn.addEventListener("click", () =>
  launchpad.classList.toggle("hidden")
);

launchpad.querySelectorAll(".launch-app").forEach(btn => {
  btn.addEventListener("click", async () => {
    const appId = btn.dataset.app;
    await openWindow(appId);
    launchpad.classList.add("hidden");
  });
});

async function openWindow(appId) {
  if (windows[appId]) {
    windows[appId].style.display = "flex";
    windows[appId].style.zIndex = Date.now();
    return;
  }

  const win = document.createElement("div");
  win.className = "window";
  win.style.width = "700px";
  win.style.height = "500px";
  win.style.top = "100px";
  win.style.left = "150px";

  win.innerHTML = `
    <div class="title-bar">
      <span>${appId.toUpperCase()}</span>
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

  if (appId === "browser") {
    await initScramjetBrowser(content, location.origin);
  }
}

/* =========================
   SCRAMJET BROWSER
========================= */

let scramjet, connection;

async function initScramjet() {
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
}

async function initScramjetBrowser(container, url) {
  await initScramjet();
  await registerSW();

  const browserFrame = scramjet.createFrame();
  browserFrame.frame.style.width = "100%";
  browserFrame.frame.style.height = "100%";
  browserFrame.frame.style.border = "none";

  container.appendChild(browserFrame.frame);
  browserFrame.go(url);
}

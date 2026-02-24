"use strict";

/* ===== PARTICLES ===== */
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let particles = [];
for (let i = 0; i < 150; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.5 + 0.2
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.y -= p.speed;
    if (p.y < 0) p.y = canvas.height;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* ===== CLOCK ===== */
function startClock() {
  setInterval(() => {
    const d = new Date();
    document.getElementById("clock").innerText =
      d.toLocaleTimeString() + " | " +
      d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  }, 1000);
}
startClock();

/* ===== LAUNCHPAD ===== */
const launchBtn = document.getElementById("launchBtn");
const launchpad = document.getElementById("launchpad");
launchBtn.onclick = () => launchpad.classList.toggle("show");

document.querySelectorAll("#launchpad button").forEach(btn => {
  btn.onclick = () => openApp(btn.dataset.app);
});

/* ===== WINDOWS ===== */
function openApp(id) {
  const win = document.getElementById(id + "App");
  win.classList.remove("hidden");
  if (id === "browser") openBrowser();
}
function closeWin(id) {
  document.getElementById(id + "App").classList.add("hidden");
}

/* ===== SCRAMJET BROWSER WITH PROXY FALLBACK ===== */
let scramjetController = null;
let activeFrame = null;

async function initScramjet() {
  if (scramjetController) return scramjetController;

  const { ScramjetController } = $scramjetLoadController();
  const sj = new ScramjetController({
    files: {
      wasm: "/scram/scramjet.wasm",
      all: "/scram/scramjet.all.js",
      sync: "/scram/scramjet.sync.js"
    }
  });

  await sj.init();
  await registerSW();

  const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
  await connection.setTransport("/libcurl/index.mjs", [{
    websocket: `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`
  }]);

  scramjetController = sj;
  return sj;
}

async function openBrowser() {
  const container = document.getElementById("browserContent");
  container.innerHTML = "<div style='color:white;text-align:center;'>Loading Scramjet...</div>";

  try {
    const sj = await initScramjet();

    if (!activeFrame) {
      activeFrame = sj.createFrame();
      activeFrame.frame.style.width = "100%";
      activeFrame.frame.style.height = "100%";
      activeFrame.frame.style.border = "none";
      container.innerHTML = "";
      container.appendChild(activeFrame.frame);
    }

    await activeFrame.waitUntilReady();

    // Open Brave search inside Scramjet
    await activeFrame.go("https://search.brave.com/");
  } catch(err) {
    console.error("Scramjet failed, using proxy fallback:", err);

    // Proxy fallback
    container.innerHTML = "";
    const iframe = document.createElement("iframe");

    // Use your local or remote proxy here
    const proxyUrl = "/proxy?url=https://search.brave.com";
    iframe.src = proxyUrl;

    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    container.appendChild(iframe);
  }
}

/* ===== SHOW DESKTOP IMMEDIATELY ===== */
document.getElementById("bootScreen").classList.add("hidden");
document.getElementById("desktop").classList.remove("hidden");
document.getElementById("welcomeText").innerText = "Welcome to Matriarchs OS";

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

/* ===== LOAD FLOW ===== */
window.addEventListener("load", () => {
  const saved = localStorage.getItem("username");

  if (saved) {
    showDesktop(saved);
  } else {
    startBoot();
  }
});

function startBoot() {
  let text = "Matriarchs OS";
  let i = 0;
  const el = document.getElementById("bootText");

  function type() {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(type, 100);
    } else {
      setTimeout(() => {
        document.getElementById("bootScreen").classList.add("hidden");
        document.getElementById("onboarding").classList.remove("hidden");
      }, 500);
    }
  }

  type();
}

/* SPACE */
document.addEventListener("keydown", e => {
  if (e.code === "Space" &&
      !document.getElementById("onboarding").classList.contains("hidden")) {
    document.getElementById("onboarding").classList.add("hidden");
    document.getElementById("nameInputScreen").classList.remove("hidden");
  }
});

/* SAVE NAME */
document.getElementById("saveNameBtn").addEventListener("click", () => {
  const name = document.getElementById("nameField").value.trim();
  if (!name) return;

  localStorage.setItem("username", name);
  showDesktop(name);
});

function showDesktop(name) {
  document.getElementById("bootScreen").classList.add("hidden");
  document.getElementById("onboarding").classList.add("hidden");
  document.getElementById("nameInputScreen").classList.add("hidden");
  document.getElementById("desktop").classList.remove("hidden");
  document.getElementById("welcomeText").innerText = "Welcome, " + name;
  startClock();
}

/* CLOCK */
function startClock() {
  setInterval(() => {
    const d = new Date();
    document.getElementById("clock").innerText =
      d.toLocaleTimeString() + " | " +
      d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
      });
  }, 1000);
}

/* LAUNCHPAD */
const launchBtn = document.getElementById("launchBtn");
const launchpad = document.getElementById("launchpad");

launchBtn.onclick = () => {
  launchpad.classList.toggle("hidden");
};

document.querySelectorAll("#launchpad button").forEach(btn => {
  btn.onclick = () => openApp(btn.dataset.app);
});

/* WINDOWS */
function openApp(id) {
  document.getElementById(id + "App").classList.remove("hidden");
}
function closeWin(id) {
  document.getElementById(id + "App").classList.add("hidden");
}

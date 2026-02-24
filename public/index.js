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

/* ===== BOOT ===== */
window.addEventListener("load", startBoot);

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
        showOnboarding();
      }, 500);
    }
  }

  type();
}

/* ===== ONBOARDING ===== */
function showOnboarding() {
  const onboarding = document.getElementById("onboarding");
  onboarding.classList.remove("hidden");

  const title = "Matriarchs OS";
  const el = document.getElementById("introTitle");
  el.innerHTML = "";

  title.split("").forEach((c, i) => {
    const span = document.createElement("span");
    span.textContent = c;
    span.style.opacity = 0;
    span.style.display = "inline-block";
    span.style.transform = "translateY(40px)";
    span.style.transition = "0.5s ease";
    el.appendChild(span);

    setTimeout(() => {
      span.style.opacity = 1;
      span.style.transform = "translateY(0)";
    }, i * 80);
  });
}

/* ===== CONTINUE FUNCTION ===== */
function continueToDesktop() {
  document.getElementById("onboarding").classList.add("hidden");
  document.getElementById("desktop").classList.remove("hidden");
  startClock();
}

/* ===== SPACE KEY FIX ===== */
document.addEventListener("keydown", function (e) {
  if (!document.getElementById("onboarding").classList.contains("hidden")) {

    if (e.code === "Space" || e.key === " ") {
      e.preventDefault(); // IMPORTANT FIX
      continueToDesktop();
    }

  }
});

/* ===== CLICK FALLBACK ===== */
document.getElementById("onboarding").addEventListener("click", function () {
  continueToDesktop();
});

/* ===== CLOCK ===== */
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

/* ===== LAUNCHPAD ===== */
const launchBtn = document.getElementById("launchBtn");
const launchpad = document.getElementById("launchpad");

launchBtn.onclick = () => {
  launchpad.classList.toggle("hidden");
};

document.querySelectorAll("#launchpad button").forEach(btn => {
  btn.onclick = () => openApp(btn.dataset.app);
});

/* ===== WINDOWS ===== */
function openApp(id) {
  document.getElementById(id + "App").classList.remove("hidden");
}

function closeWin(id) {
  document.getElementById(id + "App").classList.add("hidden");
}

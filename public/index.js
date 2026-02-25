// ==========================
// Matriarchs OS Core JS
// ==========================

// ===== Variables =====
const desktop = document.getElementById("desktop");
const launchpad = document.getElementById("launchpad");
const startBtn = document.getElementById("start-btn");
const launchApps = document.querySelectorAll(".launch-app");
const onboarding = document.getElementById("onboarding");
const enterOSBtn = document.getElementById("enter-os-btn");
const taskbarWindows = document.getElementById("taskbar-windows");
const themeToggle = document.getElementById("theme-toggle");

let windows = [];
let windowIdCounter = 0;

// ===== Utilities =====
function createWindow(title, contentHTML, width = 600, height = 400) {
  const win = document.createElement("div");
  win.className = "window";
  win.style.width = width + "px";
  win.style.height = height + "px";
  win.style.top = Math.random() * 200 + 50 + "px";
  win.style.left = Math.random() * 200 + 50 + "px";
  win.dataset.id = windowIdCounter++;

  const titleBar = document.createElement("div");
  titleBar.className = "title-bar";

  const titleElem = document.createElement("div");
  titleElem.className = "title";
  titleElem.textContent = title;

  const controls = document.createElement("div");
  controls.className = "controls";
  const closeBtn = document.createElement("button");
  closeBtn.style.background = "red";
  closeBtn.onclick = () => closeWindow(win.dataset.id);
  controls.appendChild(closeBtn);

  titleBar.appendChild(titleElem);
  titleBar.appendChild(controls);
  win.appendChild(titleBar);

  const content = document.createElement("div");
  content.className = "content";
  content.innerHTML = contentHTML;
  win.appendChild(content);

  // Dragging
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  titleBar.onmousedown = e => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    win.style.zIndex = 1000 + windowIdCounter;
  };
  document.onmousemove = e => {
    if (isDragging) {
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    }
  };
  document.onmouseup = () => { isDragging = false; };

  desktop.appendChild(win);
  windows.push(win);

  // Add taskbar button
  const taskBtn = document.createElement("button");
  taskBtn.textContent = title;
  taskBtn.dataset.id = win.dataset.id;
  taskBtn.onclick = () => {
    win.style.display = win.style.display === "none" ? "flex" : "none";
  };
  taskbarWindows.appendChild(taskBtn);

  return win;
}

function closeWindow(id) {
  const win = windows.find(w => w.dataset.id == id);
  if (win) {
    win.remove();
    const taskBtn = taskbarWindows.querySelector(`button[data-id="${id}"]`);
    if (taskBtn) taskBtn.remove();
    windows = windows.filter(w => w.dataset.id != id);
  }
}

// ===== Launchpad & Start Button =====
startBtn.onclick = () => launchpad.classList.toggle("hidden");
launchApps.forEach(btn => {
  btn.onclick = () => {
    const app = btn.dataset.app;
    launchApp(app);
  };
});

function launchApp(name) {
  if (name === "browser") openBrowser();
  if (name === "games") openGames();
  if (name === "chat") openChat();
  if (name === "settings") openSettings();
}

// ===== Onboarding =====
enterOSBtn.onclick = () => {
  onboarding.classList.remove("active");
};

// ===== Theme =====
themeToggle.onclick = () => document.body.classList.toggle("dark-mode");

// ===== Browser =====
function openBrowser() {
  const contentHTML = `
    <input type="text" id="browser-url" placeholder="Enter URL" style="width:80%;padding:5px;" />
    <button id="browser-go">Go</button>
    <iframe id="browser-frame" src="https://www.brave.com" style="width:100%;height:calc(100% - 40px);margin-top:5px;"></iframe>
  `;
  const win = createWindow("Brave Browser", contentHTML, 800, 600);

  const goBtn = win.querySelector("#browser-go");
  const urlInput = win.querySelector("#browser-url");
  const frame = win.querySelector("#browser-frame");

  goBtn.onclick = () => {
    let url = urlInput.value;
    if (!url.startsWith("http")) url = "https://" + url;
    frame.src = url;
  };
}

// ===== GN Math Games =====
async function openGames() {
  const win = createWindow("GN Math Games", "<p>Loading games...</p>", 800, 600);
  const content = win.querySelector(".content");

  try {
    // Use Scramjet proxy like before
    const response = await fetch("/scram/games.json");
    const games = await response.json();

    content.innerHTML = "";
    games.forEach(game => {
      const btn = document.createElement("button");
      btn.textContent = game.name;
      btn.style.display = "block";
      btn.style.margin = "10px 0";
      btn.onclick = () => openGame(game);
      content.appendChild(btn);
    });
  } catch (err) {
    content.innerHTML = "Failed to load games: " + err;
  }
}

function openGame(game) {
  const win = createWindow(game.name, `<iframe src="${game.url}" style="width:100%;height:100%;border:none;"></iframe>`, 800, 600);
}

// ===== Chat =====
function openChat() {
  const contentHTML = `
    <div id="chat-box" style="height:100%;display:flex;flex-direction:column;">
      <div id="messages" style="flex:1;overflow:auto;border:1px solid rgba(255,255,255,0.2);padding:5px;"></div>
      <input type="text" id="chat-input" placeholder="Type..." style="padding:5px;width:100%;margin-top:5px;" />
    </div>
  `;
  const win = createWindow("Chat", contentHTML, 400, 500);

  const messages = win.querySelector("#messages");
  const input = win.querySelector("#chat-input");
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && input.value.trim()) {
      const msg = document.createElement("div");
      msg.textContent = input.value;
      messages.appendChild(msg);
      input.value = "";
      messages.scrollTop = messages.scrollHeight;
    }
  });
}

// ===== Settings =====
function openSettings() {
  const contentHTML = `
    <p>Settings will go here.</p>
    <button id="clear-cache">Clear Cache</button>
  `;
  const win = createWindow("Settings", contentHTML, 400, 300);

  const btn = win.querySelector("#clear-cache");
  btn.onclick = () => {
    caches.keys().then(names => { names.forEach(name => caches.delete(name)); alert("Cache cleared"); });
  };
}

// ===== Particles Background =====
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
let particles = [];
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

for (let i = 0; i < 100; i++) {
  particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2+1, dx: Math.random()-0.5, dy: Math.random()-0.5 });
}

function animateParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    if(p.x<0||p.x>canvas.width) p.dx*=-1;
    if(p.y<0||p.y>canvas.height) p.dy*=-1;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="white";
    ctx.fill();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

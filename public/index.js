"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const onboarding = document.getElementById("onboarding");
const startBtn = document.getElementById("start-btn");
const userNameInput = document.getElementById("user-name");
const welcomeMsg = document.getElementById("welcome-msg");

// Online count & battery/time simulation
const onlineCountEl = document.getElementById("online-count");
const timeEl = document.getElementById("time");
const batteryEl = document.getElementById("battery");

// Store user name in localStorage
let userName = localStorage.getItem("matriarchs_name") || "";
if(!userName) onboarding.classList.remove("hidden");
else welcomeMsg.textContent = `Welcome back, ${userName}`;

startBtn?.addEventListener("click", () => {
  const name = userNameInput.value.trim();
  if(name) {
    localStorage.setItem("matriarchs_name", name);
    welcomeMsg.textContent = `Welcome back, ${name}`;
    onboarding.classList.add("hidden");
  }
});

// Sidebar navigation
function showPage(name){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.page===name));
  document.querySelectorAll('[id^="page-"]').forEach(p=>{p.hidden = p.id !== `page-${name}`;});
}
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{ showPage(btn.dataset.page); });
});
showPage('home');

// Theme toggle
const themeToggle = document.getElementById("theme-toggle");
themeToggle?.addEventListener("change", ()=>{
  document.body.style.filter = themeToggle.checked ? "invert(1) hue-rotate(180deg)" : "invert(0)";
});

// Scramjet proxy
const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  },
});
scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

// Handle form submission
form?.addEventListener("submit", async (event)=>{
  event.preventDefault();
  error.textContent = "";
  errorCode.textContent = "";

  try {
    await registerSW();
  } catch(err) {
    error.textContent = "Failed to register service worker.";
    errorCode.textContent = err.toString();
    return;
  }

  const url = search(address.value, searchEngine.value);

  const wispUrl = (location.protocol==="https:"?"wss":"ws")+`://${location.host}/wisp/`;

  if((await connection.getTransport()) !== "/libcurl/index.mjs"){
    await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
  }

  const frame = scramjet.createFrame();
  frame.frame.id = "sj-frame";
  document.body.appendChild(frame.frame);
  frame.go(url);
});

// Online count / time / battery update simulation
setInterval(()=>{
  onlineCountEl.textContent = `Online: ${Math.floor(Math.random()*500+50)}`;
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString();
  batteryEl.textContent = `🔋${Math.floor(Math.random()*30+70)}%`;
},1000);

// Helper search function
function search(query, engine){
  if(!query) return "";
  return engine.replace("%s", encodeURIComponent(query));
}

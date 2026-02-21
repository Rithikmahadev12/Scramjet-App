// PARTICLES
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas(); window.addEventListener("resize", resizeCanvas);
let particles = [];
for (let i = 0; i < 150; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2+0.5, speed: Math.random()*0.5+0.2 });
function drawParticles() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p=>{ p.y-=p.speed; if(p.y<0)p.y=canvas.height; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle="white"; ctx.fill(); }); requestAnimationFrame(drawParticles); }
drawParticles();

// BOOT ANIMATION
let bootText = "Matriarchs OS", bootIndex = 0;
const bootEl = document.getElementById("bootText");
function typeBoot() { if(bootIndex<bootText.length){ bootEl.textContent+=bootText[bootIndex]; bootIndex++; setTimeout(typeBoot,100); } else { setTimeout(()=>{ document.getElementById("bootScreen").classList.add("hidden"); document.getElementById("onboarding").classList.remove("hidden"); animateIntroTitle(); },1000); } }
typeBoot();

// INTRO ANIMATION
function animateIntroTitle(){ const title="Matriarchs OS"; const el=document.getElementById("introTitle"); el.innerHTML=""; title.split("").forEach((c,i)=>{ const s=document.createElement("span"); s.textContent=c; s.style.opacity=0; s.style.display="inline-block"; s.style.transform="translateY(40px)"; s.style.transition="0.5s ease"; el.appendChild(s); setTimeout(()=>{ s.style.opacity=1; s.style.transform="translateY(0px)"; },i*80); }); }

// SPACE TO CONTINUE
document.addEventListener("keydown",e=>{ if(e.code==="Space"){ if(!document.getElementById("onboarding").classList.contains("hidden")){ document.getElementById("onboarding").classList.add("hidden"); document.getElementById("nameInputScreen").classList.remove("hidden"); } } });

// NAME INPUT
document.getElementById("saveNameBtn").onclick=()=>{ const name=document.getElementById("nameField").value.trim(); if(!name)return; localStorage.setItem("username",name); document.getElementById("nameInputScreen").classList.add("hidden"); document.getElementById("bgPickerScreen").classList.remove("hidden"); }

// BACKGROUNDS
const backgrounds=["https://images.unsplash.com/photo-1514897575457-c4db467cf78e?q=80&w=1600","https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600","https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1600"];
const bgContainer=document.getElementById("bgOptions");
backgrounds.forEach(url=>{ const img=document.createElement("img"); img.src=url; img.onclick=()=>setBG(url); bgContainer.appendChild(img); });

function setBG(url){ document.getElementById("desktop").style.backgroundImage=`url(${url})`; document.getElementById("bgPickerScreen").classList.add("hidden"); document.getElementById("desktop").classList.remove("hidden"); document.getElementById("welcomeText").innerText="Welcome, "+localStorage.getItem("username"); startClock(); }

// CLOCK
function startClock(){ setInterval(()=>{ const d=new Date(); document.getElementById("clock").innerText=d.toLocaleTimeString()+" | "+d.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"}); },1000); }

// LAUNCHPAD
document.getElementById("launchBtn").onclick=()=>{ document.getElementById("launchpad").classList.toggle("hidden"); };
document.querySelectorAll("#launchpad button").forEach(btn=>{ btn.onclick=()=>openApp(btn.dataset.app); });

// WINDOWS
function openApp(id){ const win=document.getElementById(id+"App"); win.classList.remove("hidden"); if(id==="browser") openBrowser(); }
function closeWin(id){ document.getElementById(id+"App").classList.add("hidden"); }
function minWin(id){ document.getElementById(id+"App").classList.add("hidden"); }
function maximizeWin(id){ const win=document.getElementById(id+"App"); win.style.width="100%"; win.style.height="90%"; win.style.top="0"; win.style.left="0"; }

// TAB CLOAK
function cloakTab(title,icon){ document.title=title; let link=document.querySelector("link[rel='icon']"); if(!link){ link=document.createElement("link"); link.rel="icon"; document.head.appendChild(link); } link.href=icon; }

// SCRAMJET BROWSER (WebSocket only)
let scramjetController=null,activeFrame=null;
async function initScramjet(){ if(scramjetController) return scramjetController; const { ScramjetController }=$scramjetLoadController(); const sj=new ScramjetController({ files:{ wasm:"/scram/scramjet.wasm.wasm", all:"/scram/scramjet.all.js", sync:"/scram/scramjet.sync.js" } }); await sj.init(); await registerSW(); const connection=new BareMux.BareMuxConnection("/baremux/worker.js"); await connection.setTransport("/libcurl/index.mjs",[ { websocket:`${location.protocol==="https:"?"wss":"ws"}://${location.host}/wisp/` } ]); scramjetController=sj; return sj; }

async function openBrowser(){ const container=document.getElementById("browserContent"); container.innerHTML=""; const sj=await initScramjet(); if(!activeFrame){ activeFrame=sj.createFrame(); activeFrame.frame.style.width="100%"; activeFrame.frame.style.height="100%"; activeFrame.frame.style.border="none"; container.appendChild(activeFrame.frame); } await activeFrame.waitUntilReady(); activeFrame.go("https://search.brave.com/"); }

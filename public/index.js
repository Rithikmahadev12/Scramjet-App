"use strict";

/* PARTICLES */
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
window.addEventListener("resize", ()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; });

const particles=[];
for(let i=0;i<200;i++){ particles.push({
  x: Math.random()*canvas.width,
  y: Math.random()*canvas.height,
  r: Math.random()*2+1,
  vx: (Math.random()-0.5)*0.5,
  vy: (Math.random()-0.5)*0.5
});}

canvas.addEventListener("mousemove", e=>{
  particles.forEach(p=>{
    const dx=e.clientX-p.x, dy=e.clientY-p.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<100){ p.vx-=dx*0.0005; p.vy-=dy*0.0005; }
  });
});

function animateParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.5)";
    ctx.fill();
    p.x+=p.vx; p.y+=p.vy;
    if(p.x>canvas.width)p.x=0; if(p.x<0)p.x=canvas.width;
    if(p.y>canvas.height)p.y=0; if(p.y<0)p.y=canvas.height;
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* STATUS BAR */
function updateTime(){
  const now=new Date();
  const time=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const day=now.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
  document.getElementById("time").innerText=`${time} • ${day}`;
}
setInterval(updateTime,1000); updateTime();

navigator.getBattery().then(b=>{
  function showBattery(){ document.getElementById("battery").innerText=Math.floor(b.level*100)+"%"; }
  b.onlevelchange=showBattery; showBattery();
});

/* ONBOARDING */
const onboarding=document.getElementById("onboarding");
const usernameInput=document.getElementById("username");
const enterBtn=document.getElementById("enter-os-btn");

function enterOS(){
  const name=usernameInput.value.trim();
  if(!name){ alert("Please enter your name"); usernameInput.focus(); return; }
  localStorage.setItem("username",name);
  onboarding.style.display="none";
}

enterBtn.addEventListener("click",enterOS);
usernameInput.addEventListener("keydown",e=>{ if(e.key==="Enter") enterOS(); });
usernameInput.focus();

/* THEME TOGGLE */
document.getElementById("theme-toggle").addEventListener("click",()=>{
  const curr= getComputedStyle(document.body).backgroundImage;
  if(curr.includes("unsplash")) document.body.style.background="url('https://images.unsplash.com/photo-1612832020620-d12504dbb7dc?q=80&w=1170&auto=format&fit=crop') center/cover no-repeat fixed";
  else document.body.style.background="url('https://images.unsplash.com/photo-1514897575457-c4db467cf78e?q=80&w=1170&auto=format&fit=crop') center/cover no-repeat fixed";
});

/* LAUNCHPAD & WINDOWS */
const launchpad=document.getElementById("launchpad");
const startBtn=document.getElementById("start-btn");
const desktop=document.getElementById("desktop");
const taskbarWindows=document.getElementById("taskbar-windows");
const windows={};

startBtn.addEventListener("click",()=>launchpad.classList.toggle("hidden"));
launchpad.querySelectorAll(".launch-app").forEach(btn=>{
  btn.addEventListener("click",async ()=>{
    const appId=btn.dataset.app;
    await openWindow(appId);
    launchpad.classList.add("hidden");
  });
});

async function openWindow(appId){
  if(windows[appId]){ windows[appId].style.display="flex"; windows[appId].style.zIndex=Date.now(); return; }

  const win=document.createElement("div");
  win.className="window open";
  win.style.width="400px"; win.style.height="300px"; win.style.top="100px"; win.style.left="100px";
  win.innerHTML=`<div class="title-bar"><span class="title">${appId.charAt(0).toUpperCase()+appId.slice(1)}</span><div class="controls"><button class="minimize">−</button><button class="fullscreen">⬜</button><button class="close">×</button></div></div><div class="content" id="${appId}-content"></div>`;
  desktop.appendChild(win); windows[appId]=win;

  makeDraggable(win); updateTaskbar();
  const content=document.getElementById(`${appId}-content`);
  const btnClose=win.querySelector(".close"), btnMin=win.querySelector(".minimize"), btnFS=win.querySelector(".fullscreen");
  let prevState={};

  btnClose.onclick=()=>{ desktop.removeChild(win); delete windows[appId]; updateTaskbar(); };
  btnMin.onclick=()=>{ win.style.display="none"; updateTaskbar(); };
  btnFS.onclick=()=>{
    if(!win.classList.contains("fullscreen")){
      prevState={width:win.style.width,height:win.style.height,top:win.style.top,left:win.style.left};
      win.style.width="100%"; win.style.height="100%"; win.style.top="0"; win.style.left="0"; win.classList.add("fullscreen");
    }else{
      win.style.width=prevState.width; win.style.height=prevState.height; win.style.top=prevState.top; win.style.left=prevState.left;
      win.classList.remove("fullscreen");
    }
  };

  /* LOAD APPS */
  if(appId==="browser") await initScramjetBrowser(content,"https://search.brave.com/");
  if(appId==="games") await initGNGames(content);
  if(appId==="chat") initChat(content);
  if(appId==="settings") content.innerHTML="<p>Settings coming soon</p>";
  if(appId==="movies") await initScramjetBrowser(content,"https://www.cineby.gd/");
}

function updateTaskbar(){
  taskbarWindows.innerHTML="";
  Object.keys(windows).forEach(appId=>{
    const btn=document.createElement("button");
    btn.innerText=appId.charAt(0).toUpperCase()+appId.slice(1);
    btn.onclick=()=>{ const win=windows[appId]; win.style.display="flex"; win.style.zIndex=Date.now(); };
    taskbarWindows.appendChild(btn);
  });
}

function makeDraggable(el){
  const bar=el.querySelector(".title-bar"); let offsetX,offsetY,dragging=false;
  bar.addEventListener("mousedown",e=>{
    if(el.classList.contains("fullscreen")) return;
    dragging=true; offsetX=e.clientX-el.offsetLeft; offsetY=e.clientY-el.offsetTop;
    el.style.zIndex=Date.now();
  });
  document.addEventListener("mousemove",e=>{ if(dragging){ el.style.left=(e.clientX-offsetX)+"px"; el.style.top=(e.clientY-offsetY)+"px"; }});
  document.addEventListener("mouseup",()=>{ dragging=false; });
}

/* SCRAMJET & APPS */
let scramjet,connection,scramjetReady=false,scramjetInitPromise=null;
async function initScramjet(){
  if(scramjetInitPromise) return scramjetInitPromise;
  scramjetInitPromise=(async ()=>{
    const { ScramjetController }=$scramjetLoadController();
    scramjet=new ScramjetController({
      files:{ wasm:"/scram/scramjet.wasm.wasm", all:"/scram/scramjet.all.js", sync:"/scram/scramjet.sync.js" }
    });
    await scramjet.init();
    connection=new BareMux.BareMuxConnection("/baremux/worker.js");
    scramjetReady=true;
  })();
  return scramjetInitPromise;
}

async function initScramjetBrowser(container,url){
  await initScramjet(); await registerSW();
  if(!scramjet._wasmLoaded){ if(scramjet.loadWasm) await scramjet.loadWasm(); scramjet._wasmLoaded=true; }
  const browserFrame=scramjet.createFrame();
  browserFrame.frame.style.width="100%"; browserFrame.frame.style.height="100%"; browserFrame.frame.style.border="none"; container.appendChild(browserFrame.frame);
  const wispUrl=(location.protocol==="https:"?"wss://":"ws://")+location.host+"/wisp/";
  if((await connection.getTransport())!=="/libcurl/index.mjs") await connection.setTransport("/libcurl/index.mjs",[ {websocket:wispUrl} ]);
  if(browserFrame.waitUntilReady) await browserFrame.waitUntilReady();
  browserFrame.go(url);
}

async function initGNGames(container){
  container.innerHTML='<div id="gnGamesContainer" style="width:100%;height:100%;overflow:auto;display:flex;flex-wrap:wrap;gap:10px;padding:10px;">Loading games...</div>';
  try{
    const zonesURL="https://cdn.jsdelivr.net/gh/gn-math/assets@main/zones.json";
    const coverURL="https://cdn.jsdelivr.net/gh/gn-math/covers@main";
    const htmlURL="https://cdn.jsdelivr.net/gh/gn-math/html@main";
    const response=await fetch(zonesURL);
    const zones=await response.json();
    const containerDiv=document.getElementById("gnGamesContainer");
    containerDiv.innerHTML="";
    zones.forEach(zone=>{
      const card=document.createElement("div");
      card.style.width="120px"; card.style.height="140px"; card.style.background="#111"; card.style.borderRadius="10px"; card.style.overflow="hidden";
      card.style.display="flex"; card.style.flexDirection="column"; card.style.alignItems="center"; card.style.justifyContent="center"; card.style.cursor="pointer";
      const img=document.createElement("img");
      img.src=zone.cover.replace("{COVER_URL}",coverURL).replace("{HTML_URL}",htmlURL);
      img.style.width="100%"; img.style.height="80px"; img.style.objectFit="cover"; card.appendChild(img);
      const label=document.createElement("span"); label.innerText=zone.name; label.style.fontSize="12px"; label.style.textAlign="center"; label.style.marginTop="5px"; card.appendChild(label);
      card.onclick=()=>openGNGame(zone.url,container);
      containerDiv.appendChild(card);
    });
  }catch(err){ container.innerHTML="Failed to load GN-Math games: "+err; }
}

async function openGNGame(url,contentDiv){
  await initScramjet(); contentDiv.innerHTML="";
  const frame=scramjet.createFrame(); frame.frame.style.width="100%"; frame.frame.style.height="100%"; frame.frame.style.border="none"; contentDiv.appendChild(frame.frame);
  try{
    let fullURL=url.replace("{HTML_URL}","https://cdn.jsdelivr.net/gh/gn-math/html@main");
    const res=await fetch(fullURL); let html=await res.text();
    html=html.replace(/((src|href)=["'])(?!https?:|data:)/g, `$1https://cdn.jsdelivr.net/gh/gn-math/html@main/`);
    const dataURL="data:text/html;charset=utf-8,"+encodeURIComponent(html); frame.go(dataURL);
  }catch(err){ contentDiv.innerHTML="Failed to load game: "+err; }
}

function initChat(container){
  container.innerHTML=`<div id="chat-window" style="height:100%;overflow:auto;background:rgba(0,0,0,0.7);padding:10px;margin-bottom:5px;"></div>
  <input id="chat-input" style="width:80%;padding:5px;border-radius:5px;" placeholder="Type a message...">
  <button id="chat-send">Send</button>`;
  const chatWindow=document.getElementById("chat-window");
  const chatInput=document.getElementById("chat-input");
  const chatSend=document.getElementById("chat-send");
  const ws=new WebSocket("wss://yourserver.com"); // replace with your WS server
  ws.onmessage=msg=>{ const data=JSON.parse(msg.data); chatWindow.innerHTML+=`<div><strong>${data.user}</strong>: ${data.message}</div>`; chatWindow.scrollTop=chatWindow.scrollHeight; };
  chatSend.addEventListener("click",()=>{ if(chatInput.value.trim()==="") return; ws.send(JSON.stringify({user:"Guest",message:chatInput.value})); chatInput.value=""; });
  chatInput.addEventListener("keydown",e=>{ if(e.key==="Enter") chatSend.click(); });
}

"use strict";

/* ================= PARTICLES ================= */
const canvas=document.getElementById("particle-canvas");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth; canvas.height=window.innerHeight;
window.addEventListener("resize",()=>{canvas.width=window.innerWidth; canvas.height=window.innerHeight;});
const particles=[]; 
for(let i=0;i<200;i++){
    particles.push({
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        r:Math.random()*2+1,
        vx:(Math.random()-0.5)*0.5,
        vy:(Math.random()-0.5)*0.5
    });
}
function animateParticles(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,0.5)";
        ctx.fill();
        p.x+=p.vx; p.y+=p.vy;
        if(p.x>canvas.width)p.x=0;
        if(p.x<0)p.x=canvas.width;
        if(p.y>canvas.height)p.y=0;
        if(p.y<0)p.y=canvas.height;
    });
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* ================= STATUS BAR ================= */
function updateTime(){
    const now=new Date();
    const time=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const day=now.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});
    document.getElementById("time").innerText=`${time} • ${day}`;
}
setInterval(updateTime,1000); updateTime();
navigator.getBattery().then(b=>{
    function showBattery(){document.getElementById("battery").innerText=Math.floor(b.level*100)+"%";}
    b.onlevelchange=showBattery;
    showBattery();
});

/* ================= ONBOARDING ================= */
document.getElementById("enter-os-btn").addEventListener("click",()=>{document.getElementById("onboarding").style.display="none";});

/* ================= LAUNCHPAD ================= */
const launchpad=document.getElementById("launchpad");
const startBtn=document.getElementById("start-btn");
startBtn.addEventListener("click",()=>{launchpad.classList.toggle("hidden");});
launchpad.querySelectorAll(".launch-app").forEach(btn=>{
    btn.addEventListener("click",()=>{
        const appId=btn.dataset.app;
        openWindow(appId);
        launchpad.classList.add("hidden");
    });
});

/* ================= WINDOW MANAGER ================= */
const desktop=document.getElementById("desktop");
const taskbarWindows=document.getElementById("taskbar-windows");
const windows={};
function openWindow(appId){
    if(windows[appId]){windows[appId].style.zIndex=Date.now(); return;}
    const win=document.createElement("div");
    win.className="window";
    win.style.width="400px"; win.style.height="300px"; win.style.top="100px"; win.style.left="100px";
    win.innerHTML=`
        <div class="title-bar">
            <span class="title">${appId.charAt(0).toUpperCase()+appId.slice(1)}</span>
            <div class="controls"><button class="close">×</button></div>
        </div>
        <div class="content" id="${appId}-content"></div>
    `;
    desktop.appendChild(win); windows[appId]=win;
    makeDraggable(win);
    updateTaskbar();
    win.querySelector(".close").onclick=()=>{desktop.removeChild(win); delete windows[appId]; updateTaskbar();};

    const content=document.getElementById(`${appId}-content`);
    if(appId==="browser"){initScramjetBrowser(content);}
    if(appId==="games"){content.innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#111;color:#fff;font-size:24px;">Games Coming Soon</div>`;}
    if(appId==="chat"){initChat(content);}
    if(appId==="settings"){content.innerHTML=`<p>Settings coming soon</p>`;}
}
function updateTaskbar(){
    taskbarWindows.innerHTML="";
    Object.keys(windows).forEach(appId=>{
        const btn=document.createElement("button");
        btn.innerText=appId.charAt(0).toUpperCase()+appId.slice(1);
        btn.onclick=()=>{windows[appId].style.zIndex=Date.now();};
        taskbarWindows.appendChild(btn);
    });
}
function makeDraggable(el){
    const bar=el.querySelector(".title-bar");
    let offsetX, offsetY, dragging=false;
    bar.addEventListener("mousedown",e=>{dragging=true; offsetX=e.clientX-el.offsetLeft; offsetY=e.clientY-el.offsetTop; el.style.zIndex=Date.now();});
    document.addEventListener("mousemove",e=>{if(dragging){el.style.left=(e.clientX-offsetX)+"px"; el.style.top=(e.clientY-offsetY)+"px";}});
    document.addEventListener("mouseup",()=>{dragging=false;});
}

/* ================= SCRAMJET BROWSER ================= */
let scramjet, connection, activeFrame=null, scramjetReady=false;
async function initScramjet(){
    if(scramjetReady) return;
    const { ScramjetController } = $scramjetLoadController();
    scramjet = new ScramjetController({ files:{ wasm:"/scram/scramjet.wasm.wasm", all:"/scram/scramjet.all.js", sync:"/scram/scramjet.sync.js"} });
    await scramjet.init();
    connection = new BareMux.BareMuxConnection("/baremux/worker.js");
    scramjetReady=true;
}
async function initScramjetBrowser(container){
    if(!scramjetReady) await initScramjet();
    await registerSW();
    if(!activeFrame){
        activeFrame=scramjet.createFrame();
        activeFrame.frame.style.width="100%";
        activeFrame.frame.style.height="100%";
        activeFrame.frame.style.border="none";
        container.appendChild(activeFrame.frame);
    }
    if(activeFrame.waitUntilReady) await activeFrame.waitUntilReady();
    try{
        activeFrame.go("https://search.brave.com/");
    }catch(err){
        console.warn("Scramjet browser error:", err.message);
    }
}

/* ================= CHAT (LOCAL STORAGE) ================= */
function initChat(container){
    container.innerHTML=`
      <div id="chat-window" style="height:100%;overflow:auto;background:rgba(0,0,0,0.7);padding:10px;margin-bottom:5px;"></div>
      <input id="chat-input" style="width:80%;padding:5px;border-radius:5px;" placeholder="Type a message...">
      <button id="chat-send">Send</button>
    `;

    const chatWindow = container.querySelector("#chat-window");
    const chatInput = container.querySelector("#chat-input");
    const chatSend = container.querySelector("#chat-send");
    const username = "Guest";

    function getMessages() {
        return JSON.parse(localStorage.getItem("matriarchs-chat") || "[]");
    }
    function saveMessage(msg) {
        const msgs = getMessages();
        msgs.push(msg);
        localStorage.setItem("matriarchs-chat", JSON.stringify(msgs));
    }
    function renderMessages() {
        const msgs = getMessages();
        chatWindow.innerHTML = msgs.map(m => `<div><strong>${m.user}</strong>: ${m.message}</div>`).join('');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    setInterval(renderMessages, 2000);
    renderMessages();

    chatSend.addEventListener("click", () => {
        const msg = chatInput.value.trim();
        if(!msg) return;
        saveMessage({ user: username, message: msg, time: new Date().toISOString() });
        chatInput.value = "";
        renderMessages();
    });

    chatInput.addEventListener("keydown", e => { if(e.key==="Enter") chatSend.click(); });

    window.addEventListener("storage", renderMessages);
}

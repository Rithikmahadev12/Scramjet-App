"use strict";

/* ================= PARTICLES ================= */
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
window.addEventListener("resize", ()=>{canvas.width=window.innerWidth; canvas.height=window.innerHeight;});

const particles = [];
for(let i=0;i<200;i++){
    particles.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:Math.random()*2+1, vx:(Math.random()-0.5)*0.5, vy:(Math.random()-0.5)*0.5});
}
function animateParticles(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const p of particles){
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,0.5)";
        ctx.fill();
        p.x+=p.vx; p.y+=p.vy;
        if(p.x>canvas.width)p.x=0; if(p.x<0)p.x=canvas.width;
        if(p.y>canvas.height)p.y=0; if(p.y<0)p.y=canvas.height;
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* ================= STATUS BAR ================= */
function updateTime(){
    const now = new Date();
    const time = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const day = now.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});
    document.getElementById("time").innerText = `${time} • ${day}`;
}
setInterval(updateTime,1000); updateTime();

navigator.getBattery().then(b=>{
    function showBattery(){ document.getElementById("battery").innerText = Math.floor(b.level*100)+"%"; }
    b.onlevelchange = showBattery; showBattery();
});

/* ================= ONBOARDING ================= */
document.getElementById("start-btn").addEventListener("click", ()=>{
    document.getElementById("onboarding").style.display="none";
    createWindow("Browser","browser");
    createWindow("Games","games");
    createWindow("Chat","chat");
    createWindow("Settings","settings");
});

/* ================= WINDOW MANAGER ================= */
const desktop = document.getElementById("desktop");
const taskbar = document.getElementById("taskbar");

function createWindow(title,id){
    const win = document.createElement("div");
    win.className="window";
    win.style.width="400px"; win.style.height="300px"; win.style.top=Math.random()*200+"px"; win.style.left=Math.random()*400+"px";
    win.innerHTML=`<div class="title-bar"><span class="title">${title}</span><div class="controls"><button class="close">×</button></div></div><div class="content" id="${id}"></div>`;
    desktop.appendChild(win);

    // Close button
    win.querySelector(".close").onclick=()=>{desktop.removeChild(win); updateTaskbar();};
    makeDraggable(win);

    // Add to taskbar
    const tbBtn = document.createElement("button");
    tbBtn.innerText=title;
    tbBtn.onclick=()=>{win.style.zIndex=Date.now();}
    taskbar.appendChild(tbBtn);
}

function updateTaskbar(){ taskbar.innerHTML=""; desktop.querySelectorAll(".window").forEach(win=>{
    const title = win.querySelector(".title").innerText;
    const tbBtn = document.createElement("button"); tbBtn.innerText=title;
    tbBtn.onclick=()=>{win.style.zIndex=Date.now();}
    taskbar.appendChild(tbBtn);
})}

/* ================= DRAGGABLE WINDOWS ================= */
function makeDraggable(el){
    const bar = el.querySelector(".title-bar");
    let offsetX, offsetY, dragging=false;
    bar.addEventListener("mousedown",e=>{
        dragging=true; offsetX=e.clientX-el.offsetLeft; offsetY=e.clientY-el.offsetTop;
        el.style.zIndex=Date.now();
    });
    document.addEventListener("mousemove", e=>{
        if(dragging){
            el.style.left=(e.clientX-offsetX)+"px";
            el.style.top=(e.clientY-offsetY)+"px";
        }
    });
    document.addEventListener("mouseup",()=>{dragging=false;});
}

/* ================= SCRAMJET BROWSER ================= */
let scramjet, connection, activeFrame=null;
async function initScramjet(){
    const { ScramjetController } = $scramjetLoadController();
    scramjet = new ScramjetController({ files: { wasm:"/scram/scramjet.wasm.wasm", all:"/scram/scramjet.all.js", sync:"/scram/scramjet.sync.js"} });
    await scramjet.init();
    connection = new BareMux.BareMuxConnection("/baremux/worker.js");
}
async function navigate(url){
    if(!scramjet) await initScramjet();
    await registerSW();
    const wispUrl=(location.protocol==="https:"?"wss://":"ws://")+location.host+"/wisp/";
    if((await connection.getTransport())!=="/libcurl/index.mjs"){
        await connection.setTransport("/libcurl/index.mjs",[{"websocket":wispUrl}]);
    }
    if(!activeFrame){
        activeFrame=scramjet.createFrame();
        activeFrame.frame.style.width="100%";
        activeFrame.frame.style.height="100%";
        activeFrame.frame.style.border="none";
        document.getElementById("browser").appendChild(activeFrame.frame);
    }
    activeFrame.go(url);
}

/* ================= SEARCH ================= */
function formatInput(input){
    if(input.startsWith("http")) return input;
    if(input.includes(".")) return "https://"+input;
    return "https://search.brave.com/search?q="+encodeURIComponent(input);
}

/* Add inputs dynamically if needed */

/* ================= REAL-TIME CHAT ================= */
const chatWindow=document.getElementById("chat");
if(chatWindow){
    const chatWs=new WebSocket("wss://yourserver.com"); // replace with your WS server
    chatWs.onmessage=msg=>{
        const data=JSON.parse(msg.data);
        chatWindow.innerHTML+=`<div><strong>${data.user}</strong>: ${data.message}</div>`;
        chatWindow.scrollTop=chatWindow.scrollHeight;
    }
}

"use strict";

/* ================= STATUS BAR ================= */
function updateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const day = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    document.getElementById("time").innerText = `${time} • ${day}`;
}
setInterval(updateTime, 1000);
updateTime();

/* Battery */
navigator.getBattery().then(b => {
    function showBattery() { document.getElementById("battery").innerText = Math.floor(b.level*100)+"%"; }
    b.onlevelchange = showBattery; showBattery();
});

/* ================= SCREEN SWITCHING ================= */
document.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.onclick=()=>{
        document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
        document.getElementById(btn.dataset.screen).classList.add("active");
    };
});

/* ================= SCRAMJET ================= */
let scramjet, connection, activeFrame = null;
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
async function navigate(url){
    if(!scramjet) await initScramjet();
    await registerSW();
    const wispUrl=(location.protocol==="https:"?"wss://":"ws://")+location.host+"/wisp/";
    if((await connection.getTransport())!=="/libcurl/index.mjs"){
        await connection.setTransport("/libcurl/index.mjs", [{websocket:wispUrl}]);
    }
    if(!activeFrame){
        activeFrame=scramjet.createFrame();
        activeFrame.frame.style.width="100%";
        activeFrame.frame.style.height="100%";
        activeFrame.frame.style.border="none";
        document.getElementById("proxy-container").appendChild(activeFrame.frame);
    }
    activeFrame.go(url);
}

/* ================= SEARCH ================= */
function formatInput(input){
    if(input.startsWith("http")) return input;
    if(input.includes(".")) return "https://"+input;
    return "https://search.brave.com/search?q="+encodeURIComponent(input);
}
document.getElementById("home-search").addEventListener("keydown", e=>{
    if(e.key==="Enter"){ navigate(formatInput(e.target.value)); document.querySelector('[data-screen="browser"]').click(); }
});
document.getElementById("url-bar").addEventListener("keydown", e=>{
    if(e.key==="Enter") navigate(formatInput(e.target.value));
});

/* ================= ONBOARDING ================= */
document.getElementById("start-btn").addEventListener("click", ()=>{
    document.getElementById("onboarding").classList.remove("active");
    document.querySelector('[data-screen="home"]').click();
});

/* ================= PARTICLE BACKGROUND ================= */
const canvas=document.getElementById("particle-canvas");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth; canvas.height=window.innerHeight;
window.addEventListener("resize", ()=>{canvas.width=window.innerWidth; canvas.height=window.innerHeight;});

const particles=[];
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
        if(p.x>canvas.width) p.x=0; if(p.x<0)p.x=canvas.width;
        if(p.y>canvas.height)p.y=0; if(p.y<0)p.y=canvas.height;
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* ================= GAMES GRID PLACEHOLDER ================= */
const games=[{name:"Sample Game 1",url:"#"}, {name:"Sample Game 2", url:"#"}];
const gamesGrid=document.getElementById("games-grid");
games.forEach(game=>{
    const card=document.createElement("div"); card.className="game-card";
    card.innerHTML=`<p>${game.name}</p>`;
    card.onclick=()=>{navigate(game.url); document.querySelector('[data-screen="browser"]').click();};
    gamesGrid.appendChild(card);
});

/* ================= THEME SWITCHING ================= */
const themeRadios=document.querySelectorAll('input[name="theme"]');
const accentInput=document.getElementById("accent-color");
themeRadios.forEach(r=>{
    r.addEventListener("change", ()=>{
        if(r.value==="light"){document.body.style.background="#f0f0f0"; document.body.style.color="#000";}
        else{document.body.style.background="url('https://images.unsplash.com/photo-1514897575457-c4db467cf78e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0') center/cover no-repeat fixed"; document.body.style.color="#fff";}
    });
});
accentInput.addEventListener("input", ()=>{document.documentElement.style.setProperty('--accent-color', accentInput.value);});

/* ================= REAL-TIME CHAT ================= */
const chatWindow=document.getElementById("chat-window");
const chatInput=document.getElementById("chat-input");
const chatSend=document.getElementById("chat-send");

// Connect to WebSocket server
const ws=new WebSocket("wss://yourserver.com"); // <-- replace with your WS server
ws.onopen=()=>console.log("Connected to chat server");
ws.onmessage=msg=>{
    const data=JSON.parse(msg.data);
    const msgDiv=document.createElement("div");
    msgDiv.innerHTML=`<strong>${data.user}:</strong> ${data.message}`;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop=chatWindow.scrollHeight;
};

chatSend.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", e=>{if(e.key==="Enter") sendChat();});

function sendChat(){
    const message=chatInput.value.trim();
    if(message==="") return;
    ws.send(JSON.stringify({user:"Guest", message}));
    chatInput.value="";
}

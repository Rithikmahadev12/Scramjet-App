"use strict";

/* STATUS BAR: TIME + DAY NAME */
function updateTime() {
    const now=new Date();
    const time=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const day=now.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});
    document.getElementById("time").innerText=`${time} • ${day}`;
}
setInterval(updateTime,1000);
updateTime();

/* BATTERY */
navigator.getBattery().then(b=>{
    function showBattery(){document.getElementById("battery").innerText=Math.floor(b.level*100)+"%";}
    b.onlevelchange=showBattery; showBattery();
});

/* SCREEN SWITCHING */
document.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.onclick=()=>{
        document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
        document.getElementById(btn.dataset.screen).classList.add("active");
    };
});

/* SCRAMJET */
let scramjet,connection,activeFrame=null;
async function initScramjet(){
    const {ScramjetController}=$scramjetLoadController();
    scramjet=new ScramjetController({files:{wasm:"/scram/scramjet.wasm.wasm",all:"/scram/scramjet.all.js",sync:"/scram/scramjet.sync.js"}});
    await scramjet.init();
    connection=new BareMux.BareMuxConnection("/baremux/worker.js");
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
        document.getElementById("proxy-container").appendChild(activeFrame.frame);
    }
    activeFrame.go(url);
}

/* SEARCH INPUTS */
function formatInput(input){
    if(input.startsWith("http")) return input;
    if(input.includes(".")) return "https://"+input;
    return "https://search.brave.com/search?q="+encodeURIComponent(input);
}
document.getElementById("home-search").addEventListener("keydown",e=>{
    if(e.key==="Enter"){navigate(formatInput(e.target.value)); document.querySelector('[data-screen="browser"]').click();}
});
document.getElementById("url-bar").addEventListener("keydown",e=>{
    if(e.key==="Enter") navigate(formatInput(e.target.value));
});

/* ONBOARDING */
document.getElementById("start-btn").addEventListener("click",()=>{
    document.getElementById("onboarding").classList.remove("active");
    document.querySelector('[data-screen="home"]').click();
});

/* PARTICLES */
const canvas=document.getElementById("particle-canvas");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
const particles=[];
for(let i=0;i<150;i++){
    particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+1,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5});
}
function animateParticles(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(const p of particles){
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,0.5)";
        ctx.fill();
        p.x+=p.vx; p.y+=p.vy;
        if(p.x>canvas.width)p.x=0;if(p.x<0)p.x=canvas.width;
        if(p.y>canvas.height)p.y=0;if(p.y<0)p.y=canvas.height;
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

/* SAMPLE GAMES GRID */
const games=[{name:"Sample Game 1",url:"#"}];
const gamesGrid=document.getElementById("games-grid");
games.forEach(game=>{
    const card=document.createElement("div");
    card.className="game-card";
    card.innerHTML=`<p>${game.name}</p>`;
    card.onclick=()=>{navigate(game.url); document.querySelector('[data-screen="browser"]').click();}
    gamesGrid.appendChild(card);
});

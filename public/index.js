"use strict";

/* STATUS BAR: TIME + DAY NAME */
function updateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const day = now.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});
    document.getElementById("time").innerText = `${time} • ${day}`;
}
setInterval(updateTime, 1000);
updateTime();

/* BATTERY */
navigator.getBattery().then(b => {
    function showBattery() { document.getElementById("battery").innerText = Math.floor(b.level*100)+"%"; }
    b.onlevelchange = showBattery; showBattery();
});

/* SCREEN SWITCHING */
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        document.getElementById(btn.dataset.screen).classList.add("active");
    };
});

/* SCRAMJET */
let scramjet, connection, activeFrame = null;
async function initScramjet() {
    const { ScramjetController } = $scramjetLoadController();
    scramjet = new ScramjetController({
        files: { wasm:"/scram/scramjet.wasm.wasm", all:"/scram/scramjet.all.js", sync:"/scram/scramjet.sync.js" }
    });
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
        activeFrame = scramjet.createFrame();
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
    if(e.key==="Enter"){
        navigate(formatInput(e.target.value));
        document.querySelector('[data-screen="browser"]').click();
    }
});
document.getElementById("url-bar").addEventListener("keydown",e=>{
    if(e.key==="Enter") navigate(formatInput(e.target.value));
});

/* ONBOARDING */
document.getElementById("start-btn").addEventListener("click",()=>{
    document.getElementById("onboarding").classList.remove("active");
    document.querySelector('[data-screen="home"]').click();
});

/* SAMPLE GAMES GRID */
const games=[{name:"Sample Game 1",url:"#"}, {name:"Sample Game 2",url:"#"}, {name:"Sample Game 3",url:"#"}];
const gamesGrid=document.getElementById("games-grid");
games.forEach(game=>{
    const card=document.createElement("div");
    card.className="game-card";
    card.innerHTML=`<p>${game.name}</p>`;
    card.onclick=()=>{ navigate(game.url); document.querySelector('[data-screen="browser"]').click(); };
    gamesGrid.appendChild(card);
});

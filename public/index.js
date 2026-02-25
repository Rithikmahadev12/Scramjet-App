"use strict";

/* ================= PARTICLES ================= */
const canvas=document.getElementById("particle-canvas");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth; canvas.height=window.innerHeight;
window.addEventListener("resize",()=>{canvas.width=window.innerWidth; canvas.height=window.innerHeight;});
const particles=[]; for(let i=0;i<200;i++){particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+1,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5});}
function animateParticles(){ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.5)";ctx.fill();p.x+=p.vx;p.y+=p.vy;if(p.x>canvas.width)p.x=0;if(p.x<0)p.x=canvas.width;if(p.y>canvas.height)p.y=0;if(p.y<0)p.y=canvas.height;});requestAnimationFrame(animateParticles);}
animateParticles();

/* ================= STATUS BAR ================= */
function updateTime(){const now=new Date();const time=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});const day=now.toLocaleDateString([], {weekday:'long', month:'short', day:'numeric'});document.getElementById("time").innerText=`${time} • ${day}`;}
setInterval(updateTime,1000); updateTime();
navigator.getBattery().then(b=>{function showBattery(){document.getElementById("battery").innerText=Math.floor(b.level*100)+"%";} b.onlevelchange=showBattery; showBattery();});

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
    win.innerHTML=`<div class="title-bar"><span class="title">${appId.charAt(0).toUpperCase()+appId.slice(1)}</span><div class="controls"><button class="close">×</button></div></div><div class="content" id="${appId}-content"></div>`;
    desktop.appendChild(win); windows[appId]=win;
    makeDraggable(win);
    updateTaskbar();
    win.querySelector(".close").onclick=()=>{desktop.removeChild(win); delete windows[appId]; updateTaskbar();};

    const content=document.getElementById(`${appId}-content`);
    if(appId==="browser"){initScramjetBrowser(content);}
    if(appId==="games"){initGames(content);}
    if(appId==="chat"){initChat(content);}
    if(appId==="settings"){content.innerHTML=`<p>Settings coming soon</p>`;}
}
function updateTaskbar(){taskbarWindows.innerHTML="";Object.keys(windows).forEach(appId=>{const btn=document.createElement("button");btn.innerText=appId.charAt(0).toUpperCase()+appId.slice(1);btn.onclick=()=>{windows[appId].style.zIndex=Date.now();};taskbarWindows.appendChild(btn);});}
function makeDraggable(el){const bar=el.querySelector(".title-bar");let offsetX, offsetY, dragging=false;bar.addEventListener("mousedown",e=>{dragging=true; offsetX=e.clientX-el.offsetLeft; offsetY=e.clientY-el.offsetTop; el.style.zIndex=Date.now();});document.addEventListener("mousemove",e=>{if(dragging){el.style.left=(e.clientX-offsetX)+"px"; el.style.top=(e.clientY-offsetY)+"px";}});document.addEventListener("mouseup",()=>{dragging=false;});}

/* ================= GAMES ================= */
function initGames(content){
    content.innerHTML=`
    <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <h2 style="margin-bottom:10px;">Select a Game</h2>
        <div style="display:flex;gap:10px;">
            <button id="snake-btn">Snake</button>
            <button id="tictactoe-btn">Tic-Tac-Toe</button>
        </div>
        <div id="game-container" style="margin-top:20px;width:100%;height:70%;display:flex;align-items:center;justify-content:center;"></div>
    </div>
    `;
    const gameContainer = document.getElementById("game-container");

    // Snake Game
    document.getElementById("snake-btn").onclick = () => {
        gameContainer.innerHTML = `<canvas id="snake-canvas" width="300" height="300" style="background:#111;"></canvas>`;
        const canvas = document.getElementById("snake-canvas");
        const ctx = canvas.getContext("2d");
        const box = 20;
        let snake = [{x:9*box, y:9*box}];
        let food = {x: Math.floor(Math.random()*15)*box, y: Math.floor(Math.random()*15)*box};
        let dir = null;
        let game;

        document.addEventListener("keydown", e => {
            if(e.key==="ArrowUp" && dir!="DOWN") dir="UP";
            if(e.key==="ArrowDown" && dir!="UP") dir="DOWN";
            if(e.key==="ArrowLeft" && dir!="RIGHT") dir="LEFT";
            if(e.key==="ArrowRight" && dir!="LEFT") dir="RIGHT";
        });

        function draw() {
            ctx.fillStyle="#111";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            for(let i=0;i<snake.length;i++){
                ctx.fillStyle=(i===0)?"#0f0":"#0a0";
                ctx.fillRect(snake[i].x, snake[i].y, box, box);
            }

            ctx.fillStyle="#f00";
            ctx.fillRect(food.x, food.y, box, box);

            let headX = snake[0].x;
            let headY = snake[0].y;

            if(dir==="UP") headY -= box;
            if(dir==="DOWN") headY += box;
            if(dir==="LEFT") headX -= box;
            if(dir==="RIGHT") headX += box;

            if(headX===food.x && headY===food.y){
                snake.unshift({x:headX, y:headY});
                food = {x: Math.floor(Math.random()*15)*box, y: Math.floor(Math.random()*15)*box};
            } else {
                snake.pop();
                snake.unshift({x:headX, y:headY});
            }

            if(headX<0||headX>=canvas.width||headY<0||headY>=canvas.height||
               snake.slice(1).some(s=>s.x===headX && s.y===headY)){
                clearInterval(game);
                alert("Game Over!");
            }
        }

        game = setInterval(draw, 150);
    };

    // Tic-Tac-Toe
    document.getElementById("tictactoe-btn").onclick = () => {
        gameContainer.innerHTML = `
        <div id="ttt-board" style="display:grid;grid-template-columns:repeat(3,100px);grid-gap:5px;"></div>
        <p id="ttt-msg" style="margin-top:10px;"></p>
        `;
        const boardDiv = document.getElementById("ttt-board");
        const msg = document.getElementById("ttt-msg");
        let board = Array(9).fill("");
        let currentPlayer = "X";

        function renderBoard(){
            boardDiv.innerHTML = "";
            board.forEach((cell,i)=>{
                const c = document.createElement("div");
                c.style.width="100px"; c.style.height="100px";
                c.style.display="flex"; c.style.alignItems="center"; c.style.justifyContent="center";
                c.style.fontSize="48px"; c.style.background="#111"; c.style.color="#0f0"; c.style.cursor="pointer";
                c.innerText = cell;
                c.onclick = ()=>{ if(cell!=="") return; board[i]=currentPlayer; checkWinner(); currentPlayer=currentPlayer==="X"?"O":"X"; renderBoard();}
                boardDiv.appendChild(c);
            });
        }

        function checkWinner(){
            const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            for(const w of wins){
                if(board[w[0]] && board[w[0]]===board[w[1]] && board[w[1]]===board[w[2]]){
                    msg.innerText=`Player ${board[w[0]]} wins!`;
                    board.fill("");
                    return;
                }
            }
            if(board.every(c=>c)) msg.innerText="Draw!"; 
        }

        renderBoard();
    };
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
    const wispUrl=(location.protocol==="https:"?"wss://":"ws://")+location.host+"/wisp/";
    if((await connection.getTransport())!=="/libcurl/index.mjs"){await connection.setTransport("/libcurl/index.mjs",[{"websocket":wispUrl}]);}
    if(!activeFrame){activeFrame=scramjet.createFrame(); activeFrame.frame.style.width="100%"; activeFrame.frame.style.height="100%"; activeFrame.frame.style.border="none"; container.appendChild(activeFrame.frame);}
    if(activeFrame.waitUntilReady) await activeFrame.waitUntilReady();
    activeFrame.go("https://search.brave.com/");
}

/* ================= CHAT ================= */
function initChat(container){
    container.innerHTML=`<div id="chat-window" style="height:100%;overflow:auto;background:rgba(0,0,0,0.7);padding:10px;margin-bottom:5px;"></div><input id="chat-input" style="width:80%;padding:5px;border-radius:5px;" placeholder="Type a message..."><button id="chat-send">Send</button>`;
    const chatWindow=document.getElementById("chat-window");
    const chatInput=document.getElementById("chat-input");
    const chatSend=document.getElementById("chat-send");
    const ws=new WebSocket("wss://yourserver.com"); // replace with WS server
    ws.onmessage=msg=>{const data=JSON.parse(msg.data); chatWindow.innerHTML+=`<div><strong>${data.user}</strong>: ${data.message}</div>`; chatWindow.scrollTop=chatWindow.scrollHeight;};
    chatSend.addEventListener("click",()=>{if(chatInput.value.trim()==="")return; ws.send(JSON.stringify({user:"Guest",message:chatInput.value})); chatInput.value="";});
    chatInput.addEventListener("keydown",e=>{if(e.key==="Enter") chatSend.click();});
}

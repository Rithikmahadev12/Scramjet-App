// ================= PARTICLES =================
const canvas=document.getElementById("particles");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

let particles=[];
for(let i=0;i<150;i++){
  particles.push({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height,
    r:Math.random()*2,
    vx:(Math.random()-.5)*0.3,
    vy:(Math.random()-.5)*0.3
  });
}

function animateParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="white";
    ctx.fill();
    p.x+=p.vx;
    p.y+=p.vy;
    if(p.x<0||p.x>canvas.width)p.vx*=-1;
    if(p.y<0||p.y>canvas.height)p.vy*=-1;
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ================= ONBOARDING =================
const title="Matriarchs OS";
const titleEl=document.getElementById("animatedTitle");

title.split("").forEach((l,i)=>{
  const span=document.createElement("span");
  span.textContent=l;
  span.style.animationDelay=i*.05+"s";
  titleEl.appendChild(span);
});

let step=1;

document.addEventListener("keydown",e=>{
  if(e.code==="Space" && step===1){
    document.querySelectorAll("#animatedTitle span")
      .forEach((s,i)=>{
        s.style.animation=`letterOut .5s forwards`;
        s.style.animationDelay=i*.03+"s";
      });
    setTimeout(()=>{
      document.getElementById("step1").classList.remove("active");
      document.getElementById("step2").classList.add("active");
      step=2;
    },800);
  }
});

// Name
document.getElementById("saveName").onclick=()=>{
  const name=document.getElementById("nameInput").value.trim();
  if(!name)return;
  localStorage.setItem("username",name);
  document.getElementById("step2").classList.remove("active");
  document.getElementById("step3").classList.add("active");
};

// BG select
document.querySelectorAll(".bg-option").forEach(opt=>{
  opt.onclick=()=>{
    const bg=getComputedStyle(opt).backgroundImage;
    localStorage.setItem("bg",bg);
    document.getElementById("desktop").style.backgroundImage=bg;
    document.getElementById("onboarding").style.display="none";
    alert("Welcome "+localStorage.getItem("username")+" 👑");
  };
});

// Load saved
window.onload=()=>{
  const bg=localStorage.getItem("bg");
  if(bg){
    document.getElementById("desktop").style.backgroundImage=bg;
    document.getElementById("onboarding").style.display="none";
  }
};

// ================= CLOCK =================
function updateClock(){
  const now=new Date();
  document.getElementById("clock").innerText=
    now.toLocaleTimeString()+" | "+
    now.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});
}
setInterval(updateClock,1000);
updateClock();

// ================= WINDOW SYSTEM =================
let z=1;
const desktop=document.getElementById("desktop");

function openWindow(app){
  const win=document.createElement("div");
  win.className="window";
  win.style.top="100px";
  win.style.left="100px";
  win.style.zIndex=z++;

  win.innerHTML=`
    <div class="titlebar">
      <span>${app}</span>
      <div class="controls">
        <button class="min"></button>
        <button class="max"></button>
        <button class="close"></button>
      </div>
    </div>
    <div class="content" id="${app}-content"></div>
  `;

  desktop.appendChild(win);
  makeDraggable(win);

  win.querySelector(".close").onclick=()=>win.remove();

  win.querySelector(".max").onclick=()=>{
    if(!win.classList.contains("maxed")){
      win.dataset.prev=JSON.stringify({
        top:win.style.top,
        left:win.style.left,
        width:win.style.width,
        height:win.style.height
      });
      win.style.top="0";
      win.style.left="0";
      win.style.width="100%";
      win.style.height="100%";
      win.classList.add("maxed");
    }else{
      const prev=JSON.parse(win.dataset.prev);
      win.style.top=prev.top;
      win.style.left=prev.left;
      win.style.width=prev.width;
      win.style.height=prev.height;
      win.classList.remove("maxed");
    }
  };

  if(app==="browser") initBrowser(app+"-content");
  if(app==="games") document.getElementById(app+"-content").innerHTML="<h2 style='padding:20px'>Games Coming Soon</h2>";
  if(app==="settings") document.getElementById(app+"-content").innerHTML="<h3 style='padding:20px'>Settings</h3>";
}

function makeDraggable(el){
  const bar=el.querySelector(".titlebar");
  let offsetX,offsetY,isDown=false;

  bar.onmousedown=(e)=>{
    isDown=true;
    offsetX=e.clientX-el.offsetLeft;
    offsetY=e.clientY-el.offsetTop;
    el.style.zIndex=z++;
  };

  document.onmousemove=(e)=>{
    if(isDown && !el.classList.contains("maxed")){
      el.style.left=e.clientX-offsetX+"px";
      el.style.top=e.clientY-offsetY+"px";
    }
  };

  document.onmouseup=()=>isDown=false;
}

// ================= LAUNCHPAD =================
document.getElementById("launchBtn").onclick=()=>{
  document.getElementById("launchpad").classList.toggle("hidden");
};

document.querySelectorAll("#dock button, #launchpad button")
.forEach(btn=>{
  btn.onclick=()=>openWindow(btn.dataset.app);
});

// ================= SCRAMJET MULTI TAB =================
let scramjetReady=false;
let scramjet;

async function initScramjet(){
  if(scramjetReady)return;
  const { ScramjetController } = $scramjetLoadController();
  scramjet=new ScramjetController({
    files:{
      wasm:"/scram/scramjet.wasm.wasm",
      all:"/scram/scramjet.all.js",
      sync:"/scram/scramjet.sync.js"
    }
  });
  await scramjet.init();
  scramjetReady=true;
}

async function initBrowser(containerId){
  await initScramjet();
  await registerSW();

  const container=document.getElementById(containerId);
  const frame=scramjet.createFrame();
  frame.frame.style.width="100%";
  frame.frame.style.height="100%";
  container.appendChild(frame.frame);

  await frame.waitUntilReady();
  frame.go("https://search.brave.com/");
}

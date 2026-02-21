// ================= TITLE ANIMATION =================

const title = "Matriarchs OS";
const titleEl = document.getElementById("animated-title");

title.split("").forEach((l,i)=>{
  const span=document.createElement("span");
  span.textContent=l;
  span.style.animationDelay=i*.05+"s";
  titleEl.appendChild(span);
});

let step=1;

document.addEventListener("keydown",e=>{
  if(e.code==="Space" && step===1){
    document.querySelectorAll("#animated-title span").forEach((s,i)=>{
      s.style.animation=`letterOut .4s forwards`;
      s.style.animationDelay=i*.03+"s";
    });
    setTimeout(nextStep,600);
  }
});

function nextStep(){
  document.querySelector(`#step-${step}`).classList.remove("active");
  step++;
  document.querySelector(`#step-${step}`).classList.add("active");
}

// ================= NAME STEP =================

document.getElementById("saveName").onclick=saveName;
document.getElementById("nameInput").addEventListener("keydown",e=>{
  if(e.key==="Enter") saveName();
});

function saveName(){
  const name=document.getElementById("nameInput").value.trim();
  if(!name) return;
  localStorage.setItem("username",name);
  nextStep();
}

// ================= BG PICK =================

document.querySelectorAll(".bg-grid img").forEach(img=>{
  img.onclick=()=>{
    localStorage.setItem("bg",img.src);
    document.getElementById("desktop").style.backgroundImage=`url(${img.src})`;
    document.getElementById("onboarding").style.display="none";

    alert("Welcome, "+localStorage.getItem("username")+" 👑");
  };
});

// Load saved
window.onload=()=>{
  const bg=localStorage.getItem("bg");
  if(bg){
    document.getElementById("desktop").style.backgroundImage=`url(${bg})`;
    document.getElementById("onboarding").style.display="none";
  }
};

// ================= CLOCK =================

function updateClock(){
  const now=new Date();
  document.getElementById("clock").innerText=
    now.toLocaleTimeString()+" | "+
    now.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
}
setInterval(updateClock,1000);
updateClock();

// ================= WINDOW SYSTEM =================

const desktop=document.getElementById("desktop");
let z=1;

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
  <div class="content">${getAppContent(app)}</div>
  `;

  desktop.appendChild(win);
  makeDraggable(win);

  win.querySelector(".close").onclick=()=>win.remove();

  win.querySelector(".min").onclick=()=>{
    win.style.display="none";
  };

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

// ================= APPS =================

function getAppContent(app){
  if(app==="games") return "<h2 style='padding:20px'>Games Coming Soon</h2>";

  if(app==="settings"){
    return `
    <h3 style='padding:20px'>Settings</h3>
    <div style='padding:20px'>
      <button onclick="cloak('classroom')">Google Classroom</button>
      <button onclick="cloak('google')">Google</button>
      <button onclick="cloak('blank')">Blank</button>
    </div>
    `;
  }

  if(app==="browser"){
    return "<div id='browserArea' style='width:100%;height:100%'></div>";
  }

  return "";
}

// ================= TAB CLOAK =================

function cloak(type){
  if(type==="classroom"){
    document.title="Google Classroom";
    setIcon("https://ssl.gstatic.com/classroom/favicon.png");
  }
  if(type==="google"){
    document.title="Google";
    setIcon("https://www.google.com/favicon.ico");
  }
  if(type==="blank"){
    document.title="New Tab";
    setIcon("");
  }
}

function setIcon(url){
  let link=document.querySelector("link[rel~='icon']");
  if(!link){
    link=document.createElement("link");
    link.rel="icon";
    document.head.appendChild(link);
  }
  link.href=url;
}

// ================= LAUNCHPAD =================

document.getElementById("launchBtn").onclick=()=>{
  document.getElementById("launchpad").classList.toggle("hidden");
};

document.querySelectorAll("#launchpad button, #pinnedApps button")
.forEach(btn=>{
  btn.onclick=()=>openWindow(btn.dataset.app);
});

// ================= SCRAMJET =================

let scramjetReady=false;
let scramjet,connection,frame;

async function initScramjet(){
  if(scramjetReady) return;

  const { ScramjetController } = $scramjetLoadController();
  scramjet = new ScramjetController({
    files:{
      wasm:"/scram/scramjet.wasm.wasm",
      all:"/scram/scramjet.all.js",
      sync:"/scram/scramjet.sync.js"
    }
  });

  await scramjet.init();
  connection=new BareMux.BareMuxConnection("/baremux/worker.js");
  scramjetReady=true;
}

async function loadBrowser(){
  await initScramjet();
  await registerSW();

  const area=document.getElementById("browserArea");
  frame=scramjet.createFrame();
  frame.frame.style.width="100%";
  frame.frame.style.height="100%";
  area.appendChild(frame.frame);

  await frame.waitUntilReady();
  frame.go("https://search.brave.com/");
}

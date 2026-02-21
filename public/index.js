// ================= PARTICLES =================
const canvas=document.getElementById("particles");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
let parts=[];
for(let i=0;i<120;i++){
  parts.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2});
}
function drawParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  parts.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="white";
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

// ================= BOOT + ONBOARDING =================
let bootText="Matriarchs OS", idx=0;
const bootEl=document.getElementById("bootText");
function typeBoot(){
  if(idx<bootText.length){
    bootEl.textContent+=bootText[idx++];
    setTimeout(typeBoot,100);
  } else {
    setTimeout(()=>{
      document.getElementById("bootScreen").classList.add("hidden");
      document.getElementById("onboarding").classList.remove("hidden");
    },800);
  }
}
typeBoot();

document.addEventListener("keydown",(e)=>{
  if(e.code==="Space"){
    document.getElementById("onboarding").classList.add("hidden");
    document.getElementById("nameInputScreen").classList.remove("hidden");
  }
});

function saveName(){
  const name=document.getElementById("nameField").value;
  localStorage.setItem("username",name);
  document.getElementById("nameInputScreen").classList.add("hidden");
  document.getElementById("bgPickerScreen").classList.remove("hidden");
}

function setBG(url){
  document.getElementById("desktop").style.backgroundImage=`url(${url})`;
  document.getElementById("bgPickerScreen").classList.add("hidden");
  document.getElementById("desktop").classList.remove("hidden");
  document.getElementById("welcomeText").innerText="Welcome, "+localStorage.getItem("username");
  startClock();
}

// ================= CLOCK =================
function startClock(){
  setInterval(()=>{
    const d=new Date();
    document.getElementById("clock").innerText=
      d.toLocaleTimeString()+" | "+d.toLocaleDateString();
  },1000);
}

// ================= LAUNCHPAD =================
document.getElementById("launchBtn").onclick=()=>{
  document.getElementById("launchpad").classList.toggle("hidden");
};

document.querySelectorAll("#launchpad button").forEach(btn=>{
  btn.onclick=()=>openApp(btn.dataset.app);
});

// ================= WINDOW + BROWSER =================
let scramjetInstance=null;
async function initScramjet(){
  if(scramjetInstance) return scramjetInstance;
  const { ScramjetController } = $scramjetLoadController();
  const sj = new ScramjetController({
    files:{
      wasm:"/scram/scramjet.wasm.wasm",
      all:"/scram/scramjet.all.js",
      sync:"/scram/scramjet.sync.js"
    }
  });
  await sj.init();
  scramjetInstance=sj;
  return sj;
}

async function openBrowser(){
  const container=document.getElementById("browserContent");
  const sj = await initScramjet();
  await registerSW();
  const frame = sj.createFrame();
  frame.frame.style.width="100%";
  frame.frame.style.height="100%";
  container.appendChild(frame.frame);
  await frame.waitUntilReady();
  frame.go("https://search.brave.com/");
}

function openApp(id){
  document.getElementById(id+"App").classList.remove("hidden");
  if(id==="browser") openBrowser();
}

function closeWin(id){document.getElementById(id+"App").classList.add("hidden");}
function minWin(id){document.getElementById(id+"App").classList.add("hidden");}
...

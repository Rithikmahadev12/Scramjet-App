// ================= ONBOARDING =================

const titleText = "Matriarchs OS";
const titleEl = document.getElementById("animated-title");

titleText.split("").forEach((letter,i)=>{
  const span = document.createElement("span");
  span.textContent = letter;
  span.style.animationDelay = i*0.05+"s";
  titleEl.appendChild(span);
});

let currentStep = 1;

document.addEventListener("keydown", e=>{
  if(e.code==="Space" && currentStep===1){
    animateOutLetters();
  }
});

function animateOutLetters(){
  document.querySelectorAll("#animated-title span").forEach((span,i)=>{
    span.style.animation = `letterOut 0.4s forwards`;
    span.style.animationDelay = i*0.03+"s";
  });

  setTimeout(()=>{
    nextStep();
  },600);
}

function nextStep(){
  document.querySelector(`#step-${currentStep}`).classList.remove("active");
  currentStep++;
  document.querySelector(`#step-${currentStep}`).classList.add("active");
}

document.getElementById("save-name").onclick=()=>{
  const name=document.getElementById("username-input").value;
  localStorage.setItem("username",name);
  nextStep();
};

document.querySelectorAll(".bg-options img").forEach(img=>{
  img.onclick=()=>{
    document.getElementById("desktop").style.backgroundImage=`url(${img.src})`;
    localStorage.setItem("bg",img.src);
    document.getElementById("onboarding").style.display="none";
  };
});

// Load saved bg
window.onload=()=>{
  const bg=localStorage.getItem("bg");
  if(bg){
    document.getElementById("desktop").style.backgroundImage=`url(${bg})`;
    document.getElementById("onboarding").style.display="none";
  }
};

// ================= WINDOWS =================

const desktop = document.getElementById("desktop");
const launchpad = document.getElementById("launchpad");

document.getElementById("start-btn").onclick=()=>{
  launchpad.classList.toggle("hidden");
};

document.querySelectorAll("#launchpad button").forEach(btn=>{
  btn.onclick=()=> openWindow(btn.dataset.app);
});

function openWindow(app){
  const win=document.createElement("div");
  win.className="window";
  win.style.top="100px";
  win.style.left="100px";

  win.innerHTML=`
    <div class="title-bar">
      <span>${app}</span>
      <div class="window-controls">
        <button class="minimize"></button>
        <button class="maximize"></button>
        <button class="close"></button>
      </div>
    </div>
    <div class="content">${getAppContent(app)}</div>
  `;

  desktop.appendChild(win);

  // Controls
  win.querySelector(".close").onclick=()=>win.remove();

  win.querySelector(".minimize").onclick=()=>{
    win.classList.toggle("hidden");
  };

  win.querySelector(".maximize").onclick=()=>{
    win.style.width="100%";
    win.style.height="100%";
    win.style.top="0";
    win.style.left="0";
  };

  makeDraggable(win);
}

function getAppContent(app){
  if(app==="games") return "<h2>Games Coming Soon</h2>";
  if(app==="browser") return "<iframe src='https://search.brave.com/' style='width:100%;height:100%;border:none;'></iframe>";
  if(app==="settings") return `
    <h3>Settings</h3>
    <button onclick="cloakTab()">Cloak Tab</button>
  `;
  return "";
}

function cloakTab(){
  document.title="Google Classroom";
  const link=document.createElement("link");
  link.rel="icon";
  link.href="https://ssl.gstatic.com/classroom/favicon.png";
  document.head.appendChild(link);
}

// Dragging
function makeDraggable(el){
  const bar=el.querySelector(".title-bar");
  let offsetX,offsetY,isDown=false;

  bar.onmousedown=(e)=>{
    isDown=true;
    offsetX=e.clientX-el.offsetLeft;
    offsetY=e.clientY-el.offsetTop;
  };

  document.onmousemove=(e)=>{
    if(isDown){
      el.style.left=e.clientX-offsetX+"px";
      el.style.top=e.clientY-offsetY+"px";
    }
  };

  document.onmouseup=()=>isDown=false;
}

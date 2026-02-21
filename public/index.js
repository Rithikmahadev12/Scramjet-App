"use strict";

/* ELEMENTS */
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const proxyBar = document.getElementById("proxy-bar");
const proxyBack = document.getElementById("proxy-back");
const tabsContainer = document.getElementById("tabs");
const newTabBtn = document.getElementById("new-tab");

/* ONBOARDING */
const onboardPage = document.getElementById("page-onboarding");
const onboardName = document.getElementById("onboard-name");
const onboardTheme = document.getElementById("onboard-theme");
const onboardStart = document.getElementById("onboard-start");
const profileName = document.getElementById("profile-name");
const themeSelect = document.getElementById("theme-select");
const resetOnboardBtn = document.getElementById("reset-onboarding");

/* SCRAMJET */
const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});
scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

/* TABS */
let tabs = [];
let activeTab = null;

/* SHOW PAGE FUNCTION */
function showPage(name){
	document.querySelectorAll(".page").forEach(p=>{
		p.hidden = p.id!==`page-${name}`;
		p.classList.toggle("active-page", p.id===`page-${name}`);
	});
	document.querySelectorAll(".nav-btn").forEach(b=>{
		b.classList.toggle("active", b.dataset.page===name);
	});
}

/* CREATE TAB */
function createTab(url){
	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";
	frame.frame.style.display="none";
	document.body.appendChild(frame.frame);

	const id = Date.now();
	tabs.push({id, frame});
	setActiveTab(id);

	frame.go(url);
	proxyBar.hidden = false;
}

/* SET ACTIVE TAB */
function setActiveTab(id){
	tabs.forEach(tab=>{
		tab.frame.frame.style.display = tab.id===id?"block":"none";
	});
	activeTab=id;
	renderTabs();
}

/* CLOSE TAB */
function closeTab(id){
	const index=tabs.findIndex(t=>t.id===id);
	if(index===-1) return;
	tabs[index].frame.frame.remove();
	tabs.splice(index,1);
	if(tabs.length) setActiveTab(tabs[tabs.length-1].id);
	else { proxyBar.hidden=true; showPage("home"); }
}

/* RENDER TABS */
function renderTabs(){
	tabsContainer.innerHTML="";
	tabs.forEach(tab=>{
		const el=document.createElement("div");
		el.className="tab"+(tab.id===activeTab?" active":"");
		el.textContent="Tab";
		el.onclick=()=>setActiveTab(tab.id);

		const closeBtn=document.createElement("button");
		closeBtn.textContent="×";
		closeBtn.onclick=(e)=>{ e.stopPropagation(); closeTab(tab.id); };

		el.appendChild(closeBtn);
		tabsContainer.appendChild(el);
	});
}

/* FORM SUBMIT */
form.addEventListener("submit", async e=>{
	e.preventDefault();
	try { await registerSW(); } catch(err){ console.error(err); return; }
	const url = search(address.value, searchEngine.value);

	let wispUrl=(location.protocol==="https:"?"wss":"ws")+"://"+location.host+"/wisp/";
	if((await connection.getTransport())!=="/libcurl/index.mjs")
		await connection.setTransport("/libcurl/index.mjs", [{websocket:wispUrl}]);

	createTab(url);
});

/* NEW TAB */
newTabBtn.onclick=()=>createTab("https://www.google.com");

/* HOME BUTTON */
proxyBack.onclick=()=>{
	tabs.forEach(tab=>tab.frame.frame.remove());
	tabs=[];
	proxyBar.hidden=true;
	showPage("home");
};

/* NAVIGATION BUTTONS */
document.querySelectorAll(".nav-btn").forEach(btn=>{
	btn.addEventListener("click", ()=>{
		const page = btn.dataset.page||"home";
		showPage(page);
	});
});

/* ONBOARDING START */
onboardStart.onclick=()=>{
	const name = onboardName.value.trim()||"Guest";
	const theme = onboardTheme.value;
	document.body.dataset.theme = theme;
	profileName.value = name;
	themeSelect.value = theme;
	localStorage.setItem("userName",name);
	localStorage.setItem("theme",theme);
	showPage("home");
};

/* RESET ONBOARDING */
resetOnboardBtn.onclick=()=>{
	localStorage.removeItem("userName");
	localStorage.removeItem("theme");
	showPage("onboarding");
};

/* THEME SELECT */
themeSelect.onchange=(e)=>{
	document.body.dataset.theme=e.target.value;
};

/* INITIALIZE */
const savedName=localStorage.getItem("userName");
const savedTheme=localStorage.getItem("theme");
if(savedName){
	profileName.value=savedName;
	themeSelect.value=savedTheme||"dark";
	document.body.dataset.theme=savedTheme||"dark";
	showPage("home");
}else{
	showPage("onboarding");
}

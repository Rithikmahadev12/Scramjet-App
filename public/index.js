"use strict";

/* ELEMENTS */
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const proxyBar = document.getElementById("proxy-bar");
const proxyLoading = document.getElementById("proxy-loading");
const proxyBack = document.getElementById("proxy-back");
const tabsContainer = document.getElementById("tabs");
const newTabBtn = document.getElementById("new-tab");

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

let tabs = [];
let activeTab = null;

/* PAGE SWITCH */
function showPage(name) {
	document.querySelectorAll(".page").forEach(p => {
		p.hidden = p.id !== `page-${name}`;
		p.classList.toggle("active-page", p.id === `page-${name}`);
	});
}

/* CREATE TAB */
function createTab(url) {
	const frame = scramjet.createFrame();
	frame.frame.id = "sj-frame";

	document.body.appendChild(frame.frame);

	const id = Date.now();
	tabs.push({ id, frame });

	setActiveTab(id);

	frame.go(url);

	return id;
}

/* SET ACTIVE TAB */
function setActiveTab(id) {
	tabs.forEach(tab => {
		tab.frame.frame.style.display = tab.id === id ? "block" : "none";
	});

	activeTab = id;
	renderTabs();
}

/* CLOSE TAB */
function closeTab(id) {
	const index = tabs.findIndex(t => t.id === id);
	if (index === -1) return;

	tabs[index].frame.frame.remove();
	tabs.splice(index, 1);

	if (tabs.length) {
		setActiveTab(tabs[0].id);
	} else {
		proxyBar.hidden = true;
		showPage("home");
	}
}

/* RENDER TABS */
function renderTabs() {
	tabsContainer.innerHTML = "";

	tabs.forEach(tab => {
		const el = document.createElement("div");
		el.className = "tab" + (tab.id === activeTab ? " active" : "");
		el.textContent = "Tab";

		el.onclick = () => setActiveTab(tab.id);

		const closeBtn = document.createElement("button");
		closeBtn.textContent = "×";
		closeBtn.onclick = (e) => {
			e.stopPropagation();
			closeTab(tab.id);
		};

		el.appendChild(closeBtn);
		tabsContainer.appendChild(el);
	});
}

/* SEARCH */
form.addEventListener("submit", async (e) => {
	e.preventDefault();

	await registerSW();

	const url = search(address.value, searchEngine.value);

	let wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";

	if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
		await connection.setTransport("/libcurl/index.mjs", [
			{ websocket: wispUrl },
		]);
	}

	proxyLoading.hidden = false;

	setTimeout(() => {
		createTab(url);
		proxyLoading.hidden = true;
		proxyBar.hidden = false;
	}, 600);
});

/* NEW TAB */
newTabBtn.onclick = () => {
	if (activeTab) {
		createTab("https://www.google.com");
	}
};

/* HOME BUTTON */
proxyBack.onclick = () => {
	tabs.forEach(tab => tab.frame.frame.remove());
	tabs = [];
	proxyBar.hidden = true;
	showPage("home");
};

/* INIT */
showPage("home");

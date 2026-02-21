"use strict";

/* ---------- SCRAMJET ---------- */

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

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
let currentFrame = null;

/* ---------- PAGE SWITCHING ---------- */

function showPage(name) {
	document.querySelectorAll(".page").forEach(p => {
		p.classList.remove("active");
	});
	const page = document.getElementById(`page-${name}`);
	page.classList.add("active");

	document.querySelectorAll(".nav-btn").forEach(btn => {
		btn.classList.toggle("active", btn.dataset.page === name);
	});
}

document.querySelectorAll(".nav-btn").forEach(btn => {
	btn.addEventListener("click", () => {
		showPage(btn.dataset.page);
	});
});

/* ---------- SEARCH ---------- */

form?.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Service worker failed.";
		errorCode.textContent = err.toString();
		return;
	}

	const url = search(address.value, searchEngine.value);

	if (currentFrame) currentFrame.frame.remove();

	currentFrame = scramjet.createFrame();
	currentFrame.frame.id = "sj-frame";
	document.body.appendChild(currentFrame.frame);

	currentFrame.go(url);
});

/* ---------- THEME ---------- */

function applyTheme(theme) {
	document.documentElement.setAttribute("data-theme", theme);
	localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

const themeSelect = document.getElementById("theme-select");
if (themeSelect) themeSelect.value = savedTheme;

themeSelect?.addEventListener("change", e => {
	applyTheme(e.target.value);
});

/* ---------- ONBOARDING ---------- */

function checkOnboarding() {
	const name = localStorage.getItem("userName");
	if (!name) {
		showPage("onboarding");
	} else {
		document.getElementById("welcome-title").textContent =
			`Welcome back, ${name}`;
		showPage("home");
	}
}

document.getElementById("onboard-start")?.addEventListener("click", () => {
	const name = document.getElementById("onboard-name").value.trim();
	const theme = document.getElementById("onboard-theme").value;
	if (!name) return;

	localStorage.setItem("userName", name);
	applyTheme(theme);
	checkOnboarding();
});

document.getElementById("reset-onboarding")?.addEventListener("click", () => {
	localStorage.clear();
	location.reload();
});

checkOnboarding();

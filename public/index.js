"use strict";

/* ---------- ELEMENTS ---------- */

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

/* ---------- SCRAMJET ---------- */

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
	document.querySelectorAll(".page").forEach(page => {
		if (page.id === `page-${name}`) {
			page.hidden = false;
			requestAnimationFrame(() => {
				page.classList.add("active-page");
			});
		} else {
			page.classList.remove("active-page");
			setTimeout(() => page.hidden = true, 200);
		}
	});

	document.querySelectorAll(".nav-btn").forEach(btn => {
		btn.classList.toggle("active", btn.dataset.page === name);
	});
}

document.querySelectorAll(".nav-btn").forEach(btn => {
	btn.addEventListener("click", () => {
		showPage(btn.dataset.page);
	});
});

/* ---------- SEARCH (FIXED PROPERLY) ---------- */

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		console.error(err);
		return;
	}

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

	// Remove old frame
	if (currentFrame) {
		currentFrame.frame.remove();
	}

	currentFrame = scramjet.createFrame();
	currentFrame.frame.id = "sj-frame";

	const homeEl = document.getElementById("page-home");
	homeEl.appendChild(currentFrame.frame);

	currentFrame.go(url);
});

/* ---------- THEME SYSTEM ---------- */

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
		document.querySelector(".logo-wrapper h1").textContent =
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

	document.querySelector(".logo-wrapper h1").textContent =
		`Hello, ${name}`;

	showPage("home");
});

document.getElementById("reset-onboarding")?.addEventListener("click", () => {
	localStorage.clear();
	location.reload();
});

/* ---------- INIT ---------- */

checkOnboarding();

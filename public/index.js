// PAGE SWITCHING
document.querySelectorAll("[data-page]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(btn.dataset.page).classList.add("active");
  });
});

// SEARCH LOGIC
function processInput(input) {
  if (!input.startsWith("http")) {
    if (input.includes(".")) {
      return "https://" + input;
    } else {
      return "https://www.google.com/search?q=" + encodeURIComponent(input);
    }
  }
  return input;
}

function loadURL(url) {
  document.getElementById("webFrame").src = url;
  document.getElementById("browserInput").value = url;
  document.querySelector('[data-page="browser"]').click();
}

document.getElementById("homeSearchBtn").onclick = () => {
  const input = document.getElementById("homeSearch").value.trim();
  if (input) loadURL(processInput(input));
};

document.getElementById("browserGo").onclick = () => {
  const input = document.getElementById("browserInput").value.trim();
  if (input) loadURL(processInput(input));
};

// BOOKMARK SYSTEM
let bookmarks = JSON.parse(localStorage.getItem("novaBookmarks")) || [];

function saveBookmarks() {
  localStorage.setItem("novaBookmarks", JSON.stringify(bookmarks));
  renderBookmarks();
}

function renderBookmarks() {
  const list = document.getElementById("bookmarkList");
  list.innerHTML = "";
  bookmarks.forEach(url => {
    const div = document.createElement("div");
    div.className = "bookmark-item";
    div.textContent = url;
    div.onclick = () => loadURL(url);
    list.appendChild(div);
  });
}

document.getElementById("bookmarkAdd").onclick = () => {
  const url = document.getElementById("browserInput").value;
  if (url && !bookmarks.includes(url)) {
    bookmarks.push(url);
    saveBookmarks();
  }
};

renderBookmarks();

// GN MATH GAMES AUTO LOAD
const games = [
  { name: "Slope Game", url: "https://slopegame.io" },
  { name: "2048", url: "https://play2048.co" },
  { name: "Run 3", url: "https://run3.io" }
];

const grid = document.getElementById("gamesGrid");

games.forEach(game => {
  const card = document.createElement("div");
  card.className = "game-card";
  card.textContent = game.name;
  card.onclick = () => loadURL(game.url);
  grid.appendChild(card);
});

// SIMPLE AI
document.getElementById("aiSend").onclick = () => {
  const input = document.getElementById("aiInput");
  const chat = document.getElementById("chat");

  if (!input.value.trim()) return;

  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.textContent = "You: " + input.value;
  chat.appendChild(userMsg);

  const botMsg = document.createElement("div");
  botMsg.className = "message bot";
  botMsg.textContent = "Nova AI: I'm still learning! You said: " + input.value;
  chat.appendChild(botMsg);

  input.value = "";
  chat.scrollTop = chat.scrollHeight;
};

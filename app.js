let key;
let entries = [];

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("SW registrato"))
    .catch((e) => console.log("SW errore", e));
}

async function unlock() {
  const master = document.getElementById("master").value;
  if (!master) return alert("Inserisci la master password");

  key = await deriveKey(master);

  const saved = localStorage.getItem("vault");
  if (saved) {
    const decrypted = await decryptData(saved);
    entries = JSON.parse(decrypted);
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  render();
}

async function deriveKey(password) {
  const enc = new TextEncoder();
  const salt = enc.encode("fixed_salt_123"); // meglio un salt fisso per la tua app
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(data)
  );
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(cipher))
  });
}

async function decryptData(blob) {
  const obj = JSON.parse(blob);
  const iv = new Uint8Array(obj.iv);
  const data = new Uint8Array(obj.data);
  const dec = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return new TextDecoder().decode(dec);
}

async function saveVault() {
  const encrypted = await encryptData(JSON.stringify(entries));
  localStorage.setItem("vault", encrypted);
}

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  entries.forEach((e, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <b>${e.tag}</b> | ${e.user} | ${e.password}
      <button onclick="deleteEntry(${i})">Elimina</button>
    `;
    list.appendChild(div);
  });
}

function saveEntry() {
  const tag = document.getElementById("tag").value;
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (!tag || !user || !pass) return alert("Compila tutto");

  entries.push({ tag, user, password: pass });
  saveVault();
  render();
}

function deleteEntry(i) {
  entries.splice(i, 1);
  saveVault();
  render();
}

function generate() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let p = "";
  for (let i = 0; i < 16; i++) p += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById("pass").value = p;
}

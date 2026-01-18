let key;
let entries = [];
let editIndex = null;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(reg => {
    reg.update();
  });
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

  const trTitle = document.createElement("tr");
  trTitle.innerHTML = `
    <th>TAG</th>
    <th>USERNAME</th>
    <th>PASSWORD</th>
    <th>COPIA</th>
    <th>MODIFICA</th>
    <th>ELIMINA</th>
  `;
  list.appendChild(trTitle);

  entries.forEach((e, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <th>${e.tag}</th>
      <th>${e.user}</th>
      <th id="pass-${i}">*****</th>
      <th><button onclick="copyPassword(${i})">Copia</button></th>
      <th><button onclick="updateEntry(${i})">Modifica</button></th>
      <th><button onclick="deleteEntry(${i})">Elimina</button></th>
    `;

    list.appendChild(tr);
  });

  document.getElementById("tag").value = "";
  document.getElementById("user").value = "";
  document.getElementById("pass").value = "";
}

function togglePassword() {
  entries.forEach((e, i) => {
    const cell = document.getElementById(`pass-${i}`);
    const current = cell.innerText;
  
    if (current === "*****") {
      cell.innerText = entries[i].password;
    } else {
      cell.innerText = "*****";
    }
  });
}

function saveEntry() {
  const tag = document.getElementById("tag").value;
  const user = document.getElementById("user").value;
  const password = document.getElementById("pass").value;
  
  if (!tag || !user || !password) return alert("Compila tutto");

  const entry = { tag, user, password };

  if (editIndex !== null) {
    entries[editIndex] = entry;
  } else {
    entries.push(entry);
  }

  editIndex = null;   
  saveVault();
  render();
}

function deleteEntry(i) {
  entries.splice(i, 1);
  saveVault();
  render();
}

function updateEntry(i) {
  const entry = entries[i];
  editIndex = i;

  document.getElementById("tag").value = entry.tag;
  document.getElementById("user").value = entry.user;
  document.getElementById("pass").value = entry.password;
}

function copyPassword(i) {
  const password = entries[i].password;

  const temp = document.createElement("input");
  temp.value = password;
  document.body.appendChild(temp);

  temp.select();
  document.execCommand("copy");

  document.body.removeChild(temp);
}

function generate() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let p = "";
  for (let i = 0; i < 16; i++) p += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById("pass").value = p;
}


const RELAY_URL = "wss://hone-relay.lasky.workers.dev";

// Site téléphone : l'adresse GitHub Pages (le QR pointera vers SITE_URL#<id>)
const SITE_URL = "https://oscarflasky.github.io/honeweb/";



function createSessionId() {
   return crypto.randomUUID();

}

// Doit afficher un QR code de `url` à l'intérieur de `container` (la div #qr).
function showQrCode(url, container) {
    const qr = new QRCodeStyling({
        width: 200,
        height: 200,
        data: url,
        margin: 8, // zone blanche autour : aide les téléphones à repérer le QR
        dotsOptions: { color: "#16161a", type: "rounded" },
        cornersSquareOptions: { color: "#646cff", type: "extra-rounded" },
        cornersDotOptions: { color: "#646cff" },
        backgroundOptions: { color: "#ffffff" },
    });
    qr.append(container);
}




// ================= Page de test (jetable) =================

const qrBox = document.getElementById("qr");
const sessionIdEl = document.getElementById("session-id");
const phoneLink = document.getElementById("phone-link");
const phoneStatus = document.getElementById("phone-status");
const relayStatus = document.getElementById("relay-status");
const relayStatusText = document.getElementById("relay-status-text");
const newSessionBtn = document.getElementById("new-session");
const gallery = document.getElementById("gallery");
const logBox = document.getElementById("log");


let socket = null;
let sessionId = null;
let reconnectTimer = null;
let incoming = null; // photo en cours de réception : { id, mime, size, chunks, received }

function log(message) {
    const time = new Date().toLocaleTimeString("fr-FR");
    logBox.textContent = `[${time}] ${message}\n` + logBox.textContent;
}

function formatSize(bytes) {
    return bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} Mo`
        : `${Math.round(bytes / 1024)} Ko`;
}

function setRelayStatus(state) {
    const labels = { online: "Relais connecté", connecting: "Connexion au relais…", offline: "Relais déconnecté" };
    relayStatus.dataset.state = state;
    relayStatusText.textContent = labels[state];
}

function setPhoneConnected(connected) {
    phoneStatus.textContent = connected ? "Connecté ✓" : "Non connecté";
    phoneStatus.style.color = connected ? "var(--success)" : "";
}

// ---------- Session ----------
function startSession() {
    sessionId = createSessionId();
    if (!sessionId) {
        log("createSessionId() ne renvoie rien : à coder en haut de desktop.js");
        qrBox.textContent = "createSessionId() à coder";
        return;
    }

    const phoneUrl = `${SITE_URL}#${sessionId}`;
    sessionIdEl.textContent = sessionId;
    phoneLink.href = phoneUrl;
    phoneLink.textContent = phoneUrl;
    setPhoneConnected(false);

    qrBox.replaceChildren();
    showQrCode(phoneUrl, qrBox);
    if (qrBox.childElementCount === 0) qrBox.textContent = "showQrCode() à coder";

    log(`Nouvelle session ${sessionId}`);
    connect();
}

// ---------- Connexion au relais ----------
function connect() {
    clearTimeout(reconnectTimer);
    if (socket) {
        socket.onclose = null; // fermeture volontaire : pas de reconnexion
        socket.close(1000);
    }

    const ws = new WebSocket(`${RELAY_URL}/session/${encodeURIComponent(sessionId)}?role=desktop`);
    ws.binaryType = "arraybuffer"; // les morceaux de photo arrivent en ArrayBuffer
    socket = ws;
    setRelayStatus("connecting");

    ws.onopen = () => {
        setRelayStatus("online");
        log("Connecté au relais, en attente du téléphone");
    };

    ws.onmessage = (event) => {
        if (typeof event.data === "string") onText(event.data);
        else onChunk(event.data);
    };

    ws.onclose = (event) => {
        setRelayStatus("offline");
        setPhoneConnected(false);
        incoming = null;
        log(`Relais fermé (${event.code}${event.reason ? " " + event.reason : ""})`);

        // 4000 = un autre onglet a pris la session : on le laisse faire
        if (event.code !== 4000) {
            log("Reconnexion dans 2 s…");
            reconnectTimer = setTimeout(connect, 2000);
        }
    };
}

function send(message) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

// ---------- Réception ----------
function onText(text) {
    let message;
    try {
        message = JSON.parse(text);
    } catch {
        log(`Message texte illisible : ${text.slice(0, 80)}`);
        return;
    }

    switch (message.type) {
        case "peer":
            if (message.role === "phone") {
                setPhoneConnected(message.connected);
                log(message.connected ? "Téléphone connecté" : "Téléphone déconnecté");
            }
            break;

        case "photo-start":
            incoming = {
                id: message.id,
                mime: message.mime || "image/jpeg",
                size: message.size,
                chunks: [],
                received: 0,
            };
            log(`Réception de la photo ${message.id} (${formatSize(message.size ?? 0)})…`);
            break;

        case "photo-end":
            finishPhoto(message.id);
            break;

        default:
            log(`Message inconnu : ${message.type}`);
    }
}

function onChunk(buffer) {
    if (!incoming) {
        log("Morceau binaire reçu sans photo-start : ignoré");
        return;
    }
    incoming.chunks.push(buffer);
    incoming.received += buffer.byteLength;
}

function finishPhoto(id) {
    if (!incoming || incoming.id !== id) {
        log(`photo-end inattendu pour ${id} : ignoré`);
        return;
    }

    const blob = new Blob(incoming.chunks, { type: incoming.mime });
    if (incoming.size && blob.size !== incoming.size) {
        log(`⚠ Taille reçue ${blob.size} ≠ annoncée ${incoming.size}`);
    }

    addToGallery(blob);
    send({ type: "photo-received", id });
    log(`Photo ${id} reçue (${formatSize(blob.size)}), accusé de réception envoyé`);
    incoming = null;
}

function addToGallery(blob) {
    const url = URL.createObjectURL(blob);
    const time = new Date().toLocaleTimeString("fr-FR");

    const figure = document.createElement("figure");
    figure.className = "shot";

    const img = document.createElement("img");
    img.src = url;
    img.alt = `Scan reçu à ${time}`;

    const caption = document.createElement("figcaption");
    const info = document.createElement("span");
    info.textContent = `${time} · ${formatSize(blob.size)}`;
    const download = document.createElement("a");
    download.href = url;
    download.download = `scan-${time.replaceAll(":", "-")}.jpg`;
    download.textContent = "Télécharger";

    caption.append(info, download);
    figure.append(img, caption);
    gallery.prepend(figure);
}

newSessionBtn.addEventListener("click", startSession);
startSession();

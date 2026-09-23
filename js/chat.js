// Dandelion Chat – the chat itself.
//
// Two "winds" carry messages:
//   1. WebRTC (via PeerJS): browser to browser, across devices. The person who
//      plants a meadow is the host; guests connect to the host, and the host
//      passes every message on to everyone else (a star shape).
//   2. BroadcastChannel: tabs of the same browser, even with no internet.
// A message can arrive by both winds, so each one has an id and is shown once.
(function () {
  "use strict";

  const MAX_TEXT = 500;
  const MAX_NAME = 24;
  const HISTORY_LIMIT = 60;
  const CONNECT_TIMEOUT = 12000;
  const ROOM_PREFIX = "dandelion-";

  const ui = window.DandelionUI;
  const $ = (id) => document.getElementById(id);

  const els = {
    status: $("status"),
    statusText: $("status-text"),
    nameInput: $("name-input"),
    nameForm: $("name-form"),
    createRoom: $("create-room"),
    invite: $("invite"),
    inviteLink: $("invite-link"),
    copyLink: $("copy-link"),
    copyLabel: $("copy-label"),
    messages: $("messages"),
    empty: $("messages-empty"),
    composer: $("composer"),
    input: $("message-input"),
    send: $("send-button"),
  };

  /* ---------- Small helpers ---------- */

  const storage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* Storage full or blocked – chat still works, it just forgets. */
      }
    },
  };

  function randomId(length) {
    const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  }

  function randomName() {
    const moods = ["Quiet", "Drifting", "Golden", "Sleepy", "Wandering", "Gentle", "Dusky", "Windy"];
    const things = ["Fox", "Wren", "Clover", "Meadow", "Sparrow", "Moth", "Fern", "Hare"];
    const pick = (list) => list[crypto.getRandomValues(new Uint8Array(1))[0] % list.length];
    return `${pick(moods)} ${pick(things)}`;
  }

  const cleanName = (value) => String(value || "").trim().slice(0, MAX_NAME) || "Someone";
  const cleanText = (value) => String(value || "").trim().slice(0, MAX_TEXT);
  const countWords = (text) => (text.match(/\S+/g) || []).length;

  /* ---------- State ---------- */

  const params = new URLSearchParams(location.search);
  const roomParam = params.get("room");
  let roomId = roomParam && /^[a-z0-9-]{6,64}$/.test(roomParam) ? roomParam : null;
  const roomKey = () => roomId || "local";

  let myName = cleanName(storage.get("dandelion-name") || randomName());
  els.nameInput.value = myName;

  let peer = null;
  let isHost = false;
  let hostConn = null; // guest -> host connection
  const guests = new Set(); // host -> guest connections
  let friendsOnline = 1;
  let log = [];
  const seen = new Set();
  let channel = null;

  /* ---------- Status line ---------- */

  function setStatus(state, text) {
    els.status.dataset.state = state;
    els.statusText.textContent = text;
  }

  function updateStats() {
    const seeds = log.length;
    const words = log.reduce((sum, m) => sum + countWords(m.text), 0);
    ui.setStat("seeds", seeds);
    ui.setStat("words", words);
    ui.setStat("friends", friendsOnline);
  }

  /* ---------- Avatars: initials inside a dandelion puff (SVG) ---------- */

  const SVG_NS = "http://www.w3.org/2000/svg";

  function hash(text) {
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return h;
  }

  function initials(name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
    return letters.toUpperCase();
  }

  function makeAvatar(name) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "msg__avatar avatar");
    svg.setAttribute("viewBox", "0 0 40 40");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `${name}'s avatar`);

    const tone = hash(name) % 4;
    const puff = document.createElementNS(SVG_NS, "circle");
    puff.setAttribute("class", "avatar__puff");
    puff.setAttribute("cx", "20");
    puff.setAttribute("cy", "20");
    puff.setAttribute("r", "18.5");

    const disc = document.createElementNS(SVG_NS, "circle");
    disc.setAttribute("class", `avatar__disc avatar__disc--${tone}`);
    disc.setAttribute("cx", "20");
    disc.setAttribute("cy", "20");
    disc.setAttribute("r", "14.5");

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("class", `avatar__text avatar__text--${tone}`);
    label.setAttribute("x", "20");
    label.setAttribute("y", "20");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "central");
    label.textContent = initials(name);

    svg.append(puff, disc, label);
    return svg;
  }

  /* ---------- Rendering ---------- */

  function timeLabel(time) {
    return new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function scrollToEnd() {
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function renderMessage(message) {
    els.empty.hidden = true;
    const own = message.from === myId();

    const item = document.createElement("li");
    item.className = own ? "msg msg--own" : "msg";

    const bubble = document.createElement("div");
    bubble.className = "msg__bubble";

    const meta = document.createElement("p");
    meta.className = "msg__meta";
    const who = document.createElement("span");
    who.className = "msg__name";
    who.textContent = own ? `${message.name} (you)` : message.name;
    const when = document.createElement("time");
    when.dateTime = new Date(message.time).toISOString();
    when.textContent = timeLabel(message.time);
    meta.append(who, when);

    const text = document.createElement("p");
    text.className = "msg__text";
    text.textContent = message.text; // textContent: user text can never become HTML

    bubble.append(meta, text);
    item.append(makeAvatar(message.name), bubble);
    els.messages.appendChild(item);
    scrollToEnd();
  }

  function renderSystem(text) {
    const item = document.createElement("li");
    item.className = "msg msg--system";
    item.textContent = text;
    els.messages.appendChild(item);
    scrollToEnd();
  }

  /* ---------- History (kept in this browser) ---------- */

  // Every browser tab gets its own id, remembered for this tab only,
  // so "you" stays "you" after a reload but a second tab is a new person.
  let me = null;
  try {
    me = sessionStorage.getItem("dandelion-me");
  } catch (e) {
    me = null;
  }
  function setMe(id) {
    me = id;
    try {
      sessionStorage.setItem("dandelion-me", id);
    } catch (e) {
      /* Fine – the id just lives in memory. */
    }
  }
  if (!me) setMe(randomId(10));
  const myId = () => me;

  function loadHistory() {
    try {
      const saved = JSON.parse(storage.get(`dandelion-history:${roomKey()}`) || "[]");
      log = Array.isArray(saved) ? saved.map(normalise).filter(Boolean) : [];
    } catch (e) {
      log = [];
    }
    els.messages.querySelectorAll(".msg").forEach((node) => node.remove());
    els.empty.hidden = log.length > 0;
    seen.clear();
    log.forEach((message) => {
      seen.add(message.id);
      renderMessage(message);
    });
    updateStats();
  }

  function saveHistory() {
    storage.set(`dandelion-history:${roomKey()}`, JSON.stringify(log.slice(-HISTORY_LIMIT)));
  }

  // Never trust data from the network: rebuild the message from known fields only.
  function normalise(raw) {
    if (!raw || typeof raw !== "object") return null;
    const text = cleanText(raw.text);
    const id = String(raw.id || "").slice(0, 40);
    if (!text || !id) return null;
    const time = Number(raw.time);
    return {
      kind: "msg",
      id,
      from: String(raw.from || "").slice(0, 40),
      name: cleanName(raw.name),
      text,
      time: Number.isFinite(time) ? time : Date.now(),
    };
  }

  function receive(raw) {
    const message = normalise(raw);
    if (!message || seen.has(message.id)) return false;
    seen.add(message.id);
    log.push(message);
    if (log.length > HISTORY_LIMIT) log = log.slice(-HISTORY_LIMIT);
    saveHistory();
    renderMessage(message);
    updateStats();
    return true;
  }

  /* ---------- Wind 1: BroadcastChannel (tabs of this browser) ---------- */

  function openChannel() {
    if (channel) channel.close();
    if (!("BroadcastChannel" in window)) return;
    channel = new BroadcastChannel(`dandelion:${roomKey()}`);
    channel.onmessage = (event) => {
      const data = event.data || {};
      if (data.kind === "whoami") {
        if (data.from === me) channel.postMessage({ kind: "taken", from: me });
      } else if (data.kind === "taken") {
        if (data.from === me) setMe(randomId(10));
      } else if (receive(data) && isHost) {
        relay(data, null);
      }
    };
    channel.postMessage({ kind: "whoami", from: me });
  }

  /* ---------- Wind 2: WebRTC through PeerJS ---------- */

  function peerOptions() {
    // You can point the app at your own PeerJS server by defining
    // window.DANDELION_PEER_OPTIONS before this script (see README).
    return Object.assign({ debug: 0 }, window.DANDELION_PEER_OPTIONS || {});
  }

  function relay(data, except) {
    guests.forEach((conn) => {
      if (conn !== except && conn.open) conn.send(data);
    });
  }

  function sendPeerCount() {
    friendsOnline = guests.size + 1;
    updateStats();
    relay({ kind: "peers", count: friendsOnline }, null);
  }

  function handleData(conn, data) {
    if (!data || typeof data !== "object") return;
    if (data.kind === "peers" && !isHost) {
      friendsOnline = Math.max(1, Math.min(99, Number(data.count) || 1));
      updateStats();
    } else if (data.kind === "system" && !isHost) {
      renderSystem(String(data.text || "").slice(0, 120));
    } else if (data.kind === "msg" && receive(data)) {
      if (channel) channel.postMessage(data);
      if (isHost) relay(data, conn);
    }
  }

  function destroyPeer() {
    guests.forEach((conn) => conn.close());
    guests.clear();
    hostConn = null;
    if (peer) peer.destroy();
    peer = null;
    friendsOnline = 1;
  }

  function whenPeerReady(onReady) {
    if (typeof window.Peer !== "function") {
      setStatus("error", "The wind is still: the PeerJS library did not load. Tabs in this browser can still talk.");
      return;
    }
    onReady();
  }

  function watchTimeout(label) {
    const timer = setTimeout(() => {
      if (els.status.dataset.state === "connecting") {
        setStatus("error", `The wind is still: ${label}. Tabs in this browser can still talk.`);
      }
    }, CONNECT_TIMEOUT);
    return () => clearTimeout(timer);
  }

  function plantMeadow(existingId) {
    whenPeerReady(() => {
      destroyPeer();
      isHost = true;
      const id = existingId || ROOM_PREFIX + randomId(10);
      setStatus("connecting", "Asking the wind for a path…");
      const cancelTimeout = watchTimeout("could not reach the PeerJS matchmaker");

      peer = new window.Peer(id, peerOptions());

      peer.on("open", (openId) => {
        cancelTimeout();
        try {
          sessionStorage.setItem(`dandelion-host:${openId}`, "1");
        } catch (e) {
          /* Not critical: after a reload you simply join as a guest. */
        }
        enterRoom(openId);
        showInvite();
        friendsOnline = 1;
        updateStats();
        setStatus("online", "Your meadow is open. Share the link and wait for a friend to drift in.");
      });

      peer.on("connection", (conn) => {
        conn.on("open", () => {
          guests.add(conn);
          const name = cleanName(conn.metadata && conn.metadata.name);
          // Send the new guest the story so far
          log.forEach((message) => conn.send(message));
          renderSystem(`${name} drifted into the meadow`);
          relay({ kind: "system", text: `${name} drifted into the meadow` }, conn);
          sendPeerCount();
          setStatus("online", "Your meadow is open. Friends are chatting straight with you.");
        });
        conn.on("data", (data) => handleData(conn, data));
        conn.on("close", () => {
          if (!guests.delete(conn)) return;
          const name = cleanName(conn.metadata && conn.metadata.name);
          renderSystem(`${name} floated away`);
          relay({ kind: "system", text: `${name} floated away` }, conn);
          sendPeerCount();
        });
      });

      peer.on("error", (error) => {
        cancelTimeout();
        if (error.type === "unavailable-id" && existingId) {
          // Someone else (maybe another tab) already hosts this meadow: join it instead.
          destroyPeer();
          joinMeadow(existingId);
          return;
        }
        setStatus("error", `The wind is still (${error.type || "network error"}). Tabs in this browser can still talk.`);
      });
    });
  }

  function joinMeadow(id, attempt = 1) {
    whenPeerReady(() => {
      destroyPeer();
      isHost = false;
      setStatus("connecting", "Following the wind to your friend’s meadow…");
      const cancelTimeout = watchTimeout("could not reach your friend");
      showInvite();

      peer = new window.Peer(undefined, peerOptions());

      peer.on("open", () => {
        const conn = peer.connect(id, { reliable: true, metadata: { name: myName } });
        hostConn = conn;

        conn.on("open", () => {
          cancelTimeout();
          setStatus("online", "Connected! Your words fly straight to your friend.");
          // Share anything written here before the connection opened
          log.forEach((message) => conn.send(message));
        });
        conn.on("data", (data) => handleData(conn, data));
        conn.on("close", () => {
          if (hostConn !== conn) return;
          friendsOnline = 1;
          updateStats();
          setStatus("error", "The meadow’s host has left. Your messages are still saved in this browser.");
          if (attempt < 3) setTimeout(() => joinMeadow(id, attempt + 1), 4000);
        });
      });

      peer.on("error", (error) => {
        if (error.type === "peer-unavailable") {
          cancelTimeout();
          setStatus("error", "This meadow is empty right now: its host is offline. Ask them to open the page again, or plant your own.");
          return;
        }
        cancelTimeout();
        setStatus("error", `The wind is still (${error.type || "network error"}). Tabs in this browser can still talk.`);
      });
    });
  }

  function enterRoom(id) {
    const changed = id !== roomId;
    roomId = id;
    const url = new URL(location.href);
    url.searchParams.set("room", id);
    window.history.replaceState(null, "", url);
    if (changed) {
      openChannel();
      loadHistory();
    }
  }

  function inviteUrl() {
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("room", roomId);
    return url.toString();
  }

  function showInvite() {
    if (!roomId) return;
    els.invite.hidden = false;
    els.inviteLink.value = inviteUrl();
    els.createRoom.querySelector("span").textContent = "Plant a new meadow";
  }

  /* ---------- Sending ---------- */

  function send(text) {
    const message = {
      kind: "msg",
      id: `${myId()}-${Date.now().toString(36)}-${randomId(4)}`,
      from: myId(),
      name: myName,
      text,
      time: Date.now(),
    };
    receive(message);
    if (channel) channel.postMessage(message);
    if (isHost) relay(message, null);
    else if (hostConn && hostConn.open) hostConn.send(message);
  }

  /* ---------- Events ---------- */

  els.composer.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = cleanText(els.input.value);
    if (!text) return;
    send(text);
    ui.blowSeed(els.send);
    els.input.value = "";
    els.input.focus();
  });

  els.nameForm.addEventListener("submit", (event) => event.preventDefault());
  els.nameInput.addEventListener("change", () => {
    myName = cleanName(els.nameInput.value);
    els.nameInput.value = myName;
    storage.set("dandelion-name", myName);
  });

  els.createRoom.addEventListener("click", () => {
    plantMeadow();
  });

  els.copyLink.addEventListener("click", async () => {
    const link = els.inviteLink.value;
    let copied = false;
    try {
      await navigator.clipboard.writeText(link);
      copied = true;
    } catch (e) {
      els.inviteLink.select();
      copied = document.execCommand && document.execCommand("copy");
    }
    els.copyLabel.textContent = copied ? "Copied!" : "Select and copy";
    setTimeout(() => (els.copyLabel.textContent = "Copy link"), 2000);
  });

  window.addEventListener("beforeunload", destroyPeer);

  /* ---------- Start ---------- */

  storage.set("dandelion-name", myName);
  openChannel();
  loadHistory();

  if (roomId) {
    let wasHost = false;
    try {
      wasHost = sessionStorage.getItem(`dandelion-host:${roomId}`) === "1";
    } catch (e) {
      wasHost = false;
    }
    if (wasHost) plantMeadow(roomId);
    else joinMeadow(roomId);
  }
})();

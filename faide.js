// Faide: ZiggFaide's AI helper. A little zigzag spark in the corner of every page.
// Answers come from the "faide" server function (Google Gemini). Chats stay in this tab only.
(function () {
  const ZF = window.ZF;
  if (!ZF || !ZF.client || !(window.ZF_CONFIG || {}).faide) return;   // switched off, or accounts not set up
  const STORE_KEY = "zf-faide";
  const CONTACT = "ziggfaide@gmail.com";

  // ---------------- the mascot ----------------
  // A chunky orange bolt with a face. Parts are classed so CSS can animate them.
  function mascot(cls) {
    return '<svg class="faide-svg ' + (cls || "") + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<g class="f-sparks" stroke="#e4572e" stroke-width="2.4" stroke-linecap="round">' +
        '<path class="f-s1" d="M50 9l4-4"/><path class="f-s2" d="M53 15h5"/><path class="f-s3" d="M10 47l-5 2"/>' +
      "</g>" +
      '<g class="f-body">' +
        '<path d="M36 4 L12 35 H28 L22 60 L52 25 H35 L43 4 Z" fill="#e4572e" stroke="#e4572e" stroke-width="5" stroke-linejoin="round"/>' +
        '<g class="f-eyes"><g fill="#14120f"><ellipse cx="26" cy="29.5" rx="3" ry="3.7"/><ellipse cx="36" cy="29.5" rx="3" ry="3.7"/></g>' +
        '<g fill="#efe7d6"><circle cx="27" cy="28.2" r="1.05"/><circle cx="37" cy="28.2" r="1.05"/></g></g>' +
        '<path class="f-mouth" d="M28.6 34.6 q2.4 1.9 4.8 0" fill="none" stroke="#14120f" stroke-width="1.6" stroke-linecap="round"/>' +
      "</g></svg>";
  }

  // ---------------- build the widget ----------------
  const root = document.createElement("div");
  root.className = "faide";
  root.innerHTML =
    '<button type="button" class="faide-launch" aria-expanded="false" aria-controls="faide-panel" aria-label="Chat with Faide">' +
      mascot("big") + '<span class="faide-launch-label">Ask Faide</span>' +
    "</button>" +
    '<section class="faide-panel" id="faide-panel" role="dialog" aria-label="Chat with Faide" hidden>' +
      '<header class="faide-head">' +
        '<span class="faide-avatar">' + mascot("small") + "</span>" +
        '<div class="faide-title"><b>Faide</b><span>ZiggFaide\'s helper · AI</span></div>' +
        '<button type="button" class="faide-icon" data-act="reset" title="Start over" aria-label="Start a new chat">New</button>' +
        '<button type="button" class="faide-icon" data-act="close" aria-label="Close chat">Close</button>' +
      "</header>" +
      '<div class="faide-log" aria-live="polite"></div>' +
      '<form class="faide-form">' +
        '<textarea name="q" rows="1" maxlength="1000" placeholder="Ask about games, Zags or your order" aria-label="Message Faide"></textarea>' +
        '<button type="submit" class="faide-send" aria-label="Send">Send</button>' +
      "</form>" +
      '<p class="faide-note">Faide is an AI and can get things wrong. Chats are processed by Google Gemini. ' +
        'Need a person? <a href="mailto:' + CONTACT + '">' + CONTACT + "</a></p>" +
    "</section>";
  document.body.appendChild(root);

  const launch = root.querySelector(".faide-launch");
  const panel = root.querySelector(".faide-panel");
  const log = root.querySelector(".faide-log");
  const form = root.querySelector(".faide-form");
  const input = form.q;

  let messages = [];      // { role: "user" | "faide", text, games?, handoff? }
  let busy = false;
  try { messages = JSON.parse(sessionStorage.getItem(STORE_KEY)) || []; } catch (e) { messages = []; }
  function save() { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40))); } catch (e) { /* ignore */ } }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  // plain text with clickable links
  function richText(text) {
    const frag = document.createDocumentFragment();
    String(text).split(/(https?:\/\/[^\s)]+[^\s).,!?])/g).forEach(function (part, i) {
      if (i % 2) { const a = el("a", null, part.replace(/^https?:\/\//, "")); a.href = part; frag.appendChild(a); }
      else frag.appendChild(document.createTextNode(part));
    });
    return frag;
  }

  // ---------------- open / close ----------------
  function open(on) {
    panel.hidden = !on;
    root.classList.toggle("open", on);
    launch.setAttribute("aria-expanded", String(on));
    if (on) { paint(); setTimeout(function () { input.focus(); }, 30); }
  }
  launch.onclick = function () { open(panel.hidden); };
  root.querySelector('[data-act="close"]').onclick = function () { open(false); launch.focus(); };
  root.querySelector('[data-act="reset"]').onclick = function () { messages = []; save(); paint(); input.focus(); };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { open(false); launch.focus(); } });

  // ---------------- drawing the chat ----------------
  function greeting() {
    const name = ZF.user && ZF.profile && ZF.profile.display_name;
    return (name ? "Hi " + name + "! " : "Hi! ") + "I'm Faide, ZiggFaide's helper. Ask me about the games, Zags, " +
      (ZF.user ? "your account, " : "accounts, ") + "or anything about buying.";
  }
  function suggestions() {
    const s = ["What's Moonherd like?", "How do Zags work?"];
    s.push(ZF.user ? "How many Zags do I have?" : "Do I need an account to buy?");
    s.push("I need help with an order");
    return s;
  }

  function bubble(m) {
    const row = el("div", "faide-msg " + (m.role === "user" ? "from-user" : "from-faide"));
    if (m.role === "faide") row.appendChild(el("span", "faide-msg-avatar")).innerHTML = mascot("tiny");
    const b = el("div", "faide-bubble" + (m.error ? " error" : ""));
    b.appendChild(richText(m.text));
    row.appendChild(b);
    log.appendChild(row);
    (m.games || []).forEach(function (id) { gameCard(id); });
    if (m.handoff && !m.handoffSent) handoffCard(m);
  }

  function paint() {
    log.textContent = "";
    bubble({ role: "faide", text: greeting() });
    messages.forEach(bubble);
    if (!messages.length) {
      const chips = el("div", "faide-chips");
      suggestions().forEach(function (q) {
        const c = el("button", "faide-chip", q);
        c.type = "button";
        c.onclick = function () { ask(q); };
        chips.appendChild(c);
      });
      log.appendChild(chips);
    }
    log.scrollTop = log.scrollHeight;
  }

  // game card with Add to cart (games.js is loaded on demand on pages that don't have it)
  function withGames(fn) {
    if (window.GAMES) return fn(window.GAMES);
    const s = document.createElement("script");
    s.src = "games.js";
    s.onload = function () { fn(window.GAMES || []); };
    document.head.appendChild(s);
  }
  function gameCard(id) {
    const card = el("div", "faide-game");
    log.appendChild(card);
    withGames(function (games) {
      const g = games.filter(function (x) { return x.id === id; })[0];
      if (!g) return card.remove();
      if (g.cover) { const img = el("img"); img.src = g.cover; img.alt = ""; card.appendChild(img); }
      const info = el("div", "faide-game-info");
      info.appendChild(el("b", null, g.title));
      info.appendChild(el("span", null, g.tagline || ""));
      card.appendChild(info);
      const buyable = g.status === "available" && g.checkout;
      const btn = el(buyable ? "button" : "a", "faide-game-btn",
        buyable ? "Add to cart · " + g.price : g.status === "free" ? "Play free" : "In development");
      if (buyable) {
        btn.type = "button";
        btn.onclick = function () { addToCart(g.id); btn.textContent = "In your cart"; btn.disabled = true; };
        if (window.ZFCart && window.ZFCart.has(g.id)) { btn.textContent = "In your cart"; btn.disabled = true; }
      } else {
        btn.href = g.status === "free" && g.link ? g.link : "./#catalogue";
      }
      card.appendChild(btn);
      log.scrollTop = log.scrollHeight;
    });
  }
  function addToCart(id) {
    if (window.ZFCart) return window.ZFCart.add(id);
    // other pages: add it to the saved cart and go to the store
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem("zf-cart")) || []; } catch (e) { cart = []; }
    if (cart.indexOf(id) < 0) cart.push(id);
    try { localStorage.setItem("zf-cart", JSON.stringify(cart)); } catch (e) { /* ignore */ }
    location.href = "./#cart";
  }

  // "send this chat to ZiggFaide" form
  function handoffCard(m) {
    const box = el("form", "faide-handoff");
    box.appendChild(el("p", null, "Want a person to help? Send this chat to ZiggFaide and you'll get an email back."));
    const mail = el("input");
    mail.type = "email"; mail.required = true; mail.placeholder = "Your email"; mail.name = "email";
    mail.value = (ZF.user && ZF.user.email) || "";
    const note = el("input");
    note.name = "note"; note.placeholder = "Anything to add? (optional)"; note.maxLength = 500;
    const btn = el("button", "faide-game-btn", "Send to ZiggFaide");
    btn.type = "submit";
    const msg = el("p", "faide-handoff-msg");
    box.append(mail, note, btn, msg);
    box.onsubmit = async function (e) {
      e.preventDefault();
      btn.disabled = true; msg.textContent = "Sending…";
      const { data, error } = await ZF.client.functions.invoke("faide", {
        body: { action: "handoff", email: mail.value, note: note.value, messages: plain() }
      });
      if (error) {
        btn.disabled = false;
        let t = "Couldn't send it. Please email " + CONTACT + ".";
        try { t = (await error.context.json()).error || t; } catch (x) { /* keep default */ }
        msg.textContent = t;
        return;
      }
      if (data && data.sent) {
        m.handoffSent = true; save();
        box.textContent = "";
        box.appendChild(el("p", null, "Sent. ZiggFaide will reply to " + mail.value + " soon."));
      }
    };
    log.appendChild(box);
  }

  function plain() { return messages.filter(function (m) { return !m.error; }).map(function (m) { return { role: m.role, text: m.text }; }); }

  // ---------------- asking ----------------
  async function ask(q) {
    q = String(q || "").trim();
    if (!q || busy) return;
    busy = true;
    messages.push({ role: "user", text: q });
    save(); paint();
    input.value = ""; grow();
    root.classList.add("thinking");
    const dots = el("div", "faide-msg from-faide typing");
    dots.innerHTML = '<span class="faide-msg-avatar">' + mascot("tiny") + '</span><div class="faide-bubble"><i></i><i></i><i></i></div>';
    log.appendChild(dots); log.scrollTop = log.scrollHeight;
    const slow = setTimeout(function () {
      dots.appendChild(el("span", "faide-slow", "Still thinking… the AI is busy right now."));
      log.scrollTop = log.scrollHeight;
    }, 8000);

    const { data, error } = await ZF.client.functions.invoke("faide", { body: { action: "chat", messages: plain() } });
    clearTimeout(slow);
    dots.remove();
    root.classList.remove("thinking");
    busy = false;
    if (error) {
      let t = "Sorry, I couldn't answer just now. Please try again in a moment.";
      try { t = (await error.context.json()).error || t; } catch (x) { /* keep default */ }
      messages.push({ role: "faide", text: t, error: true });
    } else {
      messages.push({ role: "faide", text: data.reply, games: data.games, handoff: data.handoff });
      root.classList.add("happy");
      setTimeout(function () { root.classList.remove("happy"); }, 700);
    }
    save(); paint();
  }

  form.onsubmit = function (e) { e.preventDefault(); ask(input.value); };
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); }
  });
  function grow() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; }
  input.addEventListener("input", grow);

  // reopen if the visitor was mid-chat on the last page
  try { if (sessionStorage.getItem("zf-faide-open") === "1") open(true); } catch (e) { /* ignore */ }
  window.addEventListener("pagehide", function () {
    try { sessionStorage.setItem("zf-faide-open", panel.hidden ? "0" : "1"); } catch (e) { /* ignore */ }
  });
  ZF.onChange(function () { if (!panel.hidden && !busy) paint(); });
})();

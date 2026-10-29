// Builds the catalogue from games.js and runs the cart.
(function () {
  const list = document.getElementById("game-list");
  const games = window.GAMES || [];
  const byId = {};
  games.forEach(function (g) { byId[g.id] = g; });

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  const num = function (i) { return "No. " + String(i + 1).padStart(3, "0"); };
  const buyable = function (g) { return g && g.status === "available" && g.checkout; };
  const priceValue = function (g) { return parseFloat(String(g.price).replace(/[^0-9.]/g, "")) || 0; };

  // ---------------- cart state (kept in this browser only) ----------------
  const KEY = "zf-cart";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }
  cart = cart.filter(function (id) { return buyable(byId[id]); });

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* private mode: cart lasts this visit */ }
    render();
  }
  function add(id) { if (cart.indexOf(id) < 0) cart.push(id); save(); }
  function remove(id) { cart = cart.filter(function (x) { return x !== id; }); save(); }

  // ---------------- catalogue ----------------
  const buyBoxes = {};

  function fillBuy(box, game) {
    box.textContent = "";
    if (game.status === "free" && game.link) {
      const a = el("a", "btn", "Play " + game.title);
      a.href = game.link; a.target = "_blank"; a.rel = "noopener";
      box.appendChild(a);
      return;
    }
    if (!buyable(game)) {
      box.appendChild(el("span", "btn btn-off", game.status === "soon" ? "In development" : "Available soon"));
      return;
    }
    if (cart.indexOf(game.id) >= 0) {
      const view = el("button", "btn");
      view.type = "button";
      view.appendChild(el("span", null, "In cart, view cart"));
      view.appendChild(el("span", "btn-price", game.price));
      view.onclick = openCart;
      const rm = el("button", "btn btn-ghost", "Remove");
      rm.type = "button";
      rm.onclick = function () { remove(game.id); };
      box.appendChild(view);
      box.appendChild(rm);
    } else {
      const addBtn = el("button", "btn");
      addBtn.type = "button";
      addBtn.appendChild(el("span", null, "Add to cart"));
      addBtn.appendChild(el("span", "btn-price", game.price));
      addBtn.onclick = function () { add(game.id); openCart(); };
      box.appendChild(addBtn);
    }
  }

  function shotButton(src, alt) {
    const b = el("button", "frame"); b.type = "button";
    const i = el("img"); i.src = src; i.alt = alt; i.loading = "lazy";
    b.appendChild(i);
    b.onclick = function () { view(src, alt); };
    return b;
  }

  document.getElementById("count").textContent =
    String(games.length).padStart(2, "0") + (games.length === 1 ? " title" : " titles");

  games.forEach(function (game, idx) {
    const entry = el("article", "entry");
    entry.id = game.id;

    const head = el("div", "entry-head");
    head.appendChild(el("span", "entry-num", num(idx)));
    head.appendChild(el("span", "entry-status",
      game.status === "available" ? "Available now" : game.status === "free" ? "Free to play" : "In development"));
    entry.appendChild(head);

    const body = el("div", "entry-body");
    const media = el("div", "entry-media");
    media.appendChild(shotButton(game.cover, game.title + " title screen"));
    body.appendChild(media);

    const info = el("div", "entry-info");
    info.appendChild(el("h3", null, game.title));
    info.appendChild(el("p", "tagline", game.tagline));
    info.appendChild(el("p", "desc", game.description));
    if (game.specs && game.specs.length) {
      const dl = el("dl", "specs");
      game.specs.forEach(function (s) {
        dl.appendChild(el("dt", null, s[0]));
        dl.appendChild(el("dd", null, s[1]));
      });
      info.appendChild(dl);
    }
    const buy = el("div", "buy");
    buyBoxes[game.id] = buy;
    info.appendChild(buy);
    body.appendChild(info);
    entry.appendChild(body);

    const shots = (game.screenshots || []).map(function (s) {
      return typeof s === "string" ? { src: s, caption: "" } : s;
    });
    if (shots.length) {
      const strip = el("div", "figs");
      shots.forEach(function (s, i) {
        const fig = el("figure");
        fig.appendChild(shotButton(s.src, s.caption || game.title + " screenshot"));
        const cap = el("figcaption");
        cap.appendChild(el("span", "fig-num", "Fig. " + (i + 1)));
        if (s.caption) cap.appendChild(document.createTextNode(s.caption));
        fig.appendChild(cap);
        strip.appendChild(fig);
      });
      entry.appendChild(strip);
    }

    list.appendChild(entry);
  });

  // ---------------- cart panel ----------------
  const panel = document.getElementById("cart");
  const itemsEl = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  const footEl = document.getElementById("cart-foot");
  const countEl = document.getElementById("cart-count");
  const openBtn = document.getElementById("cart-open");
  const checkoutBtn = document.getElementById("cart-checkout");

  function openCart() { if (!panel.open) panel.showModal(); }
  function closeCart() { if (panel.open) panel.close(); }
  openBtn.onclick = openCart;
  document.getElementById("cart-close").onclick = closeCart;
  panel.addEventListener("click", function (e) { if (e.target === panel) closeCart(); });

  function render() {
    games.forEach(function (g) { if (buyBoxes[g.id]) fillBuy(buyBoxes[g.id], g); });

    countEl.textContent = cart.length;
    openBtn.classList.toggle("has-items", cart.length > 0);

    itemsEl.textContent = "";
    let total = 0;
    cart.forEach(function (id) {
      const g = byId[id];
      total += priceValue(g);
      const li = el("li", "cart-item");
      const img = el("img"); img.src = g.cover; img.alt = "";
      li.appendChild(img);
      const mid = el("div");
      mid.appendChild(el("h3", null, g.title));
      const plat = (g.specs || []).filter(function (s) { return s[0] === "Platform"; })[0];
      mid.appendChild(el("span", "meta", plat ? plat[1] : "Digital download"));
      li.appendChild(mid);
      const right = el("div", "right");
      right.appendChild(el("span", "price", g.price));
      const rm = el("button", "cart-remove", "Remove");
      rm.type = "button";
      rm.onclick = function () { remove(id); };
      right.appendChild(rm);
      li.appendChild(right);
      itemsEl.appendChild(li);
    });

    const empty = cart.length === 0;
    emptyEl.style.display = empty ? "" : "none";
    footEl.style.display = empty ? "none" : "";
    document.getElementById("cart-total").textContent = "$" + total.toFixed(2);
    document.getElementById("cart-note").textContent = cart.length > 1
      ? "Each game is paid for separately, one after another. You'll get a receipt and download link for each."
      : "";
    checkoutBtn.textContent = cart.length > 1 ? "Checkout (" + cart.length + " games)" : "Checkout";
  }

  // ---------------- checkout: one Lemon Squeezy payment per game ----------------
  let paying = null;

  function checkoutUrl(g, embed) {
    // logged-in Zigs: fill in their email and tag the order so it earns Zags
    const who = window.ZF ? window.ZF.checkoutParams() : "";
    const base = g.checkout + (g.checkout.indexOf("?") >= 0 ? "&" : "?");
    return base + (embed ? "embed=1&media=0" : "") + who;
  }

  function payNext() {
    if (!cart.length) { paying = null; return; }
    paying = cart[0];
    const g = byId[paying];
    if (window.LemonSqueezy && window.LemonSqueezy.Url) {
      closeCart();
      window.LemonSqueezy.Url.Open(checkoutUrl(g, true));
    } else {
      // checkout script didn't load: go to Lemon Squeezy's own page instead
      window.location.href = checkoutUrl(g, false);
    }
  }
  checkoutBtn.onclick = payNext;

  function setupLemon() {
    if (typeof window.createLemonSqueezy === "function") window.createLemonSqueezy();
    if (!window.LemonSqueezy || !window.LemonSqueezy.Setup) return;
    window.LemonSqueezy.Setup({
      eventHandler: function (e) {
        if (!e || !paying) return;
        if (e.event === "Checkout.Success") {
          const done = paying;
          paying = null;
          remove(done);
          // more games left: open the next payment after this one is closed
          if (cart.length) setTimeout(openCart, 400);
        }
      }
    });
  }
  window.addEventListener("load", setupLemon);

  // ---------------- screenshot viewer ----------------
  const viewer = document.getElementById("viewer");
  function view(src, alt) {
    const img = viewer.querySelector("img");
    img.src = src; img.alt = alt || "";
    viewer.showModal();
  }
  viewer.addEventListener("click", function () { viewer.close(); });

  document.getElementById("year").textContent = new Date().getFullYear();

  render();
  if (location.hash === "#cart") openCart();
})();

// Builds the catalogue from games.js.
(function () {
  const list = document.getElementById("game-list");
  const games = window.GAMES || [];

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  const num = function (i) { return "No. " + String(i + 1).padStart(3, "0"); };

  function action(game) {
    if (game.status === "free" && game.link) {
      const a = el("a", "btn", "Play " + game.title);
      a.href = game.link; a.target = "_blank"; a.rel = "noopener";
      return a;
    }
    if (game.status === "available" && game.checkout) {
      const a = el("a", "btn lemonsqueezy-button");
      a.appendChild(el("span", null, "Buy " + game.title));
      a.appendChild(el("span", "btn-price", game.price));
      // embed=1 opens the checkout on top of this page instead of a new tab
      a.href = game.checkout + (game.checkout.includes("?") ? "&" : "?") + "embed=1&media=0";
      return a;
    }
    return el("span", "btn btn-off", game.status === "soon" ? "In development" : "Available soon");
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
    buy.appendChild(action(game));
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

  const viewer = document.getElementById("viewer");
  function view(src, alt) {
    const img = viewer.querySelector("img");
    img.src = src; img.alt = alt || "";
    viewer.showModal();
  }
  viewer.addEventListener("click", function () { viewer.close(); });

  document.getElementById("year").textContent = new Date().getFullYear();
})();

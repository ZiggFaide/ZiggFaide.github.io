// Builds a section for each game in games.js.
(function () {
  const list = document.getElementById("game-list");
  document.getElementById("year").textContent = new Date().getFullYear();

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function action(game) {
    if (game.status === "free" && game.link) {
      const a = el("a", "btn", "Play free");
      a.href = game.link; a.target = "_blank"; a.rel = "noopener";
      return a;
    }
    if (game.status === "available" && game.checkout) {
      const a = el("a", "btn lemonsqueezy-button", "Buy " + game.price);
      // embed=1 opens the checkout on top of this page instead of a new tab
      a.href = game.checkout + (game.checkout.includes("?") ? "&" : "?") + "embed=1&media=0";
      return a;
    }
    const s = el("span", "btn btn-off", game.status === "soon" ? "Coming soon" : "Available soon");
    return s;
  }

  (window.GAMES || []).forEach(function (game) {
    const card = el("article", "game");
    card.id = game.id;

    const cover = el("button", "cover");
    cover.type = "button";
    const img = el("img");
    img.src = game.cover; img.alt = game.title + " screenshot";
    cover.appendChild(img);
    cover.onclick = function () { view(game.cover); };
    card.appendChild(cover);

    const info = el("div", "info");
    info.appendChild(el("h3", null, game.title));
    info.appendChild(el("p", "tagline", game.tagline));
    info.appendChild(el("p", "desc", game.description));
    if (game.features && game.features.length) {
      const ul = el("ul", "features");
      game.features.forEach(function (f) { ul.appendChild(el("li", null, f)); });
      info.appendChild(ul);
    }
    const buy = el("div", "buy");
    buy.appendChild(action(game));
    if (game.platforms) buy.appendChild(el("span", "platforms", game.platforms));
    info.appendChild(buy);
    card.appendChild(info);

    const shots = (game.screenshots || []).filter(function (s) { return s !== game.cover; });
    if (shots.length) {
      const strip = el("div", "shots");
      shots.forEach(function (s) {
        const b = el("button", "shot"); b.type = "button";
        const i = el("img"); i.src = s; i.alt = game.title + " screenshot"; i.loading = "lazy";
        b.appendChild(i); b.onclick = function () { view(s); };
        strip.appendChild(b);
      });
      card.appendChild(strip);
    }

    list.appendChild(card);
  });

  const viewer = document.getElementById("viewer");
  function view(src) {
    viewer.querySelector("img").src = src;
    viewer.showModal();
  }
  viewer.addEventListener("click", function () { viewer.close(); });
})();

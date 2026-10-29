// Turns off announcement emails from the link at the bottom of every news email.
(function () {
  const q = new URLSearchParams(location.search);
  const title = document.getElementById("u-title"), text = document.getElementById("u-text");
  function done(t, body) { title.textContent = t; text.textContent = ""; text.append(...body); }
  function link(href, label) { const a = document.createElement("a"); a.href = href; a.textContent = label; return a; }

  if (!window.ZF || !ZF.client || !q.get("u")) {
    return done("That link doesn't look right.", ["You can turn news emails off in ", link("account.html", "your account settings"), "."]);
  }
  ZF.client.functions.invoke("mail", { body: { action: "unsubscribe", u: q.get("u"), t: q.get("t") || "" } })
    .then(function (r) {
      if (r.error) return done("That link didn't work.", ["You can turn news emails off in ", link("account.html", "your account settings"), " instead."]);
      done("You won't get news emails anymore.", ["Receipts and account emails still arrive. Changed your mind? Turn news back on in ", link("account.html", "your account settings"), "."]);
    });
})();

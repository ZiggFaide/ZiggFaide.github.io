// Account page: join / log in / reset password, and the Zig dashboard.
(function () {
  const ZF = window.ZF;
  const cfg = window.ZF_CONFIG || {};
  const $ = function (id) { return document.getElementById(id); };
  const views = ["view-offline", "view-auth", "view-reset", "view-member"];
  function show(id) { views.forEach(function (v) { $(v).hidden = v !== id; }); }
  function say(id, text, bad) { const m = $(id); m.textContent = text || ""; m.classList.toggle("bad", !!bad); }
  const here = location.origin + location.pathname;

  if (!ZF || !ZF.client) { show("view-offline"); return; }
  const sb = ZF.client;

  // friendlier wording for common sign-in errors
  function nice(err) {
    const m = (err && err.message) || String(err);
    if (/invalid login/i.test(m)) return "That email and password don't match.";
    if (/email not confirmed/i.test(m)) return "Please confirm your email first. Check your inbox for the link.";
    if (/already registered/i.test(m)) return "There's already an account with that email. Try logging in.";
    if (/rate limit|too many/i.test(m)) return "Too many tries. Please wait a few minutes and try again.";
    if (/password/i.test(m) && /characters/i.test(m)) return "Password needs at least 8 characters.";
    return m;
  }
  function busy(form, on) { form.querySelectorAll("button, input").forEach(function (e) { e.disabled = on; }); }

  // ---------------- tabs ----------------
  function tab(which) {
    $("tab-join").setAttribute("aria-selected", which === "join");
    $("tab-login").setAttribute("aria-selected", which === "login");
    $("form-join").hidden = which !== "join";
    $("form-login").hidden = which !== "login";
    $("form-forgot").hidden = which !== "forgot";
    say("auth-msg", "");
  }
  $("tab-join").onclick = function () { tab("join"); };
  $("tab-login").onclick = function () { tab("login"); };
  $("to-forgot").onclick = function () { tab("forgot"); };
  $("back-login").onclick = function () { tab("login"); };
  if (location.hash === "#login") tab("login");
  if (!cfg.passwordReset) $("to-forgot").hidden = true;
  if (!cfg.googleLogin) { $("google").hidden = true; document.querySelector(".or").hidden = true; }

  // ---------------- join / log in / reset ----------------
  $("form-join").onsubmit = async function (e) {
    e.preventDefault();
    const f = e.target;
    busy(f, true); say("auth-msg", "Creating your account…");
    const { data, error } = await sb.auth.signUp({
      email: f.email.value.trim(),
      password: f.password.value,
      options: { data: { display_name: f.name.value.trim() }, emailRedirectTo: here }
    });
    busy(f, false);
    if (error) return say("auth-msg", nice(error), true);
    if (!data.session) {
      f.reset();
      say("auth-msg", "Almost there. We sent a link to " + data.user.email + ". Open it to confirm your email and collect your 500 Zags.");
    }
  };

  $("form-login").onsubmit = async function (e) {
    e.preventDefault();
    const f = e.target;
    busy(f, true); say("auth-msg", "Logging in…");
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    busy(f, false);
    if (error) return say("auth-msg", nice(error), true);
    say("auth-msg", "");
  };

  $("form-forgot").onsubmit = async function (e) {
    e.preventDefault();
    const f = e.target;
    busy(f, true);
    const { error } = await sb.auth.resetPasswordForEmail(f.email.value.trim(), { redirectTo: here });
    busy(f, false);
    if (error) return say("auth-msg", nice(error), true);
    say("auth-msg", "If that email has an account, a reset link is on its way.");
  };

  $("google").onclick = async function () {
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: here } });
    if (error) say("auth-msg", nice(error), true);
  };

  let recovering = /type=recovery/.test(location.hash);
  sb.auth.onAuthStateChange(function (event) {
    if (event === "PASSWORD_RECOVERY") { recovering = true; show("view-reset"); }
  });
  $("form-reset").onsubmit = async function (e) {
    e.preventDefault();
    const f = e.target;
    busy(f, true);
    const { error } = await sb.auth.updateUser({ password: f.password.value });
    busy(f, false);
    if (error) return say("reset-msg", nice(error), true);
    recovering = false;
    history.replaceState(null, "", here);
    ZF.refresh();
  };

  // ---------------- dashboard ----------------
  const LABELS = {
    signup: "Welcome bonus", checkin: "Daily check-in", purchase: "Game purchase",
    refund: "Purchase refunded", redeem: "Traded for a discount code", redeem_return: "Code failed, Zags returned"
  };
  function label(row) {
    if (row.reason !== "owner") return LABELS[row.reason] || row.reason;
    return (row.amount > 0 ? "Gift from ZiggFaide" : "Adjusted by ZiggFaide") + (row.note ? ": " + row.note : "");
  }
  const utcToday = function () { return new Date().toISOString().slice(0, 10); };
  const money = function (c) { return "$" + (c / 100).toFixed(c % 100 ? 2 : 0); };
  const day = function (d) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function paintProfile(p) {
    $("card-no").textContent = ZF.memberNo(p);
    const owner = p.role === "owner";
    document.querySelector(".zig-card").classList.toggle("owner", owner);
    $("card-role").hidden = !owner;
    $("card-name").textContent = p.display_name || "Unnamed Zig";
    $("card-since").textContent = new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    $("zag-balance").textContent = ZF.fmt(p.zags);
    $("zag-worth").textContent = money(Math.floor(p.zags / 1000) * 100);

    const done = p.last_checkin === utcToday();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const alive = done || p.last_checkin === yesterday;
    const s = alive ? p.streak : 0;
    $("streak-label").textContent = s ? s + "-day streak" : "No streak yet";
    const box = $("streak"); box.textContent = "";
    for (let i = 1; i <= 7; i++) {
      const c = el("span", "streak-day" + (i <= Math.min(s, 7) ? " on" : ""), String(i));
      box.appendChild(c);
    }
    const next = Math.min(25 + 5 * (alive ? s : 0), 75);
    const btn = $("checkin");
    btn.disabled = done;
    btn.textContent = done ? "Checked in today" : "Check in  +" + next + " Zags";
    $("checkin-text").textContent = done
      ? "Come back tomorrow for +" + Math.min(25 + 5 * s, 75) + " Zags. Days reset at midnight UTC."
      : "Check in once a day for Zags. Back-to-back days raise your reward, up to 75.";

    const rw = $("rewards"); rw.textContent = "";
    (cfg.rewards || []).forEach(function (r) {
      const b = el("button", "reward");
      b.type = "button";
      b.disabled = p.zags < r.zags;
      b.appendChild(el("span", "reward-label", r.label));
      b.appendChild(el("span", "reward-cost", ZF.fmt(r.zags) + " Zags"));
      b.onclick = function () { redeem(r); };
      rw.appendChild(b);
    });
  }

  async function paintLists() {
    const [led, red] = await Promise.all([
      sb.from("zag_ledger").select("amount, reason, note, created_at").order("created_at", { ascending: false }).limit(50),
      sb.from("redemptions").select("code, amount_cents, expires_at, created_at").order("created_at", { ascending: false }).limit(20)
    ]);
    const ul = $("ledger"); ul.textContent = "";
    (led.data || []).forEach(function (row) {
      const li = el("li");
      li.appendChild(el("span", "l-date", day(row.created_at)));
      li.appendChild(el("span", "l-what", label(row)));
      li.appendChild(el("span", "l-amt" + (row.amount < 0 ? " neg" : ""), (row.amount > 0 ? "+" : "") + ZF.fmt(row.amount)));
      ul.appendChild(li);
    });
    if (!ul.children.length) ul.appendChild(el("li", "empty", "Nothing yet."));
    $("activity-count").textContent = (led.data || []).length ? "Latest " + led.data.length : "";

    const codes = $("codes"); codes.textContent = "";
    (red.data || []).forEach(function (c) {
      const li = el("li");
      const expired = new Date(c.expires_at) < new Date();
      li.appendChild(el("code", null, c.code));
      li.appendChild(el("span", "c-meta", money(c.amount_cents) + " off · " + (expired ? "expired" : "until " + day(c.expires_at))));
      const copy = el("button", "linkish", "Copy");
      copy.type = "button";
      copy.onclick = function () {
        navigator.clipboard.writeText(c.code).then(function () { copy.textContent = "Copied"; });
      };
      if (!expired) li.appendChild(copy);
      codes.appendChild(li);
    });
  }

  $("checkin").onclick = async function () {
    const btn = $("checkin");
    btn.disabled = true;
    const { data, error } = await sb.rpc("daily_checkin");
    if (error) { btn.disabled = false; return say("checkin-msg", nice(error), true); }
    say("checkin-msg", data.ok ? "+" + data.award + " Zags. " + data.streak + "-day streak." : "Already checked in today.");
    await ZF.refresh();
  };

  async function redeem(r) {
    if (!confirm("Trade " + ZF.fmt(r.zags) + " Zags for a " + r.label + " code?")) return;
    say("redeem-msg", "Making your code…");
    const { data, error } = await sb.functions.invoke("redeem-zags", { body: { tier: r.tier } });
    if (error) {
      let msg = "Something went wrong. Please try again.";
      try { msg = (await error.context.json()).error || msg; } catch (e) { /* keep default */ }
      return say("redeem-msg", msg, true);
    }
    say("redeem-msg", "Your code: " + data.code + ". It's saved below too.");
    await ZF.refresh();
  }

  // ---------------- which view ----------------
  ZF.onChange(function () {
    if (!ZF.loaded) return;
    if (recovering) return show("view-reset");
    if (!ZF.user) return show("view-auth");
    show("view-member");
    if (ZF.profile) { paintProfile(ZF.profile); paintLists(); }
  });
})();

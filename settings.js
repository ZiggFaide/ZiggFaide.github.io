// Account settings: details, name, email, password, news emails, log out, delete account.
(function () {
  const ZF = window.ZF;
  const $ = function (id) { return document.getElementById(id); };
  function say(id, text, bad) { const m = $(id); m.textContent = text || ""; m.classList.toggle("bad", !!bad); }
  function busy(form, on) { form.querySelectorAll("button, input").forEach(function (e) { e.disabled = on; }); }
  function view(id) { ["s-out", "s-gone", "s-main"].forEach(function (v) { $(v).hidden = v !== id; }); }
  function nice(err) {
    const m = (err && err.message) || String(err);
    if (/rate limit|too many/i.test(m)) return "Too many tries. Please wait a few minutes and try again.";
    if (/same.*password|different from the old/i.test(m)) return "That's already your password.";
    if (/already.*registered|already been registered/i.test(m)) return "Another account already uses that email.";
    if (/check/i.test(m)) return "Names need 2 to 24 characters.";
    return m;
  }
  const day = function (d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"; };
  let deleted = false;

  if (!ZF || !ZF.client) { view("s-out"); return; }
  const sb = ZF.client;

  async function paint() {
    const u = ZF.user, p = ZF.profile;
    const { count } = await sb.from("zag_ledger").select("id", { count: "exact", head: true }).eq("reason", "purchase");
    const facts = [
      ["Card", ZF.memberNo(p)],
      ["Name", p.display_name || "Not set"],
      ["Email", u.email + (u.new_email ? " (changing to " + u.new_email + ")" : "")],
      ["Email confirmed", u.email_confirmed_at ? "Yes, " + day(u.email_confirmed_at) : "Not yet"],
      ["Member since", day(p.created_at)],
      ["Zags", ZF.fmt(p.zags)],
      ["Games bought", ZF.fmt(count || 0)],
      ["Check-in streak", (p.streak || 0) + (p.streak === 1 ? " day" : " days")],
      ["Last logged in", day(u.last_sign_in_at)],
      ["Account type", p.role === "owner" ? "Owner" : "Member"]
    ];
    const dl = $("s-facts"); dl.textContent = "";
    facts.forEach(function (f) {
      const dt = document.createElement("dt"); dt.textContent = f[0];
      const dd = document.createElement("dd"); dd.textContent = f[1];
      dl.append(dt, dd);
    });
    const name = $("f-name").name;
    if (document.activeElement !== name) name.value = p.display_name || "";
    $("f-news").checked = p.email_news !== false;
    const owner = p.role === "owner";
    $("d-owner").hidden = !owner;
    $("f-delete").hidden = owner;
  }

  $("f-name").onsubmit = async function (e) {
    e.preventDefault();
    const { error } = await sb.from("profiles").update({ display_name: e.target.name.value.trim() }).eq("id", ZF.user.id);
    if (error) return say("m-name", nice(error), true);
    say("m-name", "Saved.");
    ZF.refresh();
  };

  $("f-email").onsubmit = async function (e) {
    e.preventDefault();
    const f = e.target, to = f.email.value.trim();
    if (to.toLowerCase() === (ZF.user.email || "").toLowerCase()) return say("m-email", "That's already your email.", true);
    busy(f, true);
    const { error } = await sb.auth.updateUser({ email: to }, { emailRedirectTo: location.origin + location.pathname });
    busy(f, false);
    if (error) return say("m-email", nice(error), true);
    f.reset();
    say("m-email", "Almost done. Click the link we sent to " + ZF.user.email + " and the one sent to " + to + ".");
  };

  $("f-password").onsubmit = async function (e) {
    e.preventDefault();
    const f = e.target;
    busy(f, true);
    const { error } = await sb.auth.updateUser({ password: f.password.value });
    busy(f, false);
    if (error) return say("m-password", nice(error), true);
    f.reset();
    say("m-password", "Password changed.");
  };

  $("f-news").onchange = async function (e) {
    const on = e.target.checked;
    const { error } = await sb.from("profiles").update({ email_news: on }).eq("id", ZF.user.id);
    if (error) { e.target.checked = !on; return say("m-news", nice(error), true); }
    say("m-news", on ? "You'll get news emails." : "No more news emails. Receipts still arrive.");
  };

  $("b-logout").onclick = async function () { await sb.auth.signOut(); location.href = "account.html"; };
  $("b-logout-all").onclick = async function () {
    if (!confirm("Log out on every device and browser?")) return;
    await sb.auth.signOut({ scope: "global" });
    location.href = "account.html";
  };

  $("f-delete").onsubmit = async function (e) {
    e.preventDefault();
    const f = e.target;
    if (f.confirm.value !== "DELETE") return say("m-delete", "Type DELETE in capitals to confirm.", true);
    if (!confirm("Delete your ZiggFaide account for good? Your " + ZF.fmt(ZF.profile.zags) + " Zags will be lost.")) return;
    busy(f, true); say("m-delete", "Deleting…");
    const { error } = await sb.functions.invoke("account", {
      body: { action: "delete", password: f.password.value, confirm: f.confirm.value }
    });
    if (error) {
      busy(f, false);
      let msg = "Couldn't delete it. Please try again.";
      try { msg = (await error.context.json()).error || msg; } catch (x) { /* keep default */ }
      return say("m-delete", msg, true);
    }
    deleted = true;
    await sb.auth.signOut({ scope: "local" }).catch(function () {});
    view("s-gone");
  };

  ZF.onChange(function () {
    if (!ZF.loaded || deleted) return;
    if (!ZF.user) return view("s-out");
    view("s-main");
    if (ZF.profile) paint();
  });
})();

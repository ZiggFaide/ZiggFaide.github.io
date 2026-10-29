// Owner dashboard. The database only returns other members' data to the Owner,
// so this page shows nothing useful to anyone else even if they open it.
(function () {
  const ZF = window.ZF;
  const $ = function (id) { return document.getElementById(id); };
  let members = [], purchases = {}, current = null;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const day = function (d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"; };
  function say(id, text, bad) { const m = $(id); m.textContent = text || ""; m.classList.toggle("bad", !!bad); }

  async function load() {
    const sb = ZF.client;
    const [p, l, r] = await Promise.all([
      sb.from("profiles").select("id, member_no, email, display_name, zags, streak, last_checkin, role, created_at").order("member_no"),
      sb.from("zag_ledger").select("user_id, reason").eq("reason", "purchase"),
      sb.from("redemptions").select("id", { count: "exact", head: true })
    ]);
    if (p.error) return say("o-msg", p.error.message, true);
    members = p.data || [];
    purchases = {};
    (l.data || []).forEach(function (row) { purchases[row.user_id] = (purchases[row.user_id] || 0) + 1; });

    const weekAgo = Date.now() - 7 * 86400000;
    $("s-members").textContent = ZF.fmt(members.length);
    $("s-new").textContent = ZF.fmt(members.filter(function (m) { return new Date(m.created_at) > weekAgo; }).length);
    $("s-zags").textContent = ZF.fmt(members.reduce(function (a, m) { return a + m.zags; }, 0));
    $("s-orders").textContent = ZF.fmt((l.data || []).length);
    $("s-codes").textContent = ZF.fmt(r.count || 0);
    paint();
  }

  function paint() {
    const q = $("o-search").value.trim().toLowerCase();
    const body = $("o-rows"); body.textContent = "";
    members.filter(function (m) {
      return !q || (m.display_name || "").toLowerCase().indexOf(q) >= 0 || (m.email || "").indexOf(q) >= 0;
    }).forEach(function (m) {
      const tr = el("tr");
      tr.appendChild(el("td", "mono", String(m.member_no).padStart(4, "0")));
      const name = el("td");
      name.appendChild(document.createTextNode(m.display_name || "Unnamed"));
      if (m.role === "owner") name.appendChild(el("span", "role-tag", "Owner"));
      tr.appendChild(name);
      tr.appendChild(el("td", "muted", m.email));
      tr.appendChild(el("td", "num mono", ZF.fmt(m.zags)));
      tr.appendChild(el("td", "num mono", String(m.streak || 0)));
      tr.appendChild(el("td", "num mono", String(purchases[m.id] || 0)));
      tr.appendChild(el("td", "muted", day(m.created_at)));
      const td = el("td", "num");
      const b = el("button", "linkish", "Manage");
      b.type = "button";
      b.onclick = function () { openMember(m); };
      td.appendChild(b);
      tr.appendChild(td);
      body.appendChild(tr);
    });
    if (!body.children.length) {
      const tr = el("tr"); const td = el("td", "muted", q ? "No matches." : "No Zigs yet.");
      td.colSpan = 8; tr.appendChild(td); body.appendChild(tr);
    }
  }
  $("o-search").oninput = paint;

  // ---------------- one member ----------------
  const dlg = $("o-member");
  $("m-close").onclick = function () { dlg.close(); };

  async function openMember(m) {
    current = m;
    $("m-title").textContent = (m.display_name || "Unnamed") + " · " + ZF.memberNo(m);
    const facts = $("m-facts"); facts.textContent = "";
    [["Email", m.email], ["Zags", ZF.fmt(m.zags)], ["Streak", (m.streak || 0) + " days"],
     ["Last check-in", day(m.last_checkin)], ["Joined", day(m.created_at)], ["Role", m.role === "owner" ? "Owner" : "Member"]]
      .forEach(function (f) { facts.appendChild(el("dt", null, f[0])); facts.appendChild(el("dd", null, f[1])); });
    $("m-adjust").reset();
    say("m-adjust-msg", ""); say("m-reset-msg", "");
    $("m-reset").hidden = m.role === "owner";
    dlg.showModal();
    paintLedger();
  }

  async function paintLedger() {
    const { data } = await ZF.client.from("zag_ledger").select("amount, reason, note, created_at")
      .eq("user_id", current.id).order("created_at", { ascending: false }).limit(25);
    const ul = $("m-ledger"); ul.textContent = "";
    (data || []).forEach(function (row) {
      const li = el("li");
      li.appendChild(el("span", "l-date", day(row.created_at)));
      li.appendChild(el("span", "l-what", row.reason + (row.note ? ": " + row.note : "")));
      li.appendChild(el("span", "l-amt" + (row.amount < 0 ? " neg" : ""), (row.amount > 0 ? "+" : "") + ZF.fmt(row.amount)));
      ul.appendChild(li);
    });
    if (!ul.children.length) ul.appendChild(el("li", "empty", "Nothing yet."));
  }

  $("m-adjust").onsubmit = async function (e) {
    e.preventDefault();
    const f = e.target;
    const amount = parseInt(f.amount.value, 10);
    const verb = amount > 0 ? "Give " + ZF.fmt(amount) + " Zags to " : "Take " + ZF.fmt(-amount) + " Zags from ";
    if (!confirm(verb + (current.display_name || "this Zig") + "?")) return;
    const { data, error } = await ZF.client.rpc("owner_adjust_zags", { p_user: current.id, p_amount: amount, p_note: f.note.value });
    if (error) return say("m-adjust-msg", error.message, true);
    current.zags = data.zags;
    say("m-adjust-msg", "Done. New balance: " + ZF.fmt(data.zags) + " Zags.");
    f.reset();
    paintLedger(); load();
    if (current.id === ZF.user.id) ZF.refresh();
  };

  $("m-reset").onclick = async function () {
    if (!confirm("Set a new temporary password for " + (current.display_name || "this Zig") + "? Their old password stops working.")) return;
    const { data, error } = await ZF.client.functions.invoke("admin-tools", { body: { action: "reset_password", user_id: current.id } });
    if (error) {
      let msg = "Couldn't reset it.";
      try { msg = (await error.context.json()).error || msg; } catch (x) { /* keep default */ }
      return say("m-reset-msg", msg, true);
    }
    say("m-reset-msg", "Temporary password: " + data.password);
  };

  // ---------------- who can see this ----------------
  let started = false;
  ZF.onChange(function () {
    if (!ZF.loaded) return;
    const ok = ZF.isOwner();
    $("o-denied").hidden = ok;
    $("o-main").hidden = !ok;
    if (ok && !started) { started = true; load(); }
  });
})();

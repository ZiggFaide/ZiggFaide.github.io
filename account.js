// Shared on every page: connects to the account service, keeps the header's
// "Log in" / Zig name up to date, and tells checkout who is buying.
(function () {
  const cfg = window.ZF_CONFIG || {};
  const ready = cfg.supabaseUrl && cfg.supabaseUrl.indexOf("http") === 0 && window.supabase;
  const ZF = window.ZF = {
    client: null,
    user: null,
    profile: null,
    loaded: false,
    listeners: [],
    onChange: function (fn) { this.listeners.push(fn); fn(this); },
    isOwner: function () { return !!(this.profile && this.profile.role === "owner"); },
    fmt: function (n) { return Number(n || 0).toLocaleString("en-US"); },
    memberNo: function (p) { return "Zig No. " + String(p && p.member_no || 0).padStart(4, "0"); },
    // extra checkout fields so a purchase earns Zags for the right account
    checkoutParams: function () {
      if (!this.user) return "";
      return "&checkout[email]=" + encodeURIComponent(this.user.email || "") +
             "&checkout[custom][user_id]=" + encodeURIComponent(this.user.id);
    },
    refresh: refresh
  };
  if (!ready) { paintNav(); return; }

  ZF.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);

  async function refresh() {
    const { data } = await ZF.client.auth.getSession();
    ZF.user = data.session ? data.session.user : null;
    ZF.profile = null;
    if (ZF.user) {
      const r = await ZF.client.from("profiles").select("*").eq("id", ZF.user.id).maybeSingle();
      ZF.profile = r.data || null;
    }
    ZF.loaded = true;
    paintNav();
    askWelcome();
    ZF.listeners.forEach(function (fn) { fn(ZF); });
  }

  // The server sends the welcome email only once per Zig, so this is safe to repeat.
  function askWelcome() {
    const u = ZF.user;
    if (!u || !u.email_confirmed_at || !ZF.profile) return;
    const key = "zf-welcome-" + u.id;
    try { if (localStorage.getItem(key)) return; } catch (e) { /* storage off: server still guards it */ }
    ZF.client.functions.invoke("mail", { body: { action: "welcome" } }).then(function (r) {
      if (!r.error) { try { localStorage.setItem(key, "1"); } catch (e) { /* ignore */ } }
    });
  }

  function paintNav() {
    const link = document.getElementById("nav-account");
    if (!link) return;
    link.textContent = "";
    if (ZF.user) {
      const name = (ZF.profile && ZF.profile.display_name) || "Your account";
      const n = document.createElement("span");
      n.className = "nav-name";
      n.textContent = name;
      link.appendChild(n);
      const z = document.createElement("span");
      z.className = "nav-zags";
      z.textContent = ZF.fmt(ZF.profile && ZF.profile.zags) + " Zags";
      link.appendChild(z);
      link.classList.add("signed-in");
      if (!document.getElementById("nav-settings")) {
        const st = document.createElement("a");
        st.id = "nav-settings"; st.href = "settings.html"; st.textContent = "Settings";
        link.parentNode.insertBefore(st, link);
      }
      if (ZF.isOwner() && !document.getElementById("nav-owner")) {
        const o = document.createElement("a");
        o.id = "nav-owner"; o.className = "nav-owner"; o.href = "owner.html"; o.textContent = "Owner";
        link.parentNode.insertBefore(o, link);
      }
    } else {
      link.textContent = "Log in";
      link.classList.remove("signed-in");
      ["nav-owner", "nav-settings"].forEach(function (id) { const o = document.getElementById(id); if (o) o.remove(); });
    }
  }

  ZF.client.auth.onAuthStateChange(function (event) {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setTimeout(refresh, 0);
  });
  refresh();
})();

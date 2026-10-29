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
    ZF.listeners.forEach(function (fn) { fn(ZF); });
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
    } else {
      link.textContent = "Log in";
      link.classList.remove("signed-in");
    }
  }

  ZF.client.auth.onAuthStateChange(function (event) {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") setTimeout(refresh, 0);
  });
  refresh();
})();

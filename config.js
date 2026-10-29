// Public connection details for the ZiggFaide account service (Supabase).
// These two values are safe to publish: the database rules decide what anyone can do.
window.ZF_CONFIG = {
  supabaseUrl: "SUPABASE_URL",
  supabaseKey: "SUPABASE_ANON_KEY",
  // 1,000 Zags = $1 off
  rewards: [
    { tier: 1, zags: 1000, label: "$1 off" },
    { tier: 2, zags: 2000, label: "$2 off" },
    { tier: 3, zags: 3000, label: "$3 off" }
  ]
};

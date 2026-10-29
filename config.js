// Public connection details for the ZiggFaide account service (Supabase).
// These two values are safe to publish: the database rules decide what anyone can do.
window.ZF_CONFIG = {
  supabaseUrl: "https://vaibkdrwrdaetoallxxf.supabase.co",
  supabaseKey: "sb_publishable_wrZE6YkGIzvcY43FKCx80g_PZVKDTNX",
  // turn on once Google sign-in is set up in Supabase
  googleLogin: false,
  // account emails are sent from ziggfaide@gmail.com (set in Supabase)
  passwordReset: true,
  // Faide, the AI chat helper (needs the Gemini key on the server)
  faide: false,
  // 1,000 Zags = $1 off
  rewards: [
    { tier: 1, zags: 1000, label: "$1 off" },
    { tier: 2, zags: 2000, label: "$2 off" },
    { tier: 3, zags: 3000, label: "$3 off" }
  ]
};

// Every game on the site comes from this list.
// To add a game: copy one { ... } block, change the details, and put its
// screenshots in games/<id>/.
//
// status:   "available" shows a Buy button, "soon" shows "Coming soon",
//           "free" shows a Play button that opens `link`.
// checkout: the Lemon Squeezy checkout link for the game
//           (Lemon Squeezy > Products > Share). Leave "" until it exists.

window.GAMES = [
  {
    id: "moonherd",
    title: "Moonherd",
    tagline: "Gather stars. Risk them. Name the sky.",
    description:
      "You are the moon. Drift through the night and pull stars into orbit, " +
      "then cast them into the sky. The more you cast at once, the more points you score, " +
      "but voids roam the dark and eat whatever you are carrying. Every cast becomes a " +
      "named constellation that stays in your sky, night after night.",
    features: [
      "Short two-minute nights",
      "Every constellation gets its own name and is kept forever",
      "Mouse or keyboard",
      "Windows and Linux"
    ],
    platforms: "Windows · Linux",
    price: "$4.99",
    status: "available",
    checkout: "https://ziggfaide-games.lemonsqueezy.com/checkout/buy/e20fea38-276d-4d46-82be-d5707ce8ea5b",
    cover: "games/moonherd/title.png",
    screenshots: [
      "games/moonherd/title.png",
      "games/moonherd/play.png",
      "games/moonherd/reveal.png"
    ]
  }
];

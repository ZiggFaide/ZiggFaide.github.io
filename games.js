// Every game on the site comes from this list.
// To add a game: copy one { ... } block, change the details, and put its
// screenshots in games/<id>/. Games are numbered in the order listed.
//
// status:   "available" shows a Buy button, "soon" shows "In development",
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
    specs: [
      ["Platform", "Windows · Linux"],
      ["Price", "$4.99, one-time"],
      ["Session", "Two-minute nights"],
      ["Controls", "Mouse or keyboard"],
      ["Released", "2026"]
    ],
    price: "$4.99",
    status: "available",
    checkout: "https://ziggfaide-games.lemonsqueezy.com/checkout/buy/e20fea38-276d-4d46-82be-d5707ce8ea5b",
    cover: "games/moonherd/title.png",
    screenshots: [
      { src: "games/moonherd/play.png", caption: "Sixteen stars in orbit, two voids closing in" },
      { src: "games/moonherd/reveal.png", caption: "A cast becomes a named constellation" }
    ]
  }
];

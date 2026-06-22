/* ============================================================
   SANDMAN LIVE — the feed data
   Every post in the travelling feed lives here. Newest or oldest
   order doesn't matter — the site sorts by date automatically.

   To ADD a post, copy one block and fill it in:

   {
     id:        "2026-06-15-madrid",          // unique; becomes the share link #tag
     date:      "2026-06-15",                  // YYYY-MM-DD
     type:      "photo",                        // "photo" | "video" | "text"
     title:     "A night in Madrid",
     caption:   "A few words about the moment…",
     location:  "Madrid, Spain",               // optional
     categories:["World Cup", "Friends"],       // any of: World Cup, Betting,
                                                //   Backgammon, Boxing, Art,
                                                //   Philosophy, Friends, Travel
     media:     "assets/images/live/madrid.jpg" // PHOTO: path to the image
     // video:  "assets/images/live/clip.mp4"   // VIDEO (uploaded file), OR…
     // embed:  "https://www.youtube.com/embed/VIDEO_ID"  // VIDEO (YouTube/Vimeo)
   },

   Drop photos/videos into  assets/images/live/  and point to them above.
   ============================================================ */
window.SANDMAN_LIVE = [

  {
    id: "2026-06-11-arrival",
    date: "2026-06-11",
    type: "video",
    title: "Touchdown — the World Cup begins",
    caption: "Wheels down, heart up. The tournament everyone's been waiting for starts now — and the Sandman Live Universe goes with it. First clip from the road.",
    location: "On the move",
    categories: ["World Cup", "Travel"]
    // embed: "https://www.youtube.com/embed/XXXXXXXXXXX"   ← drop a real clip here
  },

  {
    id: "2026-06-10-board-stars",
    date: "2026-06-10",
    type: "photo",
    title: "Backgammon under the stars",
    caption: "Late game, good company, the dice running warm. Some of the best nights have no scoreboard.",
    location: "Budva, Montenegro",
    categories: ["Backgammon", "Friends"]
    // media: "assets/images/live/board-stars.jpg"   ← drop a real photo here
  },

  {
    id: "2026-06-09-before-the-storm",
    date: "2026-06-09",
    type: "text",
    title: "A thought before the tournament",
    caption: "Edge isn't loud. It's the calm decision made a hundred times while everyone else is chasing the noise. Keep your nerve. Respect the variance. Play the long game.",
    location: "",
    categories: ["Philosophy", "Betting"]
  },

  {
    id: "2026-06-08-golden-hour",
    date: "2026-06-08",
    type: "photo",
    title: "Budva, golden hour",
    caption: "The Adriatic doing its thing. Travel is half the work and most of the beauty.",
    location: "Budva, Montenegro",
    categories: ["Travel", "Art"]
    // media: "assets/images/live/budva-golden.jpg"
  }

];

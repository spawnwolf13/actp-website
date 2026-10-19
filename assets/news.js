/* Sample stories for the Media Center and article pages. Built only from facts in the content document;
   ACTP to replace with real news, dates and photographs. */
window.ACTP_NEWS = [
  { id: "rooms-added", type: "News", date: "2025-09-14", title: "325+ rooms added across the ACTP portfolio since 2023",
    lead: "ACTP's 2023 to 2025 transformation programme has added more than 325 rooms across its hospitality portfolio, from Cairo to the Red Sea.",
    img: "assets/img/r-room.jpg", gallery: ["assets/img3/hotel-room.jpg", "assets/img3/suite.jpg", "assets/img/family-room.jpg"] },
  { id: "lobby-reopens", type: "Updates", date: "2025-07-02", title: "121 rooms renovated and a renovated lobby reopens to guests",
    lead: "Renovation work has completed on 121 rooms, and the property's renovated lobby has reopened, as part of ACTP's continuous enhancement initiatives.",
    img: "assets/img/sheraton-night.jpg", gallery: ["assets/img3/sheraton-dusk.jpg", "assets/img/r-b4.jpg", "assets/img3/nile-restaurant.jpg"] },
  { id: "meeting-rooms", type: "Events", date: "2025-11-20", title: "Nine new meeting rooms open for business events",
    lead: "Nine new meeting rooms are now open, expanding the space ACTP's properties can offer for conferences, business events and celebrations.",
    img: "assets/img/r-b3.jpg", gallery: ["assets/img3/ballroom.jpg", "assets/img3/meeting-room.jpg", "assets/img/r-meeting.jpg"] },
  { id: "forecast", type: "News", date: "2025-06-10", title: "ACTP forecasts USD 28 million net profit for FY25",
    lead: "ACTP expects a net profit of USD 28 million for the 2025 financial year, reflecting the results of its operational transformation.",
    img: "assets/img3/finance-hand.jpg", gallery: ["assets/img3/meeting-wide.jpg", "assets/img3/manager.jpg", "assets/img3/team.jpg"] },
  { id: "dahab", type: "Updates", date: "2025-04-18", title: "Swiss Inn Dahab: a premier Red Sea beachfront resort",
    lead: "Wholly owned by ACTP, Swiss Inn Dahab offers 150 keys, water sports and a relaxed setting surrounded by natural coastal beauty.",
    img: "assets/img/Dahab.webp", gallery: ["assets/img/beach-morning.jpg", "assets/img/aquapool.jpg", "assets/img3/resort-aerial.jpg"] },
  { id: "hurghada-center", type: "Events", date: "2025-12-05", title: "Hurghada City Center hosts its winter season programme",
    lead: "Within Hurghada's tourism district, Hurghada City Center supports ACTP's presence through commercial experiences and events for residents and visitors.",
    img: "assets/img3/hcc-front.jpg", gallery: ["assets/img3/hcc-mall.jpg", "assets/img/r-b1.jpg", "assets/img/r-b6.jpg"] },
];
window.ACTP_NEWS.fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/* Portfolio content: what each property page and the portfolio lists need beyond ACTP3.P.
   Texts are from the Figma file; photos are the Figma placeholders until ACTP sends its own. */
window.ACTP_PORT = (() => {
  const LOGO = { sheraton: "assets/logos/sheraton.svg", sofitel: "assets/logos/sofitel.svg", renaissance: "assets/logos/renaissance.svg", jw: "assets/logos/jw.svg",
    hurghada: "assets/logos/swissinn-hurghada.svg", dahab: "assets/logos/swissinn-dahab.svg", swissintl: "assets/logos/swissinn-intl.svg", hcc: "assets/logos/hcc.svg" };
  const X = {
    sheraton: { order: 1, hero: "assets/img4/sheraton-suite.jpg", place: "Giza bank of the Nile, Cairo", brand: "Marriott International",
      text: "One of Cairo's most iconic hospitality destinations, Sheraton Cairo Hotel & Casino features 651 keys alongside contemporary luxury experiences and premium facilities overlooking the Nile.",
      gallery: ["assets/img4/sheraton-suite.jpg", "assets/img3/sheraton-dusk.jpg", "assets/img/sheraton-night.jpg", "assets/img/r-room.jpg", "assets/img3/nile-restaurant.jpg"] },
    hurghada: { order: 2, hero: "assets/img4/hurghada-resort.jpg", place: "Red Sea coast, Hurghada", brand: "Swiss Inn Hotels & Resorts",
      text: "Swiss Inn Hurghada stands as a luxury spa and wellness destination, offering elevated resort experiences, recreational facilities, and Red Sea resort experiences.",
      gallery: ["assets/img4/hurghada-resort.jpg", "assets/img/main-pool.jpg", "assets/img/aquapool.jpg", "assets/img/beach-morning.jpg", "assets/img/family-room.jpg"] },
    dahab: { order: 3, hero: "assets/img4/dahab-room.jpg", place: "Gulf of Aqaba, Dahab, South Sinai", brand: "Swiss Inn Hotels & Resorts",
      text: "A premier Red Sea beachfront resort, Swiss Inn Dahab offers modern hospitality experiences, water sports facilities, and a relaxed destination surrounded by natural coastal beauty.",
      gallery: ["assets/img/Dahab.webp", "assets/img4/dahab-room.jpg", "assets/img4/sunset.jpg"] },
    hcc: { order: 4, hero: "assets/img4/hcc-atrium.jpg", place: "Tourism district, Hurghada", brand: "ACTP",
      text: "Positioned within Hurghada's tourism district, Hurghada Center supports ACTP's hospitality presence through commercial experiences and strategic location value.",
      gallery: ["assets/img3/hcc-front.jpg", "assets/img4/hcc-atrium.jpg", "assets/img3/hcc-mall.jpg"] },
    renaissance: { order: 1, hero: "assets/img4/renaissance-ballroom.jpg", place: "Mirage City, New Cairo", brand: "Marriott International",
      text: "Located in New Cairo, Renaissance Cairo Mirage City strengthens ACTP's hospitality presence through premium business and leisure experiences within one of Cairo's leading destinations.",
      gallery: ["assets/img/caibr-pool-0026-hor-wide.webp", "assets/img4/renaissance-ballroom.jpg", "assets/img4/renaissance-front.jpg", "assets/img3/meeting-wide.jpg"] },
    sofitel: { order: 2, hero: "assets/img4/sofitel-terrace.jpg", place: "Downtown, on the Nile, Cairo", brand: "Accor",
      text: "Positioned along the Nile, Sofitel Cairo Downtown Nile enhances ACTP's luxury hospitality exposure through refined experiences and premium city hospitality.",
      gallery: ["assets/img3/sofitel.jpg", "assets/img4/sofitel-terrace.jpg", "assets/img3/suite.jpg"] },
    jw: { order: 3, hero: "assets/img4/jw-pool.jpg", place: "New Cairo", brand: "Marriott International",
      text: "Located in New Cairo, JW Marriott Cairo reflects ACTP's presence within luxury hospitality destinations, offering elevated guest experiences and premium resort amenities.",
      gallery: ["assets/img4/jw-pool.jpg", "assets/img3/jw.jpg", "assets/img3/ballroom.jpg"] },
    swissintl: { order: 4, hero: "assets/img4/swissinn-resort.jpg", place: "Regional hotel management", brand: "Swiss Inn Hotels & Resorts",
      text: "Swiss Inn International strengthens ACTP's hospitality network through regional hotel management expertise and diversified operational presence.",
      gallery: ["assets/img4/swissinn-resort.jpg", "assets/img/r-b2.jpg", "assets/img/r-meeting.jpg"] },
  };
  // the list for one kind ("Owned" or "Partnership"), in the order the Figma file shows them
  const list = (kind) => window.ACTP3.P.filter((p) => p.kind === kind).map((p) => Object.assign({}, p, X[p.id], { logo: LOGO[p.id] || null })).sort((a, b) => a.order - b.order);
  const get = (id) => { const p = window.ACTP3.byId(id); return p && Object.assign({}, p, X[p.id], { logo: LOGO[p.id] || null }); };
  // the brand mark, or the name set in type when there is no logo yet (Hurghada City Center)
  const mark = (p, cls = "") => p.logo ? `<img class="${cls}" src="${p.logo}" alt="${p.name}">` : `<span class="word ${cls}">Hurghada<br>City Center</span>`;
  return { X, LOGO, list, get, mark };
})();

/*
  STEFANOVE TOP LISTE
  -------------------
  Tematske liste sa naslovne strane. Redosled mesta u listi je i rang (prvo mesto = #1).

  Polja liste:
    id      kratko ime bez razmaka (koristi se u linku, npr. .../#lista-kafa)
    title   naslov liste
    icon    ilustracija
    intro   jedna ili dve rečenice o listi
    places  mesta redom, svako sa:
              id    id mesta iz data.js
              note  (opciono) kratka rečenica uz mesto

  Promeni redosled, izbaci ili dodaj mesta.
*/

const LISTS = [
  {
    id: "prvi-dan",
    title: "Prvi dan u Beogradu",
    icon: "🏰",
    intro: "Ako imaš samo jedan dan: tvrđava, kafa na Dorćolu, ručak u kafani, hram, reka i koktel za kraj.",
    places: [
      { id: "kalemegdan" },
      { id: "gradska-przionica" },
      { id: "zavicaj-skadarlija" },
      { id: "hram-svetog-save" },
      { id: "muzej-nikole-tesle" },
      { id: "krstarenje-rekom" },
      { id: "the-view-rooftop" },
      { id: "lenja-buba" },
    ],
  },
  {
    id: "kafa",
    title: "Najbolja kafa",
    icon: "☕",
    intro: "Specialty pržionice i mali kafići u koje se vraćam.",
    places: [
      { id: "gradska-przionica" },
      { id: "ugao-specialty-coffee" },
      { id: "dusha-specialty-coffee" },
      { id: "tokar-kafeterija" },
      { id: "cetiri-coffee-bar" },
      { id: "kafe-kafe-bistro" },
      { id: "between-espresso-wine-bar" },
      { id: "rocket-coffee" },
      { id: "espresso-bar" },
      { id: "peak-place" },
    ],
  },
  {
    id: "dorucak",
    title: "Doručak i brunch",
    icon: "🍳",
    intro: "Za lagana jutra i duge vikend doručke.",
    places: [
      { id: "brekky" },
      { id: "basic-coffee-breakfast" },
      { id: "smokvica-jovanova" },
      { id: "ustipak-bar-vracar" },
      { id: "im-camy-lunch-bar" },
      { id: "avocado-belvil" },
      { id: "sloj-bistro-bakery-waterfront" },
      { id: "june-cafe" },
    ],
  },
  {
    id: "slatko",
    title: "Nešto slatko",
    icon: "🍰",
    intro: "Kolači, sladoled i bubble tea kad zatreba šećer.",
    places: [
      { id: "meduza" },
      { id: "fenisa" },
      { id: "alisa" },
      { id: "poslasticarnica-kostana" },
      { id: "adam-stroopwafel" },
      { id: "gelato-bar" },
      { id: "beishanlan-bubble-tea" },
      { id: "bunny-cafe-belgrade" },
    ],
  },
  {
    id: "pica-burger",
    title: "Pica i burgeri",
    icon: "🍕",
    intro: "Kad treba nešto sigurno i ukusno.",
    places: [
      { id: "perlo-burgeri" },
      { id: "di-napoli-pizzeria-restaurant" },
      { id: "botako-restoran-dorcol-picerija-dostava" },
      { id: "billys-pizza-tavern-dorcol" },
      { id: "pizzeria-trg" },
      { id: "giovanni-s-pizzeria" },
      { id: "che-gusto-beograd" },
      { id: "smash-burgers" },
      { id: "diner-bros-novi-beograd" },
      { id: "taurunum-pogled-pizza-bar" },
    ],
  },
  {
    id: "kafane",
    title: "Kafane i domaća kuhinja",
    icon: "🍲",
    intro: "Jagnjetina, roštilj i dobra atmosfera.",
    places: [
      { id: "kafana-5-glava" },
      { id: "zavicaj-skadarlija" },
      { id: "velika-skadarlija-restaurant" },
      { id: "ciribu-ciriba" },
      { id: "iva-new-balkan-cuisine" },
      { id: "beograd-na-vatri" },
      { id: "trandafilovic" },
      { id: "restoran-radnicki" },
      { id: "bure-piva" },
    ],
  },
  {
    id: "kokteli",
    title: "Kokteli",
    icon: "🍸",
    intro: "Barovi u koje vodim ljude kad hoćemo dobar koktel.",
    places: [
      { id: "lenja-buba" },
      { id: "noble-roots-cocktail-bar" },
      { id: "buratina-bar" },
      { id: "cin-cin" },
      { id: "eje-belgrade" },
      { id: "bistro-tri" },
      { id: "passengers-bar" },
      { id: "restaurant-idol" },
      { id: "leposava-bar" },
      { id: "mali-prag" },
    ],
  },
  {
    id: "pivo",
    title: "Pivo i pabovi",
    icon: "🍺",
    intro: "Craft pivo, Ginis i bašte za duga leta.",
    places: [
      { id: "dogma-brewery-tap-room" },
      { id: "helga-s-pub-mesi-mesi" },
      { id: "badger-mug" },
      { id: "monk-s-bar" },
      { id: "liga-pub-obilicev-venac" },
      { id: "bure-piva" },
      { id: "pivokratija-2" },
      { id: "polapola-bar" },
    ],
  },
  {
    id: "pogled",
    title: "Pogled i reka",
    icon: "🌅",
    intro: "Mesta za zalazak sunca, reke i pogled na grad.",
    places: [
      { id: "the-view-rooftop" },
      { id: "restoran-mokum" },
      { id: "predji-preko" },
      { id: "taurunum-pogled-pizza-bar" },
      { id: "sava-45-event-center" },
      { id: "reka" },
      { id: "lefer-splav" },
      { id: "kalemegdan" },
      { id: "gardos-kula" },
      { id: "krstarenje-rekom" },
    ],
  },
  {
    id: "skriveno",
    title: "Skrivena i neobična mesta",
    icon: "🗝️",
    intro: "Mesta koja ne nađeš slučajno.",
    places: [
      { id: "barrel-house" },
      { id: "kissa10" },
      { id: "cafe-934" },
      { id: "pinecone-bar-theater" },
      { id: "muzej-paranormalnog" },
      { id: "vukov-bozicni-kutak" },
      { id: "buratina-bar" },
      { id: "passengers-bar" },
    ],
  },
  {
    id: "aktivnosti",
    title: "Kišni dan i aktivnosti",
    icon: "🎭",
    intro: "Kad napolju pada kiša ili ti treba nešto drugačije od kafane.",
    places: [
      { id: "mmr-escape-rooms-lokacija-2" },
      { id: "3d-board-game-pub" },
      { id: "narodno-pozoriste" },
      { id: "atelje-212" },
      { id: "muzej-nikole-tesle" },
      { id: "museum-of-contemporary-art" },
      { id: "jugoslovenska-kinoteka" },
      { id: "turbomax-karting-centar" },
      { id: "klub-za-drustvene-igre-groot" },
    ],
  },
];

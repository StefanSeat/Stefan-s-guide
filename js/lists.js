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
              note  (opciono) zašto je mesto na listi; ako je prazno, prikazuje se kratak opis iz data.js

  Nacrt je složen iz tvojih recenzija i predloga. Promeni redosled, izbaci ili dodaj mesta i dopiši svoje rečenice.
*/

const LISTS = [
  {
    id: "prvi-dan",
    title: "Prvi dan u Beogradu",
    icon: "🏰",
    intro: "Ako imaš samo jedan dan: tvrđava, kafa na Dorćolu, ručak u kafani, hram, reka i koktel za kraj.",
    places: [
      { id: "kalemegdan", note: "Počni od tvrđave i pogleda na ušće Save u Dunav." },
      { id: "gradska-przionica", note: "Kafa na Dorćolu, moderna pržionica koja kafu shvata ozbiljno." },
      { id: "zavicaj-skadarlija", note: "Ručak u Skadarliji: uvek dobra atmosfera i tradicija." },
      { id: "hram-svetog-save", note: "Posle ručka do Vračara, obavezno siđi u kriptu." },
      { id: "muzej-nikole-tesle", note: "Kratka vođena tura sa demonstracijom Teslinog kalema." },
      { id: "krstarenje-rekom", note: "Pred zalazak sunca sat vremena na reci." },
      { id: "the-view-rooftop", note: "Piće sa jednim od najlepših pogleda na grad i Hram." },
      { id: "lenja-buba", note: "Za kraj večeri najbolji kokteli u gradu." },
    ],
  },
  {
    id: "kafa",
    title: "Najbolja kafa",
    icon: "☕",
    intro: "Specialty pržionice i mali kafići u koje se vraćam.",
    places: [
      { id: "gradska-przionica", note: "Moderna i čista pržionica, deluje da su ozbiljni po pitanju kafe." },
      { id: "ugao-specialty-coffee", note: "Prijatno osoblje i može da se radi sa laptopom." },
      { id: "dusha-specialty-coffee", note: "Kul mesto za kafu u kom može i da se radi." },
      { id: "tokar-kafeterija" },
      { id: "cetiri-coffee-bar" },
      { id: "kafe-kafe-bistro", note: "Super kafa i korektne cene u Zemunu." },
      { id: "between-espresso-wine-bar", note: "Novo mesto sa zanimljivim izborom kafe." },
      { id: "rocket-coffee" },
      { id: "espresso-bar", note: "Mali prostor, idealno za brzu kafu i razgovor." },
      { id: "peak-place" },
    ],
  },
  {
    id: "dorucak",
    title: "Doručak i brunch",
    icon: "🍳",
    intro: "Za lagana jutra i duge vikend doručke.",
    places: [
      { id: "brekky", note: "Sve je bilo dobro, dobiješ tačno ono što vidiš na slikama." },
      { id: "basic-coffee-breakfast", note: "Dobra hrana, mnogo ljudi radi ovde na laptopu." },
      { id: "smokvica-jovanova", note: "Smokvica sa najlepšom baštom." },
      { id: "ustipak-bar-vracar", note: "Uštipci na Kalenić pijaci. Samo keš!" },
      { id: "im-camy-lunch-bar", note: "Dobar doručak u Zemunu." },
      { id: "avocado-belvil", note: "Ukusno i zdravo za brz obrok." },
      { id: "sloj-bistro-bakery-waterfront" },
      { id: "june-cafe", note: "Lep prostor sa svežim cvećem." },
    ],
  },
  {
    id: "slatko",
    title: "Nešto slatko",
    icon: "🍰",
    intro: "Kolači, sladoled i bubble tea kad zatreba šećer.",
    places: [
      { id: "meduza", note: "Bašta u hladu i predobar carrot cake." },
      { id: "fenisa", note: "Prelep prostor i odlični kolači po korektnim cenama." },
      { id: "alisa", note: "Dobri deserti na Vračaru." },
      { id: "poslasticarnica-kostana", note: "Povoljno i nije presladko." },
      { id: "adam-stroopwafel", note: "Sveži i ukusni stroopwafel u prijatnom prostoru." },
      { id: "gelato-bar", note: "Popularno mesto na Novom Beogradu, bašta je često puna." },
      { id: "beishanlan-bubble-tea", note: "Nije presladak, a ukusan je." },
      { id: "bunny-cafe-belgrade", note: "Slatko novo mesto sa zečevima." },
    ],
  },
  {
    id: "pica-burger",
    title: "Pica i burgeri",
    icon: "🍕",
    intro: "Kad treba nešto sigurno i ukusno.",
    places: [
      { id: "perlo-burgeri", note: "Top 3 burgera u Beogradu, bez dileme." },
      { id: "di-napoli-pizzeria-restaurant", note: "Odlična hrana, lokal je uvek pun." },
      { id: "botako-restoran-dorcol-picerija-dostava", note: "Odlične pice i lep prostor." },
      { id: "billys-pizza-tavern-dorcol", note: "Američka pica, baš kao u Americi." },
      { id: "pizzeria-trg", note: "Odnos cene i kvaliteta 5/5." },
      { id: "giovanni-s-pizzeria", note: "Ukusna pica u spoju starog i modernog prostora." },
      { id: "che-gusto-beograd", note: "Ljuta pica je odlična." },
      { id: "smash-burgers", note: "Odlični burgeri, prostor je mali pa je više za poneti." },
      { id: "diner-bros-novi-beograd", note: "Top hrana, čekali smo najviše 10 minuta." },
      { id: "taurunum-pogled-pizza-bar", note: "Pica sa pogledom na Zemun." },
    ],
  },
  {
    id: "kafane",
    title: "Kafane i domaća kuhinja",
    icon: "🍲",
    intro: "Jagnjetina, roštilj i dobra atmosfera.",
    places: [
      { id: "kafana-5-glava", note: "Jagnjetina i moravska salata za pohvalu." },
      { id: "zavicaj-skadarlija", note: "Uvek dobra atmosfera, ambijent i tradicija." },
      { id: "velika-skadarlija-restaurant", note: "Fina usluga, dobra hrana i pristojne cene." },
      { id: "ciribu-ciriba", note: "Domaćinska atmosfera u Zemunu i dobre cene." },
      { id: "iva-new-balkan-cuisine", note: "Balkanska kuhinja na nov način, prostor je mali." },
      { id: "beograd-na-vatri", note: "Odlično novo mesto: hrana, usluga i cene." },
      { id: "trandafilovic", note: "Lepa bašta i dobra hrana." },
      { id: "restoran-radnicki", note: "Veoma dobra hrana i parking za goste." },
      { id: "bure-piva", note: "Povoljna i ukusna hrana uz dobar izbor piva." },
    ],
  },
  {
    id: "kokteli",
    title: "Kokteli",
    icon: "🍸",
    intro: "Barovi u koje vodim ljude kad hoćemo dobar koktel.",
    places: [
      { id: "lenja-buba", note: "Najbolje koktel iskustvo koje sam imao u Beogradu, sve rade pred tobom." },
      { id: "noble-roots-cocktail-bar", note: "Prelep dizajn, imaju i šah, a ekipa je super ljubazna." },
      { id: "buratina-bar", note: "Skriveno mesto sa velikim izborom bezalkoholnih vina i koktela." },
      { id: "cin-cin", note: "Odlični kokteli u malom i toplom prostoru, idealno za dvoje ili troje." },
      { id: "eje-belgrade", note: "Dobra atmosfera i ukusni kokteli." },
      { id: "bistro-tri", note: "Jako dobar white russian." },
      { id: "passengers-bar", note: "Kul bar, malo skriven." },
      { id: "restaurant-idol", note: "Dobri kokteli, a i hrana je na mestu." },
      { id: "leposava-bar", note: "Lep bar sa zanimljivim dekorom." },
      { id: "mali-prag", note: "Dobro piće i partija šaha, a ljubimci su dobrodošli." },
    ],
  },
  {
    id: "pivo",
    title: "Pivo i pabovi",
    icon: "🍺",
    intro: "Craft pivo, Ginis i bašte za duga leta.",
    places: [
      { id: "dogma-brewery-tap-room", note: "Odlična lokacija i bašta, dobro pivo i hrana." },
      { id: "helga-s-pub-mesi-mesi", note: "Odlično mesto na Novom Beogradu za pivo i hranu." },
      { id: "badger-mug", note: "Dobar Ginis." },
      { id: "monk-s-bar", note: "Ugodna, kućna atmosfera i brza usluga." },
      { id: "liga-pub-obilicev-venac", note: "Čisto i prostrano, dobro za druženje." },
      { id: "bure-piva", note: "Dobar izbor piva i povoljna hrana." },
      { id: "pivokratija-2", note: "Malo izdvojeno na Adi, ali vredi." },
      { id: "polapola-bar", note: "Odlična atmosfera." },
    ],
  },
  {
    id: "pogled",
    title: "Pogled i reka",
    icon: "🌅",
    intro: "Mesta za zalazak sunca, reke i pogled na grad.",
    places: [
      { id: "the-view-rooftop", note: "Jedan od najlepših pogleda na grad i Hram. Dođi kad nije gužva." },
      { id: "restoran-mokum", note: "Odličan pogled na grad, pravi skriveni dragulj." },
      { id: "predji-preko", note: "Prelep pogled na Zemun i besplatan prevoz preko reke." },
      { id: "taurunum-pogled-pizza-bar", note: "Sjajan pogled i ukusna hrana po pristupačnim cenama." },
      { id: "sava-45-event-center", note: "Lep pogled uz dobru hranu i kafu." },
      { id: "reka", note: "Dobra muzika i hrana na zemunskom keju." },
      { id: "lefer-splav", note: "Lep ambijent na splavu." },
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
      { id: "barrel-house", note: "Skriveni dragulj Dorćola." },
      { id: "kissa10", note: "Skriveno mesto sa živom muzikom i dobrim cenama." },
      { id: "cafe-934", note: "Neobičan kafić kakav nema nigde drugde u Beogradu." },
      { id: "pinecone-bar-theater", note: "Bar i pozorište u jednom." },
      { id: "muzej-paranormalnog", note: "Mali muzej koji vode jako prijatni ljudi." },
      { id: "vukov-bozicni-kutak", note: "Dekor se stalno menja, vredi se vraćati." },
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
      { id: "mmr-escape-rooms-lokacija-2", note: "Odlično iskustvo u LOTR sobi, sa prijatnim hostom." },
      { id: "3d-board-game-pub", note: "Moje omiljeno mesto za društvene igre: živo i radi do kasno." },
      { id: "narodno-pozoriste" },
      { id: "atelje-212" },
      { id: "muzej-nikole-tesle" },
      { id: "museum-of-contemporary-art", note: "Zanimljiv i lepo uređen muzej, sa parkingom." },
      { id: "jugoslovenska-kinoteka" },
      { id: "turbomax-karting-centar", note: "Super iskustvo i prijatno osoblje." },
      { id: "klub-za-drustvene-igre-groot", note: "Prijatan domaćin, sređene igre i povoljne cene." },
    ],
  },
];

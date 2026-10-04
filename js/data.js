/*
  STEFANOV VODIČ – podaci o lokacijama
  ------------------------------------
  Ovde dodaješ, menjaš ili brišeš lokacije. Svaka lokacija je jedan objekat.

  Polja:
    id          jedinstveni kratki naziv, bez razmaka (npr. "kalemegdan")
    name        naziv mesta
    category    jedna od: "jelo", "kafa", "pice", "vidi", "radi", "noc"
    area        kraj grada (npr. "Dorćol", "Zemun", "Vračar")
    image       putanja do slike u folderu images/ (npr. "images/kalemegdan.jpg")
                ako slika ne postoji, sajt uzima fotografiju sa Google Maps (potreban ključ)
    placeId     (opciono) Google Place ID, ako Google nađe pogrešno mesto po nazivu
    short       jedna rečenica za karticu
    description duži opis za prozor sa detaljima
    tip         tvoj lični savet (opciono)
    price       "€", "€€", "€€€" ili "" za besplatno
    address     adresa
    lat, lng    koordinate (desni klik na Google Maps > kopiraj koordinate)
    favorite    true ako je mesto među tvojim apsolutnim favoritima
    tags        lista kratkih oznaka

  NAPOMENA: ovo su početni primeri sa približnim koordinatama.
  Proveri ih i zameni svojim preporukama.
*/

const CATEGORIES = {
  jelo: { label: "Jelo", icon: "🍽️" },
  kafa: { label: "Kafa i doručak", icon: "☕" },
  pice: { label: "Piće", icon: "🍸" },
  vidi: { label: "Vidi", icon: "🏛️" },
  radi: { label: "Radi", icon: "🚲" },
  noc: { label: "Noćni život", icon: "🌙" },
};

const LOCATIONS = [
  {
    id: "kalemegdan",
    name: "Kalemegdan",
    category: "vidi",
    area: "Stari grad",
    image: "images/kalemegdan.jpg",
    short: "Tvrđava iznad ušća Save u Dunav i najlepši zalazak sunca u gradu.",
    description:
      "Beogradska tvrđava i park oko nje su srce grada. Prošetaj zidinama, pogledaj Pobednika i ostani do zalaska sunca na vidikovcu iznad ušća.",
    tip: "Dođi sat vremena pre zalaska i sedi na zidinama kod Pobednika.",
    price: "",
    address: "Kalemegdan, Beograd",
    lat: 44.8231,
    lng: 20.4506,
    favorite: true,
    tags: ["pogled", "zalazak", "šetnja"],
  },
  {
    id: "skadarlija",
    name: "Skadarlija",
    category: "vidi",
    area: "Stari grad",
    image: "images/skadarlija.jpg",
    short: "Boemska kaldrma, kafane i stari zanat.",
    description:
      "Najpoznatija boemska ulica Beograda. Kaldrma, tamburaši i kafane sa tradicijom dugom više od veka.",
    tip: "Najlepša je rano uveče, pre nego što se napuni.",
    price: "",
    address: "Skadarska, Beograd",
    lat: 44.8178,
    lng: 20.4659,
    favorite: false,
    tags: ["istorija", "kafane"],
  },
  {
    id: "hram-svetog-save",
    name: "Hram Svetog Save",
    category: "vidi",
    area: "Vračar",
    image: "images/hram.jpg",
    short: "Jedan od najvećih pravoslavnih hramova na svetu, sa zlatnom kriptom.",
    description:
      "Monumentalni hram na Vračaru. Obavezno siđi u kriptu, mozaici su neverovatni. Plato ispred je odličan za odmor uz kafu.",
    tip: "Kripta je najmirnija ujutru.",
    price: "",
    address: "Krušedolska 2a, Beograd",
    lat: 44.7981,
    lng: 20.4689,
    favorite: true,
    tags: ["arhitektura", "besplatno"],
  },
  {
    id: "gardos",
    name: "Gardoš kula",
    category: "vidi",
    area: "Zemun",
    image: "images/gardos.jpg",
    short: "Kula iznad Zemuna sa pogledom na Dunav i crvene krovove.",
    description:
      "Popni se uzanim zemunskim uličicama do Gardoš kule. Pogled na Dunav i stari Zemun je potpuno drugačiji od ostatka grada.",
    tip: "Spoji sa ručkom u ribljem restoranu na zemunskom keju.",
    price: "",
    address: "Grobljanska, Zemun",
    lat: 44.8481,
    lng: 20.4097,
    favorite: false,
    tags: ["pogled", "Dunav"],
  },
  {
    id: "muzej-tesle",
    name: "Muzej Nikole Tesle",
    category: "vidi",
    area: "Vračar",
    image: "images/tesla.jpg",
    short: "Mali muzej sa velikim demonstracijama Teslinih izuma.",
    description:
      "Kompaktan muzej sa vođenim turama i živim demonstracijama Teslinog kalema. Odličan za kišni dan.",
    tip: "Ulaznice za ture se brzo rasprodaju, dođi ranije.",
    price: "€",
    address: "Krunska 51, Beograd",
    lat: 44.8059,
    lng: 20.4719,
    favorite: false,
    tags: ["muzej", "kišni dan"],
  },
  {
    id: "ada-ciganlija",
    name: "Ada Ciganlija",
    category: "radi",
    area: "Čukarica",
    image: "images/ada.jpg",
    short: "Beogradsko more: kupanje, bicikl i kafići na vodi.",
    description:
      "Jezero sa plažama, stazom za trčanje i bicikl oko cele Ade. Leti je to mesto gde ceo grad beži od vrućine.",
    tip: "Iznajmi bicikl i obiđi ceo krug, oko 8 km.",
    price: "",
    address: "Ada Ciganlija, Beograd",
    lat: 44.787,
    lng: 20.414,
    favorite: true,
    tags: ["leto", "sport", "kupanje"],
  },
  {
    id: "kej-dunav",
    name: "Šetnja dunavskim kejom",
    category: "radi",
    area: "Dorćol",
    image: "images/kej.jpg",
    short: "Od Dorćola do Zemuna peške ili biciklom pored reke.",
    description:
      "Staza uz Dunav vodi od Dorćol marine preko Ušća sve do Zemuna. Ravna, zelena i puna mesta za usputnu kafu.",
    tip: "Kreni od Dorćol marine kasno popodne.",
    price: "",
    address: "Dunavski kej, Beograd",
    lat: 44.8296,
    lng: 20.4632,
    favorite: false,
    tags: ["šetnja", "bicikl"],
  },
  {
    id: "manufaktura",
    name: "Manufaktura",
    category: "jelo",
    area: "Stari grad",
    image: "images/manufaktura.jpg",
    short: "Srpska kuhinja u modernom ruhu, u centru grada.",
    description:
      "Domaća jela, od proje do pljeskavice, u lepo uređenom prostoru sa baštom. Odlično mesto da probaš srpsku kuhinju prvi put.",
    tip: "Probaj kajmak i domaće rakije.",
    price: "€€",
    address: "Kralja Petra 13-15, Beograd",
    lat: 44.8183,
    lng: 20.4545,
    favorite: true,
    tags: ["srpska kuhinja", "bašta"],
  },
  {
    id: "dva-jelena",
    name: "Dva jelena",
    category: "jelo",
    area: "Stari grad",
    image: "images/dva-jelena.jpg",
    short: "Jedna od najstarijih kafana u Skadarliji.",
    description:
      "Kafana sa dugom tradicijom, živom muzikom i klasičnim jelima sa roštilja.",
    tip: "Rezerviši sto vikendom.",
    price: "€€",
    address: "Skadarska 32, Beograd",
    lat: 44.8174,
    lng: 20.4666,
    favorite: false,
    tags: ["kafana", "muzika"],
  },
  {
    id: "kafeterija",
    name: "Kafeterija Magazin 1907",
    category: "kafa",
    area: "Stari grad",
    image: "images/kafeterija.jpg",
    short: "Specialty kafa u industrijskom prostoru sa visokim plafonima.",
    description:
      "Jedna od prvih specialty pržionica u gradu. Veliki prostor, odlična kafa i dobro mesto za rad sa laptopom.",
    tip: "Flat white i kroasan za početak dana.",
    price: "€",
    address: "Kralja Petra 16, Beograd",
    lat: 44.8189,
    lng: 20.4535,
    favorite: true,
    tags: ["specialty", "laptop"],
  },
  {
    id: "rakia-bar",
    name: "Rakia Bar",
    category: "pice",
    area: "Dorćol",
    image: "images/rakia-bar.jpg",
    short: "Degustacija domaćih rakija na jednom mestu.",
    description:
      "Desetine vrsta rakije, od šljive do dunje i kajsije. Osoblje rado pomaže da izabereš.",
    tip: "Uzmi degustacioni set od tri rakije.",
    price: "€€",
    address: "Dobračina 5, Beograd",
    lat: 44.8199,
    lng: 20.4584,
    favorite: false,
    tags: ["rakija", "degustacija"],
  },
  {
    id: "bar-central",
    name: "Bar Central",
    category: "pice",
    area: "Stari grad",
    image: "images/bar-central.jpg",
    short: "Koktel bar sa barmenima koji znaju šta rade.",
    description:
      "Elegantan koktel bar sa klasicima i autorskim koktelima. Odlično za početak večeri.",
    tip: "Pitaj barmena za nešto što nije na meniju.",
    price: "€€",
    address: "Kralja Petra 59, Beograd",
    lat: 44.8164,
    lng: 20.4597,
    favorite: false,
    tags: ["kokteli"],
  },
  {
    id: "beton-hala",
    name: "Beton hala",
    category: "noc",
    area: "Savamala",
    image: "images/beton-hala.jpg",
    short: "Restorani i barovi u nizu, tik uz Savu.",
    description:
      "Nekadašnje skladište pretvoreno u niz restorana i barova sa pogledom na Savu i Novi Beograd. Leti je terasa puna do kasno.",
    tip: "Večera, pa piće na terasi dok se pale svetla na mostovima.",
    price: "€€€",
    address: "Karađorđeva 2-4, Beograd",
    lat: 44.818,
    lng: 20.4495,
    favorite: false,
    tags: ["reka", "terasa"],
  },
  {
    id: "splavovi",
    name: "Splavovi na Savi",
    category: "noc",
    area: "Novi Beograd",
    image: "images/splavovi.jpg",
    short: "Klubovi na vodi, beogradski noćni klasik.",
    description:
      "Plutajući klubovi duž obale Save i Dunava. Leti su glavno mesto izlazaka, od opuštenih barova do velikih klubova.",
    tip: "Proveri program unapred i rezerviši sto za vikend.",
    price: "€€€",
    address: "Ušće, Novi Beograd",
    lat: 44.8146,
    lng: 20.4382,
    favorite: false,
    tags: ["klubovi", "leto"],
  },
];

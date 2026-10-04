# Stefanov vodič

Lične preporuke za Beograd: gde jesti, piti kafu, izaći i šta videti. Statičan sajt (HTML, CSS, JavaScript), bez instalacije i build koraka.

## Šta sajt ima

- Hero sekciju sa naslovom i brojem mesta
- Vodič sa karticama lokacija (slika, kategorija, kraj grada, cena, oznaka favorita)
- Filtere po kategoriji i kraju grada, pretragu i prikaz samo favorita
- Prozor sa detaljima: opis, "Stefanov savet", adresa, dugme za Google Maps
- Google mapu sa listom mesta (sa API ključem: jedna mapa sa pinovima za sva mesta)
- Sekciju "O meni"
- Direktan link na lokaciju, npr. `.../#kalemegdan`

## Odakle su mesta

Mesta su uvezena iz Stefanovih Google Maps recenzija (Google Takeout, fajl `Reviews.json`): samo Beograd, samo ocene 4 i 5, bez servisa i prodavnica. Za svako mesto sajt prikazuje ocenu, recenziju i link ka mestu na Google Maps.

## Kako da dodaš ili izmeniš lokaciju

Sve lokacije su u fajlu `js/data.js`. Kopiraj jedan postojeći blok `{ ... }`, promeni vrednosti i sačuvaj. Objašnjenje svih polja je na vrhu fajla.

Koordinate: na Google Maps desni klik na mesto, klikni na brojeve na vrhu menija i oni se kopiraju (npr. `44.8231, 20.4506`).

## Google mapa

Bez ključa sajt prikazuje ugrađenu Google mapu za jedno izabrano mesto, a lista pored mape menja mesto. Sa ključem dobijaš jednu mapu sa pinovima za sva mesta, a svako mesto bez tvoje slike dobija fotografiju sa Google Maps (sa imenom autora, kako Google traži).

Google fotografije se plaćaju po učitavanju, uz besplatnu mesečnu kvotu. Za mali sajt to je obično besplatno, ali u Google Cloud podesi Budget alert (Billing > Budgets & alerts) da te obavesti ako krene da troši. Tvoje slike u images/ uvek imaju prednost i ne troše ništa.

Kako da dodaš ključ:

1. Na console.cloud.google.com izaberi ili napravi projekat
2. Projekat mora da ima uključen Billing (kartica). Google daje besplatan mesečni broj učitavanja mape, za lični sajt se obično ništa ne plaća
3. APIs & Services > Library > uključi (Enable) "Maps JavaScript API" i "Places API (New)"
4. APIs & Services > Credentials > Create credentials > API key
5. Otvori ključ i podesi ograničenja:
   - Application restrictions: Websites, pa dodaj `https://vidovit.github.io/*` i `http://localhost:8000/*`
   - API restrictions: Restrict key > izaberi "Maps JavaScript API" i "Places API (New)"
6. Kopiraj ključ u `js/config.js`, između navodnika: `const GOOGLE_MAPS_API_KEY = "tvoj-kljuc";`

Ključ je vidljiv u kodu sajta, to je normalno za Google mape. Zato su ograničenja iz koraka 5 obavezna, da niko drugi ne može da ga koristi.

## Slike

Ubaci fotografije u folder `images/` sa imenima koja su navedena u `js/data.js` (npr. `images/kalemegdan.jpg`). Dok slika ne postoji, sajt prikazuje obojenu pozadinu sa ikonicom.

Posebne slike:
- `images/hero.jpg` velika slika na vrhu stranice (horizontalna, oko 2000px širine)
- `images/stefan.jpg` tvoja slika u sekciji "O meni" (vertikalna)

Preporuka: slike za kartice vertikalne (4:5), oko 1200px, kompresovane (npr. preko squoosh.app).

## Lokalno pokretanje

Otvori `index.html` u browseru, ili pokreni mali server:

```
python3 -m http.server 8000
```

pa otvori http://localhost:8000

## Objavljivanje (GitHub Pages)

1. Na GitHub-u otvori repozitorijum, Settings > Pages
2. Source: "Deploy from a branch", izaberi granu i folder `/ (root)`
3. Sačuvaj; sajt će biti dostupan na adresi koju GitHub prikaže

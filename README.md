# Stefanov vodič

Lične preporuke za Beograd: gde jesti, piti kafu, izaći i šta videti. Statičan sajt (HTML, CSS, JavaScript), bez instalacije i build koraka.

## Šta sajt ima

- Hero sekciju sa naslovom i brojem mesta
- Vodič sa karticama lokacija (slika, kategorija, kraj grada, cena, oznaka favorita)
- Filtere po kategoriji i kraju grada, pretragu i prikaz samo favorita
- Prozor sa detaljima: opis, "Stefanov savet", adresa, dugme za Google Maps
- Interaktivnu mapu sa pinovima za svaku lokaciju
- Sekciju "O meni"
- Direktan link na lokaciju, npr. `.../#kalemegdan`

## Kako da dodaš ili izmeniš lokaciju

Sve lokacije su u fajlu `js/data.js`. Kopiraj jedan postojeći blok `{ ... }`, promeni vrednosti i sačuvaj. Objašnjenje svih polja je na vrhu fajla.

Koordinate: na Google Maps desni klik na mesto, klikni na brojeve na vrhu menija i oni se kopiraju (npr. `44.8231, 20.4506`).

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

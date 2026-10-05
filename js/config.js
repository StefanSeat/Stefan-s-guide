/*
  Google Maps podešavanje
  -----------------------
  Bez ključa: ugrađena Google mapa za jedno izabrano mesto, a mesta bez tvoje slike prikazuju poster sa tačkicama.
  Sa ključem: mapa sa pinovima za sva mesta, a mesta bez tvoje slike dobijaju fotografiju sa Google Maps.

  U Google Cloud projektu uključi DVA API-ja:
    - Maps JavaScript API
    - Places API (New)
  Ključ ograniči na adresu svog sajta (Website restrictions). Uputstvo je u README.md.
*/
const GOOGLE_MAPS_API_KEY = "";

/*
  Zajednica (prijava mejlom, liste u oblaku, glasanje, dodavanje mesta)
  ---------------------------------------------------------------------
  Napravi besplatan projekat na supabase.com, pokreni supabase/schema.sql u SQL Editor-u
  i ovde nalepi Project URL i anon public ključ (Project Settings > API).
  Dok su prazni, sajt radi kao i do sada, bez prijave i glasanja.
*/
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "sb_publishable_ugniqmBD9rq8y7aBgkk6YQ_f7B_pqZ8";

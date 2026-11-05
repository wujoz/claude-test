# Lodówka+ — wirtualna lodówka

Strona/aplikacja webowa do zarządzania zawartością lodówki.

## Funkcje
- **Lodówka** – lista produktów z ilością, kategorią i datą ważności (kolory: OK / kończy się / po terminie), wyszukiwanie, filtrowanie, sortowanie, szybka zmiana ilości.
- **Skanowanie** – kamera telefonu/komputera czyta kody QR i kody kreskowe (EAN). Obsługiwane:
  - kody z lokalnej bazy demo,
  - dowolne kody EAN – wyszukiwane w otwartej bazie Open Food Facts,
  - kody QR z danymi JSON, np. `{"name":"Mleko","category":"nabial","qty":1,"unit":"l","days":7}`,
  - skanowanie ze zdjęcia lub ręczne wpisanie kodu.
- **Posiłki** – tworzenie dań z produktów z lodówki, data „zjedz do” (wg najszybciej psującego się składnika), sugestie do każdego dania, przycisk „Ugotowane” odejmuje zużyte składniki.
- **Sugestie** – przepisy dopasowane do zawartości lodówki (śniadanie/obiad/kolacja/przekąska), w pierwszej kolejności ratujące produkty z kończącą się datą, z krokami przygotowania i wskazówkami.

- **Budżet** – paragony (zdjęcie odczytywane przez Claude'a w wersji online albo wpisane ręcznie), wydatki wg sklepów i kategorii, porównanie cen tych samych produktów w różnych sklepach, oszczędności z gotowania w domu i z uratowanego jedzenia, straty na zmarnowanym, bilans, cele oszczędnościowe i pomysły, na co przeznaczyć pieniądze.
- **Dieta i makro** – każdy ustawia własną dietę (cel, aktywność, rodzaj: zwykła, wysokobiałkowa, wegetariańska, wegańska, keto); kalkulator liczy kalorie i makro. Posiłki i przepisy pokazują kcal, białko, tłuszcz i węglowodany na porcję i ocenę, czy pasują do diety. Dziennik pokazuje, ile zostało na dziś, i podpowiada przepisy na resztę dnia.
- **Wspólna lodówka** – w wersji online (claude.ai) wszyscy, którym udostępnisz stronę z uprawnieniem Współtwórcy lub Edytora, widzą i zmieniają te same dane na żywo.

Otwarta jako zwykły plik strona zapisuje dane lokalnie w przeglądarce (localStorage).

## Uruchomienie
Najprościej: otwórz plik `index.html` (to jeden samodzielny plik – style i skrypty są w środku).

Kod źródłowy jest w `src/`; po zmianach uruchom `python3 build.py`, żeby ponownie złożyć `index.html`.

Aby działał podgląd z kamery, uruchom serwer HTTP:
```
python3 -m http.server 8000
```
i otwórz http://localhost:8000. Kamera wymaga HTTPS lub localhost (np. GitHub Pages).

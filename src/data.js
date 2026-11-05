/* Dane statyczne: kategorie, baza produktów (kody), przepisy */

const CATEGORIES = {
  nabial:   { label: 'Nabiał',            emoji: '🥛', shelfDays: 7 },
  mieso:    { label: 'Mięso i ryby',      emoji: '🥩', shelfDays: 3 },
  warzywa:  { label: 'Warzywa',           emoji: '🥦', shelfDays: 7 },
  owoce:    { label: 'Owoce',             emoji: '🍎', shelfDays: 7 },
  pieczywo: { label: 'Pieczywo',          emoji: '🍞', shelfDays: 4 },
  suche:    { label: 'Produkty suche',    emoji: '🍝', shelfDays: 365 },
  napoje:   { label: 'Napoje',            emoji: '🧃', shelfDays: 30 },
  sosy:     { label: 'Sosy i przyprawy',  emoji: '🥫', shelfDays: 90 },
  mrozonki: { label: 'Mrożonki',          emoji: '🧊', shelfDays: 120 },
  inne:     { label: 'Inne',              emoji: '📦', shelfDays: 14 },
};

/* Lokalna baza kodów (kody demonstracyjne). Nieznane kody EAN
   są dodatkowo sprawdzane w otwartej bazie Open Food Facts. */
const PRODUCT_DB = {
  '5900820000011': { name: 'Mleko 2%',            category: 'nabial',   qty: 1,   unit: 'l',    emoji: '🥛', days: 7 },
  '5900820000028': { name: 'Jajka (10 szt.)',     category: 'nabial',   qty: 10,  unit: 'szt',  emoji: '🥚', days: 21 },
  '5900820000035': { name: 'Ser żółty gouda',     category: 'nabial',   qty: 250, unit: 'g',    emoji: '🧀', days: 14 },
  '5900820000042': { name: 'Pierś z kurczaka',    category: 'mieso',    qty: 500, unit: 'g',    emoji: '🍗', days: 3 },
  '5900820000059': { name: 'Pomidory',            category: 'warzywa',  qty: 4,   unit: 'szt',  emoji: '🍅', days: 6 },
  '5900820000066': { name: 'Makaron spaghetti',   category: 'suche',    qty: 500, unit: 'g',    emoji: '🍝', days: 540 },
  '5900820000073': { name: 'Jogurt naturalny',    category: 'nabial',   qty: 400, unit: 'g',    emoji: '🥣', days: 10 },
  '5900820000080': { name: 'Szpinak świeży',      category: 'warzywa',  qty: 150, unit: 'g',    emoji: '🥬', days: 4 },
  '5900820000097': { name: 'Chleb żytni',         category: 'pieczywo', qty: 1,   unit: 'szt',  emoji: '🍞', days: 4 },
  '5900820000103': { name: 'Banany',              category: 'owoce',    qty: 5,   unit: 'szt',  emoji: '🍌', days: 5 },
  '5900820000110': { name: 'Masło',               category: 'nabial',   qty: 200, unit: 'g',    emoji: '🧈', days: 30 },
  '5900820000127': { name: 'Cebula',              category: 'warzywa',  qty: 3,   unit: 'szt',  emoji: '🧅', days: 30 },
  '5900820000134': { name: 'Ryż basmati',         category: 'suche',    qty: 1,   unit: 'kg',   emoji: '🍚', days: 600 },
  '5900820000141': { name: 'Passata pomidorowa',  category: 'sosy',     qty: 500, unit: 'ml',   emoji: '🥫', days: 300 },
  '5900820000158': { name: 'Twaróg półtłusty',    category: 'nabial',   qty: 250, unit: 'g',    emoji: '🧀', days: 6 },
  '5900820000165': { name: 'Papryka czerwona',    category: 'warzywa',  qty: 2,   unit: 'szt',  emoji: '🫑', days: 7 },
};

/* Przepisy: składnik pasuje do produktu, jeśli nazwa produktu zawiera
   jeden z kluczy (po normalizacji – małe litery, bez polskich znaków). */
const RECIPES = [
  {
    id: 'omlet', name: 'Omlet ze szpinakiem i serem', emoji: '🍳', type: ['śniadanie', 'kolacja'], time: 15,
    ingredients: [
      { label: 'Jajka', keys: ['jaj'] },
      { label: 'Szpinak', keys: ['szpinak'] },
      { label: 'Ser żółty', keys: ['ser zolty', 'gouda', 'cheddar', 'mozzarella', 'ser'] },
      { label: 'Masło', keys: ['maslo'], optional: true },
    ],
    steps: ['Roztrzep 3 jajka ze szczyptą soli i pieprzu.', 'Na maśle podsmaż szpinak przez 1–2 min.', 'Wlej jajka, posyp startym serem, smaż na małym ogniu pod przykryciem.', 'Złóż na pół i podawaj od razu.'],
    tips: ['Dodaj pokrojone pomidory dla świeżości.', 'Zwiędnięty szpinak świetnie nada się właśnie tutaj — nie musi być idealny.'],
  },
  {
    id: 'jajecznica', name: 'Jajecznica na maśle ze szczypiorkiem', emoji: '🥚', type: ['śniadanie'], time: 10,
    ingredients: [
      { label: 'Jajka', keys: ['jaj'] },
      { label: 'Masło', keys: ['maslo'] },
      { label: 'Pieczywo', keys: ['chleb', 'bulk', 'bagiet', 'pieczyw'], optional: true },
      { label: 'Cebula / szczypiorek', keys: ['cebul', 'szczypior'], optional: true },
    ],
    steps: ['Rozpuść masło na patelni na małym ogniu.', 'Wbij jajka i mieszaj powoli szpatułką.', 'Zdejmij z ognia, gdy są jeszcze lekko wilgotne.', 'Podawaj z pieczywem.'],
    tips: ['Lekko czerstwy chleb podpiecz w tosterze lub na patelni.'],
  },
  {
    id: 'spaghetti', name: 'Spaghetti z sosem pomidorowym', emoji: '🍝', type: ['obiad', 'kolacja'], time: 25,
    ingredients: [
      { label: 'Makaron', keys: ['makaron', 'spaghetti', 'penne'] },
      { label: 'Passata / pomidory', keys: ['passata', 'pomidor'] },
      { label: 'Cebula', keys: ['cebul'] },
      { label: 'Ser żółty', keys: ['ser zolty', 'gouda', 'parmezan', 'ser'], optional: true },
    ],
    steps: ['Ugotuj makaron al dente w osolonej wodzie.', 'Na oliwie zeszklij posiekaną cebulę.', 'Dodaj passatę lub pokrojone pomidory, duś 10 min, dopraw solą, pieprzem i bazylią.', 'Wymieszaj z makaronem i posyp serem.'],
    tips: ['Miękkie, przejrzałe pomidory są idealne na sos.', 'Dorzuć szpinak pod koniec duszenia — wersja „zielona”.'],
  },
  {
    id: 'kurczak-ryz', name: 'Kurczak z papryką i ryżem', emoji: '🍗', type: ['obiad'], time: 35,
    ingredients: [
      { label: 'Pierś z kurczaka', keys: ['kurczak', 'indyk'] },
      { label: 'Ryż', keys: ['ryz'] },
      { label: 'Papryka', keys: ['papryk'] },
      { label: 'Cebula', keys: ['cebul'], optional: true },
    ],
    steps: ['Ugotuj ryż według instrukcji.', 'Kurczaka pokrój w kostkę, dopraw papryką słodką i solą.', 'Obsmaż mięso, dodaj cebulę i paprykę w paski, smaż 8 min.', 'Podawaj na ryżu.'],
    tips: ['Mięso z krótką datą możesz od razu ugotować i zamrozić porcjami.', 'Resztki dania są świetnym lunchem na jutro.'],
  },
  {
    id: 'leczo', name: 'Leczo warzywne', emoji: '🥘', type: ['obiad', 'kolacja'], time: 30,
    ingredients: [
      { label: 'Papryka', keys: ['papryk'] },
      { label: 'Pomidory / passata', keys: ['pomidor', 'passata'] },
      { label: 'Cebula', keys: ['cebul'] },
      { label: 'Kiełbasa / kurczak', keys: ['kielbas', 'kurczak'], optional: true },
    ],
    steps: ['Zeszklij cebulę na oleju.', 'Dodaj paprykę pokrojoną w kostkę, smaż 5 min.', 'Wlej passatę lub dodaj pomidory, duś 15 min.', 'Dopraw papryką wędzoną, solą i pieprzem.'],
    tips: ['Leczo to najlepszy sposób na warzywa, które straciły jędrność.'],
  },
  {
    id: 'kanapki', name: 'Ciepłe kanapki z serem i pomidorem', emoji: '🥪', type: ['śniadanie', 'kolacja', 'przekąska'], time: 10,
    ingredients: [
      { label: 'Pieczywo', keys: ['chleb', 'bulk', 'bagiet', 'pieczyw'] },
      { label: 'Ser żółty', keys: ['ser zolty', 'gouda', 'ser'] },
      { label: 'Pomidory', keys: ['pomidor'], optional: true },
      { label: 'Masło', keys: ['maslo'], optional: true },
    ],
    steps: ['Posmaruj kromki masłem.', 'Ułóż plastry sera i pomidora.', 'Zapiekaj 5–7 min w 200°C lub na patelni pod przykryciem.'],
    tips: ['Najlepszy sposób na pieczywo sprzed kilku dni.'],
  },
  {
    id: 'smoothie', name: 'Smoothie bananowe', emoji: '🥤', type: ['śniadanie', 'przekąska'], time: 5,
    ingredients: [
      { label: 'Banany', keys: ['banan'] },
      { label: 'Jogurt / mleko', keys: ['jogurt', 'mleko', 'kefir'] },
      { label: 'Szpinak', keys: ['szpinak'], optional: true },
    ],
    steps: ['Obierz banany i pokrój na kawałki.', 'Zmiksuj z jogurtem lub mlekiem na gładko.', 'Opcjonalnie dodaj garść szpinaku i łyżkę miodu.'],
    tips: ['Ciemne, przejrzałe banany są najsłodsze — idealne do koktajlu.', 'Banany możesz też obrać i zamrozić na później.'],
  },
  {
    id: 'twarozek', name: 'Twarożek ze szczypiorkiem i rzodkiewką', emoji: '🥣', type: ['śniadanie', 'kolacja'], time: 5,
    ingredients: [
      { label: 'Twaróg', keys: ['twarog'] },
      { label: 'Jogurt / śmietana', keys: ['jogurt', 'smietan'] },
      { label: 'Pieczywo', keys: ['chleb', 'bulk', 'pieczyw'], optional: true },
      { label: 'Cebula / szczypiorek', keys: ['cebul', 'szczypior', 'rzodkiew'], optional: true },
    ],
    steps: ['Rozgnieć twaróg widelcem.', 'Wymieszaj z jogurtem, solą i pieprzem.', 'Dodaj posiekane warzywa i podawaj z pieczywem.'],
    tips: ['Jogurt z krótką datą zamiast śmietany — lżej i bez marnowania.'],
  },
  {
    id: 'nalesniki', name: 'Naleśniki z twarogiem', emoji: '🥞', type: ['śniadanie', 'obiad'], time: 30,
    ingredients: [
      { label: 'Mleko', keys: ['mleko'] },
      { label: 'Jajka', keys: ['jaj'] },
      { label: 'Mąka', keys: ['maka '] },
      { label: 'Twaróg', keys: ['twarog'], optional: true },
    ],
    steps: ['Zmiksuj 1 szklankę mleka, 2 jajka, 1 szklankę mąki i szczyptę soli.', 'Smaż cienkie placki na rozgrzanej patelni.', 'Twaróg wymieszaj z cukrem i jogurtem, nadziewaj naleśniki.'],
    tips: ['Mleko tuż przed datą ważności nadaje się do ciasta naleśnikowego bez problemu.'],
  },
  {
    id: 'ryz-warzywa', name: 'Smażony ryż z warzywami i jajkiem', emoji: '🍚', type: ['obiad', 'kolacja'], time: 20,
    ingredients: [
      { label: 'Ryż', keys: ['ryz'] },
      { label: 'Jajka', keys: ['jaj'] },
      { label: 'Warzywa (papryka, cebula, szpinak)', keys: ['papryk', 'cebul', 'szpinak', 'marchew', 'groszek'] },
      { label: 'Sos sojowy', keys: ['soj'], optional: true },
    ],
    steps: ['Najlepiej użyj ugotowanego ryżu z poprzedniego dnia.', 'Podsmaż pokrojone warzywa na mocnym ogniu.', 'Dodaj ryż, smaż 3 min, zrób miejsce i usmaż jajko.', 'Wymieszaj całość, dopraw sosem sojowym.'],
    tips: ['To danie „czyści lodówkę” — wrzuć dowolne resztki warzyw.'],
  },
  {
    id: 'zupa-pomidorowa', name: 'Zupa pomidorowa z ryżem', emoji: '🍲', type: ['obiad'], time: 40,
    ingredients: [
      { label: 'Passata / pomidory', keys: ['passata', 'pomidor'] },
      { label: 'Ryż lub makaron', keys: ['ryz', 'makaron'] },
      { label: 'Cebula', keys: ['cebul'] },
      { label: 'Jogurt / śmietana', keys: ['jogurt', 'smietan'], optional: true },
    ],
    steps: ['Zeszklij cebulę w garnku.', 'Dodaj 1 l bulionu i passatę, gotuj 15 min.', 'Zabiel jogurtem, dopraw.', 'Podawaj z ugotowanym ryżem lub makaronem.'],
    tips: ['Zupę możesz zamrozić w porcjach do 3 miesięcy.'],
  },
  {
    id: 'salatka', name: 'Sałatka z kurczakiem', emoji: '🥗', type: ['obiad', 'kolacja'], time: 20,
    ingredients: [
      { label: 'Kurczak', keys: ['kurczak'] },
      { label: 'Sałata / szpinak', keys: ['salat', 'szpinak', 'rukol'] },
      { label: 'Pomidory', keys: ['pomidor'] },
      { label: 'Papryka', keys: ['papryk'], optional: true },
    ],
    steps: ['Usmaż lub upiecz doprawionego kurczaka, pokrój w paski.', 'Ułóż liście, pokrojone pomidory i paprykę.', 'Dodaj kurczaka i polej sosem z jogurtu, czosnku i ziół.'],
    tips: ['Jogurt naturalny zamień w sos czosnkowy — zero marnowania.'],
  },
  {
    id: 'owsianka', name: 'Owsianka z bananem', emoji: '🥣', type: ['śniadanie'], time: 10,
    ingredients: [
      { label: 'Płatki owsiane', keys: ['owsian', 'platki'] },
      { label: 'Mleko', keys: ['mleko'] },
      { label: 'Banany', keys: ['banan'], optional: true },
      { label: 'Jogurt', keys: ['jogurt'], optional: true },
    ],
    steps: ['Zagotuj mleko, wsyp płatki.', 'Gotuj 3–5 min, mieszając.', 'Dodaj rozgnieciony banan i łyżkę jogurtu.'],
    tips: ['Przejrzały banan osłodzi owsiankę bez cukru.'],
  },
  {
    id: 'placki-bananowe', name: 'Placuszki bananowe', emoji: '🥞', type: ['śniadanie', 'przekąska'], time: 15,
    ingredients: [
      { label: 'Banany', keys: ['banan'] },
      { label: 'Jajka', keys: ['jaj'] },
      { label: 'Jogurt', keys: ['jogurt'], optional: true },
    ],
    steps: ['Rozgnieć 1 banana z 2 jajkami.', 'Smaż małe placuszki na lekko natłuszczonej patelni po ok. 1 min z każdej strony.', 'Podawaj z jogurtem.'],
    tips: ['Tylko 2 składniki — idealne, gdy lodówka świeci pustkami.'],
  },
];

/* Ogólne wskazówki przechowywania wg kategorii — pokazywane przy produktach,
   którym kończy się termin */
const RESCUE_TIPS = {
  nabial:   'Mleko i jogurt wykorzystaj do naleśników, ciasta lub koktajlu.',
  mieso:    'Ugotuj lub upiecz dziś, a nadmiar zamroź porcjami.',
  warzywa:  'Zrób leczo, zupę krem lub smażony ryż z warzywami.',
  owoce:    'Zmiksuj na smoothie albo zamroź na później.',
  pieczywo: 'Zrób grzanki, tosty lub bułkę tartą.',
  suche:    'Sprawdź, czy opakowanie jest szczelne — często nadaje się dłużej.',
  napoje:   'Po otwarciu wypij w ciągu 2–3 dni.',
  sosy:     'Dodaj do sosu do makaronu lub zupy.',
  mrozonki: 'Nie zamrażaj ponownie po rozmrożeniu.',
  inne:     'Zaplanuj posiłek z tym produktem w najbliższych dniach.',
};

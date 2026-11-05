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

/* Wartości odżywcze na 100 g (lub 100 ml): kcal, białko (p), tłuszcz (f), węglowodany (c).
   unit = waga 1 sztuki w gramach. Dopasowanie po początku słowa w nazwie (bez polskich znaków). */
const NUTRITION = [
  { keys: ['jaj'], kcal: 140, p: 12.5, f: 9.7, c: 0.7, unit: 60 },
  { keys: ['twarog'], kcal: 133, p: 18, f: 4.7, c: 3.5, unit: 250 },
  { keys: ['jogurt grecki'], kcal: 120, p: 4, f: 10, c: 4, unit: 400 },
  { keys: ['jogurt'], kcal: 61, p: 4.3, f: 2.5, c: 5.5, unit: 400 },
  { keys: ['kefir', 'maslank'], kcal: 50, p: 3.4, f: 2, c: 4.7, unit: 400 },
  { keys: ['mleko roslin', 'napoj owsian', 'napoj sojow', 'mleko owsian', 'mleko sojow'], kcal: 45, p: 1.5, f: 1.5, c: 6, unit: 1000 },
  { keys: ['mleko'], kcal: 50, p: 3.4, f: 2, c: 4.8, unit: 1000 },
  { keys: ['smietan'], kcal: 190, p: 2.5, f: 18, c: 3.6, unit: 200 },
  { keys: ['maslo orzech'], kcal: 600, p: 25, f: 50, c: 15, unit: 350 },
  { keys: ['maslo'], kcal: 735, p: 0.7, f: 82, c: 0.7, unit: 200 },
  { keys: ['mozzarell'], kcal: 250, p: 18, f: 19, c: 1, unit: 125 },
  { keys: ['ser zolty', 'gouda', 'edam', 'cheddar', 'parmezan', 'ser'], kcal: 356, p: 25, f: 27, c: 2, unit: 250 },
  { keys: ['piers', 'kurczak', 'indyk', 'filet'], kcal: 110, p: 23, f: 1.5, c: 0, unit: 500 },
  { keys: ['wolow'], kcal: 190, p: 20, f: 12, c: 0, unit: 500 },
  { keys: ['wieprz', 'mielon'], kcal: 240, p: 18, f: 19, c: 0, unit: 500 },
  { keys: ['kielbas', 'parowk'], kcal: 300, p: 13, f: 27, c: 1, unit: 300 },
  { keys: ['szynk'], kcal: 110, p: 19, f: 3, c: 1, unit: 150 },
  { keys: ['boczek'], kcal: 450, p: 13, f: 45, c: 0, unit: 200 },
  { keys: ['losos'], kcal: 208, p: 20, f: 13, c: 0, unit: 250 },
  { keys: ['tunczyk'], kcal: 116, p: 26, f: 1, c: 0, unit: 170 },
  { keys: ['dorsz', 'ryb'], kcal: 82, p: 18, f: 0.7, c: 0, unit: 300 },
  { keys: ['tofu'], kcal: 145, p: 15, f: 9, c: 2, unit: 180 },
  { keys: ['pomidor'], kcal: 18, p: 0.9, f: 0.2, c: 3.9, unit: 120 },
  { keys: ['passata', 'koncentrat'], kcal: 30, p: 1.4, f: 0.2, c: 5.5, unit: 500 },
  { keys: ['szpinak'], kcal: 23, p: 2.9, f: 0.4, c: 3.6, unit: 150 },
  { keys: ['papryk'], kcal: 31, p: 1, f: 0.3, c: 6, unit: 150 },
  { keys: ['cebul', 'szczypior'], kcal: 40, p: 1.1, f: 0.1, c: 9.3, unit: 100 },
  { keys: ['czosn'], kcal: 150, p: 6.4, f: 0.5, c: 33, unit: 5 },
  { keys: ['marchew'], kcal: 41, p: 0.9, f: 0.2, c: 10, unit: 80 },
  { keys: ['ziemniak'], kcal: 77, p: 2, f: 0.1, c: 17, unit: 150 },
  { keys: ['ogor'], kcal: 15, p: 0.7, f: 0.1, c: 3.6, unit: 150 },
  { keys: ['salat', 'rukol'], kcal: 15, p: 1.4, f: 0.2, c: 2.9, unit: 200 },
  { keys: ['brokul'], kcal: 34, p: 2.8, f: 0.4, c: 7, unit: 400 },
  { keys: ['cukini'], kcal: 17, p: 1.2, f: 0.3, c: 3.1, unit: 250 },
  { keys: ['pieczark'], kcal: 22, p: 3.1, f: 0.3, c: 3.3, unit: 20 },
  { keys: ['rzodkiew'], kcal: 16, p: 0.7, f: 0.1, c: 3.4, unit: 15 },
  { keys: ['awokado'], kcal: 160, p: 2, f: 15, c: 9, unit: 170 },
  { keys: ['banan'], kcal: 89, p: 1.1, f: 0.3, c: 23, unit: 120 },
  { keys: ['jablk'], kcal: 52, p: 0.3, f: 0.2, c: 14, unit: 180 },
  { keys: ['gruszk'], kcal: 57, p: 0.4, f: 0.1, c: 15, unit: 170 },
  { keys: ['pomarancz', 'mandaryn'], kcal: 47, p: 0.9, f: 0.1, c: 12, unit: 150 },
  { keys: ['truskawk', 'malin', 'borowk'], kcal: 40, p: 0.8, f: 0.4, c: 9, unit: 250 },
  { keys: ['chleb', 'bulk', 'bagiet', 'pieczyw', 'kajzer', 'rogal'], kcal: 240, p: 7, f: 2, c: 47, unit: 500 },
  { keys: ['tortill'], kcal: 300, p: 8, f: 7, c: 50, unit: 60 },
  { keys: ['makaron', 'spaghetti', 'penne'], kcal: 360, p: 12, f: 1.5, c: 72, unit: 500 },
  { keys: ['ryz'], kcal: 350, p: 7, f: 0.7, c: 78, unit: 1000 },
  { keys: ['kasz'], kcal: 345, p: 12, f: 2.5, c: 70, unit: 400 },
  { keys: ['platki', 'owsian', 'musli'], kcal: 370, p: 13, f: 7, c: 60, unit: 500 },
  { keys: ['maka'], kcal: 350, p: 10, f: 1.2, c: 73, unit: 1000 },
  { keys: ['fasol', 'ciecierzyc', 'soczewic'], kcal: 110, p: 7, f: 0.5, c: 18, unit: 400 },
  { keys: ['orzech', 'migdal'], kcal: 620, p: 18, f: 55, c: 12, unit: 200 },
  { keys: ['olej', 'oliw'], kcal: 884, p: 0, f: 100, c: 0, unit: 1000 },
  { keys: ['cukier', 'miod'], kcal: 380, p: 0.3, f: 0, c: 95, unit: 1000 },
  { keys: ['czekolad'], kcal: 540, p: 7, f: 31, c: 56, unit: 100 },
  { keys: ['chips', 'ciastk'], kcal: 500, p: 6, f: 25, c: 60, unit: 150 },
  { keys: ['sos sojow', 'soj'], kcal: 60, p: 8, f: 0, c: 6, unit: 150 },
  { keys: ['ketchup'], kcal: 100, p: 1.5, f: 0.2, c: 23, unit: 500 },
  { keys: ['majonez'], kcal: 680, p: 1, f: 75, c: 2, unit: 400 },
  { keys: ['sok'], kcal: 45, p: 0.5, f: 0.1, c: 10.5, unit: 1000 },
  { keys: ['woda'], kcal: 0, p: 0, f: 0, c: 0, unit: 1500 },
  { keys: ['cola', 'napoj', 'lemoniad'], kcal: 42, p: 0, f: 0, c: 10.6, unit: 500 },
];
/* Średnie wartości dla kategorii, gdy nie znamy produktu (szacunek) */
const NUTRITION_BY_CAT = {
  nabial: { kcal: 150, p: 10, f: 9, c: 5, unit: 250 }, mieso: { kcal: 200, p: 20, f: 12, c: 0, unit: 400 },
  warzywa: { kcal: 30, p: 1.5, f: 0.3, c: 6, unit: 150 }, owoce: { kcal: 55, p: 0.8, f: 0.3, c: 13, unit: 150 },
  pieczywo: { kcal: 250, p: 8, f: 3, c: 48, unit: 400 }, suche: { kcal: 350, p: 10, f: 3, c: 65, unit: 500 },
  napoje: { kcal: 40, p: 0, f: 0, c: 10, unit: 1000 }, sosy: { kcal: 80, p: 2, f: 3, c: 10, unit: 300 },
  mrozonki: { kcal: 150, p: 5, f: 6, c: 18, unit: 450 }, inne: { kcal: 150, p: 5, f: 5, c: 20, unit: 250 },
};

/* Gramatura składników na 1 porcję (w kolejności składników przepisu) */
const RECIPE_GRAMS = {
  omlet: [120, 50, 30, 5], jajecznica: [120, 10, 60, 10], spaghetti: [100, 125, 40, 20],
  'kurczak-ryz': [150, 70, 100, 40], leczo: [200, 150, 60, 60], kanapki: [80, 40, 60, 10],
  smoothie: [120, 150, 20], twarozek: [125, 50, 60, 15], nalesniki: [125, 50, 60, 75],
  'ryz-warzywa': [70, 60, 150, 10], 'zupa-pomidorowa': [150, 30, 30, 30], salatka: [120, 60, 100, 60],
  owsianka: [50, 200, 60, 30], 'placki-bananowe': [120, 100, 50],
};
RECIPES.forEach((r) => (RECIPE_GRAMS[r.id] || []).forEach((g, i) => { if (r.ingredients[i]) r.ingredients[i].g = g; }));

/* Rodzaje diet */
const DIET_TYPES = {
  standard: { label: 'Zwykła (zbilansowana)' },
  wysokobialkowa: { label: 'Wysokobiałkowa' },
  wege: { label: 'Wegetariańska', gen: 'wegetariańskiej', excludeCats: ['mieso'] },
  wegan: { label: 'Wegańska', gen: 'wegańskiej', excludeCats: ['mieso', 'nabial'] },
  keto: { label: 'Keto / niskowęglowodanowa', maxCarbsPerMeal: 15 },
};
const MEAL_SHARE = { 'śniadanie': 0.25, 'obiad': 0.35, 'kolacja': 0.25, 'przekąska': 0.15 };

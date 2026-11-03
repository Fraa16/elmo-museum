/**
 * Speisekarte: alle 55 Gerichte der Druckkarte (175 × 54 cm), abgetippt und
 * mit Francesco abgeglichen. Preise in Cent, inkl. MwSt.
 *
 * Bereinigt für die Website: keine Mittelpunkte und Schrägstriche in Namen,
 * Kategorien mit „und“. Die Aussage „Ohne Zusatzstoffe“ von der Karte wird
 * bewusst nicht übernommen (rechtlich offen, siehe Strategie-Dokument).
 * Arabische Namen bei allen Gerichten, so wie libanesische Karten sie führen;
 * westliche Gerichte lautschriftlich (Burger, Pulled Beef).
 * TODO: Arabische Schreibweisen von Momo gegenlesen lassen, besonders
 * Mantufe (منتوفة), Kapuziner-Teller und Makrele (إسقمري oder سكمبري).
 *
 * TODO: Rückfragen an Momo (vegan bei Sauce und Brot, Preis Sayyudiyye-Platte,
 * Schreibweisen, Allergene, Halal) vor dem Start klären.
 */

export type Diet = 'vegan' | 'vegetarisch' | null;

export interface Extra {
  label: string;
  price: number;
}

export interface Dish {
  name: string;
  /** Arabischer Name. */
  ar?: string;
  /** Cent; zwei Preise bei „Batata oder Batata Harra“. */
  price: number | [number, number];
  /** „ab“-Preis, z. B. Mittagstisch. */
  priceFrom?: boolean;
  /** Zusatz zum Preis, z. B. „Portion“ oder „einzeln“. */
  unit?: string;
  description: string;
  diet: Diet;
  extras?: Extra[];
}

export interface MenuCategory {
  id: string;
  title: string;
  intro: string;
  extras?: Extra[];
  items: Dish[];
}

export const menu: MenuCategory[] = [
  {
    id: "sandwiches",
    title: "Sandwiches",
    intro: "Im arabischen Fladenbrot mit Salat, Pickles und Sauce. Batata ist bei allen Fleisch-Variationen im Sandwich enthalten.",
    extras: [{label: "Ei", price: 100}, {label: "Cheddar", price: 150}],
    items: [
      { name: "Hähnchen-Shawarma", ar: "شاورما دجاج", price: 700, description: "Selbst mariniertes Hähnchen, von Hand auf den Spieß geschichtet.", diet: null },
      { name: "Double-Shawarma", ar: "شاورما دبل", price: 1350, description: "Doppelte Länge, doppeltes Gewicht.", diet: null },
      { name: "Rind-Shawarma", ar: "شاورما لحمة", price: 850, description: "Hauchdünn geschnitten und frisch gegrillt.", diet: null },
      { name: "Pulled Beef Sandwich", ar: "بولد بيف", price: 850, description: "Zartes Pulled Beef im arabischen Fladenbrot.", diet: null },
      { name: "Kafta", ar: "كفتة", price: 750, description: "Rinderhack vom Roastbeef, nach libanesischer Art von Hand geformt und gegrillt.", diet: null },
      { name: "Elmo Burger Classic", ar: "برغر إلمو كلاسيك", price: 800, unit: "einzeln", description: "Kafta-Patty à la Elmo 2017.", diet: null },
      { name: "Taouk", ar: "طاووق", price: 750, description: "Zartes Hähnchenfleisch in orientalischer Marinade, frisch vom Grill.", diet: null },
      { name: "Libanesische Sujuk", ar: "سجق", price: 750, description: "Kräftig gewürzt nach libanesischer Art.", diet: null },
      { name: "Fisch-Sandwich", ar: "سندويش سمك", price: 750, description: "Gegrilltes Makrelenfleisch im Brot.", diet: null },
      { name: "Pulled Chicken Sandwich", ar: "بولد تشيكن", price: 750, description: "Natur gekochtes Hähnchenfleisch, gezupft im Fladenbrot.", diet: null },
      { name: "Gebratene Hähnchenleber", ar: "سودة دجاج", price: 700, description: "Auf dem Gasherd mit frischem Knoblauch und Zitronensaft zubereitet.", diet: null },
      { name: "Rinderzunge", ar: "لسانات", price: 800, description: "Gegart und anschließend vom Grill, mit frischem Knoblauch und Zitronensaft.", diet: null },
      { name: "Hausgemachte Falafel", ar: "فلافل", price: 700, description: "Kichererbsenbällchen mit Kräutern, frisch frittiert.", diet: "vegan" },
      { name: "Grillgemüse-Sandwich", ar: "خضار مشوية", price: 700, description: "Aubergine, Zucchini und saisonales Gemüse, frisch vom Grill.", diet: "vegan" },
      { name: "Mujaddara-Sandwich", ar: "مجدرة", price: 700, description: "Rote Linsen und Reis gemeinsam in einem Topf gekocht, mit würzigen Röstzwiebeln.", diet: "vegan" },
      { name: "Batata oder Batata Harra", ar: "بطاطا أو بطاطا حرة", price: [600, 650], description: "Handgeschnittene, knusprige Kartoffeln im arabischen Fladenbrot, wahlweise scharf orientalisch gewürzt.", diet: "vegan" },
    ],
  },
  {
    id: "burger",
    title: "Burger-Kreationen",
    intro: "Im Brioche-Bun mit extra Batata-Portion.",
    items: [
      { name: "Mantufe Brioche", ar: "منتوفة بريوش", price: 1050, description: "Zartes Pulled Chicken.", diet: null },
      { name: "Pulled Beef Brioche-Burger", ar: "برغر بولد بيف", price: 1150, description: "Zartes Pulled Beef mit Dibis Smoke Soße.", diet: null },
      { name: "Kafta-Burger", ar: "برغر كفتة", price: 1050, description: "Kafta-Patty, Tomate, Lefet und Sumach-Zwiebeln.", diet: null },
      { name: "Broasted Burger", ar: "برغر بروستد", price: 1050, description: "Knusprig paniertes Hähnchen mit unserer Hot Honey Cream.", diet: null },
      { name: "Double Elmo Cheese", ar: "دبل إلمو تشيز", price: 1600, description: "Zwei Kafta-Patties, doppelter Cheddar, Pickles, Sumach-Zwiebeln und White Loomi Pepper Cream.", diet: null },
    ],
  },
  {
    id: "broasted",
    title: "Broasted",
    intro: "Mit Batata und Salat.",
    items: [
      { name: "Halbes Hähnchen", ar: "نص فروج بروستد", price: 950, description: "Knusprig paniert und in der Hochdruckfritteuse gegart.", diet: null },
      { name: "Broasted Brust und Tenders", ar: "تندرز بروستد", price: 750, description: "Knusprig panierte Hähnchenbruststreifen.", diet: null },
      { name: "Broasted Wings", ar: "جوانح بروستد", price: 750, description: "Knusprig panierte Hähnchenflügel.", diet: null },
    ],
  },
  {
    id: "teller",
    title: "Teller und Portionen",
    intro: "",
    items: [
      { name: "Elmo-Teller", ar: "صحن إلمو", price: 1790, description: "Lammkotelett, Kafta, Shawarma, Falafel, Reis und Salat.", diet: null },
      { name: "Shawarma-Teller", ar: "صحن شاورما", price: 1250, description: "Hähnchen-Shawarma mit Reis oder Batata, Salat und Sauce.", diet: null },
      { name: "Rindfleisch-Teller", ar: "صحن شاورما لحمة", price: 1350, description: "Rind-Shawarma mit Reis oder Batata, Salat und Sauce.", diet: null },
      { name: "Kafta-Teller", ar: "صحن كفتة", price: 1250, description: "Gegrillte Kafta mit Reis oder Batata, Salat und Sauce.", diet: null },
      { name: "Lammkotelett-Teller", ar: "صحن ريش غنم", price: 1600, description: "3 Lammkoteletts mit Reis.", diet: null },
      { name: "Sujuk-Teller", ar: "صحن سجق", price: 1250, description: "Libanesische Sujuk mit Reis oder Batata, Salat und Sauce.", diet: null },
      { name: "Falafel-Teller", ar: "صحن فلافل", price: 1250, description: "Hausgemachte Falafel mit Reis oder Batata, Salat und Sauce.", diet: "vegan" },
      { name: "Gemüseteller", ar: "صحن خضار", price: 1150, description: "Gegrilltes Gemüse mit Reis oder Batata, Salat und Sauce.", diet: "vegan" },
      { name: "Batata oder Batata Harra", ar: "بطاطا أو بطاطا حرة", price: [450, 550], description: "Handgeschnittene Kartoffeln, wahlweise scharf orientalisch gewürzt.", diet: "vegan" },
    ],
  },
  {
    id: "mezze",
    title: "Mezze und Salate",
    intro: "Levantinische Klassiker zum Genießen und Teilen.",
    items: [
      { name: "Hummus mit Kafta", ar: "حمص مع كفتة", price: 950, description: "Hummus mit frisch gebratenen Kafta-Stückchen und Brot.", diet: null },
      { name: "Fatteh mit Rindfleisch", ar: "فتة باللحمة", price: 1200, description: "Fatteh mit zartem Rindfleisch aus dem Sud.", diet: null },
      { name: "Frittierte Calamari Portion", ar: "كاليماري مقلي", price: 1350, description: "Knusprig frittierte Calamari als Portion.", diet: null },
      { name: "Kapuziner-Teller", ar: "صحن كابوتسينر", price: 1450, description: "Salat mit verschiedenem Grillfleisch nach arabischer Art.", diet: null },
      { name: "Hummus und Brot", ar: "حمص", price: 650, description: "Mit warmem Brot und Olivenöl.", diet: "vegan" },
      { name: "Ful", ar: "فول", price: 650, description: "Warme Ackerbohnen mit Zitrone, Knoblauch und Olivenöl.", diet: "vegan" },
      { name: "Taboulé", ar: "تبولة", price: 650, description: "Petersiliensalat mit Tomate, Bulgur, Zitrone und Olivenöl.", diet: "vegan" },
      { name: "Fatteh vegetarisch", ar: "فتة حمص", price: 790, description: "Geröstetes Brot und Kichererbsen mit warmer Joghurt-Tahini-Sauce.", diet: "vegetarisch" },
      { name: "Reis mit selbstgemachtem Joghurt", ar: "رز مع لبن", price: 800, description: "Arabischer Reis mit Fadennudeln und selbstgemachtem Joghurt, verfeinert mit arabischem Ghee.", diet: "vegetarisch" },
    ],
  },
  {
    id: "suppen",
    title: "Suppen",
    intro: "",
    items: [
      { name: "Lammsuppe", ar: "شوربة لحم غنم", price: 700, description: "Kräftige Brühe mit zartem Lammfleisch.", diet: null },
      { name: "Frikeh-Suppe", ar: "شوربة فريكة", price: 550, description: "Levantinische Grünkernsuppe.", diet: "vegan", extras: [{label: "Mit Hähnchenfleisch", price: 150}] },
    ],
  },
  {
    id: "tageskueche",
    title: "Tagesküche und Specials",
    intro: "Hausgemacht und nur solange der Vorrat reicht.",
    items: [
      { name: "Mittagstisch", ar: "طبق اليوم", price: 990, priceFrom: true, description: "Wechselndes Tagesgericht mit Reis.", diet: null },
      { name: "Elmo Steak-Teller", ar: "صحن ستيك إلمو", price: 1790, description: "Ca. 200 g Roastbeef vom Grill, dazu Reis oder Batata und Salat.", diet: null },
      { name: "Makrele", ar: "سمك إسقمري", price: 1650, description: "Wahlweise gebraten oder gegrillt, dazu Reis und Salat.", diet: null },
      { name: "Sayyudiyye", ar: "صيادية", price: 1250, unit: "Portion", description: "Makrele in Reis nach palästinensischer Art, dazu Salat. Auch als Platte für 4 Personen.", diet: null },
      { name: "Elmo-Grill Platte", ar: "مشاوي إلمو", price: 8000, description: "Gemischte Grillplatte für 4 Personen.", diet: null },
      { name: "Mujaddara", ar: "مجدرة", price: 1050, description: "Rote Linsen und Reis gemeinsam in einem Topf gekocht, mit würzigen Röstzwiebeln und selbstgemachtem Joghurt.", diet: "vegetarisch" },
    ],
  },
  {
    id: "schueler",
    title: "Für Schüler",
    intro: "Bis 14 Jahre.",
    items: [
      { name: "Mini-Shawarma", ar: "ميني شاورما", price: 500, description: "Shawarma im arabischen Fladenbrot, kleinere Portion.", diet: null },
      { name: "Mini Pulled Chicken", ar: "ميني بولد تشيكن", price: 500, description: "Im arabischen Fladenbrot, kleinere Portion.", diet: null },
    ],
  },
  {
    id: "getraenke",
    title: "Getränke",
    intro: "",
    items: [
      { name: "Hausgemachter Labban (Ayran)", ar: "لبن", price: 250, description: "Aus unserem selbstgemachten Joghurt.", diet: null },
      { name: "Wasser", ar: "مياه", price: 200, description: "", diet: null },
      { name: "Softgetränke", ar: "مشروبات غازية", price: 250, description: "", diet: null },
    ],
  },
];

/** Gerichte für die Startseite (Auswahl wie im Design B2). */
const FEATURED: [string, string][] = [
  ['sandwiches', 'Hähnchen-Shawarma'],
  ['teller', 'Elmo-Teller'],
  ['mezze', 'Fatteh mit Rindfleisch'],
  ['tageskueche', 'Sayyudiyye'],
  ['teller', 'Falafel-Teller'],
  ['tageskueche', 'Mujaddara'],
  ['mezze', 'Hummus mit Kafta'],
  ['mezze', 'Taboulé'],
];

export function featuredDishes(): Dish[] {
  return FEATURED.map(([cat, name]) => {
    const dish = menu.find((c) => c.id === cat)?.items.find((i) => i.name === name);
    if (!dish) throw new Error(`Gericht fehlt in der Karte: ${name}`);
    return dish;
  });
}

export const dishCount = menu.reduce((n, c) => n + c.items.length, 0);

/** 1250 → „12,50“ */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function priceLabel(dish: Pick<Dish, 'price' | 'priceFrom'>): string {
  const text = Array.isArray(dish.price) ? dish.price.map(formatPrice).join(' / ') : formatPrice(dish.price);
  return dish.priceFrom ? `ab ${text}` : text;
}

/**
 * Kurze Erklärungen arabischer Begriffe. Entwurf, Freigabe durch Momo offen.
 * TODO: Mantufe von Momo erklären lassen.
 */
export const glossary: { term: string; text: string }[] = [
  { term: 'Batata', text: 'Handgeschnittene Kartoffeln.' },
  { term: 'Broasted', text: 'Paniertes Hähnchen, in der Hochdruckfritteuse gegart.' },
  { term: 'Dibis', text: 'Dicker Sirup aus Granatapfel.' },
  { term: 'Fatteh', text: 'Geröstetes Brot mit Kichererbsen und warmer Joghurtsauce.' },
  { term: 'Frikeh', text: 'Grün geernteter, gerösteter Weizen.' },
  { term: 'Ful', text: 'Warme Ackerbohnen mit Zitrone, Knoblauch und Olivenöl.' },
  { term: 'Ghee', text: 'Geklärte Butter.' },
  { term: 'Harra', text: 'Arabisch für „scharf“.' },
  { term: 'Labban', text: 'Erfrischendes Joghurtgetränk aus unserem selbstgemachten Joghurt, auch als Ayran bekannt.' },
  { term: 'Lefet', text: 'Eingelegte Rüben.' },
  { term: 'Loomi', text: 'Getrocknete Limette.' },
  { term: 'Sujuk', text: 'Kräftig gewürzte Wurst nach libanesischer Art.' },
  { term: 'Sumach', text: 'Säuerliches, rotes Gewürz aus getrockneten Beeren.' },
  { term: 'Taouk', text: 'Marinierte Hähnchenstücke vom Grill.' },
];

/**
 * Alle Inhalte des Museums an einem Ort.
 *
 * Texte (kicker, headline, subline, paragraphs) wortgetreu aus dem Briefing,
 * Abschnitt 7 – nicht umschreiben. `**…**` markiert Hervorhebungen, wie sie
 * im Kunden-PDF (Seiten 5–13) fett gesetzt sind.
 *
 * Diese Datei wird auch von scripts/generate-qr.mjs direkt mit Node gelesen:
 * deshalb nur reine Daten, keine Bild- oder Astro-Imports. Die Bilder werden
 * über `image` (Dateiname in src/assets/stations/) in src/lib/images.ts
 * aufgelöst.
 */

export interface Quiz {
  question: string;
  options: string[];
  /** Index der richtigen Antwort in `options`. */
  answer: number;
  /** Auflösungszeile bei richtigem Tipp. */
  right: string;
  /** Auflösungszeile bei falschem Tipp. */
  wrong: string;
}

export interface Source {
  label: string;
  url?: string;
}

export interface Station {
  /** Zweistellige Nummer, entspricht der QR-ID. */
  id: string;
  /** QR-ID, z. B. „ELMO-02“. */
  qrId: string;
  /** Pfadsegment unter /museum/ – verbindlich, nie ändern (steht im QR-Code). */
  slug: string;
  number: number;
  title: string;
  kicker: string;
  headline: string;
  subline: string;
  paragraphs: string[];
  /** Dateiname in src/assets/stations/ (Nummer = QR-ID, nicht Position im Flur). */
  image: string;
  alt: string;
  /** `null` blendet das Rate-Element für diese Station aus. */
  quiz: Quiz | null;
  sources: Source[];
}

export const MUSEUM_PATH = '/museum';

/** Startseite – eigener QR-Code ELMO-00. */
export const start = {
  qrId: 'ELMO-00',
  slug: 'start',
  title: 'Start / Übersicht',
  path: MUSEUM_PATH,
} as const;

export const stations: Station[] = [
  {
    // TODO: Freigabe Momo – persönliche Aussagen und Ortsangabe Al Bayada.
    // Keine Quelle (persönliche Geschichte), daher kein Quellenblock.
    id: '01',
    qrId: 'ELMO-01',
    slug: '01-al-bayada-heimat',
    number: 1,
    title: 'Unsere Heimat',
    kicker: 'AL BAYADA · SÜDLIBANON',
    headline: 'Du siehst einen Sonnenuntergang.',
    subline: 'Wir sehen unsere Heimat.',
    paragraphs: [
      'Auf den ersten Blick könnte dieses Bild irgendwo in Griechenland oder Italien entstanden sein. Doch willkommen in **Al Bayada, an der Küste des Südlibanon.**',
      'Hier treffen die Wellen des Mittelmeers auf helle Felsen. Nicht weit entfernt liegt das Dorf Al Mansouri.',
      'Für viele Menschen ist das einfach eine wunderschöne Küste. **Für uns ist es viel mehr.**',
      'Denn aus dieser Gegend stammt unsere Familie. Hier liegen unsere Wurzeln – lange bevor es Elmo Shawarma in Schwäbisch Gmünd gab.',
      'Tausende Kilometer liegen zwischen diesem Ort und unserem Restaurant. Doch manche Verbindungen bleiben bestehen, egal wie weit man reist.',
      '**Deshalb hängt dieses Bild hier. Nicht nur als Dekoration, sondern als ein Stück unserer Heimat.**',
    ],
    image: '01.jpg',
    alt: 'Sonnenuntergang über dem Mittelmeer: Wellen rollen an den Strand, dahinter die hellen Felsen der Küste von Al Bayada',
    quiz: {
      question: 'Wo glaubst du, ist das?',
      options: ['Griechenland', 'Italien', 'Südlibanon'],
      answer: 2,
      right: 'Richtig – oder überrascht? Das ist Al Bayada im Südlibanon.',
      wrong: 'Fast. Es ist Al Bayada im Südlibanon.',
    },
    sources: [],
  },
  {
    id: '02',
    qrId: 'ELMO-02',
    slug: '02-baalbek-bacchustempel',
    number: 2,
    title: 'Bacchustempel',
    kicker: 'BAALBEK · LIBANON',
    headline: 'Du dachtest, das wäre in Athen?',
    subline: 'Falsch gedacht. Willkommen in Baalbek!',
    paragraphs: [
      'Vor fast 2.000 Jahren schufen die Römer im heutigen Libanon eine der gewaltigsten Tempelanlagen ihrer Zeit.',
      'Hier in Baalbek steht der sogenannte **Bacchustempel**. Seine mächtigen Säulen, steinernen Ornamente und monumentalen Proportionen beeindrucken bis heute.',
      'Aber die Geschichte dieses Ortes begann schon vor den Römern: Baalbek war ein bedeutendes Heiligtum und wurde in der Antike auch **Heliopolis – Stadt der Sonne** – genannt.',
      'Das Besondere? Baalbek gehört zu den eindrucksvollsten Beispielen römischer Architektur überhaupt. Seit 1984 ist die Stätte UNESCO-Weltkulturerbe.',
      '**Griechische Tempel kennst du vielleicht. Doch auch mitten im Libanon wartet eine antike Welt von gewaltigem Ausmaß.**',
    ],
    image: '02.jpg',
    alt: 'Der Bacchustempel in Baalbek mit seinen langen Säulenreihen vor einem rosa-goldenen Abendhimmel',
    quiz: {
      question: 'Wo steht dieser Tempel?',
      options: ['Athen', 'Rom', 'Baalbek, Libanon'],
      answer: 2,
      right: 'Richtig – oder überrascht? Das ist Baalbek im Libanon.',
      wrong: 'Fast. Es ist Baalbek im Libanon.',
    },
    sources: [
      { label: 'UNESCO World Heritage Centre – Baalbek', url: 'https://whc.unesco.org/en/list/294/' },
    ],
  },
  {
    id: '03',
    qrId: 'ELMO-03',
    slug: '03-baalbek-jupitertempel',
    number: 3,
    title: 'Jupitertempel',
    kicker: 'BAALBEK · LIBANON',
    headline: '54 Säulen. Nur sechs stehen noch.',
    subline: 'Die letzten Giganten von Baalbek.',
    paragraphs: [
      'Hier stand der **Jupitertempel von Baalbek**, eines der monumentalsten Heiligtümer der römischen Welt.',
      'Einst umgaben **54 Säulen** den riesigen Tempel. Heute ragen nur noch sechs davon auf – rund 20 Meter hoch, beinahe wie ein sechsstöckiges Gebäude.',
      'Jahrhunderte vergingen. Erdbeben, Verfall und die Wiederverwendung von Steinen veränderten die Anlage. Die sechs Säulen und ihr mächtiges Gebälk blieben dennoch erhalten.',
      'Was heute wie eine Ruine aussieht, erzählt von großartiger Baukunst und von der gewaltigen Bedeutung Baalbeks in der Antike.',
      '**Manchmal genügen sechs Säulen, um fast 2.000 Jahre Geschichte sichtbar zu machen.**',
    ],
    image: '03.jpg',
    alt: 'Die sechs verbliebenen Säulen des Jupitertempels in Baalbek über einem reich verzierten Gebälk mit Löwenkopf',
    quiz: {
      question: 'Wie viele Säulen hatte dieser Tempel einst?',
      options: ['12', '30', '54'],
      answer: 2,
      right: 'Richtig: 54 Säulen. Heute stehen nur noch sechs.',
      wrong: 'Mehr! Es waren 54 Säulen – heute stehen nur noch sechs.',
    },
    sources: [
      { label: 'Deutsches Archäologisches Institut – Jupitertempel', url: 'https://www.dainst.org/forschung/projekte/noslug/5875' },
      { label: 'University of Notre Dame – Temple of Jupiter', url: 'https://marble.nd.edu/item/9f05bd55-9085-4482-9474-15dc2d0e81c8' },
    ],
  },
  {
    // Quellen-URL im PDF-Text gekürzt; vollständige URL aus der Link-Annotation im Kunden-PDF (S. 15).
    id: '04',
    qrId: 'ELMO-04',
    slug: '04-jerusalem-felsendom',
    number: 4,
    title: 'Felsendom',
    kicker: 'JERUSALEM / AL-QUDS',
    headline: 'Du kennst die goldene Kuppel.',
    subline: 'Aber kennst du ihre Geschichte?',
    paragraphs: [
      'Mitten in Jerusalem erhebt sich der **Felsendom** – eines der bekanntesten Bauwerke der Welt.',
      'Er wurde **691/692 n. Chr.** unter dem Umayyaden-Kalifen Abd al-Malik vollendet. Damit zählt er zu den ältesten erhaltenen Meisterwerken islamischer Baukunst.',
      'Viele verwechseln ihn mit der Al-Aqsa-Moschee. Tatsächlich ist er ein eigenes Heiligtum innerhalb des weitläufigen Al-Aqsa-Geländes.',
      'Der Felsen in seinem Inneren besitzt besondere religiöse Bedeutung. In der islamischen Überlieferung wird dieser Ort mit der Himmelsreise des Propheten Muhammad verbunden. Auch im Judentum und Christentum ist die Stätte religiös bedeutsam.',
      '**Eine goldene Kuppel. Über 1.300 Jahre Geschichte. Ein Ort, der Menschen auf der ganzen Welt bewegt.**',
    ],
    image: '04.jpg',
    alt: 'Blick über die Altstadt von Jerusalem auf den Felsendom mit seiner goldenen Kuppel im Abendlicht',
    quiz: {
      question: 'Ist das die Al-Aqsa-Moschee?',
      options: ['Ja', 'Nein, das ist der Felsendom'],
      answer: 1,
      right: 'Richtig. Der Felsendom ist ein eigenes Heiligtum auf dem Al-Aqsa-Gelände.',
      wrong: 'Eine häufige Verwechslung: Das ist der Felsendom.',
    },
    sources: [
      { label: 'Metropolitan Museum of Art – The Dome of the Rock (Byzantium and Islam, 2012)', url: 'https://www.metmuseum.org/exhibitions/listings/2012/byzantium-and-islam/blog/where-in-the-world/posts/dome-of-the-rock' },
    ],
  },
  {
    // TODO: Freigabe Momo – Ortsangaben Al Bayada / Al Mansouri.
    // Quellen-URL im PDF-Text gekürzt; vollständige URL aus der Link-Annotation im Kunden-PDF (S. 15).
    id: '05',
    qrId: 'ELMO-05',
    slug: '05-al-bayada-natur',
    number: 5,
    title: 'Küste & Natur',
    kicker: 'AL BAYADA · SÜDLIBANON',
    headline: 'Eine Küste mit einem Geheimnis.',
    subline: 'Am Meer beginnt ein kleines Wunder.',
    paragraphs: [
      'Türkisblaues Wasser, helle Felsen und der Blick auf das Mittelmeer: **Al Bayada** zeigt eine stille, wunderschöne Seite des Südlibanon.',
      'Doch auch die nahe gelegene Küste von **Al Mansouri** bewahrt ein außergewöhnliches Naturerlebnis.',
      'Dort legen bedrohte Meeresschildkröten ihre Eier im Sand ab. Freiwillige schützen die Nester und helfen, dass die Jungtiere sicher ihren Weg zum Wasser finden.',
      'Im Jahr **2024 wurden am Strand von Al Mansouri 51 Nester** überwacht und geschützt – trotz schwieriger Umstände.',
      'Während Menschen am Meer den Sonnenuntergang genießen, beginnt für winzige Schildkröten eine lange Reise.',
      '**Die schönsten Geschichten der Natur passieren manchmal ganz in der Nähe unserer Heimat.**',
    ],
    image: '05.jpg',
    alt: 'Helle Steilküste bei Al Bayada über türkisblauem Meer, die Abendsonne steht tief über der Küstenlinie',
    quiz: {
      question: 'Wer schlüpft an diesem Küstenabschnitt?',
      options: ['Möwen', 'Meeresschildkröten', 'Krabben'],
      answer: 1,
      right: 'Richtig – hier schlüpfen Meeresschildkröten.',
      wrong: 'Fast. Hier schlüpfen Meeresschildkröten.',
    },
    sources: [
      { label: 'Mongabay (2024) – Meeresschildkröten Al Mansouri', url: 'https://news.mongabay.com/2024/09/amid-haze-of-war-lebanese-activists-helped-turtle-hatchlings-journey-to-sea/' },
    ],
  },
  {
    id: '06',
    qrId: 'ELMO-06',
    slug: '06-beirut-raouche',
    number: 6,
    title: 'Raouché-Felsen',
    kicker: 'BEIRUT · LIBANON',
    headline: 'Zwei Felsen. Eine ganze Stadt.',
    subline: 'Beiruts berühmtester Blick aufs Meer.',
    paragraphs: [
      'Mitten vor der Küste Beiruts ragen zwei mächtige Felsen aus dem Mittelmeer: die **Raouché-Felsen**, auch Pigeon Rocks genannt.',
      'Die Natur hat hier über lange Zeit eine eindrucksvolle Küstenlandschaft geschaffen. Der größere Felsen besitzt einen markanten Durchbruch, durch den man das Meer sehen kann.',
      'Heute sind die Felsen eines der bekanntesten Wahrzeichen der libanesischen Hauptstadt. Menschen treffen sich an der Uferpromenade, fotografieren die Aussicht und beobachten, wie die Sonne langsam im Mittelmeer versinkt.',
      'Beirut ist eine Stadt voller Gegensätze, Erinnerungen und Lebensfreude. Die beiden Felsen sind zu einem Symbol für ihre Küste geworden.',
      '**Manchmal erzählt ein einziger Sonnenuntergang mehr über eine Stadt als tausend Worte.**',
    ],
    image: '06.jpg',
    alt: 'Die zwei Raouché-Felsen ragen vor Beirut aus dem Mittelmeer, dahinter geht die Sonne unter',
    quiz: {
      question: 'Wo stehen diese Felsen?',
      options: ['Capri', 'Algarve', 'Beirut'],
      answer: 2,
      right: 'Richtig – oder überrascht? Das sind die Raouché-Felsen in Beirut.',
      wrong: 'Fast. Das sind die Raouché-Felsen in Beirut.',
    },
    sources: [
      { label: 'Wikipedia – Raouché', url: 'https://en.wikipedia.org/wiki/Raouch%C3%A9' },
    ],
  },
  {
    // TODO: Freigabe Momo – Ortsangabe Tyros.
    id: '07',
    qrId: 'ELMO-07',
    slug: '07-tyros-sour',
    number: 7,
    title: 'Antikes Tyros',
    kicker: 'TYROS / SOUR · SÜDLIBANON',
    headline: 'Diese Stadt beherrschte einst die Meere.',
    subline: 'Tyros – die Geschichte hinter den Säulen.',
    paragraphs: [
      'Willkommen in **Tyros**, auf Arabisch **Sour**, einer der großen Städte der phönizischen Welt.',
      'Ihre Händler und Seefahrer waren im gesamten Mittelmeer unterwegs. Von Tyros aus entstanden wichtige Handelsverbindungen und Kolonien – darunter das berühmte Karthago in Nordafrika.',
      'Das Überraschende: Ein großer Teil der Stadt lag einst auf einer Insel. Als **Alexander der Große** Tyros im Jahr 332 v. Chr. belagerte, ließ er einen Damm vom Festland zur Insel aufschütten. Dadurch veränderte sich die Küste dauerhaft.',
      'Später errichteten die Römer hier Straßen, Säulenhallen und weitere prächtige Bauwerke. Seit 1984 steht Tyros auf der UNESCO-Welterbeliste.',
      '**Was heute still zwischen antiken Steinen liegt, war einst ein Tor zur ganzen Mittelmeerwelt.**',
    ],
    image: '07.jpg',
    alt: 'Silhouetten antiker Säulen und Bäume in Tyros vor einem glühend orangefarbenen Sonnenuntergang',
    quiz: {
      question: 'Welche berühmte Stadt gründeten Seefahrer aus Tyros?',
      options: ['Rom', 'Karthago', 'Alexandria'],
      answer: 1,
      right: 'Richtig – Karthago in Nordafrika.',
      wrong: 'Fast. Es war Karthago in Nordafrika.',
    },
    sources: [
      { label: 'UNESCO World Heritage Centre – Tyre', url: 'https://whc.unesco.org/en/list/299/' },
    ],
  },
  {
    id: '08',
    qrId: 'ELMO-08',
    slug: '08-beirut-glaubensvielfalt',
    number: 8,
    title: 'Moschee & Kirche',
    kicker: 'BEIRUT · LIBANON',
    headline: 'Wenn Minarette auf Kirchtürme treffen.',
    subline: 'Zwei Gotteshäuser. Eine Stadt.',
    paragraphs: [
      'Dieses Bild zeigt einen besonderen Ort im Zentrum Beiruts.',
      'Die große **Mohammed-al-Amin-Moschee** mit ihren blauen Kuppeln und vier Minaretten wurde 2008 eingeweiht. Direkt daneben steht die **maronitische St.-Georgs-Kathedrale**, deren Geschichte ins 19. Jahrhundert zurückreicht.',
      'Auf engem Raum begegnen sich hier zwei Religionen, unterschiedliche Baustile und viele Kapitel libanesischer Geschichte.',
      'Der Libanon ist seit Jahrhunderten Heimat verschiedener religiöser Gemeinschaften. Ihr Zusammenleben war nicht immer einfach – doch ihre Architektur prägt das Land bis heute.',
      '**Dieses Bild erzählt nicht nur von zwei Gebäuden. Es zeigt, wie vielfältig die Geschichte Beiruts ist.**',
    ],
    image: '08.jpg',
    alt: 'Die Mohammed-al-Amin-Moschee mit blauen Kuppeln und Minaretten neben der St.-Georgs-Kathedrale in Beirut',
    quiz: {
      question: 'Wie alt ist diese Moschee?',
      options: ['ca. 500 Jahre', 'ca. 200 Jahre', 'eingeweiht 2008'],
      answer: 2,
      right: 'Richtig – sie wurde erst 2008 eingeweiht.',
      wrong: 'Überraschend jung: Sie wurde 2008 eingeweiht.',
    },
    sources: [
      { label: 'Wikipedia – Mohammed-al-Amin-Moschee', url: 'https://de.wikipedia.org/wiki/Mohammed-al-Amin-Moschee' },
    ],
  },
  {
    id: '09',
    qrId: 'ELMO-09',
    slug: '09-sidon-seeburg',
    number: 9,
    title: 'Seeburg von Sidon',
    kicker: 'SIDON / SAIDA · LIBANON',
    headline: 'Warum baut man eine Burg ins Meer?',
    subline: 'Die steinerne Wächterin von Sidon.',
    paragraphs: [
      'Willkommen in **Sidon**, auf Arabisch **Saida**, einer der alten Hafenstädte des Libanon.',
      'Im Jahr **1228** errichteten Kreuzfahrer auf einer kleinen Insel vor dem Hafen eine befestigte Burg. Von dort konnten sie den Zugang zum Hafen kontrollieren und die Stadt verteidigen.',
      'Ein schmaler, steinerner Übergang verbindet die Festung mit dem Festland. Über denselben Weg gelangen heute Besucher hinein.',
      'Doch Sidons Geschichte ist noch viel älter: Schon in der phönizischen Zeit war die Stadt ein bedeutendes Zentrum für Handel und Seefahrt.',
      'Die Burg überstand verschiedene Herrschaften, Umbauten und Konflikte.',
      '**Wo einst Soldaten Wache hielten, führt heute ein Spaziergang mitten durch Jahrhunderte Geschichte.**',
    ],
    image: '09.jpg',
    alt: 'Die Seeburg von Sidon im Meer: Ein steinerner Damm führt zum Burgtor, dahinter der Abendhimmel',
    quiz: {
      question: 'Wer baute diese Burg ins Meer?',
      options: ['Römer', 'Kreuzfahrer', 'Osmanen'],
      answer: 1,
      right: 'Richtig – Kreuzfahrer, im Jahr 1228.',
      wrong: 'Fast. Es waren Kreuzfahrer, im Jahr 1228.',
    },
    sources: [
      { label: 'ENI CBC MED – Sea Castle of Sidon', url: 'https://www.enicbcmed.eu/sites/default/files/2020-08/Annex%20E%20GDDs.pdf' },
    ],
  },
];

export function stationPath(station: Pick<Station, 'slug'>): string {
  return `${MUSEUM_PATH}/${station.slug}`;
}

export function nextStation(station: Station): Station | undefined {
  return stations[stations.indexOf(station) + 1];
}

/** Zerlegt einen Absatz in normale und hervorgehobene (`**…**`) Teile. */
export function splitEmphasis(text: string): { text: string; strong: boolean }[] {
  return text
    .split('**')
    .map((part, i) => ({ text: part, strong: i % 2 === 1 }))
    .filter((part) => part.text.length > 0);
}

/** Absatz ohne Hervorhebungs-Markierungen (z. B. für Meta-Beschreibungen). */
export function plainText(text: string): string {
  return text.replaceAll('**', '');
}

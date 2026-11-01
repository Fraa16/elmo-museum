/**
 * Stammdaten des Restaurants: eine Quelle für Kopfzeile, Fußzeile, Kontakt,
 * Öffnungsstatus und JSON-LD. Nur echte Angaben; Fehlendes als `null`.
 */

export const restaurant = {
  name: 'Elmo Shawarma',
  /** Inhaber laut Francesco (Vorname fehlt noch ausgeschrieben). */
  owner: 'K. El-Abdallah',
  street: 'Kapuzinergasse 6',
  postalCode: '73525',
  city: 'Schwäbisch Gmünd',
  phone: '07171 9039994',
  phoneHref: 'tel:+4971719039994',
  email: 'elmoshawarma2016@hotmail.com',
  /** TODO: Instagram-Profil von Momo. */
  instagram: null as string | null,
  since: 2017,
  slogan: 'Good food brings people together.',
  claim: 'Geschichten, die verbinden. Kultur, die bleibt.',
} as const;

/** Route in Google Maps; wird nur auf Klick geöffnet, nichts eingebettet. */
export const routeHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `${restaurant.street}, ${restaurant.postalCode} ${restaurant.city}`,
)}`;

export interface OpeningSlot {
  /** 0 = Sonntag … 6 = Samstag (wie Date.getDay). */
  days: number[];
  label: string;
  short: string;
  opens: string;
  /** „24:00“ = Mitternacht. */
  closes: string;
}

/** Öffnungszeiten laut Schild im Laden. */
export const openingHours: OpeningSlot[] = [
  { days: [1, 2, 3, 4], label: 'Montag bis Donnerstag', short: 'Mo bis Do', opens: '11:30', closes: '22:00' },
  { days: [5, 6], label: 'Freitag und Samstag', short: 'Fr und Sa', opens: '11:30', closes: '24:00' },
  { days: [0], label: 'Sonntag', short: 'So', opens: '12:00', closes: '21:00' },
];

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** JSON-LD für Google (Restaurant mit Adresse, Telefon, Zeiten). */
export function restaurantJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    url: `${siteUrl}/`,
    telephone: '+49 7171 9039994',
    email: restaurant.email,
    servesCuisine: ['Libanesisch', 'Palästinensisch', 'Arabisch'],
    menu: `${siteUrl}/speisekarte`,
    acceptsReservations: 'True',
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.street,
      postalCode: restaurant.postalCode,
      addressLocality: restaurant.city,
      addressCountry: 'DE',
    },
    openingHoursSpecification: openingHours.map((slot) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: slot.days.map((d) => SCHEMA_DAYS[d]),
      opens: slot.opens,
      closes: slot.closes === '24:00' ? '23:59' : slot.closes,
    })),
  };
}

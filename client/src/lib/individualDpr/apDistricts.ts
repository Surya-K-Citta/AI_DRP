/**
 * Andhra Pradesh districts (26) + major towns / urban centres per district
 * for Create New Latest DPR cover step.
 * Towns are municipal corporations, municipalities, nagar panchayats, and HQs.
 */

export const AP_DISTRICTS: readonly string[] = [
  'Alluri Sitharama Raju',
  'Anakapalli',
  'Ananthapuramu',
  'Annamayya',
  'Bapatla',
  'Chittoor',
  'Dr. B.R. Ambedkar Konaseema',
  'East Godavari',
  'Eluru',
  'Guntur',
  'Kakinada',
  'Krishna',
  'Kurnool',
  'Nandyal',
  'NTR',
  'Palnadu',
  'Parvathipuram Manyam',
  'Prakasam',
  'Sri Potti Sriramulu Nellore',
  'Sri Sathya Sai',
  'Srikakulam',
  'Tirupati',
  'Visakhapatnam',
  'Vizianagaram',
  'West Godavari',
  'YSR Kadapa',
] as const;

type ApDistrict = (typeof AP_DISTRICTS)[number];

/** Major towns by AP district (ULBs + district headquarters). */
const AP_TOWNS_BY_DISTRICT: Record<ApDistrict, readonly string[]> = {
  'Alluri Sitharama Raju': [
    'Paderu',
    'Araku Valley',
    'Chintapalle',
    'Rampachodavaram',
    'Maredumilli',
    'G.K. Veedhi',
  ],
  Anakapalli: ['Anakapalli', 'Narsipatnam', 'Elamanchili', 'Yelamanchili', 'Kasimkota', 'Pendurthi'],
  Ananthapuramu: [
    'Anantapuram',
    'Guntakal',
    'Tadipatri',
    'Rayadurgam',
    'Gooty',
    'Kalyandurg',
    'Uravakonda',
  ],
  Annamayya: ['Madanapalle', 'Rayachoti', 'Punganur', 'B. Kothakota', 'Rajampet', 'Kodur'],
  Bapatla: ['Bapatla', 'Chirala', 'Repalle', 'Parchur', 'Vetapalem'],
  Chittoor: ['Chittoor', 'Palamaner', 'Nagari', 'Kuppam', 'Puthalapattu', 'Bangarupalem'],
  'Dr. B.R. Ambedkar Konaseema': [
    'Amalapuram',
    'Mandapeta',
    'Ramachandrapuram',
    'Razole',
    'Mummidivaram',
    'Kothapeta',
  ],
  'East Godavari': [
    'Rajamahendravaram',
    'Kovvur',
    'Nidadavole',
    'Gokavaram',
    'Rajanagaram',
    'Korukonda',
  ],
  Eluru: ['Eluru', 'Jangareddygudem', 'Nuzvid', 'Chintalapudi', 'Denduluru', 'Bhimadole'],
  Guntur: [
    'Guntur',
    'Tenali',
    'Ponnur',
    'Mangalagiri',
    'Tadepalli',
    'Prathipadu',
    'Vatticherukuru',
  ],
  Kakinada: [
    'Kakinada',
    'Pithapuram',
    'Peddapuram',
    'Samalkota',
    'Tuni',
    'Gollaprolu',
    'Yeleswaram',
  ],
  Krishna: [
    'Machilipatnam',
    'Gudivada',
    'Pedana',
    'Vuyyuru',
    'Tadigadapa',
    'Movva',
    'Gannavaram',
  ],
  Kurnool: ['Kurnool', 'Adoni', 'Yemmiganur', 'Kodumur', 'Pattikonda', 'Alur'],
  Nandyal: ['Nandyal', 'Dhone', 'Nandikotkur', 'Allagadda', 'Atmakur', 'Banaganapalle'],
  NTR: [
    'Vijayawada',
    'Jaggayyapeta',
    'Nandigama',
    'Tiruvuru',
    'Kondapalli',
    'Ibrahimpatnam',
    'Mylavaram',
  ],
  Palnadu: [
    'Narasaraopet',
    'Chilakaluripet',
    'Macherla',
    'Piduguralla',
    'Sattenapalle',
    'Vinukonda',
    'Dachepalle',
    'Gurazala',
  ],
  'Parvathipuram Manyam': [
    'Parvathipuram',
    'Salur',
    'Palakonda',
    'Kurupam',
    'Seethampeta',
    'Komarada',
  ],
  Prakasam: [
    'Ongole',
    'Markapur',
    'Addanki',
    'Chimakurthy',
    'Darsi',
    'Giddalur',
    'Kanigiri',
  ],
  'Sri Potti Sriramulu Nellore': [
    'Nellore',
    'Gudur',
    'Kavali',
    'Atmakur',
    'Kandukur',
    'Buchireddypalem',
  ],
  'Sri Sathya Sai': [
    'Dharmavaram',
    'Hindupur',
    'Kadiri',
    'Puttaparthi',
    'Penukonda',
    'Madakasira',
    'Bukkapatnam',
  ],
  Srikakulam: [
    'Srikakulam',
    'Amudalavalasa',
    'Palasa',
    'Kasibugga',
    'Ichchapuram',
    'Tekkali',
    'Narasannapeta',
  ],
  Tirupati: [
    'Tirupati',
    'Srikalahasti',
    'Puttur',
    'Sullurpeta',
    'Naidupeta',
    'Venkatagiri',
    'Renigunta',
  ],
  Visakhapatnam: [
    'Visakhapatnam',
    'Gajuwaka',
    'Madhurawada',
    'Bheemunipatnam',
    'Anandapuram',
  ],
  Vizianagaram: ['Vizianagaram', 'Bobbili', 'Rajam', 'Nellimarla', 'Kothavalasa', 'Srungavarapukota'],
  'West Godavari': [
    'Bhimavaram',
    'Tadepalligudem',
    'Palakollu',
    'Tanuku',
    'Narasapuram',
    'Undi',
    'Akividu',
  ],
  'YSR Kadapa': [
    'Kadapa',
    'Proddatur',
    'Pulivendula',
    'Badvel',
    'Yerraguntla',
    'Mydukur',
    'Jammalamadugu',
    'Kamalapuram',
  ],
};

/** Options for the district select; keeps a legacy free-text value if not in the list. */
export function districtSelectOptions(current?: string | null): string[] {
  const cur = String(current || '').trim();
  if (cur && !AP_DISTRICTS.includes(cur as ApDistrict)) {
    return [cur, ...AP_DISTRICTS];
  }
  return [...AP_DISTRICTS];
}

/** Towns for a district; empty if district unknown / not selected. */
export function townsForDistrict(district?: string | null): string[] {
  const d = String(district || '').trim();
  if (!d) return [];
  const list = AP_TOWNS_BY_DISTRICT[d as ApDistrict];
  return list ? [...list] : [];
}

/** Town select options for a district; keeps legacy free-text location if not in the list. */
export function townSelectOptions(district?: string | null, currentLocation?: string | null): string[] {
  const towns = townsForDistrict(district);
  const cur = String(currentLocation || '').trim();
  if (cur && !towns.includes(cur)) {
    return [cur, ...towns];
  }
  return towns;
}

/** True when location is still valid for the chosen district. */
export function isTownInDistrict(district?: string | null, location?: string | null): boolean {
  const loc = String(location || '').trim();
  if (!loc) return true;
  const towns = townsForDistrict(district);
  if (!towns.length) return true;
  return towns.includes(loc);
}

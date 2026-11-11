/**
 * Broad MSME / livelihood skills for Nature of Business "Match me".
 * Free-text answers are mapped to exactly one label from this list.
 */

export const BUSINESS_SKILLS: readonly string[] = [
  // Traditional crafts / Vishwakarma-adjacent
  'Pottery',
  'Carpentry',
  'Blacksmithing',
  'Goldsmithing / jewellery',
  'Tailoring / stitching',
  'Cobbling / footwear',
  'Masonry / construction labour',
  'Basket / mat / broom making',
  'Coir products',
  'Handloom weaving',
  'Powerloom / textile weaving',
  'Doll / toy making',
  'Garland / flower work',
  'Barber / salon',
  'Laundry / washing',
  'Fishing net making',
  'Stone carving / sculpture',
  'Boat making',
  'Locksmith',
  'Tool / hammer kit making',
  // Food & agri processing
  'Food processing',
  'Bakery / confectionery',
  'Catering / tiffin service',
  'Street food / food stall',
  'Dairy / milk products',
  'Poultry / egg business',
  'Fish / seafood trade',
  'Oil mill / oil extraction',
  'Rice / flour mill',
  'Spice / pickle processing',
  'Fruit / vegetable processing',
  // Trade / retail
  'Kirana / general store',
  'Vegetable / fruit vending',
  'Cloth / garment retail',
  'Mobile / electronics retail',
  'Stationery / book shop',
  'Medical / pharmacy retail',
  'Hardware / building materials retail',
  'Automobile spare parts retail',
  'Wholesale trading',
  // Services
  'Beauty parlour / cosmetics',
  'Photography / videography',
  'Printing / Xerox / DTP',
  'Computer / IT services',
  'Mobile repairing',
  'Two-wheeler / auto repairing',
  'Electrical repairing',
  'Plumbing / electrical contracting',
  'Transport / logistics',
  'Auto / taxi / transport service',
  'Tuition / coaching',
  'Day care / creche',
  'Security services',
  'Housekeeping / facility services',
  // Manufacturing / light industry
  'Fabrication / welding',
  'Furniture making',
  'Plastic products',
  'Paper / packaging products',
  'Brick / cement products',
  'Agarbatti / incense making',
  'Candle / soap making',
  'Garment manufacturing',
  'Leather products',
  'Metal fabrication',
  'Engineering workshop',
  'Pharmaceuticals / chemicals (MSME)',
  // Agriculture-adjacent / others
  'Nursery / gardening',
  'Animal husbandry',
  'Beekeeping / honey',
  'Handicrafts (general)',
  'Event decoration / mandap',
  'Recycling / scrap trading',
  'E-commerce / online selling',
  'Other manufacturing',
  'Other services',
  'Other trade / retail',
] as const;

type BusinessSkill = (typeof BUSINESS_SKILLS)[number];

/** Keyword / phrase hints → skill (checked in order; first hit wins). */
const SKILL_ALIASES: Array<{ skill: BusinessSkill; patterns: RegExp[] }> = [
  { skill: 'Pottery', patterns: [/\bpot(?:s|tery)?\b/i, /\bclay\b/i, /\bceramic/i, /\bkumhar|kumhaar|potter/i] },
  { skill: 'Carpentry', patterns: [/\bcarpentr/i, /\bwoodwork/i, /\bfurniture\b/i, /\bsuthar|badhai/i, /\bwooden\b/i] },
  { skill: 'Blacksmithing', patterns: [/\bblacksmith/i, /\blohar\b/i, /\biron\s*work/i, /\bforge\b/i] },
  { skill: 'Goldsmithing / jewellery', patterns: [/\bgoldsmith/i, /\bjewell?er/i, /\bsonar\b/i, /\bornaments?\b/i] },
  { skill: 'Tailoring / stitching', patterns: [/\btailor/i, /\bstitch/i, /\bdarzi\b/i, /\bsewing\b/i, /\bblouse\b/i] },
  { skill: 'Cobbling / footwear', patterns: [/\bcobbl/i, /\bshoe\b/i, /\bchappal/i, /\bfootwear/i, /\bcharmkar/i] },
  { skill: 'Masonry / construction labour', patterns: [/\bmason/i, /\brajmistri/i, /\bconstruct/i, /\bbricklay/i, /\bbuilding\s*work/i] },
  { skill: 'Basket / mat / broom making', patterns: [/\bbasket/i, /\bmat\b/i, /\bbroom/i] },
  { skill: 'Coir products', patterns: [/\bcoir\b/i] },
  { skill: 'Handloom weaving', patterns: [/\bhandloom/i, /\bweav(?:e|ing)\b/i, /\bsaree\s*weav/i] },
  { skill: 'Powerloom / textile weaving', patterns: [/\bpower\s*loom/i, /\btextile\b/i] },
  { skill: 'Doll / toy making', patterns: [/\bdoll\b/i, /\btoy\b/i] },
  { skill: 'Garland / flower work', patterns: [/\bgarland/i, /\bmalakaar/i, /\bflower\s*work/i, /\bpookada/i] },
  { skill: 'Barber / salon', patterns: [/\bbarber/i, /\bsalon\b/i, /\bhair\s*cut/i, /\bnaai\b/i] },
  { skill: 'Laundry / washing', patterns: [/\blaundry/i, /\bdhobi\b/i, /\bwasherman/i, /\bdry\s*clean/i] },
  { skill: 'Fishing net making', patterns: [/\bfishing\s*net/i, /\bnet\s*mak/i] },
  { skill: 'Stone carving / sculpture', patterns: [/\bstone\s*carv/i, /\bsculpt/i, /\bmoorti/i] },
  { skill: 'Boat making', patterns: [/\bboat\b/i] },
  { skill: 'Locksmith', patterns: [/\block\s*smith/i, /\bcopies?\s*keys?/i] },
  { skill: 'Food processing', patterns: [/\bfood\s*process/i, /\bfssai/i] },
  { skill: 'Bakery / confectionery', patterns: [/\bbaker/i, /\bcake\b/i, /\bbiscuit/i, /\bsweet\s*shop/i, /\bmithai/i] },
  { skill: 'Catering / tiffin service', patterns: [/\bcater/i, /\btiffin/i, /\bmess\b/i, /\bhome\s*food/i] },
  { skill: 'Street food / food stall', patterns: [/\bstreet\s*food/i, /\bfood\s*stall/i, /\bchaat\b/i, /\bdosa\b/i, /\bidli\b/i, /\bvending\s*food/i] },
  { skill: 'Dairy / milk products', patterns: [/\bdairy\b/i, /\bmilk\b/i, /\bcurd\b/i, /\bpaneer\b/i, /\bghee\b/i] },
  { skill: 'Poultry / egg business', patterns: [/\bpoultry/i, /\bchicken\b/i, /\begg\b/i] },
  { skill: 'Fish / seafood trade', patterns: [/\bfish(?:ing|erman)?\b/i, /\bseafood/i] },
  { skill: 'Oil mill / oil extraction', patterns: [/\boil\s*mill/i, /\bgingelly|groundnut\s*oil/i] },
  { skill: 'Rice / flour mill', patterns: [/\brice\s*mill/i, /\bflour\s*mill/i, /\bchakki\b/i] },
  { skill: 'Spice / pickle processing', patterns: [/\bspice/i, /\bpickle/i, /\bmasala\b/i] },
  { skill: 'Kirana / general store', patterns: [/\bkirana/i, /\bgeneral\s*store/i, /\bgrocery/i, /\bration\s*shop/i] },
  { skill: 'Vegetable / fruit vending', patterns: [/\bvegetable/i, /\bfruit\s*vend/i, /\bsabzi\b/i] },
  { skill: 'Cloth / garment retail', patterns: [/\bcloth\s*shop/i, /\bgarment\s*retail/i, /\bdress\s*material/i] },
  { skill: 'Mobile / electronics retail', patterns: [/\bmobile\s*shop/i, /\belectronic/i] },
  { skill: 'Beauty parlour / cosmetics', patterns: [/\bbeauty\b/i, /\bparlour|parlor/i, /\bcosmetic/i, /\bmakeup\b/i] },
  { skill: 'Photography / videography', patterns: [/\bphoto/i, /\bvideo(?:graphy)?/i, /\bstudio\b/i] },
  { skill: 'Printing / Xerox / DTP', patterns: [/\bxerox\b/i, /\bprint(?:ing)?\b/i, /\bdtp\b/i, /\bphotocop/i] },
  { skill: 'Computer / IT services', patterns: [/\bcomputer\b/i, /\bsoftware\b/i, /\bit\s*service/i, /\bcyber\s*cafe/i] },
  { skill: 'Mobile repairing', patterns: [/\bmobile\s*repair/i, /\bphone\s*repair/i] },
  { skill: 'Two-wheeler / auto repairing', patterns: [/\bmechanic\b/i, /\bauto\s*repair/i, /\bbike\s*repair/i, /\btwo[\s-]*wheeler/i] },
  { skill: 'Electrical repairing', patterns: [/\belectrical\s*repair/i, /\bfan\s*repair/i, /\binverter\b/i] },
  { skill: 'Plumbing / electrical contracting', patterns: [/\bplumb/i, /\belectric(?:al)?\s*contract/i, /\bwiring\b/i] },
  { skill: 'Transport / logistics', patterns: [/\blogistics/i, /\btransport\b/i, /\bcourier\b/i, /\bgoods\s*vehicle/i] },
  { skill: 'Auto / taxi / transport service', patterns: [/\btaxi\b/i, /\bauto\s*rickshaw/i, /\bcab\b/i, /\bdriver\b/i] },
  { skill: 'Tuition / coaching', patterns: [/\btuition/i, /\bcoach(?:ing)?\b/i, /\btutor\b/i] },
  { skill: 'Fabrication / welding', patterns: [/\bweld/i, /\bfabricat/i, /\bgrill\b/i] },
  { skill: 'Furniture making', patterns: [/\bfurniture/i] },
  { skill: 'Agarbatti / incense making', patterns: [/\bagarbatti/i, /\bincense/i] },
  { skill: 'Candle / soap making', patterns: [/\bcandle\b/i, /\bsoap\b/i, /\bdetergent/i] },
  { skill: 'Garment manufacturing', patterns: [/\bgarment\s*manufact/i, /\bapparel\b/i, /\breadymade/i] },
  { skill: 'Handicrafts (general)', patterns: [/\bhandicraft/i, /\bcraft\b/i, /\bartisan\b/i] },
  { skill: 'Recycling / scrap trading', patterns: [/\bscrap\b/i, /\brecycl/i, /\bkabadi/i] },
  { skill: 'E-commerce / online selling', patterns: [/\be-?commerce/i, /\bonline\s*sell/i, /\bmeesho|amazon|flipkart/i] },
];

/** Fast local match; returns null if nothing clear. */
export function matchBusinessSkillLocal(text: string): BusinessSkill | null {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const exact = BUSINESS_SKILLS.find((s) => s.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;

  const contained = BUSINESS_SKILLS.find(
    (s) => raw.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(raw.toLowerCase())
  );
  if (contained && raw.length >= 3) return contained;

  for (const { skill, patterns } of SKILL_ALIASES) {
    if (patterns.some((re) => re.test(raw))) return skill;
  }
  return null;
}


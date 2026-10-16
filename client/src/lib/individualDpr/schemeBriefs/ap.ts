import { ACTIVE, L, STATE, SchemeBrief } from './types';

const AP_INDUSTRIES = L(
  'Industries & Commerce, Government of Andhra Pradesh',
  'పరిశ్రమలు మరియు వాణిజ్యం, ఆంధ్రప్రదేశ్ ప్రభుత్వం'
);
const APMSMEDC = L(
  'AP MSME Development Corporation / Directorate of Industries',
  'AP MSME డెవలప్‌మెంట్ కార్పొరేషన్ / పరిశ్రమల డైరెక్టరేట్'
);
const APIIC = L('APIIC / Government of Andhra Pradesh', 'APIIC / ఆంధ్రప్రదేశ్ ప్రభుత్వం');
const AP_WELFARE = L(
  'AP State Welfare Corporations (OBMMS)',
  'ఆంధ్రప్రదేశ్ సంక్షేమ కార్పొరేషన్లు (OBMMS)'
);

export const AP_BRIEFS: Record<string, SchemeBrief> = {
  AP_EDP: {
    code: 'AP_EDP',
    title: L('AP MSME & Entrepreneur Development Policy 4.0 (2024–29)', 'AP MSME మరియు వ్యవస్థాపక అభివృద్ధి విధానం 4.0 (2024–29)'),
    intro: L(
      'Andhra Pradesh MSME-EDP 4.0 offers capital subsidy on Fixed Capital Investment for new manufacturing enterprises that are Udyam-registered and located in the State. Create New Latest DPR builds a 13-step greenfield pack — see docs/schemes/AP_EDP/apEdp.md. Operational guidelines were issued in February 2025 (G.O.Ms.No.28). Confirm live caps with GM-DIC / AP MSME One before you lock costs.',
      'AP MSME-EDP 4.0 కొత్త తయారీ యూనిట్ల ఫిక్స్‌డ్ క్యాపిటల్ ఇన్వెస్ట్‌మెంట్‌పై క్యాపిటల్ సబ్సిడీ ఇస్తుంది. Create New Latest DPR 13-దశల ప్యాక్ ఇస్తుంది — docs/schemes/AP_EDP/apEdp.md. ఫిబ్రవరి 2025లో ఆపరేషనల్ గైడ్‌లైన్స్ (G.O.Ms.No.28). GM-DIC / AP MSME Oneతో నిర్ధారించండి.'
    ),
    benefits: [
      L(
        'Capital subsidy 25% of FCI for general new manufacturing (caps: micro ₹25 L, small ₹1.5 Cr, medium ₹7 Cr), paid in instalments after CoD / first invoice.',
        'సాధారణ కొత్త తయారీకి FCIలో 25% క్యాపిటల్ సబ్సిడీ (పైపరిధి: సూక్ష్మ ₹25 లక్షలు, చిన్న ₹1.5 కోట్లు, మధ్య ₹7 కోట్లు), CoD / మొదటి ఇన్వాయిస్ తర్వాత విడతలు.'
      ),
      L(
        'Special category (wholly owned women/BC/SC/ST/minority/PwD/transgender with AP domicile): 45% of FCI for micro/small (caps ₹45 L / ₹4.5 Cr) and 35% for medium (cap ₹7 Cr).',
        'ప్రత్యేక వర్గం: సూక్ష్మ/చిన్నకు FCIలో 45% (₹45 లక్షలు / ₹4.5 కోట్లు), మధ్యకు 35% (₹7 కోట్లు).'
      ),
      L(
        'SC/ST micro & small in APIIC parks: 75% land-cost rebate capped ₹25 L (once). Combined incentives ≤ 75% of FCI; capital subsidy and tech-upgrade are mutually exclusive.',
        'APIIC పార్క్‌లో SC/ST సూక్ష్మ & చిన్న: భూమి ఖర్చుపై 75% రిబేట్, ₹25 లక్షల పైపరిధి. మొత్తం ≤ 75% FCI; క్యాపిటల్ సబ్సిడీ ↔ టెక్ అప్‌గ్రేడ్ విరుద్ధం.'
      ),
    ],
    eligibility: [
      L('New manufacturing unit in Andhra Pradesh (Scheme Finder does not treat pure services as EDP 4.0).', 'ఆంధ్రప్రదేశ్‌లో కొత్త తయారీ యూనిట్ (స్కీమ్ ఫైండర్ సేవలను EDP 4.0గా తీసుకోదు).'),
      L('AP domicile of the promoter. Unit in a city, village, or APIIC park — not a home-only setup.', 'ప్రమోటర్ AP నివాసి. యూనిట్ నగరం, గ్రామం లేదా APIIC పార్క్‌లో — ఇంటి నుండి మాత్రమే కాదు.'),
      L('Registered sole / partnership / company with Udyam (or willing to obtain it).', 'ఉద్యమ్ ఉన్న (లేదా తీసుకోవడానికి సిద్ధం) నమోదైన ఏకస్వామ్యం / భాగస్వామ్యం / కంపెనీ.'),
      L('Must meet MSMED Act classification and commence production in the policy period.', 'MSMED చట్టం వర్గీకరణ పాటించాలి; విధాన కాలంలో ఉత్పత్తి మొదలు పెట్టాలి.'),
      L(
        'Capital subsidy for a new unit and technology-upgradation support for an expansion cannot both be claimed on the same fixed capital. Incentives under this policy together stay within 75% of FCI. Do not claim the same capital subsidy again under the Food Processing Policy.',
        'కొత్త యూనిట్ క్యాపిటల్ సబ్సిడీని, విస్తరణకు టెక్ అప్‌గ్రేడ్ సహాయాన్ని అదే స్థిర మూలధనంపై రెండూ తీసుకోలేరు. ఈ విధానం కింద ప్రోత్సాహకాలు కలిపి FCIలో 75% లోపు ఉండాలి. అదే క్యాపిటల్ సబ్సిడీని ఆహార ప్రాసెసింగ్ విధానం కింద మళ్లీ తీసుకోకండి.'
      ),
    ],
    howToApply: [
      L('Apply on the State incentives / AP MSME One channel after Udyam and CFE as required.', 'ఉద్యమ్ మరియు అవసరమైతే CFE తర్వాత రాష్ట్ర ఇన్సెంటివ్స్ / AP MSME One ద్వారా దరఖాస్తు చేయండి.'),
      L('Create New Latest DPR with AP MSME-EDP 4.0 selected builds a 13-step FCI pack — see docs/schemes/AP_EDP/apEdp.md.', 'AP MSME-EDP 4.0 ఎంచుకుంటే Create New Latest DPR 13-దశల FCI ప్యాక్ ఇస్తుంది.'),
      L('GM-DIC / DIEPC sanctions as per operational guidelines; subsidy is released in instalments after CoD / first invoice.', 'GM-DIC / DIEPC మార్గదర్శకాల ప్రకారం మంజూరు; CoD / మొదటి ఇన్వాయిస్ తర్వాత విడతలు.'),
    ],
    documents: [
      L('Udyam, incorporation / firm papers, AP domicile proof', 'ఉద్యమ్, సంస్థ పత్రాలు, AP నివాస రుజువు'),
      L('Land / shed allotment or lease; CFE / CFO', 'భూమి / షెడ్ కేటాయింపు లేదా లీజు; CFE / CFO'),
      L('CA statement of Fixed Capital Investment; machinery invoices', 'FCIపై CA స్టేట్‌మెంట్; యంత్రాల ఇన్వాయిసులు'),
    ],
    faqs: [
      {
        q: L('Is food processing covered here?', 'ఆహార ప్రాసెసింగ్ ఇక్కడ కవర్ అవుతుందా?'),
        a: L(
          'Food processing has a separate AP Food Processing Policy 4.0. Do not claim the same capital subsidy under both EDP and FPP.',
          'ఆహార ప్రాసెసింగ్‌కు వేరే AP Food Processing Policy 4.0 ఉంది. EDP మరియు FPP రెండింటి కింద అదే క్యాపిటల్ సబ్సిడీ తీసుకోకండి.'
        ),
      },
    ],
    quickInfo: {
      ministry: AP_INDUSTRIES,
      category: L('Capital subsidy (FCI)', 'క్యాపిటల్ సబ్సిడీ (FCI)'),
      type: STATE,
      status: ACTIVE,
    },
    sourceUrl: 'https://apmsmeone.ap.gov.in/MSMEONE/Public/Policies.aspx',
  },

  AP_FPP: {
    code: 'AP_FPP',
    title: L('AP Food Processing Policy 4.0 (2024–29)', 'AP ఆహార ప్రాసెసింగ్ విధానం 4.0 (2024–29)'),
    intro: L(
      'State policy for agri / food processing and allied units in Andhra Pradesh. Capital subsidy on FCI is higher for secondary/tertiary processing and for special-category / FPO / SHG units. You cannot take the same incentive again under IDP or MSME-EDP.',
      'ఆంధ్రప్రదేశ్‌లో వ్యవసాయ / ఆహార ప్రాసెసింగ్ యూనిట్ల రాష్ట్ర విధానం. సెకండరీ/టెర్షియరీ ప్రాసెసింగ్ మరియు ప్రత్యేక వర్గం / FPO / SHGలకు FCI సబ్సిడీ ఎక్కువ. IDP లేదా MSME-EDP కింద అదే ప్రోత్సాహకం మళ్లీ తీసుకోలేరు.'
    ),
    benefits: [
      L(
        'New-unit capital subsidy typically 25% of FCI (higher rates/caps for FPOs, SHGs, cooperatives and special-category owners). Illustrative micro cap about ₹25–35 lakh general vs higher special-category caps in the 2025 amendment.',
        'కొత్త యూనిట్ క్యాపిటల్ సబ్సిడీ సాధారణంగా FCIలో 25% (FPO, SHG, సహకారం, ప్రత్యేక వర్గానికి ఎక్కువ). సూచన సూక్ష్మ పైపరిధి సాధారణ ₹25–35 లక్షలు; 2025 సవరణలో ప్రత్యేక వర్గం ఎక్కువ.'
      ),
      L(
        'Technology upgradation, waste-processing (up to 50% of FCI in policy), power-tariff reimbursement, and 100% net SGST reimbursement for a notified period, subject to caps.',
        'టెక్నాలజీ అప్‌గ్రేడ్, వ్యర్థ ప్రాసెసింగ్ (విధానంలో FCIలో 50% వరకు), పవర్-టారిఫ్ రీయింబర్స్‌మెంట్, నోటిఫైడ్ కాలానికి 100% నెట్ SGST రీయింబర్స్‌మెంట్.'
      ),
      L(
        'Additional 10% for enterprises wholly owned by women / BC / SC / ST / minority / specially-abled / transgender entrepreneurs of local domicile (2025 amendment).',
        'స్థానిక నివాసం ఉన్న మహిళ / BC / SC / ST / మైనారిటీ / వికలాంగ / ట్రాన్స్‌జెండర్ పూర్తి యాజమాన్యానికి అదనపు 10% (2025 సవరణ).'
      ),
    ],
    eligibility: [
      L('Food processing enterprise (agri, dairy, aqua, meat, spices, bakery, and similar) located in Andhra Pradesh.', 'ఆంధ్రప్రదేశ్‌లో ఆహార ప్రాసెసింగ్ యూనిట్ (వ్యవసాయం, డెయిరీ, ఆక్వా, మాంసం, మసాలా, బేకరీ).'),
      L('AP domicile in Scheme Finder. New or expansion project that obtains CFO and starts commercial production in the policy period.', 'స్కీమ్ ఫైండర్‌లో AP నివాసం. విధాన కాలంలో CFO తీసుకుని ఉత్పత్తి మొదలు పెట్టే కొత్త లేదా విస్తరణ ప్రాజెక్ట్.'),
      L('Udyam-ready registered firm (sole, partnership, company, SHG/FPO/co-op). FSSAI and food-safety compliance.', 'ఉద్యమ్ సిద్ధం ఉన్న నమోదైన సంస్థ. FSSAI మరియు ఆహార భద్రత పాటింపు.'),
      L(
        'The similar capital incentives under the Industrial Development Policy or MSME-EDP cannot be claimed as well. The same capital item cannot be subsidised twice, including with PMFME.',
        'పారిశ్రామిక అభివృద్ధి విధానం లేదా MSME-EDP కింద ఇలాంటి క్యాపిటల్ ప్రోత్సాహకాలు మళ్లీ తీసుకోలేరు. అదే మూలధన అంశంపై రెండు సార్లు సబ్సిడీ లేదు, PMFMEతో సహా.'
      ),
    ],
    howToApply: [
      L('File on the State food-processing / incentives portal via GM-DIC after Udyam and statutory consents.', 'ఉద్యమ్ మరియు అనుమతుల తర్వాత GM-DIC ద్వారా రాష్ట్ర ఆహార-ప్రాసెసింగ్ / ఇన్సెంటివ్స్ పోర్టల్‌లో దాఖలు చేయండి.'),
      L('This DPR should separate FCI and working capital and state the processing type (primary vs secondary/tertiary).', 'ఈ DPRలో FCI మరియు వర్కింగ్ క్యాపిటల్ వేరు చేసి, ప్రాసెసింగ్ రకం (ప్రైమరీ vs సెకండరీ/టెర్షియరీ) రాయండి.'),
    ],
    documents: [
      L('Udyam, firm papers, AP domicile, land/lease', 'ఉద్యమ్, సంస్థ పత్రాలు, AP నివాసం, భూమి/లీజు'),
      L('CFE/CFO, FSSAI, machinery quotations, CA FCI statement', 'CFE/CFO, FSSAI, యంత్రాల కోటేషన్లు, CA FCI స్టేట్‌మెంట్'),
    ],
    faqs: [
      {
        q: L('Can I claim PMFME and AP FPP together?', 'PMFME మరియు AP FPP కలిపి తీసుకోవచ్చా?'),
        a: L(
          'They are different programmes (central vs state). Double-dipping on the same capital items is not allowed. Your bank / GM-DIC will check overlap.',
          'ఇవి వేరు కార్యక్రమాలు (కేంద్రం vs రాష్ట్రం). అదే మూలధన అంశాలపై రెండు సార్లు సబ్సిడీ నిషిద్ధం. బ్యాంకు / GM-DIC ఓవర్‌లాప్ చూస్తారు.'
        ),
      },
    ],
    quickInfo: {
      ministry: AP_INDUSTRIES,
      category: L('Capital + operating incentives', 'క్యాపిటల్ + నిర్వహణ ప్రోత్సాహకాలు'),
      type: STATE,
      status: ACTIVE,
    },
    sourceUrl: 'https://apmsmeone.ap.gov.in/MSMEONE/Public/Policies.aspx',
  },

  AP_TECH_UPGRADE: {
    code: 'AP_TECH_UPGRADE',
    title: L('AP Technology Upgradation Subsidy', 'AP టెక్నాలజీ అప్‌గ్రేడేషన్ సబ్సిడీ'),
    intro: L(
      'Under AP MSME-EDP 4.0 (para 6.4), existing units seeking expansion / diversification / modernisation can claim a technology-upgradation incentive on eligible FCI. Create New Latest DPR builds a 13-step pack — see docs/schemes/AP_TECH_UPGRADE/apTechUpgrade.md. Mutually exclusive from new-unit capital subsidy. Confirm live % and caps with GM-DIC.',
      'AP MSME-EDP 4.0 (పేరా 6.4) కింద ఉన్న యూనిట్ల విస్తరణ / డైవర్సిఫికేషన్ / ఆధునీకరణకు FCIపై టెక్ అప్‌గ్రేడ్ ప్రోత్సాహకం. Create New Latest DPR 13-దశల ప్యాక్ ఇస్తుంది. కొత్త-యూనిట్ క్యాపిటల్ సబ్సిడీకి విరుద్ధం. GM-DICతో నిర్ధారించండి.'
    ),
    benefits: [
      L(
        'General category: about 20% of FCI (illustrative caps — micro ₹20 L, small ₹2 Cr, medium ₹5 Cr) in annual instalments after CoD / first invoice.',
        'సాధారణ వర్గం: FCIలో సుమారు 20% (సూచన పైపరిధి — సూక్ష్మ ₹20 లక్షలు, చిన్న ₹2 కోట్లు, మధ్య ₹5 కోట్లు), CoD / మొదటి ఇన్వాయిస్ తర్వాత విడతలు.'
      ),
      L(
        'Special category (wholly owned women/BC/SC/ST/minority/PwD/transgender with AP domicile): higher rates in the amendment table (e.g. micro/small 40%, medium 30%) with higher caps.',
        'ప్రత్యేక వర్గం (AP నివాసం ఉన్న పూర్తి యాజమాన్య మహిళ/BC/SC/ST/మైనారిటీ/వికలాంగ/ట్రాన్స్‌జెండర్): సవరణ పట్టికలో అధిక రేట్లు (ఉదా. సూక్ష్మ/చిన్న 40%, మధ్య 30%).'
      ),
      L('Paid after installation / CoD verification — not as an advance. Combined incentives ≤ 75% of FCI.', 'ఇన్‌స్టాలేషన్ / CoD ధృవీకరణ తర్వాత చెల్లింపు. మొత్తం ప్రోత్సాహకాలు FCIలో 75%కి పరిమితం.'),
    ],
    eligibility: [
      L('Existing (brownfield) or restarting manufacturing unit in Andhra Pradesh (Scheme Finder).', 'ఆంధ్రప్రదేశ్‌లో ఉన్న (బ్రౌన్‌ఫీల్డ్) లేదా మళ్లీ మొదలుపెట్టే తయారీ యూనిట్.'),
      L('AP domicile, registered firm, unit located in AP. Expansion / diversification / tech upgrade — not greenfield capital subsidy.', 'AP నివాసం, నమోదైన సంస్థ. విస్తరణ / టెక్ అప్‌గ్రేడ్ — కొత్త-యూనిట్ క్యాపిటల్ సబ్సిడీ కాదు.'),
      L('Cannot stack this with the new-unit EDP capital subsidy on the same FCI.', 'అదే FCIపై కొత్త-యూనిట్ EDP క్యాపిటల్ సబ్సిడీతో కలపలేరు.'),
      L(
        'Incentives claimed together under MSME-EDP 4.0 stay within 75% of fixed capital investment.',
        'MSME-EDP 4.0 కింద కలిపి తీసుకునే ప్రోత్సాహకాలు స్థిర మూలధన పెట్టుబడిలో 75% లోపు ఉండాలి.'
      ),
    ],
    howToApply: [
      L('Apply through GM-DIC / AP MSME One / Single Desk after placing orders for eligible new machinery.', 'అర్హ కొత్త యంత్రాల ఆర్డర్ల తర్వాత GM-DIC / AP MSME One / సింగిల్ డెస్క్ ద్వారా దరఖాస్తు చేయండి.'),
      L('Create New Latest DPR with AP Technology Upgradation selected builds the 13-step upgrade pack.', 'AP Technology Upgradation ఎంచుకుంటే Create New Latest DPR 13-దశల అప్‌గ్రేడ్ ప్యాక్ ఇస్తుంది.'),
      L('Emphasise old vs new machines, FCI, and productivity gain.', 'పాత vs కొత్త యంత్రాలు, FCI, ఉత్పాదకత పెరుగుదల నొక్కి చెప్పండి.'),
    ],
    documents: [
      L('Existing Udyam, old machinery list, new quotations / invoices', 'ఉన్న ఉద్యమ్, పాత యంత్రాల జాబితా, కొత్త కోటేషన్లు / ఇన్వాయిసులు'),
      L('CA FCI statement, AP domicile proof; bank term-loan sanction if credit-linked', 'CA FCI, AP నివాస రుజువు; క్రెడిట్-లింక్డ్ అయితే బ్యాంకు మంజూరు'),
    ],
    faqs: [
      {
        q: L('I am starting a brand-new factory. Can I use this?', 'కొత్త ఫ్యాక్టరీ మొదలుపెడుతున్నాను. ఇది వాడవచ్చా?'),
        a: L('No. Use AP EDP 4.0 or AP CMEP for greenfield. This line is for upgrading an existing unit.', 'కాదు. గ్రీన్‌ఫీల్డ్‌కు AP EDP 4.0 లేదా AP CMEP. ఇది ఉన్న యూనిట్ అప్‌గ్రేడ్‌కు.'),
      },
      {
        q: L('Is this the same as central SCLCSS?', 'ఇది కేంద్ర SCLCSSేనా?'),
        a: L(
          'No. SCLCSS is central SC/ST-only capital subsidy on P&M. This is an Andhra Pradesh MSME-EDP 4.0 FCI incentive for expansion units (all eligible categories, with a special-category boost).',
          'కాదు. SCLCSS కేంద్ర SC/ST P&M సబ్సిడీ. ఇది AP MSME-EDP 4.0 FCI ప్రోత్సాహకం (ప్రత్యేక వర్గ బూస్ట్ ఉంది).'
        ),
      },
    ],
    quickInfo: {
      ministry: AP_INDUSTRIES,
      category: L('Technology upgradation subsidy', 'టెక్నాలజీ అప్‌గ్రేడ్ సబ్సిడీ'),
      type: STATE,
      status: ACTIVE,
    },
    sourceUrl: 'https://apmsmeone.ap.gov.in/MSMEONE/Public/Policies.aspx',
  },

  AP_PARKS: {
    code: 'AP_PARKS',
    title: L('AP MSME Parks — land-cost concession', 'AP MSME పార్కులు — భూమి ధర రాయితీ'),
    intro: L(
      'Andhra Pradesh is developing MSME industrial parks (including a park-per-constituency programme) through APIIC / APMSMEDC. Eligible units can get a notified rebate or concessional allotment on park land. Scheme Finder currently treats this as a large land-cost concession for plots inside an APIIC park. Confirm the exact rebate, cap, and lease-cum-sale terms with APIIC / GM-DIC — they change by GO and entrepreneur category.',
      'ఆంధ్రప్రదేశ్ APIIC / APMSMEDC ద్వారా MSME పార్కులు (నియోజకవర్గానికి ఒక పార్క్) అభివృద్ధి చేస్తోంది. అర్హ యూనిట్లకు నోటిఫైడ్ భూమి రాయితీ. స్కీమ్ ఫైండర్ దీన్ని APIIC పార్క్ ప్లాట్‌పై పెద్ద భూమి రాయితీగా తీసుకుంటుంది. ఖచ్చితమైన రాయితీ, పైపరిధి, లీజు-కమ్-సేల్ నిబంధనలు APIIC / GM-DICతో నిర్ధారించండి.'
    ),
    benefits: [
      L('Concessional allotment / rebate on land cost in APIIC MSME parks, as per the GO in force.', 'అమలులో ఉన్న GO ప్రకారం APIIC MSME పార్కుల్లో భూమి ధరపై రాయితీ / కన్సెషనల్ కేటాయింపు.'),
      L('Parks are intended as plug-and-play industrial infrastructure with common facilities.', 'పార్కులు సాధారణ సౌకర్యాలతో ప్లగ్-అండ్-ప్లే పారిశ్రామిక మౌలిక సదుపాయాలుగా ఉద్దేశించబడ్డాయి.'),
      L('Earlier special-category GOs also provided a 50% land-cost rebate (cap ₹20 lakh) for eligible SC/ST and some women entrepreneurs — ask APIIC which GO applies to your plot today.', 'గత ప్రత్యేక వర్గ GOల్లో SC/ST మరియు కొందరు మహిళా వ్యవస్థాపకులకు 50% భూమి రాయితీ (పైపరిధి ₹20 లక్షలు) ఉంది — మీ ప్లాట్‌కు ఏ GO వర్తిస్తుందో APIICని అడగండి.'),
    ],
    eligibility: [
      L('Unit must be inside an APIIC industrial / MSME park (Scheme Finder location = APIIC park).', 'యూనిట్ APIIC పారిశ్రామిక / MSME పార్క్‌లో ఉండాలి (స్కీమ్ ఫైండర్ స్థానం = APIIC పార్క్).'),
      L('AP domicile and a registered firm.', 'AP నివాసం మరియు నమోదైన సంస్థ.'),
      L('Allotment follows APIIC regulations (lease / lease-cum-sale, implementation timelines).', 'కేటాయింపు APIIC నిబంధనల ప్రకారం (లీజు / లీజు-కమ్-సేల్, అమలు గడువులు).'),
      L(
        'The 75% land-cost rebate for SC/ST micro and small units in APIIC parks is for a new unit and can be taken only once on that land. Combined incentives under the MSME policy stay within 75% of FCI.',
        'APIIC పార్కుల్లో SC/ST సూక్ష్మ మరియు చిన్న యూనిట్లకు 75% భూమి రాయితీ కొత్త యూనిట్‌కు, ఆ భూమిపై ఒక్కసారి మాత్రమే. MSME విధానం కింద కలిపిన ప్రోత్సాహకాలు FCIలో 75% లోపు ఉండాలి.'
      ),
    ],
    howToApply: [
      L('Check vacant plots on the APIIC portal, apply for allotment, then claim any eligible rebate through GM-DIC if the GO requires it.', 'APIIC పోర్టల్‌లో ఖాళీ ప్లాట్లు చూసి కేటాయింపుకు దరఖాస్తు చేయండి; GO కోరితే GM-DIC ద్వారా రాయితీ క్లెయిమ్ చేయండి.'),
      L('This DPR should include land cost net of rebate and the park location.', 'ఈ DPRలో రాయితీ తర్వాత భూమి ధర మరియు పార్క్ స్థానం ఉండాలి.'),
    ],
    documents: [
      L('Firm KYC, Udyam, project profile', 'సంస్థ KYC, ఉద్యమ్, ప్రాజెక్ట్ ప్రొఫైల్'),
      L('APIIC application / allotment letter, caste or women-ownership proof if claiming a special rebate', 'APIIC దరఖాస్తు / కేటాయింపు పత్రం; ప్రత్యేక రాయితీకి కులం లేదా మహిళా యాజమాన్యం రుజువు'),
    ],
    faqs: [
      {
        q: L('Is the 75% figure guaranteed?', '75% ఖాయమా?'),
        a: L(
          'No. Scheme Finder uses a large land-cost concession as the matching benefit. The percentage on your plot is whatever the current APIIC / Industries GO says. Always verify before you treat land as almost free in the means of finance.',
          'కాదు. స్కీమ్ ఫైండర్ పెద్ద భూమి రాయితీని మ్యాచ్ ప్రయోజనంగా చూపుతుంది. మీ ప్లాట్ శాతం ప్రస్తుత APIIC / పరిశ్రమల GO ప్రకారం. నిధుల పట్టికలో భూమిని దాదాపు ఉచితంగా తీసుకునే ముందు తప్పనిసరిగా నిర్ధారించండి.'
        ),
      },
    ],
    quickInfo: {
      ministry: APIIC,
      category: L('Land-cost rebate', 'భూమి ధర రాయితీ'),
      type: STATE,
      status: ACTIVE,
    },
    sourceUrl: 'https://apiic.in',
  },

  AP_CMEP: {
    code: 'AP_CMEP',
    title: L("AP Chief Minister's Entrepreneur Programme (AP CMEP)", 'ఏపీ ముఖ్యమంత్రి వ్యవస్థాపక కార్యక్రమం (AP CMEP)'),
    intro: L(
      'AP CMEP is a State programme (APMSMEDC / Directorate of Industries) to back new manufacturing and knowledge-economy units with bank-linked, back-ended subsidy. Public announcements described a large outlay to support thousands of micro entrepreneurs, with priority for units in new MSME parks and on private land. Detailed operational guidelines were tasked to APMSMEDC — treat percentages below as Scheme Finder rules plus those announcements, not as a substitute for the final GO.',
      'AP CMEP కొత్త తయారీ మరియు నాలెడ్జ్-ఎకానమీ యూనిట్లకు బ్యాంకు-లింక్డ్, బ్యాక్-ఎండెడ్ సబ్సిడీ. వేలాది సూక్ష్మ వ్యవస్థాపకులకు, కొత్త MSME పార్కులు మరియు ప్రైవేట్ భూమిపై ప్రాధాన్యం. వివరణాత్మక మార్గదర్శకాలు APMSMEDCకి అప్పగించబడ్డాయి — క్రింది శాతాలు స్కీమ్ ఫైండర్ నియమాలు మరియు ప్రకటనలు; తుది GOకు ప్రత్యామ్నాయం కాదు.'
    ),
    benefits: [
      L(
        'Credit-linked, back-ended subsidy for a new manufacturing or knowledge-economy (IT/ITeS, software, biotech, R&D) unit.',
        'కొత్త తయారీ లేదా నాలెడ్జ్-ఎకానమీ (IT/ITeS, సాఫ్ట్‌వేర్, బయోటెక్, R&D) యూనిట్‌కు క్రెడిట్-లింక్డ్, బ్యాక్-ఎండెడ్ సబ్సిడీ.'
      ),
      L(
        'Enhanced (booster) subsidy when the promoter is a woman, transgender person, ex-serviceman, or person with disability and is AP-domiciled.',
        'ప్రమోటర్ మహిళ, ట్రాన్స్‌జెండర్, మాజీ సైనికుడు లేదా వికలాంగుడు మరియు AP నివాసి అయితే అధిక (బూస్టర్) సబ్సిడీ.'
      ),
      L('Must be tied to a bank loan — there is no CMEP grant for a zero-loan project in Scheme Finder.', 'బ్యాంకు రుణంతో ముడిపెట్టాలి — స్కీమ్ ఫైండర్‌లో రుణం లేని ప్రాజెక్ట్‌కు CMEP గ్రాంట్ లేదు.'),
    ],
    eligibility: [
      L('Andhra Pradesh local domicile. Greenfield only.', 'ఆంధ్రప్రదేశ్ స్థానిక నివాసం. గ్రీన్‌ఫీల్డ్ మాత్రమే.'),
      L('Activity strictly manufacturing or knowledge-economy / tech services — not general trading, street vending, or crop-only farming.', 'కార్యకలాపం కఠినంగా తయారీ లేదా నాలెడ్జ్-ఎకానమీ / టెక్ సేవలు — సాధారణ వ్యాపారం, వీధి వ్యాపారం, కేవలం పంటలు కాదు.'),
      L('Numeric project cost with a bank-linked loan (not “no money needed”).', 'బ్యాంకు రుణంతో సంఖ్యాత్మక ప్రాజెక్ట్ ఖర్చు (“డబ్బు అవసరం లేదు” కాదు).'),
    ],
    howToApply: [
      L('Watch AP MSME One / self-login and GM-DIC notifications once operational guidelines are live.', 'ఆపరేషనల్ గైడ్‌లైన్స్ వచ్చాక AP MSME One / సెల్ఫ్-లాగిన్ మరియు GM-DIC నోటిఫికేషన్లు చూడండి.'),
      L('Prepare this DPR with bank means of finance; subsidy is back-ended after the loan is sanctioned and the unit is verified.', 'బ్యాంకు నిధులతో ఈ DPR సిద్ధం చేయండి; రుణం మంజూరు, యూనిట్ ధృవీకరణ తర్వాత సబ్సిడీ బ్యాక్-ఎండెడ్.'),
    ],
    documents: [
      L('AP domicile, KYC, Udyam (or application), activity proof (manufacturing / tech services)', 'AP నివాసం, KYC, ఉద్యమ్ (లేదా దరఖాస్తు), కార్యకలాపం రుజువు'),
      L('Bank loan application, quotations, land/lease if any', 'బ్యాంకు రుణ దరఖాస్తు, కోటేషన్లు, భూమి/లీజు'),
      L('Special-category proof (woman / transgender / ex-serviceman / PwD) for booster', 'బూస్టర్‌కు ప్రత్యేక వర్గం రుజువు (మహిళ / ట్రాన్స్‌జెండర్ / మాజీ సైనికుడు / వికలాంగుడు)'),
    ],
    faqs: [
      {
        q: L('I run a kirana shop. Can I use CMEP?', 'కిరాణా దుకాణం నడుపుతున్నాను. CMEP వాడవచ్చా?'),
        a: L('No. Scheme Finder restricts CMEP to manufacturing or knowledge-economy ventures.', 'కాదు. స్కీమ్ ఫైండర్ CMEPని తయారీ లేదా నాలెడ్జ్-ఎకానమీకి మాత్రమే పరిమితం చేస్తుంది.'),
      },
      {
        q: L('Are final subsidy percentages published?', 'తుది సబ్సిడీ శాతాలు ప్రచురితమయ్యాయా?'),
        a: L(
          'Not as a stable public brochure at the time this text was compiled. Use GM-DIC / APMSMEDC guidelines when they are uploaded on AP MSME One.',
          'ఈ వచనం సిద్ధమైనప్పుడు స్థిర బ్రోచర్ లేదు. AP MSME Oneలో APMSMEDC / GM-DIC మార్గదర్శకాలు వచ్చాక అవి పాటించండి.'
        ),
      },
    ],
    quickInfo: {
      ministry: APMSMEDC,
      category: L('Credit-linked back-ended subsidy', 'క్రెడిట్-లింక్డ్ బ్యాక్-ఎండెడ్ సబ్సిడీ'),
      type: STATE,
      status: ACTIVE,
    },
    sourceUrl: 'https://apmsmeone.ap.gov.in',
  },

  OBMMS: {
    code: 'OBMMS',
    title: L(
      'AP Welfare Corporation self-employment loan (OBMMS)',
      'AP సంక్షేమ కార్పొరేషన్ స్వయం ఉపాధి రుణం (OBMMS)'
    ),
    intro: L(
      'OBMMS (Online Beneficiary Management & Monitoring System) is the Andhra Pradesh portal used by SC, ST, BC, Kapu, Minority and other welfare corporations to register self-employment / economic-support schemes that combine a corporation subsidy with a bank loan. Exact unit cost, subsidy %, and age/income limits are notified per corporation and year on apobmms.apcfss.in.',
      'OBMMS అనేది SC, ST, BC, కాపు, మైనారిటీ మరియు ఇతర సంక్షేమ కార్పొరేషన్లు స్వయం ఉపాధి / ఆర్థిక సహాయ పథకాలకు ఉపయోగించే ఆంధ్రప్రదేశ్ పోర్టల్. యూనిట్ ఖర్చు, సబ్సిడీ %, వయసు/ఆదాయ పరిమితులు కార్పొరేషన్ మరియు సంవత్సరం ప్రకారం apobmms.apcfss.inలో నోటిఫై అవుతాయి.'
    ),
    benefits: [
      L('Bank-linked self-employment unit with a corporation subsidy (share and cap vary by scheme — often around 50% with a rupee cap).', 'కార్పొరేషన్ సబ్సిడీతో బ్యాంకు-లింక్డ్ స్వయం ఉపాధి యూనిట్ (వాటా మరియు పైపరిధి పథకం ప్రకారం మారుతుంది — తరచు సుమారు 50% రూపాయి పైపరిధితో).'),
      L('Covers small trades, ISB units, and some transport schemes when a driving licence is held.', 'చిన్న వ్యాపారాలు, ISB యూనిట్లు, డ్రైవింగ్ లైసెన్స్ ఉంటే కొన్ని రవాణా పథకాలు.'),
    ],
    eligibility: [
      L('Andhra Pradesh resident belonging to the relevant welfare category (SC / ST / BC / PwD in Scheme Finder; other corporations may open separately).', 'సంబంధిత సంక్షేమ వర్గానికి చెందిన ఆంధ్రప్రదేశ్ నివాసి (స్కీమ్ ఫైండర్‌లో SC / ST / BC / వికలాంగుడు).'),
      L('White Rice Card (BPL) and a valid caste / disability certificate.', 'వైట్ రైస్ కార్డు (BPL) మరియు చెల్లుబాటు అయ్యే కుల / వైకల్య ధృవపత్రం.'),
      L('Typical age 21–50 (some corporations 21–55). Scheme Finder uses 21–60 as the matching band.', 'సాధారణ వయసు 21–50 (కొన్ని కార్పొరేషన్లు 21–55). స్కీమ్ ఫైండర్ 21–60ని మ్యాచ్ బ్యాండ్‌గా వాడుతుంది.'),
      L('Apply as an individual (unregistered or sole). A registered company is not the OBMMS path in Scheme Finder.', 'వ్యక్తిగతంగా దరఖాస్తు (నమోదు కానిది లేదా ఏకస్వామ్యం). స్కీమ్ ఫైండర్‌లో నమోదైన కంపెనీ OBMMS మార్గం కాదు.'),
      L('No outstanding government loan as a defaulter. Unit in AP.', 'బకాయి ప్రభుత్వ రుణం డిఫాల్ట్‌గా ఉండకూడదు. యూనిట్ APలో.'),
    ],
    howToApply: [
      L('Register on apobmms.apcfss.in under the correct corporation when registrations are open.', 'నమోదులు తెరిచినప్పుడు సరైన కార్పొరేషన్ కింద apobmms.apcfss.inలో నమోదు చేయండి.'),
      L('Upload caste, rice card, Aadhaar, and a simple DPR. Bank linkage follows district selection.', 'కులం, రైస్ కార్డు, ఆధార్, సాధారణ DPR అప్‌లోడ్ చేయండి. జిల్లా ఎంపిక తర్వాత బ్యాంకు లింకేజ్.'),
    ],
    documents: [
      L('Aadhaar, caste certificate, White Rice Card, income proof', 'ఆధార్, కుల ధృవపత్రం, వైట్ రైస్ కార్డు, ఆదాయ రుజువు'),
      L('Bank passbook; driving licence for transport schemes; education certificates where a scheme requires them', 'బ్యాంకు పాస్‌బుక్; రవాణా పథకాలకు డ్రైవింగ్ లైసెన్స్; కావాలంటే విద్యా సర్టిఫికేట్లు'),
    ],
    faqs: [
      {
        q: L('Registrations are closed on the portal. What now?', 'పోర్టల్‌లో నమోదులు మూసివేయబడ్డాయి. ఇప్పుడేం?'),
        a: L(
          'Windows open corporation-wise for short periods. Keep this DPR ready and watch apobmms.apcfss.in / district welfare announcements.',
          'విండోలు కార్పొరేషన్ ప్రకారం కొద్ది కాలం తెరుచుకుంటాయి. ఈ DPR సిద్ధంగా ఉంచి apobmms.apcfss.in / జిల్లా సంక్షేమ ప్రకటనలు చూడండి.'
        ),
      },
    ],
    quickInfo: {
      ministry: AP_WELFARE,
      category: L('Subsidy-linked self-employment loan', 'సబ్సిడీ-లింక్డ్ స్వయం ఉపాధి రుణం'),
      type: STATE,
      status: ACTIVE,
    },
    sourceUrl: 'https://apobmms.apcfss.in/',
  },
};

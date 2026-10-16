import { ACTIVE, CENTRAL, L, SchemeBrief } from './types';

const KVIC = L(
  'Ministry of MSME / KVIC',
  'సూక్ష్మ, చిన్న, మధ్య తరహా పరిశ్రమల మంత్రిత్వ శాఖ / KVIC'
);
const MSME_MIN = L('Ministry of MSME', 'సూక్ష్మ, చిన్న, మధ్య తరహా పరిశ్రమల మంత్రిత్వ శాఖ');
const MOFPI = L('Ministry of Food Processing Industries', 'ఆహార ప్రాసెసింగ్ పరిశ్రమల మంత్రిత్వ శాఖ');
const MOHUA = L('Ministry of Housing & Urban Affairs', 'గృహనిర్మాణం మరియు పట్టణ వ్యవహారాల మంత్రిత్వ శాఖ');
const DFS = L('Department of Financial Services, Ministry of Finance', 'ఆర్థిక సేవల విభాగం, ఆర్థిక మంత్రిత్వ శాఖ');
const DOC = L('Ministry of Commerce & Industry / DGFT', 'వాణిజ్యం మరియు పరిశ్రమల మంత్రిత్వ శాఖ / DGFT');

export const VANILLA_BRIEF: SchemeBrief = {
  code: '',
  title: L('Bank term loan (no scheme overlay)', 'బ్యాంకు టర్మ్ లోన్ (పథకం లేకుండా)'),
  intro: L(
    'This DPR is drafted as a standard bank term-loan proposal. No central or Andhra Pradesh subsidy overlay is applied until you pick a scheme.',
    'ఈ DPR సాధారణ బ్యాంకు టర్మ్-లోన్ ప్రతిపాదనగా రూపొందుతుంది. పథకం ఎంచుకునే వరకు కేంద్ర లేదా ఆంధ్రప్రదేశ్ సబ్సిడీ జోడించబడదు.'
  ),
  benefits: [
    L('Bank appraises the unit on viability, security, and cash flow.', 'బ్యాంకు యూనిట్‌ను లాభదాయకత, భద్రత, నగదు ప్రవాహం ఆధారంగా పరిశీలిస్తుంది.'),
    L('You can still switch to a matching scheme later; the form will add scheme-specific fields.', 'తర్వాత సరిపోయే పథకానికి మారవచ్చు; ఫారమ్‌లో ఆ పథకం ఫీల్డ్‌లు వస్తాయి.'),
    L('Use Scheme Finder first if you are unsure which scheme fits.', 'ఏ పథకం సరిపోతుందో తెలియకపోతే ముందు స్కీమ్ ఫైండర్ వాడండి.'),
  ],
  eligibility: [
    L('Depends on the lending bank’s MSME / retail credit policy.', 'బ్యాంకు MSME / రిటైల్ క్రెడిట్ విధానంపై ఆధారపడి ఉంటుంది.'),
    L('A viable project, KYC, and usual bank documents are required.', 'సాధ్యమైన ప్రాజెక్ట్, KYC, సాధారణ బ్యాంకు పత్రాలు అవసరం.'),
  ],
  howToApply: [
    L('Complete this DPR and take it to your bank with quotations and KYC.', 'ఈ DPR పూర్తి చేసి కోటేషన్లు, KYCతో బ్యాంకుకు తీసుకెళ్లండి.'),
    L('If a scheme later applies, re-select it here so uploads and steps match that scheme.', 'తర్వాత పథకం వర్తిస్తే ఇక్కడ మళ్లీ ఎంచుకోండి, అప్‌లోడ్‌లు మరియు దశలు సరిపోతాయి.'),
  ],
  documents: [
    L('Aadhaar / PAN', 'ఆధార్ / పాన్'),
    L('Udyam certificate (if you have it)', 'ఉద్యమ్ సర్టిఫికేట్ (ఉంటే)'),
    L('Bank passbook', 'బ్యాంకు పాస్‌బుక్'),
    L('Machinery / equipment quotations', 'యంత్రాల / పరికరాల కోటేషన్లు'),
  ],
  faqs: [
    {
      q: L('Is this a government subsidy?', 'ఇది ప్రభుత్వ సబ్సిడీనా?'),
      a: L(
        'No. Vanilla means a normal bank loan DPR. Pick PMEGP, MUDRA, AP EDP, or another scheme above to overlay that scheme’s rules.',
        'కాదు. వెనిల్లా అంటే సాధారణ బ్యాంకు లోన్ DPR. PMEGP, MUDRA, AP EDP లేదా మరో పథకం పైన ఎంచుకుంటే ఆ నియమాలు వర్తిస్తాయి.'
      ),
    },
  ],
  quickInfo: {
    ministry: L('Lending bank', 'రుణమిచ్చే బ్యాంకు'),
    category: L('Term loan', 'టర్మ్ లోన్'),
    type: L('No scheme overlay', 'పథకం లేదు'),
    status: ACTIVE,
  },
  sourceUrl: '',
};

export const CENTRAL_BRIEFS: Record<string, SchemeBrief> = {
  PMEGP: {
    code: 'PMEGP',
    title: L(
      "Prime Minister's Employment Generation Programme (PMEGP)",
      'ప్రధానమంత్రి ఉపాధి సృష్టి కార్యక్రమం (PMEGP)'
    ),
    intro: L(
      'PMEGP is a credit-linked subsidy scheme of the Ministry of MSME to help set up new micro-enterprises. KVIC, State KVIB, and District Industries Centres implement it with bank finance. The AP MSME One listing described manufacturing units up to ₹25 lakh and business/service units up to ₹10 lakh; current KVIC guidelines allow higher project-cost ceilings (₹50 lakh manufacturing / ₹20 lakh service). Confirm the live cap with KVIC / DIC before you lock the DPR cost.',
      'PMEGP అనేది కొత్త సూక్ష్మ పరిశ్రమలు పెట్టడానికి MSME మంత్రిత్వ శాఖ క్రెడిట్-లింక్డ్ సబ్సిడీ పథకం. KVIC, రాష్ట్ర KVIB, జిల్లా పరిశ్రమల కేంద్రాలు బ్యాంకు రుణంతో అమలు చేస్తాయి. AP MSME One జాబితాలో తయారీకి ₹25 లక్షలు, వ్యాపారం/సేవకు ₹10 లక్షలు అని ఉంది; ప్రస్తుత KVIC మార్గదర్శకాలు అధిక పైపరిధి (తయారీ ₹50 లక్షలు / సేవ ₹20 లక్షలు) అనుమతిస్తాయి. DPR ఖర్చు ఖాయం చేసే ముందు KVIC / DICతో నిర్ధారించండి.'
    ),
    benefits: [
      L(
        'Subsidy on project cost: General category 15% (urban) and 25% (rural); Special category 25% (urban) and 35% (rural).',
        'ప్రాజెక్ట్ ఖర్చుపై సబ్సిడీ: సాధారణ వర్గం 15% (పట్టణం), 25% (గ్రామీణం); ప్రత్యేక వర్గం 25% (పట్టణం), 35% (గ్రామీణం).'
      ),
      L(
        'Special category includes SC / ST / OBC / Minorities / Women, Ex-servicemen, Persons with disability, NER, Hill and Border areas.',
        'ప్రత్యేక వర్గంలో SC / ST / OBC / మైనారిటీలు / మహిళలు, మాజీ సైనికులు, వికలాంగులు, NER, కొండ మరియు సరిహద్దు ప్రాంతాలు ఉంటాయి.'
      ),
      L(
        'The bank provides the balance of project cost as term loan and working capital.',
        'మిగిలిన ప్రాజెక్ట్ ఖర్చును బ్యాంకు టర్మ్ లోన్ మరియు వర్కింగ్ క్యాపిటల్‌గా ఇస్తుంది.'
      ),
      L(
        'Own contribution is typically 10% (general) and 5% (special category), as per KVIC guidelines.',
        'స్వంత వాటా సాధారణంగా 10% (సాధారణ వర్గం), 5% (ప్రత్యేక వర్గం) — KVIC మార్గదర్శకాల ప్రకారం.'
      ),
    ],
    eligibility: [
      L('New (greenfield) micro-enterprise only — not an existing unit expansion.', 'కొత్త (గ్రీన్‌ఫీల్డ్) సూక్ష్మ యూనిట్ మాత్రమే — ఉన్న యూనిట్ విస్తరణ కాదు.'),
      L('Applicant should be 18 years or older.', 'దరఖాస్తుదారు 18 ఏళ్లు లేదా అంతకంటే ఎక్కువ ఉండాలి.'),
      L('Registered sole proprietorship, partnership, or company (not an unregistered firm).', 'నమోదైన ఏకస్వామ్యం, భాగస్వామ్యం లేదా కంపెనీ (నమోదు కాని సంస్థ కాదు).'),
      L(
        'If project cost is above ₹10 lakh (manufacturing) or ₹5 lakh (service), 8th-class pass is required.',
        'ప్రాజెక్ట్ ఖర్చు తయారీలో ₹10 లక్షలు లేదా సేవలో ₹5 లక్షలు మించితే 8వ తరగతి ఉత్తీర్ణత అవసరం.'
      ),
      L(
        'Eligible activities include manufacturing, services, trade, food processing, crafts, and knowledge/tech services — not crop-only farming.',
        'అర్హమైన కార్యకలాపాలు: తయారీ, సేవలు, వ్యాపారం, ఆహార ప్రాసెసింగ్, హస్తకళలు, నాలెడ్జ్/టెక్ సేవలు — కేవలం పంటల వ్యవసాయం కాదు.'
      ),
      L(
        'A unit that has already received a government subsidy under PMRY, REGP, PMEGP, CMEGP, or any other central or state scheme is not eligible for a new PMEGP project. Only one person in the family (self, spouse, and unmarried children) can take it. A second loan is a separate path, and only for an existing PMEGP, REGP, or MUDRA unit whose first loan was repaid on time.',
        'PMRY, REGP, PMEGP, CMEGP లేదా ఇతర కేంద్ర/రాష్ట్ర పథకం కింద ప్రభుత్వ సబ్సిడీ ఇప్పటికే పొందిన యూనిట్ కొత్త PMEGPకు అర్హం కాదు. కుటుంబంలో ఒకరు మాత్రమే (మీరు, భార్య/భర్త, అవివాహిత పిల్లలు). రెండవ రుణం వేరు మార్గం — ఇప్పటికే PMEGP, REGP లేదా MUDRA ఉండి మొదటి రుణం సమయానికి చెల్లించిన యూనిట్‌కు మాత్రమే.'
      ),
    ],
    howToApply: [
      L('Apply online on the KVIC PMEGP portal (kviconline.gov.in) choosing KVIC, KVIB, or DIC as the implementing agency.', 'KVIC PMEGP పోర్టల్ (kviconline.gov.in)లో KVIC, KVIB లేదా DICని అమలు సంస్థగా ఎంచుకుని ఆన్‌లైన్ దరఖాస్తు చేయండి.'),
      L('Attach a bank-style unit DPR (not a multi-unit CFC), quotations, and KYC. Create New Latest DPR with PMEGP selected builds that structure — see docs/schemes/PMEGP/pmegp.md.', 'బ్యాంకు-శైలి యూనిట్ DPR (మల్టీ-యూనిట్ CFC కాదు), కోటేషన్లు, KYC జత చేయండి. PMEGP ఎంచుకుని Create New Latest DPR అదే నిర్మాణం ఇస్తుంది.'),
      L('The agency forwards a recommended case to a bank for appraisal and sanction.', 'సంస్థ సిఫారసు చేసిన కేసును బ్యాంకుకు పంపి మంజూరు చేయిస్తుంది.'),
      L('After the unit is set up and verified, subsidy is parked as a term deposit (back-ended) with the bank.', 'యూనిట్ ఏర్పాటు, ధృవీకరణ తర్వాత సబ్సిడీ బ్యాంకులో టర్మ్ డిపాజిట్‌గా (బ్యాక్-ఎండెడ్) ఉంచబడుతుంది.'),
    ],
    documents: [
      L('Aadhaar, PAN, and passport-size photographs', 'ఆధార్, పాన్, పాస్‌పోర్ట్ సైజు ఫోటోలు'),
      L('Caste / special-category certificate if claiming higher subsidy', 'ఎక్కువ సబ్సిడీ కోసం కుల / ప్రత్యేక వర్గ ధృవపత్రం'),
      L('Educational certificate (8th pass) when the project-cost education gate applies', 'ప్రాజెక్ట్ ఖర్చు విద్యా నియమం వర్తిస్తే 8వ తరగతి సర్టిఫికేట్'),
      L('Machinery quotations and building estimate', 'యంత్రాల కోటేషన్లు మరియు భవన అంచనా'),
      L('Rural / urban location proof and bank account details', 'గ్రామీణ / పట్టణ స్థలం రుజువు మరియు బ్యాంకు ఖాతా వివరాలు'),
    ],
    faqs: [
      {
        q: L('Can an existing unit apply?', 'ఉన్న యూనిట్ దరఖాస్తు చేయవచ్చా?'),
        a: L(
          'No. PMEGP is for new units. Existing units looking to upgrade should look at AP Technology Upgrade, MSE-SPICE, or a bank term loan.',
          'కాదు. PMEGP కొత్త యూనిట్లకు. అప్‌గ్రేడ్ కావాలంటే AP టెక్నాలజీ అప్‌గ్రేడ్, MSE-SPICE లేదా బ్యాంకు టర్మ్ లోన్ చూడండి.'
        ),
      },
      {
        q: L('Who pays the rest of the project cost?', 'మిగిలిన ప్రాజెక్ట్ ఖర్చు ఎవరు కడతారు?'),
        a: L(
          'You bring the own contribution; the bank funds the rest as loan; the government subsidy is credit-linked and back-ended.',
          'మీరు స్వంత వాటా పెడతారు; మిగిలింది బ్యాంకు రుణం; ప్రభుత్వ సబ్సిడీ క్రెడిట్-లింక్డ్, బ్యాక్-ఎండెడ్.'
        ),
      },
      {
        q: L('Where did this summary come from?', 'ఈ సారాంశం ఎక్కడి నుంది?'),
        a: L(
          'Subsidy rates follow the AP MSME One PMEGP page. Project-cost ceilings follow current KVIC guidelines. The Create New Latest DPR question set follows KVIC common project profiles (bakery, curd, aluminium, etc.) and the official PMEGP Excel DPR layout.',
          'సబ్సిడీ రేట్లు AP MSME One PMEGP పేజీ నుండి. ప్రాజెక్ట్ పైపరిధి ప్రస్తుత KVIC మార్గదర్శకాలు. Create New Latest DPR ప్రశ్నలు KVIC కామన్ ప్రాజెక్ట్ ప్రొఫైల్స్ మరియు అధికారిక PMEGP Excel DPR లేఅవుట్ ప్రకారం.'
        ),
      },
    ],
    quickInfo: {
      ministry: KVIC,
      category: L('Credit-linked subsidy', 'క్రెడిట్-లింక్డ్ సబ్సిడీ'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://apmsmeone.ap.gov.in/Public/Schemes.aspx?ID=PMEGP',
  },

  PMFME: {
    code: 'PMFME',
    title: L(
      'PM Formalisation of Micro Food Processing Enterprises (PMFME)',
      'ప్రధానమంత్రి సూక్ష్మ ఆహార ప్రాసెసింగ్ యూనిట్ల అధికారికీకరణ (PMFME)'
    ),
    intro: L(
      'The Scheme is for new and existing micro food processing enterprises and also adopts a One District One Product (ODOP) approach. Create New Latest DPR follows MoFPI / NIFTEM model DPR structure — see docs/schemes/PMFME/pmfme.md.',
      'కొత్త మరియు ఉన్న సూక్ష్మ ఆహార ప్రాసెసింగ్ యూనిట్లకు; వన్ డిస్ట్రిక్ట్ వన్ ప్రాడక్ట్ (ODOP) విధానం కూడా ఉంది. Create New Latest DPR MoFPI / NIFTEM మోడల్ DPR నిర్మాణం అనుసరిస్తుంది.'
    ),
    benefits: [
      L(
        'Individual micro food processing units can avail credit-linked capital subsidy at 35% of eligible project cost, ceiling ₹10 lakh per unit.',
        'వ్యక్తిగత సూక్ష్మ ఆహార ప్రాసెసింగ్ యూనిట్లు అర్హ ప్రాజెక్ట్ ఖర్చులో 35% క్రెడిట్-లింక్డ్ క్యాపిటల్ సబ్సిడీ పొందవచ్చు, పైపరిధి యూనిట్‌కు ₹10 లక్షలు.'
      ),
      L(
        'Beneficiary contribution should be minimum 10%; the balance should be a bank loan.',
        'లబ్ధిదారు వాటా కనీసం 10%; మిగిలింది బ్యాంకు రుణం.'
      ),
      L(
        'Support to FPOs / SHGs / Cooperatives for capital investment along the value chain with credit-linked grant at 35%.',
        'FPO / SHG / సహకార సంఘాలకు విలువ గొలుసులో మూలధన పెట్టుబడికి 35% క్రెడిట్-లింక్డ్ గ్రాంట్.'
      ),
      L(
        'Seed capital of ₹40,000 per SHG member engaged in food processing, for working capital and small tools.',
        'ఆహార ప్రాసెసింగ్‌లో ఉన్న SHG సభ్యునికి ₹40,000 సీడ్ క్యాపిటల్ — వర్కింగ్ క్యాపిటల్ మరియు చిన్న పనిముట్లు.'
      ),
      L(
        'Credit-linked grant at 35% for common infrastructure (processing, lab, warehouse, cold storage, packaging, incubation). Branding and marketing support up to 50% of expenditure.',
        'సాధారణ మౌలిక సదుపాయాలకు (ప్రాసెసింగ్, ల్యాబ్, గోదాము, కోల్డ్ స్టోరేజ్, ప్యాకేజింగ్, ఇన్క్యుబేషన్) 35% క్రెడిట్-లింక్డ్ గ్రాంట్. బ్రాండింగ్/మార్కెటింగ్‌కు ఖర్చులో 50% వరకు మద్దతు.'
      ),
    ],
    eligibility: [
      L('Food processing activity (bakery, pickle, spices, milling, and similar units).', 'ఆహార ప్రాసెసింగ్ కార్యకలాపం (బేకరీ, ఊరగాయ, మసాలా, మిల్లింగ్ మొదలైనవి).'),
      L('New or existing micro units; ODOP products are preferred but not compulsory.', 'కొత్త లేదా ఉన్న సూక్ష్మ యూనిట్లు; ODOPకు ప్రాధాన్యం కానీ తప్పనిసరి కాదు.'),
      L('Sole owner, partnership, SHG, FPO, or cooperative. Project cost in Scheme Finder is treated as up to about ₹50 lakh.', 'ఏకస్వామ్యం, భాగస్వామ్యం, SHG, FPO లేదా సహకారం. స్కీమ్ ఫైండర్‌లో ప్రాజెక్ట్ ఖర్చు సుమారు ₹50 లక్షల వరకు.'),
      L('8th-class pass (Scheme Finder gate). Plan for FSSAI registration.', '8వ తరగతి ఉత్తీర్ణత (స్కీమ్ ఫైండర్ నియమం). FSSAI నమోదు ప్లాన్ చేయండి.'),
      L(
        'You may apply even after a loan under another subsidy-linked scheme, and you may use other schemes at the same time, as long as the same benefit is not paid twice. Only one person in the family (self, spouse, and children) can take this assistance.',
        'మరో సబ్సిడీ-లింక్డ్ పథకం కింద రుణం తీసుకున్నా దరఖాస్తు చేయవచ్చు. ఇతర పథకాలు కలిపి వాడవచ్చు, అదే ప్రయోజనం రెండు సార్లు రాకూడదు. కుటుంబంలో ఒకరు మాత్రమే (మీరు, భార్య/భర్త, పిల్లలు).'
      ),
    ],
    howToApply: [
      L('Apply on the national PMFME portal through the State Nodal Agency (Andhra Pradesh).', 'జాతీయ PMFME పోర్టల్‌లో రాష్ట్ర నోడల్ ఏజెన్సీ (ఆంధ్రప్రదేశ్) ద్వారా దరఖాస్తు చేయండి.'),
      L('Create New Latest DPR with PMFME selected builds a 14-step food-unit pack aligned to NIFTEM model DPRs.', 'PMFME ఎంచుకుంటే Create New Latest DPR NIFTEM మోడల్ DPRలకు అనుగుణంగా 14-దశల ఫుడ్-యూనిట్ ప్యాక్ ఇస్తుంది.'),
      L('Upload a DPR, machinery quotations, premises proof, and draft FSSAI details.', 'DPR, యంత్రాల కోటేషన్లు, ప్రాంగణం రుజువు, డ్రాఫ్ట్ FSSAI వివరాలు అప్‌లోడ్ చేయండి.'),
      L('Bank appraisal follows; subsidy is credit-linked.', 'తర్వాత బ్యాంకు పరిశీలన; సబ్సిడీ క్రెడిట్-లింక్డ్.'),
    ],
    documents: [
      L('Machinery quotations', 'యంత్రాల కోటేషన్లు'),
      L('Land / premises lease or ownership proof', 'భూమి / ప్రాంగణం లీజు లేదా యాజమాన్య రుజువు'),
      L('Draft FSSAI registration', 'డ్రాఫ్ట్ FSSAI నమోదు'),
      L('Aadhaar, PAN, bank details, Udyam if available', 'ఆధార్, పాన్, బ్యాంకు వివరాలు, ఉద్యమ్ ఉంటే'),
    ],
    faqs: [
      {
        q: L('Is the ₹10 lakh ceiling on subsidy or on project cost?', '₹10 లక్షల పైపరిధి సబ్సిడీపైనా లేదా ప్రాజెక్ట్ ఖర్చుపైనా?'),
        a: L(
          'On the subsidy: credit-linked capital grant @35% of eligible project cost, ceiling ₹10 lakh per individual micro unit. Own contribution must be at least 10%.',
          'సబ్సిడీపై: అర్హ ప్రాజెక్ట్ ఖర్చులో 35% క్రెడిట్-లింక్డ్ క్యాపిటల్ గ్రాంట్, వ్యక్తిగత సూక్ష్మ యూనిట్‌కు ₹10 లక్షల పైపరిధి. స్వంత వాటా కనీసం 10%.'
        ),
      },
      {
        q: L('Are only existing units eligible?', 'ఉన్న యూనిట్లు మాత్రమే అర్హమా?'),
        a: L(
          'No. Both new micro food processing enterprises and existing units seeking upgrade / expansion are eligible (MoFPI FAQ).',
          'కాదు. కొత్త సూక్ష్మ ఆహార ప్రాసెసింగ్ యూనిట్లు మరియు అప్‌గ్రేడ్ / విస్తరణ కావాలనుకునే ఉన్న యూనిట్లు రెండూ అర్హం.'
        ),
      },
    ],
    quickInfo: {
      ministry: MOFPI,
      category: L('Credit-linked subsidy', 'క్రెడిట్-లింక్డ్ సబ్సిడీ'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://pmfme.mofpi.gov.in/pmfme/#/Home-Page',
  },

  MUDRA: {
    code: 'MUDRA',
    title: L('Pradhan Mantri MUDRA Yojana (PMMY)', 'ప్రధానమంత్రి ముద్రా యోజన (PMMY)'),
    intro: L(
      'MUDRA (Micro Units Development & Refinance Agency Ltd.) refinances banks, NBFCs and MFIs that lend to non-corporate small businesses in manufacturing, trading, services, and agri-allied activity. It is not a direct lending institution. This summary uses the AP MSME One FAQ, with current PMMY product names (including Tarun Plus up to ₹20 lakh).',
      'MUDRA బ్యాంకులు, NBFCలు, MFIలకు రీఫైనాన్స్ ఇస్తుంది — తయారీ, వ్యాపారం, సేవలు, వ్యవసాయ అనుబంధ కార్యకలాపాల్లోని నాన్-కార్పొరేట్ చిన్న వ్యాపారాలకు. ఇది నేరుగా రుణమిచ్చే సంస్థ కాదు. ఈ సారాంశం AP MSME One FAQ మరియు ప్రస్తుత PMMY ఉత్పత్తులు (Tarun Plus ₹20 లక్షల వరకు) ఆధారంగా.'
    ),
    benefits: [
      L(
        'Collateral-light working-capital / term loans for income-generating micro businesses, accessed through a bank, NBFC, or MFI.',
        'ఆదాయం పుట్టించే సూక్ష్మ వ్యాపారాలకు తక్కువ కొలేటరల్‌తో వర్కింగ్ క్యాపిటల్ / టర్మ్ లోన్ — బ్యాంకు, NBFC లేదా MFI ద్వారా.'
      ),
      L(
        'Product bands: Shishu (up to ₹50,000), Kishore (above ₹50,000 to ₹5 lakh), Tarun (above ₹5 lakh to ₹10 lakh). Tarun Plus covers above ₹10 lakh up to ₹20 lakh.',
        'ఉత్పత్తులు: శిశు (₹50,000 వరకు), కిశోర్ (₹50,000 నుండి ₹5 లక్షలు), తరుణ్ (₹5 లక్షల నుండి ₹10 లక్షలు). తరుణ్ ప్లస్ ₹10 లక్షల నుండి ₹20 లక్షల వరకు.'
      ),
      L(
        'Food processing, trading, shopkeeping, and many service activities are eligible (AP MSME One FAQ).',
        'ఆహార ప్రాసెసింగ్, వ్యాపారం, దుకాణాలు, అనేక సేవా కార్యకలాపాలు అర్హం (AP MSME One FAQ).'
      ),
    ],
    eligibility: [
      L('Indian citizen with a business plan for a new or existing micro unit in manufacturing, processing, trade, or services.', 'తయారీ, ప్రాసెసింగ్, వ్యాపారం లేదా సేవల్లో కొత్త/ఉన్న సూక్ష్మ యూనిట్‌కు వ్యాపార ప్రణాళిక ఉన్న భారత పౌరుడు.'),
      L('Registered sole / partnership / company in Scheme Finder. Age 18 or older. Udyam ready or willing.', 'స్కీమ్ ఫైండర్‌లో నమోదైన ఏకస్వామ్యం / భాగస్వామ్యం / కంపెనీ. 18 ఏళ్లు+. ఉద్యమ్ ఉండాలి లేదా తీసుకోవడానికి సిద్ధం.'),
      L('Scheme Finder treats the MUDRA cap as ₹20 lakh project cost.', 'స్కీమ్ ఫైండర్ MUDRA పైపరిధిని ₹20 లక్షల ప్రాజెక్ట్ ఖర్చుగా తీసుకుంటుంది.'),
    ],
    howToApply: [
      L('Approach any bank / NBFC / MFI that offers PMMY. MUDRA itself does not sanction your loan.', 'PMMY ఇచ్చే బ్యాంకు / NBFC / MFIని సంప్రదించండి. MUDRA మీ రుణాన్ని నేరుగా మంజూరు చేయదు.'),
      L('Shishu uses a one-page application; Kishore / Tarun use a longer indicative format (mudra.org.in).', 'శిశుకు ఒక పేజీ దరఖాస్తు; కిశోర్ / తరుణ్‌కు పొడవైన ఫారమ్ (mudra.org.in).'),
      L('Create New Latest DPR with MUDRA selected builds a 12-step bank-unit pack — see docs/schemes/MUDRA/mudra.md. Under ₹5 lakh, land-building tables are hidden.', 'MUDRA ఎంచుకుంటే Create New Latest DPR 12-దశల బ్యాంకు-యూనిట్ ప్యాక్ ఇస్తుంది. ₹5 లక్షల లోపు భూమి-భవన పట్టికలు దాచబడతాయి.'),
    ],
    documents: [
      L('KYC, business proof / shop proof, bank statements', 'KYC, వ్యాపారం / దుకాణం రుజువు, బ్యాంకు స్టేట్‌మెంట్లు'),
      L('Quotations for machinery or stock as applicable', 'యంత్రాలు లేదా స్టాక్ కోటేషన్లు'),
      L('Udyam / GST if already registered', 'ఉద్యమ్ / GST నమోదు ఉంటే'),
      L('Previous Mudra closure certificate if applying under Tarun Plus', 'తరుణ్ ప్లస్ అయితే మునుపటి ముద్రా క్లోజర్ సర్టిఫికేట్'),
    ],
    faqs: [
      {
        q: L('What is Mudra?', 'ముద్రా అంటే ఏమిటి?'),
        a: L(
          'MUDRA is a refinance agency set up for development and refinancing of micro unit enterprises. It funds last-mile lenders (banks, NBFCs, MFIs), who then finance you. (AP MSME One FAQ)',
          'MUDRA సూక్ష్మ యూనిట్ల అభివృద్ధి మరియు రీఫైనాన్స్ కోసం ఏర్పాటైన సంస్థ. బ్యాంకులు, NBFCలు, MFIలకు నిధులు ఇస్తుంది; అవి మీకు రుణం ఇస్తాయి. (AP MSME One FAQ)'
        ),
      },
      {
        q: L('Does Mudra give a subsidy?', 'ముద్రా సబ్సిడీ ఇస్తుందా?'),
        a: L(
          'No capital subsidy. It is a loan product. Interest and security follow the lender’s PMMY norms.',
          'క్యాపిటల్ సబ్సిడీ లేదు. ఇది రుణ ఉత్పత్తి. వడ్డీ, భద్రత లెండర్ PMMY నియమాల ప్రకారం.'
        ),
      },
    ],
    quickInfo: {
      ministry: DFS,
      category: L('Refinance / micro loan', 'రీఫైనాన్స్ / సూక్ష్మ రుణం'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://apmsmeone.ap.gov.in/Public/FAQ.aspx',
  },

  CGTMSE: {
    code: 'CGTMSE',
    title: L(
      'Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)',
      'సూక్ష్మ మరియు చిన్న పరిశ్రమల క్రెడిట్ గ్యారెంటీ ఫండ్ ట్రస్ట్ (CGTMSE)'
    ),
    intro: L(
      'The Ministry of MSME and SIDBI set up CGTMSE so lenders can give MSEs credit without collateral or third-party guarantee, focusing on project viability. Text below follows the AP MSME One FAQ (guarantee historically described up to ₹2 crore / about 85% of default). Current CGTMSE products and women-owned cover (up to 90% in Scheme Finder) should be confirmed with the lender at cgtmse.in.',
      'MSME మంత్రిత్వ శాఖ మరియు SIDBI CGTMSEని ఏర్పాటు చేశాయి, తద్వారా లెండర్లు కొలేటరల్ లేకుండా MSEలకు రుణం ఇవ్వగలరు. క్రింది వచనం AP MSME One FAQ (గతంలో ₹2 కోట్లు / డిఫాల్ట్‌లో సుమారు 85%). ప్రస్తుత ఉత్పత్తులు మరియు మహిళా యూనిట్ల కవర్ (స్కీమ్ ఫైండర్‌లో 90% వరకు) లెండర్ / cgtmse.inతో నిర్ధారించండి.'
    ),
    benefits: [
      L(
        'Enables collateral-free / third-party-guarantee-free credit so the bank can rely on the assets financed and the project.',
        'కొలేటరల్ / థర్డ్-పార్టీ గ్యారెంటీ లేని రుణం — బ్యాంకు నిధుల ఆస్తులు మరియు ప్రాజెక్ట్‌పై ఆధారపడగలదు.'
      ),
      L(
        'If the MSE defaults, the Trust makes good a large share of the lender’s loss (FAQ: up to 85%).',
        'MSE డిఫాల్ట్ అయితే ట్రస్ట్ లెండర్ నష్టంలో పెద్ద భాగం భరిస్తుంది (FAQ: 85% వరకు).'
      ),
      L('Women-owned units typically get a higher guarantee cover (Scheme Finder: up to 90%).', 'మహిళా యూనిట్లకు సాధారణంగా ఎక్కువ గ్యారెంటీ కవర్ (స్కీమ్ ఫైండర్: 90% వరకు).'),
    ],
    eligibility: [
      L('New or existing Micro or Small Enterprise with a registered firm and Udyam (or willingness to obtain it).', 'నమోదైన సంస్థ మరియు ఉద్యమ్ (లేదా తీసుకోవడానికి సిద్ధం) ఉన్న కొత్త లేదా ఉన్న సూక్ష్మ/చిన్న పరిశ్రమ.'),
      L('Scheme Finder treats project cost under ₹10 crore as in range.', 'స్కీమ్ ఫైండర్ ప్రాజెక్ట్ ఖర్చు ₹10 కోట్ల లోపు అని తీసుకుంటుంది.'),
      L('You apply to a Member Lending Institution; CGTMSE cover is taken by the bank, not as a separate citizen portal grant.', 'మీరు సభ్య రుణ సంస్థకు దరఖాస్తు చేస్తారు; CGTMSE కవర్ బ్యాంకు తీసుకుంటుంది, ప్రత్యేక పౌర గ్రాంట్ కాదు.'),
    ],
    howToApply: [
      L('Ask your bank to sanction the MSE loan under CGTMSE instead of taking extra property as security.', 'అదనపు ఆస్తి తీసుకోకుండా CGTMSE కింద MSE రుణం మంజూరు చేయమని బ్యాంకును అడగండి.'),
      L('The bank pays a guarantee / annual service fee to CGTMSE.', 'బ్యాంకు CGTMSEకి గ్యారెంటీ / వార్షిక సర్వీస్ ఫీజు చెల్లిస్తుంది.'),
      L('Use this DPR so the bank can assess viability without collateral.', 'కొలేటరల్ లేకుండా లాభదాయకత చూడటానికి ఈ DPRని వాడండి.'),
    ],
    documents: [
      L('Udyam, KYC, financials / projections, quotations', 'ఉద్యమ్, KYC, ఆర్థికాలు / అంచనాలు, కోటేషన్లు'),
      L('Bank’s CGTMSE application (filled by the lender)', 'బ్యాంకు CGTMSE దరఖాస్తు (లెండర్ నింపుతారు)'),
    ],
    faqs: [
      {
        q: L('What is CGTMSE?', 'CGTMSE అంటే ఏమిటి?'),
        a: L(
          'A credit-guarantee scheme so MSEs can get loans without collaterals or third-party guarantees. See www.cgtmse.in (AP MSME One FAQ).',
          'కొలేటరల్ లేకుండా MSEలకు రుణం రావడానికి క్రెడిట్-గ్యారెంటీ పథకం. www.cgtmse.in చూడండి (AP MSME One FAQ).'
        ),
      },
    ],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Credit guarantee', 'క్రెడిట్ గ్యారెంటీ'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://apmsmeone.ap.gov.in/Public/Schemes.aspx?ID=CGTMSE',
  },

  SVANIDHI: {
    code: 'SVANIDHI',
    title: L("PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)", 'ప్రధానమంత్రి స్ట్రీట్ వెండర్ ఆత్మనిర్భర్ నిధి (PM SVANidhi)'),
    intro: L(
      'A Ministry of Housing & Urban Affairs micro-credit scheme for urban (and peri-urban) street vendors. Collateral-free working-capital loans in three tranches, plus interest subsidy and digital-payment incentives. Create New Latest DPR builds a 10-step vendor pack — see docs/schemes/SVANIDHI/svanidhi.md.',
      'పట్టణ (మరియు పెరి-అర్బన్) వీధి వ్యాపారులకు గృహనిర్మాణం మరియు పట్టణ వ్యవహారాల మంత్రిత్వ శాఖ సూక్ష్మ-రుణ పథకం. మూడు విడతల్లో కొలేటరల్-రహిత వర్కింగ్ క్యాపిటల్, వడ్డీ సబ్సిడీ, డిజిటల్ చెల్లింపు ప్రోత్సాహకాలు. Create New Latest DPR 10-దశల ప్యాక్ ఇస్తుంది.'
    ),
    benefits: [
      L(
        'Working-capital loans in tranches: up to ₹15,000 (12 months), then ₹25,000 (18 months), then ₹50,000 (36 months).',
        'వర్కింగ్ క్యాపిటల్ విడతలు: ₹15,000 వరకు (12 నెలలు), తర్వాత ₹25,000 (18 నెలలు), తర్వాత ₹50,000 (36 నెలలు).'
      ),
      L('Interest subsidy of 7% per annum, credited quarterly on timely repayment.', 'సకాలంలో చెల్లిస్తే సంవత్సరానికి 7% వడ్డీ సబ్సిడీ, త్రైమాసికంగా జమ.'),
      L(
        'Eligible third-tranche vendors can get a UPI-linked RuPay credit card (limit built up to ₹30,000).',
        'మూడవ విడతకు అర్హులైన వ్యాపారులకు UPI-లింక్డ్ RuPay క్రెడిట్ కార్డు (పరిమితి ₹30,000 వరకు).'
      ),
    ],
    eligibility: [
      L('Street vendor, typically 18+, vending in a ULB / census town / peri-urban area.', 'వీధి వ్యాపారి, సాధారణంగా 18+, ULB / సెన్సస్ టౌన్ / పెరి-అర్బన్ ప్రాంతంలో.'),
      L(
        'Certificate of Vending, vendor ID, or a Letter of Recommendation issued digitally on the PM SVANidhi portal (manual LoRs are not valid).',
        'వెండింగ్ సర్టిఫికేట్, వెండర్ ID, లేదా PM SVANidhi పోర్టల్‌లో డిజిటల్‌గా జారీ అయిన సిఫారసు పత్రం (చేతితో రాసిన LoR చెల్లదు).'
      ),
      L('A unique UPI ID linked to the vendor’s bank account is mandatory.', 'వ్యాపారి బ్యాంకు ఖాతాకు లింక్ అయిన ప్రత్యేక UPI ID తప్పనిసరి.'),
    ],
    howToApply: [
      L('Apply on pmsvanidhi.mohua.gov.in, the mobile app, ULB / Block office, or an authorised CSC.', 'pmsvanidhi.mohua.gov.in, మొబైల్ యాప్, ULB / బ్లాక్ కార్యాలయం లేదా అధీకృత CSCలో దరఖాస్తు చేయండి.'),
      L('Without CoV/ID, file an LoR-cum-loan application on the same portal for ULB/Block verification.', 'CoV/ID లేకపోతే అదే పోర్టల్‌లో LoR-కమ్-లోన్ దరఖాస్తు చేసి ULB/బ్లాక్ ధృవీకరణ పొందండి.'),
      L('Create New Latest DPR with PM SVANidhi selected builds a 10-step vendor pack — see docs/schemes/SVANIDHI/svanidhi.md.', 'PM SVANidhi ఎంచుకుంటే Create New Latest DPR 10-దశల వెండర్ ప్యాక్ ఇస్తుంది.'),
    ],
    documents: [
      L('Certificate of Vending or Letter of Recommendation (portal-issued)', 'వెండింగ్ సర్టిఫికేట్ లేదా సిఫారసు పత్రం (పోర్టల్ జారీ)'),
      L('Aadhaar and savings-bank passbook / statement', 'ఆధార్ మరియు సేవింగ్స్ బ్యాంకు పాస్‌బుక్ / స్టేట్‌మెంట్'),
      L('UPI ID linked to that account', 'ఆ ఖాతాకు లింక్ అయిన UPI ID'),
    ],
    faqs: [
      {
        q: L('Is this only for city vendors?', 'ఇది నగర వ్యాపారులకు మాత్రమేనా?'),
        a: L(
          'It started as an urban scheme. Coverage now includes census towns and peri-urban areas where a portal LoR is issued. Scheme Finder still treats it as street vending in an urban location.',
          'పట్టణ పథకంగా మొదలైంది. ఇప్పుడు సెన్సస్ టౌన్లు, పెరి-అర్బన్ ప్రాంతాలు కూడా (పోర్టల్ LoR ఉంటే). స్కీమ్ ఫైండర్ దీన్ని పట్టణ వీధి వ్యాపారంగా తీసుకుంటుంది.'
        ),
      },
    ],
    quickInfo: {
      ministry: MOHUA,
      category: L('Working-capital loan', 'వర్కింగ్-క్యాపిటల్ రుణం'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://pmsvanidhi.mohua.gov.in',
  },

  VISHWAKARMA: {
    code: 'VISHWAKARMA',
    title: L('PM Vishwakarma', 'పీఎం విశ్వకర్మ'),
    intro: L(
      'A Central Sector scheme (Ministry of MSME) for traditional artisans and craftspeople who work with hands and tools in 18 notified trades. It combines recognition, skill training, a toolkit e-voucher, and collateral-free enterprise loans at a concessional 5% interest. Create New Latest DPR builds a 12-step artisan pack — see docs/schemes/VISHWAKARMA/vishwakarma.md.',
      '18 నోటిఫైడ్ వృత్తుల్లో చేతులు/పనిముట్లతో పనిచేసే సాంప్రదాయ కళాకారులకు కేంద్ర పథకం (MSME మంత్రిత్వ శాఖ). గుర్తింపు, నైపుణ్య శిక్షణ, టూల్‌కిట్ ఈ-వోచర్, 5% వడ్డీతో కొలేటరల్-రహిత రుణం. Create New Latest DPR 12-దశల ప్యాక్ ఇస్తుంది.'
    ),
    benefits: [
      L('PM Vishwakarma certificate and ID card.', 'పీఎం విశ్వకర్మ సర్టిఫికేట్ మరియు ఐడి కార్డు.'),
      L('Basic training (5–7 days) and advanced training, with a stipend of ₹500 per day.', 'ప్రాథమిక శిక్షణ (5–7 రోజులు) మరియు అధునాతన శిక్షణ, రోజుకు ₹500 స్టైపెండ్.'),
      L('Toolkit incentive up to ₹15,000 as an e-voucher after skill assessment, used at designated centres.', 'నైపుణ్య అంచనా తర్వాత ₹15,000 వరకు టూల్‌కిట్ ఈ-వోచర్, నిర్ణీత కేంద్రాల్లో వాడాలి.'),
      L(
        'Collateral-free loans: first tranche up to ₹1 lakh (18 months) after basic training; second tranche up to ₹2 lakh (30 months) if the first loan is standard and digital transactions or advanced training are done. Concessional interest 5%, with GoI interest subvention.',
        'కొలేటరల్-రహిత రుణం: ప్రాథమిక శిక్షణ తర్వాత మొదటి విడత ₹1 లక్ష వరకు (18 నెలలు); మొదటి రుణం స్టాండర్డ్‌గా ఉంటే మరియు డిజిటల్ లావాదేవీలు లేదా అధునాతన శిక్షణ ఉంటే రెండవ విడత ₹2 లక్షలు (30 నెలలు). 5% వడ్డీ, కేంద్ర వడ్డీ సబ్వెన్షన్.'
      ),
    ],
    eligibility: [
      L('Self-employed artisan in one of the 18 family-based traditional trades, working with hands and tools in the unorganised sector.', '18 సాంప్రదాయ వృత్తుల్లో ఒకదానిలో చేతులు/పనిముట్లతో పనిచేసే స్వయం ఉపాధి కళాకారుడు.'),
      L('Minimum age 18 on the date of registration.', 'నమోదు రోజున కనీసం 18 ఏళ్లు.'),
      L(
        'Should not have taken a similar central or state self-employment loan in the past 5 years, counted from the sanction date. A person who received PMEGP cannot apply. MUDRA or PM SVANidhi borrowers can apply only after that loan is fully repaid.',
        'గత 5 ఏళ్లలో ఇలాంటి కేంద్ర/రాష్ట్ర స్వయం ఉపాధి రుణం తీసుకోకూడదు; గడువు మంజూరు తేదీ నుండి. PMEGP పొందినవారు దరఖాస్తు చేయలేరు. MUDRA లేదా PM SVANidhi రుణం పూర్తిగా చెల్లించాక మాత్రమే దరఖాస్తు చేయవచ్చు.'
      ),
      L('Only one member per family (spouse and unmarried children). Government employees and their family members are not eligible.', 'కుటుంబంలో ఒక సభ్యుడు మాత్రమే (భార్యాభర్తలు, అవివాహిత పిల్లలు). ప్రభుత్వ ఉద్యోగులు మరియు వారి కుటుంబం అనర్హం.'),
    ],
    howToApply: [
      L('Enrol through a Common Service Centre with Aadhaar biometric authentication.', 'ఆధార్ బయోమెట్రిక్‌తో కామన్ సర్వీస్ సెంటర్ ద్వారా నమోదు.'),
      L('After verification, complete skill assessment and basic training before the first loan tranche.', 'ధృవీకరణ తర్వాత మొదటి రుణ విడతకు ముందు నైపుణ్య అంచనా మరియు ప్రాథమిక శిక్షణ పూర్తి చేయండి.'),
      L('Create New Latest DPR with PM Vishwakarma selected builds a 12-step artisan pack — see docs/schemes/VISHWAKARMA/vishwakarma.md.', 'PM Vishwakarma ఎంచుకుంటే Create New Latest DPR 12-దశల కళాకార ప్యాక్ ఇస్తుంది.'),
    ],
    documents: [
      L('Aadhaar (biometric at CSC)', 'ఆధార్ (CSCలో బయోమెట్రిక్)'),
      L('Savings bank passbook', 'సేవింగ్స్ బ్యాంకు పాస్‌బుక్'),
      L('Ration card (family verification)', 'రేషన్ కార్డు (కుటుంబ ధృవీకరణ)'),
    ],
    faqs: [
      {
        q: L('Which trades are covered?', 'ఏ వృత్తులు కవర్ అవుతాయి?'),
        a: L(
          'Carpenter, boat maker, armourer, blacksmith, hammer and toolkit maker, locksmith, goldsmith, potter, sculptor/stone carver, cobbler, mason, basket/mat/broom/coir weaver, doll & toy maker, barber, garland maker, washerman, tailor, fishing-net maker.',
          'వడ్రంగి, పడవ నిర్మాత, ఆయుధకారుడు, కమ్మరి, సుత్తి/టూల్‌కిట్ తయారీ, తాళాల మేస్త్రీ, కంసాలి, కుమ్మరి, శిల్పి, చెప్పుల కార్మికుడు, రాజ్‌మిస్త్రీ, బుట్ట/చాప/చీపురు/కొబ్బరినార, బొమ్మలు, మంగలి, పూలమాల, చాకలి, దర్జీ, వలలు.'
        ),
      },
    ],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Toolkit + training + loan', 'టూల్‌కిట్ + శిక్షణ + రుణం'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://pmvishwakarma.gov.in',
  },

  STANDUP: {
    code: 'STANDUP',
    title: L('Stand-Up India', 'స్టాండ్-అప్ ఇండియా'),
    intro: L(
      'Department of Financial Services scheme to help SC, ST, and women entrepreneurs set up greenfield enterprises. Composite bank loans from above ₹10 lakh to ₹1 crore in manufacturing, services, trading, or agri-allied activity. The original scheme window ran to 31 March 2025; a successor scheme for first-time women / SC / ST entrepreneurs has been announced. Confirm with your bank / standupmitra.in whether they are still sanctioning under Stand-Up India or the successor product.',
      'SC, ST, మహిళా వ్యవస్థాపకుల కొత్త యూనిట్లకు ఆర్థిక సేవల విభాగం పథకం. తయారీ, సేవలు, వ్యాపారం లేదా వ్యవసాయ అనుబంధంలో ₹10 లక్షల నుండి ₹1 కోటి వరకు కాంపోజిట్ రుణం. అసలు విండో 31 మార్చి 2025 వరకు; వారస పథకం ప్రకటించబడింది. బ్యాంకు / standupmitra.inతో నిర్ధారించండి.'
    ),
    benefits: [
      L('Composite term loan + working capital from above ₹10 lakh up to ₹1 crore.', '₹10 లక్షల నుండి ₹1 కోటి వరకు టర్మ్ లోన్ + వర్కింగ్ క్యాపిటల్.'),
      L('Meant for the first-time (greenfield) venture of the beneficiary in that activity.', 'ఆ కార్యకలాపంలో లబ్ధిదారుని మొదటి (గ్రీన్‌ఫీల్డ్) వ్యాపారానికి.'),
      L('Margin typically up to 15%, with the borrower bringing at least 10% own contribution; may converge with other eligible subsidies.', 'మార్జిన్ సాధారణంగా 15% వరకు; ఋణగ్రహీత కనీసం 10% స్వంత వాటా. ఇతర అర్హ సబ్సిడీలతో కలిపి పొందవచ్చు.'),
    ],
    eligibility: [
      L('Woman, SC, or ST entrepreneur aged 18+, holding 51% or more in a non-individual firm.', '18+ మహిళ, SC లేదా ST వ్యవస్థాపకుడు; సంస్థలో 51% లేదా ఎక్కువ వాటా.'),
      L('Greenfield project only. Registered sole / partnership / company. Udyam ready or willing.', 'గ్రీన్‌ఫీల్డ్ మాత్రమే. నమోదైన ఏకస్వామ్యం / భాగస్వామ్యం / కంపెనీ. ఉద్యమ్ సిద్ధం.'),
      L('Not a bank defaulter. Scheme Finder loan band: ₹10 lakh to ₹1 crore.', 'బ్యాంకు డిఫాల్టర్ కాకూడదు. స్కీమ్ ఫైండర్ రుణ పరిధి: ₹10 లక్షలు నుండి ₹1 కోటి.'),
    ],
    howToApply: [
      L('Apply through a Scheduled Commercial Bank branch, or seek handholding on standupmitra.in (SIDBI).', 'షెడ్యూల్డ్ కమర్షియల్ బ్యాంకు శాఖ ద్వారా, లేదా standupmitra.in (SIDBI)లో సహాయం పొందండి.'),
      L('Create New Latest DPR with Stand-Up India selected builds a 13-step bank-unit pack — see docs/schemes/STANDUP/standup.md.', 'Stand-Up India ఎంచుకుంటే Create New Latest DPR 13-దశల బ్యాంకు-యూనిట్ ప్యాక్ ఇస్తుంది.'),
      L('This DPR is the project report the bank will appraise (machinery, capacity, P&L for tenor, buyers, competitors).', 'ఈ DPRనే బ్యాంకు ప్రాజెక్ట్ రిపోర్ట్‌గా పరిశీలిస్తుంది.'),
    ],
    documents: [
      L('KYC, caste certificate (if SC/ST), proof of 51% ownership for firms', 'KYC, కుల ధృవపత్రం (SC/ST అయితే), సంస్థల్లో 51% యాజమాన్యం'),
      L('Udyam, quotations, land/lease if any', 'ఉద్యమ్, కోటేషన్లు, భూమి/లీజు'),
    ],
    faqs: [
      {
        q: L('Can a general-category man apply in his own name?', 'సాధారణ వర్గం పురుషుడు తన పేరుతో దరఖాస్తు చేయవచ్చా?'),
        a: L(
          'Not under Stand-Up India. The borrower (or 51% controlling stake) must be a woman, SC, or ST.',
          'స్టాండ్-అప్ ఇండియా కింద కాదు. ఋణగ్రహీత (లేదా 51% నియంత్రణ) మహిళ, SC లేదా ST అయి ఉండాలి.'
        ),
      },
      {
        q: L('Is this a capital-subsidy scheme like PMEGP?', 'ఇది PMEGP లాంటి క్యాపిటల్ సబ్సిడీ పథకమా?'),
        a: L(
          'No. Stand-Up India is a composite bank loan (term + WC). Own contribution must be at least 10% of project cost. Other eligible subsidies may converge, but the product itself is credit, not margin money.',
          'కాదు. Stand-Up India కాంపోజిట్ బ్యాంకు రుణం (టర్మ్ + WC). స్వంత వాటా కనీసం 10%. ఇతర సబ్సిడీలు కలిపి పొందవచ్చు; ఉత్పత్తి స్వయంగా మార్జిన్ మనీ కాదు.'
        ),
      },
    ],
    quickInfo: {
      ministry: DFS,
      category: L('Composite bank loan', 'కాంపోజిట్ బ్యాంకు రుణం'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.standupmitra.in',
  },

  MSE_SPICE: {
    code: 'MSE_SPICE',
    title: L('RAMP MSE-SPICE (Circular Economy)', 'RAMP MSE-SPICE (సర్క్యులర్ ఎకానమీ)'),
    intro: L(
      'MSE-SPICE (Scheme for Promotion and Investment in Circular Economy) is a RAMP sub-scheme of the Ministry of MSME. It gives a credit-linked subsidy so existing (brownfield) micro and small units can buy new plant and machinery for circular-economy upgrades — recycling, reuse, EPR compliance — in notified sectors.',
      'MSE-SPICE అనేది MSME మంత్రిత్వ శాఖ RAMP ఉప-పథకం. ఉన్న (బ్రౌన్‌ఫీల్డ్) సూక్ష్మ/చిన్న యూనిట్లు సర్క్యులర్-ఎకానమీ అప్‌గ్రేడ్‌కు కొత్త ప్లాంట్ మరియు యంత్రాలు కొనడానికి క్రెడిట్-లింక్డ్ సబ్సిడీ.'
    ),
    benefits: [
      L('25% subsidy on the cost of new plant and machinery, capped at ₹12.50 lakh.', 'కొత్త ప్లాంట్ మరియు యంత్రాల ఖర్చుపై 25% సబ్సిడీ, పైపరిధి ₹12.50 లక్షలు.'),
      L(
        'Admissible project cost is typically up to ₹50 lakh; costlier projects may still apply, but subsidy stays capped at ₹12.50 lakh.',
        'అనుమతించదగిన ప్రాజెక్ట్ ఖర్చు సాధారణంగా ₹50 లక్షలు; ఎక్కువైనా సబ్సిడీ ₹12.50 లక్షల వద్దే ఉంటుంది.'
      ),
      L('Second-hand or fabricated machinery is not eligible.', 'సెకండ్-హ్యాండ్ లేదా ఫ్యాబ్రికేటెడ్ యంత్రాలు అనర్హం.'),
    ],
    eligibility: [
      L('Udyam-registered Micro or Small Enterprise. Brownfield only — not a brand-new unit.', 'ఉద్యమ్ నమోదైన సూక్ష్మ లేదా చిన్న పరిశ్రమ. బ్రౌన్‌ఫీల్డ్ మాత్రమే — కొత్త యూనిట్ కాదు.'),
      L('Investment in notified circular-economy sectors / listed technologies (plastic, rubber, e-waste, and others on the SPICE technology list).', 'నోటిఫైడ్ సర్క్యులర్-ఎకానమీ రంగాలు / జాబితా టెక్నాలజీలు (ప్లాస్టిక్, రబ్బరు, ఈ-వేస్ట్ మొదలైనవి).'),
      L('EPR and waste-recycling compliance where the sector requires it. Registered firm.', 'రంగం కోరిన చోట EPR మరియు వ్యర్థ రీసైక్లింగ్ పాటింపు. నమోదైన సంస్థ.'),
    ],
    howToApply: [
      L('Apply through a participating bank / financial institution against an eligible technology on the SPICE list.', 'SPICE జాబితాలోని అర్హ టెక్నాలజీకి పాల్గొనే బ్యాంకు / ఆర్థిక సంస్థ ద్వారా దరఖాస్తు చేయండి.'),
      L('This DPR should show the upgrade, machinery, and circular-economy outcome.', 'ఈ DPRలో అప్‌గ్రేడ్, యంత్రాలు, సర్క్యులర్-ఎకానమీ ఫలితం చూపించాలి.'),
    ],
    documents: [
      L('Udyam, KYC, existing-unit proof, quotations for new P&M', 'ఉద్యమ్, KYC, ఉన్న యూనిట్ రుజువు, కొత్త P&M కోటేషన్లు'),
      L('Bank term-loan papers; EPR / pollution records if applicable', 'బ్యాంకు టర్మ్-లోన్ పత్రాలు; వర్తిస్తే EPR / కాలుష్య రికార్డులు'),
    ],
    faqs: [
      {
        q: L('Can a new factory apply?', 'కొత్త ఫ్యాక్టరీ దరఖాస్తు చేయవచ్చా?'),
        a: L('No. MSE-SPICE is for existing (brownfield) units upgrading circular-economy plant and machinery.', 'కాదు. MSE-SPICE ఉన్న యూనిట్ల అప్‌గ్రేడ్‌కు మాత్రమే.'),
      },
    ],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Credit-linked subsidy', 'క్రెడిట్-లింక్డ్ సబ్సిడీ'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://ramp.msme.gov.in',
  },

  RAMP_TEAM: {
    code: 'RAMP_TEAM',
    title: L('RAMP TEAM (sell on ONDC)', 'RAMP TEAM (ONDCపై అమ్మకం)'),
    intro: L(
      'Trade Enablement & Marketing (TEAM) under the Ministry of MSME RAMP programme helps Micro and Small Enterprises sell on the Open Network for Digital Commerce (ONDC). NSIC implements it nationally; APMSMEDC partners in Andhra Pradesh.',
      'MSME మంత్రిత్వ శాఖ RAMP కార్యక్రమంలోని TEAM, సూక్ష్మ మరియు చిన్న పరిశ్రమలను ONDCపై అమ్మడానికి సహాయపడుతుంది. జాతీయంగా NSIC అమలు; ఆంధ్రప్రదేశ్‌లో APMSMEDC భాగస్వామి.'
    ),
    benefits: [
      L('Awareness workshops and handholding to onboard onto ONDC.', 'ONDCపై చేరడానికి వర్క్‌షాపులు మరియు హ్యాండ్‌హోల్డింగ్.'),
      L(
        'Support to create an ONDC-compliant catalogue, capped at about ₹2,500 per MSE (indicative SKU rates as notified).',
        'ONDC కేటలాగ్ తయారీకి మద్దతు, MSEకి సుమారు ₹2,500 పైపరిధి (నోటిఫైడ్ SKU రేట్లు).'
      ),
      L('Account-management support (notified cap around ₹5,000 per MSE), plus logistics / packaging support where offered.', 'అకౌంట్-మేనేజ్‌మెంట్ మద్దతు (నోటిఫైడ్ పైపరిధి సుమారు ₹5,000), అలాగే లాజిస్టిక్స్ / ప్యాకేజింగ్ మద్దతు.'),
      L('About half of national slots are intended for women-owned MSEs.', 'జాతీయ స్లాట్లలో సుమారు సగం మహిళా MSEలకు.'),
    ],
    eligibility: [
      L('Registered Micro or Small Enterprise with Udyam (or willing to obtain it).', 'ఉద్యమ్ ఉన్న (లేదా తీసుకోవడానికి సిద్ధం) నమోదైన సూక్ష్మ లేదా చిన్న పరిశ్రమ.'),
      L('Scheme Finder requires an intent to sell online / on ONDC.', 'స్కీమ్ ఫైండర్‌లో ఆన్‌లైన్ / ONDCపై అమ్మాలనే ఉద్దేశం ఉండాలి.'),
    ],
    howToApply: [
      L('Watch AP MSME One / NSIC TEAM camps, or apply via the TEAM / ONDC seller network participant channel.', 'AP MSME One / NSIC TEAM క్యాంపులు చూడండి, లేదా TEAM / ONDC సెల్లర్ నెట్‌వర్క్ ద్వారా దరఖాస్తు చేయండి.'),
      L('This DPR can still be a bank loan; TEAM is market-access support, not a plant subsidy.', 'ఈ DPR బ్యాంకు రుణం కావచ్చు; TEAM మార్కెట్ మద్దతు, ప్లాంట్ సబ్సిడీ కాదు.'),
    ],
    documents: [
      L('Udyam, GST if applicable, product list / photos for catalogue', 'ఉద్యమ్, GST ఉంటే, కేటలాగ్‌కు ఉత్పత్తి జాబితా / ఫోటోలు'),
      L('Bank account and business KYC', 'బ్యాంకు ఖాతా మరియు వ్యాపార KYC'),
    ],
    faqs: [
      {
        q: L('Does TEAM give a machinery subsidy?', 'TEAM యంత్రాల సబ్సిడీ ఇస్తుందా?'),
        a: L('No. It pays for onboarding, catalogue, and related digital-commerce support on ONDC.', 'కాదు. ONDCపై ఆన్‌బోర్డింగ్, కేటలాగ్, డిజిటల్-కామర్స్ మద్దతు.'),
      },
    ],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Market access / ONDC', 'మార్కెట్ యాక్సెస్ / ONDC'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://ramp.msme.gov.in/ramp/team-scheme.php',
  },

  EPM_NIRYAT: {
    code: 'EPM_NIRYAT',
    title: L('EPM Niryat Protsahan (export interest support)', 'EPM నిర్యాత్ ప్రోత్సాహన్ (ఎగుమతి వడ్డీ మద్దతు)'),
    intro: L(
      'Under the Export Promotion Mission, Niryat Protsahan gives MSME exporters a 2.75% interest subvention on eligible rupee pre- and post-shipment export credit, subject to an annual ceiling (₹50 lakh per exporter in the notified guidelines). DGFT implements it with banks and RBI reimbursement.',
      'ఎగుమతి ప్రోత్సాహక మిషన్‌లో నిర్యాత్ ప్రోత్సాహన్, అర్హ రూపాయి ప్రీ/పోస్ట్-షిప్‌మెంట్ ఎగుమతి రుణంపై MSME ఎగుమతిదారులకు 2.75% వడ్డీ సబ్వెన్షన్ ఇస్తుంది (నోటిఫైడ్ వార్షిక పైపరిధి ఎగుమతిదారునికి ₹50 లక్షలు). DGFT బ్యాంకులు, RBIతో అమలు చేస్తుంది.'
    ),
    benefits: [
      L('2.75% interest subvention on eligible pre- and post-shipment rupee export credit.', 'అర్హ ప్రీ/పోస్ట్-షిప్‌మెంట్ రూపాయి ఎగుమతి రుణంపై 2.75% వడ్డీ సబ్వెన్షన్.'),
      L('Annual subvention ceiling as notified (₹50 lakh per exporter). Banks pass the benefit in the interest cost.', 'నోటిఫైడ్ వార్షిక పైపరిధి (ఎగుమతిదారునికి ₹50 లక్షలు). బ్యాంకులు వడ్డీ ఖర్చులో ప్రయోజనం ఇస్తాయి.'),
      L('Restricted to notified eligible HSN lines; deemed exports are excluded.', 'నోటిఫైడ్ HSN లైన్లకు మాత్రమే; డీమ్డ్ ఎగుమతులు మినహాయింపు.'),
    ],
    eligibility: [
      L('MSME manufacturer or merchant exporter with Udyam and a valid IEC.', 'ఉద్యమ్ మరియు చెల్లుబాటు అయ్యే IEC ఉన్న MSME తయారీదారు లేదా మర్చంట్ ఎగ్స్‌పోర్టర్.'),
      L('Scheme Finder requires an export market intent and a registered firm.', 'స్కీమ్ ఫైండర్‌లో ఎగుమతి ఉద్దేశం మరియు నమోదైన సంస్థ అవసరం.'),
      L('Export credit must be sanctioned on or after the DGFT start date (2 January 2026 in Trade Notice 20/2025-26). NPA accounts do not get subvention.', 'ఎగుమతి రుణం DGFT ప్రారంభ తేదీ నుండి మంజూరు కావాలి (ట్రేడ్ నోటీసు 20/2025-26లో 2 జనవరి 2026). NPA ఖాతాలకు సబ్వెన్షన్ లేదు.'),
    ],
    howToApply: [
      L('File an Intent-to-Claim on dgft.gov.in and obtain a UIN.', 'dgft.gov.inలో Intent-to-Claim దాఖలు చేసి UIN తీసుకోండి.'),
      L('Share the UIN with your bank; the bank applies subvention and claims reimbursement.', 'UINని బ్యాంకుకు ఇవ్వండి; బ్యాంకు సబ్వెన్షన్ వర్తింపజేసి రీయింబర్స్‌మెంట్ క్లెయిమ్ చేస్తుంది.'),
    ],
    documents: [
      L('IEC, Udyam, KYC, export order / LC, bank export-credit papers', 'IEC, ఉద్యమ్, KYC, ఎగుమతి ఆర్డర్ / LC, బ్యాంకు ఎగుమతి-రుణ పత్రాలు'),
      L('DGFT UIN / Intent-to-Claim acknowledgement', 'DGFT UIN / Intent-to-Claim రసీదు'),
    ],
    faqs: [
      {
        q: L('Is this an AP-only scheme?', 'ఇది ఆంధ్రప్రదేశ్‌కు మాత్రమేనా?'),
        a: L(
          'No. It is a national DGFT / Export Promotion Mission instrument. AP exporters with Udyam and IEC can use it. Scheme Finder still matches it for AP users who plan to export.',
          'కాదు. ఇది జాతీయ DGFT / ఎగుమతి మిషన్ సాధనం. ఉద్యమ్ మరియు IEC ఉన్న AP ఎగుమతిదారులు వాడవచ్చు.'
        ),
      },
    ],
    quickInfo: {
      ministry: DOC,
      category: L('Interest subvention', 'వడ్డీ సబ్వెన్షన్'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.dgft.gov.in',
  },
  PMEGP_2ND: {
    code: 'PMEGP_2ND',
    title: L(
      '2nd Loan for Up-gradation of Existing PMEGP / REGP / MUDRA Units',
      'ఇప్పటికే ఉన్న PMEGP / REGP / MUDRA యూనిట్ల 2వ లోన్'
    ),
    intro: L(
      'This is a brownfield upgrade loan for units that already received PMEGP, REGP, or MUDRA assistance and have performed well. Create New Latest DPR builds a 14-step upgrade pack — see docs/schemes/PMEGP_2ND/pmegp2nd.md. Not for brand-new (greenfield) units — use first PMEGP for those.',
      'ఇది ఇప్పటికే PMEGP / REGP / MUDRA సహాయం పొంది బాగా పనిచేసిన యూనిట్లకు బ్రౌన్‌ఫీల్డ్ అప్‌గ్రేడ్ లోన్. Create New Latest DPR 14-దశల అప్‌గ్రేడ్ ప్యాక్ ఇస్తుంది. కొత్త యూనిట్లకు మొదటి PMEGP వాడండి.'
    ),
    benefits: [
      L(
        'Credit-linked margin money @ 15% of upgrade project cost for all categories (20% in NER / Hill States); own contribution 10%.',
        'అప్‌గ్రేడ్ ప్రాజెక్ట్ ఖర్చులో అన్ని వర్గాలకు 15% మార్జిన్ మనీ (NER / హిల్‌లో 20%); స్వంత వాటా 10%.'
      ),
      L(
        'Manufacturing upgrade project cost up to about ₹1 crore; business/service/trading up to ₹25 lakh (confirm live ceilings).',
        'తయారీ అప్‌గ్రేడ్ ప్రాజెక్ట్ సుమారు ₹1 కోటి వరకు; వ్యాపారం/సేవ/ట్రేడింగ్ ₹25 లక్షల వరకు.'
      ),
      L('Focus on incremental machinery / civil, not a full greenfield land story.', 'పూర్తి కొత్త ల్యాండ్ కథ కాకుండా అదనపు యంత్రాలు / సివిల్‌పై దృష్టి.'),
    ],
    eligibility: [
      L('Existing PMEGP / REGP / MUDRA unit; first margin money adjusted; first loan repaid in time.', 'ఇప్పటికే ఉన్న PMEGP / REGP / MUDRA యూనిట్; మార్జిన్ మనీ అడ్జస్ట్; మొదటి లోన్ సమయానికి చెల్లింపు.'),
      L('Profit-making with growth potential (guidelines expect about 3 years of profit). Udyam mandatory.', 'లాభాలు / వృద్ధి సామర్థ్యం (సుమారు 3 ఏళ్ల లాభం). ఉద్యమ్ తప్పనిసరి.'),
      L('Must not be a brand-new greenfield application.', 'కొత్త గ్రీన్‌ఫీల్డ్ దరఖాస్తు కాకూడదు.'),
      L(
        'Having already received PMEGP, REGP, or MUDRA is required here, not a bar. An unpaid first loan does not qualify. The unit should have been in profit for about three years.',
        'PMEGP, REGP లేదా MUDRA ఇప్పటికే పొందిఉండటం ఇక్కడ అవసరం, అడ్డు కాదు. మొదటి రుణం బాకీగా ఉంటే అర్హత లేదు. సుమారు మూడేళ్లు లాభంలో ఉండాలి.'
      ),
    ],
    howToApply: [
      L('Apply on the PMEGP e-portal upgrade module; IA (KVIC / KVIB / DIC) forwards to bank.', 'PMEGP ఇ-పోర్టల్ అప్‌గ్రేడ్ మాడ్యూల్‌లో దరఖాస్తు; IA బ్యాంకుకు పంపుతుంది.'),
      L('Create New Latest DPR with PMEGP 2nd Loan selected builds the 14-step upgrade pack.', 'PMEGP 2nd Loan ఎంచుకుంటే Create New Latest DPR 14-దశల అప్‌గ్రేడ్ ప్యాక్ ఇస్తుంది.'),
      L('Attach prior sanction proof, CA existing investment, and new quotations.', 'మునుపటి సాంక్షన్, CA పెట్టుబడి, కొత్త కోటేషన్లు జత చేయండి.'),
    ],
    documents: [
      L('Prior sanction letter, CA certificate of existing investment, quotations', 'మునుపటి సాంక్షన్ లేఖ, ఉన్న పెట్టుబడి CA సర్టిఫికేట్, కోటేషన్లు'),
      L('Udyam, KYC, profit / ITR for recent years', 'ఉద్యమ్, KYC, ఇటీవలి లాభ / ITR'),
    ],
    faqs: [
      {
        q: L('Can a new unit apply?', 'కొత్త యూనిట్ దరఖాస్తు చేయవచ్చా?'),
        a: L('No. New units use first PMEGP. This code hard-fails greenfield in Scheme Finder.', 'కాదు. కొత్త యూనిట్లు మొదటి PMEGP వాడాలి.'),
      },
      {
        q: L('Do special categories get higher margin money on the 2nd loan?', '2వ లోన్‌లో ప్రత్యేక వర్గాలకు ఎక్కువ మార్జిన్ మనీ ఉందా?'),
        a: L(
          'No. For upgradation, subsidy is uniform 15% for all categories (20% in NER / Hill States). Own contribution is 10% for all.',
          'కాదు. అప్‌గ్రేడ్‌కు అన్ని వర్గాలకు 15% (NER / హిల్‌లో 20%). స్వంత వాటా అందరికీ 10%.'
        ),
      },
    ],
    quickInfo: {
      ministry: KVIC,
      category: L('Upgrade loan / subsidy', 'అప్‌గ్రేడ్ లోన్ / సబ్సిడీ'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.kviconline.gov.in/pmegpeportal/',
  },
  SCLCSS: {
    code: 'SCLCSS',
    title: L(
      'Special Credit Linked Capital Subsidy Scheme (SCLCSS) for SC/ST MSEs',
      'SC/ST MSEలకు ప్రత్యేక క్రెడిట్ లింక్డ్ క్యాపిటల్ సబ్సిడీ (SCLCSS)'
    ),
    intro: L(
      'General CLCSS closed on 31 March 2020. SCLCSS (under National SC-ST Hub) remains the active central credit-linked capital subsidy for new plant & machinery — strictly for SC/ST-owned MSEs (25% up to ₹25 lakh, no sector tech list). Create New Latest DPR builds a 13-step pack — see docs/schemes/SCLCSS/sclcss.md. General-category promoters should use AP Technology Upgradation Subsidy instead.',
      'సాధారణ CLCSS 31 మార్చి 2020న ముగిసింది. NSSH కింద SCLCSS — SC/ST MSEలకు కొత్త ప్లాంట్ & మెషినరీపై 25% (పైపరిధి ₹25 లక్షలు). Create New Latest DPR 13-దశల ప్యాక్ ఇస్తుంది. సాధారణ వర్గం AP Technology Upgradation వాడాలి.'
    ),
    benefits: [
      L(
        '25% capital subsidy on institutional term loan for new plant & machinery / equipment, ceiling ₹25 lakh.',
        'కొత్త ప్లాంట్ & యంత్రాల / పరికరాల టర్మ్ లోన్‌పై 25% క్యాపిటల్ సబ్సిడీ, పైపరిధి ₹25 లక్షలు.'
      ),
      L('No sector-specific approved-technology list (unlike old general CLCSS).', 'పాత CLCSS లాంటి సెక్టార్ టెక్ జాబితా లేదు.'),
      L('Manufacturing and service MSEs; supports new units and expansion of existing ones.', 'తయారీ మరియు సేవా MSEలు; కొత్త యూనిట్లు మరియు ఉన్నవాటి విస్తరణ.'),
    ],
    eligibility: [
      L('SC or ST ownership — proprietor, or ≥51% partners / promoters.', 'SC లేదా ST యాజమాన్యం — ఏకస్వామ్యం, లేదా ≥51% భాగస్వాములు / ప్రమోటర్లు.'),
      L('Micro or Small enterprise with valid Udyam; new plant & machinery only (not second-hand).', 'ఉద్యమ్ ఉన్న సూక్ష్మ/చిన్న యూనిట్; కొత్త యంత్రాలు మాత్రమే.'),
      L('Scheme Finder emphasises tech-upgrade / brownfield intent for matching.', 'స్కీమ్ ఫైండర్ టెక్ అప్‌గ్రేడ్ / బ్రౌన్‌ఫీల్డ్ ఉద్దేశాన్ని చూస్తుంది.'),
    ],
    howToApply: [
      L('Take a term loan from a PLI / bank for eligible P&M, then submit SCLCSS claim docs to that bank.', 'అర్హ P&Mకు బ్యాంకు టర్మ్ లోన్ తీసుకుని, ఆ బ్యాంకుకే SCLCSS క్లెయిమ్ డాక్స్ ఇవ్వండి.'),
      L('Nodal banks / SIDBI / NABARD upload claims on the MIS portal.', 'నోడల్ బ్యాంకులు / SIDBI / NABARD MIS పోర్టల్‌లో క్లెయిమ్ అప్‌లోడ్ చేస్తాయి.'),
      L('Create New Latest DPR with SCLCSS selected builds the 13-step bank pack.', 'SCLCSS ఎంచుకుంటే Create New Latest DPR 13-దశల బ్యాంకు ప్యాక్ ఇస్తుంది.'),
    ],
    documents: [
      L('Caste certificate, 51% shareholding proof, Udyam, quotations / invoices', 'జాతి సర్టిఫికేట్, 51% వాటా రుజువు, ఉద్యమ్, కోటేషన్లు / ఇన్‌వాయిస్‌లు'),
      L('Term-loan sanction, CA FCI (existing units), PAN / KYC', 'టర్మ్ లోన్ సాంక్షన్, CA FCI (ఉన్న యూనిట్లు), పాన్ / KYC'),
    ],
    faqs: [
      {
        q: L('I am general category — can I use this?', 'నేను సాధారణ వర్గం — వాడవచ్చా?'),
        a: L('No. Use AP Technology Upgradation Subsidy (20%) under MSME-EDP 4.0.', 'కాదు. AP Technology Upgradation (20%) వాడండి.'),
      },
      {
        q: L('Is this the same as old CLCSS?', 'ఇది పాత CLCSSేనా?'),
        a: L(
          'No. General CLCSS closed. SCLCSS is the SC/ST-only NSSH component with a flat 25% / ₹25 lakh cap and no sector tech list.',
          'కాదు. సాధారణ CLCSS ముగిసింది. SCLCSS SC/ST-only; 25% / ₹25 లక్షలు; సెక్టార్ టెక్ జాబితా లేదు.'
        ),
      },
    ],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Capital subsidy (SC/ST)', 'క్యాపిటల్ సబ్సిడీ (SC/ST)'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.scsthub.in/content/special-credit-linked-capital-subsidy-scheme',
  },
  ECLGS: {
    code: 'ECLGS',
    title: L('Emergency Credit Line Guarantee Scheme (ECLGS)', 'అత్యవసర క్రెడిట్ లైన్ గ్యారంటీ (ECLGS)'),
    intro: L(
      'ECLGS 5.0 is additional working-capital / liquidity guarantee for existing MSMEs — not a greenfield plant DPR. Create New Latest DPR builds a 7-step WC pack — see docs/schemes/ECLGS/eclgs.md. Confirm live cut-offs with your bank / NCGTC.',
      'ECLGS 5.0 ఇప్పటికే ఉన్న MSMEలకు అదనపు వర్కింగ్ క్యాపిటల్ గ్యారంటీ — కొత్త ప్లాంట్ DPR కాదు. Create New Latest DPR 7-దశల WC ప్యాక్ ఇస్తుంది.'
    ),
    benefits: [
      L('Additional WC up to ~20% of peak Q4 fund-based outstanding (cap ₹100 Cr); 100% NCGTC guarantee for MSMEs.', 'పీక్ Q4 WCలో ~20% అదనపు WC (₹100 కోట్ల పైపరిధి); MSMEలకు 100% గ్యారంటీ.'),
      L('Interest typically EBLR+0.75% capped at 9% p.a.; tenor 5 years incl. 1-year moratorium.', 'వడ్డీ సాధారణంగా EBLR+0.75%, 9% పైపరిధి; 5 సంవత్సరాలు (1 సం. మారటోరియం).'),
    ],
    eligibility: [
      L('Existing unit with standard fund-based WC; Udyam for MSME path.', 'స్టాండర్డ్ ఫండ్-బేస్డ్ WC ఉన్న యూనిట్; MSMEకి ఉద్యమ్.'),
    ],
    howToApply: [
      L('Approach your existing bank with turnover proof and this short pack.', 'టర్నోవర్ రుజువు, ఈ చిన్న ప్యాక్‌తో మీ బ్యాంకును సంప్రదించండి.'),
      L('Create New Latest DPR with ECLGS selected builds the 7-step WC pack.', 'ECLGS ఎంచుకుంటే Create New Latest DPR 7-దశల ప్యాక్ ఇస్తుంది.'),
    ],
    documents: [L('Udyam, GST/ITR, bank statements, existing sanction, CA turnover', 'ఉద్యమ్, GST/ITR, బ్యాంకు స్టేట్‌మెంట్లు, ఉన్న సాంక్షన్, CA టర్నోవర్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Guarantee / WC', 'గ్యారంటీ / WC'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.ncgtc.in',
  },
  ZED: {
    code: 'ZED',
    title: L('Sustainable ZED Certification', 'ZED సర్టిఫికేషన్'),
    intro: L(
      'ZED is a quality certification track, not a bank term loan. Create New Latest DPR builds a 5-step certification note — see docs/schemes/ZED/zed.md.',
      'ZED నాణ్యత సర్టిఫికేషన్ — బ్యాంకు టర్మ్ లోన్ కాదు. Create New Latest DPR 5-దశల నోట్ ఇస్తుంది.'
    ),
    benefits: [L('Assessment and certification pathway (Bronze / Silver / Gold).', 'అసెస్‌మెంట్ మరియు సర్టిఫికేషన్ మార్గం.')],
    eligibility: [L('Registered MSE with Udyam (or willing).', 'ఉద్యమ్ ఉన్న / తీసుకోవాలనుకునే MSE.')],
    howToApply: [
      L('Complete the short ZED pack and register on the ZED portal / through DIC.', 'చిన్న ZED ప్యాక్ పూర్తి చేసి ZED పోర్టల్ / DIC ద్వారా నమోదు చేయండి.'),
      L('See docs/schemes/ZED/zed.md for the 5-step question catalog.', '5-దశల ప్రశ్న కేటలాగ్‌కు docs/schemes/ZED/zed.md చూడండి.'),
    ],
    documents: [L('Udyam, Aadhaar/PAN', 'ఉద్యమ్, ఆధార్/పాన్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Certification', 'సర్టిఫికేషన్'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://zed.msme.gov.in',
  },
  LEAN: {
    code: 'LEAN',
    title: L('Competitive LEAN', 'Competitive LEAN'),
    intro: L(
      'LEAN is process-improvement consulting for existing units — Create New Latest DPR builds a 5-step pack — see docs/schemes/LEAN/lean.md.',
      'LEAN ఇప్పటికే ఉన్న యూనిట్ల ప్రాసెస్ మెరుగుదల — Create New Latest DPR 5-దశల ప్యాక్ ఇస్తుంది.'
    ),
    benefits: [L('Consultant-led shop-floor improvement.', 'కన్సల్టెంట్ నేతృత్వంలో షాప్-ఫ్లోర్ మెరుగుదల.')],
    eligibility: [L('Brownfield manufacturing or food unit with Udyam.', 'ఉద్యమ్ ఉన్న బ్రౌన్‌ఫీల్డ్ తయారీ / ఆహార యూనిట్.')],
    howToApply: [
      L('Prepare the short LEAN pack and approach the implementing agency / DIC.', 'చిన్న LEAN ప్యాక్‌తో అమలు సంస్థ / DICని సంప్రదించండి.'),
      L('See docs/schemes/LEAN/lean.md.', 'docs/schemes/LEAN/lean.md చూడండి.'),
    ],
    documents: [L('Udyam', 'ఉద్యమ్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Consulting', 'కన్సల్టింగ్'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.msme.gov.in',
  },
  MSME_IPR: {
    code: 'MSME_IPR',
    title: L('MSME Innovative — IPR / Design / Incubation', 'MSME Innovative — IPR / డిజైన్'),
    intro: L(
      'Short IP filing pack — not a plant-and-machinery term-loan DPR. Create New Latest DPR builds 5 steps — see docs/schemes/MSME_IPR/msmeIpr.md.',
      'చిన్న IP ఫైలింగ్ ప్యాక్ — ప్లాంట్ టర్మ్ లోన్ DPR కాదు. Create New Latest DPR 5 దశలు ఇస్తుంది.'
    ),
    benefits: [L('Support toward patent / design / trademark / GI filings.', 'పేటెంట్ / డిజైన్ / ట్రేడ్‌మార్క్ / GI ఫైలింగ్ సహాయం.')],
    eligibility: [L('Knowledge, manufacturing, or food unit with Udyam.', 'నాలెడ్జ్ / తయారీ / ఆహార యూనిట్ + ఉద్యమ్.')],
    howToApply: [
      L('Complete the short IP pack and apply via the MSME Innovative portal / DIC.', 'చిన్న IP ప్యాక్‌తో MSME Innovative పోర్టల్ / DIC ద్వారా దరఖాస్తు చేయండి.'),
      L('See docs/schemes/MSME_IPR/msmeIpr.md.', 'docs/schemes/MSME_IPR/msmeIpr.md చూడండి.'),
    ],
    documents: [L('Udyam, draft specification or TM search', 'ఉద్యమ్, డ్రాఫ్ట్ స్పెసిఫికేషన్ / TM సెర్చ్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('IPR support', 'IPR సహాయం'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.msme.gov.in',
  },
  PMS: {
    code: 'PMS',
    title: L('Procurement and Marketing Scheme (PMS)', 'ప్రొక్యూర్‌మెంట్ అండ్ మార్కెటింగ్ స్కీమ్ (PMS)'),
    intro: L(
      'Marketing / trade-fair annex — not a plant DPR. Create New Latest DPR builds a 5-step fair pack — see docs/schemes/PMS/pms.md.',
      'మార్కెటింగ్ / ట్రేడ్ ఫెయిర్ అనెక్స్ — ప్లాంట్ DPR కాదు. Create New Latest DPR 5-దశల ప్యాక్ ఇస్తుంది.'
    ),
    benefits: [L('Support toward fair participation / stall costs as per live guidelines.', 'ఫెయిర్ / స్టాల్ ఖర్చు సహాయం (ప్రస్తుత మార్గదర్శకాల ప్రకారం).')],
    eligibility: [L('Udyam-registered unit seeking marketing fair support.', 'మార్కెటింగ్ ఫెయిర్ సహాయం కోరే ఉద్యమ్ యూనిట్.')],
    howToApply: [
      L('Fill the short fair annex and apply through the implementing agency.', 'చిన్న ఫెయిర్ అనెక్స్‌తో అమలు సంస్థ ద్వారా దరఖాస్తు చేయండి.'),
      L('See docs/schemes/PMS/pms.md.', 'docs/schemes/PMS/pms.md చూడండి.'),
    ],
    documents: [L('Udyam', 'ఉద్యమ్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Marketing', 'మార్కెటింగ్'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.msme.gov.in',
  },
  MSE_GIFT: {
    code: 'MSE_GIFT',
    title: L('MSE-GIFT (green investment)', 'MSE-GIFT (గ్రీన్ ఇన్వెస్ట్‌మెంట్)'),
    intro: L(
      'Full bank-style DPR for green / energy-efficient capex on an existing unit.',
      'ఇప్పటికే ఉన్న యూనిట్‌పై గ్రీన్ / ఎనర్జీ-ఎఫిషియెంట్ క్యాపెక్స్‌కు పూర్తి బ్యాంకు-శైలి DPR.'
    ),
    benefits: [L('Financing support aligned to green / EE machinery upgrade.', 'గ్రీన్ / EE యంత్రాల అప్‌గ్రేడ్ ఫైనాన్స్.')],
    eligibility: [L('Brownfield mfg/food with tech-upgrade intent and Udyam.', 'టెక్ అప్‌గ్రేడ్ ఉద్దేశంతో బ్రౌన్‌ఫీల్డ్ తయారీ/ఆహారం + ఉద్యమ్.')],
    howToApply: [L('Complete the 12-step MSE-GIFT pack with energy baseline and EE quotations.', 'ఎనర్జీ బేస్‌లైన్, EE కోటేషన్లతో 18-దశల DPR పూర్తి చేయండి.')],
    documents: [L('Energy bill, EE quotations, Udyam', 'ఎనర్జీ బిల్లు, EE కోటేషన్లు, ఉద్యమ్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Green finance', 'గ్రీన్ ఫైనాన్స్'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: '',
  },
  CVY: {
    code: 'CVY',
    title: L('Coir Vikas Yojana', 'కొయిర్ వికాస్ యోజన'),
    intro: L('Coir Board linked unit-level support. Confirm live guidelines before locking cost.', 'కొయిర్ బోర్డు లింక్డ్ యూనిట్ సహాయం. ఖర్చు ఖాయం చేసే ముందు ప్రస్తుత మార్గదర్శకాలు నిర్ధారించండి.'),
    benefits: [L('Subsidy / credit support for coir product lines as notified.', 'కొయిర్ ఉత్పత్తులకు నోటిఫైడ్ సబ్సిడీ / క్రెడిట్.')],
    eligibility: [L('Coir sector flag; craft or manufacturing activity.', 'కొయిర్ రంగం; క్రాఫ్ట్ లేదా తయారీ.')],
    howToApply: [L('Complete the 12-step CVY pack with Coir Board status and quotations.', 'కొయిర్ బోర్డు నమోదు స్థితి, కోటేషన్లతో పూర్తి DPR తయారు చేయండి.')],
    documents: [L('Coir Board docs, quotations, Udyam', 'కొయిర్ బోర్డు పత్రాలు, కోటేషన్లు, ఉద్యమ్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Sectoral (coir)', 'రంగం (కొయిర్)'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: '',
  },
  NHDP: {
    code: 'NHDP',
    title: L('National Handloom Development Programme', 'జాతీయ చేనేత అభివృద్ధి కార్యక్రమం'),
    intro: L(
      'Weaver / handloom overlay. Create New Latest DPR builds a 10-step weaver pack — see docs/schemes/NHDP/nhdp.md.',
      'నేతగాడు / చేనేత ఓవర్‌లే. Create New Latest DPR 10-దశల ప్యాక్ ఇస్తుంది.'
    ),
    benefits: [L('Handloom development support as per live ministry guidelines.', 'ప్రస్తుత మంత్రిత్వ మార్గదర్శకాల ప్రకారం చేనేత సహాయం.')],
    eligibility: [L('Handloom sector + craft activity.', 'చేనేత రంగం + క్రాఫ్ట్.')],
    howToApply: [
      L('Complete the weaver overlay and apply through the handloom agency.', 'నేతగాడు ఓవర్‌లేతో చేనేత సంస్థ ద్వారా దరఖాస్తు చేయండి.'),
      L('See docs/schemes/NHDP/nhdp.md.', 'docs/schemes/NHDP/nhdp.md చూడండి.'),
    ],
    documents: [L('Weaver ID, Aadhaar, passbook', 'నేతగాడి ID, ఆధార్, పాస్‌బుక్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Sectoral (handloom)', 'రంగం (చేనేత)'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://handlooms.nic.in',
  },
  PTUAS: {
    code: 'PTUAS',
    title: L('PTUAS (pharma technology upgrade)', 'PTUAS (ఫార్మా టెక్ అప్‌గ్రేడ్)'),
    intro: L(
      'Unit-level pharma technology upgrade — distinct from APICF cluster common facilities.',
      'యూనిట్-స్థాయి ఫార్మా టెక్ అప్‌గ్రేడ్ — APICF క్లస్టర్ కామన్ ఫెసిలిటీస్ కాదు.'
    ),
    benefits: [L('Assistance for technology upgradation in pharma units.', 'ఫార్మా యూనిట్ల టెక్ అప్‌గ్రేడ్ సహాయం.')],
    eligibility: [L('Pharma sector, brownfield, tech upgrade, Udyam.', 'ఫార్మా రంగం, బ్రౌన్‌ఫీల్డ్, టెక్ అప్‌గ్రేడ్, ఉద్యమ్.')],
    howToApply: [L('Complete the 13-step PTUAS pack with licence and pollution consent uploads.', 'లైసెన్స్, పొల్యూషన్ కన్సెంట్‌తో పూర్తి 18-దశల DPR.')],
    documents: [L('Manufacturing licence, pollution consent, quotations, CA FCI, Udyam', 'మాన్యుఫాక్చరింగ్ లైసెన్స్, పొల్యూషన్ కన్సెంట్, కోటేషన్లు, CA FCI, ఉద్యమ్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Pharma upgrade', 'ఫార్మా అప్‌గ్రేడ్'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: '',
  },
  PMPDS: {
    code: 'PMPDS',
    title: L('PMPDS (pharma & medical devices)', 'PMPDS (ఫార్మా & మెడికల్ డివైసెస్)'),
    intro: L('Promotion / development support for pharma and medical devices — confirm live GO.', 'ఫార్మా / మెడికల్ డివైసెస్ ప్రమోషన్ — ప్రస్తుత GO నిర్ధారించండి.'),
    benefits: [L('Sector promotion support as notified.', 'నోటిఫైడ్ రంగ ప్రమోషన్ సహాయం.')],
    eligibility: [L('Pharma / medical devices manufacturing.', 'ఫార్మా / మెడికల్ డివైసెస్ తయారీ.')],
    howToApply: [L('Use full DPR if capex; otherwise promotional short pack via agency.', 'క్యాపెక్స్ ఉంటే పూర్తి DPR; లేకపోతే సంస్థ ద్వారా చిన్న ప్యాక్.')],
    documents: [L('Product licence, Udyam, quotations', 'ఉత్పత్తి లైసెన్స్, ఉద్యమ్, కోటేషన్లు')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Pharma promotion', 'ఫార్మా ప్రమోషన్'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: '',
  },
  ASPIRE: {
    code: 'ASPIRE',
    title: L('ASPIRE', 'ASPIRE'),
    intro: L(
      'Rural innovation / livelihood incubator track. Create New Latest DPR builds a 10-step pack — see docs/schemes/ASPIRE/aspire.md.',
      'గ్రామీణ ఇన్నోవేషన్ / జీవనోపాధి. Create New Latest DPR 10-దశల ప్యాక్ ఇస్తుంది.'
    ),
    benefits: [L('Incubation / livelihood support as per live guidelines.', 'ఇన్క్యుబేషన్ / జీవనోపాధి సహాయం.')],
    eligibility: [L('Idea or greenfield; not above ₹10 Cr factory scale.', 'ఆలోచన లేదా గ్రీన్‌ఫీల్డ్; ₹10 కోట్ల పైన కాదు.')],
    howToApply: [
      L('Prepare the shorter livelihood DPR and approach the Aspire agency / DIC.', 'చిన్న జీవనోపాధి DPRతో Aspire సంస్థ / DICని సంప్రదించండి.'),
      L('See docs/schemes/ASPIRE/aspire.md.', 'docs/schemes/ASPIRE/aspire.md చూడండి.'),
    ],
    documents: [L('Rural address proof, concept note', 'గ్రామీణ చిరునామా రుజువు, కాన్సెప్ట్ నోట్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Innovation / livelihood', 'ఇన్నోవేషన్ / జీవనోపాధి'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.msme.gov.in',
  },
  SCST_HUB: {
    code: 'SCST_HUB',
    title: L('National SC/ST Hub', 'జాతీయ SC/ST హబ్'),
    intro: L(
      'Procurement-readiness pack for SC/ST MSEs — not a term loan by itself. Create New Latest DPR builds 5 steps — see docs/schemes/SCST_HUB/scstHub.md.',
      'SC/ST MSEల సేకరణ సిద్ధత ప్యాక్ — టర్మ్ లోన్ కాదు. Create New Latest DPR 5 దశలు ఇస్తుంది.'
    ),
    benefits: [L('Market access / procurement facilitation for SC/ST enterprises.', 'SC/ST సంస్థలకు సేకరణ / మార్కెట్ యాక్సెస్.')],
    eligibility: [L('SC/ST ownership + procurement interest + Udyam.', 'SC/ST యాజమాన్యం + సేకరణ ఆసక్తి + ఉద్యమ్.')],
    howToApply: [
      L('Complete the short procurement pack and register with the Hub / DIC.', 'చిన్న సేకరణ ప్యాక్‌తో హబ్ / DICలో నమోదు చేయండి.'),
      L('See docs/schemes/SCST_HUB/scstHub.md.', 'docs/schemes/SCST_HUB/scstHub.md చూడండి.'),
    ],
    documents: [L('Caste certificate, Udyam, cancelled cheque', 'జాతి సర్టిఫికేట్, ఉద్యమ్, క్యాన్సిల్డ్ చెక్')],
    faqs: [],
    quickInfo: {
      ministry: MSME_MIN,
      category: L('Procurement support', 'సేకరణ సహాయం'),
      type: CENTRAL,
      status: ACTIVE,
    },
    sourceUrl: 'https://www.scsthub.in',
  },
};

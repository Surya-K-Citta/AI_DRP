/**
 * The few facts a person needs to judge a scheme at a glance on a results card: how much support, who can
 * apply, and anything that limits it. Taken from the scheme briefs and scheme documents in the repo
 * (docs/schemes, schemeBriefs). Amounts are "up to" / "about" figures and can change, so the card tells people
 * to confirm with the agency; none of this is a promise of eligibility.
 */
export type Loc = { en: string; te: string };
export type FactKind = 'support' | 'who' | 'note';
export interface KeyFact {
  kind: FactKind;
  text: Loc;
}

const L = (en: string, te: string): Loc => ({ en, te });
const support = (en: string, te: string): KeyFact => ({ kind: 'support', text: L(en, te) });
const who = (en: string, te: string): KeyFact => ({ kind: 'who', text: L(en, te) });
const note = (en: string, te: string): KeyFact => ({ kind: 'note', text: L(en, te) });

export const FACT_LABEL: Record<FactKind, Loc> = {
  support: L('Support', 'సహాయం'),
  who: L('Who', 'ఎవరికి'),
  note: L('Note', 'గమనిక'),
};

export const KEY_FACTS: Record<string, KeyFact[]> = {
  PMEGP: [
    support('Subsidy of 15% to 35% of project cost; more for rural areas and special categories.', 'ప్రాజెక్ట్ ఖర్చులో 15% నుండి 35% సబ్సిడీ; గ్రామీణ ప్రాంతాలు, ప్రత్యేక వర్గాలకు ఎక్కువ.'),
    who('New (greenfield) micro business, age 18+, registered firm.', 'కొత్త సూక్ష్మ వ్యాపారం, 18 ఏళ్లు పైబడినవారు, నమోదిత సంస్థ.'),
    note('Bank gives the rest as a loan. 8th pass needed for larger projects (over ₹10 lakh making, ₹5 lakh services).', 'మిగిలినది బ్యాంకు రుణం. పెద్ద ప్రాజెక్ట్‌లకు 8వ తరగతి అవసరం (తయారీ ₹10 లక్షలు, సేవలు ₹5 లక్షలకు మించితే).'),
  ],
  PMEGP_2ND: [
    support('Margin money of 15% (20% in NER / hill states) on the upgrade cost; you put in 10%.', 'అప్‌గ్రేడ్ ఖర్చుపై 15% (NER / కొండ రాష్ట్రాల్లో 20%) మార్జిన్ మనీ; మీ వాటా 10%.'),
    who('Existing PMEGP / REGP / MUDRA unit that repaid its first loan on time.', 'మొదటి రుణాన్ని సమయానికి తిరిగి చెల్లించిన ప్రస్తుత PMEGP / REGP / MUDRA యూనిట్.'),
    note('Upgrade project up to about ₹1 crore (making) or ₹25 lakh (services / trading).', 'అప్‌గ్రేడ్ ప్రాజెక్ట్ సుమారు ₹1 కోటి (తయారీ) లేదా ₹25 లక్షలు (సేవలు / వ్యాపారం) వరకు.'),
  ],
  PMFME: [
    support('35% subsidy on project cost, up to ₹10 lakh per unit.', 'ప్రాజెక్ట్ ఖర్చులో 35% సబ్సిడీ, ఒక్కో యూనిట్‌కు ₹10 లక్షల వరకు.'),
    who('Micro food processing units, new or existing.', 'సూక్ష్మ ఆహార ప్రాసెసింగ్ యూనిట్లు, కొత్తవి లేదా ప్రస్తుతం ఉన్నవి.'),
    note('You put in at least 10%; the balance is a bank loan. One-district-one-product items are preferred.', 'మీరు కనీసం 10% పెట్టాలి; మిగిలినది బ్యాంకు రుణం. ఒక జిల్లా-ఒక ఉత్పత్తి వస్తువులకు ప్రాధాన్యత.'),
  ],
  MUDRA: [
    support('Loans up to ₹20 lakh: Shishu to ₹50,000, Kishore to ₹5 lakh, Tarun to ₹10 lakh, Tarun Plus to ₹20 lakh.', '₹20 లక్షల వరకు రుణాలు: శిశు ₹50,000, కిశోర్ ₹5 లక్షలు, తరుణ్ ₹10 లక్షలు, తరుణ్ ప్లస్ ₹20 లక్షల వరకు.'),
    who('Non-farm micro business (making, trade or services), age 18+.', 'వ్యవసాయేతర సూక్ష్మ వ్యాపారం (తయారీ, వ్యాపారం లేదా సేవలు), 18 ఏళ్లు పైబడినవారు.'),
    note('Collateral-light. You apply at a bank, NBFC or MFI.', 'తక్కువ తాకట్టుతో. బ్యాంకు, NBFC లేదా MFIలో దరఖాస్తు చేయాలి.'),
  ],
  CGTMSE: [
    support('Guarantee cover for collateral-free loans: up to about 85% of the lender’s loss, up to 90% for women-owned units.', 'తాకట్టు లేని రుణాలకు గ్యారెంటీ కవర్: రుణదాత నష్టంలో సుమారు 85% వరకు, మహిళా యాజమాన్య యూనిట్లకు 90% వరకు.'),
    who('Micro and small enterprises with Udyam, new or existing.', 'ఉద్యమ్ ఉన్న సూక్ష్మ, చిన్న సంస్థలు, కొత్తవి లేదా ప్రస్తుతం ఉన్నవి.'),
    note('The bank takes the cover; you do not apply to CGTMSE yourself.', 'కవర్‌ను బ్యాంకు తీసుకుంటుంది; మీరు CGTMSEకి నేరుగా దరఖాస్తు చేయరు.'),
  ],
  SVANIDHI: [
    support('Working-capital loans in steps of ₹15,000, ₹25,000 and ₹50,000, with a 7% yearly interest subsidy on timely repayment.', '₹15,000, ₹25,000, ₹50,000 విడతలుగా వర్కింగ్ క్యాపిటల్ రుణాలు; సమయానికి చెల్లిస్తే ఏటా 7% వడ్డీ సబ్సిడీ.'),
    who('Street vendors in a city or town, age 18+, with a vending certificate or recommendation letter.', 'నగరం లేదా పట్టణంలోని వీధి వ్యాపారులు, 18 ఏళ్లు పైబడి, వెండింగ్ సర్టిఫికేట్ లేదా సిఫార్సు లేఖ ఉన్నవారు.'),
    note('A UPI ID linked to your bank account is required.', 'బ్యాంకు ఖాతాకు అనుసంధానమైన UPI ఐడీ అవసరం.'),
  ],
  VISHWAKARMA: [
    support('Toolkit incentive up to ₹15,000, training with ₹500 a day stipend, and a loan at 5% interest.', '₹15,000 వరకు టూల్‌కిట్ ప్రోత్సాహకం, రోజుకు ₹500 స్టైపెండ్‌తో శిక్షణ, 5% వడ్డీతో రుణం.'),
    who('Hand-and-tool artisans in one of 18 traditional trades, age 18+.', '18 సంప్రదాయ వృత్తుల్లో ఒకదానిలో చేతి పనిముట్లతో పనిచేసే కళాకారులు, 18 ఏళ్లు పైబడినవారు.'),
    note('Not for people who took a PMEGP, MUDRA or SVANidhi loan in the last 5 years.', 'గత 5 ఏళ్లలో PMEGP, MUDRA లేదా SVANidhi రుణం తీసుకున్నవారికి వర్తించదు.'),
  ],
  AP_CMEP: [
    support('Credit-linked subsidy paid back-ended after the loan is in use; higher for women, transgender, ex-servicemen and disabled promoters.', 'రుణం వినియోగంలోకి వచ్చాక చెల్లించే క్రెడిట్-లింక్డ్ సబ్సిడీ; మహిళలు, ట్రాన్స్‌జెండర్, మాజీ సైనికులు, దివ్యాంగ ప్రమోటర్లకు ఎక్కువ.'),
    who('New manufacturing or knowledge-economy unit (IT, biotech, R&D) with an Andhra Pradesh domicile.', 'ఆంధ్రప్రదేశ్ స్థానికత ఉన్న కొత్త తయారీ లేదా నాలెడ్జ్ ఎకానమీ యూనిట్ (IT, బయోటెక్, R&D).'),
    note('Needs a bank loan; there is no subsidy for a zero-loan project.', 'బ్యాంకు రుణం అవసరం; రుణం లేని ప్రాజెక్ట్‌కు సబ్సిడీ లేదు.'),
  ],
  AP_EDP: [
    support('Capital subsidy of about 25% of fixed capital investment, with limits by unit size; about 45% for wholly women / BC / SC / ST / minority / disabled-owned micro and small units.', 'స్థిర మూలధన పెట్టుబడిలో సుమారు 25% మూలధన సబ్సిడీ, యూనిట్ పరిమాణాన్ని బట్టి పరిమితులు; పూర్తిగా మహిళలు / BC / SC / ST / మైనారిటీ / దివ్యాంగుల యాజమాన్య సూక్ష్మ, చిన్న యూనిట్లకు సుమారు 45%.'),
    who('New manufacturing unit in Andhra Pradesh, promoter with AP domicile, registered firm with Udyam.', 'ఆంధ్రప్రదేశ్‌లో కొత్త తయారీ యూనిట్, AP స్థానికత ఉన్న ప్రమోటర్, ఉద్యమ్ ఉన్న నమోదిత సంస్థ.'),
    note('All incentives together stay within 75% of the investment; it cannot be combined with the tech-upgrade subsidy.', 'అన్ని ప్రోత్సాహకాలు కలిపి పెట్టుబడిలో 75% లోపే; టెక్ అప్‌గ్రేడ్ సబ్సిడీతో కలపలేరు.'),
  ],
  AP_FPP: [
    support('Capital subsidy of about 25% of fixed capital investment, plus 10% more for special-category owners, with power and SGST reimbursement.', 'స్థిర మూలధన పెట్టుబడిలో సుమారు 25% మూలధన సబ్సిడీ, ప్రత్యేక వర్గ యజమానులకు మరో 10%, విద్యుత్ మరియు SGST రీయింబర్స్‌మెంట్‌తో.'),
    who('Food processing unit in Andhra Pradesh with an AP domicile and food-safety (FSSAI) compliance.', 'ఆంధ్రప్రదేశ్‌లోని ఆహార ప్రాసెసింగ్ యూనిట్, AP స్థానికత మరియు ఆహార భద్రత (FSSAI) అనుసరణ ఉన్నవి.'),
    note('Use this instead of the general EDP subsidy for the same investment.', 'అదే పెట్టుబడికి సాధారణ EDP సబ్సిడీకి బదులుగా దీన్ని వాడండి.'),
  ],
  AP_TECH_UPGRADE: [
    support('Subsidy of about 20% of fixed capital investment for technology upgrade; higher for special-category owners.', 'టెక్నాలజీ అప్‌గ్రేడ్ కోసం స్థిర మూలధన పెట్టుబడిలో సుమారు 20% సబ్సిడీ; ప్రత్యేక వర్గ యజమానులకు ఎక్కువ.'),
    who('Existing or restarting manufacturing unit in Andhra Pradesh, with an AP domicile.', 'ఆంధ్రప్రదేశ్‌లో ప్రస్తుత లేదా తిరిగి ప్రారంభించే తయారీ యూనిట్, AP స్థానికతతో.'),
    note('Paid in instalments after installation; cannot be combined with the new-unit EDP subsidy.', 'ఏర్పాటు తర్వాత విడతల్లో చెల్లింపు; కొత్త యూనిట్ EDP సబ్సిడీతో కలపలేరు.'),
  ],
  AP_PARKS: [
    support('Rebate on land cost in APIIC MSME parks; the rate depends on the order in force (up to 75% for some SC / ST units).', 'APIIC MSME పార్కుల్లో భూమి ఖర్చుపై రాయితీ; అమలులో ఉన్న ఉత్తర్వును బట్టి రేటు (కొన్ని SC / ST యూనిట్లకు 75% వరకు).'),
    who('Units set up inside an APIIC park, with an AP domicile and a registered firm.', 'APIIC పార్కులో ఏర్పాటయ్యే యూనిట్లు, AP స్థానికత మరియు నమోదిత సంస్థతో.'),
    note('Ask APIIC which order applies to your plot.', 'మీ ప్లాట్‌కు ఏ ఉత్తర్వు వర్తిస్తుందో APIICని అడగండి.'),
  ],
  OBMMS: [
    support('Subsidy (often around 50%, with a rupee cap) on a self-employment bank loan.', 'స్వయం ఉపాధి బ్యాంకు రుణంపై సబ్సిడీ (తరచూ సుమారు 50%, రూపాయి పరిమితితో).'),
    who('Andhra Pradesh residents from SC, ST, BC or disabled categories, usually aged 21–50, with a White Rice Card.', 'SC, ST, BC లేదా దివ్యాంగ వర్గాలకు చెందిన ఆంధ్రప్రదేశ్ నివాసితులు, సాధారణంగా 21–50 ఏళ్లు, వైట్ రైస్ కార్డు ఉన్నవారు.'),
    note('Run through the state welfare corporations; share and cap vary by scheme.', 'రాష్ట్ర సంక్షేమ కార్పొరేషన్ల ద్వారా; వాటా, పరిమితి పథకాన్ని బట్టి మారుతాయి.'),
  ],
  SCLCSS: [
    support('25% capital subsidy on new plant and machinery bought with a bank term loan, up to ₹25 lakh.', 'బ్యాంకు టర్మ్ లోన్‌తో కొనే కొత్త ప్లాంట్, యంత్రాలపై 25% మూలధన సబ్సిడీ, ₹25 లక్షల వరకు.'),
    who('SC / ST-owned micro and small enterprises (at least 51% SC / ST ownership in a firm) with Udyam.', 'ఉద్యమ్ ఉన్న SC / ST యాజమాన్య సూక్ష్మ, చిన్న సంస్థలు (సంస్థలో కనీసం 51% SC / ST యాజమాన్యం).'),
    note('New machinery only; second-hand or fabricated machines do not qualify.', 'కొత్త యంత్రాలకే; సెకండ్ హ్యాండ్ లేదా స్వయంగా తయారుచేసినవి అర్హం కావు.'),
  ],
  MSE_SPICE: [
    support('25% subsidy on new plant and machinery, up to ₹12.50 lakh.', 'కొత్త ప్లాంట్, యంత్రాలపై 25% సబ్సిడీ, ₹12.50 లక్షల వరకు.'),
    who('Existing Udyam-registered micro and small units in circular-economy sectors (plastic, rubber, e-waste and similar).', 'సర్క్యులర్-ఎకానమీ రంగాల్లో (ప్లాస్టిక్, రబ్బరు, ఇ-వేస్ట్ వంటివి) ఉన్న ఉద్యమ్ నమోదిత సూక్ష్మ, చిన్న యూనిట్లు.'),
    note('Not for brand-new units; second-hand machinery is excluded.', 'పూర్తిగా కొత్త యూనిట్లకు కాదు; సెకండ్ హ్యాండ్ యంత్రాలు మినహాయింపు.'),
  ],
  ECLGS: [
    support('Extra working capital of up to about 20% of your peak outstanding, with a 100% government guarantee cover for MSMEs and interest capped at 9%.', 'మీ గరిష్ట బకాయిలో సుమారు 20% వరకు అదనపు వర్కింగ్ క్యాపిటల్, MSMEలకు 100% ప్రభుత్వ గ్యారెంటీ కవర్‌తో, వడ్డీ 9%కి పరిమితం.'),
    who('Existing borrowers whose fund-based working-capital account is in good standing.', 'ఫండ్-బేస్డ్ వర్కింగ్ క్యాపిటల్ ఖాతా సక్రమంగా ఉన్న ప్రస్తుత రుణగ్రహీతలు.'),
    note('5-year tenor including a 1-year moratorium; taken through your bank.', 'ఒక ఏడాది మారటోరియంతో సహా 5 ఏళ్ల కాలపరిమితి; మీ బ్యాంకు ద్వారా.'),
  ],
  RAMP_TEAM: [
    support('Free help to start selling on ONDC: workshops, catalogue set-up (about ₹2,500) and account management (about ₹5,000).', 'ONDCలో అమ్మకాలు మొదలుపెట్టడానికి ఉచిత సహాయం: వర్క్‌షాప్‌లు, కేటలాగ్ ఏర్పాటు (సుమారు ₹2,500), ఖాతా నిర్వహణ (సుమారు ₹5,000).'),
    who('Registered micro and small enterprises with Udyam that want to sell online.', 'ఆన్‌లైన్‌లో అమ్మాలనుకునే ఉద్యమ్ ఉన్న నమోదిత సూక్ష్మ, చిన్న సంస్థలు.'),
  ],
  EPM_NIRYAT: [
    support('2.75% interest subvention on pre- and post-shipment export loans, up to ₹50 lakh a year.', 'షిప్‌మెంట్ ముందు, తర్వాత ఎగుమతి రుణాలపై 2.75% వడ్డీ రాయితీ, ఏడాదికి ₹50 లక్షల వరకు.'),
    who('MSME exporters and merchant exporters with Udyam and an import-export code (IEC).', 'ఉద్యమ్ మరియు దిగుమతి-ఎగుమతి కోడ్ (IEC) ఉన్న MSME ఎగుమతిదారులు, వర్తక ఎగుమతిదారులు.'),
    note('Only notified products; export credit sanctioned on or after 2 January 2026.', 'నోటిఫై చేసిన ఉత్పత్తులకే; 2 జనవరి 2026 లేదా తర్వాత మంజూరైన ఎగుమతి రుణాలకు.'),
  ],
  ZED: [
    support('Assessment and certification for quality and sustainability (Bronze, Silver, Gold). This is certification support, not a loan.', 'నాణ్యత మరియు సుస్థిరతకు అంచనా, ధృవీకరణ (బ్రాంజ్, సిల్వర్, గోల్డ్). ఇది ధృవీకరణ సహాయం, రుణం కాదు.'),
    who('Registered MSEs with Udyam, mainly manufacturing.', 'ఉద్యమ్ ఉన్న నమోదిత MSEలు, ప్రధానంగా తయారీ.'),
  ],
  LEAN: [
    support('Consultant-led improvement of your shop floor to cut waste and cost.', 'వృథా, ఖర్చు తగ్గించడానికి కన్సల్టెంట్ మార్గదర్శకత్వంలో మీ షాప్ ఫ్లోర్ మెరుగుదల.'),
    who('Existing manufacturing or food units with Udyam.', 'ఉద్యమ్ ఉన్న ప్రస్తుత తయారీ లేదా ఆహార యూనిట్లు.'),
  ],
  MSME_IPR: [
    support('Help with patent, design, trademark and GI filings, and incubation.', 'పేటెంట్, డిజైన్, ట్రేడ్‌మార్క్, GI దాఖలు మరియు ఇంక్యుబేషన్‌కు సహాయం.'),
    who('Knowledge, manufacturing or food units with Udyam.', 'ఉద్యమ్ ఉన్న నాలెడ్జ్, తయారీ లేదా ఆహార యూనిట్లు.'),
  ],
  CHAMPIONS: [
    support('Helpdesk for delayed payments, public procurement and other MSME problems; also the window for ZED, LEAN and innovation support.', 'ఆలస్య చెల్లింపులు, ప్రభుత్వ కొనుగోళ్లు, ఇతర MSME సమస్యలకు హెల్ప్‌డెస్క్; ZED, LEAN, ఆవిష్కరణ సహాయానికి కూడా ఒకే కిటికీ.'),
    note('A service, not a bank loan or subsidy; there is no DPR to prepare.', 'ఇది సేవ, బ్యాంకు రుణం లేదా సబ్సిడీ కాదు; DPR తయారు చేయాల్సిన అవసరం లేదు.'),
  ],
  ESDP: [
    support('Entrepreneurship and skill-development training batches.', 'ఎంట్రప్రెన్యూర్‌షిప్ మరియు నైపుణ్య అభివృద్ధి శిక్షణ బ్యాచ్‌లు.'),
    note('Training helps with PMEGP and AP CMEP, which expect it before the subsidy is released. No DPR to prepare.', 'సబ్సిడీ విడుదలకు ముందు PMEGP, AP CMEP ఆశించే శిక్షణకు ఇది ఉపయోగపడుతుంది. DPR అవసరం లేదు.'),
  ],
  SCST_HUB: [
    support('Procurement readiness and market access for SC / ST enterprises.', 'SC / ST సంస్థలకు కొనుగోళ్లకు సిద్ధత మరియు మార్కెట్ అందుబాటు.'),
    who('SC / ST-owned MSEs with Udyam that want to sell to government and large buyers.', 'ప్రభుత్వానికి, పెద్ద కొనుగోలుదారులకు అమ్మాలనుకునే ఉద్యమ్ ఉన్న SC / ST యాజమాన్య MSEలు.'),
  ],
  PMS: [
    support('Support toward trade-fair stalls and marketing costs.', 'ట్రేడ్ ఫెయిర్ స్టాళ్లు, మార్కెటింగ్ ఖర్చులకు సహాయం.'),
    who('Udyam-registered units seeking marketing support.', 'మార్కెటింగ్ సహాయం కోరే ఉద్యమ్ నమోదిత యూనిట్లు.'),
  ],
  NTCEC: [
    support('Tooling, training and job-work at MSME technology centres.', 'MSME టెక్నాలజీ కేంద్రాల్లో టూలింగ్, శిక్షణ, జాబ్-వర్క్.'),
    note('A service, not a loan or subsidy; there is no DPR to prepare.', 'ఇది సేవ, రుణం లేదా సబ్సిడీ కాదు; DPR అవసరం లేదు.'),
  ],
  MSE_GIFT: [
    support('Financing support for green and energy-efficient machinery.', 'గ్రీన్, ఇంధన-సమర్థ యంత్రాలకు ఆర్థిక సహాయం.'),
    who('Existing manufacturing or food units upgrading technology, with Udyam.', 'టెక్నాలజీ అప్‌గ్రేడ్ చేసే, ఉద్యమ్ ఉన్న ప్రస్తుత తయారీ లేదా ఆహార యూనిట్లు.'),
  ],
  CVY: [
    support('Coir Board subsidy and credit support for coir product units.', 'కొబ్బరి పీచు ఉత్పత్తుల యూనిట్లకు కాయిర్ బోర్డు సబ్సిడీ, రుణ సహాయం.'),
    who('Coir product manufacturing and craft units.', 'కొబ్బరి పీచు ఉత్పత్తుల తయారీ, హస్తకళ యూనిట్లు.'),
  ],
  NHDP: [
    support('Support for handloom weavers and weaving units.', 'చేనేత కార్మికులు, నేత యూనిట్లకు సహాయం.'),
    who('Handloom weaving and craft units.', 'చేనేత నేత, హస్తకళ యూనిట్లు.'),
  ],
  PTUAS: [
    support('Assistance for technology upgrade in pharma units.', 'ఫార్మా యూనిట్లలో టెక్నాలజీ అప్‌గ్రేడ్‌కు సహాయం.'),
    who('Existing pharma units upgrading technology, with Udyam.', 'టెక్నాలజీ అప్‌గ్రేడ్ చేసే, ఉద్యమ్ ఉన్న ప్రస్తుత ఫార్మా యూనిట్లు.'),
  ],
  PMPDS: [
    support('Promotion and development support for pharma and medical-device manufacturing.', 'ఫార్మా, వైద్య పరికరాల తయారీకి ప్రోత్సాహం, అభివృద్ధి సహాయం.'),
    who('Pharma and medical-device manufacturers.', 'ఫార్మా, వైద్య పరికరాల తయారీదారులు.'),
  ],
  ASPIRE: [
    support('Incubation and livelihood support for rural innovation and new businesses.', 'గ్రామీణ ఆవిష్కరణ, కొత్త వ్యాపారాలకు ఇంక్యుబేషన్, జీవనోపాధి సహాయం.'),
    who('Idea-stage or new units, smaller than a ₹10 crore factory.', 'ఐడియా దశలోని లేదా కొత్త యూనిట్లు, ₹10 కోట్ల ఫ్యాక్టరీ కంటే చిన్నవి.'),
  ],
  MSE_CDP: [
    support('Funding for common facility centres and cluster infrastructure shared by many units.', 'అనేక యూనిట్లు పంచుకునే ఉమ్మడి సౌకర్య కేంద్రాలు, క్లస్టర్ మౌలిక సదుపాయాలకు నిధులు.'),
    note('Applies to a group of units, not one business. Use Cluster DPR.', 'ఒక వ్యాపారానికి కాదు, యూనిట్ల సమూహానికి వర్తిస్తుంది. క్లస్టర్ DPR వాడండి.'),
  ],
  SFURTI: [
    support('Regeneration of traditional-industry clusters through common facilities.', 'ఉమ్మడి సౌకర్యాల ద్వారా సంప్రదాయ పరిశ్రమ క్లస్టర్ల పునరుద్ధరణ.'),
    note('Applies to a group of artisans or units. Use Cluster DPR.', 'కళాకారులు లేదా యూనిట్ల సమూహానికి వర్తిస్తుంది. క్లస్టర్ DPR వాడండి.'),
  ],
  AP_CDP: [
    support('State support for cluster development and common facilities.', 'క్లస్టర్ అభివృద్ధి, ఉమ్మడి సౌకర్యాలకు రాష్ట్ర సహాయం.'),
    note('Applies to a group of units. Use Cluster DPR.', 'యూనిట్ల సమూహానికి వర్తిస్తుంది. క్లస్టర్ DPR వాడండి.'),
  ],
  APICF: [
    support('Support for common facilities shared by pharma units.', 'ఫార్మా యూనిట్లు పంచుకునే ఉమ్మడి సౌకర్యాలకు సహాయం.'),
    note('Applies to a pharma cluster. Use Cluster DPR.', 'ఫార్మా క్లస్టర్‌కు వర్తిస్తుంది. క్లస్టర్ DPR వాడండి.'),
  ],
};

export function keyFactsFor(code: string): KeyFact[] {
  return KEY_FACTS[code] || [];
}

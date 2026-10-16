import { QuestionId } from './types';
import { sanitizeOwnerTags } from './ownerSelection';

export type HelpLang = 'en' | 'te';

export interface HelpReply {
  id: string;
  label: { en: string; te: string };
}

export interface ClarifyingQuestion {
  id: string;
  prompt: { en: string; te: string };
  replies: HelpReply[];
}

export interface QuestionHelpGuide {
  questionId: QuestionId;
  apRuleNotes: string;
  clarifyingQuestions: ClarifyingQuestion[];
  /** Return optionIds when enough answers collected; null = ask next clarifying question. */
  mapToOption: (replyIds: string[]) => string[] | null;
  /** Which clarifying question to ask next given collected reply ids. */
  nextQuestionIndex: (replyIds: string[]) => number | null;
}

function has(replyIds: string[], id: string): boolean {
  return replyIds.includes(id);
}

function firstOf(replyIds: string[], ids: string[]): string | undefined {
  return ids.find((id) => replyIds.includes(id));
}

const activityGuide: QuestionHelpGuide = {
  questionId: 'activity',
  apRuleNotes:
    'AP CMEP targets Manufacturing or Knowledge Economy / tech services (IT/ITeS, software, biotech, R&D). AP MSME-EDP 4.0 targets manufacturing units. AP Food Processing Policy 4.0 targets food processing in AP. OBMMS welfare loans cover broader self-employment. Crop-only farming is not an MSME unit under these AP industrial schemes. Do not cite PMEGP, MUDRA, or other central schemes.',
  clarifyingQuestions: [
    {
      id: 'mainType',
      prompt: {
        en: 'Are you mainly making/processing products, buying/selling, giving a service, or only farming?',
        te: 'మీరు ప్రధానంగా వస్తువులు తయారు/ప్రాసెస్ చేస్తున్నారా, కొని అమ్ముతున్నారా, సేవ ఇస్తున్నారా, లేదా కేవలం వ్యవసాయమా?',
      },
      replies: [
        { id: 'making', label: { en: 'Making / processing', te: 'తయారీ / ప్రాసెసింగ్' } },
        { id: 'trading', label: { en: 'Buying and selling', te: 'కొని అమ్మడం' } },
        { id: 'serving', label: { en: 'Giving a service', te: 'సేవ ఇవ్వడం' } },
        { id: 'farming', label: { en: 'Only farming crops', te: 'కేవలం పంటలు' } },
        { id: 'otherPath', label: { en: 'Something else / not sure', te: 'ఇంకేదో / తెలియదు' } },
      ],
    },
    {
      id: 'makingKind',
      prompt: {
        en: 'Is it food processing (pickle, bakery, spice, dairy) or other manufacturing (machines, plastic, metal)?',
        te: 'ఇది ఆహార ప్రాసెసింగ్ (ఊరగాయ, బేకరీ, మసాలా, డైరీ) లేదా ఇతర తయారీ (యంత్రాలు, ప్లాస్టిక్, మెటల్)?',
      },
      replies: [
        { id: 'foodProc', label: { en: 'Food processing', te: 'ఆహార ప్రాసెసింగ్' } },
        { id: 'otherMfg', label: { en: 'Other manufacturing', te: 'ఇతర తయారీ' } },
        { id: 'craftWork', label: { en: 'Traditional craft', te: 'సాంప్రదాయ కళ' } },
      ],
    },
    {
      id: 'specialKind',
      prompt: {
        en: 'Is this traditional craft work, street cart/stall vending, more than one type, or not a business unit?',
        te: 'ఇది సాంప్రదాయ కళ, వీధి బండి/స్టాల్, ఒకటికంటే ఎక్కువ రకాలు, లేదా వ్యాపార యూనిట్ కాదా?',
      },
      replies: [
        { id: 'craft', label: { en: 'Traditional craft', te: 'సాంప్రదాయ కళ' } },
        { id: 'vending', label: { en: 'Street cart or stall', te: 'వీధి బండి / స్టాల్' } },
        { id: 'mixed', label: { en: 'More than one type', te: 'ఒకటికంటే ఎక్కువ' } },
        { id: 'notBusiness', label: { en: 'Not starting a business unit', te: 'వ్యాపార యూనిట్ కాదు' } },
        { id: 'deciding', label: { en: 'Still deciding', te: 'ఇంకా నిర్ణయించలేదు' } },
      ],
    },
    {
      id: 'serviceKind',
      prompt: {
        en: 'Is it knowledge economy / tech services (IT, software, biotech, R&D) or a general service (salon, clinic, repair)?',
        te: 'ఇది నాలెడ్జ్ ఎకానమీ / టెక్ సేవలా (IT, సాఫ్ట్‌వేర్, బయోటెక్, R&D) లేదా సాధారణ సేవ (సెలూన్, క్లినిక్, రిపేర్)?',
      },
      replies: [
        { id: 'knowledge', label: { en: 'Knowledge economy / tech', te: 'నాలెడ్జ్ ఎకానమీ / టెక్' } },
        { id: 'generalService', label: { en: 'General service', te: 'సాధారణ సేవ' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'making') && !firstOf(replyIds, ['foodProc', 'otherMfg', 'craftWork'])) return 1;
    if (has(replyIds, 'otherPath') && !firstOf(replyIds, ['craft', 'vending', 'mixed', 'notBusiness', 'deciding']))
      return 2;
    if (has(replyIds, 'serving') && !firstOf(replyIds, ['knowledge', 'generalService'])) return 3;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'farming')) return ['crop'];
    if (has(replyIds, 'trading')) return ['trade'];
    if (has(replyIds, 'knowledge')) return ['knowledge'];
    if (has(replyIds, 'generalService')) return ['service'];
    if (has(replyIds, 'foodProc')) return ['food'];
    if (has(replyIds, 'otherMfg')) return ['mfg'];
    if (has(replyIds, 'craftWork') || has(replyIds, 'craft')) return ['craft'];
    if (has(replyIds, 'vending')) return ['vending'];
    if (has(replyIds, 'mixed')) return ['mixed'];
    if (has(replyIds, 'notBusiness')) return ['notBusiness'];
    if (has(replyIds, 'deciding')) return ['notSure'];
    return null;
  },
};

const stageGuide: QuestionHelpGuide = {
  questionId: 'stage',
  apRuleNotes:
    'AP CMEP and AP EDP 4.0 incentives focus on new (greenfield) enterprises. AP Technology Upgradation is for existing or restarted manufacturing units. OBMMS needs a planned or running unit, not idea-only. Do not cite central schemes.',
  clarifyingQuestions: [
    {
      id: 'started',
      prompt: {
        en: 'Have you already started operations (sales, production, or a running shop)?',
        te: 'మీరు ఇప్పటికే నడుపుతున్నారా (అమ్మకాలు, ఉత్పత్తి, లేదా నడుస్తున్న షాప్)?',
      },
      replies: [
        { id: 'yesRunning', label: { en: 'Yes, already running', te: 'అవును, నడుస్తోంది' } },
        { id: 'notYet', label: { en: 'Not started yet', te: 'ఇంకా మొదలు పెట్టలేదు' } },
        { id: 'unsureStage', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
    {
      id: 'runningKind',
      prompt: {
        en: 'Are you expanding/upgrading this unit, or reopening a closed/sick unit?',
        te: 'మీరు ఈ యూనిట్‌ను విస్తరిస్తున్నారా/అప్‌గ్రేడ్ చేస్తున్నారా, లేదా మూసిన/సిక్ యూనిట్ తెరుస్తున్నారా?',
      },
      replies: [
        { id: 'expand', label: { en: 'Expand or upgrade', te: 'విస్తరణ / అప్‌గ్రేడ్' } },
        { id: 'reopen', label: { en: 'Reopen closed/sick unit', te: 'మూసిన యూనిట్ తెరవడం' } },
      ],
    },
    {
      id: 'newKind',
      prompt: {
        en: 'Are you starting a brand-new unit, or do you only have an idea (no land, machines, or operations yet)?',
        te: 'మీరు కొత్త యూనిట్ మొదలుపెడుతున్నారా, లేదా కేవలం ఆలోచన మాత్రమే (భూమి, యంత్రాలు, నిర్వహణ లేవు)?',
      },
      replies: [
        { id: 'brandNew', label: { en: 'Brand-new unit', te: 'కొత్త యూనిట్' } },
        { id: 'ideaOnly', label: { en: 'Only an idea so far', te: 'కేవలం ఆలోచన' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'yesRunning') && !firstOf(replyIds, ['expand', 'reopen'])) return 1;
    if (has(replyIds, 'notYet') && !firstOf(replyIds, ['brandNew', 'ideaOnly'])) return 2;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'unsureStage')) return ['notSure'];
    if (has(replyIds, 'expand')) return ['brownfield'];
    if (has(replyIds, 'reopen')) return ['restart'];
    if (has(replyIds, 'brandNew')) return ['greenfield'];
    if (has(replyIds, 'ideaOnly')) return ['idea'];
    return null;
  },
};

const budgetGuide: QuestionHelpGuide = {
  questionId: 'budget',
  apRuleNotes:
    'AP EDP / FPP / CMEP / OBMMS need a real project cost (not zero/unknown). AP CMEP is credit-linked: "no money needed" fails. Help map to the closest cost band. Andhra Pradesh Industries rules only.',
  clarifyingQuestions: [
    {
      id: 'hasBudget',
      prompt: {
        en: 'Do you already have a rough total project cost (land/building/machines + setup)?',
        te: 'మీ వద్ద మొత్తం ప్రాజెక్ట్ ఖర్చు అంచనా ఉందా (భూమి/భవనం/యంత్రాలు + సెటప్)?',
      },
      replies: [
        { id: 'haveCost', label: { en: 'Yes, I have a rough cost', te: 'అవును, అంచనా ఉంది' } },
        { id: 'zeroCost', label: { en: 'No money needed', te: 'డబ్బు అవసరం లేదు' } },
        { id: 'unknownCost', label: { en: 'Not calculated yet', te: 'ఇంకా లెక్కించలేదు' } },
      ],
    },
    {
      id: 'bandWide',
      prompt: {
        en: 'Is the total closer to under ₹5 lakh, ₹5–20 lakh, ₹20 lakh–1 crore, or above ₹1 crore?',
        te: 'మొత్తం ₹5 లక్షల లోపు, ₹5–20 లక్షలు, ₹20 లక్షలు–1 కోటి, లేదా ₹1 కోటి పైన దగ్గరగా ఉందా?',
      },
      replies: [
        { id: 'under5', label: { en: 'Under ₹5 lakh', te: '₹5 లక్షల లోపు' } },
        { id: '5to20', label: { en: '₹5–20 lakh', te: '₹5–20 లక్షలు' } },
        { id: '20to1cr', label: { en: '₹20 lakh–1 crore', te: '₹20 లక్షలు–1 కోటి' } },
        { id: 'above1cr', label: { en: 'Above ₹1 crore', te: '₹1 కోటి పైన' } },
      ],
    },
    {
      id: 'bandNarrow',
      prompt: {
        en: 'Pick the closest band.',
        te: 'దగ్గరి బ్యాండ్ ఎంచుకోండి.',
      },
      replies: [
        { id: 'under2L', label: { en: 'Less than ₹2 lakh', te: '₹2 లక్షల కంటే తక్కువ' } },
        { id: '2to5L', label: { en: '₹2–5 lakh', te: '₹2–5 లక్షలు' } },
        { id: '5to10L', label: { en: '₹5–10 lakh', te: '₹5–10 లక్షలు' } },
        { id: '10to20L', label: { en: '₹10–20 lakh', te: '₹10–20 లక్షలు' } },
        { id: '20to50L', label: { en: '₹20–50 lakh', te: '₹20–50 లక్షలు' } },
        { id: '50Lto1Cr', label: { en: '₹50 lakh–1 crore', te: '₹50 లక్షలు–1 కోటి' } },
        { id: '1to10Cr', label: { en: '₹1–10 crore', te: '₹1–10 కోట్లు' } },
        { id: 'above10Cr', label: { en: 'More than ₹10 crore', te: '₹10 కోట్ల కంటే ఎక్కువ' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'haveCost') && !firstOf(replyIds, ['under5', '5to20', '20to1cr', 'above1cr'])) return 1;
    const wide = firstOf(replyIds, ['under5', '5to20', '20to1cr', 'above1cr']);
    const narrowDone = firstOf(replyIds, [
      'under2L',
      '2to5L',
      '5to10L',
      '10to20L',
      '20to50L',
      '50Lto1Cr',
      '1to10Cr',
      'above10Cr',
    ]);
    if (wide && !narrowDone) return 2;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'zeroCost')) return ['none'];
    if (has(replyIds, 'unknownCost')) return ['notSure'];
    const narrow = firstOf(replyIds, [
      'under2L',
      '2to5L',
      '5to10L',
      '10to20L',
      '20to50L',
      '50Lto1Cr',
      '1to10Cr',
      'above10Cr',
    ]);
    if (narrow) return [narrow];
    return null;
  },
};

const legalGuide: QuestionHelpGuide = {
  questionId: 'legal',
  apRuleNotes:
    'AP EDP needs a registered sole proprietorship, partnership/LLP, or company. OBMMS often allows individual / unregistered applicants. SHG/FPO/coop/trust/society map to otherEntity. Andhra Pradesh rules only.',
  clarifyingQuestions: [
    {
      id: 'registered',
      prompt: {
        en: 'Do you already have a registered firm (GST / partnership / company / LLP)?',
        te: 'మీ వద్ద ఇప్పటికే రిజిస్టర్డ్ ఫర్మ్ ఉందా (GST / భాగస్వామ్యం / కంపెనీ / LLP)?',
      },
      replies: [
        { id: 'yesReg', label: { en: 'Yes, registered', te: 'అవును, రిజిస్టర్ అయింది' } },
        { id: 'noReg', label: { en: 'No firm yet', te: 'ఇంకా ఫర్మ్ లేదు' } },
        { id: 'entityGroup', label: { en: 'SHG / coop / trust / FPO', te: 'SHG / సహకార / ట్రస్ట్ / FPO' } },
        { id: 'legalUnsure', label: { en: 'Not decided yet', te: 'ఇంకా నిర్ణయించలేదు' } },
      ],
    },
    {
      id: 'firmType',
      prompt: {
        en: 'Are you the only owner, partners/LLP, or a private/public limited company?',
        te: 'మీరు ఒక్కరే యజమానా, భాగస్వాములు/LLP, లేదా ప్రైవేట్/పబ్లిక్ లిమిటెడ్ కంపెనీ?',
      },
      replies: [
        { id: 'sole', label: { en: 'Only me (sole)', te: 'నేను మాత్రమే' } },
        { id: 'partnership', label: { en: 'Partnership or LLP', te: 'భాగస్వామ్యం / LLP' } },
        { id: 'company', label: { en: 'Pvt or public limited', te: 'ప్రైవేట్ / పబ్లిక్ లిమిటెడ్' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'yesReg') && !firstOf(replyIds, ['sole', 'partnership', 'company'])) return 1;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'noReg')) return ['unregistered'];
    if (has(replyIds, 'entityGroup')) return ['otherEntity'];
    if (has(replyIds, 'legalUnsure')) return ['notSure'];
    if (has(replyIds, 'sole')) return ['sole'];
    if (has(replyIds, 'partnership')) return ['partnership'];
    if (has(replyIds, 'company')) return ['company'];
    return null;
  },
};

const ownerGuide: QuestionHelpGuide = {
  questionId: 'owner',
  apRuleNotes:
    'AP CMEP enhanced subsidy needs AP domicile plus woman, transgender, ex-serviceman, or PWD. AP special category (EDP) includes women, BC, SC, ST, minority, specially abled with AP domicile. OBMMS needs SC/ST/BC/PWD. Majority means 51%+. Exclusive tags: generalMale, notDecided, noMajority, notSure — never combine with others. Combinable tags include female, sc, st, bc, pwd, transgender, exServiceman.',
  clarifyingQuestions: [
    {
      id: 'majority',
      prompt: {
        en: 'Does one person hold 51% or more, or is ownership equal / not decided?',
        te: 'ఒక వ్యక్తికి 51% లేదా ఎక్కువ ఉందా, లేదా సమాన వాటా / నిర్ణయం కాలేదా?',
      },
      replies: [
        { id: 'hasMajority', label: { en: 'Someone holds 51%+', te: 'ఎవరికైనా 51%+ ఉంది' } },
        { id: 'equalSplit', label: { en: 'Equal split (no 51%)', te: 'సమాన వాటా (51% లేదు)' } },
        { id: 'ownerNotDecided', label: { en: 'Ownership not decided', te: 'యజమాన్యం నిర్ణయం కాలేదు' } },
        { id: 'ownerUnsure', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
    {
      id: 'woman',
      prompt: {
        en: 'Is that majority owner a woman?',
        te: 'ఆ మెజారిటీ యజమాని మహిళా?',
      },
      replies: [
        { id: 'isWoman', label: { en: 'Yes, a woman', te: 'అవును, మహిళ' } },
        { id: 'notWoman', label: { en: 'No', te: 'కాదు' } },
      ],
    },
    {
      id: 'category',
      prompt: {
        en: 'What is their Andhra Pradesh social category?',
        te: 'వారి ఆంధ్రప్రదేశ్ సామాజిక వర్గం ఏమిటి?',
      },
      replies: [
        { id: 'sc', label: { en: 'Scheduled Caste (SC)', te: 'ఎస్సీ (SC)' } },
        { id: 'st', label: { en: 'Scheduled Tribe (ST)', te: 'ఎస్టీ (ST)' } },
        { id: 'bc', label: { en: 'BC or Minority', te: 'బీసీ లేదా మైనారిటీ' } },
        { id: 'pwd', label: { en: 'Person with disability', te: 'వికలాంగులు' } },
        { id: 'general', label: { en: 'General category', te: 'సాధారణ వర్గం' } },
      ],
    },
    {
      id: 'extraBoost',
      prompt: {
        en: 'Does any of this also apply to the majority owner?',
        te: 'మెజారిటీ యజమానికి ఇంకేదైనా వర్తిస్తుందా?',
      },
      replies: [
        { id: 'transgender', label: { en: 'Transgender person', te: 'ట్రాన్స్‌జెండర్ వ్యక్తి' } },
        { id: 'exServiceman', label: { en: 'Ex-serviceman', te: 'మాజీ సైనికుడు' } },
        { id: 'bothBoost', label: { en: 'Transgender and ex-serviceman', te: 'ట్రాన్స్‌జెండర్ మరియు మాజీ సైనికుడు' } },
        { id: 'noneExtra', label: { en: 'None of these', te: 'వీటిలో ఏదీ కాదు' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'hasMajority') && !firstOf(replyIds, ['isWoman', 'notWoman'])) return 1;
    if (
      has(replyIds, 'hasMajority') &&
      firstOf(replyIds, ['isWoman', 'notWoman']) &&
      !firstOf(replyIds, ['sc', 'st', 'bc', 'pwd', 'general'])
    )
      return 2;
    if (
      has(replyIds, 'hasMajority') &&
      firstOf(replyIds, ['sc', 'st', 'bc', 'pwd', 'general']) &&
      !firstOf(replyIds, ['transgender', 'exServiceman', 'bothBoost', 'noneExtra'])
    )
      return 3;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'equalSplit')) return ['noMajority'];
    if (has(replyIds, 'ownerNotDecided')) return ['notDecided'];
    if (has(replyIds, 'ownerUnsure')) return ['notSure'];
    if (!has(replyIds, 'hasMajority')) return null;
    if (!firstOf(replyIds, ['isWoman', 'notWoman'])) return null;
    const cat = firstOf(replyIds, ['sc', 'st', 'bc', 'pwd', 'general']);
    if (!cat) return null;
    const extra = firstOf(replyIds, ['transgender', 'exServiceman', 'bothBoost', 'noneExtra']);
    if (!extra) return null;

    const tags: string[] = [];
    if (has(replyIds, 'isWoman')) tags.push('female');
    if (cat !== 'general') tags.push(cat);
    if (has(replyIds, 'transgender') || has(replyIds, 'bothBoost')) tags.push('transgender');
    if (has(replyIds, 'exServiceman') || has(replyIds, 'bothBoost')) tags.push('exServiceman');
    if (has(replyIds, 'notWoman') && cat === 'general') tags.push('generalMale');
    if (!tags.length) return ['generalMale'];
    return tags;
  },
};

const domicileGuide: QuestionHelpGuide = {
  questionId: 'domicile',
  apRuleNotes:
    'AP CMEP, EDP, Food Processing Policy, OBMMS, and APIIC park rebates require Andhra Pradesh local domicile. Living elsewhere but planning to set up in AP is planningAp — usually not enough for domicile-gated incentives until they are AP residents.',
  clarifyingQuestions: [
    {
      id: 'liveAp',
      prompt: {
        en: 'Is your permanent residence / Aadhaar address in Andhra Pradesh?',
        te: 'మీ శాశ్వత నివాసం / ఆధార్ చిరునామా ఆంధ్రప్రదేశ్‌లో ఉందా?',
      },
      replies: [
        { id: 'yesAp', label: { en: 'Yes, I live in AP', te: 'అవును, APలో ఉంటాను' } },
        { id: 'noAp', label: { en: 'No, another state', te: 'కాదు, ఇతర రాష్ట్రం' } },
        { id: 'domUnsure', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
    {
      id: 'planAp',
      prompt: {
        en: 'Do you live elsewhere but plan to set up the unit in Andhra Pradesh?',
        te: 'మీరు ఇతర చోట ఉంటూ యూనిట్ ఆంధ్రప్రదేశ్‌లో పెట్టాలనుకుంటున్నారా?',
      },
      replies: [
        { id: 'willSetupAp', label: { en: 'Yes, plan to set up in AP', te: 'అవును, APలో పెట్టాలనుకుంటున్నాను' } },
        { id: 'stayOther', label: { en: 'No, staying outside AP', te: 'కాదు, AP బయటే' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'noAp') && !firstOf(replyIds, ['willSetupAp', 'stayOther'])) return 1;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'yesAp')) return ['ap'];
    if (has(replyIds, 'domUnsure')) return ['notSure'];
    if (has(replyIds, 'willSetupAp')) return ['planningAp'];
    if (has(replyIds, 'stayOther')) return ['other'];
    return null;
  },
};

const locationGuide: QuestionHelpGuide = {
  questionId: 'location',
  apRuleNotes:
    'AP EDP needs unit in city/town, village, or APIIC park in AP — not home-only. AP MSME-PARKS land rebate needs APIIC industrial park. OBMMS needs the unit in Andhra Pradesh. Outside AP fails state schemes.',
  clarifyingQuestions: [
    {
      id: 'inAp',
      prompt: {
        en: 'Will the unit be inside Andhra Pradesh?',
        te: 'యూనిట్ ఆంధ్రప్రదేశ్ లోపల ఉంటుందా?',
      },
      replies: [
        { id: 'unitInAp', label: { en: 'Yes, in Andhra Pradesh', te: 'అవును, APలో' } },
        { id: 'unitOutside', label: { en: 'Outside Andhra Pradesh', te: 'AP బయట' } },
        { id: 'locUndecided', label: { en: 'Location not decided', te: 'స్థలం నిర్ణయం కాలేదు' } },
      ],
    },
    {
      id: 'siteType',
      prompt: {
        en: 'Is it in a municipality (city/town), gram panchayat (village), APIIC industrial park, or only from home?',
        te: 'ఇది పురపాలక (పట్టణం), గ్రామ పంచాయతీ, APIIC పార్క్, లేదా కేవలం ఇంటి నుంచేనా?',
      },
      replies: [
        { id: 'urban', label: { en: 'City or town', te: 'పట్టణం' } },
        { id: 'rural', label: { en: 'Village (gram panchayat)', te: 'గ్రామం' } },
        { id: 'apiic', label: { en: 'APIIC industrial park', te: 'APIIC పార్క్' } },
        { id: 'home', label: { en: 'From home only', te: 'కేవలం ఇంటి నుంచి' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'unitInAp') && !firstOf(replyIds, ['urban', 'rural', 'apiic', 'home'])) return 1;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'unitOutside')) return ['outsideAp'];
    if (has(replyIds, 'locUndecided')) return ['notDecided'];
    if (has(replyIds, 'urban')) return ['urban'];
    if (has(replyIds, 'rural')) return ['rural'];
    if (has(replyIds, 'apiic')) return ['apiic'];
    if (has(replyIds, 'home')) return ['home'];
    return null;
  },
};

const riceCardGuide: QuestionHelpGuide = {
  questionId: 'riceCard',
  apRuleNotes:
    'AP OBMMS self-employment loans require an Andhra Pradesh White Rice Card. Other ration cards are not enough. This is an AP welfare corporation rule, not a central ration scheme.',
  clarifyingQuestions: [
    {
      id: 'hasWhite',
      prompt: {
        en: 'Does your family hold an Andhra Pradesh White Rice Card?',
        te: 'మీ కుటుంబానికి ఆంధ్రప్రదేశ్ వైట్ రైస్ కార్డ్ ఉందా?',
      },
      replies: [
        { id: 'whiteYes', label: { en: 'Yes, White Rice Card', te: 'అవును, వైట్ రైస్ కార్డ్' } },
        { id: 'whiteNo', label: { en: 'No White Rice Card', te: 'వైట్ రైస్ కార్డ్ లేదు' } },
        { id: 'riceUnsure', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
    {
      id: 'otherRation',
      prompt: {
        en: 'Do you hold a different Andhra Pradesh ration card (not White)?',
        te: 'మీ వద్ద వేరే ఆంధ్రప్రదేశ్ రేషన్ కార్డ్ ఉందా (వైట్ కాదు)?',
      },
      replies: [
        { id: 'otherCard', label: { en: 'Yes, another ration card', te: 'అవును, ఇంకొక రేషన్ కార్డ్' } },
        { id: 'noCard', label: { en: 'No ration card', te: 'రేషన్ కార్డ్ లేదు' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'whiteNo') && !firstOf(replyIds, ['otherCard', 'noCard'])) return 1;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'whiteYes')) return ['yes'];
    if (has(replyIds, 'riceUnsure')) return ['notSure'];
    if (has(replyIds, 'otherCard')) return ['otherCard'];
    if (has(replyIds, 'noCard')) return ['no'];
    return null;
  },
};

const ageGuide: QuestionHelpGuide = {
  questionId: 'age',
  apRuleNotes:
    'AP OBMMS typically requires age 21 to 60. Map the applicant to the correct band for AP welfare corporation screening.',
  clarifyingQuestions: [
    {
      id: 'ageBand',
      prompt: {
        en: 'How old are you?',
        te: 'మీ వయస్సు ఎంత?',
      },
      replies: [
        { id: 'under18', label: { en: 'Below 18', te: '18 కంటే తక్కువ' } },
        { id: '18to20', label: { en: '18 to 20', te: '18 నుండి 20' } },
        { id: '21to50', label: { en: '21 to 50', te: '21 నుండి 50' } },
        { id: '51to60', label: { en: '51 to 60', te: '51 నుండి 60' } },
        { id: 'above60', label: { en: 'Above 60', te: '60 పైన' } },
        { id: 'ageUnsure', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    return replyIds.length ? null : 0;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'ageUnsure')) return ['notSure'];
    const band = firstOf(replyIds, ['under18', '18to20', '21to50', '51to60', 'above60']);
    return band ? [band] : null;
  },
};

const educationGuide: QuestionHelpGuide = {
  questionId: 'education',
  apRuleNotes:
    'Used for DIC / welfare paperwork completeness in Andhra Pradesh applications. 8th pass or higher vs below 8th. Certificates help; lack of certificates may map to notSure.',
  clarifyingQuestions: [
    {
      id: 'eighth',
      prompt: {
        en: 'Have you passed 8th class or higher?',
        te: 'మీరు 8వ తరగతి లేదా అంతకంటే ఎక్కువ పాసైనారా?',
      },
      replies: [
        { id: 'yes8', label: { en: 'Yes, 8th or higher', te: 'అవును, 8వ లేదా ఎక్కువ' } },
        { id: 'no8', label: { en: 'Below 8th class', te: '8వ కంటే తక్కువ' } },
        { id: 'eduUnsure', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
    {
      id: 'certs',
      prompt: {
        en: 'Do you have school certificates, or only remember the class you studied?',
        te: 'మీ వద్ద స్కూల్ సర్టిఫికేట్లు ఉన్నాయా, లేదా చదివిన తరగతి గుర్తుందా మాత్రమే?',
      },
      replies: [
        { id: 'haveCerts', label: { en: 'I have certificates', te: 'సర్టిఫికేట్లు ఉన్నాయి' } },
        { id: 'noCerts', label: { en: 'No certificates', te: 'సర్టిఫికేట్లు లేవు' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'yes8') && !firstOf(replyIds, ['haveCerts', 'noCerts'])) return 1;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'eduUnsure')) return ['notSure'];
    if (has(replyIds, 'no8')) return ['below8th'];
    if (has(replyIds, 'noCerts')) return ['notSure'];
    if (has(replyIds, 'haveCerts')) return ['8thPlus'];
    return null;
  },
};

const udyamGuide: QuestionHelpGuide = {
  questionId: 'udyam',
  apRuleNotes:
    'AP MSME & Entrepreneur Development Policy 4.0 and Food Processing Policy 4.0 require Udyam registration (or readiness to register) for MSME incentives. Registration is free. Refuse blocks AP MSME incentives.',
  clarifyingQuestions: [
    {
      id: 'hasUdyam',
      prompt: {
        en: 'Do you already have an Udyam registration certificate?',
        te: 'మీ వద్ద ఇప్పటికే ఉద్యమ్ రిజిస్ట్రేషన్ సర్టిఫికేట్ ఉందా?',
      },
      replies: [
        { id: 'udyamYes', label: { en: 'Yes, I have Udyam', te: 'అవును, ఉద్యమ్ ఉంది' } },
        { id: 'udyamNo', label: { en: 'No, not yet', te: 'లేదు, ఇంకా లేదు' } },
        { id: 'udyamWhat', label: { en: 'Not sure what Udyam is', te: 'ఉద్యమ్ ఏమిటో తెలియదు' } },
      ],
    },
    {
      id: 'udyamStatus',
      prompt: {
        en: 'Have you applied already, are you willing to register (free), or do you refuse?',
        te: 'ఇప్పటికే అప్లై చేశారా, రిజిస్టర్ చేయడానికి సిద్ధమా (ఉచితం), లేదా నిరాకరిస్తున్నారా?',
      },
      replies: [
        { id: 'applied', label: { en: 'Applied, waiting for certificate', te: 'అప్లై చేశాను, వేచి ఉన్నాను' } },
        { id: 'willing', label: { en: 'Ready to register (free)', te: 'రిజిస్టర్ చేస్తాను (ఉచితం)' } },
        { id: 'refuse', label: { en: 'I do not want to register', te: 'రిజిస్టర్ చేయను' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'udyamNo') && !firstOf(replyIds, ['applied', 'willing', 'refuse'])) return 1;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'udyamYes')) return ['yes'];
    if (has(replyIds, 'udyamWhat')) return ['notSure'];
    if (has(replyIds, 'applied')) return ['applied'];
    if (has(replyIds, 'willing')) return ['willing'];
    if (has(replyIds, 'refuse')) return ['refuse'];
    return null;
  },
};

const priorSubsidyGuide: QuestionHelpGuide = {
  questionId: 'priorSubsidy',
  apRuleNotes:
    'Ask about Andhra Pradesh government subsidy or welfare corporation loans in the last 5 years (Industries / OBMMS). Outstanding AP subsidy loans can block new welfare support. Do not frame as central GoI schemes.',
  clarifyingQuestions: [
    {
      id: 'tookLoan',
      prompt: {
        en: 'In the last 5 years, did you take an Andhra Pradesh government subsidy or welfare corporation loan?',
        te: 'గత 5 సంవత్సరాల్లో ఆంధ్రప్రదేశ్ ప్రభుత్వ సబ్సిడీ లేదా సంక్షేమ సంస్థ రుణం తీసుకున్నారా?',
      },
      replies: [
        { id: 'tookYes', label: { en: 'Yes', te: 'అవును' } },
        { id: 'tookNo', label: { en: 'No', te: 'లేదు' } },
        { id: 'priorUnsure', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
    {
      id: 'repayStatus',
      prompt: {
        en: 'Is that AP subsidy loan fully repaid, or still outstanding?',
        te: 'ఆ AP సబ్సిడీ రుణం పూర్తిగా చెల్లించారా, లేదా ఇంకా బాకీ ఉందా?',
      },
      replies: [
        { id: 'repaid', label: { en: 'Fully repaid', te: 'పూర్తిగా చెల్లించాను' } },
        { id: 'outstanding', label: { en: 'Still unpaid', te: 'ఇంకా బాకీ ఉంది' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'tookYes') && !firstOf(replyIds, ['repaid', 'outstanding'])) return 1;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'tookNo')) return ['none'];
    if (has(replyIds, 'priorUnsure')) return ['notSure'];
    if (has(replyIds, 'repaid')) return ['repaid'];
    if (has(replyIds, 'outstanding')) return ['outstanding'];
    return null;
  },
};

const govtFamilyGuide: QuestionHelpGuide = {
  questionId: 'govtFamily',
  apRuleNotes:
    'AP welfare corporation self-employment screening often asks whether a close family member holds a government job. Answer yes/no/notSure for AP OBMMS-style checks. Do not invent central-scheme family rules.',
  clarifyingQuestions: [
    {
      id: 'familyJob',
      prompt: {
        en: 'Does any close family member (spouse, parent, or child) have a government job?',
        te: 'మీ సన్నిహిత కుటుంబ సభ్యుల్లో (భర్త/భార్య, తల్లిదండ్రులు, పిల్లలు) ఎవరికైనా ప్రభుత్వ ఉద్యోగం ఉందా?',
      },
      replies: [
        { id: 'familyYes', label: { en: 'Yes', te: 'అవును' } },
        { id: 'familyNo', label: { en: 'No', te: 'లేదు' } },
        { id: 'familyUnsure', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    return replyIds.length ? null : 0;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'familyYes')) return ['yes'];
    if (has(replyIds, 'familyNo')) return ['no'];
    if (has(replyIds, 'familyUnsure')) return ['notSure'];
    return null;
  },
};

const marketGuide: QuestionHelpGuide = {
  questionId: 'market',
  apRuleNotes:
    'For AP unit context (e.g. Food Processing Policy setup). Map how they mainly sell: shop/local market, online, both, export, or not selling yet. Do not recommend central ONDC/RAMP or export incentive schemes.',
  clarifyingQuestions: [
    {
      id: 'sellingYet',
      prompt: {
        en: 'Do you already sell your products, or are you not selling yet?',
        te: 'మీరు ఇప్పటికే ఉత్పత్తులు అమ్ముతున్నారా, లేదా ఇంకా అమ్మడం లేదా?',
      },
      replies: [
        { id: 'selling', label: { en: 'Already selling', te: 'ఇప్పటికే అమ్ముతున్నాను' } },
        { id: 'notSellingYet', label: { en: 'Not selling yet', te: 'ఇంకా అమ్మడం లేదు' } },
        { id: 'marketUnsure', label: { en: 'Not sure', te: 'తెలియదు' } },
      ],
    },
    {
      id: 'channel',
      prompt: {
        en: 'How do you mainly sell — shop/local market, online, both, or export to other countries?',
        te: 'మీరు ప్రధానంగా ఎలా అమ్ముతారు — దుకాణం/స్థానిక మార్కెట్, ఆన్‌లైన్, రెండూ, లేదా విదేశాలకు ఎగుమతి?',
      },
      replies: [
        { id: 'offline', label: { en: 'Shop or local market', te: 'దుకాణం / స్థానిక మార్కెట్' } },
        { id: 'ecommerce', label: { en: 'Online', te: 'ఆన్‌లైన్' } },
        { id: 'both', label: { en: 'Both shop and online', te: 'దుకాణం మరియు ఆన్‌లైన్' } },
        { id: 'export', label: { en: 'Export to other countries', te: 'విదేశాలకు ఎగుమతి' } },
      ],
    },
  ],
  nextQuestionIndex(replyIds) {
    if (!replyIds.length) return 0;
    if (has(replyIds, 'selling') && !firstOf(replyIds, ['offline', 'ecommerce', 'both', 'export'])) return 1;
    return null;
  },
  mapToOption(replyIds) {
    if (has(replyIds, 'notSellingYet')) return ['notSellingYet'];
    if (has(replyIds, 'marketUnsure')) return ['notSure'];
    if (has(replyIds, 'offline')) return ['offline'];
    if (has(replyIds, 'ecommerce')) return ['ecommerce'];
    if (has(replyIds, 'both')) return ['both'];
    if (has(replyIds, 'export')) return ['export'];
    return null;
  },
};

export const HELP_GUIDES: Partial<Record<QuestionId, QuestionHelpGuide>> = {
  activity: activityGuide,
  stage: stageGuide,
  budget: budgetGuide,
  legal: legalGuide,
  owner: ownerGuide,
  domicile: domicileGuide,
  location: locationGuide,
  riceCard: riceCardGuide,
  age: ageGuide,
  education: educationGuide,
  udyam: udyamGuide,
  priorSubsidy: priorSubsidyGuide,
  govtFamily: govtFamilyGuide,
  market: marketGuide,
};

export function getHelpGuide(questionId: QuestionId): QuestionHelpGuide {
  return (
    HELP_GUIDES[questionId] || {
      questionId,
      apRuleNotes: 'Answer based on what you need from government support.',
      clarifyingQuestions: [],
      mapToOption: () => null,
      nextQuestionIndex: () => null,
    }
  );
}

export function labelForReply(reply: HelpReply, lang: HelpLang): string {
  return reply.label[lang] || reply.label.en;
}

export function promptForQuestion(q: ClarifyingQuestion, lang: HelpLang): string {
  return q.prompt[lang] || q.prompt.en;
}

/** Filter budget narrow replies by previously chosen wide band. */
export function filterBudgetNarrowReplies(
  replies: HelpReply[],
  replyIds: string[]
): HelpReply[] {
  if (has(replyIds, 'under5')) return replies.filter((r) => r.id === 'under2L' || r.id === '2to5L');
  if (has(replyIds, '5to20')) return replies.filter((r) => r.id === '5to10L' || r.id === '10to20L');
  if (has(replyIds, '20to1cr')) return replies.filter((r) => r.id === '20to50L' || r.id === '50Lto1Cr');
  if (has(replyIds, 'above1cr')) return replies.filter((r) => r.id === '1to10Cr' || r.id === 'above10Cr');
  return replies;
}

export function sanitizeOwnerOptionIds(optionIds: string[]): string[] {
  return sanitizeOwnerTags(optionIds);
}

export function guideScriptForPrompt(questionId: QuestionId): string {
  const guide = HELP_GUIDES[questionId];
  if (!guide) return '';
  const lines = guide.clarifyingQuestions.map((q, i) => {
    const replies = q.replies.map((r) => `${r.id}=${r.label.en}`).join('; ');
    return `Q${i + 1} (${q.id}): ${q.prompt.en} | replies: ${replies}`;
  });
  return `AP rule notes: ${guide.apRuleNotes}\nClarifying script:\n${lines.join('\n')}`;
}

import {
  DATA_FIDUCIARY_ADDRESS,
  DATA_FIDUCIARY_NAME,
  DELETION_WARNING_DAYS,
  GRIEVANCE_RESPONSE_DAYS,
  PRIVACY_OFFICER_NAME,
  PRIVACY_OFFICER_ROLE,
  DRAFT_RETENTION_MONTHS,
  AUDIT_RETENTION_MONTHS,
  GRIEVANCE_EMAIL,
  PRIVACY_NOTICE_VERSION,
} from './constants';

type PrivacyNoticeCopy = {
  title: string;
  updated: string;
  notLegal: string;
  sections: Array<{ id: string; heading: string; body: string }>;
};

const EN: PrivacyNoticeCopy = {
  title: 'Privacy notice',
  updated: `Notice version ${PRIVACY_NOTICE_VERSION}`,
  notLegal:
    'This page is a product notice. It is not a lawyer’s certificate that we “comply with DPDP”.',
  sections: [
    {
      id: 'who',
      heading: 'Who is responsible',
      body: `${DATA_FIDUCIARY_NAME} decides why and how this tool uses your data. It is the Data Fiduciary under India’s Digital Personal Data Protection Act, 2023. Address: ${DATA_FIDUCIARY_ADDRESS}.`,
    },
    {
      id: 'what',
      heading: 'What we collect',
      body: 'Account details (name, email, phone, location, optional Udyam number, date of birth). DPR answers about your unit, costs, and schemes. Optional identity scans (Aadhaar, PAN, passbook) if you upload them. We store whether a scan is present, not the Aadhaar or PAN number as a field.',
    },
    {
      id: 'why',
      heading: 'Why we collect it',
      body: 'To create an account, let you write and download a Detailed Project Report, match government schemes, and — only if you agree — send form text (not KYC files) to an AI model for suggestions and scoring.',
    },
    {
      id: 'others',
      heading: 'Who else may see it',
      body: `Some companies handle data for us. They may use it only to run this service for the department, must keep it secure and confidential, and must delete or return it when we ask or when the contract ends. They are: (1) our database and cloud host, which stores your account and DPR data; (2) OpenAI, only when AI help is switched on, which receives form text but never Aadhaar, PAN or bank scans; (3) Cloudinary, which holds department reference documents and is used to remove older files, and does not receive your identity scans or unit photos; (4) an SMS provider, only if SMS alerts are switched on, which receives your phone number and the alert text. Your data is not used to train AI models. Some of these providers, such as OpenAI, process data on servers outside India. Identity scans and cluster photos stay privately on our own server, not on a public web link. Downloaded DPRs show Uploaded or Pending for identity files and do not attach the scan. Unit photos can appear in the DPR. Take identity originals to the bank or DIC.`,
    },
    {
      id: 'howLong',
      heading: 'How long we keep it',
      body: `A scheduled job deletes unused DPR drafts and submitted copies ${DRAFT_RETENTION_MONTHS} months after the last edit of that report (not after first save, and not because you only logged in). ${DELETION_WARNING_DAYS} days before that, we warn you in the app and, if an SMS service is switched on, on the phone number on your account. Your account is not deleted only because one report is old. If a bank, DIC or scheme process still needs a submitted report, the department can place a written hold on that one report and it is kept until the hold ends. Audit logs of each action stay ${AUDIT_RETENTION_MONTHS} months from that action, then they are erased. They stay if you delete your account, until that clock ends.`,
    },
    {
      id: 'rights',
      heading: 'Your choices',
      body: 'You can download or delete your data from Privacy and data in the header. You can turn AI off at any time. You can name a nominee. You can send a privacy request in the app (you can follow the reply there) or by email.',
    },
    {
      id: 'breach',
      heading: 'If your data is exposed',
      body: 'If personal data is exposed, lost or accessed without permission, the department will report it to the Data Protection Board of India as the DPDP Rules require and will tell the people affected: what happened, what it means for them, what we have done, and who to contact.',
    },
    {
      id: 'children',
      heading: 'If you are under 18',
      body: 'This site makes bank and scheme DPRs. The person named as the entrepreneur must be 18 or older. Ask a parent or guardian to register and create the DPR in their name.',
    },
    {
      id: 'complain',
      heading: 'Complaints',
      body: `Privacy officer: ${PRIVACY_OFFICER_NAME}, ${PRIVACY_OFFICER_ROLE}. Email ${GRIEVANCE_EMAIL}, or send a request from Privacy and data in the app. Postal address: ${DATA_FIDUCIARY_ADDRESS}. We aim to reply within ${GRIEVANCE_RESPONSE_DAYS} days, as the DPDP Rules describe for rights requests. If you are not satisfied, you may complain to the Data Protection Board of India.`,
    },
  ],
};

const TE: PrivacyNoticeCopy = {
  title: 'గోప్యతా నోటీసు',
  updated: `నోటీసు వెర్షన్ ${PRIVACY_NOTICE_VERSION}`,
  notLegal:
    'ఈ పేజీ ఉత్పత్తి నోటీసు. ఇది “మేము DPDPకి కట్టుబడి ఉన్నాము” అని న్యాయవాది సర్టిఫికేట్ కాదు.',
  sections: [
    {
      id: 'who',
      heading: 'ఎవరు బాధ్యులు',
      body: `${DATA_FIDUCIARY_NAME} ఈ సాధనం మీ డేటాను ఎందుకు, ఎలా ఉపయోగిస్తుందో నిర్ణయిస్తుంది. భారత డిజిటల్ వ్యక్తిగత డేటా రక్షణ చట్టం, 2023 ప్రకారం ఇది Data Fiduciary. చిరునామా: ${DATA_FIDUCIARY_ADDRESS}.`,
    },
    {
      id: 'what',
      heading: 'మేము ఏమి సేకరిస్తాము',
      body: 'ఖాతా వివరాలు (పేరు, ఇమెయిల్, ఫోన్, స్థానం, ఐచ్ఛిక ఉద్యమ్ నంబర్, పుట్టిన తేది). మీ యూనిట్, ఖర్చులు, పథకాల గురించి DPR సమాధానాలు. మీరు అప్‌లోడ్ చేస్తే ఆధార్, పాన్ లేదా పాస్‌బుక్ స్కాన్లు. స్కాన్ ఉందో లేదో నిల్వ చేస్తాము; ఆధార్/పాన్ నంబర్‌ను ఫీల్డ్‌గా ఉంచము.',
    },
    {
      id: 'why',
      heading: 'ఎందుకు సేకరిస్తాము',
      body: 'ఖాతా సృష్టించడానికి, DPR రాయడానికి మరియు డౌన్‌లోడ్ చేయడానికి, పథకాలు సరిపోల్చడానికి, మరియు మీరు అంగీకరిస్తే మాత్రమే — ఫారమ్ టెక్స్ట్‌ను (KYC ఫైళ్లు కాదు) AI సూచనల కోసం పంపడానికి.',
    },
    {
      id: 'others',
      heading: 'ఇంకెవరు చూడవచ్చు',
      body: `కొన్ని సంస్థలు మా తరపున డేటాను నిర్వహిస్తాయి. అవి దీన్ని శాఖ కోసం ఈ సేవ నడపడానికి మాత్రమే ఉపయోగించాలి, భద్రంగా, గోప్యంగా ఉంచాలి, మేము కోరినప్పుడు లేదా ఒప్పందం ముగిసినప్పుడు తొలగించాలి లేదా తిరిగి ఇవ్వాలి. అవి: (1) మీ ఖాతా, DPR డేటాను నిల్వ చేసే మా డేటాబేస్/క్లౌడ్ హోస్ట్; (2) AI సహాయం ఆన్ ఉన్నప్పుడు మాత్రమే OpenAI — ఫారమ్ టెక్స్ట్ పొందుతుంది, ఆధార్, పాన్, బ్యాంకు స్కాన్లు ఎప్పుడూ కాదు; (3) Cloudinary — శాఖ రిఫరెన్స్ పత్రాలు ఉంచి, పాత ఫైళ్లను తొలగించడానికి వాడతాము; మీ గుర్తింపు స్కాన్లు, యూనిట్ ఫోటోలు దానికి వెళ్లవు; (4) SMS అలర్ట్‌లు ఆన్ చేసినప్పుడు మాత్రమే SMS ప్రొవైడర్ — మీ ఫోన్ నంబర్, అలర్ట్ టెక్స్ట్ పొందుతుంది. మీ డేటాను AI మోడల్స్ శిక్షణకు ఉపయోగించము. OpenAI వంటి కొన్ని ప్రొవైడర్లు భారతదేశం వెలుపల సర్వర్లలో డేటాను ప్రాసెస్ చేస్తాయి. గుర్తింపు స్కాన్లు మరియు క్లస్టర్ ఫోటోలు మా స్వంత సర్వర్‌లో ప్రైవేట్‌గా ఉంటాయి (పబ్లిక్ వెబ్ లింక్ కాదు). డౌన్‌లోడ్ DPRలో గుర్తింపు ఫైళ్లు Uploaded లేదా Pendingగా కనిపిస్తాయి — స్కాన్ జత కాదు. యూనిట్ ఫోటోలు DPRలో కనిపించవచ్చు. గుర్తింపు అసలు పత్రాలను బ్యాంకు లేదా DICకి తీసుకెళ్లండి.`,
    },
    {
      id: 'howLong',
      heading: 'ఎంతకాలం ఉంచుతాము',
      body: `ఉపయోగించని DPR డ్రాఫ్ట్‌లు మరియు సమర్పించిన కాపీలు ఆ నివేదిక చివరి సవరణ తర్వాత ${DRAFT_RETENTION_MONTHS} నెలలకు తొలగిస్తాము (మొదటి సేవ్ కాదు, లాగిన్ మాత్రమే కాదు). అంతకు ${DELETION_WARNING_DAYS} రోజుల ముందు యాప్‌లో, SMS సేవ ఆన్‌లో ఉంటే మీ ఫోన్ నంబర్‌కు హెచ్చరిక. ఒక నివేదిక పాతదైనందున మాత్రమే ఖాతా తొలగించబడదు. బ్యాంకు, DIC లేదా పథకం ప్రక్రియకు సమర్పించిన నివేదిక ఇంకా అవసరమైతే, శాఖ ఆ ఒక్క నివేదికపై వ్రాతపూర్వక హోల్డ్ పెట్టవచ్చు; హోల్డ్ ముగిసే వరకు అది ఉంటుంది. ప్రతి ఆడిట్ చర్య ${AUDIT_RETENTION_MONTHS} నెలలు ఉండి తర్వాత తొలగుతుంది. మీరు ఖాతా తొలగించినా ఆ గడువు వరకు అవి ఉంటాయి.`,
    },
    {
      id: 'rights',
      heading: 'మీ ఎంపికలు',
      body: 'హెడర్‌లోని గోప్యత మరియు డేటా నుండి మీ డేటాను డౌన్‌లోడ్ లేదా తొలగించవచ్చు. AIని ఎప్పుడైనా ఆఫ్ చేయవచ్చు. నామినీ పేరు పెట్టవచ్చు. యాప్‌లోని ఫారమ్ ద్వారా (సమాధానం అక్కడే చూడవచ్చు) లేదా ఇమెయిల్ ద్వారా అభ్యర్థన పంపవచ్చు.',
    },
    {
      id: 'breach',
      heading: 'మీ డేటా బహిర్గతమైతే',
      body: 'వ్యక్తిగత డేటా బహిర్గతమైనా, పోయినా, అనుమతి లేకుండా యాక్సెస్ అయినా, DPDP నియమాల ప్రకారం శాఖ భారత డేటా రక్షణ బోర్డుకు తెలియజేస్తుంది మరియు ప్రభావితమైన వారికి చెబుతుంది: ఏమి జరిగింది, వారికి దాని అర్థం ఏమిటి, మేము ఏమి చేశాము, ఎవరిని సంప్రదించాలి.',
    },
    {
      id: 'children',
      heading: 'మీకు 18 ఏళ్లు లోపు ఉంటే',
      body: 'ఈ సైట్ బ్యాంకు మరియు పథకాల DPRలను తయారు చేస్తుంది. వ్యవస్థాపకునిగా పేరు పెట్టబడిన వ్యక్తి 18 లేదా అంతకంటే ఎక్కువ వయస్సు ఉండాలి. తల్లిదండ్రులు లేదా సంరక్షకుడు రిజిస్టర్ అయి తమ పేరుతో DPR సృష్టించండి.',
    },
    {
      id: 'complain',
      heading: 'ఫిర్యాదులు',
      body: `ప్రైవసీ అధికారి: ${PRIVACY_OFFICER_NAME}, ${PRIVACY_OFFICER_ROLE}. ఇమెయిల్ ${GRIEVANCE_EMAIL}, లేదా యాప్‌లోని గోప్యత మరియు డేటా నుండి అభ్యర్థన పంపండి. తపాలా చిరునామా: ${DATA_FIDUCIARY_ADDRESS}. DPDP నియమాలు చెప్పిన హక్కుల అభ్యర్థన మార్గంలో ${GRIEVANCE_RESPONSE_DAYS} రోజుల్లో సమాధానం ఇవ్వడానికి ప్రయత్నిస్తాము. సంతృప్తి చెందకపోతే భారత డేటా రక్షణ బోర్డుకు ఫిర్యాదు చేయవచ్చు.`,
    },
  ],
};

export function getPrivacyNoticeCopy(language: string): PrivacyNoticeCopy {
  return language.startsWith('te') ? TE : EN;
}

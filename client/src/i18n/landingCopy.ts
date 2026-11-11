// @ts-nocheck
import { useTranslation } from 'react-i18next';

/*
 * Homepage + accessibility-bar copy in English and Telugu.
 * Kept separate from the app-wide locale JSON so the landing page can be
 * edited on its own. Telugu text should be reviewed by a native speaker
 * before release.
 */

const en = {
  a11y: {
    region: 'Accessibility options',
    skip: 'Skip to main content',
    textSize: 'Text size',
    decrease: 'Decrease text size',
    reset: 'Default text size',
    increase: 'Increase text size',
    contrast: 'High contrast',
    language: 'Language',
  },
  nav: { home: 'MSME DPR Tool – go to top of page', signIn: 'Sign In', getStarted: 'Get Started', getStartedFree: 'Get Started Free' },
  hero: {
    pre: 'Create Professional, ',
    nowrap: 'Bank-Ready',
    accent: 'Detailed Project Reports',
    sub: 'AI-powered platform that guides entrepreneurs step-by-step to create comprehensive DPRs with extensive analytics and government scheme integration.',
  },
  benefits: {
    title: 'Why Choose Our Platform?',
    sub: ['Empowering MSMEs with cutting-edge technology ', 'to secure funding and grow their businesses'],
    items: [
      ['Save Time', 'Reduce DPR creation time from weeks to hours with AI-powered automation'],
      ['Increase Approval Rates', 'Bank-ready quality reports that meet all regulatory and financial institution requirements'],
      ['Accurate Projections', 'Data-driven financial projections and market analysis for better decision making'],
      ['Expert Guidance', 'AI-powered recommendations based on industry best practices and successful projects'],
    ],
  },
  features: {
    title: 'Comprehensive ',
    accent: 'Features',
    sub: 'Everything you need to create professional DPRs and secure funding for your business',
    items: [
      ['AI-Powered DPR Creation', 'Step-by-step guidance for creating professional, bank-ready Detailed Project Reports with intelligent automation'],
      ['Bilingual Support', 'Generate DPRs in English, Telugu, or both languages seamlessly for wider accessibility'],
      ['Bank-Ready Quality', 'Optimized for bank approval with industry-standard formatting, compliance, and comprehensive analytics'],
      ['AI Chat Assistant', 'Intelligent guidance with voice input support for effortless data entry and real-time assistance'],
      ['Financial Suggestions', 'Auto-suggests financial data, cost structures, and sector benchmarks based on industry standards'],
      ['Scheme Recommendations', 'AI-powered scheme matching from AP MSME ONE Portal with eligibility verification'],
      ['Quality Analytics', 'Comprehensive DPR quality assessment, bankability analysis, and performance metrics'],
      ['Fast Track Export', 'Export to PDF and DOCX formats with professional formatting for quick submission'],
    ],
  },
  how: {
    title: 'How It Works',
    sub: ['Simple, streamlined process ', 'to create your Detailed Project Report'],
    items: [
      ['Create Account', 'Sign up for free and set up your profile in minutes'],
      ['Build Your Project', 'Use our AI-guided builder to input your project details'],
      ['Generate & Export', 'Get your bank-ready DPR in PDF or DOCX format instantly'],
    ],
  },
  cta: {
    title: 'Ready to Create Your DPR?',
    sub: 'Join thousands of entrepreneurs who have successfully created bank-ready DPRs and secured funding with our AI-powered platform.',
  },
};

const te: typeof en = {
  a11y: {
    region: 'యాక్సెసిబిలిటీ ఎంపికలు',
    skip: 'ప్రధాన కంటెంట్‌కు వెళ్లండి',
    textSize: 'అక్షర పరిమాణం',
    decrease: 'అక్షర పరిమాణం తగ్గించండి',
    reset: 'సాధారణ అక్షర పరిమాణం',
    increase: 'అక్షర పరిమాణం పెంచండి',
    contrast: 'అధిక కాంట్రాస్ట్',
    language: 'భాష',
  },
  nav: {
    home: 'MSME DPR టూల్ – పేజీ పైభాగానికి వెళ్లండి',
    signIn: 'సైన్ ఇన్',
    getStarted: 'ప్రారంభించండి',
    getStartedFree: 'ఉచితంగా ప్రారంభించండి',
  },
  hero: {
    pre: 'ప్రొఫెషనల్, ',
    nowrap: 'బ్యాంక్-సిద్ధమైన',
    accent: 'వివరణాత్మక ప్రాజెక్ట్ నివేదికలు రూపొందించండి',
    sub: 'విస్తృత విశ్లేషణలు మరియు ప్రభుత్వ పథకాల అనుసంధానంతో సమగ్రమైన DPRలను రూపొందించడంలో పారిశ్రామికవేత్తలకు దశలవారీగా మార్గనిర్దేశం చేసే AI ఆధారిత వేదిక.',
  },
  benefits: {
    title: 'మా వేదికనే ఎందుకు ఎంచుకోవాలి?',
    sub: ['అత్యాధునిక సాంకేతికతతో MSMEలకు సాధికారత — ', 'నిధులు పొంది, వ్యాపారాన్ని విస్తరించుకునేందుకు'],
    items: [
      ['సమయం ఆదా', 'AI ఆధారిత ఆటోమేషన్‌తో DPR తయారీ సమయాన్ని వారాల నుండి గంటలకు తగ్గించండి'],
      ['ఆమోదం అవకాశాలు పెంచుకోండి', 'అన్ని నియంత్రణ మరియు ఆర్థిక సంస్థల అవసరాలకు అనుగుణమైన బ్యాంక్ స్థాయి నాణ్యత గల నివేదికలు'],
      ['ఖచ్చితమైన అంచనాలు', 'మెరుగైన నిర్ణయాల కోసం డేటా ఆధారిత ఆర్థిక అంచనాలు మరియు మార్కెట్ విశ్లేషణ'],
      ['నిపుణుల మార్గదర్శనం', 'పరిశ్రమలోని ఉత్తమ పద్ధతులు మరియు విజయవంతమైన ప్రాజెక్టుల ఆధారంగా AI సిఫార్సులు'],
    ],
  },
  features: {
    title: 'సమగ్ర ',
    accent: 'ఫీచర్లు',
    sub: 'ప్రొఫెషనల్ DPRలను రూపొందించి, మీ వ్యాపారానికి నిధులు పొందేందుకు కావలసినవన్నీ',
    items: [
      ['AI ఆధారిత DPR తయారీ', 'తెలివైన ఆటోమేషన్‌తో ప్రొఫెషనల్, బ్యాంక్‌కు సిద్ధమైన వివరణాత్మక ప్రాజెక్ట్ నివేదికలను రూపొందించేందుకు దశలవారీ మార్గదర్శనం'],
      ['ద్విభాషా సౌలభ్యం', 'విస్తృత ప్రాప్యత కోసం DPRలను ఇంగ్లీష్, తెలుగు లేదా రెండు భాషల్లోనూ సులభంగా రూపొందించండి'],
      ['బ్యాంక్ స్థాయి నాణ్యత', 'పరిశ్రమ ప్రమాణాల ఫార్మాటింగ్, నిబంధనల పాటింపు మరియు సమగ్ర విశ్లేషణలతో బ్యాంక్ ఆమోదానికి అనుగుణంగా తీర్చిదిద్దబడింది'],
      ['AI చాట్ సహాయకుడు', 'సులభంగా వివరాలు నమోదు చేయడానికి వాయిస్ ఇన్‌పుట్ సౌకర్యంతో తెలివైన మార్గదర్శనం, తక్షణ సహాయం'],
      ['ఆర్థిక సూచనలు', 'పరిశ్రమ ప్రమాణాల ఆధారంగా ఆర్థిక వివరాలు, వ్యయ నిర్మాణాలు మరియు రంగాల బెంచ్‌మార్క్‌లను స్వయంచాలకంగా సూచిస్తుంది'],
      ['పథకాల సిఫార్సులు', 'అర్హత పరిశీలనతో AP MSME ONE పోర్టల్ నుండి AI ఆధారిత పథకాల సరిపోలిక'],
      ['నాణ్యత విశ్లేషణ', 'సమగ్ర DPR నాణ్యత మదింపు, బ్యాంకబిలిటీ విశ్లేషణ మరియు పనితీరు కొలమానాలు'],
      ['వేగవంతమైన ఎగుమతి', 'త్వరితంగా సమర్పించేందుకు ప్రొఫెషనల్ ఫార్మాటింగ్‌తో PDF మరియు DOCX ఫార్మాట్లలో ఎగుమతి చేయండి'],
    ],
  },
  how: {
    title: 'ఇది ఎలా పనిచేస్తుంది',
    sub: ['మీ వివరణాత్మక ప్రాజెక్ట్ నివేదికను రూపొందించేందుకు ', 'సరళమైన, సులభమైన ప్రక్రియ'],
    items: [
      ['ఖాతా సృష్టించండి', 'ఉచితంగా సైన్ అప్ చేసి, నిమిషాల్లో మీ ప్రొఫైల్‌ను సిద్ధం చేసుకోండి'],
      ['మీ ప్రాజెక్ట్‌ను రూపొందించండి', 'మా AI మార్గదర్శక బిల్డర్‌తో మీ ప్రాజెక్ట్ వివరాలను నమోదు చేయండి'],
      ['రూపొందించి ఎగుమతి చేయండి', 'బ్యాంక్‌కు సిద్ధమైన మీ DPRను తక్షణమే PDF లేదా DOCX ఫార్మాట్‌లో పొందండి'],
    ],
  },
  cta: {
    title: 'మీ DPRను రూపొందించేందుకు సిద్ధమా?',
    sub: 'మా AI ఆధారిత వేదికతో బ్యాంక్‌కు సిద్ధమైన DPRలను విజయవంతంగా రూపొందించి, నిధులు పొందిన వేలాది మంది పారిశ్రామికవేత్తలతో చేరండి.',
  },
};

const LANDING_COPY = { en, te };

/** Returns the copy for the current UI language and a setter. */
export const useLandingCopy = () => {
  const { i18n } = useTranslation();
  const lang: 'en' | 'te' = (i18n.language || 'en').startsWith('te') ? 'te' : 'en';
  return { c: LANDING_COPY[lang], lang, setLang: (l: 'en' | 'te') => i18n.changeLanguage(l) };
};

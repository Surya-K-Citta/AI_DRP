export type Activity =
  | 'mfg'
  | 'knowledge'
  | 'food'
  | 'craft'
  | 'service'
  | 'trade'
  | 'vending'
  | 'crop'
  | 'mixed'
  | 'notSure'
  | 'notBusiness';

export type Stage = 'greenfield' | 'brownfield' | 'idea' | 'restart' | 'notSure';

export type Budget =
  | 'under2L'
  | '2to5L'
  | '5to10L'
  | '10to20L'
  | '20to50L'
  | '50Lto1Cr'
  | '1to10Cr'
  | 'above10Cr'
  | 'none'
  | 'notSure';

export type Legal =
  | 'sole'
  | 'partnership'
  | 'company'
  | 'unregistered'
  | 'otherEntity'
  | 'notSure';

export type OwnerTag =
  | 'female'
  | 'sc'
  | 'st'
  | 'bc'
  | 'pwd'
  | 'transgender'
  | 'exServiceman'
  | 'generalMale'
  | 'notDecided'
  | 'noMajority'
  | 'notSure';

export type Domicile = 'ap' | 'other' | 'notSure' | 'planningAp';

export type LocationType = 'urban' | 'rural' | 'apiic' | 'home' | 'outsideAp' | 'notDecided';

export type RiceCard = 'yes' | 'no' | 'otherCard' | 'notSure';

export type Age = 'under18' | '18to20' | '21to50' | '51to60' | 'above60' | 'notSure';

export type Education = 'below8th' | '8thPlus' | 'notSure';

export type Udyam = 'yes' | 'willing' | 'refuse' | 'applied' | 'notSure';

export type PriorSubsidy = 'none' | 'repaid' | 'outstanding' | 'notSure';

export type GovtFamily = 'yes' | 'no' | 'notSure';

export type Market = 'offline' | 'ecommerce' | 'export' | 'both' | 'notSellingYet' | 'notSure';

export type SupportType =
  | 'loanOrSubsidy'
  | 'guarantee'
  | 'certification'
  | 'training'
  | 'marketingFair'
  | 'clusterCfc'
  | 'notSure';

export type UpgradeIntent =
  | 'expandSameLine'
  | 'techUpgrade'
  | 'secondPmegpLoan'
  | 'workingCapitalOnly'
  | 'notSure';

export type QualityGoal = 'zed' | 'lean' | 'ipr' | 'none' | 'notSure';

export type SectorFlag = 'none' | 'pharma' | 'coir' | 'handloom' | 'notSure';

export type ProcurementInterest = 'yes' | 'no' | 'notSure';

/** Tags that stand alone: choosing one clears every other owner tag. */
export const OWNER_EXCLUSIVE_TAGS: OwnerTag[] = ['notDecided', 'noMajority', 'notSure'];

/**
 * Groups where only one tag can be chosen (picking another in the group replaces it).
 * Tags in no group (woman, PwD, transgender, ex-serviceman) combine freely with anything else.
 */
export const OWNER_PICK_ONE_GROUPS: OwnerTag[][] = [['sc', 'st', 'bc', 'generalMale']];

export interface VentureMatchAnswers {
  activity?: Activity;
  stage?: Stage;
  supportType?: SupportType;
  upgradeIntent?: UpgradeIntent;
  qualityGoal?: QualityGoal;
  sectorFlag?: SectorFlag;
  budget?: Budget;
  legal?: Legal;
  owner?: OwnerTag[];
  procurementInterest?: ProcurementInterest;
  domicile?: Domicile;
  location?: LocationType;
  riceCard?: RiceCard;
  age?: Age;
  education?: Education;
  udyam?: Udyam;
  priorSubsidy?: PriorSubsidy;
  govtFamily?: GovtFamily;
  market?: Market;
}

export type QuestionId = keyof VentureMatchAnswers;

export interface QuestionDef {
  id: QuestionId;
  multi?: boolean;
  optionIds: string[];
  /** If set, question is shown only when this returns true for current answers. */
  when?: (answers: VentureMatchAnswers) => boolean;
}

export type SchemeKind = 'loan' | 'subsidy' | 'guarantee' | 'support';

/** How Create New Latest DPR / navigation should treat a match. */
export type SchemeDprRoute = 'full' | 'short' | 'cluster' | 'cta' | 'none';

export type CriterionStatus = 'pass' | 'fail' | 'unknown';

export interface SchemeDef {
  code: string;
  name: string;
  kind: SchemeKind;
}

export interface CriterionDef {
  id: string;
  questionId: QuestionId;
  labelKey: string;
  test: (answers: VentureMatchAnswers) => CriterionStatus;
}

export interface SchemeRule extends SchemeDef {
  benefit: (answers: VentureMatchAnswers) => string;
  criteria: CriterionDef[];
  /** Defaults to full 18-step individual DPR when omitted. */
  dprRoute?: SchemeDprRoute;
}

export interface SchemeCriterion {
  id: string;
  questionId: QuestionId;
  labelKey: string;
  status: CriterionStatus;
}

export interface SchemeMatch {
  code: string;
  name: string;
  kind: SchemeKind;
  benefit: string;
  /** True only for AP_CMEP when domicile is AP and a booster promoter tag is present. */
  boosted?: boolean;
  dprRoute?: SchemeDprRoute;
  /** How many of this scheme's checks the person's answers pass, are still open (unanswered), and the total. */
  fit?: { passed: number; open: number; total: number };
}

export interface SchemeExclusion {
  code: string;
  name: string;
  kind: SchemeKind;
  criteria: SchemeCriterion[];
}

export interface EvaluateResult {
  matches: SchemeMatch[];
  excluded: SchemeExclusion[];
  showOwnershipHint: boolean;
}

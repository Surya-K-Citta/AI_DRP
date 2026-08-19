export type Activity =
  | 'mfg'
  | 'food'
  | 'craft'
  | 'service'
  | 'trade'
  | 'vending'
  | 'crop';

export type Stage = 'greenfield' | 'brownfield';

export type Budget =
  | 'under2L'
  | '2to5L'
  | '5to10L'
  | '10to20L'
  | '20to50L'
  | '50Lto1Cr'
  | '1to10Cr'
  | 'above10Cr';

export type Legal = 'sole' | 'partnership' | 'company';

export type OwnerTag = 'female' | 'sc' | 'st' | 'bc' | 'pwd' | 'generalMale';

export type Domicile = 'ap' | 'other';

export type LocationType = 'urban' | 'rural' | 'apiic';

export type YesNo = 'yes' | 'no';

export type Age = 'under18' | '18to20' | '21to50' | '51to60' | 'above60';

export type Education = 'below8th' | '8thPlus';

export type Udyam = 'yes' | 'willing' | 'refuse';

export type PriorSubsidy = 'none' | 'repaid' | 'outstanding';

export type Market = 'offline' | 'ecommerce' | 'export';

export interface VentureMatchAnswers {
  activity?: Activity;
  stage?: Stage;
  budget?: Budget;
  legal?: Legal;
  owner?: OwnerTag[];
  domicile?: Domicile;
  location?: LocationType;
  riceCard?: YesNo;
  age?: Age;
  education?: Education;
  udyam?: Udyam;
  priorSubsidy?: PriorSubsidy;
  govtFamily?: YesNo;
  market?: Market;
}

export type QuestionId = keyof VentureMatchAnswers;

export interface QuestionDef {
  id: QuestionId;
  multi?: boolean;
  optionIds: string[];
}

export type SchemeKind = 'loan' | 'subsidy' | 'guarantee' | 'support';

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

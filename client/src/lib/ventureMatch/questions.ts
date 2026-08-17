import { QuestionDef } from './types';

export const QUESTIONS: QuestionDef[] = [
  {
    id: 'activity',
    optionIds: ['mfg', 'food', 'craft', 'service', 'trade', 'vending', 'crop'],
  },
  {
    id: 'stage',
    optionIds: ['greenfield', 'brownfield'],
  },
  {
    id: 'budget',
    optionIds: [
      'under2L',
      '2to5L',
      '5to10L',
      '10to20L',
      '20to50L',
      '50Lto1Cr',
      '1to10Cr',
      'above10Cr',
    ],
  },
  {
    id: 'legal',
    optionIds: ['sole', 'partnership', 'company'],
  },
  {
    id: 'owner',
    multi: true,
    optionIds: ['female', 'sc', 'st', 'bc', 'pwd', 'generalMale'],
  },
  {
    id: 'domicile',
    optionIds: ['ap', 'other'],
  },
  {
    id: 'location',
    optionIds: ['urban', 'rural', 'apiic'],
  },
  {
    id: 'riceCard',
    optionIds: ['yes', 'no'],
  },
  {
    id: 'age',
    optionIds: ['under18', '18to20', '21to50', '51to60', 'above60'],
  },
  {
    id: 'education',
    optionIds: ['below8th', '8thPlus'],
  },
  {
    id: 'udyam',
    optionIds: ['yes', 'willing', 'refuse'],
  },
  {
    id: 'priorSubsidy',
    optionIds: ['none', 'repaid', 'outstanding'],
  },
  {
    id: 'govtFamily',
    optionIds: ['yes', 'no'],
  },
  {
    id: 'market',
    optionIds: ['offline', 'ecommerce', 'export'],
  },
];

export const STORAGE_KEY = 'venture-match-progress';
export const HANDOFF_KEY = 'venture-match-handoff';

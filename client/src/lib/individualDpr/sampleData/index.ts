import type { SampleData } from './types';

/** One lazily loaded file per scheme. Empty code = the plain bank term-loan form. */
const LOADERS: Record<string, () => Promise<{ default: SampleData }>> = {
  VANILLA: () => import('./VANILLA'),
  PMEGP: () => import('./PMEGP'),
  PMEGP_2ND: () => import('./PMEGP_2ND'),
  MUDRA: () => import('./MUDRA'),
  STANDUP: () => import('./STANDUP'),
  SVANIDHI: () => import('./SVANIDHI'),
  VISHWAKARMA: () => import('./VISHWAKARMA'),
  CGTMSE: () => import('./CGTMSE'),
  PMFME: () => import('./PMFME'),
  SCLCSS: () => import('./SCLCSS'),
  AP_TECH_UPGRADE: () => import('./AP_TECH_UPGRADE'),
  AP_EDP: () => import('./AP_EDP'),
  ECLGS: () => import('./ECLGS'),
  AP_FPP: () => import('./AP_FPP'),
  AP_CMEP: () => import('./AP_CMEP'),
  AP_PARKS: () => import('./AP_PARKS'),
  OBMMS: () => import('./OBMMS'),
  MSE_SPICE: () => import('./MSE_SPICE'),
  EPM_NIRYAT: () => import('./EPM_NIRYAT'),
  RAMP_TEAM: () => import('./RAMP_TEAM'),
  ASPIRE: () => import('./ASPIRE'),
  NHDP: () => import('./NHDP'),
  CVY: () => import('./CVY'),
  MSE_GIFT: () => import('./MSE_GIFT'),
  PTUAS: () => import('./PTUAS'),
  PMPDS: () => import('./PMPDS'),
  ZED: () => import('./ZED'),
  LEAN: () => import('./LEAN'),
  MSME_IPR: () => import('./MSME_IPR'),
  PMS: () => import('./PMS'),
  SCST_HUB: () => import('./SCST_HUB'),
};


export async function loadSampleData(schemeCode: string | null | undefined): Promise<SampleData | null> {
  const load = LOADERS[schemeCode || 'VANILLA'];
  if (!load) return null;
  return (await load()).default;
}

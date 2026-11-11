export const PRIVACY_NOTICE_VERSION = '2026-10-1';

/** Legal name and address as supplied by the department (DPDP_Doc.md, Oct 2026). */
export const DATA_FIDUCIARY_NAME = 'AP MSME Development Corporation';
export const DATA_FIDUCIARY_ADDRESS =
  'AP MSME Development Corporation, 2nd Floor, PVS Landmark, Mangalagiri, Guntur District – 522503';

/** Mailbox the department confirmed is monitored. Override per deployment with GRIEVANCE_EMAIL. */
export const GRIEVANCE_EMAIL = (process.env.GRIEVANCE_EMAIL || 'apmsmedc@gmail.com').trim();

/** Person who answers privacy requests and complaints. */
export const PRIVACY_OFFICER_NAME = 'A Sudhakar';
export const PRIVACY_OFFICER_ROLE = 'Executive Director, AP MSME Development Corporation';

/** Rights requests and complaints are answered within this many days (DPDP Rules). */
export const GRIEVANCE_RESPONSE_DAYS = 90;

/** The Board must get a detailed report within this many hours of a breach being declared. */
export const BREACH_BOARD_REPORT_HOURS = 72;

export const DRAFT_RETENTION_MONTHS = 12;
export const AUDIT_RETENTION_MONTHS = 24;
export const DELETION_WARNING_DAYS = 15;

export const UNDER_18_CODE = 'UNDER_18';

export const AI_CONSENT_CODE = 'AI_CONSENT_REQUIRED';

export const GUARDIAN_MESSAGE =
  'This site makes bank and scheme DPRs. The person named as the entrepreneur must be 18 or older. Ask a parent or guardian to register and create the DPR in their name.';

export const AI_REFUSED_MESSAGE =
  'AI features are off for your account. Fill with AI, model-based quality scoring, chat help, and similar AI tools will not run. You can still fill the DPR yourself, save, and download.';

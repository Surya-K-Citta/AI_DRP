import { UserNotification } from '../models/UserNotification.model';

export type NotifyKind = 'retention_warning' | 'complaint_update' | 'breach_notice';

export type NotifyInput = {
  userId: string;
  kind: NotifyKind;
  title: string;
  body: string;
  phone?: string;
  email?: string;
  targetType?: string;
  targetId?: string;
};

function twilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM
  );
}

/**
 * Real SMS when TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM are set.
 * Until then this only logs. Do not add a Twilio SDK until those keys exist.
 */
async function sendSms(to: string, body: string): Promise<'mocked' | 'sent' | 'failed'> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) {
    console.info(`[sms:mock] to=${to} body=${body}`);
    return 'mocked';
  }
  try {
    const params = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twilio ${res.status}: ${text.slice(0, 200)}`);
    }
    console.info(`[sms:sent] to=${to}`);
    return 'sent';
  } catch (error) {
    console.error('[sms] failed:', (error as Error).message);
    return 'failed';
  }
}

async function sendEmail(to: string, subject: string, body: string): Promise<'mocked' | 'sent'> {
  // SMTP is Stage 4. Same plug as SMS: log until a real mailer exists.
  console.info(`[email:mock] to=${to} subject=${subject} body=${body}`);
  return 'mocked';
}

export const NotifyService = {
  twilioReady: twilioConfigured,

  /** One email without an in-app row (used to tell the department mailbox). Mocked until a mailer exists. */
  sendMail: sendEmail,

  async notify(input: NotifyInput): Promise<void> {
    const phone = (input.phone || '').trim();
    const email = (input.email || '').trim();

    let smsStatus: 'mocked' | 'sent' | 'skipped' | 'failed' = 'skipped';
    if (phone) {
      smsStatus = await sendSms(phone, input.body);
    } else {
      console.info(`[sms:skip] user=${input.userId} no phoneNumber on account`);
    }

    let emailStatus: 'mocked' | 'sent' | 'skipped' | 'failed' = 'skipped';
    if (email) {
      emailStatus = await sendEmail(email, input.title, input.body);
    }

    await UserNotification.create({
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      targetType: input.targetType,
      targetId: input.targetId,
      channels: {
        inApp: true,
        sms: smsStatus === 'sent' || smsStatus === 'mocked',
        email: emailStatus === 'sent' || emailStatus === 'mocked',
      },
      smsStatus,
      emailStatus,
    });
  },
};

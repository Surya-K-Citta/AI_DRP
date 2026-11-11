import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { PRIVACY_NOTICE_VERSION } from '@/lib/privacy/constants';

type Info = { name: string; email: string; role: string; reviewDistrict: string | null };

/** The page an invited person lands on from the link an admin shared: they choose a password and accept the privacy notice. */
export const AcceptInvite: React.FC = () => {
  const tf = useClusterFormText();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [info, setInfo] = useState<Info | null>(null);
  const [state, setState] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [form, setForm] = useState({ password: '', confirm: '', phoneNumber: '', dateOfBirth: '', consent: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    api
      .getInvite(token)
      .then((res) => {
        if (!live) return;
        setInfo(res.data);
        setState('ready');
      })
      .catch(() => live && setState('invalid'));
    return () => {
      live = false;
    };
  }, [token]);

  const roleLabel = (role: string) => tf(role === 'officer' ? 'District Reviewer' : role === 'admin' ? 'APMSMEDC Admin' : 'Entrepreneur');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.password.length < 8) return setError(tf('Choose a password of at least 8 characters.'));
    if (form.password !== form.confirm) return setError(tf('The two passwords are not the same.'));
    if (!/^\d{10}$/.test(form.phoneNumber)) return setError(tf('Phone number must be exactly 10 digits.'));
    if (!form.dateOfBirth) return setError(tf('Date of birth is required.'));
    if (!form.consent) return setError(tf('You must agree to the privacy notice to create an account.'));
    setBusy(true);
    try {
      const res = await api.acceptInvite({
        token,
        password: form.password,
        phoneNumber: form.phoneNumber,
        dateOfBirth: form.dateOfBirth,
        accountConsent: true,
        noticeVersion: PRIVACY_NOTICE_VERSION,
      });
      login(res.data, res.data.token);
      toast.success(tf('Your account is ready.'));
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || tf('Could not finish setting up the account'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-lg px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle as="h1">{tf('Set up your account')}</CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'checking' ? <p className="text-sm text-muted-foreground">{tf('Checking your invitation...')}</p> : null}
            {state === 'invalid' ? (
              <p role="alert" className="text-sm text-red-700">{tf('This invitation is not valid or has expired. Ask the APMSMEDC Admin for a new one.')}</p>
            ) : null}
            {state === 'ready' && info ? (
              <form onSubmit={submit} className="space-y-4" data-accept-invite>
                <div className="rounded-md bg-muted/50 p-3 text-sm">
                  <p className="font-medium">{info.name}</p>
                  <p className="text-muted-foreground">{info.email}</p>
                  <p>
                    {roleLabel(info.role)}
                    {info.reviewDistrict ? ` · ${tf(info.reviewDistrict)}` : ''}
                  </p>
                </div>
                <Input type="password" label={tf('Choose a password')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required />
                <Input type="password" label={tf('Type it again')} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} autoComplete="new-password" required />
                <Input type="tel" inputMode="numeric" label={tf('Mobile number')} value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} required />
                <Input type="date" label={tf('Date of birth')} value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                  <span>
                    {tf('I have read and agree to the')}{' '}
                    <Link to="/privacy" target="_blank" className="text-primary underline">
                      {tf('privacy notice')}
                    </Link>
                    .
                  </span>
                </label>
                {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
                <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                  {tf('Create my account')}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

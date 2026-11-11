import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { useClusterFormText } from '@/lib/clusterDprFormText';

/** Shown instead of a page the signed-in role may not open. The API answers the same request with 403. */
export const Forbidden: React.FC = () => {
  const tf = useClusterFormText();
  return (
    <Layout>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center" role="alert">
        <ShieldAlert className="mb-4 h-12 w-12 text-red-600" aria-hidden />
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">403 {tf('Forbidden')}</p>
        <h1 className="mt-2 text-2xl font-bold">{tf('You do not have access to this page')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tf('Your role does not include this area. If you need access, ask an APMSMEDC Admin.')}
        </p>
        <Link to="/dashboard" className="mt-6">
          <Button variant="primary">{tf('Go to Dashboard')}</Button>
        </Link>
      </div>
    </Layout>
  );
};

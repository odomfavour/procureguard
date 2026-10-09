'use client';
import FormBuilder from '@/components/msflib/form-builder';
import { field } from '@/components/ui/fields';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { session } from '@/lib/prototype';
import { Panel, Action } from './portal';
import { useData, btn, docs } from './common';
export function Onboarding({ role }: { role: 'buyer' | 'vendor' }) {
  const router = useRouter();
  const { db, update } = useData();
  const a = db?.accounts.find((x) => x.id === session());
  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState('');
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState('');
  const [files, setFiles] = useState<Record<string, string>>({});
  if (!a)
    return (
      <div className="p-10">
        <Link href="/login">Sign in to continue</Link>
      </div>
    );
  const steps =
    role === 'vendor'
      ? [
          'Business details',
          'Registration documents',
          'Catalogue & licences',
          'Review',
        ]
      : ['Organization details', 'Review'];
  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-10">
      <h1 className="mb-2 text-2xl font-bold">
        {role === 'vendor' ? 'Vendor' : 'Buyer'} onboarding
      </h1>
      <p className="mb-6 text-ink-soft">
        Complete your profile to start using ProcureGuard.
      </p>
      <div className="mb-6 flex gap-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 rounded-lg p-2 text-xs ${i === step ? 'bg-brand text-white' : 'bg-white'}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
      <Panel title={steps[step]}>
        {step === 0 ? (
          <FormBuilder
            elements={[
              field('business', 'Organization / registered business name'),
              field('location', 'Location'),
              ...(role === 'vendor'
                ? [field('categories', 'Business categories (comma separated)')]
                : []),
            ]}
            formData={{
              business: business || a.organization,
              location,
              categories,
            }}
            setFormData={(
              change: React.SetStateAction<Record<string, unknown>>
            ) => {
              const next =
                typeof change === 'function'
                  ? change({
                      business: business || a.organization,
                      location,
                      categories,
                    })
                  : change;
              setBusiness(String(next.business || ''));
              setLocation(String(next.location || ''));
              setCategories(String(next.categories || ''));
            }}
            onSubmit={() => {}}
          />
        ) : role === 'vendor' && step < 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(step === 1
              ? docs.slice(0, 4)
              : [
                  'Product / Service Catalogue',
                  'Industry Licence',
                  'Professional Certificate',
                ]
            ).map((d) => (
              <label
                key={d}
                className="rounded-lg border border-line p-3 text-sm"
              >
                <span className="font-medium">{d}</span>
                <input
                  className="mt-2 block w-full text-xs"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) =>
                    setFiles((p) => ({
                      ...p,
                      [d]: e.target.files?.[0]?.name || '',
                    }))
                  }
                />
                {files[d] && (
                  <span className="mt-1 block text-risk-low">{files[d]}</span>
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              <b>Organization:</b> {business || a.organization}
            </p>
            <p>
              <b>Location:</b> {location || 'Not specified'}
            </p>
            <p>
              <b>Documents:</b> {Object.values(files).filter(Boolean).length}{' '}
              selected
            </p>
            <p className="text-ink-soft">
              Uploaded filenames are stored for demo purposes; actual file
              contents are not uploaded.
            </p>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <button
            className={btn}
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
          <Action
            onClick={() => {
              if (step < steps.length - 1) {
                setStep((s) => s + 1);
                return;
              }
              update((d) => {
                const x = d.accounts.find((x) => x.id === a.id)!;
                x.organization = business || a.organization;
                x.documents = { ...x.documents, ...files };
                x.categories = categories
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean);
                x.onboarded = true;
              });
              router.push(
                role === 'buyer' ? '/dashboard' : '/vendor/dashboard'
              );
            }}
          >
            {step === steps.length - 1 ? 'Complete onboarding' : 'Continue'}
          </Action>
        </div>
      </Panel>
    </div>
  );
}

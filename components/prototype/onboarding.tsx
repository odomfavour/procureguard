'use client';
import { useToast } from '@/components/ui/toast-provider';
import FormBuilder from '@/components/msflib/form-builder';
import { field } from '@/components/ui/fields';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyOnboarding, hasCompletedOnboarding, onboardBuyer, onboardVendor, type OnboardingDetails } from '@/lib/api/onboarding';
import { useAuth } from '@msflib/react-auth';
import { PageLoader } from '@/components/ui/page-loader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  CheckCircle2,
  CircleDashed,
  FileText,
  MapPin,
  Pencil,
  Tags,
  UploadCloud,
} from 'lucide-react';
import { session } from '@/lib/prototype';
import { Panel, Action } from './portal';
import { useData, btn, docs } from './common';

const licenceDocs = [
  'Product / Service Catalogue',
  'Industry Licence',
  'Professional Certificate',
];

function ReviewSection({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-brand">{icon}</span>
          {title}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-xs uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="text-sm font-medium">
        {value || (
          <span className="font-normal text-ink-soft">Not specified</span>
        )}
      </dd>
    </div>
  );
}

export function Onboarding({ role }: { role: 'buyer' | 'vendor' }) {
  const auth = useAuth();
  const router = useRouter();
  const existing = useQuery({
    queryKey: ['procureguard', 'onboarding', auth.me?.id],
    queryFn: getMyOnboarding,
    enabled: auth.status === 'authenticated',
    retry: false,
  });
  const complete = auth.status === 'authenticated' && hasCompletedOnboarding(existing.data);
  useEffect(() => {
    if (complete) router.replace(role === 'vendor' ? '/vendor/dashboard' : '/dashboard');
  }, [complete, role, router]);
  if (complete || auth.status === 'loading' || (auth.status === 'authenticated' && existing.isPending)) return <PageLoader label="Preparing your account…" />;
  return <OnboardingForm key={`${role}-${auth.me?.id || 'demo'}`} role={role} existing={existing.data || null} loadError={existing.isError} retry={() => void existing.refetch()} />;
}

function OnboardingForm({ role, existing, loadError, retry }: { role: 'buyer' | 'vendor'; existing: OnboardingDetails | null; loadError: boolean; retry: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const notify = useToast();
  const { db, update } = useData();
  const demoAccount = db?.accounts.find((x) => x.id === session());
  const isLive = auth.status === 'authenticated';
  const a = isLive
    ? {
        id: String(auth.me?.id || ''),
        organization: String(auth.me?.data?.organization || ''),
      }
    : demoAccount;
  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState(existing?.organization_name || existing?.business_name || '');
  const [location, setLocation] = useState(existing?.location || '');
  const [categories, setCategories] = useState(Array.isArray(existing?.categories) ? existing.categories.join(', ') : '');
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState<Record<string, File>>({});
  const [gallery, setGallery] = useState<File[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [error, setErrorState] = useState('');
  function setError(value: string) {
    setErrorState(value);
    if (value) notify(value, 'error');
  }

  if (!a && auth.status === 'loading') return <PageLoader label="Preparing your account…" />;

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

  const categoryList = categories
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const allVendorDocs = [...docs.slice(0, 4), ...licenceDocs];
  const uploadedCount = Object.values(files).filter(Boolean).length;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-10">
      <h1 className="mb-1 text-2xl font-bold">
        {role === 'vendor' ? 'Vendor' : 'Buyer'} onboarding
      </h1>
      <p className="mb-6 text-ink-soft">
        Complete your profile to start using ProcureGuard.
      </p>

      {loadError && <p role="alert" className="mb-4 text-sm text-risk-high">Could not load existing onboarding details. <button type="button" className="underline" onClick={retry}>Retry</button></p>}
      {/* Stepper */}
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mb-4 text-xs text-ink-soft">
        Step {step + 1} of {steps.length}
      </p>
      <div className="mb-6 flex gap-2">
        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i)}
              className={`flex flex-1 items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${
                active
                  ? 'border-brand bg-brand text-white'
                  : done
                    ? 'border-brand/30 bg-brand/5 text-ink'
                    : 'border-line bg-white text-ink-soft hover:bg-brand/5'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  active
                    ? 'bg-white/20 text-white'
                    : done
                      ? 'bg-brand text-white'
                      : 'bg-line text-ink-soft'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden truncate sm:inline">{s}</span>
            </button>
          );
        })}
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
            {(step === 1 ? docs.slice(0, 4) : licenceDocs).map((d) => {
              const uploaded = !!files[d];
              return (
                <label
                  key={d}
                  className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed p-4 text-sm transition-colors ${
                    uploaded
                      ? 'border-risk-low bg-risk-low/5'
                      : 'border-line hover:border-brand hover:bg-brand/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{d}</span>
                    {uploaded ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-risk-low" />
                    ) : (
                      <UploadCloud className="h-5 w-5 shrink-0 text-ink-soft group-hover:text-brand" />
                    )}
                  </div>
                  {uploaded ? (
                    <span className="flex items-center gap-1.5 truncate text-xs text-risk-low">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{files[d]}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-ink-soft">
                      PDF, PNG or JPG
                    </span>
                  )}
                  <input
                    className="block w-full text-xs text-ink-soft file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand hover:file:bg-brand/20"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFiles((previous) => ({ ...previous, [d]: file?.name || '' }));
                      setUploads((previous) => {
                        const next = { ...previous };
                        if (file) next[d] = file;
                        else delete next[d];
                        return next;
                      });
                    }}
                  />
                </label>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Please confirm everything looks right before completing your
              onboarding.
            </p>

            <ReviewSection
              icon={<Building2 className="h-4 w-4" />}
              title="Organization"
              onEdit={() => setStep(0)}
            >
              <dl className="space-y-3">
                <ReviewRow label="Name" value={business || a.organization} />
                <div className="border-t border-line" />
                <ReviewRow label="Location" value={location} />
              </dl>
            </ReviewSection>

            {role === 'vendor' && (
              <>
                <ReviewSection
                  icon={<Tags className="h-4 w-4" />}
                  title="Business categories"
                  onEdit={() => setStep(0)}
                >
                  {categoryList.length ? (
                    <div className="flex flex-wrap gap-2">
                      {categoryList.map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-soft">No categories added</p>
                  )}
                </ReviewSection>

                <ReviewSection
                  icon={<FileText className="h-4 w-4" />}
                  title={`Documents (${uploadedCount}/${allVendorDocs.length})`}
                  onEdit={() => setStep(1)}
                >
                  <ul className="divide-y divide-line">
                    {allVendorDocs.map((d) => (
                      <li
                        key={d}
                        className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          {files[d] ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-risk-low" />
                          ) : (
                            <CircleDashed className="h-4 w-4 shrink-0 text-ink-soft" />
                          )}
                          <span className="truncate">{d}</span>
                        </span>
                        <span
                          className={`max-w-[45%] truncate text-xs ${
                            files[d] ? 'text-risk-low' : 'text-ink-soft'
                          }`}
                        >
                          {files[d] || 'Not uploaded'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ReviewSection>
              </>
            )}

            {!isLive && <p className="flex items-start gap-2 rounded-lg bg-brand/5 p-3 text-xs text-ink-soft">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              Uploaded filenames are stored for demo purposes; actual file
              contents are not uploaded.
            </p>}
          </div>
        )}

        {isLive && role === 'vendor' && step === 2 && (
          <label className="mt-4 block text-sm font-medium">
            Business gallery (optional)
            <input type="file" accept="image/*" multiple className="mt-2 block w-full text-sm" onChange={(event) => setGallery(Array.from(event.target.files || []))} />
            <span className="mt-1 block text-xs text-ink-soft">{gallery.length} images selected</span>
          </label>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-risk-high">{error}</p>}
        <div className="mt-6 flex justify-between border-t border-line pt-4">
          <button
            className={btn}
            disabled={step === 0 || saving}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>
          <Action
            disabled={saving}
            onClick={async () => {
              setError('');
              if (!(business || a.organization).trim() || !location.trim()) {
                setError('Enter your organization name and location.');
                return;
              }
              if (role === 'vendor' && ((business || a.organization).trim().length < 2 || (business || a.organization).trim().length > 200 || location.trim().length < 2 || location.trim().length > 300 || !categoryList.length)) {
                setError('Enter a business name (2–200 characters), location (2–300 characters), and at least one category.');
                return;
              }
              if (step < steps.length - 1) {
                setStep((s) => s + 1);
                return;
              }
              if (isLive) {
                try {
                  setSaving(true);
                  if (role === 'buyer') {
                    await onboardBuyer((business || a.organization).trim(), location.trim());
                  } else {
                    await onboardVendor({ businessName: (business || a.organization).trim(), location: location.trim(), categories: categoryList, documents: uploads, gallery });
                  }
                  await queryClient.invalidateQueries({ queryKey: ['procureguard', 'onboarding'] });
                  notify('Onboarding completed successfully.');
                  router.push(role === 'buyer' ? '/dashboard' : '/vendor/dashboard');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not save onboarding.');
                } finally {
                  setSaving(false);
                }
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
              notify('Onboarding completed successfully.');
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

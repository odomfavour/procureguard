'use client';
import { useState } from 'react';
import { useProfile } from '@msflib/react-profile';
import FormBuilder from '@/components/msflib/form-builder';
import { field, submit } from '@/components/ui/fields';
import { Section } from '@/components/ui/shared';
import { requiredText } from '@/lib/schemas/procurement';
export default function ProfilePanel({
  run,
}: {
  run: (action: () => Promise<unknown>) => void;
}) {
  const api = useProfile();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [account, setAccount] = useState('');
  const [accountName, setAccountName] = useState('');
  return (
    <Section title="Personal onboarding">
      <FormBuilder
        key={api.profile?.id || 'new'}
        elements={[
          field('first_name', 'First name'),
          field('last_name', 'Last name'),
          field('date_of_birth', 'Date of birth', 'date'),
          field('gender', 'Gender'),
          field('marital_status', 'Marital status'),
          submit(api.profile ? 'Update profile' : 'Create profile'),
        ]}
        formData={{ ...api.profile, ...data }}
        setFormData={setData}
        loadingState={api.loading.create || api.loading.update}
        onSubmit={(v: Record<string, unknown>) =>
          run(async () => {
            const payload = {
              first_name: requiredText(v.first_name, 'First name'),
              last_name: requiredText(v.last_name, 'Last name'),
              date_of_birth: requiredText(v.date_of_birth, 'Date of birth'),
              gender: requiredText(v.gender, 'Gender'),
              marital_status: requiredText(v.marital_status, 'Marital status'),
            };
            if (api.profile) await api.updateProfile(payload);
            else await api.createProfile(payload);
          })
        }
      />
      <label className="upload-card">
        Upload avatar
        <input
          type="file"
          accept="image/*"
          disabled={api.loading.uploadAvatar}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              run(async () => {
                const fd = new FormData();
                fd.append('avatar', file);
                await api.uploadAvatar(fd);
              });
          }}
        />
      </label>
      <div className="actions">
        <input
          type="number"
          min="1"
          aria-label="Account ID"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
        <button
          onClick={() =>
            run(async () => {
              const id = Number(account);
              if (!Number.isInteger(id) || id <= 0)
                throw new Error('Enter a valid account ID.');
              const profile = await api.getAccountProfile(id);
              setAccountName(`${profile.first_name} ${profile.last_name}`);
            })
          }
        >
          View account profile
        </button>
        <span>{accountName}</span>
      </div>
    </Section>
  );
}

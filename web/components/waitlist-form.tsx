'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CheckCircle2, Loader2 } from 'lucide-react';

type Role = 'sender' | 'school' | 'other';

interface FormState {
  name: string;
  email: string;
  role: Role;
  country: string;
}

const initialState: FormState = {
  name: '',
  email: '',
  role: 'sender',
  country: '',
};

export function WaitlistForm() {
  const t = useTranslations('waitlist');
  const locale = useLocale();

  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.country.trim()) {
      setError(t('errorRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t('errorEmail'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      setError(t('errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initialState);
    setSubmitted(false);
    setError(null);
  };

  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-gradient-primary py-20 text-cream-50 sm:py-24"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(at 20% 20%, rgba(251, 191, 36, 0.15) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(255, 255, 255, 0.1) 0px, transparent 50%)',
        }}
        aria-hidden
      />

      <div className="container-max relative">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cream-50/20 bg-cream-50/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider">
            {t('eyebrow')}
          </div>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t('title')}</h2>
          <p className="mt-4 text-lg text-cream-50/80">{t('subtitle')}</p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          {submitted ? (
            <div className="rounded-3xl border border-cream-50/20 bg-cream-50/5 p-8 text-center backdrop-blur-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-50 text-primary-800">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-2xl font-semibold">{t('successTitle')}</h3>
              <p className="mt-2 text-cream-50/80">{t('successBody')}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-6 text-sm font-medium text-gold-400 underline underline-offset-4 transition-colors hover:text-gold-500"
              >
                {t('successReset')}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-3xl border border-cream-50/20 bg-cream-50/5 p-6 backdrop-blur-sm sm:p-8"
              noValidate
            >
              <Field
                label={t('nameLabel')}
                required
                htmlFor="name"
              >
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('namePlaceholder')}
                  className="input"
                />
              </Field>

              <Field
                label={t('emailLabel')}
                required
                htmlFor="email"
              >
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t('emailPlaceholder')}
                  className="input"
                />
              </Field>

              <Field label={t('roleLabel')} required htmlFor="role">
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as Role })
                  }
                  className="input"
                >
                  <option value="sender">{t('roleSender')}</option>
                  <option value="school">{t('roleSchool')}</option>
                  <option value="other">{t('roleOther')}</option>
                </select>
              </Field>

              <Field
                label={t('countryLabel')}
                required
                htmlFor="country"
              >
                <input
                  id="country"
                  type="text"
                  required
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder={t('countryPlaceholder')}
                  className="input"
                />
              </Field>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-cream-50"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gold-400 px-6 py-3.5 text-sm font-semibold text-primary-900 shadow-lg transition-all hover:bg-gold-500 disabled:opacity-70"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? t('submitting') : t('submit')}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(254, 253, 251, 0.2);
          background-color: rgba(254, 253, 251, 0.05);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgb(254, 253, 251);
          transition: all 150ms;
        }
        .input::placeholder {
          color: rgba(254, 253, 251, 0.4);
        }
        .input:focus {
          outline: none;
          border-color: rgb(251, 191, 36);
          background-color: rgba(254, 253, 251, 0.1);
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2);
        }
        select.input option {
          background-color: rgb(6, 78, 59);
          color: rgb(254, 253, 251);
        }
      `}</style>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium text-cream-50/90">
        {label}
        {required && <span className="ms-1 text-gold-400">*</span>}
      </span>
      {children}
    </label>
  );
}

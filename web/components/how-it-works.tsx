import { useTranslations } from 'next-intl';
import { GraduationCap, Wallet, Building2, FileCheck } from 'lucide-react';

export function HowItWorks() {
  const t = useTranslations('how');

  const steps = [
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: t('step1.title'),
      body: t('step1.body'),
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: t('step2.title'),
      body: t('step2.body'),
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: t('step3.title'),
      body: t('step3.body'),
    },
    {
      icon: <FileCheck className="h-6 w-6" />,
      title: t('step4.title'),
      body: t('step4.body'),
    },
  ];

  return (
    <section id="how" className="py-20 sm:py-24">
      <div className="container-max">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow">{t('eyebrow')}</div>
          <h2 className="heading-2 mt-3">{t('title')}</h2>
          <p className="mt-4 lede">{t('subtitle')}</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="group relative rounded-3xl border border-primary-100 bg-white/70 p-6 transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-800 text-cream-50">
                  {step.icon}
                </div>
                <span className="text-3xl font-bold text-primary-100 group-hover:text-primary-200">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="heading-3">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

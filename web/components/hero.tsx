import { useTranslations } from 'next-intl';
import { ArrowRight, ShieldCheck, Sparkles, Zap } from 'lucide-react';

export function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="hero-bg relative overflow-hidden">
      <div className="container-max py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-fade-in">
            <div className="eyebrow">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-500" />
              {t('eyebrow')}
            </div>
          </div>

          <h1 className="animate-slide-up heading-1 mt-6">
            {t('titleLine1')}{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary-800">
                {t('titleAccent')}
              </span>
              <span
                className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-gold-400/40 sm:bottom-2 sm:h-4"
                aria-hidden
              />
            </span>{' '}
            {t('titleLine2')}
          </h1>

          <p className="animate-slide-up mx-auto mt-6 max-w-2xl lede">
            {t('subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a href="#waitlist" className="btn-primary group w-full sm:w-auto">
              {t('ctaPrimary')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </a>
            <a href="#how" className="btn-secondary w-full sm:w-auto">
              {t('ctaSecondary')}
            </a>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TrustPoint
              icon={<ShieldCheck className="h-5 w-5" />}
              label={t('trustPoints.one')}
            />
            <TrustPoint
              icon={<Sparkles className="h-5 w-5" />}
              label={t('trustPoints.two')}
            />
            <TrustPoint
              icon={<Zap className="h-5 w-5" />}
              label={t('trustPoints.three')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustPoint({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
      <span className="text-primary-700">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

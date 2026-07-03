import { useTranslations } from 'next-intl';
import {
  Lock,
  ScrollText,
  Building,
  Coins,
  HeartHandshake,
  Timer,
} from 'lucide-react';

export function Features() {
  const t = useTranslations('features');

  const features = [
    { icon: <Lock className="h-6 w-6" />, key: 'one' as const },
    { icon: <ScrollText className="h-6 w-6" />, key: 'two' as const },
    { icon: <Building className="h-6 w-6" />, key: 'three' as const },
    { icon: <Coins className="h-6 w-6" />, key: 'four' as const },
    { icon: <HeartHandshake className="h-6 w-6" />, key: 'five' as const },
    { icon: <Timer className="h-6 w-6" />, key: 'six' as const },
  ];

  return (
    <section id="features" className="bg-white/50 py-20 sm:py-24">
      <div className="container-max">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow">{t('eyebrow')}</div>
          <h2 className="heading-2 mt-3">{t('title')}</h2>
          <p className="mt-4 lede">{t('subtitle')}</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="group rounded-3xl border border-primary-100 bg-cream-50 p-6 transition-all hover:border-primary-200 hover:shadow-lg hover:shadow-primary-900/5"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-800 transition-colors group-hover:bg-primary-800 group-hover:text-cream-50">
                {feature.icon}
              </div>
              <h3 className="heading-3">{t(`${feature.key}.title`)}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {t(`${feature.key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

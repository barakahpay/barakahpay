'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/navigation';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const otherLocale = locale === 'en' ? 'ur' : 'en';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary-100 bg-cream-50/80 backdrop-blur-md">
      <div className="container-max flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-primary-900"
        >
          <span
            className="grid h-9 w-9 place-items-center rounded-full bg-primary-800 text-cream-50"
            aria-hidden
          >
            B
          </span>
          <span>BarakahPay</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#how"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-primary-800"
          >
            {t('howItWorks')}
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-slate-700 transition-colors hover:text-primary-800"
          >
            {t('features')}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={pathname}
            locale={otherLocale}
            className="rounded-full border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-800 transition-colors hover:bg-primary-50"
          >
            {t('language')}
          </Link>
          <a href="#waitlist" className="btn-primary hidden sm:inline-flex">
            {t('waitlist')}
          </a>
        </div>
      </div>
    </header>
  );
}

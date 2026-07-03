import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  const contractId = process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ID || '';
  const stellarExpertUrl = contractId
    ? `https://stellar.expert/explorer/testnet/contract/${contractId}`
    : 'https://stellar.expert';

  return (
    <footer className="border-t border-primary-100 bg-cream-50 py-16">
      <div className="container-max">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link
              href={`/${locale}`}
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
            <p className="mt-3 max-w-xs text-sm text-slate-600">{t('tagline')}</p>
          </div>

          <FooterColumn title={t('product')}>
            <FooterLink href="#how">{t('productHow')}</FooterLink>
            <FooterLink href="#features">{t('productFeatures')}</FooterLink>
            <FooterLink href="#waitlist">{t('productWaitlist')}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t('resources')}>
            <FooterLink
              href="https://github.com/barakahpay/barakahpay"
              external
            >
              {t('resourcesGithub')}
            </FooterLink>
            <FooterLink
              href="https://github.com/barakahpay/barakahpay/blob/main/BUSINESS_PLAN.md"
              external
            >
              {t('resourcesBusinessPlan')}
            </FooterLink>
            <FooterLink
              href="https://github.com/barakahpay/barakahpay/blob/main/docs/roadmap.md"
              external
            >
              {t('resourcesRoadmap')}
            </FooterLink>
            <FooterLink href={stellarExpertUrl} external>
              {t('resourcesContract')}
            </FooterLink>
          </FooterColumn>

          <FooterColumn title={t('ecosystem')}>
            <FooterLink href="https://stellar.org" external>
              {t('ecosystemStellar')}
            </FooterLink>
            <FooterLink href="https://soroban.stellar.org" external>
              {t('ecosystemSoroban')}
            </FooterLink>
            <FooterLink href="https://communityfund.stellar.org" external>
              {t('ecosystemSCF')}
            </FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-primary-100 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} BarakahPay. {t('rights')}</p>
          <p>{t('openSource')}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary-900">
        {title}
      </h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="text-sm text-slate-600 transition-colors hover:text-primary-800"
      >
        {children}
      </a>
    </li>
  );
}

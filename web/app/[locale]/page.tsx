import { unstable_setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { HowItWorks } from '@/components/how-it-works';
import { Features } from '@/components/features';
import { WaitlistForm } from '@/components/waitlist-form';
import { Footer } from '@/components/footer';

export default function Home({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <WaitlistForm />
      </main>
      <Footer />
    </>
  );
}

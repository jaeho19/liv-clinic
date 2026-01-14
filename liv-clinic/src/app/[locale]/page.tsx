import {
  Hero,
  Equipment,
  Signature,
  CoreValues,
  Doctor,
  InstagramFeed,
  BeforeAfterShowcase,
  Location,
  FloatingConsultation,
} from '@/components/sections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Equipment />
      <Signature />
      <CoreValues />
      <Doctor />
      <InstagramFeed />
      <BeforeAfterShowcase />
      <Location />
      <FloatingConsultation />
    </>
  );
}

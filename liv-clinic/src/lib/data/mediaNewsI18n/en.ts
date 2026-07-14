/**
 * English overrides for Media & News (base: src/lib/data/mediaNewsData.ts).
 *
 * Outlet names use each publication's own Latin rendering so the source stays
 * identifiable: 하이뉴스 → Hi News · 메디컬 에스테틱 → Medical Aesthetic ·
 * 이슈메이커 → Issuemaker · 헤모필리아 라이프 → Hemophilia Life ·
 * 메디컬투데이 → Medical Today · SBS 좋은아침 → SBS Good Morning.
 * `badge` values are already Latin in the base, so they are not overridden here.
 */
import type { MediaNewsLocaleMap } from './types';

export const EN: MediaNewsLocaleMap = {
  // ── mediaNewsData ──
  '17': {
    source: 'LIV News',
    title:
      'Dr. Kim Sooyoung, Medical Director — invited speaker at AXA (Aptos Expert Alliance), the global lifting experts conference',
    description:
      'Dr. Kim Sooyoung, Medical Director of LIV Plastic Surgery, was invited to AXA (Aptos Expert Alliance), an expert conference hosted by the global thread-lifting brand APTOS, and successfully completed the presentation.',
    body: [
      'Hello, this is LIV Plastic Surgery.',
      'On 20 June 2026, Dr. Kim Sooyoung, Medical Director of LIV Plastic Surgery, was invited to AXA (Aptos Expert Alliance), an expert conference hosted by the global thread-lifting brand APTOS, and successfully completed the presentation.',
      'AXA (Aptos Expert Alliance) is an international academic forum where APTOS masters and experts from around the world share their latest clinical experience and procedural know-how — an established academic event for exchanging current insights and a wide range of clinical cases in the global lifting field.',
      'Dr. Kim Sooyoung holds APTOS International Trainer certification. In this presentation, Dr. Kim shared a variety of clinical cases and thread-lifting know-how from LIV Plastic Surgery, and took part in a meaningful academic exchange with the physicians in attendance.',
      'LIV Plastic Surgery will continue its academic exchange with physicians in Korea and abroad, and will do its utmost to provide safer and more precise premium anti-aging care, grounded in ongoing research and clinical experience.',
      'Thank you.',
    ],
  },
  '16': {
    source: 'Medical Aesthetic',
    title: 'Dr. Kim Sooyoung, Medical Director — clinical interview on APTOS Bio-Lifting',
    description:
      'Dr. Kim Sooyoung, Medical Director of LIV Plastic Surgery, took part in an APTOS Bio-Lifting interview with the aesthetic medicine magazine “Medical Aesthetic”. The article looks at how physicians in Korea certified as official APTOS trainers apply APTOS in actual clinical practice. Dr. Kim spoke about precise lifting design that accounts for facial structure and tissue condition, natural-looking change, and the importance of a patient-specific Bio-Lifting approach.',
    body: [
      'Dr. Kim Sooyoung, Medical Director of LIV Plastic Surgery, took part in the article “How APTOS Bio-Lifting is being applied in Korean clinical practice” in the aesthetic medicine magazine “Medical Aesthetic”.',
      'The article covers how the global thread-lifting brand APTOS is expanding its academic activity in the Korean market around its official trainers, and presents APTOS not simply as a thread-lifting product that pulls sagging tissue, but as a Bio-Lifting platform that calls for a precise vector design tailored to facial structure and tissue condition.',
      'As an official APTOS trainer, Dr. Kim Sooyoung emphasised the structure and indications of each product, design according to tissue condition, and the importance of the treatment plane and fixation points. In particular, APTOS Bio-Lifting goes beyond purely physical lifting: it is an approach that designs tissue support and lifting vectors for the areas that need them, taking each patient’s pattern of ageing and facial structure into account — which is where it meets LIV Plastic Surgery’s Slow Aging philosophy.',
      'LIV Plastic Surgery aims for natural, refined improvement rather than dramatic change. In the interview, Dr. Kim Sooyoung explained that patients in Korea have recently come to value a clean facial contour, stable improvement of the mid- and lower face, and a natural recovery process over overcorrection or unnatural results. This is in line with the restrained anti-aging, precise lifting and individually tailored care that LIV Plastic Surgery pursues.',
      'The article also presented APTOS as a treatment that can be used not only on its own, but in combination with energy-based devices, skin boosters, fillers and botulinum toxin, depending on the patient’s condition — skin elasticity, volume loss, changes in the facial contour and so on. LIV Plastic Surgery continues to take an integrated anti-aging approach centred on structural support of the face and vector correction, while also considering skin texture, volume and control of the mimetic muscles.',
      'This interview illustrates how Dr. Kim Sooyoung, as an official APTOS trainer, continues to expand academic training and clinical experience in order to offer patients in Korea and abroad lifting procedures that are safer and more reproducible.',
    ],
  },
  '15': {
    source: 'Medical Aesthetic',
    title: 'Dr. Kim Sooyoung, Medical Director — interview with “Medical Aesthetic”',
    description:
      'Dr. Kim Sooyoung, Medical Director, gave an official interview to “Medical Aesthetic”, a magazine specialising in aesthetic surgery and medical devices, sharing medical insight into LIV’s Slow Aging philosophy, the global lifting brand APTOS, and a site-specific algorithm.',
    body: [
      'Hello, this is LIV Plastic Surgery.',
      'Dr. Kim Sooyoung, Medical Director of LIV Plastic Surgery, recently gave an official interview and photo shoot with “Medical Aesthetic”, a respected publication in the field of aesthetic surgery and medical devices.',
      'In this interview, which spotlights physicians leading trends in the aesthetic surgery market in Korea and abroad, Dr. Kim Sooyoung shared the “Slow Aging” philosophy that LIV Plastic Surgery pursues, along with in-depth medical insight into procedures with APTOS, the global lifting brand currently drawing the most attention in the medical field.',
      'As a holder of APTOS International Trainer certification, Dr. Kim explained in depth the synergy that arises when the distinctive technology of APTOS meets LIV Plastic Surgery’s anatomical, layer-by-layer approach — the “site-specific algorithm”. LIV’s advanced thread-lifting know-how, which repositions sagging tissue with anatomical accuracy rather than pulling it artificially, in order to bring out the face’s own dimensionality and elegance, drew great interest from the reporting team on site.',
      'LIV Plastic Surgery is a clinic that global brands and aesthetic medicine specialists look to with confidence. Building on precise techniques recognised at an international level and on continuous academic research, LIV will keep setting a safe and distinctive standard for premium anti-aging care for everyone who comes to us, from Korea and beyond.',
      'The full interview will be shared again once the official article is published.',
      'Thank you.',
    ],
  },
  '1': {
    source: 'Hi News',
    title: 'Certified as an official APTOS trainer',
    description:
      'Dr. Kim Sooyoung, Medical Director of LIV Plastic Surgery, earned International Trainer certification from APTOS, the global thread-lifting brand — recognition of expertise in lifting procedures built on clinical experience and procedural proficiency.',
  },
  '2': {
    title: 'Appearance on SBS Good Morning',
    description:
      'Shared expert views on anti-aging care, focusing on skin elasticity, lifestyle-related ageing and collagen regeneration.',
  },
  '3': {
    source: 'Issuemaker',
    title: 'Coverage of the APTOS International Program',
    description:
      'Introduced as a Korean representative physician invited by APTOS headquarters, taking part in an international program related to lifting procedures.',
  },
  '4': {
    source: 'Issuemaker',
    title: 'Issuemaker cover story',
    description:
      'LIV Plastic Surgery’s brand direction and clinical philosophy were featured, covering its slow-aging philosophy, regenerative procedures and the expansion at Sinsa Station.',
  },
  '5': {
    source: 'Hemophilia Life',
    title: 'Interview on the introduction of Ultherapy-Prime',
    description:
      'Introduced LIV Plastic Surgery’s approach to Ultherapy-Prime and precise SMAS-targeted lifting.',
  },
  '6': {
    source: 'Medical Today',
    title: 'Introducing the GRIDA medical tone-matching system',
    description:
      'A procedure for the natural tone reconstruction of scars and hypopigmented areas, using 52 shades and FDA-approved pigments, was introduced.',
  },
  '7': {
    source: 'LIV News',
    title:
      'Dr. Kim Sooyoung, Medical Director — invited lecture at Aesthetic Plastic Surgery Korea',
    description:
      'Dr. Kim Sooyoung, Medical Director, gave an official invited oral presentation on “Site-specific algorithm for facial rejuvenation” at Aesthetic Plastic Surgery Korea, held by the Korean Society for Aesthetic Plastic Surgery, introducing a precise region-by-region approach based on facial anatomy and LIV’s own procedural algorithm.',
  },
  '8': {
    source: 'LIV News',
    title: 'Official APTOS global trainer certification plaque awarded',
    description:
      'Dr. Kim Sooyoung, Medical Director, received the official trainer certification plaque from APTOS, the global thread-lifting brand. The certification became an opportunity to expand the training of physicians in Korea and abroad, as well as academic activity in the field of lifting procedures.',
  },
  '9': {
    source: 'LIV News',
    title: 'Actor Shim Hyung-tak visits LIV Plastic Surgery',
    description:
      'Actor Shim Hyung-tak visited LIV Plastic Surgery. LIV offers a comfortable care experience grounded in a Slow Aging philosophy that pursues innate health and natural beauty.',
  },
  '10': {
    source: 'LIV News',
    title: 'Singer Bae Ki-sung and show host Lee Eun-bi visit LIV Plastic Surgery',
    description:
      'Singer Bae Ki-sung and his wife, show host Lee Eun-bi, visited LIV Plastic Surgery. LIV provides tailored care oriented toward consistent maintenance and natural anti-aging.',
  },
  '11': {
    source: 'LIV News',
    title: 'Leading Chinese influencers visit LIV Plastic Surgery',
    description:
      'Well-known Chinese influencers visited LIV Plastic Surgery. Grounded in premium Korean anti-aging care and a natural Slow Aging philosophy, LIV offers a distinctive care experience for international guests as well.',
  },
  '12': {
    source: 'LIV News',
    title: 'Announcer Lee Jin-ju visits LIV Plastic Surgery',
    description:
      'Announcer Lee Jin-ju visited LIV Plastic Surgery. LIV pursues a Slow Aging care philosophy that takes innate grace and natural skin elasticity into account.',
  },
  '13': {
    source: 'Issuemaker',
    title: 'Issuemaker interview',
    description:
      'Covered the opening of the first plastic surgery clinic in Dongbu-Ichon-dong, an honest approach to care, and LIV Plastic Surgery’s direction toward natural beauty.',
  },
  '14': {
    source: 'Medical Today',
    title: 'Medical Today interview on adjusting ultrasound intensity',
    description:
      'Explained a tailored lifting approach in which energy intensity, depth and shot distribution are adjusted according to skin thickness and structure.',
  },

  // ── featuredMediaNews (home) ──
  f9: {
    title: 'Invited presentation at AXA (Aptos Expert Alliance)',
    description:
      'Dr. Kim Sooyoung, Medical Director, was invited to AXA, an expert conference hosted by the global thread-lifting brand APTOS, and presented clinical cases and thread-lifting know-how.',
  },
  f8: {
    title: 'Dr. Kim Sooyoung, Medical Director — clinical interview on APTOS Bio-Lifting',
    description:
      'Took part in the APTOS Bio-Lifting interview with the aesthetic medicine magazine “Medical Aesthetic”, covering precise lifting design that accounts for facial structure and tissue condition, and a patient-specific Bio-Lifting approach.',
  },
  f7: {
    title: 'Interview with “Medical Aesthetic”',
    description:
      'Gave an official interview to “Medical Aesthetic”, a magazine specialising in aesthetics and medical devices, highlighting the Slow Aging philosophy and APTOS global lifting procedures.',
  },
  f1: {
    title: 'Appearance on SBS Good Morning',
    description:
      'Shared expert views on skin elasticity, lifestyle-related ageing and collagen regeneration.',
  },
  f2: {
    title: 'Issuemaker cover story',
    description:
      'Introduced LIV Plastic Surgery’s direction — its slow-aging philosophy, regenerative procedures and the expansion at Sinsa Station.',
  },
  f3: {
    title: 'Certified as an official APTOS trainer',
    description:
      'Dr. Kim Sooyoung, Medical Director, earned International Trainer certification from APTOS, the global thread-lifting brand.',
  },
};

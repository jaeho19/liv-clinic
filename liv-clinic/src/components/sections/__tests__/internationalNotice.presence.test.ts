import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SECTIONS = path.resolve(__dirname, '..');
const APP = path.resolve(__dirname, '..', '..', '..', 'app', '[locale]');

// 시술 상세 17종 — 컴포넌트 파일 → InternationalNotice treatmentId
const FILES: Record<string, string> = {
  [path.join(SECTIONS, 'UltheraDetail.tsx')]: 'ulthera',
  [path.join(SECTIONS, 'ThermageDetail.tsx')]: 'thermage',
  [path.join(SECTIONS, 'OndaDetail.tsx')]: 'onda',
  [path.join(SECTIONS, 'DensityDetail.tsx')]: 'density',
  [path.join(SECTIONS, 'InModeDetail.tsx')]: 'inmode',
  [path.join(SECTIONS, 'ShurinkDetail.tsx')]: 'shurink',
  [path.join(SECTIONS, 'ThreadDetail.tsx')]: 'thread',
  [path.join(SECTIONS, 'AptosDetail.tsx')]: 'aptos',
  [path.join(SECTIONS, 'BotoxDetail.tsx')]: 'botox',
  [path.join(SECTIONS, 'FillerDetail.tsx')]: 'filler',
  [path.join(SECTIONS, 'SkinboosterDetail.tsx')]: 'skinbooster',
  // 스킨케어 상세는 별도 컴포넌트 없이 page.tsx 안에 있다
  [path.join(APP, 'antiaging', 'skincare', 'page.tsx')]: 'skincare',
  [path.join(SECTIONS, 'PigmentationDetail.tsx')]: 'pigmentation',
  [path.join(SECTIONS, 'VascularDetail.tsx')]: 'vascular',
  [path.join(SECTIONS, 'SkinToneDetail.tsx')]: 'skintone',
  [path.join(SECTIONS, 'HairRemovalDetail.tsx')]: 'hair-removal',
  [path.join(SECTIONS, 'TattooRemovalDetail.tsx')]: 'tattoo',
};

describe('InternationalNotice is mounted on every treatment detail (P1-2)', () => {
  it('covers 17 treatment pages', () => {
    expect(Object.keys(FILES)).toHaveLength(17);
  });

  for (const [file, id] of Object.entries(FILES)) {
    it(`${path.basename(path.dirname(file))}/${path.basename(file)} renders <InternationalNotice treatmentId="${id}" />`, () => {
      const src = fs.readFileSync(file, 'utf8');
      expect(src).toMatch(new RegExp(`<InternationalNotice\\s+treatmentId="${id}"`));
    });
  }
});

#!/usr/bin/env node
/**
 * 가이드 작성 근거 시트 생성: content/guides/_facts.md
 * 사이트 코드·메시지에 실제로 있는 값만 나열한다. 여기에 없는 수치는 가이드에 쓰지 않는다.
 * 실행: npx tsx scripts/dump-guide-facts.mjs   (`.ts`를 import하므로 tsx 필수)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOCALES = ['en', 'ja', 'zh', 'zh-TW'];
const msg = Object.fromEntries(
  ['ko', ...LOCALES].map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'messages', `${l}.json`), 'utf8'))]),
);
const get = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

async function main() {
  const { PRICING } = await import('../src/lib/pricing.ts');
  const { PRICING_GUIDE } = await import('../src/lib/pricingGuide.ts');
  const { TREATMENTS, MEDICAL_QA, SITE_INFO, BUSINESS_HOURS, CERTIFICATIONS, LASER_CATEGORIES } = await import('../src/lib/constants.ts');
  const { getLocalizedTreatment } = await import('../src/lib/treatmentsI18n.ts');

  const out = [];
  const h = (t) => out.push(`\n## ${t}\n`);
  const row = (cells) => out.push(`| ${cells.map((c) => String(c ?? '').replace(/\|/g, '/').replace(/\r?\n/g, ' ')).join(' | ')} |`);

  out.push('# 가이드 근거 시트 (자동 생성 — 수정하지 말고 `npx tsx scripts/dump-guide-facts.mjs`로 재생성)');
  out.push(`\n생성: ${new Date().toISOString().slice(0, 10)}. 출처는 각 표의 머리말에 있다. **여기에 없는 가격·시간·자격·비행 시점은 가이드에 쓰지 않는다.**`);

  h('1. 병원 기본 정보 (src/lib/constants.ts SITE_INFO·BUSINESS_HOURS)');
  out.push(`- 병원명: ${SITE_INFO.name} / ${SITE_INFO.nameEn} (ja LIV美容クリニック, zh·zh-TW LIV整形外科)`);
  out.push(`- 전화 ${SITE_INFO.phone} (국제 ${SITE_INFO.phoneInternational}), 이메일 ${SITE_INFO.email}`);
  out.push(`- 주소(en): ${SITE_INFO.address.en}`);
  out.push(`- 진료시간: 평일 ${BUSINESS_HOURS.weekday.open}–${BUSINESS_HOURS.weekday.close}, 토 ${BUSINESS_HOURS.saturday.open}–${BUSINESS_HOURS.saturday.close}, 일 휴무`);
  out.push('- 오시는 길(international.gettingHere, en): ' + (get(msg.en, 'international.gettingHere.routes') ?? []).map((r) => `${r.from}: ${r.detail}`).join(' / '));
  out.push(`- 주소 표기(international.gettingHere.address): ` + LOCALES.map((l) => `${l}: ${get(msg[l], 'international.gettingHere.address')}`).join(' / '));
  out.push(`- 인증(CERTIFICATIONS): ${CERTIFICATIONS.map((c) => `${c.id}: ${c.title ?? ''} ${c.description ?? ''}`.trim()).join(' | ')}`);
  out.push(`- international.why.items[1](en): "${get(msg.en, 'international.why.items.1.desc')}"`);

  h('2. 공개 가격표 /pricing (pricingGuide 네임스페이스; 1회 기준, VAT 별도)');
  for (const cat of PRICING_GUIDE) {
    out.push(`\n### ${cat.id} — ${LOCALES.map((l) => get(msg[l], `pricingGuide.categories.${cat.id}`)).join(' / ')}\n`);
    row(['rowId', ...LOCALES.map((l) => `${l} name`), 'basis(en)', 'price(en)']);
    row(['---', ...LOCALES.map(() => '---'), '---', '---']);
    for (const r of cat.rows) {
      row([r, ...LOCALES.map((l) => get(msg[l], `pricingGuide.rows.${cat.id}.${r}.name`)), get(msg.en, `pricingGuide.rows.${cat.id}.${r}.basis`), get(msg.en, `pricingGuide.rows.${cat.id}.${r}.price`)]);
    }
  }
  out.push('\n안내문(en): ' + Object.values(get(msg.en, 'pricingGuide.notes') ?? {}).join(' '));
  out.push('안내문(ko): ' + Object.values(get(msg.ko, 'pricingGuide.notes') ?? {}).join(' '));

  h('3. 시술 페이지 가격 (src/lib/pricing.ts PRICING; 원, "부터"; 라벨은 pricing.labels en)');
  row(['treatment', 'group', 'row', 'label(en)', 'price(KRW)', 'suffix']);
  row(['---', '---', '---', '---', '---', '---']);
  for (const [id, p] of Object.entries(PRICING)) {
    const labelKey = id === 'hair-removal' ? 'hairRemoval' : id;
    const labels = get(msg.en, `pricing.labels.${labelKey}`) ?? {};
    for (const g of p.groups) {
      for (const r of g.rows) row([id, `${g.groupKey}${g.subKey ? ` (${labels[g.subKey] ?? g.subKey})` : ''}`, r.rowKey, labels[r.rowKey] ?? '', r.price ?? '상담 후 결정', r.suffix ?? '']);
    }
  }
  out.push('\n접미사(en pricing.suffix): ' + JSON.stringify(get(msg.en, 'pricing.suffix')) + ' / 안내(en): ' + get(msg.en, 'pricing.note'));

  h('4. 시술 정보 — 소요 시간·마취·회복·효과 지속 (TREATMENTS + treatmentsI18n, 4개 언어)');
  for (const cat of ['lifting', 'antiaging']) {
    for (const [id, base] of Object.entries(TREATMENTS[cat])) {
      out.push(`\n### ${cat}/${id}\n`);
      row(['locale', 'name', 'duration', 'anesthesia', 'recovery', 'results']);
      row(['---', '---', '---', '---', '---', '---']);
      for (const l of ['ko', ...LOCALES]) {
        const loc = l === 'ko' ? base : getLocalizedTreatment(base, id, l);
        const name = l === 'ko' ? base.name : get(msg[l], `treatments.${cat}.${id}.name`) ?? '';
        row([l, name, loc.duration ?? '', loc.anesthesia ?? '', loc.recovery ?? '', loc.results ?? '']);
      }
      out.push('\n- 대상 부위(ko): ' + (base.targetAreas ?? []).join(', '));
      out.push('- 적합(ko idealFor): ' + (base.idealFor ?? []).join(' / '));
      out.push('- 주의(ko cautions): ' + (base.cautions ?? []).join(' / '));
      out.push('- FAQ(ko): ' + (base.faqs ?? []).map((f) => `Q ${f.q} → ${f.shortA ?? f.a}`).join(' | '));
      for (const l of LOCALES) {
        const loc = getLocalizedTreatment(base, id, l);
        if (loc.faqs?.length) out.push(`- FAQ(${l}): ` + loc.faqs.map((f) => `Q ${f.q} → ${f.shortA ?? f.a}`).join(' | '));
      }
    }
  }
  out.push('\n### laser 카테고리 (LASER_CATEGORIES; 소요 시간 등은 각 src/app/[locale]/laser/*/layout.tsx serviceData — ko)\n');
  for (const c of LASER_CATEGORIES) out.push(`- ${c.id}: ${c.nameEn} — ${c.shortDesc ?? ''} ${c.description ?? ''}`);
  out.push('- layout serviceData(ko): pigmentation 20-40분·마취 크림(선택)·3-7일(미세 딱지 가능) / vascular 15-30분 / skintone 30-45분·즉시 일상 복귀 / hair-removal 15-60분(부위에 따라)·즉시 일상 복귀 / tattoo 15-30분·마취 크림(30분)·3-7일(미세 딱지)');
  const laserKeys = ['tattoo', 'hairRemoval', 'pigmentation', 'vascular', 'skintone'];
  for (const key of laserKeys) {
    for (const l of LOCALES) {
      const faq = get(msg[l], `treatments.laser.${key}.detail.faq`);
      const name = get(msg[l], `treatments.laser.${key}.name`);
      if (Array.isArray(faq) && faq.length) {
        out.push(`- laser/${key} (${l}, ${name}) FAQ: ` + faq.map((f) => `Q ${f.q ?? f.question} → ${f.a ?? f.answer}`).join(' | '));
      }
    }
  }

  h('4b. 레이저 상세 페이지의 추가 사실 (treatments.laser.*.detail 메시지 + LASER_CATEGORIES.treatmentProtocol — 회수·간격·유형별 안내가 여기 있다)');
  const flatten = (obj, prefix, sink) => {
    if (obj == null) return;
    if (typeof obj === 'string') {
      if (obj.trim()) sink.push(`- ${prefix}: ${obj}`);
      return;
    }
    if (Array.isArray(obj)) return obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, sink));
    if (typeof obj === 'object') for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, sink);
  };
  const SKIP = new Set(['hero', 'cta', 'breadcrumb', 'faq', 'illustrationLabels', 'wavelengthIllustration', 'intellitrakIllustration', 'beforeAfterSection', 'categoryName', 'otherCategories', 'equipmentCards']);
  for (const key of laserKeys) {
    for (const l of LOCALES) {
      const detail = get(msg[l], `treatments.laser.${key}.detail`);
      if (!detail || typeof detail !== 'object') continue;
      const lines = [];
      for (const [k, v] of Object.entries(detail)) if (!SKIP.has(k)) flatten(v, k, lines);
      out.push(`\n### laser/${key} detail (${l})\n`);
      out.push(...lines);
    }
  }
  out.push('\n### LASER_CATEGORIES treatmentProtocol / TREATMENTS.laser 회수 (ko 원문)\n');
  for (const c of LASER_CATEGORIES) {
    if (c.treatmentProtocol) out.push(`- ${c.id}.treatmentProtocol: ${JSON.stringify(c.treatmentProtocol)}`);
  }
  for (const [id, eq] of Object.entries(TREATMENTS.laser ?? {})) {
    const picked = {};
    for (const k of ['name', 'nameEn', 'duration', 'anesthesia', 'recovery', 'sessions', 'interval', 'results']) if (eq[k]) picked[k] = eq[k];
    if (Object.keys(picked).length) out.push(`- laser.${id}: ${JSON.stringify(picked)}`);
  }

  h('5. 외국인 안내 페이지 사실 (international 네임스페이스, en 기준; 다른 언어는 같은 키)');
  const intl = msg.en.international;
  out.push(`- hero.subtitle: ${intl.hero.subtitle}`);
  out.push('- why.items: ' + intl.why.items.map((i) => `${i.title} — ${i.desc}`).join(' / '));
  out.push(`- communication.desc: ${intl.communication.desc}`);
  out.push('- channels: ' + intl.communication.channels.map((c) => `${c.lang}: ${c.value}`).join(' / '));
  out.push(`- booking.desc: ${intl.booking.desc}; steps: ` + intl.booking.steps.map((s, i) => `${i + 1}) ${s.title} — ${s.desc}`).join(' '));
  out.push('- stay.rows: ' + intl.stay.rows.map((r) => `${r.treatment}: ${r.stay}`).join(' / ') + ` (note: ${intl.stay.note})`);
  for (const l of ['ja', 'zh', 'zh-TW']) out.push(`- stay.rows(${l}): ` + get(msg[l], 'international.stay.rows').map((r) => `${r.treatment}: ${r.stay}`).join(' / '));
  out.push(`- aftercare.desc: ${intl.aftercare.desc}`);
  out.push(`- payment: ${intl.payment.desc} ${intl.payment.methods}`);
  for (const l of ['ja', 'zh', 'zh-TW']) out.push(`- payment.methods(${l}): ${get(msg[l], 'international.payment.methods')}`);
  out.push('- 메신저: WhatsApp +82 10-6888-2773 (wa.me/821068882773), LINE ID icps7972773, WeChat ID livps0414, 카카오채널(국내). 로케일별 1순위: ja→LINE, zh→WeChat, 그 외→WhatsApp (src/lib/messengerLinks.ts)');

  h('6. 의료 Q&A 전체 (MEDICAL_QA; ko 원문 + 4개 언어 답) — 상담비·할부·임신·첫 방문·외국인 항목 등 사이트가 이미 답한 질문');
  out.push('상담비: "1:1 전문 상담비용은 1만원이며 당일 시술 진행 시 시술 금액에서 전액 차감"(consultation-fee). 할부: 카드 할부 가능(payment-installment). 임신·수유 중 시술 비권장(pregnant-treatment). 이 답이 있는 항목은 [검수 필요] 대신 그대로 인용한다.');
  for (const qa of MEDICAL_QA) {
    out.push(`\n- **${qa.id}** (ko) Q ${qa.question} → ${qa.answer}`);
    for (const l of LOCALES) {
      const faq = get(msg[l], 'medical.faq');
      const f = Array.isArray(faq) ? faq.find((x) => x.id === qa.id) : null;
      if (f) out.push(`  - (${l}) Q ${f.question} → ${f.answer}`);
    }
  }

  h('7. 의료진 (sections.doctors.kim, 4개 언어)');
  for (const l of LOCALES) {
    const d = get(msg[l], 'sections.doctors.kim');
    if (!d) continue;
    out.push(`- ${l}: ${d.name} / ${d.nameEn} / ${d.title} / ${d.specialty} / 학력: ${(d.education ?? []).join('; ')} / 자격: ${(d.certifications ?? []).join('; ')} / 전문: ${(d.specialties ?? []).join('; ')}`);
  }
  out.push('- SCI 논문 4편: src/app/[locale]/about/staff/page.tsx KIM_SCI_PUBLICATIONS (Arch Plast Surg 2024·2016, Dermatol Surg 2014, Microsurgery 2014) — 제목·저널만 인용, 링크 없음');
  out.push('- 두 번째 의료진: ' + LOCALES.map((l) => `${l}: ${get(msg[l], 'sections.doctors.cheon.name')} (${get(msg[l], 'sections.doctors.cheon.specialty')})`).join(' / '));

  h('8. 사이트에 없는 것 (가이드에서 [검수 필요]로 남길 항목)');
  out.push('- 시술별 비행 가능 시점, 붓기·붉음이 가라앉는 일수(울쎄라 "약간의 붓기·홍조 가능"만 있음), 술·사우나 제한 기간, 통증 점수');
  out.push('- 외국인 전용 패키지, 예약금·환불 규정(사이트: "상담 예약에는 예약금이 필요하지 않습니다"만 있음), Alipay/WeChat Pay 가능 여부');
  out.push('- 원장 논문 링크(PubMed/DOI), 장비 인증서 사진 사용 허가');
  out.push('- 9월 프로모션 조건(포스터에만 있음) — 가이드에서는 언급하지 않는다(할인 강조 금지)');

  fs.writeFileSync(path.join(ROOT, 'content', 'guides', '_facts.md'), out.join('\n') + '\n', 'utf8');
  console.log(`[dump-guide-facts] ${out.length} lines → content/guides/_facts.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

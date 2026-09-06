# 가이드 근거 시트 (자동 생성 — 수정하지 말고 `npx tsx scripts/dump-guide-facts.mjs`로 재생성)

생성: 2026-09-06. 출처는 각 표의 머리말에 있다. **여기에 없는 가격·시간·자격·비행 시점은 가이드에 쓰지 않는다.**

## 1. 병원 기본 정보 (src/lib/constants.ts SITE_INFO·BUSINESS_HOURS)

- 병원명: 리브성형외과 / LIV Plastic Surgery (ja LIV美容クリニック, zh·zh-TW LIV整形外科)
- 전화 02-797-2773 (국제 +82-2-797-2773), 이메일 info@livps.co.kr
- 주소(en): 4F, Jaeun Building, 80 Naruteo-ro, Seocho-gu, Seoul, Korea
- 진료시간: 평일 10:00–19:00, 토 10:00–16:00, 일 휴무
- 오시는 길(international.gettingHere, en): Incheon Airport (ICN): About 70–90 minutes by AREX train, limousine bus, or taxi (about 60 minutes). / Gimpo Airport (GMP): About 40 minutes by taxi or subway. / Sinsa Station: Line 3, Exit 4 — a 1-minute walk.
- 주소 표기(international.gettingHere.address): en: 4F, Jaeun Building, 80 Naruteo-ro, Seocho-gu, Seoul, Korea / ja: ソウル特別市 瑞草区 ナルト路80 自恩ビル4階 / zh: 首尔特别市瑞草区Naruteo-ro 80号 自恩大厦4层 / zh-TW: 首爾特別市瑞草區Naruteo-ro 80號 自恩大廈4樓
- 인증(CERTIFICATIONS): ulthera: | thermage:
- international.why.items[1](en): "LIV is an officially certified provider using genuine Ultherapy Prime and Thermage FLX systems with authentic cartridges."

## 2. 공개 가격표 /pricing (pricingGuide 네임스페이스; 1회 기준, VAT 별도)


### thread — Thread Lift / 糸リフト / 埋线提升 / 埋線拉提

| rowId | en name | ja name | zh name | zh-TW name | basis(en) | price(en) |
| --- | --- | --- | --- | --- | --- | --- |
| aptosNamica | APTOS NAMICA | APTOS NAMICA | APTOS NAMICA | APTOS NAMICA | 10 threads | KRW 3,000,000~ |
| aptosLight25 | APTOS Light Lift 25 | APTOS Light Lift 25 | APTOS Light Lift 25 | APTOS Light Lift 25 | 2 threads | KRW 1,500,000~ |
| aptosLight50 | APTOS Light Lift 50 | APTOS Light Lift 50 | APTOS Light Lift 50 | APTOS Light Lift 50 | 2 threads | KRW 2,500,000~ |
| silhouette | Silhouette Soft | シルエットソフト | Silhouette Soft | Silhouette Soft | 2 threads | KRW 1,000,000~ |
| mint | MINT | ミント | MINT | MINT | 8 threads | KRW 800,000~ |

### filler — Filler / フィラー / 玻尿酸 / 玻尿酸

| rowId | en name | ja name | zh name | zh-TW name | basis(en) | price(en) |
| --- | --- | --- | --- | --- | --- | --- |
| domestic | Domestic | 国産 | 国产 | 國產 | 1cc | KRW 200,000~ |
| domesticPremium | Domestic Premium | 国産プレミアム | 国产高端 | 國產高端 | 1cc | KRW 300,000~ |
| imported | Imported | 輸入 | 进口 | 進口 | 1cc | KRW 400,000~ |

### thermage — Thermage / サーマジ / 热玛吉 / 鳳凰電波

| rowId | en name | ja name | zh name | zh-TW name | basis(en) | price(en) |
| --- | --- | --- | --- | --- | --- | --- |
| flx600 | Thermage FLX | サーマジFLX | 热玛吉FLX | 鳳凰電波 FLX | 600 shots | KRW 2,400,000~ |
| eye225 | Eye Thermage | アイサーマジ | 眼部热玛吉 | 眼部鳳凰電波 | 225 shots | KRW 1,000,000~ |
| eye450 | Eye Thermage | アイサーマジ | 眼部热玛吉 | 眼部鳳凰電波 | 450 shots | KRW 1,600,000~ |

### ulthera — Ultherapy / ウルセラ / 超声刀 / 音波拉提

| rowId | en name | ja name | zh name | zh-TW name | basis(en) | price(en) |
| --- | --- | --- | --- | --- | --- | --- |
| upperFace | Upper face | 上顔面 | 上面部 | 上面部 | 200-300 shots | KRW 780,000~ |
| lowerFace | Lower face | 下顔面 | 下面部 | 下面部 | 300-400 shots | KRW 1,170,000~ |
| fullFace | Full face | 全顔 | 全面部 | 全面部 | 400-800 shots | KRW 1,560,000~ |
| fullFaceNeck | Full face + neck | 全顔 + 首 | 全面部 + 颈部 | 全面部 + 頸部 | 600 shots~ | KRW 2,340,000~ |

안내문(en): ※ All prices are exclusive of VAT. ※ The prices above are per session; the exact price is determined after consultation. ※ The final cost may vary depending on individual skin condition, treatment scope, and products used.
안내문(ko): ※ 모든 가격은 VAT 별도 기준입니다. ※ 위 가격은 1회 기준이며, 정확한 가격은 상담 후 결정됩니다. ※ 개인의 피부 상태, 시술 범위, 사용 제품에 따라 최종 비용은 달라질 수 있습니다.

## 3. 시술 페이지 가격 (src/lib/pricing.ts PRICING; 원, "부터"; 라벨은 pricing.labels en)

| treatment | group | row | label(en) | price(KRW) | suffix |
| --- | --- | --- | --- | --- | --- |
| ulthera | name | upperFace | Upper face (200-300 shots) | 780,000 | starting |
| ulthera | name | lowerFace | Lower face (300-400 shots) | 1,170,000 | starting |
| ulthera | name | fullFace | Full face (400-800 shots) | 1,560,000 | starting |
| ulthera | name | fullFaceNeck | Full face + neck (600 shots~) | 2,340,000 | starting |
| thermage | name | shot300 | 300 shots | 1,300,000 | starting |
| thermage | name | shot600 | 600 shots | 2,400,000 | starting |
| thermage | name | shot900 | 900 shots | 3,300,000 | starting |
| thermage | name | eyeTip225 | Eye Tip 225 shots | 1,000,000 | starting |
| thermage | name | eyeTip450 | Eye Tip 450 shots | 1,600,000 | starting |
| shurink | shurinkLaser (V-line / Cheeks / Forehead / Double Chin / Neck Wrinkles / Under Eye) | shot300 | 300 shots | 200,000 | starting |
| shurink | shurinkLaser (V-line / Cheeks / Forehead / Double Chin / Neck Wrinkles / Under Eye) | shot600 | 600 shots | 400,000 | starting |
| shurink | shurinkLaser (V-line / Cheeks / Forehead / Double Chin / Neck Wrinkles / Under Eye) | shot900 | 900 shots | 600,000 | starting |
| shurink | ultheraLaser (V-line / Cheeks / Double Chin / Neck Wrinkles) | shot300 | 300 shots | 1,200,000 | starting |
| shurink | ultheraLaser (V-line / Cheeks / Double Chin / Neck Wrinkles) | shot600 | 600 shots | 2,200,000 | starting |
| density | hiTip | shot300 | 300 shots | 890,000 | starting |
| density | hiTip | shot600 | 600 shots | 1,500,000 | starting |
| density | alphaTip | shot300 | 300 shots | 990,000 | starting |
| density | alphaTip | shot600 | 600 shots | 1,800,000 | starting |
| inmode | name | fxForma | FX / FORMA Mode | 250,000 | starting |
| inmode | name | fx | FX Mode | 150,000 | starting |
| inmode | name | forma | FORMA Mode | 200,000 | starting |
| thread | name | aptosNamica | APTOS NAMICA (10 threads) | 3,000,000 | starting |
| thread | name | aptosLight25 | APTOS Light Lift 25 (2 threads) | 1,500,000 | starting |
| thread | name | aptosLight50 | APTOS Light Lift 50 (2 threads) | 2,500,000 | starting |
| thread | name | silhouette | Silhouette Soft (2 threads) | 1,000,000 | starting |
| thread | name | mint | MINT (8 threads) | 800,000 | starting |
| botox | botoxContour (Jaw / Temple) | domestic | Domestic | 60,000 | starting |
| botox | botoxContour (Jaw / Temple) | domesticPremium | Domestic Premium | 110,000 | starting |
| botox | botoxContour (Jaw / Temple) | xeomin | Xeomin | 160,000 | starting |
| botox | botoxContour (Jaw / Temple) | allergan | Allergan | 190,000 | starting |
| botox | botoxBody (Trapezius / Arms / Calves / Thighs (per 100IU)) | domesticPremium | Domestic Premium | 220,000 | starting |
| botox | botoxBody (Trapezius / Arms / Calves / Thighs (per 100IU)) | xeomin | Xeomin | 320,000 | starting |
| filler | chanelInjection | volume3cc | 3 cc | 330,000 | starting |
| filler | otherFillers | consultOnly | Detailed pricing provided during consultation | 상담 후 결정 |  |
| skinbooster | hilowave | volume2cc | 2 cc | 500,000 | starting |
| skinbooster | juvelook | volume10cc | 10 cc | 270,000 | starting |
| skinbooster | elementWhitening | volume2cc | 2 cc | 240,000 | starting |
| skinbooster | stemcell | volume5cc | 5 cc | 270,000 | starting |
| skinbooster | melasma | volume4cc | 4 cc | 240,000 | starting |
| skinbooster | glow | volume2cc | 2 cc | 240,000 | starting |
| skinbooster | rejuranHbPlus | volume1cc | 1 cc | 190,000 | starting |
| skinbooster | rejuranHbPlus | volume2cc | 2 cc | 340,000 | starting |
| skinbooster | rejuranHbPlus | volume4cc | 4 cc | 600,000 | starting |
| skinbooster | eyeRejuran | volume1cc | 1 cc | 190,000 | starting |
| skinbooster | rejuran | volume2cc | 2 cc | 300,000 | starting |
| skinbooster | rejuran | volume4cc | 4 cc | 460,000 | starting |
| pigmentation | dualToning (Melasma / Blemishes / Pores / Acne Scars) | single | Single Session | 150,000 | starting |
| pigmentation | potenza | pumpingTip | Pumping Tip | 200,000 | starting |
| vascular | dualToning (Redness / Vascular Relief) | single | Single Session | 150,000 | starting |
| skintone | dualToning (Skin Tone Improvement) | single | Single Session | 150,000 | starting |
| hairRemoval | dualToning (Hair Removal Care) | single | Single Session | 150,000 | starting |
| tattoo | tattooLucas | onePart | Per Area | 50,000 | starting |
| tattoo | co2Laser (Moles / Flat Warts / Age Spots, etc.) | dia3mm | Diameter ≤ 3mm (1 spot) | 10,000 | starting |
| tattoo | co2Laser (Moles / Flat Warts / Age Spots, etc.) | dia5mm | 3mm < Diameter ≤ 5mm (1 spot) | 30,000 | starting |
| tattoo | co2Laser (Moles / Flat Warts / Age Spots, etc.) | diaOver5mm | Diameter > 5mm (1 spot) | 50,000 | starting |
| tattoo | co2Laser (Moles / Flat Warts / Age Spots, etc.) | faceFull | Full Face (50+ spots) | 500,000 | starting |
| tattoo | co2Laser (Moles / Flat Warts / Age Spots, etc.) | neckFull | Full Neck (50+ spots) | 500,000 | starting |

접미사(en pricing.suffix): {"starting":" KRW ~","perPiece":" KRW ~ / piece","per100iu":" KRW ~ / 100IU"} / 안내(en): * Prices are per session. Final pricing is determined after consultation.

## 4. 시술 정보 — 소요 시간·마취·회복·효과 지속 (TREATMENTS + treatmentsI18n, 4개 언어)


### lifting/ulthera

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 울쎄라피 프라임 | 60-90분 | 마취 크림 (30분) | 즉시 일상 복귀 가능 | 3-6개월에 걸쳐 점진적 개선, 1-2년 유지 |
| en | Ultherapy Prime | 60-90 minutes | Topical anesthetic cream (30 min) | Immediate return to daily life | Gradual improvement over 3-6 months, lasts 1-2 years |
| ja | ウルセラ | 60-90分 | 麻酔クリーム（30分） | すぐに日常復帰可能 | 3-6ヶ月かけて徐々に改善、1-2年持続 |
| zh | 超声刀 | 60-90分钟 | 麻醉霜（30分钟） | 即刻可恢复日常生活 | 3-6个月逐渐改善，持续1-2年 |
| zh-TW | 音波拉提 | 60-90分鐘 | 麻醉藥膏（30分鐘） | 可立即恢復日常生活 | 3-6個月逐漸改善，維持1-2年 |

- 대상 부위(ko): 이마, 눈가, 볼, 턱선, 목
- 적합(ko idealFor): 비수술로 리프팅을 원하는 분 / 처진 피부, 탄력 저하가 고민인 분 / 자연스러운 변화를 원하는 분 / 다운타임 없이 시술받고 싶은 분
- 주의(ko cautions): 시술 후 약간의 붓기, 홍조가 있을 수 있음 / 시술 부위에 따라 일시적 감각 이상 가능 / 임산부, 수유부는 시술 불가 / 시술 부위에 금속 임플란트가 있는 경우 상담 필요
- FAQ(ko): Q 울쎄라피 프라임 시술은 얼마나 아픈가요? → 마취 크림 후 시술하며 대부분 견딜 만한 수준입니다. | Q 효과는 언제부터 나타나나요? → 시술 직후 효과 + 3~6개월에 걸쳐 점진적 개선됩니다. | Q 울쎄라피 프라임과 써마지의 차이는 무엇인가요? → 울쎄라피는 초음파(HIFU), 써마지는 고주파(RF) 방식입니다.
- FAQ(en): Q Is the Ultherapy Prime treatment painful? → With topical anesthetic, most tolerate it well. | Q When do the results appear? → Immediate effect + gradual 3-6 months. | Q What is the difference between Ultherapy Prime and Thermage? → Ultherapy uses HIFU (ultrasound), Thermage uses RF.
- FAQ(ja): Q ウルセラプライム施術は痛みますか？ → 麻酔クリーム使用で多くの方が我慢できる程度です。 | Q 効果はいつから現れますか？ → 施術直後＋3~6ヶ月で徐々に改善。 | Q ウルセラプライムとサーマジの違いは？ → ウルセラ=超音波(HIFU)、サーマジ=高周波(RF)。
- FAQ(zh): Q 超声刀Prime治疗疼不疼？ → 涂麻醉霜后进行，多数人可以承受。 | Q 什么时候开始出现效果？ → 治疗后立即+3~6个月渐进改善。 | Q 超声刀Prime和热玛吉的区别是什么？ → 超声刀Prime为超声波(HIFU)，热玛吉为射频(RF)。
- FAQ(zh-TW): Q 音波拉提Prime治療會很痛嗎？ → 塗抹麻醉藥膏後進行，大多數人都可以忍受。 | Q 效果從什麼時候開始出現？ → 治療後立即可感受，並在3~6個月內逐漸改善。 | Q 音波拉提Prime和鳳凰電波有什麼不同？ → 音波拉提為超音波（HIFU），鳳凰電波為射頻（RF）。

### lifting/thermage

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 써마지 FLX | 45-60분 | 무마취 (진동 기술로 통증 감소) | 즉시 일상 복귀 가능 | 즉각적 탄력 개선, 3-6개월 콜라겐 재생 |
| en | Thermage FLX | 45-60 minutes | No anesthesia (vibration reduces discomfort) | Immediate return to daily life | Immediate elasticity improvement, collagen regeneration over 3-6 months |
| ja | サーマジFLX | 45-60分 | 無麻酔（振動技術で痛み軽減） | すぐに日常復帰可能 | 即時の弾力改善、3-6ヶ月のコラーゲン再生 |
| zh | 热玛吉FLX | 45-60分钟 | 无需麻醉（振动技术减少疼痛） | 即刻可恢复日常生活 | 即刻改善弹力，3-6个月胶原蛋白再生 |
| zh-TW | 鳳凰電波 FLX | 45-60分鐘 | 不需麻醉（以震動技術減輕疼痛） | 可立即恢復日常生活 | 立即改善彈性，3-6個月膠原蛋白再生 |

- 대상 부위(ko): 얼굴 전체, 눈가, 목, 바디
- 적합(ko idealFor): 피부 탄력 저하가 고민인 분 / 잔주름 개선을 원하는 분 / 자연스럽고 점진적인 변화를 원하는 분 / 무마취 시술을 원하는 분
- 주의(ko cautions): 시술 후 일시적인 홍조가 있을 수 있음 / 페이스메이커 장착자는 시술 불가 / 임산부, 수유부는 시술 불가 / 시술 부위에 금속 임플란트가 있는 경우 상담 필요
- FAQ(ko): Q 써마지 FLX와 이전 버전의 차이는? → AccuREP 기술로 에너지 자동 조절, 25% 빠른 시술. | Q 시술 주기는 어떻게 되나요? → 1년에 1~2회 시술을 권장합니다. | Q 써마지 눈가 시술도 가능한가요? → 네, 써마지 아이 전용 팁으로 눈가 시술 가능합니다.
- FAQ(en): Q How is Thermage FLX different from earlier versions? → AccuREP auto-tunes energy; 25% faster. | Q How often should I receive treatment? → We recommend 1-2 sessions per year. | Q Can Thermage be used on the eye area? → Yes — Thermage Eye tip treats eye area.
- FAQ(ja): Q サーマジFLXと旧世代の違いは？ → AccuREPで自動調整、25%高速化。 | Q 施術間隔はどのくらい？ → 年1~2回の施術を推奨。 | Q 目もとにも施術できますか？ → はい、サーマジアイ専用チップで可能です。
- FAQ(zh): Q 热玛吉FLX与旧版本的区别是什么？ → AccuREP技术自动调节能量，速度快25%。 | Q 治疗周期是多久？ → 建议每年1~2次。 | Q 热玛吉也可以做眼周治疗吗？ → 是的，可以使用热玛吉眼部专用探头。
- FAQ(zh-TW): Q 鳳凰電波FLX與舊版本有什麼不同？ → AccuREP技術自動調節能量，治療速度快25%。 | Q 治療週期是如何安排的？ → 建議1年進行1~2次。 | Q 鳳凰電波也可以做眼周治療嗎？ → 可以，使用鳳凰電波眼部專用探頭。

### lifting/onda

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 온다 | 얼굴 15-30분 / 바디 부위당 약 10분 | 마취 불필요 | 다운타임 없음 (시술 직후 일상생활 가능) | 4-12주에 걸쳐 점진적으로 나타남 (개인차 있음) |
| en | ONDA | Face 15-30 minutes / about 10 minutes per body area | No anesthesia required | No downtime (return to daily life right after the treatment) | Appears gradually over 4-12 weeks (varies by individual) |
| ja | オンダ | 顔15-30分 / ボディは1部位あたり約10分 | 麻酔不要 | ダウンタイムなし（施術直後から日常生活可能） | 4-12週間かけて徐々に現れます（個人差あり） |
| zh | ONDA | 面部15-30分钟 / 身体每个部位约10分钟 | 无需麻醉 | 无恢复期（治疗后即可恢复日常生活） | 4-12周内逐渐显现（存在个体差异） |
| zh-TW | ONDA | 臉部15-30分鐘 / 身體每個部位約10分鐘 | 不需麻醉 | 無恢復期（治療後可立即恢復日常生活） | 在4-12週內逐漸顯現（因人而異） |

- 대상 부위(ko): 얼굴(볼·턱선), 이중턱, 복부, 옆구리, 허벅지, 팔
- 적합(ko idealFor): 탄력 저하와 국소 지방이 함께 있는 분 / 다운타임 없이 개선을 원하는 분 / 얼굴과 바디를 함께 관리하고 싶은 분
- 주의(ko cautions): 임신 중이거나 수유 중인 경우 상담 시 반드시 알려주세요 / 심박조율기, 체내 금속 이식물을 보유한 경우 상담 시 반드시 알려주세요 / 시술 부위에 염증, 감염, 상처가 있는 경우 상담 시 반드시 알려주세요 / 조절되지 않는 당뇨 등 기저질환이 있는 경우 상담 시 반드시 알려주세요
- FAQ(ko): Q 온다는 고주파(RF) 시술인가요? → 아니요. 온다는 2.45GHz 마이크로웨이브를 사용합니다. | Q 아픈가요? 마취가 필요한가요? → 마취 없이 진행하며, 따뜻한 마사지와 유사한 느낌으로 보고됩니다. | Q 효과는 언제 나타나나요? → 즉각적이지 않고 4~12주에 걸쳐 점진적으로 나타납니다.
- FAQ(en): Q Is ONDA an RF (radiofrequency) treatment? → No. ONDA uses 2.45 GHz microwave energy. | Q Is it painful? Is anesthesia needed? → It is performed without anesthesia, and is reported to feel similar to a warm massage. | Q When do the results appear? → Not immediately — they appear gradually over 4-12 weeks.
- FAQ(ja): Q オンダは高周波（RF）施術ですか？ → いいえ。オンダは2.45GHzのマイクロ波を使用します。 | Q 痛みますか？麻酔は必要ですか？ → 麻酔なしで行い、温かいマッサージに近い感覚と報告されています。 | Q 効果はいつ現れますか？ → 即時ではなく、4~12週間かけて徐々に現れます。
- FAQ(zh): Q ONDA是射频(RF)治疗吗？ → 不是。ONDA使用2.45GHz微波。 | Q 会痛吗？需要麻醉吗？ → 无需麻醉，感受被报告为类似温热按摩。 | Q 效果什么时候出现？ → 并非即刻，4~12周内逐渐显现。
- FAQ(zh-TW): Q ONDA是射頻（RF）治療嗎？ → 不是。ONDA使用2.45GHz微波。 | Q 會痛嗎？需要麻醉嗎？ → 不需麻醉即可進行，感受被描述為類似溫熱的按摩。 | Q 效果什麼時候出現？ → 並非立即出現，而是在4~12週內逐漸顯現。

### lifting/density

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 덴서티 | 40-60분 | 마취 크림 (선택) | 즉시 일상 복귀 가능 | 즉각적 리프팅 + 3-6개월 콜라겐 재생 |
| en | Density | 40-60 minutes | Topical anesthetic cream (optional) | Immediate return to daily life | Immediate lifting + collagen regeneration over 3-6 months |
| ja | デンシティ | 40-60分 | 麻酔クリーム（選択） | すぐに日常復帰可能 | 即時のリフティング＋3-6ヶ月のコラーゲン再生 |
| zh | Density | 40-60分钟 | 麻醉霜（可选） | 即刻可恢复日常生活 | 即刻提升 + 3-6个月胶原蛋白再生 |
| zh-TW | Density | 40-60分鐘 | 麻醉藥膏（可選擇） | 可立即恢復日常生活 | 立即拉提 + 3-6個月膠原蛋白再生 |

- 대상 부위(ko): 이마, 눈가, 볼, 턱선, 목
- 적합(ko idealFor): 복합적인 리프팅 효과를 원하는 분 / 즉각적인 효과와 장기적 개선을 모두 원하는 분 / 기존 리프팅 시술에 만족하지 못한 분
- 주의(ko cautions): 시술 후 약간의 붓기, 홍조 가능 / 피부 상태에 따라 시술 가능 여부 상담 필요 / 임산부, 수유부는 시술 불가
- FAQ(ko): Q 울쎄라피 프라임, 써마지와 어떤 차이가 있나요? → 덴서티는 합리적 비용의 고주파 리프팅 입문 장비입니다. | Q 시술 간격은 어느 정도가 좋은가요? → 3~6개월 간격 시술을 권장합니다.
- FAQ(en): Q How is Density different from Ultherapy Prime and Thermage? → Density is an entry-level RF lifting device at a reasonable cost. | Q How far apart should the sessions be? → We recommend an interval of 3-6 months.
- FAQ(ja): Q ウルセラプライム、サーマジとの違いは？ → デンシティは費用を抑えられる高周波リフティングの入門機器です。 | Q 施術間隔はどのくらいが良いですか？ → 3~6ヶ月間隔の施術を推奨します。
- FAQ(zh): Q Densiti和超声刀Prime、热玛吉有什么区别？ → Densiti是性价比高的入门级射频提升设备。 | Q 治疗间隔多久比较好？ → 建议3~6个月间隔。
- FAQ(zh-TW): Q Density和音波拉提Prime、鳳凰電波有什麼差異？ → Density是價格合理的射頻拉提入門儀器。 | Q 治療間隔多久比較好？ → 建議間隔3~6個月。

### lifting/inmode

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 인모드 | 30-60분 | 무마취 또는 마취 크림 | 즉시 일상 복귀 가능 | 즉각적 탄력 + 점진적 콜라겐 재생 |
| en | InMode | 30-60 minutes | No anesthesia or topical anesthetic cream | Immediate return to daily life | Immediate firmness + gradual collagen regeneration |
| ja | インモード | 30-60分 | 無麻酔または麻酔クリーム | すぐに日常復帰可能 | 即時の弾力＋段階的なコラーゲン再生 |
| zh | InMode | 30-60分钟 | 无麻醉或麻醉霜 | 即刻可恢复日常生活 | 即刻弹力 + 渐进式胶原蛋白再生 |
| zh-TW | InMode | 30-60分鐘 | 不麻醉或使用麻醉藥膏 | 可立即恢復日常生活 | 立即的彈性 + 逐漸的膠原蛋白再生 |

- 대상 부위(ko): 턱밑, 볼살, 페이스라인, 이중턱, 심부볼
- 적합(ko idealFor): 턱 밑 지방 제거 및 탄력 강화를 원하는 분 / 볼살 리프팅 및 페이스라인 정리를 원하는 분 / 이중턱, 심부볼 개선을 원하는 분 / 피부 속 콜라겐 재생 및 잔주름 개선을 원하는 분
- 주의(ko cautions): 시술 후 약간의 붓기, 홍조 가능 / 피부 상태에 따라 시술 가능 여부 상담 필요 / 임산부, 수유부는 시술 불가
- FAQ(ko): Q 인모드는 어떤 분께 추천하나요? → 얼굴 지방이 많거나 늘어진 피부가 복합 고민인 분. | Q 써마지와 병행하면 효과가 더 좋나요? → 네, 고주파 시너지 효과로 더 강력한 탄력 개선 가능.
- FAQ(en): Q Who is InMode recommended for? → Those whose concerns combine facial fat and sagging skin. | Q Is it more effective when combined with Thermage? → Yes, RF synergy allows a stronger improvement in elasticity.
- FAQ(ja): Q インモードはどのような方におすすめですか？ → 顔の脂肪が多い方や、たるみが複合的に気になる方。 | Q サーマジと併用すると効果は高まりますか？ → はい、高周波のシナジー効果でより強い弾力改善が期待できます。
- FAQ(zh): Q InMode适合什么样的人？ → 面部脂肪多或皮肤松弛复合烦恼者。 | Q 和热玛吉并用效果更好吗？ → 是的，射频协同效应可提供更强的弹力改善。
- FAQ(zh-TW): Q InMode推薦給什麼樣的人？ → 臉部脂肪較多或皮膚鬆弛複合困擾的人。 | Q 與鳳凰電波併行效果會更好嗎？ → 是的，射頻的加乘效果可帶來更強的彈性改善。

### lifting/shurink

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 슈링크 | 30-45분 | 마취 크림 (선택) | 즉시 일상 복귀 가능 | 2-4주 후 효과 시작, 3개월 최대 효과 |
| en | Shurink | 30-45 minutes | Topical anesthetic cream (optional) | Immediate return to daily life | Results begin after 2-4 weeks, peaking at 3 months |
| ja | シュリンク | 30-45分 | 麻酔クリーム（選択） | すぐに日常復帰可能 | 2-4週後から効果が現れ、3ヶ月で最大効果 |
| zh | Shurink | 30-45分钟 | 麻醉霜（可选） | 即刻可恢复日常生活 | 2-4周后开始见效，3个月达到最大效果 |
| zh-TW | Shurink | 30-45分鐘 | 麻醉藥膏（可選擇） | 可立即恢復日常生活 | 2-4週後開始出現效果，3個月達到最大效果 |

- 대상 부위(ko): 이마, 눈가, 볼, 턱선, 목
- 적합(ko idealFor): 처음 리프팅 시술을 받는 분 / 빠른 시술을 원하는 분 / 합리적인 비용으로 리프팅을 원하는 분 / 정기적인 유지 관리를 원하는 분
- 주의(ko cautions): 시술 후 약간의 홍조 가능 / 민감한 피부는 상담 필요 / 임산부, 수유부는 시술 불가
- FAQ(ko): Q 울쎄라피 프라임과 슈링크의 차이는? → 둘 다 HIFU지만 슈링크는 합리적 비용의 정기 관리용. | Q 시술 주기는 어떻게 되나요? → 3~6개월 간격 시술, 유지 관리용으로 적합.
- FAQ(en): Q What is the difference between Ultherapy Prime and Shurink? → Both are HIFU, but Shurink suits regular care at a reasonable cost. | Q How often is the treatment repeated? → Every 3-6 months, and it also suits maintenance care.
- FAQ(ja): Q ウルセラプライムとシュリンクの違いは？ → どちらもHIFUですが、シュリンクは費用を抑えた定期ケア向きです。 | Q 施術周期はどのくらいですか？ → 3~6ヶ月間隔の施術で、維持ケアにも適しています。
- FAQ(zh): Q 超声刀Prime和舒颜萃的区别？ → 同为HIFU，但舒颜萃更适合性价比的日常维护。 | Q 治疗周期如何安排？ → 3~6个月间隔，适合维护性治疗。
- FAQ(zh-TW): Q 音波拉提Prime和Shurink的差異是什麼？ → 兩者都是HIFU，但Shurink適合以合理費用定期管理。 | Q 治療週期是如何安排的？ → 間隔3~6個月，適合作為維持管理。

### lifting/thread

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 실리프팅 | 30-60분 | 국소 마취 | 3-7일 (멍, 붓기 가능) | 즉각적 리프팅, 6-12개월 유지 |
| en | Thread Lift | 30-60 minutes | Local anesthesia | 3-7 days (bruising and swelling possible) | Immediate lifting, lasting 6-12 months |
| ja | スレッドリフト | 30-60分 | 局所麻酔 | 3-7日（内出血・腫れの可能性） | 即時のリフティング、6-12ヶ月持続 |
| zh | 线雕 | 30-60分钟 | 局部麻醉 | 1-7天（依部位而异） | 即刻提升 + 6-12个月胶原蛋白促进 |
| zh-TW | 埋線 | 30-60分鐘 | 局部麻醉 | 3-7天（可能出現瘀青、腫脹） | 立即拉提，維持6-12個月 |

- 대상 부위(ko): 이마, 광대, 볼, 턱선, 팔자, 목
- 적합(ko idealFor): 즉각적인 리프팅을 원하는 분 / 처진 볼살, 무너진 광대가 고민인 분 / 팔자주름, 턱선 정리를 원하는 분 / 레이저 리프팅만으로 만족스럽지 않은 분
- 주의(ko cautions): 시술 후 3-7일 멍, 붓기 가능 / 2주간 과격한 표정, 마사지 피해야 함 / 시술 부위 당김감이 있을 수 있음 / 드물게 감염, 실 노출 가능성
- FAQ(ko): Q 실리프팅은 얼마나 유지되나요? → 실 종류에 따라 6~12개월 효과가 유지됩니다. | Q 실리프팅 후 언제부터 화장이 가능한가요? → 시술 24시간 후부터 가벼운 화장 가능합니다. | Q 레이저 리프팅과 병행해도 되나요? → 네, 1~2주 후 병행 시 시너지 효과 있습니다.
- FAQ(en): Q How long does a thread lift last? → Results last 6-12 months depending on the type of thread. | Q When can I wear makeup after a thread lift? → Light makeup is possible 24 hours after the treatment. | Q Can it be combined with laser lifting? → Yes, combining after 1-2 weeks gives a synergistic effect.
- FAQ(ja): Q 糸リフトの効果はどのくらい持続しますか？ → 糸の種類により6~12ヶ月ほど持続します。 | Q 糸リフト後、いつからメイクができますか？ → 施術24時間後から軽いメイクが可能です。 | Q レーザーリフティングと併用できますか？ → はい、1~2週間後の併用でシナジー効果が期待できます。
- FAQ(zh): Q 线雕的效果维持多久？ → 提升效果维持6-12个月，胶原蛋白促进更持久。 | Q 线雕后会有异物感吗？ → 初期轻微异物感，2-4周内消失。
- FAQ(zh-TW): Q 埋線拉提可以維持多久？ → 依線材種類，效果維持6~12個月。 | Q 埋線拉提後什麼時候可以化妝？ → 治療24小時後可以化淡妝。 | Q 可以和雷射拉提併行嗎？ → 可以，1~2週後併行會有加乘效果。

### lifting/aptos

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 압토스 바이오 리프팅 | 30-60분 | 국소 마취 | 3-7일 (멍, 붓기 가능) | 즉각적 리프팅, 최대 24개월 유지 |
| en | APTOS Bio Lifting | 30-60분 | 국소 마취 | 3-7일 (멍, 붓기 가능) | 즉각적 리프팅, 최대 24개월 유지 |
| ja | アプトス バイオリフティング | 30-60분 | 국소 마취 | 3-7일 (멍, 붓기 가능) | 즉각적 리프팅, 최대 24개월 유지 |
| zh | APTOS 生物提升 | 30-60분 | 국소 마취 | 3-7일 (멍, 붓기 가능) | 즉각적 리프팅, 최대 24개월 유지 |
| zh-TW | APTOS 生物拉提 | 30-60분 | 국소 마취 | 3-7일 (멍, 붓기 가능) | 즉각적 리프팅, 최대 24개월 유지 |

- 대상 부위(ko): 이마, 광대, 볼, 턱선, 팔자, 목
- 적합(ko idealFor): 장기간 지속되는 리프팅을 원하는 분 / 바이오스티뮬레이션 효과를 원하는 분 / 글로벌 인증 제품을 원하는 분 / 자연스러운 볼륨감과 탄력을 원하는 분
- 주의(ko cautions): 시술 후 3-7일 멍, 붓기 가능 / 2주간 과격한 표정, 마사지 피해야 함 / 시술 부위 당김감이 있을 수 있음 / 드물게 감염, 실 노출 가능성
- FAQ(ko): Q APTOS NAMICA는 일반 실리프팅과 어떻게 다른가요? → 히알루론산 40mg 캡슐화, 최대 24개월 효과 지속. | Q APTOS는 어떤 인증을 받았나요? → KFDA 4등급, CE, ISO 13485, FDA MDSAP 인증. | Q 레이저 리프팅과 병행해도 되나요? → 네, 2~4주 후 병행 시 시너지 효과 있습니다.
- FAQ(en): Q APTOS NAMICA는 일반 실리프팅과 어떻게 다른가요? → 히알루론산 40mg 캡슐화, 최대 24개월 효과 지속. | Q APTOS는 어떤 인증을 받았나요? → KFDA 4등급, CE, ISO 13485, FDA MDSAP 인증. | Q 레이저 리프팅과 병행해도 되나요? → 네, 2~4주 후 병행 시 시너지 효과 있습니다.
- FAQ(ja): Q APTOS NAMICA는 일반 실리프팅과 어떻게 다른가요? → 히알루론산 40mg 캡슐화, 최대 24개월 효과 지속. | Q APTOS는 어떤 인증을 받았나요? → KFDA 4등급, CE, ISO 13485, FDA MDSAP 인증. | Q 레이저 리프팅과 병행해도 되나요? → 네, 2~4주 후 병행 시 시너지 효과 있습니다.
- FAQ(zh): Q APTOS NAMICA는 일반 실리프팅과 어떻게 다른가요? → 히알루론산 40mg 캡슐화, 최대 24개월 효과 지속. | Q APTOS는 어떤 인증을 받았나요? → KFDA 4등급, CE, ISO 13485, FDA MDSAP 인증. | Q 레이저 리프팅과 병행해도 되나요? → 네, 2~4주 후 병행 시 시너지 효과 있습니다.
- FAQ(zh-TW): Q APTOS NAMICA는 일반 실리프팅과 어떻게 다른가요? → 히알루론산 40mg 캡슐화, 최대 24개월 효과 지속. | Q APTOS는 어떤 인증을 받았나요? → KFDA 4등급, CE, ISO 13485, FDA MDSAP 인증. | Q 레이저 리프팅과 병행해도 되나요? → 네, 2~4주 후 병행 시 시너지 효과 있습니다.

### antiaging/botox

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 보톡스 | 10-20분 | 무마취 또는 마취 크림 (원하시는 경우) | 즉시 일상 복귀 | 3-7일 후 효과 시작, 3-6개월 유지 |
| en | Botox | 10-20 minutes | No anesthesia, or topical anesthetic cream on request | Immediate return to daily life | Results begin after 3-7 days and last 3-6 months |
| ja | ボトックス | 10-20分 | 無麻酔または麻酔クリーム（ご希望の場合） | すぐに日常復帰可能 | 3-7日後から効果が現れ、3-6ヶ月持続 |
| zh | 肉毒素 | 10-20分钟 | 无麻醉或麻醉霜（按需） | 即刻可恢复日常生活 | 3-7天后开始见效，维持3-6个月 |
| zh-TW | 肉毒桿菌素 | 10-20分鐘 | 不麻醉或使用麻醉藥膏（依需求） | 立即恢復日常生活 | 3-7天後開始出現效果，維持3-6個月 |

- 대상 부위(ko): 이마, 미간, 눈가, 사각턱, 입꼬리, 승모근, 종아리
- 적합(ko idealFor): 표정 주름이 고민인 분 / 사각턱, 승모근 볼륨 축소를 원하는 분 / 빠르고 간편한 시술을 원하는 분 / 예방적 안티에이징을 원하는 젊은 층
- 주의(ko cautions): 시술 당일 음주, 사우나 피해야 함 / 시술 부위 마사지 금지 / 임산부, 수유부, 신경근육 질환자 시술 불가
- FAQ(ko): Q 보톡스 맞으면 표정이 부자연스러워지나요? → 적정 용량이면 자연스러운 표정 유지됩니다. | Q 보톡스 효과는 얼마나 유지되나요? → 개인차 있지만 보통 3~6개월 유지됩니다. | Q 보톡스 종류에 따라 차이가 있나요? → 제품마다 발현 시간, 확산도, 지속 시간이 다릅니다.
- FAQ(en): Q Will my expressions look unnatural after Botox? → With an appropriate dose, natural expressions are maintained. | Q How long do the results last? → It varies by individual, but usually 3-6 months. | Q Is there a difference between Botox products? → Products differ in onset time, diffusion and duration.
- FAQ(ja): Q ボトックスを打つと表情が不自然になりますか？ → 適正量であれば自然な表情が保たれます。 | Q ボトックスの効果はどのくらい持続しますか？ → 個人差はありますが通常3~6ヶ月持続します。 | Q ボトックスの種類によって違いはありますか？ → 製品ごとに発現時間・拡散性・持続期間が異なります。
- FAQ(zh): Q 打肉毒素后表情会不自然吗？ → 适量治疗可保持自然表情。 | Q 肉毒素效果维持多久？ → 个体差异，通常维持3~6个月。 | Q 不同品牌的肉毒素有差异吗？ → 各品牌起效时间、扩散、持续时间不同。
- FAQ(zh-TW): Q 打了肉毒桿菌素，表情會變得不自然嗎？ → 適當劑量可以維持自然的表情。 | Q 肉毒桿菌素的效果可以維持多久？ → 因人而異，通常維持3~6個月。 | Q 不同種類的肉毒桿菌素有差異嗎？ → 每種產品的作用時間、擴散程度、持續時間不同。

### antiaging/filler

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 필러 | 20-40분 | 마취 크림 또는 신경 차단 마취 | 즉시 ~ 3일 (부위에 따라 상이) | 즉각적 효과, 6-24개월 유지 (제품에 따라 상이) |
| en | Filler | 20-40 minutes | Topical anesthetic cream or nerve block | Immediate to 3 days (varies by area) | Immediate results, lasting 6-24 months (varies by product) |
| ja | フィラー | 20-40分 | 麻酔クリームまたは神経ブロック麻酔 | すぐに~3日（部位により異なります） | 即時の効果、6-24ヶ月持続（製品により異なります） |
| zh | 玻尿酸 | 20-40分钟 | 麻醉霜或神经阻滞麻醉 | 即刻 ~ 3天（依部位而异） | 即刻见效，维持6-24个月（依产品而异） |
| zh-TW | 玻尿酸 | 20-40分鐘 | 麻醉藥膏或神經阻斷麻醉 | 立即 ~ 3天（依部位而異） | 立即見效，維持6-24個月（依產品而異） |

- 대상 부위(ko): 이마, 관자놀이, 코, 앞광대, 팔자, 옆볼, 턱끝, 애교살, 입술, 눈썹
- 적합(ko idealFor): 꺼진 볼륨을 채우고 싶은 분 / 팔자주름, 입가 주름이 고민인 분 / 코, 턱 윤곽을 높이고 싶은 분 / 입술 볼륨을 원하는 분
- 주의(ko cautions): 시술 후 멍, 붓기가 있을 수 있음 / 시술 부위 마사지, 압박 금지 / 과격한 운동, 사우나 3일간 피하기 / 드물게 혈관 폐색 위험 있어 숙련된 의료진 시술 필수
- FAQ(ko): Q 필러가 뭉치거나 부자연스러워지지 않나요? → 적정량 + 숙련된 의료진 시술이면 자연스럽습니다. | Q 필러 시술 후 바로 일상생활이 가능한가요? → 대부분 즉시 일상 복귀 가능합니다. | Q 필러를 녹일 수 있나요? → 네, 히알루로니다제로 안전하게 녹일 수 있습니다.
- FAQ(en): Q Can filler clump or look unnatural? → An appropriate amount placed by experienced medical staff looks natural. | Q Can I return to daily life right after filler? → Most people can return to daily life immediately. | Q Can filler be dissolved? → Yes, hyaluronic acid filler can be dissolved safely with hyaluronidase.
- FAQ(ja): Q フィラーが固まったり不自然になりませんか？ → 適正量＋熟練した医療スタッフの施術であれば自然です。 | Q フィラー施術後すぐに日常生活が可能ですか？ → ほとんどの方がすぐに日常復帰可能です。 | Q フィラーは溶かせますか？ → はい、ヒアルロニダーゼで安全に溶かせます。
- FAQ(zh): Q 玻尿酸会结块或不自然吗？ → 适量+熟练医师可保持自然。 | Q 玻尿酸注射后可以立即恢复日常吗？ → 大多数可即刻恢复日常。 | Q 玻尿酸可以溶解吗？ → 可以用玻尿酸酶安全溶解。
- FAQ(zh-TW): Q 玻尿酸會結塊或變得不自然嗎？ → 適當劑量加上熟練的醫療人員就會自然。 | Q 玻尿酸治療後可以立即恢復日常生活嗎？ → 大多數情況可以立即恢復日常生活。 | Q 玻尿酸可以溶解嗎？ → 可以，能以玻尿酸分解酶安全溶解。

### antiaging/skinbooster

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 스킨부스터 | 30-45분 | 마취 크림 | 1-3일 (미세 주사 자국) | 2-4주 후 효과, 3-4회 코스 권장 |
| en | Skin Booster | 30-45 minutes | Topical anesthetic cream | 1-3 days (micro-needle marks) | Results after 2-4 weeks, with a course of 3-4 sessions recommended |
| ja | スキンブースター | 30-45分 | 麻酔クリーム | 1-3日（微細な注射跡） | 2-4週後に効果、3-4回のコースを推奨 |
| zh | 水光针 | 30-45分钟 | 麻醉霜 | 1-3天（微针痕迹） | 2-4周后见效，建议3-4次为一疗程 |
| zh-TW | 水光針 | 30-45分鐘 | 麻醉藥膏 | 1-3天（細微針痕） | 2-4週後見效，建議3-4次為一個療程 |

- 대상 부위(ko): 얼굴 전체, 목, 손등
- 적합(ko idealFor): 피부 건조함, 수분 부족이 고민인 분 / 피부 탄력 저하, 잔주름이 고민인 분 / 칙칙한 피부톤, 생기 없는 피부가 고민인 분 / 레이저 시술 후 피부 재생을 원하는 분
- 주의(ko cautions): 시술 후 미세 주사 자국, 붉은기 가능 / 시술 당일 화장, 음주 피하기 / 자외선 차단 철저히 하기 / 2-4주 간격으로 3-4회 시술 권장
- FAQ(ko): Q 스킨부스터와 물광주사는 같은 건가요? → 비슷하지만 스킨부스터가 더 다양한 성분 포함. | Q 효과는 언제부터 나타나나요? → 직후 수분감 + 2~4주 후 탄력·광채 개선. | Q 어떤 제품이 좋은가요? → 피부 상태와 목적에 따라 상담 후 선택합니다.
- FAQ(en): Q Is a skin booster the same as a water-glow injection? → Similar, but a skin booster contains a wider range of ingredients. | Q When do the results appear? → Hydration right away + elasticity and glow after 2-4 weeks. | Q Which product is right for me? → Chosen through consultation, based on skin condition and goals.
- FAQ(ja): Q スキンブースターと水光注射は同じものですか？ → 似ていますが、スキンブースターはより多様な成分を含みます。 | Q 効果はいつから現れますか？ → 施術直後のうるおい＋2~4週後に弾力・ツヤの改善。 | Q どの製品が良いですか？ → 肌状態と目的に応じてカウンセリングで選択します。
- FAQ(zh): Q 皮肤助推剂和水光针一样吗？ → 相似但皮肤助推剂成分更多样。 | Q 什么时候开始见效？ → 即刻水润感 + 2~4周后弹力光泽改善。 | Q 哪种产品比较好？ → 依皮肤状态与目标经咨询选择。
- FAQ(zh-TW): Q Skin Booster（水光針）和一般的水光注射一樣嗎？ → 概念相似，但Skin Booster含有更多樣的成分。 | Q 效果從什麼時候開始出現？ → 治療後立即感受到水潤感，2~4週後彈性與光澤改善。 | Q 哪一種產品比較好？ → 依皮膚狀態與目的，經諮詢後選擇。

### antiaging/skincare

| locale | name | duration | anesthesia | recovery | results |
| --- | --- | --- | --- | --- | --- |
| ko | 스킨케어 | 60-90분 | 해당 없음 | 없음 (즉시 일상 복귀) | 즉각적인 피부톤 개선, 정기 관리 시 효과 극대화 |
| en | Skincare | 60-90분 | 해당 없음 | 없음 (즉시 일상 복귀) | 즉각적인 피부톤 개선, 정기 관리 시 효과 극대화 |
| ja | スキンケア | 60-90분 | 해당 없음 | 없음 (즉시 일상 복귀) | 즉각적인 피부톤 개선, 정기 관리 시 효과 극대화 |
| zh | 皮肤管理 | 60-90분 | 해당 없음 | 없음 (즉시 일상 복귀) | 즉각적인 피부톤 개선, 정기 관리 시 효과 극대화 |
| zh-TW | 皮膚管理 | 60-90분 | 해당 없음 | 없음 (즉시 일상 복귀) | 즉각적인 피부톤 개선, 정기 관리 시 효과 극대화 |

- 대상 부위(ko): 얼굴 전체, 목, 데콜테
- 적합(ko idealFor): 건조하고 푸석푸석한 피부 / 피부 탄력이 저하된 분 / 특별한 날 앞두고 피부 관리가 필요한 분 / 정기적인 피부 관리를 원하는 분
- 주의(ko cautions): 민감성 피부는 상담 후 프로그램 조정 가능 / 급성 피부 트러블이 있는 경우 상담 필요 / 시술 후 즉시 화장 가능
- FAQ(ko): Q 물톡스와 플라필의 차이점은 무엇인가요? → 물톡스는 수분 공급, 플라필은 피부 재생에 초점을 맞춥니다. | Q 얼마나 자주 받는 것이 좋은가요? → 2-4주 간격으로 정기 관리를 권장합니다. | Q 시술 후 바로 화장해도 되나요? → 네, 즉시 화장 가능합니다.
- FAQ(en): Q 물톡스와 플라필의 차이점은 무엇인가요? → 물톡스는 수분 공급, 플라필은 피부 재생에 초점을 맞춥니다. | Q 얼마나 자주 받는 것이 좋은가요? → 2-4주 간격으로 정기 관리를 권장합니다. | Q 시술 후 바로 화장해도 되나요? → 네, 즉시 화장 가능합니다.
- FAQ(ja): Q 물톡스와 플라필의 차이점은 무엇인가요? → 물톡스는 수분 공급, 플라필은 피부 재생에 초점을 맞춥니다. | Q 얼마나 자주 받는 것이 좋은가요? → 2-4주 간격으로 정기 관리를 권장합니다. | Q 시술 후 바로 화장해도 되나요? → 네, 즉시 화장 가능합니다.
- FAQ(zh): Q 물톡스와 플라필의 차이점은 무엇인가요? → 물톡스는 수분 공급, 플라필은 피부 재생에 초점을 맞춥니다. | Q 얼마나 자주 받는 것이 좋은가요? → 2-4주 간격으로 정기 관리를 권장합니다. | Q 시술 후 바로 화장해도 되나요? → 네, 즉시 화장 가능합니다.
- FAQ(zh-TW): Q 물톡스와 플라필의 차이점은 무엇인가요? → 물톡스는 수분 공급, 플라필은 피부 재생에 초점을 맞춥니다. | Q 얼마나 자주 받는 것이 좋은가요? → 2-4주 간격으로 정기 관리를 권장합니다. | Q 시술 후 바로 화장해도 되나요? → 네, 즉시 화장 가능합니다.

### laser 카테고리 (LASER_CATEGORIES; 소요 시간 등은 각 src/app/[locale]/laser/*/layout.tsx serviceData — ko)

- pigmentation: Pigmentation & Melasma — 기미, 잡티, 주근깨, 검버섯 등 색소 병변 치료 난치성 기미도 리브의 3단계 시스템으로 효과적 개선
- vascular: Redness & Vascular — 안면홍조, 모세혈관 확장, 주사비 치료 듀얼 파장으로 홍조와 혈관 병변을 효과적으로 개선
- skintone: Skin Tone Enhancement — 칙칙한 피부톤, 피부 투명감, 전체 화이트닝 울블랑과 토닝의 시너지로 맑고 투명한 피부톤
- hair-removal: Premium Hair Removal — 얼굴, 겨드랑이, 팔다리, 비키니라인 영구 제모 755nm 알렉산드라이트 - 제모의 골드 스탠다드
- tattoo: Tattoo Removal — 흑색, 컬러, 아이라인, 눈썹 문신 제거 피코세컨드 기술로 깨끗한 문신 제거
- layout serviceData(ko): pigmentation 20-40분·마취 크림(선택)·3-7일(미세 딱지 가능) / vascular 15-30분 / skintone 30-45분·즉시 일상 복귀 / hair-removal 15-60분(부위에 따라)·즉시 일상 복귀 / tattoo 15-30분·마취 크림(30분)·3-7일(미세 딱지)
- laser/tattoo (en, Tattoo Removal) FAQ: Q Can tattoos be completely removed? → Most tattoos can be removed over 90%. Complete removal depends on ink color, depth, tattoo age, and skin type. Black ink removes best, while green and blue may require more sessions. We'll provide accurate estimates during consultation. | Q How painful is tattoo removal? → Pain levels range from 'snapping rubber band' to 'pinching' depending on the individual. Lucas pico laser has 1000x shorter pulse than traditional nanosecond lasers, reducing heat buildup and pain. Numbing cream can be applied to minimize discomfort. | Q Will there be scarring? → Pico laser minimizes heat damage, making scarring risk very low. With proper energy settings and treatment intervals, most recover without scarring. Following post-care guidelines (sun protection, no scab picking) ensures clean healing. | Q Are older or newer tattoos easier to remove? → Generally, older tattoos remove easier as the body's immune system naturally removes some ink particles over time. However, new tattoos can also be effectively removed with pico laser, and their clearer ink can make laser targeting easier. | Q Can all ink colors be removed? → Most colors can be removed. Lucas pico laser offers multiple wavelengths (532nm, 755nm, 1064nm) to address various colors. | Q Why is the treatment interval 6-8 weeks? → Laser-shattered ink particles are absorbed by macrophages and discharged through the lymphatic system. This natural healing process takes 4-6 weeks, and the next treatment should only proceed after complete skin recovery. Too-frequent treatments increase skin damage and scarring risk.
- laser/tattoo (ja, タトゥー除去) FAQ: Q タトゥー除去は完全に可能ですか？ → ほとんどのタトゥーは90%以上除去可能です。完全除去可否はインク色、深さ、タトゥーの年数、肌タイプなどにより異なります。黒インクが最もよく除去され、緑や青はより多くの回数が必要な場合があります。相談時に正確な予想をご案内します。 | Q タトゥー除去はどれくらい痛いですか？ → 痛みの程度は「輪ゴムでパチパチ弾く感覚」から「チクチクする感覚」まで個人差があります。Lucasピコレーザーは従来のナノ秒レーザーよりパルス時間が1000倍短く熱蓄積が少なく、その分痛みも軽減されます。必要時は麻酔クリームを塗布して痛みを最小化します。 | Q 施術後に傷跡が残りますか？ → ピコレーザーは熱損傷を最小化し傷跡リスクが非常に低いです。適切なエネルギー設定と施術間隔を守ればほとんど傷跡なく回復します。施術後のケア指針（紫外線遮断、かさぶた除去禁止など）をよく守っていただければきれいな肌が期待できます。 | Q 古いタトゥーと新しいタトゥー、どちらがよく消えますか？ → 一般的に古いタトゥーがよく消えます。時間が経つにつれ私たちの体の免疫システムが一部のインク粒子を自然に除去するためです。しかし新しいタトゥーもピコレーザーで効果的に除去でき、むしろインクが鮮明に残っているためレーザーターゲティングが容易な利点もあります。 | Q すべての色のタトゥーが除去可能ですか？ → ほとんどの色は除去可能です。Lucasピコレーザーは多重波長（532nm、755nm、1064nm）を提供し様々な色に対応します。 | Q 施術間隔がなぜ6-8週なのですか？ → レーザーで粉砕されたインク粒子は私たちの体のマクロファージが吸収しリンパ系を通じて排出します。この自然治癒過程に4-6週が必要で、皮膚が完全に回復した後に次の施術を行う必要があります。あまりに短い間隔で施術すると皮膚損傷と傷跡リスクが高まります。
- laser/tattoo (zh, 纹身去除) FAQ: Q 纹身能完全去除吗？ → 大多数纹身可以去除90%以上。能否完全去除取决于墨水颜色、深度、纹身年龄、肤质等因素。黑色墨水最容易去除，绿色和蓝色可能需要更多次数。咨询时会给出准确的预估。 | Q 纹身去除有多痛？ → 疼痛程度从'橡皮筋弹的感觉'到'刺痛感'因人而异。Lucas皮秒激光的脉冲时间比传统纳秒激光短1000倍，热量积累少，疼痛也相应减轻。必要时涂抹麻醉膏来最小化疼痛。 | Q 治疗后会留疤吗？ → 皮秒激光最小化热损伤，疤痕风险非常低。遵循适当的能量设置和治疗间隔，大多数情况下可以无疤痕恢复。遵循治疗后护理指南（防晒、不剥结痂等），可期待干净的皮肤。 | Q 旧纹身和新纹身，哪个更容易去除？ → 通常旧纹身更容易去除。随着时间推移，我们身体的免疫系统会自然清除部分墨水颗粒。但新纹身也可以用皮秒激光有效去除，而且墨水清晰残留，激光靶向更容易也是优点。 | Q 所有颜色的纹身都能去除吗？ → 大多数颜色都可以去除。Lucas皮秒激光提供多波长（532nm、755nm、1064nm）来应对各种颜色。 | Q 治疗间隔为什么是6-8周？ → 激光粉碎的墨水颗粒由我们身体的巨噬细胞吸收，通过淋巴系统排出。这个自然愈合过程需要4-6周，皮肤完全恢复后才能进行下次治疗。间隔太短会增加皮肤损伤和疤痕风险。
- laser/tattoo (zh-TW, 紋身去除) FAQ: Q 紋身能完全去除嗎？ → 大多數紋身可以去除90%以上。能否完全去除取決於墨水顏色、深度、紋身年齡、膚質等因素。黑色墨水最容易去除，綠色和藍色可能需要更多次數。諮詢時會給出準確的預估。 | Q 紋身去除有多痛？ → 疼痛程度從'橡皮筋彈的感覺'到'刺痛感'因人而異。Lucas皮秒激光的脈衝時間比傳統納秒激光短1000倍，熱量積累少，疼痛也相應減輕。必要時塗抹麻醉膏來最小化疼痛。 | Q 治療後會留疤嗎？ → 皮秒激光最小化熱損傷，疤痕風險非常低。遵循適當的能量設置和治療間隔，大多數情況下可以無疤痕恢復。遵循治療後護理指南（防曬、不剝結痂等），可期待乾淨的皮膚。 | Q 舊紋身和新紋身，哪個更容易去除？ → 通常舊紋身更容易去除。隨著時間推移，我們身體的免疫系統會自然清除部分墨水顆粒。但新紋身也可以用皮秒激光有效去除，而且墨水清晰殘留，激光靶向更容易也是優點。 | Q 所有顏色的紋身都能去除嗎？ → 大多數顏色都可以去除。Lucas皮秒激光提供多波長（532nm、755nm、1064nm）來應對各種顏色。 | Q 治療間隔為什麼是6-8周？ → 激光粉碎的墨水顆粒由我們身體的巨噬細胞吸收，通過淋巴系統排出。這個自然癒合過程需要4-6周，皮膚完全恢復後才能進行下次治療。間隔太短會增加皮膚損傷和疤痕風險。
- laser/pigmentation (en, Pigmentation Treatment) FAQ: Q Can melasma be completely cured? → Melasma should be approached as 'management' rather than 'cure'. After significant improvement with intensive treatment, regular maintenance and sun protection minimize recurrence. LIV's 3-stage system includes both treatment and maintenance. | Q Should I choose pico laser or toning? → It depends on your goals. Stubborn melasma or deep pigmentation requires pico laser intensive treatment, while mild pigmentation or maintenance suits toning. Often, a combination protocol of pico treatment followed by toning maintenance is most effective. | Q Can pigmentation get darker after laser? → Temporary post-inflammatory hyperpigmentation (PIH) can occur. This naturally improves within 2-4 weeks and can be prevented with thorough sun protection. LIV provides comprehensive post-treatment care guidance. | Q Can I get pigmentation laser during pregnancy? → Laser treatments are not recommended during pregnancy or breastfeeding. We recommend treatment after completing pregnancy and breastfeeding. During pregnancy, focus on sun protection and moisturizing.
- laser/pigmentation (ja, 色素治療) FAQ: Q シミは完治可能ですか？ → シミは完治より「管理」の概念でアプローチする必要があります。集中治療で大きく改善した後、定期的な維持管理と紫外線遮断で再発を最小化します。LIVの3段階システムは治療と維持管理の両方を含みます。 | Q ピコレーザーとトーニング、どちらが良いですか？ → 目的によって異なります。難治性シミや深い色素はピコレーザーで集中治療し、軽微な色素や維持管理はトーニングが適しています。多くの場合、ピコ治療後トーニングで維持する複合プロトコルが効果的です。 | Q レーザー後に色素が濃くなることもありますか？ → 一時的な色素沈着（PIH）が発生する可能性があります。これは2-4週以内に自然に改善され、紫外線遮断を徹底すれば予防できます。LIVでは施術後のケア案内を徹底しています。 | Q 妊娠中でも色素レーザーは可能ですか？ → 妊娠中や授乳中はレーザー施術をお勧めしません。出産および授乳完了後の施術をお勧めします。妊娠中は紫外線遮断と保湿に集中してください。
- laser/pigmentation (zh, 色素治疗) FAQ: Q 黄褐斑可以根治吗？ → 黄褐斑需要以'管理'而非根治的理念来对待。集中治疗后大幅改善，通过定期维护和防晒将复发降到最低。LIV的三阶段系统包含治疗和维护两个环节。 | Q 皮秒激光和调光，哪个更好？ → 取决于目的。顽固性黄褐斑或深层色素用皮秒激光集中治疗，轻微色素或维护则调光更合适。很多情况下，皮秒治疗后用调光维护的复合方案最为有效。 | Q 激光后色素会加深吗？ → 可能出现暂时性色素沉着（PIH）。这会在2-4周内自然改善，做好防晒可以预防。LIV会彻底做好术后护理指导。 | Q 怀孕期间可以做色素激光吗？ → 不建议在怀孕或哺乳期间做激光治疗。建议在分娩和哺乳结束后进行治疗。怀孕期间请专注于防晒和保湿。
- laser/pigmentation (zh-TW, 色素治療) FAQ: Q 黃褐斑可以根治嗎？ → 黃褐斑需要以'管理'而非根治的理念來對待。集中治療後大幅改善，通過定期維護和防曬將復發降到最低。LIV的三階段系統包含治療和維護兩個環節。 | Q 皮秒激光和調光，哪個更好？ → 取決於目的。頑固性黃褐斑或深層色素用皮秒激光集中治療，輕微色素或維護則調光更合適。很多情況下，皮秒治療後用調光維護的複合方案最為有效。 | Q 激光後色素會加深嗎？ → 可能出現暫時性色素沉著（PIH）。這會在2-4周內自然改善，做好防曬可以預防。LIV會徹底做好術後護理指導。 | Q 懷孕期間可以做色素激光嗎？ → 不建議在懷孕或哺乳期間做激光治療。建議在分娩和哺乳結束後進行治療。懷孕期間請專注於防曬和保溼。
- laser/vascular (en, Vascular Treatment) FAQ: Q Will I see results immediately after redness treatment? → Redness may appear temporarily worse immediately after treatment. This is a normal reaction and subsides within 2-3 days. Actual effects gradually appear from 3-4 weeks and progressively improve with repeated sessions. | Q Can redness be completely eliminated? → Results vary depending on the cause and severity of redness. Most cases can expect 50-80% improvement, with the goal of significantly reducing symptoms rather than complete elimination. Maintenance treatments help sustain results. | Q Can rosacea be treated with laser? → Vascular dilation symptoms of rosacea can be effectively treated with laser. However, rosacea is a complex skin condition, so combining laser treatment with skincare and medication is most effective. | Q Are there post-treatment precautions? → Avoid saunas, alcohol, and intense exercise for 2-3 days after treatment. Apply thorough sun protection and avoid irritating cosmetics. Temporary redness or swelling at the treatment site is normal.
- laser/vascular (ja, 血管治療) FAQ: Q 赤ら顔治療後すぐに効果が出ますか？ → 施術直後は一時的に赤みがひどく見えることがあります。これは正常な反応で、2-3日以内に落ち着きます。実際の効果は3-4週後から徐々に現れ、繰り返し施術により段階的に改善されます。 | Q 赤みは完全になくなりますか？ → 赤みの原因と深刻度によって異なります。ほとんどの場合50-80%改善が期待でき、完全に無くすよりは症状を大幅に緩和させることが目標です。維持管理施術で効果を持続させることができます。 | Q 酒さもレーザーで治療できますか？ → 酒さの血管拡張症状はレーザーで効果的に治療できます。ただし酒さは複合的な皮膚疾患なので、レーザー治療とともにスキンケア、薬物治療を併用することが効果的です。 | Q 施術後の注意点はありますか？ → 施術後2-3日間はサウナ、飲酒、激しい運動を避けてください。紫外線遮断を徹底し、刺激的な化粧品の使用を控えてください。施術部位が一時的に赤くなったり腫れることは正常です。
- laser/vascular (zh, 血管治疗) FAQ: Q 红血丝治疗后马上见效吗？ → 治疗后可能暂时看起来更红。这是正常反应，2-3天内会消退。实际效果会在3-4周后逐渐显现，随着重复治疗会逐步改善。 | Q 红血丝能完全消除吗？ → 取决于发红的原因和严重程度。大多数情况下可期待50-80%的改善，目标是大幅缓解症状而非完全消除。通过维护治疗可以保持效果。 | Q 酒糟鼻也能用激光治疗吗？ → 酒糟鼻的血管扩张症状可以用激光有效治疗。但酒糟鼻是复杂的皮肤病，激光治疗配合皮肤护理、药物治疗效果更好。 | Q 治疗后有什么注意事项？ → 治疗后2-3天内避免桑拿、饮酒、剧烈运动。做好防晒，避免使用刺激性化妆品。治疗部位暂时发红或肿胀是正常的。
- laser/vascular (zh-TW, 血管治療) FAQ: Q 紅血絲治療後馬上見效嗎？ → 治療後可能暫時看起來更紅。這是正常反應，2-3天內會消退。實際效果會在3-4周後逐漸顯現，隨著重複治療會逐步改善。 | Q 紅血絲能完全消除嗎？ → 取決於發紅的原因和嚴重程度。大多數情況下可期待50-80%的改善，目標是大幅緩解症狀而非完全消除。通過維護治療可以保持效果。 | Q 酒糟鼻也能用激光治療嗎？ → 酒糟鼻的血管擴張症狀可以用激光有效治療。但酒糟鼻是複雜的皮膚病，激光治療配合皮膚護理、藥物治療效果更好。 | Q 治療後有什麼注意事項？ → 治療後2-3天內避免桑拿、飲酒、劇烈運動。做好防曬，避免使用刺激性化妝品。治療部位暫時發紅或腫脹是正常的。

## 4b. 레이저 상세 페이지의 추가 사실 (treatments.laser.*.detail 메시지 + LASER_CATEGORIES.treatmentProtocol — 회수·간격·유형별 안내가 여기 있다)


### laser/tattoo detail (en)

- picoTech.badge: Picosecond Technology
- picoTech.title: Why Pico Laser?
- picoTech.description1: Traditional nanosecond (10⁻⁹s) lasers used photothermal effect to break down ink. Picosecond (10⁻¹²s) lasers deliver 1000x faster pulses creating photoacoustic effects.
- picoTech.description2: This shockwave shatters ink particles to dust-level size, allowing easy removal by the body's immune system.
- picoTech.benefits[0].title: Fewer Sessions
- picoTech.benefits[0].desc: Efficient removal with fine particle breakdown
- picoTech.benefits[1].title: Less Heat Damage
- picoTech.benefits[1].desc: Short pulse protects surrounding tissue
- picoTech.benefits[2].title: Fewer Side Effects
- picoTech.benefits[2].desc: Minimized risk of scarring and pigment changes
- picoTech.illustration.title: Ink Particle Shattering Mechanism
- picoTech.illustration.nanosecond: Nanosecond (10⁻⁹s)
- picoTech.illustration.nanosecondDevice: Traditional Q-Switch Laser
- picoTech.illustration.picosecond: Picosecond (10⁻¹²s)
- picoTech.illustration.picosecondDevice: Lucas Laser
- picoTech.illustration.before: Before
- picoTech.illustration.after: After
- picoTech.illustration.photothermal: Photothermal
- picoTech.illustration.photothermalResult: Large → Medium particles
- picoTech.illustration.photoacoustic: Photoacoustic
- picoTech.illustration.photoacousticResult: Large → Fine particles ✓
- colorWavelength.badge: Multi-Wavelength System
- colorWavelength.title: Targeting All Colors
- colorWavelength.subtitle: Lucas pico laser effectively breaks down various ink colors with multiple wavelengths
- colorWavelength.illustrationTitle: Optimal Wavelength by Ink Color
- colorWavelength.colors.black.name: Black
- colorWavelength.colors.black.wavelength: 1064nm
- colorWavelength.colors.black.difficulty: Easiest
- colorWavelength.colors.red.name: Red
- colorWavelength.colors.red.wavelength: 532nm
- colorWavelength.colors.red.difficulty: Relatively Easy
- colorWavelength.colors.blue.name: Blue
- colorWavelength.colors.blue.wavelength: 755nm
- colorWavelength.colors.blue.difficulty: Somewhat Difficult
- colorWavelength.colors.green.name: Green
- colorWavelength.colors.green.wavelength: 755nm
- colorWavelength.colors.green.difficulty: Most Difficult
- colorWavelength.lucasNote: Lucas: Multi-wavelength for all color targeting
- colorWavelength.wavelengths[0].wavelength: 1064nm
- colorWavelength.wavelengths[0].colors: Black, Dark Blue, Brown
- colorWavelength.wavelengths[0].note: Deepest penetration, most tattoos
- colorWavelength.wavelengths[1].wavelength: 755nm
- colorWavelength.wavelengths[1].colors: Blue, Green
- colorWavelength.wavelengths[1].note: Medium depth, special color targeting
- colorWavelength.wavelengths[2].wavelength: 532nm
- colorWavelength.wavelengths[2].colors: Red, Orange, Yellow
- colorWavelength.wavelengths[2].note: Epidermal layer, bright colors
- tattooTypes.badge: Tattoo Type Guide
- tattooTypes.title: What Type of Tattoo Do You Want to Remove?
- tattooTypes.subtitle: Treatment sessions and difficulty vary by tattoo type and characteristics
- tattooTypes.estimatedSessions: Estimated Sessions
- tattooTypes.difficulty.easy: Relatively Easy
- tattooTypes.difficulty.medium: Medium
- tattooTypes.difficulty.hard: Somewhat Difficult
- tattooTypes.types[0].type: Amateur Tattoo
- tattooTypes.types[0].description: Non-professional tattoos with shallow ink placement, relatively easy to remove.
- tattooTypes.types[0].sessions: 3-5 sessions
- tattooTypes.types[0].notes: Mostly single-color tattoos with pen ink or india ink
- tattooTypes.types[1].type: Professional Tattoo (B&W)
- tattooTypes.types[1].description: Professional black and white tattoos with deep, uniform ink placement.
- tattooTypes.types[1].sessions: 6-10 sessions
- tattooTypes.types[1].notes: Black ink responds best to laser
- tattooTypes.types[2].type: Professional Tattoo (Color)
- tattooTypes.types[2].description: Multi-colored tattoos requiring different wavelengths for each color.
- tattooTypes.types[2].sessions: 8-15+ sessions
- tattooTypes.types[2].notes: Green and blue require more sessions
- tattooTypes.types[3].type: Permanent Makeup
- tattooTypes.types[3].description: Semi-permanent makeup on eyebrows, eyeliner, lips. Shallower than regular tattoos.
- tattooTypes.types[3].sessions: 3-6 sessions
- tattooTypes.types[3].notes: Special protective equipment for eye area
- tattooTypes.types[4].type: Traumatic Tattoo
- tattooTypes.types[4].description: Foreign material embedded from accidents. Asphalt, graphite in skin.
- tattooTypes.types[4].sessions: 4-8 sessions
- tattooTypes.types[4].notes: Varies by depth and extent
- tattooTypes.types[5].type: Cover-up Tattoo
- tattooTypes.types[5].description: Tattoo drawn over existing tattoo. Thicker ink layers make removal difficult.
- tattooTypes.types[5].sessions: 10-20+ sessions
- tattooTypes.types[5].notes: New tattoo possible after staged removal
- process.badge: Treatment Process
- process.title: Tattoo Removal Process
- process.steps[0].title: Consultation & Assessment
- process.steps[0].description: Evaluate tattoo size, color, depth, skin type and provide expected sessions and cost guidance.
- process.steps[0].duration: About 30 min
- process.steps[1].title: Pico Laser Treatment
- process.steps[1].description: Lucas pico laser finely shatters ink particles. Treatment time varies by size.
- process.steps[1].duration: 15-60 min
- process.steps[2].title: Recovery Period
- process.steps[2].description: Skin naturally discharges shattered ink. Scabbing and mild swelling may occur.
- process.steps[2].duration: 2-4 weeks
- process.steps[3].title: Next Session
- process.steps[3].description: Repeat treatment at 6-8 week intervals. Tattoo visibly fades with each session.
- process.steps[3].duration: 6-8 week interval
- lucas.title: Lucas
- lucas.subtitle: The New Standard in Picosecond Tattoo Removal
- lucas.specs.pulseDuration.label: Pulse Duration
- lucas.specs.pulseDuration.value: 450 Picoseconds
- lucas.specs.wavelength.label: Wavelength
- lucas.specs.wavelength.value: 532 / 755 / 1064nm
- lucas.specs.repetitionRate.label: Repetition Rate
- lucas.specs.repetitionRate.value: Up to 10Hz
- lucas.specs.energy.label: Energy
- lucas.specs.energy.value: Up to 1.8J
- lucas.strengths.title: Lucas Advantages
- lucas.strengths.items[0]: Multi-wavelength for all color response
- lucas.strengths.items[1]: 450ps ultra-short pulse minimizes heat damage
- lucas.strengths.items[2]: Fractional lens also treats scars
- precautions.before.title: Before Treatment
- precautions.before.items[0]: Avoid excessive sun exposure 2 weeks before treatment
- precautions.before.items[1]: Avoid irritating products on treatment area
- precautions.before.items[2]: Inform us of any skin conditions (inflammation, wounds)
- precautions.before.items[3]: Disclose medications (photosensitizing drugs, etc.)
- precautions.after.title: After Treatment
- precautions.after.items[0]: Apply prescribed ointment as directed
- precautions.after.items[1]: Never remove scabs artificially
- precautions.after.items[2]: Essential sunscreen (SPF 30+)
- precautions.after.items[3]: Avoid sauna and intense exercise for 1 week

### laser/tattoo detail (ja)

- picoTech.badge: ピコ秒技術
- picoTech.title: なぜピコレーザーなのか？
- picoTech.description1: 従来のナノ秒(10⁻⁹秒)レーザーは熱作用(Photothermal)でインクを分解していました。ピコ秒(10⁻¹²秒)レーザーは1000倍速いパルスで光音響作用(Photoacoustic)を起こします。
- picoTech.description2: この衝撃波がインク粒子を微細な粉塵レベルまで粉砕し、私たちの体の免疫システムが簡単に除去できるようにします。
- picoTech.benefits[0].title: より少ない施術回数
- picoTech.benefits[0].desc: 微細粒子粉砕で効率的除去
- picoTech.benefits[1].title: より少ない熱損傷
- picoTech.benefits[1].desc: 短いパルスで周辺組織保護
- picoTech.benefits[2].title: より少ない副作用
- picoTech.benefits[2].desc: 傷跡、色素変化リスク最小化
- picoTech.illustration.title: インク粒子粉砕メカニズム
- picoTech.illustration.nanosecond: ナノ秒 (10⁻⁹秒)
- picoTech.illustration.nanosecondDevice: 従来Q-Switchレーザー
- picoTech.illustration.picosecond: ピコ秒 (10⁻¹²秒)
- picoTech.illustration.picosecondDevice: Lucasレーザー
- picoTech.illustration.before: Before
- picoTech.illustration.after: After
- picoTech.illustration.photothermal: 熱作用 (Photothermal)
- picoTech.illustration.photothermalResult: 大粒子 → 中粒子
- picoTech.illustration.photoacoustic: 光音響作用 (Photoacoustic)
- picoTech.illustration.photoacousticResult: 大粒子 → 微細粒子 ✓
- colorWavelength.badge: 多重波長システム
- colorWavelength.title: すべての色をターゲティング
- colorWavelength.subtitle: Lucasピコレーザーは多重波長で様々な色のインクを効果的に分解します
- colorWavelength.illustrationTitle: インク色別最適波長
- colorWavelength.colors.black.name: 黒
- colorWavelength.colors.black.wavelength: 1064nm
- colorWavelength.colors.black.difficulty: 最も簡単
- colorWavelength.colors.red.name: 赤
- colorWavelength.colors.red.wavelength: 532nm
- colorWavelength.colors.red.difficulty: 比較的簡単
- colorWavelength.colors.blue.name: 青
- colorWavelength.colors.blue.wavelength: 755nm
- colorWavelength.colors.blue.difficulty: やや難しい
- colorWavelength.colors.green.name: 緑
- colorWavelength.colors.green.wavelength: 755nm
- colorWavelength.colors.green.difficulty: 最も難しい
- colorWavelength.lucasNote: Lucas: 多重波長ですべての色をターゲティング可能
- colorWavelength.wavelengths[0].wavelength: 1064nm
- colorWavelength.wavelengths[0].colors: 黒、濃い青、茶色
- colorWavelength.wavelengths[0].note: 最も深い浸透、ほとんどのタトゥー
- colorWavelength.wavelengths[1].wavelength: 755nm
- colorWavelength.wavelengths[1].colors: 青、緑
- colorWavelength.wavelengths[1].note: 中間深度、特殊色ターゲット
- colorWavelength.wavelengths[2].wavelength: 532nm
- colorWavelength.wavelengths[2].colors: 赤、オレンジ、黄色
- colorWavelength.wavelengths[2].note: 表皮層、明るい色専用
- tattooTypes.badge: タトゥータイプ別ガイド
- tattooTypes.title: どんなタトゥーを除去したいですか？
- tattooTypes.subtitle: タトゥーの種類と特性により治療回数と難易度が異なります
- tattooTypes.estimatedSessions: 予想回数
- tattooTypes.difficulty.easy: 比較的簡単
- tattooTypes.difficulty.medium: 中間
- tattooTypes.difficulty.hard: やや難しい
- tattooTypes.types[0].type: アマチュアタトゥー
- tattooTypes.types[0].description: 非専門家が施術したタトゥー。インクが浅く入っているため除去が比較的容易です。
- tattooTypes.types[0].sessions: 3-5回
- tattooTypes.types[0].notes: 墨、ペンインクなど単色タトゥーがほとんど
- tattooTypes.types[1].type: プロタトゥー（白黒）
- tattooTypes.types[1].description: プロのタトゥーアーティストが施術した白黒タトゥー。インクが深く均一に入っています。
- tattooTypes.types[1].sessions: 6-10回
- tattooTypes.types[1].notes: 黒インクはレーザー反応が最も良い
- tattooTypes.types[2].type: プロタトゥー（カラー）
- tattooTypes.types[2].description: 複数の色が使用されたカラータトゥー。色別に異なる波長が必要です。
- tattooTypes.types[2].sessions: 8-15回以上
- tattooTypes.types[2].notes: 緑、青はより多くの回数が必要
- tattooTypes.types[3].type: アートメイク
- tattooTypes.types[3].description: 眉、アイライン、唇などのアートメイク。一般タトゥーより浅く施術されています。
- tattooTypes.types[3].sessions: 3-6回
- tattooTypes.types[3].notes: 目元施術時は特殊保護具使用
- tattooTypes.types[4].type: 外傷性タトゥー
- tattooTypes.types[4].description: 事故による異物沈着。アスファルト、黒鉛などが皮膚に埋まった場合。
- tattooTypes.types[4].sessions: 4-8回
- tattooTypes.types[4].notes: 深さと範囲により異なる
- tattooTypes.types[5].type: カバーアップタトゥー
- tattooTypes.types[5].description: 既存タトゥーの上に重ねたタトゥー。インク層が厚く除去が難しいです。
- tattooTypes.types[5].sessions: 10-20回以上
- tattooTypes.types[5].notes: 段階的除去後新しいタトゥー可能
- process.badge: 治療プロセス
- process.title: タトゥー除去プロセス
- process.steps[0].title: 相談＆評価
- process.steps[0].description: タトゥーのサイズ、色、深さ、肌タイプを評価し、予想治療回数と費用をご案内します。
- process.steps[0].duration: 約30分
- process.steps[1].title: ピコレーザー施術
- process.steps[1].description: Lucasピコレーザーでインク粒子を微細に粉砕します。施術時間はサイズにより異なります。
- process.steps[1].duration: 15-60分
- process.steps[2].title: 回復期間
- process.steps[2].description: 皮膚が粉砕されたインクを自然に排出します。かさぶた、軽い腫れが現れることがあります。
- process.steps[2].duration: 2-4週
- process.steps[3].title: 次回施術
- process.steps[3].description: 6-8週間隔で繰り返し施術。毎回タトゥーが薄くなることを確認できます。
- process.steps[3].duration: 6-8週間隔
- lucas.title: Lucas
- lucas.subtitle: ピコ秒タトゥー除去の新しい基準
- lucas.specs.pulseDuration.label: パルス持続時間
- lucas.specs.pulseDuration.value: 450ピコ秒
- lucas.specs.wavelength.label: 波長
- lucas.specs.wavelength.value: 532 / 755 / 1064nm
- lucas.specs.repetitionRate.label: 繰り返し率
- lucas.specs.repetitionRate.value: 最大10Hz
- lucas.specs.energy.label: エネルギー
- lucas.specs.energy.value: 最大1.8J
- lucas.strengths.title: Lucasの強み
- lucas.strengths.items[0]: 多重波長ですべての色に対応
- lucas.strengths.items[1]: 450ps超短波パルスで熱損傷最小化
- lucas.strengths.items[2]: フラクショナルレンズで傷跡治療も可能
- precautions.before.title: 施術前
- precautions.before.items[0]: 施術2週前から過度な日光露出を避ける
- precautions.before.items[1]: 施術部位に刺激的な製品の使用を控える
- precautions.before.items[2]: 皮膚状態（炎症、傷）があれば事前に伝える
- precautions.before.items[3]: 服用中の薬（光過敏性誘発薬など）を告知
- precautions.after.title: 施術後
- precautions.after.items[0]: 処方された軟膏を指示通りに塗布
- precautions.after.items[1]: かさぶたは絶対に人為的に剥がさない
- precautions.after.items[2]: 日焼け止め必須（SPF 30以上）
- precautions.after.items[3]: 1週間サウナ、激しい運動を避ける

### laser/tattoo detail (zh)

- picoTech.badge: 皮秒技术
- picoTech.title: 为什么选择皮秒激光？
- picoTech.description1: 传统纳秒(10⁻⁹秒)激光通过热作用(Photothermal)分解墨水。皮秒(10⁻¹²秒)激光以快1000倍的脉冲产生光声作用(Photoacoustic)。
- picoTech.description2: 这种冲击波将墨水颗粒粉碎到微尘级别，使我们身体的免疫系统能够轻松清除。
- picoTech.benefits[0].title: 更少的治疗次数
- picoTech.benefits[0].desc: 微粒粉碎实现高效清除
- picoTech.benefits[1].title: 更少的热损伤
- picoTech.benefits[1].desc: 短脉冲保护周围组织
- picoTech.benefits[2].title: 更少的副作用
- picoTech.benefits[2].desc: 最大限度降低疤痕、色素变化风险
- picoTech.illustration.title: 墨水颗粒粉碎机制
- picoTech.illustration.nanosecond: 纳秒 (10⁻⁹秒)
- picoTech.illustration.nanosecondDevice: 传统Q-Switch激光
- picoTech.illustration.picosecond: 皮秒 (10⁻¹²秒)
- picoTech.illustration.picosecondDevice: Lucas激光
- picoTech.illustration.before: Before
- picoTech.illustration.after: After
- picoTech.illustration.photothermal: 热作用 (Photothermal)
- picoTech.illustration.photothermalResult: 大颗粒 → 中颗粒
- picoTech.illustration.photoacoustic: 光声作用 (Photoacoustic)
- picoTech.illustration.photoacousticResult: 大颗粒 → 微小颗粒 ✓
- colorWavelength.badge: 多波长系统
- colorWavelength.title: 靶向所有颜色
- colorWavelength.subtitle: Lucas皮秒激光通过多波长有效分解各种颜色的墨水
- colorWavelength.illustrationTitle: 墨水颜色最佳波长
- colorWavelength.colors.black.name: 黑色
- colorWavelength.colors.black.wavelength: 1064nm
- colorWavelength.colors.black.difficulty: 最容易
- colorWavelength.colors.red.name: 红色
- colorWavelength.colors.red.wavelength: 532nm
- colorWavelength.colors.red.difficulty: 比较容易
- colorWavelength.colors.blue.name: 蓝色
- colorWavelength.colors.blue.wavelength: 755nm
- colorWavelength.colors.blue.difficulty: 较难
- colorWavelength.colors.green.name: 绿色
- colorWavelength.colors.green.wavelength: 755nm
- colorWavelength.colors.green.difficulty: 最难
- colorWavelength.lucasNote: Lucas：多波长可靶向所有颜色
- colorWavelength.wavelengths[0].wavelength: 1064nm
- colorWavelength.wavelengths[0].colors: 黑色、深蓝色、棕色
- colorWavelength.wavelengths[0].note: 最深穿透，大多数纹身
- colorWavelength.wavelengths[1].wavelength: 755nm
- colorWavelength.wavelengths[1].colors: 蓝色、绿色
- colorWavelength.wavelengths[1].note: 中等深度，特殊颜色靶向
- colorWavelength.wavelengths[2].wavelength: 532nm
- colorWavelength.wavelengths[2].colors: 红色、橙色、黄色
- colorWavelength.wavelengths[2].note: 表皮层，浅色专用
- tattooTypes.badge: 纹身类型指南
- tattooTypes.title: 您想去除什么样的纹身？
- tattooTypes.subtitle: 根据纹身的类型和特性，治疗次数和难度会有所不同
- tattooTypes.estimatedSessions: 预计次数
- tattooTypes.difficulty.easy: 比较容易
- tattooTypes.difficulty.medium: 中等
- tattooTypes.difficulty.hard: 较难
- tattooTypes.types[0].type: 业余纹身
- tattooTypes.types[0].description: 非专业人士做的纹身。墨水较浅，去除相对容易。
- tattooTypes.types[0].sessions: 3-5次
- tattooTypes.types[0].notes: 多为墨汁、笔墨等单色纹身
- tattooTypes.types[1].type: 专业纹身（黑白）
- tattooTypes.types[1].description: 专业纹身师做的黑白纹身。墨水深且均匀。
- tattooTypes.types[1].sessions: 6-10次
- tattooTypes.types[1].notes: 黑色墨水对激光反应最好
- tattooTypes.types[2].type: 专业纹身（彩色）
- tattooTypes.types[2].description: 使用多种颜色的彩色纹身。不同颜色需要不同波长。
- tattooTypes.types[2].sessions: 8-15次以上
- tattooTypes.types[2].notes: 绿色、蓝色需要更多次数
- tattooTypes.types[3].type: 半永久化妆
- tattooTypes.types[3].description: 眉毛、眼线、唇部等半永久化妆。比一般纹身做得较浅。
- tattooTypes.types[3].sessions: 3-6次
- tattooTypes.types[3].notes: 眼部治疗使用特殊防护设备
- tattooTypes.types[4].type: 外伤性纹身
- tattooTypes.types[4].description: 事故造成的异物沉积。沥青、石墨等嵌入皮肤的情况。
- tattooTypes.types[4].sessions: 4-8次
- tattooTypes.types[4].notes: 根据深度和范围而定
- tattooTypes.types[5].type: 遮盖纹身
- tattooTypes.types[5].description: 在原有纹身上重新做的纹身。墨水层较厚，去除较难。
- tattooTypes.types[5].sessions: 10-20次以上
- tattooTypes.types[5].notes: 分阶段去除后可做新纹身
- process.badge: 治疗流程
- process.title: 纹身去除流程
- process.steps[0].title: 咨询 & 评估
- process.steps[0].description: 评估纹身大小、颜色、深度、肤质，告知预计治疗次数和费用。
- process.steps[0].duration: 约30分钟
- process.steps[1].title: 皮秒激光治疗
- process.steps[1].description: 用Lucas皮秒激光将墨水颗粒微细粉碎。治疗时间因大小而异。
- process.steps[1].duration: 15-60分钟
- process.steps[2].title: 恢复期
- process.steps[2].description: 皮肤自然排出粉碎的墨水。可能出现结痂、轻微肿胀。
- process.steps[2].duration: 2-4周
- process.steps[3].title: 下次治疗
- process.steps[3].description: 间隔6-8周重复治疗。每次治疗都能看到纹身变淡。
- process.steps[3].duration: 间隔6-8周
- lucas.title: Lucas
- lucas.subtitle: 皮秒纹身去除的新标准
- lucas.specs.pulseDuration.label: 脉冲持续时间
- lucas.specs.pulseDuration.value: 450皮秒
- lucas.specs.wavelength.label: 波长
- lucas.specs.wavelength.value: 532 / 755 / 1064nm
- lucas.specs.repetitionRate.label: 重复率
- lucas.specs.repetitionRate.value: 最高10Hz
- lucas.specs.energy.label: 能量
- lucas.specs.energy.value: 最高1.8J
- lucas.strengths.title: Lucas的优势
- lucas.strengths.items[0]: 多波长应对所有颜色
- lucas.strengths.items[1]: 450ps超短脉冲最小化热损伤
- lucas.strengths.items[2]: 点阵镜头也可治疗疤痕
- precautions.before.title: 治疗前
- precautions.before.items[0]: 治疗前2周避免过度日晒
- precautions.before.items[1]: 治疗部位避免使用刺激性产品
- precautions.before.items[2]: 如有皮肤状况（炎症、伤口）请提前告知
- precautions.before.items[3]: 告知正在服用的药物（光敏性药物等）
- precautions.after.title: 治疗后
- precautions.after.items[0]: 按指示涂抹处方药膏
- precautions.after.items[1]: 绝对不要人为去除结痂
- precautions.after.items[2]: 必须使用防晒霜（SPF 30以上）
- precautions.after.items[3]: 1周内避免桑拿、剧烈运动

### laser/tattoo detail (zh-TW)

- picoTech.badge: 皮秒技術
- picoTech.title: 為什麼選擇皮秒激光？
- picoTech.description1: 傳統納秒(10⁻⁹秒)激光通過熱作用(Photothermal)分解墨水。皮秒(10⁻¹²秒)激光以快1000倍的脈衝產生光聲作用(Photoacoustic)。
- picoTech.description2: 這種衝擊波將墨水顆粒粉碎到微塵級別，使我們身體的免疫系統能夠輕鬆清除。
- picoTech.benefits[0].title: 更少的治療次數
- picoTech.benefits[0].desc: 微粒粉碎實現高效清除
- picoTech.benefits[1].title: 更少的熱損傷
- picoTech.benefits[1].desc: 短脈衝保護周圍組織
- picoTech.benefits[2].title: 更少的副作用
- picoTech.benefits[2].desc: 最大限度降低疤痕、色素變化風險
- picoTech.illustration.title: 墨水顆粒粉碎機制
- picoTech.illustration.nanosecond: 納秒 (10⁻⁹秒)
- picoTech.illustration.nanosecondDevice: 傳統Q-Switch激光
- picoTech.illustration.picosecond: 皮秒 (10⁻¹²秒)
- picoTech.illustration.picosecondDevice: Lucas激光
- picoTech.illustration.before: Before
- picoTech.illustration.after: After
- picoTech.illustration.photothermal: 熱作用 (Photothermal)
- picoTech.illustration.photothermalResult: 大顆粒 → 中顆粒
- picoTech.illustration.photoacoustic: 光聲作用 (Photoacoustic)
- picoTech.illustration.photoacousticResult: 大顆粒 → 微小顆粒 ✓
- colorWavelength.badge: 多波長系統
- colorWavelength.title: 靶向所有顏色
- colorWavelength.subtitle: Lucas皮秒激光通過多波長有效分解各種顏色的墨水
- colorWavelength.illustrationTitle: 墨水顏色最佳波長
- colorWavelength.colors.black.name: 黑色
- colorWavelength.colors.black.wavelength: 1064nm
- colorWavelength.colors.black.difficulty: 最容易
- colorWavelength.colors.red.name: 紅色
- colorWavelength.colors.red.wavelength: 532nm
- colorWavelength.colors.red.difficulty: 比較容易
- colorWavelength.colors.blue.name: 藍色
- colorWavelength.colors.blue.wavelength: 755nm
- colorWavelength.colors.blue.difficulty: 較難
- colorWavelength.colors.green.name: 綠色
- colorWavelength.colors.green.wavelength: 755nm
- colorWavelength.colors.green.difficulty: 最難
- colorWavelength.lucasNote: Lucas：多波長可靶向所有顏色
- colorWavelength.wavelengths[0].wavelength: 1064nm
- colorWavelength.wavelengths[0].colors: 黑色、深藍色、棕色
- colorWavelength.wavelengths[0].note: 最深穿透，大多數紋身
- colorWavelength.wavelengths[1].wavelength: 755nm
- colorWavelength.wavelengths[1].colors: 藍色、綠色
- colorWavelength.wavelengths[1].note: 中等深度，特殊顏色靶向
- colorWavelength.wavelengths[2].wavelength: 532nm
- colorWavelength.wavelengths[2].colors: 紅色、橙色、黃色
- colorWavelength.wavelengths[2].note: 表皮層，淺色專用
- tattooTypes.badge: 紋身類型指南
- tattooTypes.title: 您想去除什麼樣的紋身？
- tattooTypes.subtitle: 根據紋身的類型和特性，治療次數和難度會有所不同
- tattooTypes.estimatedSessions: 預計次數
- tattooTypes.difficulty.easy: 比較容易
- tattooTypes.difficulty.medium: 中等
- tattooTypes.difficulty.hard: 較難
- tattooTypes.types[0].type: 業餘紋身
- tattooTypes.types[0].description: 非專業人士做的紋身。墨水較淺，去除相對容易。
- tattooTypes.types[0].sessions: 3-5次
- tattooTypes.types[0].notes: 多為墨汁、筆墨等單色紋身
- tattooTypes.types[1].type: 專業紋身（黑白）
- tattooTypes.types[1].description: 專業紋身師做的黑白紋身。墨水深且均勻。
- tattooTypes.types[1].sessions: 6-10次
- tattooTypes.types[1].notes: 黑色墨水對激光反應最好
- tattooTypes.types[2].type: 專業紋身（彩色）
- tattooTypes.types[2].description: 使用多種顏色的彩色紋身。不同顏色需要不同波長。
- tattooTypes.types[2].sessions: 8-15次以上
- tattooTypes.types[2].notes: 綠色、藍色需要更多次數
- tattooTypes.types[3].type: 半永久化妝
- tattooTypes.types[3].description: 眉毛、眼線、唇部等半永久化妝。比一般紋身做得較淺。
- tattooTypes.types[3].sessions: 3-6次
- tattooTypes.types[3].notes: 眼部治療使用特殊防護設備
- tattooTypes.types[4].type: 外傷性紋身
- tattooTypes.types[4].description: 事故造成的異物沉積。瀝青、石墨等嵌入皮膚的情況。
- tattooTypes.types[4].sessions: 4-8次
- tattooTypes.types[4].notes: 根據深度和範圍而定
- tattooTypes.types[5].type: 遮蓋紋身
- tattooTypes.types[5].description: 在原有紋身上重新做的紋身。墨水層較厚，去除較難。
- tattooTypes.types[5].sessions: 10-20次以上
- tattooTypes.types[5].notes: 分階段去除後可做新紋身
- process.badge: 治療流程
- process.title: 紋身去除流程
- process.steps[0].title: 諮詢 & 評估
- process.steps[0].description: 評估紋身大小、顏色、深度、膚質，告知預計治療次數和費用。
- process.steps[0].duration: 約30分鐘
- process.steps[1].title: 皮秒激光治療
- process.steps[1].description: 用Lucas皮秒激光將墨水顆粒微細粉碎。治療時間因大小而異。
- process.steps[1].duration: 15-60分鐘
- process.steps[2].title: 恢復期
- process.steps[2].description: 皮膚自然排出粉碎的墨水。可能出現結痂、輕微腫脹。
- process.steps[2].duration: 2-4周
- process.steps[3].title: 下次治療
- process.steps[3].description: 間隔6-8周重複治療。每次治療都能看到紋身變淡。
- process.steps[3].duration: 間隔6-8周
- lucas.title: Lucas
- lucas.subtitle: 皮秒紋身去除的新標準
- lucas.specs.pulseDuration.label: 脈衝持續時間
- lucas.specs.pulseDuration.value: 450皮秒
- lucas.specs.wavelength.label: 波長
- lucas.specs.wavelength.value: 532 / 755 / 1064nm
- lucas.specs.repetitionRate.label: 重複率
- lucas.specs.repetitionRate.value: 最高10Hz
- lucas.specs.energy.label: 能量
- lucas.specs.energy.value: 最高1.8J
- lucas.strengths.title: Lucas的優勢
- lucas.strengths.items[0]: 多波長應對所有顏色
- lucas.strengths.items[1]: 450ps超短脈衝最小化熱損傷
- lucas.strengths.items[2]: 點陣鏡頭也可治療疤痕
- precautions.before.title: 治療前
- precautions.before.items[0]: 治療前2周避免過度日曬
- precautions.before.items[1]: 治療部位避免使用刺激性產品
- precautions.before.items[2]: 如有皮膚狀況（炎症、傷口）請提前告知
- precautions.before.items[3]: 告知正在服用的藥物（光敏性藥物等）
- precautions.after.title: 治療後
- precautions.after.items[0]: 按指示塗抹處方藥膏
- precautions.after.items[1]: 絕對不要人為去除結痂
- precautions.after.items[2]: 必須使用防曬霜（SPF 30以上）
- precautions.after.items[3]: 1周內避免桑拿、劇烈運動

### laser/hairRemoval detail (en)

- claritySection.badge: LIV Premium Equipment
- claritySection.title: Clarity II
- claritySection.subtitle: The New Standard in Hair Removal
- claritySection.description1: Clarity II is a premium laser system that offers two wavelengths—<strong>755nm Alexandrite</strong> and <strong>1064nm Nd:YAG</strong>—on a single platform.
- claritySection.description2: <strong>IntelliTrak™</strong> technology tracks the skin in real-time, delivering uniform energy without overlap or missed spots, minimizing burn risk and maximizing effectiveness.
- claritySection.specs.wavelength: Wavelength
- claritySection.specs.wavelengthValue: 755nm + 1064nm
- claritySection.specs.spotSize: Spot Size
- claritySection.specs.spotSizeValue: Up to 3cm²
- claritySection.specs.pulseTime: Pulse Duration
- claritySection.specs.pulseTimeValue: 2-400ms
- claritySection.specs.cooling: Cooling
- claritySection.specs.coolingValue: Cryogen
- intellitrakSection.badge: Differentiating Technology
- intellitrakSection.title: IntelliTrak™ Smart Treatment
- bodyAreas.title: Body Area Hair Removal Guide
- bodyAreas.subtitle: Clarity II enables hair removal from face to full body
- bodyAreas.labels.sessions: Recommended Sessions
- bodyAreas.labels.interval: Treatment Interval
- bodyAreas.items[0].area: Underarms
- bodyAreas.items[0].sessions: 6-8 sessions
- bodyAreas.items[0].interval: 4-6 weeks
- bodyAreas.items[0].description: Most popular hair removal area. Also effective for sweat and odor management.
- bodyAreas.items[1].area: Arms/Legs
- bodyAreas.items[1].sessions: 6-10 sessions
- bodyAreas.items[1].interval: 6-8 weeks
- bodyAreas.items[1].description: Fast treatment for large areas. Maintain smooth skin for longer.
- bodyAreas.items[2].area: Bikini Line
- bodyAreas.items[2].sessions: 8-10 sessions
- bodyAreas.items[2].interval: 4-6 weeks
- bodyAreas.items[2].description: Settings optimized for sensitive areas ensure safe and effective treatment.
- bodyAreas.items[3].area: Face (Upper Lip, Jawline)
- bodyAreas.items[3].sessions: 8-12 sessions
- bodyAreas.items[3].interval: 3-4 weeks
- bodyAreas.items[3].description: Delicate facial hair removal. Cleanly removes even fine hairs.
- bodyAreas.items[4].area: Back/Chest (Men)
- bodyAreas.items[4].sessions: 8-12 sessions
- bodyAreas.items[4].interval: 6-8 weeks
- bodyAreas.items[4].description: Specialized in men's hair removal. From natural reduction to complete removal.
- bodyAreas.items[5].area: Full Body
- bodyAreas.items[5].sessions: 8-12 sessions
- bodyAreas.items[5].interval: Varies by area
- bodyAreas.items[5].description: Total body care. Package programs at reasonable prices.
- advantages.title: Clarity II Advantages
- advantages.subtitle: Why choose Clarity II for hair removal?
- advantages.items[0].title: Dual Wavelength
- advantages.items[0].description: 755nm + 1064nm for safe and effective treatment on all skin types
- advantages.items[1].title: IntelliTrak™
- advantages.items[1].description: Real-time skin tracking for uniform energy delivery, minimizing burn risk
- advantages.items[2].title: Large Spot Size
- advantages.items[2].description: Up to 3cm² spot size for fast treatment of large areas
- advantages.items[3].title: Integrated Cooling
- advantages.items[3].description: Cryogen cooling system minimizes pain and discomfort during treatment
- intellitrakFeatures[0].title: Real-Time Tracking
- intellitrakFeatures[0].desc: Detects handpiece movement in real-time to track treatment position
- intellitrakFeatures[1].title: Uniform Coverage
- intellitrakFeatures[1].desc: Delivers uniform energy across the entire treatment area without overlap or gaps
- intellitrakFeatures[2].title: Burn Prevention
- intellitrakFeatures[2].desc: Prevents over-treatment by avoiding duplicate exposure to the same area
- processSteps[0].title: Consultation & Skin Analysis
- processSteps[0].desc: Analyze skin type and hair characteristics to create a customized treatment plan
- processSteps[1].title: Pre-Treatment Prep
- processSteps[1].desc: Shave treatment area and apply numbing cream if needed
- processSteps[2].title: Laser Treatment
- processSteps[2].desc: Precise, uniform energy delivery with IntelliTrak™
- processSteps[3].title: Post-Care
- processSteps[3].desc: Cooling and soothing care, schedule next appointment

### laser/hairRemoval detail (ja)

- claritySection.badge: LIV プレミアム機器
- claritySection.title: Clarity II
- claritySection.subtitle: 脱毛の新しい基準
- claritySection.description1: Clarity IIは<strong>755nm アレキサンドライト</strong>と<strong>1064nm Nd:YAG</strong>の2つの波長を1つのプラットフォームで提供するプレミアムレーザーシステムです。
- claritySection.description2: <strong>IntelliTrak™</strong>技術はリアルタイムで肌を追跡し、重複や漏れなく均一なエネルギーを照射、火傷リスクを最小化し効果を最大化します。
- claritySection.specs.wavelength: 波長
- claritySection.specs.wavelengthValue: 755nm + 1064nm
- claritySection.specs.spotSize: スポットサイズ
- claritySection.specs.spotSizeValue: 最大3cm²
- claritySection.specs.pulseTime: パルス時間
- claritySection.specs.pulseTimeValue: 2-400ms
- claritySection.specs.cooling: クーリング
- claritySection.specs.coolingValue: クライオジェン
- intellitrakSection.badge: 差別化技術
- intellitrakSection.title: IntelliTrak™ スマート施術
- bodyAreas.title: 部位別脱毛ガイド
- bodyAreas.subtitle: Clarity IIで顔から全身まですべての部位の脱毛が可能です
- bodyAreas.labels.sessions: 推奨回数
- bodyAreas.labels.interval: 施術間隔
- bodyAreas.items[0].area: ワキ
- bodyAreas.items[0].sessions: 6-8回
- bodyAreas.items[0].interval: 4-6週
- bodyAreas.items[0].description: 最も人気のある脱毛部位。汗、臭いの管理にも効果的です。
- bodyAreas.items[1].area: 腕/脚
- bodyAreas.items[1].sessions: 6-10回
- bodyAreas.items[1].interval: 6-8週
- bodyAreas.items[1].description: 広い部位も素早く施術。滑らかな肌を長く維持します。
- bodyAreas.items[2].area: ビキニライン
- bodyAreas.items[2].sessions: 8-10回
- bodyAreas.items[2].interval: 4-6週
- bodyAreas.items[2].description: デリケートな部位に最適化されたセッティングで安全かつ効果的な施術。
- bodyAreas.items[3].area: 顔（鼻の下、フェイスライン）
- bodyAreas.items[3].sessions: 8-12回
- bodyAreas.items[3].interval: 3-4週
- bodyAreas.items[3].description: 繊細な顔の毛の除去。産毛までクリアに整えます。
- bodyAreas.items[4].area: 背中/胸（男性）
- bodyAreas.items[4].sessions: 8-12回
- bodyAreas.items[4].interval: 6-8週
- bodyAreas.items[4].description: 男性脱毛専門。自然な減毛から完全脱毛まで。
- bodyAreas.items[5].area: 全身脱毛
- bodyAreas.items[5].sessions: 8-12回
- bodyAreas.items[5].interval: 部位別調整
- bodyAreas.items[5].description: 全身トータルケア。パッケージプログラムでお得な価格。
- advantages.title: Clarity II の利点
- advantages.subtitle: なぜClarity IIで脱毛するのか？
- advantages.items[0].title: デュアル波長
- advantages.items[0].description: 755nm + 1064nmですべての肌タイプに安全で効果的
- advantages.items[1].title: IntelliTrak™
- advantages.items[1].description: リアルタイム肌追跡で均一なエネルギー照射、火傷リスク最小化
- advantages.items[2].title: 大面積スポット
- advantages.items[2].description: 最大3cm²スポットサイズで広い部位も素早く施術
- advantages.items[3].title: 統合クーリング
- advantages.items[3].description: クライオジェンクーリングシステムで施術中の痛みと不快感を最小化
- intellitrakFeatures[0].title: リアルタイム追跡
- intellitrakFeatures[0].desc: ハンドピースの動きをリアルタイムで感知して照射位置を把握
- intellitrakFeatures[1].title: 均一なカバレッジ
- intellitrakFeatures[1].desc: 重複/漏れなく治療領域全体に均一なエネルギー照射
- intellitrakFeatures[2].title: 火傷予防
- intellitrakFeatures[2].desc: 同一部位への重複照射防止で火傷および過治療リスク最小化
- processSteps[0].title: カウンセリング & 肌分析
- processSteps[0].desc: 肌タイプ、毛髪特性分析後にカスタム治療計画を策定
- processSteps[1].title: 事前準備
- processSteps[1].desc: 治療部位の剃毛および必要に応じて麻酔クリーム塗布
- processSteps[2].title: レーザー照射
- processSteps[2].desc: IntelliTrak™で正確かつ均一なエネルギー照射
- processSteps[3].title: アフターケア
- processSteps[3].desc: クーリングおよび鎮静ケア、次回施術日程のご案内

### laser/hairRemoval detail (zh)

- claritySection.badge: LIV 高端设备
- claritySection.title: Clarity II
- claritySection.subtitle: 脱毛新标准
- claritySection.description1: Clarity II是一款高端激光系统，在单一平台上提供<strong>755nm亚历山大激光</strong>和<strong>1064nm Nd:YAG</strong>两种波长。
- claritySection.description2: <strong>IntelliTrak™</strong>技术实时追踪皮肤，无重叠无遗漏地均匀输出能量，最大程度降低烫伤风险，最大化治疗效果。
- claritySection.specs.wavelength: 波长
- claritySection.specs.wavelengthValue: 755nm + 1064nm
- claritySection.specs.spotSize: 光斑尺寸
- claritySection.specs.spotSizeValue: 最大3cm²
- claritySection.specs.pulseTime: 脉冲时间
- claritySection.specs.pulseTimeValue: 2-400ms
- claritySection.specs.cooling: 冷却
- claritySection.specs.coolingValue: 低温气体
- intellitrakSection.badge: 差异化技术
- intellitrakSection.title: IntelliTrak™ 智能治疗
- bodyAreas.title: 部位脱毛指南
- bodyAreas.subtitle: Clarity II可实现从面部到全身所有部位的脱毛
- bodyAreas.labels.sessions: 建议次数
- bodyAreas.labels.interval: 治疗间隔
- bodyAreas.items[0].area: 腋下
- bodyAreas.items[0].sessions: 6-8次
- bodyAreas.items[0].interval: 4-6周
- bodyAreas.items[0].description: 最受欢迎的脱毛部位。对汗液和异味管理也很有效。
- bodyAreas.items[1].area: 手臂/腿部
- bodyAreas.items[1].sessions: 6-10次
- bodyAreas.items[1].interval: 6-8周
- bodyAreas.items[1].description: 大面积部位也能快速治疗。长期保持光滑肌肤。
- bodyAreas.items[2].area: 比基尼线
- bodyAreas.items[2].sessions: 8-10次
- bodyAreas.items[2].interval: 4-6周
- bodyAreas.items[2].description: 针对敏感部位优化设置，安全有效。
- bodyAreas.items[3].area: 面部（人中、下颌线）
- bodyAreas.items[3].sessions: 8-12次
- bodyAreas.items[3].interval: 3-4周
- bodyAreas.items[3].description: 细腻面部毛发去除。连绒毛也能彻底清除。
- bodyAreas.items[4].area: 背部/胸部（男性）
- bodyAreas.items[4].sessions: 8-12次
- bodyAreas.items[4].interval: 6-8周
- bodyAreas.items[4].description: 男性脱毛专业服务。从自然减毛到完全脱毛。
- bodyAreas.items[5].area: 全身脱毛
- bodyAreas.items[5].sessions: 8-12次
- bodyAreas.items[5].interval: 按部位调整
- bodyAreas.items[5].description: 全身护理。套餐项目价格优惠。
- advantages.title: Clarity II 优势
- advantages.subtitle: 为什么选择Clarity II脱毛？
- advantages.items[0].title: 双波长
- advantages.items[0].description: 755nm + 1064nm，适合所有肤质，安全有效
- advantages.items[1].title: IntelliTrak™
- advantages.items[1].description: 实时皮肤追踪，均匀输出能量，最大程度降低烫伤风险
- advantages.items[2].title: 大光斑
- advantages.items[2].description: 最大3cm²光斑尺寸，大面积部位也能快速治疗
- advantages.items[3].title: 集成冷却
- advantages.items[3].description: 低温气体冷却系统，最大程度减少治疗中的疼痛和不适
- intellitrakFeatures[0].title: 实时追踪
- intellitrakFeatures[0].desc: 实时感知手柄移动，准确把握照射位置
- intellitrakFeatures[1].title: 均匀覆盖
- intellitrakFeatures[1].desc: 无重叠无遗漏地向整个治疗区域均匀输出能量
- intellitrakFeatures[2].title: 烫伤预防
- intellitrakFeatures[2].desc: 防止同一部位重复照射，最大程度降低烫伤和过度治疗风险
- processSteps[0].title: 咨询 & 皮肤分析
- processSteps[0].desc: 分析皮肤类型和毛发特性，制定定制治疗方案
- processSteps[1].title: 术前准备
- processSteps[1].desc: 剃除治疗部位毛发，必要时涂抹麻醉膏
- processSteps[2].title: 激光治疗
- processSteps[2].desc: 通过IntelliTrak™精确均匀地输出能量
- processSteps[3].title: 术后护理
- processSteps[3].desc: 冷却和舒缓护理，安排下次治疗时间

### laser/hairRemoval detail (zh-TW)

- claritySection.badge: LIV 高端設備
- claritySection.title: Clarity II
- claritySection.subtitle: 脫毛新標準
- claritySection.description1: Clarity II是一款高端激光系統，在單一平臺上提供<strong>755nm亞歷山大激光</strong>和<strong>1064nm Nd:YAG</strong>兩種波長。
- claritySection.description2: <strong>IntelliTrak™</strong>技術實時追蹤皮膚，無重疊無遺漏地均勻輸出能量，最大程度降低燙傷風險，最大化治療效果。
- claritySection.specs.wavelength: 波長
- claritySection.specs.wavelengthValue: 755nm + 1064nm
- claritySection.specs.spotSize: 光斑尺寸
- claritySection.specs.spotSizeValue: 最大3cm²
- claritySection.specs.pulseTime: 脈衝時間
- claritySection.specs.pulseTimeValue: 2-400ms
- claritySection.specs.cooling: 冷卻
- claritySection.specs.coolingValue: 低溫氣體
- intellitrakSection.badge: 差異化技術
- intellitrakSection.title: IntelliTrak™ 智能治療
- bodyAreas.title: 部位脫毛指南
- bodyAreas.subtitle: Clarity II可實現從面部到全身所有部位的脫毛
- bodyAreas.labels.sessions: 建議次數
- bodyAreas.labels.interval: 治療間隔
- bodyAreas.items[0].area: 腋下
- bodyAreas.items[0].sessions: 6-8次
- bodyAreas.items[0].interval: 4-6周
- bodyAreas.items[0].description: 最受歡迎的脫毛部位。對汗液和異味管理也很有效。
- bodyAreas.items[1].area: 手臂/腿部
- bodyAreas.items[1].sessions: 6-10次
- bodyAreas.items[1].interval: 6-8周
- bodyAreas.items[1].description: 大面積部位也能快速治療。長期保持光滑肌膚。
- bodyAreas.items[2].area: 比基尼線
- bodyAreas.items[2].sessions: 8-10次
- bodyAreas.items[2].interval: 4-6周
- bodyAreas.items[2].description: 針對敏感部位優化設置，安全有效。
- bodyAreas.items[3].area: 面部（人中、下頜線）
- bodyAreas.items[3].sessions: 8-12次
- bodyAreas.items[3].interval: 3-4周
- bodyAreas.items[3].description: 細膩面部毛髮去除。連絨毛也能徹底清除。
- bodyAreas.items[4].area: 背部/胸部（男性）
- bodyAreas.items[4].sessions: 8-12次
- bodyAreas.items[4].interval: 6-8周
- bodyAreas.items[4].description: 男性脫毛專業服務。從自然減毛到完全脫毛。
- bodyAreas.items[5].area: 全身脫毛
- bodyAreas.items[5].sessions: 8-12次
- bodyAreas.items[5].interval: 按部位調整
- bodyAreas.items[5].description: 全身護理。套餐項目價格優惠。
- advantages.title: Clarity II 優勢
- advantages.subtitle: 為什麼選擇Clarity II脫毛？
- advantages.items[0].title: 雙波長
- advantages.items[0].description: 755nm + 1064nm，適合所有膚質，安全有效
- advantages.items[1].title: IntelliTrak™
- advantages.items[1].description: 實時皮膚追蹤，均勻輸出能量，最大程度降低燙傷風險
- advantages.items[2].title: 大光斑
- advantages.items[2].description: 最大3cm²光斑尺寸，大面積部位也能快速治療
- advantages.items[3].title: 集成冷卻
- advantages.items[3].description: 低溫氣體冷卻系統，最大程度減少治療中的疼痛和不適
- intellitrakFeatures[0].title: 實時追蹤
- intellitrakFeatures[0].desc: 實時感知手柄移動，準確把握照射位置
- intellitrakFeatures[1].title: 均勻覆蓋
- intellitrakFeatures[1].desc: 無重疊無遺漏地向整個治療區域均勻輸出能量
- intellitrakFeatures[2].title: 燙傷預防
- intellitrakFeatures[2].desc: 防止同一部位重複照射，最大程度降低燙傷和過度治療風險
- processSteps[0].title: 諮詢 & 皮膚分析
- processSteps[0].desc: 分析皮膚類型和毛髮特性，制定定製治療方案
- processSteps[1].title: 術前準備
- processSteps[1].desc: 剃除治療部位毛髮，必要時塗抹麻醉膏
- processSteps[2].title: 激光治療
- processSteps[2].desc: 通過IntelliTrak™精確均勻地輸出能量
- processSteps[3].title: 術後護理
- processSteps[3].desc: 冷卻和舒緩護理，安排下次治療時間

### laser/pigmentation detail (en)

- threeStageSystem.title: LIV's 3-Stage Pigmentation Treatment System
- threeStageSystem.subtitle: From mild to stubborn melasma, effective pigmentation improvement with step-by-step customized treatment
- threeStageSystem.stages[0].stage: Stage 1
- threeStageSystem.stages[0].title: Intensive Treatment
- threeStageSystem.stages[0].equipment: Lucas Pico
- threeStageSystem.stages[0].description: Deep pigment breakdown with picosecond pulse
- threeStageSystem.stages[1].stage: Stage 2
- threeStageSystem.stages[1].title: Precision Targeting
- threeStageSystem.stages[1].equipment: Clarity II 755nm
- threeStageSystem.stages[1].description: Precise treatment of shallow pigment with alexandrite wavelength
- threeStageSystem.stages[2].stage: Stage 3
- threeStageSystem.stages[2].title: Maintenance
- threeStageSystem.stages[2].equipment: Toning + Ulblanc
- threeStageSystem.stages[2].description: Gentle repeated treatment for effect maintenance and recurrence prevention
- picoVsNano.title: Why Picosecond?
- picoVsNano.subtitle: 1000x faster pulse than nanosecond laser breaks down pigment into finer particles
- picoVsNano.nanosecond: Nanosecond Laser
- picoVsNano.picosecond: Picosecond Laser
- picoVsNano.nanosecondUnit: Billionth of a second (10⁻⁹)
- picoVsNano.picosecondUnit: Trillionth of a second (10⁻¹²)
- picoVsNano.largeParticles: Pigment particles broken into larger pieces
- picoVsNano.slowDischarge: Slow discharge
- picoVsNano.fineParticles: Pigment particles broken into fine particles
- picoVsNano.fastDischarge: Fast lymphatic discharge
- picoVsNano.timesFaster: 1000x Faster
- picoVsNano.comparison.item: Comparison
- picoVsNano.comparison.pulseSpeed: Pulse Speed
- picoVsNano.comparison.particleSize: Particle Size
- picoVsNano.comparison.tissueDamage: Tissue Damage
- picoVsNano.comparison.heatDamage: Heat Damage
- picoVsNano.comparison.downtime: Downtime
- picoVsNano.comparison.sessions: Sessions Required
- picoVsNano.comparison.relativeLarge: Relatively Large
- picoVsNano.comparison.fine: Fine
- picoVsNano.comparison.exists: Present
- picoVsNano.comparison.minimal: Minimal
- picoVsNano.comparison.almostNone: Almost None
- picoVsNano.comparison.relativeLong: Relatively Long
- picoVsNano.comparison.short: Short
- picoVsNano.comparison.many: Many
- picoVsNano.comparison.few: Few
- equipment.title: Recommended Pigmentation Treatment Devices
- equipment.subtitle: Optimal pigmentation treatment with 4 premium lasers at LIV Clinic
- equipment.featured: FEATURED
- protocol.title: Treatment Protocol by Severity
- protocol.mild.level: Mild
- protocol.mild.description: Light melasma, spots
- protocol.mild.treatment: Laser Toning
- protocol.mild.sessions: 5-10 sessions
- protocol.mild.interval: 2-week interval
- protocol.moderate.level: Moderate
- protocol.moderate.description: Medium-depth pigmentation
- protocol.moderate.treatment: Clarity II 755nm
- protocol.moderate.sessions: 3-5 sessions
- protocol.moderate.interval: 3-4 week interval
- protocol.severe.level: Severe / Stubborn
- protocol.severe.description: Deep melasma, stubborn
- protocol.severe.treatment: Lucas Pico + Toning
- protocol.severe.sessions: 5-10 sessions
- protocol.severe.interval: 2-4 week interval
- idealFor[0]: Those whose melasma is getting darker and wider
- idealFor[1]: Those who have had multiple toning sessions without results
- idealFor[2]: Those concerned about many spots and freckles
- idealFor[3]: Those starting to develop age spots
- idealFor[4]: Those with dull and uneven skin tone
- idealFor[5]: Those wanting consistent care without downtime

### laser/pigmentation detail (ja)

- threeStageSystem.title: LIVの3段階色素治療システム
- threeStageSystem.subtitle: 軽度から難治性シミまで、段階別カスタム治療で効果的な色素改善
- threeStageSystem.stages[0].stage: 1段階
- threeStageSystem.stages[0].title: 集中治療
- threeStageSystem.stages[0].equipment: ルーカス ピコ
- threeStageSystem.stages[0].description: ピコセカンドパルスで深い色素を集中分解
- threeStageSystem.stages[1].stage: 2段階
- threeStageSystem.stages[1].title: 精密ターゲット
- threeStageSystem.stages[1].equipment: クラリティII 755nm
- threeStageSystem.stages[1].description: アレキサンドライト波長で浅い色素を精密治療
- threeStageSystem.stages[2].stage: 3段階
- threeStageSystem.stages[2].title: 維持管理
- threeStageSystem.stages[2].equipment: トーニング + ウルブラン
- threeStageSystem.stages[2].description: 低刺激繰り返し施術で効果維持と再発防止
- picoVsNano.title: なぜピコセカンドなのか？
- picoVsNano.subtitle: ナノ秒レーザー比1000倍速いパルスで色素をより微細に分解
- picoVsNano.nanosecond: ナノ秒レーザー
- picoVsNano.picosecond: ピコ秒レーザー
- picoVsNano.nanosecondUnit: 10億分の1秒 (10⁻⁹)
- picoVsNano.picosecondUnit: 1兆分の1秒 (10⁻¹²)
- picoVsNano.largeParticles: 色素粒子が大きく分解
- picoVsNano.slowDischarge: 排出速度が遅い
- picoVsNano.fineParticles: 色素粒子が微細に分解
- picoVsNano.fastDischarge: リンパ排出が速い
- picoVsNano.timesFaster: 1000倍速い
- picoVsNano.comparison.item: 比較項目
- picoVsNano.comparison.pulseSpeed: パルス速度
- picoVsNano.comparison.particleSize: 色素分解サイズ
- picoVsNano.comparison.tissueDamage: 周辺組織損傷
- picoVsNano.comparison.heatDamage: 熱損傷
- picoVsNano.comparison.downtime: ダウンタイム
- picoVsNano.comparison.sessions: 施術回数
- picoVsNano.comparison.relativeLarge: 比較的大きい
- picoVsNano.comparison.fine: 微細
- picoVsNano.comparison.exists: あり
- picoVsNano.comparison.minimal: 最小
- picoVsNano.comparison.almostNone: ほとんどなし
- picoVsNano.comparison.relativeLong: 比較的長い
- picoVsNano.comparison.short: 短い
- picoVsNano.comparison.many: 多い
- picoVsNano.comparison.few: 少ない
- equipment.title: 色素治療推奨機器
- equipment.subtitle: LIV整形外科が保有する4つのプレミアムレーザーで最適な色素治療
- equipment.featured: FEATURED
- protocol.title: 症状別推奨プロトコル
- protocol.mild.level: 軽度
- protocol.mild.description: 軽いシミ、そばかす
- protocol.mild.treatment: レーザートーニング
- protocol.mild.sessions: 5-10回
- protocol.mild.interval: 2週間隔
- protocol.moderate.level: 中等度
- protocol.moderate.description: 中間深度色素
- protocol.moderate.treatment: クラリティII 755nm
- protocol.moderate.sessions: 3-5回
- protocol.moderate.interval: 3-4週間隔
- protocol.severe.level: 重度 / 難治性
- protocol.severe.description: 深いシミ、難治性
- protocol.severe.treatment: ルーカス ピコ + トーニング
- protocol.severe.sessions: 5-10回
- protocol.severe.interval: 2-4週間隔
- idealFor[0]: シミが濃くなり広がっている方
- idealFor[1]: 何度もトーニングを受けたが効果がない方
- idealFor[2]: そばかす、くすみが多くて悩んでいる方
- idealFor[3]: 老人性色素斑が出始めた方
- idealFor[4]: 肌トーンがくすんで均一でない方
- idealFor[5]: ダウンタイムなく継続的にケアしたい方

### laser/pigmentation detail (zh)

- threeStageSystem.title: LIV三阶段色素治疗系统
- threeStageSystem.subtitle: 从轻度到顽固性黄褐斑，分阶段定制治疗实现有效色素改善
- threeStageSystem.stages[0].stage: 第1阶段
- threeStageSystem.stages[0].title: 集中治疗
- threeStageSystem.stages[0].equipment: Lucas皮秒
- threeStageSystem.stages[0].description: 皮秒脉冲集中分解深层色素
- threeStageSystem.stages[1].stage: 第2阶段
- threeStageSystem.stages[1].title: 精准靶向
- threeStageSystem.stages[1].equipment: Clarity II 755nm
- threeStageSystem.stages[1].description: 亚历山大波长精准治疗浅层色素
- threeStageSystem.stages[2].stage: 第3阶段
- threeStageSystem.stages[2].title: 维持护理
- threeStageSystem.stages[2].equipment: 调光 + 美白激光
- threeStageSystem.stages[2].description: 低刺激重复治疗维持效果预防复发
- picoVsNano.title: 为什么选择皮秒？
- picoVsNano.subtitle: 比纳秒激光快1000倍的脉冲，更精细地分解色素
- picoVsNano.nanosecond: 纳秒激光
- picoVsNano.picosecond: 皮秒激光
- picoVsNano.nanosecondUnit: 十亿分之一秒 (10⁻⁹)
- picoVsNano.picosecondUnit: 万亿分之一秒 (10⁻¹²)
- picoVsNano.largeParticles: 色素颗粒分解较大
- picoVsNano.slowDischarge: 排出速度慢
- picoVsNano.fineParticles: 色素颗粒分解精细
- picoVsNano.fastDischarge: 淋巴排出快
- picoVsNano.timesFaster: 快1000倍
- picoVsNano.comparison.item: 比较项目
- picoVsNano.comparison.pulseSpeed: 脉冲速度
- picoVsNano.comparison.particleSize: 色素分解大小
- picoVsNano.comparison.tissueDamage: 周围组织损伤
- picoVsNano.comparison.heatDamage: 热损伤
- picoVsNano.comparison.downtime: 恢复期
- picoVsNano.comparison.sessions: 治疗次数
- picoVsNano.comparison.relativeLarge: 相对较大
- picoVsNano.comparison.fine: 精细
- picoVsNano.comparison.exists: 有
- picoVsNano.comparison.minimal: 最小
- picoVsNano.comparison.almostNone: 几乎没有
- picoVsNano.comparison.relativeLong: 相对较长
- picoVsNano.comparison.short: 短
- picoVsNano.comparison.many: 多
- picoVsNano.comparison.few: 少
- equipment.title: 色素治疗推荐设备
- equipment.subtitle: LIV整形外科拥有的4种高端激光实现最佳色素治疗
- equipment.featured: FEATURED
- protocol.title: 症状推荐方案
- protocol.mild.level: 轻度
- protocol.mild.description: 轻微黄褐斑、色斑
- protocol.mild.treatment: 激光调光
- protocol.mild.sessions: 5-10次
- protocol.mild.interval: 2周间隔
- protocol.moderate.level: 中度
- protocol.moderate.description: 中等深度色素
- protocol.moderate.treatment: Clarity II 755nm
- protocol.moderate.sessions: 3-5次
- protocol.moderate.interval: 3-4周间隔
- protocol.severe.level: 重度 / 顽固性
- protocol.severe.description: 深层黄褐斑、顽固性
- protocol.severe.treatment: Lucas皮秒 + 调光
- protocol.severe.sessions: 5-10次
- protocol.severe.interval: 2-4周间隔
- idealFor[0]: 黄褐斑越来越深且扩大的人
- idealFor[1]: 多次做调光但效果不佳的人
- idealFor[2]: 色斑、雀斑较多困扰的人
- idealFor[3]: 开始出现老年斑的人
- idealFor[4]: 肤色暗沉不均匀的人
- idealFor[5]: 想要无恢复期持续护理的人

### laser/pigmentation detail (zh-TW)

- threeStageSystem.title: LIV三階段色素治療系統
- threeStageSystem.subtitle: 從輕度到頑固性黃褐斑，分階段定製治療實現有效色素改善
- threeStageSystem.stages[0].stage: 第1階段
- threeStageSystem.stages[0].title: 集中治療
- threeStageSystem.stages[0].equipment: Lucas皮秒
- threeStageSystem.stages[0].description: 皮秒脈衝集中分解深層色素
- threeStageSystem.stages[1].stage: 第2階段
- threeStageSystem.stages[1].title: 精準靶向
- threeStageSystem.stages[1].equipment: Clarity II 755nm
- threeStageSystem.stages[1].description: 亞歷山大波長精準治療淺層色素
- threeStageSystem.stages[2].stage: 第3階段
- threeStageSystem.stages[2].title: 維持護理
- threeStageSystem.stages[2].equipment: 調光 + 美白激光
- threeStageSystem.stages[2].description: 低刺激重複治療維持效果預防復發
- picoVsNano.title: 為什麼選擇皮秒？
- picoVsNano.subtitle: 比納秒激光快1000倍的脈衝，更精細地分解色素
- picoVsNano.nanosecond: 納秒激光
- picoVsNano.picosecond: 皮秒激光
- picoVsNano.nanosecondUnit: 十億分之一秒 (10⁻⁹)
- picoVsNano.picosecondUnit: 萬億分之一秒 (10⁻¹²)
- picoVsNano.largeParticles: 色素顆粒分解較大
- picoVsNano.slowDischarge: 排出速度慢
- picoVsNano.fineParticles: 色素顆粒分解精細
- picoVsNano.fastDischarge: 淋巴排出快
- picoVsNano.timesFaster: 快1000倍
- picoVsNano.comparison.item: 比較項目
- picoVsNano.comparison.pulseSpeed: 脈衝速度
- picoVsNano.comparison.particleSize: 色素分解大小
- picoVsNano.comparison.tissueDamage: 周圍組織損傷
- picoVsNano.comparison.heatDamage: 熱損傷
- picoVsNano.comparison.downtime: 恢復期
- picoVsNano.comparison.sessions: 治療次數
- picoVsNano.comparison.relativeLarge: 相對較大
- picoVsNano.comparison.fine: 精細
- picoVsNano.comparison.exists: 有
- picoVsNano.comparison.minimal: 最小
- picoVsNano.comparison.almostNone: 幾乎沒有
- picoVsNano.comparison.relativeLong: 相對較長
- picoVsNano.comparison.short: 短
- picoVsNano.comparison.many: 多
- picoVsNano.comparison.few: 少
- equipment.title: 色素治療推薦設備
- equipment.subtitle: LIV 整形外科擁有的4種高端激光實現最佳色素治療
- equipment.featured: FEATURED
- protocol.title: 症狀推薦方案
- protocol.mild.level: 輕度
- protocol.mild.description: 輕微黃褐斑、色斑
- protocol.mild.treatment: 激光調光
- protocol.mild.sessions: 5-10次
- protocol.mild.interval: 2周間隔
- protocol.moderate.level: 中度
- protocol.moderate.description: 中等深度色素
- protocol.moderate.treatment: Clarity II 755nm
- protocol.moderate.sessions: 3-5次
- protocol.moderate.interval: 3-4周間隔
- protocol.severe.level: 重度 / 頑固性
- protocol.severe.description: 深層黃褐斑、頑固性
- protocol.severe.treatment: Lucas皮秒 + 調光
- protocol.severe.sessions: 5-10次
- protocol.severe.interval: 2-4周間隔
- idealFor[0]: 黃褐斑越來越深且擴大的人
- idealFor[1]: 多次做調光但效果不佳的人
- idealFor[2]: 色斑、雀斑較多困擾的人
- idealFor[3]: 開始出現老年斑的人
- idealFor[4]: 膚色暗沉不均勻的人
- idealFor[5]: 想要無恢復期持續護理的人

### laser/vascular detail (en)

- rednessTypes.title: Customized Treatment by Redness Type
- rednessTypes.subtitle: Optimal wavelength and energy treatment based on the cause and depth of redness
- rednessTypes.recommendedTreatment: Recommended Treatment
- rednessTypes.types[0].type: Facial Flushing
- rednessTypes.types[0].description: Redness easily triggered by emotional or temperature changes
- rednessTypes.types[0].treatment: Clarity II 1064nm Low Power
- rednessTypes.types[1].type: Capillary Dilation
- rednessTypes.types[1].description: Visible spider veins around nose and cheeks
- rednessTypes.types[1].treatment: Clarity II 1064nm High Power
- rednessTypes.types[2].type: Rosacea
- rednessTypes.types[2].description: Chronic skin condition with redness, papules, and pustules
- rednessTypes.types[2].treatment: Clarity II + Skincare Combined
- rednessTypes.types[3].type: Hemangioma / Vascular Malformation
- rednessTypes.types[3].description: Congenital or acquired vascular lesions
- rednessTypes.types[3].treatment: Clarity II Intensive Treatment
- dualWavelength.title: Dual Wavelength Principle
- dualWavelength.subtitle: 755nm and 1064nm wavelengths selectively treat from shallow to deep vessels
- dualWavelength.epidermis: Epidermis
- dualWavelength.dermis: Dermis
- dualWavelength.shallow755: 755nm - Shallow Vessel Target
- dualWavelength.deep1064: 1064nm - Deep Vessel Target
- dualWavelength.alexandrite.title: 755nm Alexandrite
- dualWavelength.alexandrite.points[0]: Targets shallow vessels near epidermis
- dualWavelength.alexandrite.points[1]: Effective for capillary dilation treatment
- dualWavelength.alexandrite.points[2]: High hemoglobin absorption rate
- dualWavelength.ndyag.title: 1064nm Nd:YAG
- dualWavelength.ndyag.points[0]: Reaches deep vessels in dermis
- dualWavelength.ndyag.points[1]: Effective for chronic redness and rosacea
- dualWavelength.ndyag.points[2]: Safe for darker skin types
- clarity.title: Clarity II
- clarity.subtitle: Premium dual-wavelength laser optimized for vascular treatment
- clarity.badge: ONLY OPTION
- clarity.why: Why Clarity II?
- clarity.whyDesc: The most suitable device for vascular treatment among LIV's equipment. The 1064nm Nd:YAG wavelength is selectively absorbed by hemoglobin in blood vessels, treating only vessels without surrounding tissue damage.
- clarity.recommendedSessions: 3-8 sessions (depending on severity)
- clarity.benefits[0].title: Dual Wavelength
- clarity.benefits[0].desc: 755nm (pigment/hair) + 1064nm (vascular/deep pigment) multi-solution
- clarity.benefits[1].title: IntelliTrak Technology
- clarity.benefits[1].desc: Auto 18% overlap for uniform energy delivery
- clarity.benefits[2].title: All Skin Types
- clarity.benefits[2].desc: Safe treatment for Fitzpatrick I-VI
- clarity.benefits[3].title: Cryogen Cooling
- clarity.benefits[3].desc: Skin protection and pain minimization during treatment
- clarity.duration: 15-30 minutes
- clarity.anesthesia: No anesthesia (Cryogen cooling)
- clarity.recovery: Immediate return to daily activities
- protocol.title: Treatment Protocol by Severity
- protocol.mild.level: Mild
- protocol.mild.description: Light flushing, early capillaries
- protocol.mild.sessions: 3-5 sessions
- protocol.mild.interval: 3-4 week interval
- protocol.mild.treatment: Clarity II 1064nm
- protocol.moderate.level: Moderate
- protocol.moderate.description: Chronic redness, dilated capillaries
- protocol.moderate.sessions: 5-8 sessions
- protocol.moderate.interval: 3-4 week interval
- protocol.moderate.treatment: Clarity II 1064nm
- protocol.severe.level: Severe
- protocol.severe.description: Rosacea, severe vascular dilation
- protocol.severe.sessions: 8-10+ sessions
- protocol.severe.interval: 2-3 week interval
- protocol.severe.treatment: Clarity II 1064nm
- idealFor[0]: Those who flush easily with emotional or temperature changes
- idealFor[1]: Those with visible spider veins around nose and cheeks
- idealFor[2]: Those with chronic redness affecting makeup application
- idealFor[3]: Those diagnosed with rosacea
- idealFor[4]: Those with prolonged redness after laser treatment
- idealFor[5]: Those uncomfortable in social situations due to facial flushing

### laser/vascular detail (ja)

- rednessTypes.title: 赤ら顔タイプ別カスタム治療
- rednessTypes.subtitle: 赤みの原因と深さに応じて最適な波長とエネルギーで治療します
- rednessTypes.recommendedTreatment: 推奨治療
- rednessTypes.types[0].type: 顔面紅潮
- rednessTypes.types[0].description: 感情や温度変化で顔が赤くなりやすい症状
- rednessTypes.types[0].treatment: クラリティII 1064nm 低出力
- rednessTypes.types[1].type: 毛細血管拡張
- rednessTypes.types[1].description: 鼻、頬周辺に細い血管が透けて見える症状
- rednessTypes.types[1].treatment: クラリティII 1064nm 高出力
- rednessTypes.types[2].type: 酒さ (Rosacea)
- rednessTypes.types[2].description: 慢性的な赤みと丘疹、膿疱を伴う皮膚疾患
- rednessTypes.types[2].treatment: クラリティII + スキンケア併用
- rednessTypes.types[3].type: 血管腫 / 血管奇形
- rednessTypes.types[3].description: 先天性または後天性血管病変
- rednessTypes.types[3].treatment: クラリティII 集中治療
- dualWavelength.title: デュアル波長の原理
- dualWavelength.subtitle: 755nmと1064nmの2波長が浅い血管から深い血管まで選択的に治療
- dualWavelength.epidermis: 表皮
- dualWavelength.dermis: 真皮
- dualWavelength.shallow755: 755nm - 浅い血管ターゲット
- dualWavelength.deep1064: 1064nm - 深い血管ターゲット
- dualWavelength.alexandrite.title: 755nm アレキサンドライト
- dualWavelength.alexandrite.points[0]: 表皮近くの浅い血管ターゲット
- dualWavelength.alexandrite.points[1]: 毛細血管拡張治療に効果的
- dualWavelength.alexandrite.points[2]: ヘモグロビン吸収率が高い
- dualWavelength.ndyag.title: 1064nm Nd:YAG
- dualWavelength.ndyag.points[0]: 真皮層の深い血管まで到達
- dualWavelength.ndyag.points[1]: 慢性赤ら顔、酒さ治療に効果的
- dualWavelength.ndyag.points[2]: 暗い肌にも安全
- clarity.title: Clarity II クラリティII
- clarity.subtitle: 血管治療に最適化されたデュアル波長プレミアムレーザー
- clarity.badge: ONLY OPTION
- clarity.why: なぜクラリティIIなのか？
- clarity.whyDesc: LIV整形外科が保有する機器の中で血管治療に最も適した機器です。1064nm Nd:YAG波長が血管のヘモグロビンに選択的に吸収され、周辺組織損傷なく血管だけを治療します。
- clarity.recommendedSessions: 3-8回 (症状により)
- clarity.benefits[0].title: デュアル波長
- clarity.benefits[0].desc: 755nm(色素/脱毛) + 1064nm(血管/深部色素) マルチソリューション
- clarity.benefits[1].title: IntelliTrak技術
- clarity.benefits[1].desc: 自動18%オーバーラップで均一なエネルギー照射
- clarity.benefits[2].title: 全ての肌タイプ
- clarity.benefits[2].desc: スキンタイプI-VIまで安全な施術
- clarity.benefits[3].title: クライオゲン冷却
- clarity.benefits[3].desc: 施術中の皮膚保護と痛み最小化
- clarity.duration: 15-30分
- clarity.anesthesia: 無麻酔（クライオゲン冷却）
- clarity.recovery: 即日日常復帰
- protocol.title: 症状別推奨プロトコル
- protocol.mild.level: 軽度
- protocol.mild.description: 軽い赤ら顔、初期毛細血管
- protocol.mild.sessions: 3-5回
- protocol.mild.interval: 3-4週間隔
- protocol.mild.treatment: クラリティII 1064nm
- protocol.moderate.level: 中等度
- protocol.moderate.description: 慢性赤ら顔、拡張した毛細血管
- protocol.moderate.sessions: 5-8回
- protocol.moderate.interval: 3-4週間隔
- protocol.moderate.treatment: クラリティII 1064nm
- protocol.severe.level: 重度
- protocol.severe.description: 酒さ、重度の血管拡張
- protocol.severe.sessions: 8-10回以上
- protocol.severe.interval: 2-3週間隔
- protocol.severe.treatment: クラリティII 1064nm
- idealFor[0]: 感情や温度変化で顔が赤くなりやすい方
- idealFor[1]: 鼻、頬周辺に細い血管が透けて見える方
- idealFor[2]: 慢性的な赤みでメイクのりが悪い方
- idealFor[3]: 酒さと診断された方
- idealFor[4]: レーザー治療後に赤みが長く続く方
- idealFor[5]: 顔面紅潮で対人関係が不便な方

### laser/vascular detail (zh)

- rednessTypes.title: 红血丝类型定制治疗
- rednessTypes.subtitle: 根据发红的原因和深度选择最佳波长和能量进行治疗
- rednessTypes.recommendedTreatment: 推荐治疗
- rednessTypes.types[0].type: 面部潮红
- rednessTypes.types[0].description: 情绪或温度变化时脸容易发红的症状
- rednessTypes.types[0].treatment: Clarity II 1064nm 低功率
- rednessTypes.types[1].type: 毛细血管扩张
- rednessTypes.types[1].description: 鼻子、脸颊周围可见细小血管的症状
- rednessTypes.types[1].treatment: Clarity II 1064nm 高功率
- rednessTypes.types[2].type: 酒糟鼻 (Rosacea)
- rednessTypes.types[2].description: 伴有慢性发红、丘疹、脓疱的皮肤病
- rednessTypes.types[2].treatment: Clarity II + 皮肤护理联合
- rednessTypes.types[3].type: 血管瘤 / 血管畸形
- rednessTypes.types[3].description: 先天性或后天性血管病变
- rednessTypes.types[3].treatment: Clarity II 集中治疗
- dualWavelength.title: 双波长原理
- dualWavelength.subtitle: 755nm和1064nm两种波长选择性治疗从浅层到深层的血管
- dualWavelength.epidermis: 表皮
- dualWavelength.dermis: 真皮
- dualWavelength.shallow755: 755nm - 靶向浅层血管
- dualWavelength.deep1064: 1064nm - 靶向深层血管
- dualWavelength.alexandrite.title: 755nm 亚历山大
- dualWavelength.alexandrite.points[0]: 靶向表皮附近的浅层血管
- dualWavelength.alexandrite.points[1]: 对毛细血管扩张治疗有效
- dualWavelength.alexandrite.points[2]: 血红蛋白吸收率高
- dualWavelength.ndyag.title: 1064nm Nd:YAG
- dualWavelength.ndyag.points[0]: 可到达真皮层的深层血管
- dualWavelength.ndyag.points[1]: 对慢性红血丝、酒糟鼻治疗有效
- dualWavelength.ndyag.points[2]: 对深色皮肤也安全
- clarity.title: Clarity II 柯美丽
- clarity.subtitle: 针对血管治疗优化的双波长高端激光
- clarity.badge: ONLY OPTION
- clarity.why: 为什么选择Clarity II？
- clarity.whyDesc: 是LIV整形外科拥有的设备中最适合血管治疗的设备。1064nm Nd:YAG波长选择性吸收血管中的血红蛋白，在不损伤周围组织的情况下只治疗血管。
- clarity.recommendedSessions: 3-8次 (视症状而定)
- clarity.benefits[0].title: 双波长
- clarity.benefits[0].desc: 755nm(色素/脱毛) + 1064nm(血管/深层色素) 多功能方案
- clarity.benefits[1].title: IntelliTrak技术
- clarity.benefits[1].desc: 自动18%重叠，均匀传递能量
- clarity.benefits[2].title: 所有肤质适用
- clarity.benefits[2].desc: 皮肤类型I-VI均可安全治疗
- clarity.benefits[3].title: 低温气体冷却
- clarity.benefits[3].desc: 治疗中保护皮肤并最大程度减少疼痛
- clarity.duration: 15-30分钟
- clarity.anesthesia: 无麻醉（低温气体冷却）
- clarity.recovery: 即刻恢复日常
- protocol.title: 症状推荐方案
- protocol.mild.level: 轻度
- protocol.mild.description: 轻微红血丝、初期毛细血管
- protocol.mild.sessions: 3-5次
- protocol.mild.interval: 3-4周间隔
- protocol.mild.treatment: Clarity II 1064nm
- protocol.moderate.level: 中度
- protocol.moderate.description: 慢性红血丝、扩张的毛细血管
- protocol.moderate.sessions: 5-8次
- protocol.moderate.interval: 3-4周间隔
- protocol.moderate.treatment: Clarity II 1064nm
- protocol.severe.level: 重度
- protocol.severe.description: 酒糟鼻、严重血管扩张
- protocol.severe.sessions: 8-10次以上
- protocol.severe.interval: 2-3周间隔
- protocol.severe.treatment: Clarity II 1064nm
- idealFor[0]: 情绪或温度变化时脸容易发红的人
- idealFor[1]: 鼻子、脸颊周围可见细小血管的人
- idealFor[2]: 因慢性红血丝化妆不服帖的人
- idealFor[3]: 被诊断为酒糟鼻的人
- idealFor[4]: 激光治疗后红血丝持续较久的人
- idealFor[5]: 因面部潮红影响社交的人

### laser/vascular detail (zh-TW)

- rednessTypes.title: 紅血絲類型定製治療
- rednessTypes.subtitle: 根據發紅的原因和深度選擇最佳波長和能量進行治療
- rednessTypes.recommendedTreatment: 推薦治療
- rednessTypes.types[0].type: 面部潮紅
- rednessTypes.types[0].description: 情緒或溫度變化時臉容易發紅的症狀
- rednessTypes.types[0].treatment: Clarity II 1064nm 低功率
- rednessTypes.types[1].type: 毛細血管擴張
- rednessTypes.types[1].description: 鼻子、臉頰周圍可見細小血管的症狀
- rednessTypes.types[1].treatment: Clarity II 1064nm 高功率
- rednessTypes.types[2].type: 酒糟鼻 (Rosacea)
- rednessTypes.types[2].description: 伴有慢性發紅、丘疹、膿皰的皮膚病
- rednessTypes.types[2].treatment: Clarity II + 皮膚護理聯合
- rednessTypes.types[3].type: 血管瘤 / 血管畸形
- rednessTypes.types[3].description: 先天性或後天性血管病變
- rednessTypes.types[3].treatment: Clarity II 集中治療
- dualWavelength.title: 雙波長原理
- dualWavelength.subtitle: 755nm和1064nm兩種波長選擇性治療從淺層到深層的血管
- dualWavelength.epidermis: 表皮
- dualWavelength.dermis: 真皮
- dualWavelength.shallow755: 755nm - 靶向淺層血管
- dualWavelength.deep1064: 1064nm - 靶向深層血管
- dualWavelength.alexandrite.title: 755nm 亞歷山大
- dualWavelength.alexandrite.points[0]: 靶向表皮附近的淺層血管
- dualWavelength.alexandrite.points[1]: 對毛細血管擴張治療有效
- dualWavelength.alexandrite.points[2]: 血紅蛋白吸收率高
- dualWavelength.ndyag.title: 1064nm Nd:YAG
- dualWavelength.ndyag.points[0]: 可到達真皮層的深層血管
- dualWavelength.ndyag.points[1]: 對慢性紅血絲、酒糟鼻治療有效
- dualWavelength.ndyag.points[2]: 對深色皮膚也安全
- clarity.title: Clarity II 柯美麗
- clarity.subtitle: 針對血管治療優化的雙波長高端激光
- clarity.badge: ONLY OPTION
- clarity.why: 為什麼選擇Clarity II？
- clarity.whyDesc: 是LIV 整形外科擁有的設備中最適合血管治療的設備。1064nm Nd:YAG波長選擇性吸收血管中的血紅蛋白，在不損傷周圍組織的情況下只治療血管。
- clarity.recommendedSessions: 3-8次 (視症狀而定)
- clarity.benefits[0].title: 雙波長
- clarity.benefits[0].desc: 755nm(色素/脫毛) + 1064nm(血管/深層色素) 多功能方案
- clarity.benefits[1].title: IntelliTrak技術
- clarity.benefits[1].desc: 自動18%重疊，均勻傳遞能量
- clarity.benefits[2].title: 所有膚質適用
- clarity.benefits[2].desc: 皮膚類型I-VI均可安全治療
- clarity.benefits[3].title: 低溫氣體冷卻
- clarity.benefits[3].desc: 治療中保護皮膚並最大程度減少疼痛
- clarity.duration: 15-30分鐘
- clarity.anesthesia: 無麻醉（低溫氣體冷卻）
- clarity.recovery: 即刻恢復日常
- protocol.title: 症狀推薦方案
- protocol.mild.level: 輕度
- protocol.mild.description: 輕微紅血絲、初期毛細血管
- protocol.mild.sessions: 3-5次
- protocol.mild.interval: 3-4周間隔
- protocol.mild.treatment: Clarity II 1064nm
- protocol.moderate.level: 中度
- protocol.moderate.description: 慢性紅血絲、擴張的毛細血管
- protocol.moderate.sessions: 5-8次
- protocol.moderate.interval: 3-4周間隔
- protocol.moderate.treatment: Clarity II 1064nm
- protocol.severe.level: 重度
- protocol.severe.description: 酒糟鼻、嚴重血管擴張
- protocol.severe.sessions: 8-10次以上
- protocol.severe.interval: 2-3周間隔
- protocol.severe.treatment: Clarity II 1064nm
- idealFor[0]: 情緒或溫度變化時臉容易發紅的人
- idealFor[1]: 鼻子、臉頰周圍可見細小血管的人
- idealFor[2]: 因慢性紅血絲化妝不服帖的人
- idealFor[3]: 被診斷為酒糟鼻的人
- idealFor[4]: 激光治療後紅血絲持續較久的人
- idealFor[5]: 因面部潮紅影響社交的人

### laser/skintone detail (en)

- concernsSection.title: Do you have these skin concerns?
- concernsSection.subtitle: There are various causes of uneven skin tone. We offer customized solutions for your specific concerns.
- concernsSection.customSolution: Custom Solution
- concernsSection.concerns[0].title: Overall Dull Skin
- concernsSection.concerns[0].description: Skin appears dark and lifeless due to sun exposure, stress, or fatigue
- concernsSection.concerns[0].solution: Laser toning for overall skin brightness improvement
- concernsSection.concerns[0].equipment[0]: Laser Toning
- concernsSection.concerns[0].equipment[1]: Ulblanc
- concernsSection.concerns[1].title: Partial Pigmentation
- concernsSection.concerns[1].description: Dark pigmentation deposited on cheeks, forehead, or around cheekbones
- concernsSection.concerns[1].solution: Intensive laser toning + pico laser combination
- concernsSection.concerns[1].equipment[0]: Laser Toning
- concernsSection.concerns[1].equipment[1]: Lucas
- concernsSection.concerns[2].title: Pores/Skin Texture Issues
- concernsSection.concerns[2].description: Uneven skin tone due to enlarged pores and rough texture
- concernsSection.concerns[2].solution: Utilizing laser toning's collagen remodeling effect
- concernsSection.concerns[2].equipment[0]: Laser Toning
- concernsSection.concerns[3].title: Reduced Skin Transparency
- concernsSection.concerns[3].description: Skin looks dull and lacks transparency, appearing unhealthy
- concernsSection.concerns[3].solution: Ulblanc for skin transparency and radiance recovery
- concernsSection.concerns[3].equipment[0]: Ulblanc
- concernsSection.concerns[3].equipment[1]: Laser Toning
- toningSection.badge: Treatment Principle
- toningSection.title: The Science of Laser Toning
- toningSection.description1: Laser toning uses <strong>1064nm Nd:YAG laser</strong> at low power with repeated pulses to gradually break down melanin in the skin.
- toningSection.description2: Unlike conventional high-power lasers, it delivers <strong>low energy uniformly over a wide area</strong> to minimize skin irritation while maximizing results.
- toningSection.effectsTitle: 3 Effects of Laser Toning
- toningSection.effects[0].title: Melanin Breakdown
- toningSection.effects[0].desc: Gradually breaks down pigments in the skin
- toningSection.effects[1].title: Collagen Production
- toningSection.effects[1].desc: Stimulates dermis to improve skin elasticity
- toningSection.effects[2].title: Pore Reduction
- toningSection.effects[2].desc: Controls sebaceous gland function and tightens pores
- equipmentSection.badge: LIV Equipment
- equipmentSection.title: Dedicated Skin Tone Improvement Equipment
- equipmentSection.subtitle: Professional equipment for gradual skin brightening without disrupting daily life
- equipmentSection.labels.wavelength: Wavelength
- equipmentSection.labels.feature: Feature
- equipmentSection.labels.advantage: Advantage
- equipmentSection.labels.indications: Indications
- equipmentSection.labels.recommendedSessions: Recommended Sessions
- equipmentSection.toning.name: Laser Toning
- equipmentSection.toning.nameEn: Laser Toning (Spectra XT)
- equipmentSection.toning.wavelength: 1064nm Nd:YAG
- equipmentSection.toning.feature: Low-power repeated irradiation (MLA mode)
- equipmentSection.toning.advantage: Zero downtime, immediate return to daily activities
- equipmentSection.toning.targets[0]: Dull Skin
- equipmentSection.toning.targets[1]: Fine Lines
- equipmentSection.toning.targets[2]: Pores
- equipmentSection.toning.targets[3]: Texture
- equipmentSection.toning.targets[4]: Brightness
- equipmentSection.ulblanc.name: Ulblanc
- equipmentSection.ulblanc.nameEn: Ulblanc Whitening Laser
- equipmentSection.ulblanc.wavelength: Dedicated whitening wavelength
- equipmentSection.ulblanc.feature: Selective melanin targeting
- equipmentSection.ulblanc.advantage: Improve skin tone without irritation
- equipmentSection.ulblanc.targets[0]: Skin Whitening
- equipmentSection.ulblanc.targets[1]: Tone Evenness
- equipmentSection.ulblanc.targets[2]: Transparency
- equipmentSection.ulblanc.targets[3]: Radiance
- equipmentSection.ulblanc.targets[4]: Dullness
- equipmentSection.synergyTitle: Laser Toning + Ulblanc Synergy Effect
- equipmentSection.synergyDesc: By improving overall skin condition with laser toning and directly targeting melanin with Ulblanc, you can expect <strong>1.5-2x faster results</strong> compared to single treatments. Both devices have no downtime, making combination therapy easy.
- protocolSection.badge: Treatment Process
- protocolSection.title: 3-Step Skin Tone Improvement Program
- protocolSection.subtitle: Systematic step-by-step treatment for natural and lasting skin tone improvement
- protocolSection.steps[0].title: Skin Conditioning
- protocolSection.steps[0].equipment: Laser Toning
- protocolSection.steps[0].description: Uniformly delivers low-power energy across the skin with 1064nm wavelength to improve baseline skin condition.
- protocolSection.steps[0].sessions: Weekly, 4-5 sessions
- protocolSection.steps[1].title: Melanin Targeting
- protocolSection.steps[1].equipment: Ulblanc
- protocolSection.steps[1].description: Uses specialized wavelength that selectively acts on melanin to gradually break down pigments and induce skin whitening.
- protocolSection.steps[1].sessions: Every 2 weeks, 3-4 sessions
- protocolSection.steps[2].title: Maintenance
- protocolSection.steps[2].equipment: Laser Toning + Ulblanc
- protocolSection.steps[2].description: Monthly maintenance to preserve brightened skin tone and prevent new pigmentation.
- protocolSection.steps[2].sessions: Monthly maintenance
- advantagesSection.title: Advantages of Laser Toning
- advantagesSection.subtitle: Convenient skin care for busy modern lifestyles
- advantagesSection.items[0].title: Zero Downtime
- advantagesSection.items[0].desc: Return to daily activities immediately
- advantagesSection.items[1].title: Lunchtime Treatment
- advantagesSection.items[1].desc: Quick 15-20 minute sessions
- advantagesSection.items[2].title: Natural Results
- advantagesSection.items[2].desc: Gradually brightening skin
- advantagesSection.items[3].title: Comprehensive Care
- advantagesSection.items[3].desc: Tone, pores, elasticity together

### laser/skintone detail (ja)

- concernsSection.title: このような肌の悩みはありませんか？
- concernsSection.subtitle: 肌トーンの不均一の原因は様々です。お悩み別のカスタムソリューションをご提案します。
- concernsSection.customSolution: カスタムソリューション
- concernsSection.concerns[0].title: 全体的にくすんだ肌
- concernsSection.concerns[0].description: 日光、ストレス、疲労などで肌全体が暗く生気がないように見える状態
- concernsSection.concerns[0].solution: レーザートーニングで全体的な肌の明るさを改善
- concernsSection.concerns[0].equipment[0]: レーザートーニング
- concernsSection.concerns[0].equipment[1]: ウルブラン
- concernsSection.concerns[1].title: 部分的な色素沈着
- concernsSection.concerns[1].description: 頬、額、頬骨周辺に部分的に暗い色素が沈着している状態
- concernsSection.concerns[1].solution: レーザートーニング集中治療 + ピコレーザー併用
- concernsSection.concerns[1].equipment[0]: レーザートーニング
- concernsSection.concerns[1].equipment[1]: Lucas
- concernsSection.concerns[2].title: 毛穴/肌質の悩み
- concernsSection.concerns[2].description: 広がった毛穴と荒れた肌質により肌トーンが不均一に見える状態
- concernsSection.concerns[2].solution: レーザートーニングのコラーゲンリモデリング効果を活用
- concernsSection.concerns[2].equipment[0]: レーザートーニング
- concernsSection.concerns[3].title: 肌の透明感低下
- concernsSection.concerns[3].description: 肌がくすんで透明感がなく健康に見えない状態
- concernsSection.concerns[3].solution: ウルブランで肌の透明感と光沢を回復
- concernsSection.concerns[3].equipment[0]: ウルブラン
- concernsSection.concerns[3].equipment[1]: レーザートーニング
- toningSection.badge: 治療原理
- toningSection.title: レーザートーニングの科学
- toningSection.description1: レーザートーニングは<strong>1064nm Nd:YAGレーザー</strong>を低出力で繰り返し照射し、肌の中のメラニンを徐々に分解する施術です。
- toningSection.description2: 従来の高出力レーザーと異なり、<strong>低エネルギーを広い範囲に均一に</strong>照射して肌への刺激を最小限に抑えながら効果を最大化します。
- toningSection.effectsTitle: レーザートーニングの3つの効果
- toningSection.effects[0].title: メラニン分解
- toningSection.effects[0].desc: 肌の中の色素を徐々に分解
- toningSection.effects[1].title: コラーゲン生成
- toningSection.effects[1].desc: 真皮層刺激で肌の弾力を改善
- toningSection.effects[2].title: 毛穴縮小
- toningSection.effects[2].desc: 皮脂腺機能調節と毛穴タイトニング
- equipmentSection.badge: LIV 保有機器
- equipmentSection.title: 肌トーン改善専用機器
- equipmentSection.subtitle: 日常生活に支障なく、徐々に明るくなる肌トーンのための専門機器
- equipmentSection.labels.wavelength: 波長
- equipmentSection.labels.feature: 特徴
- equipmentSection.labels.advantage: メリット
- equipmentSection.labels.indications: 適応症
- equipmentSection.labels.recommendedSessions: 推奨回数
- equipmentSection.toning.name: レーザートーニング
- equipmentSection.toning.nameEn: Laser Toning (Spectra XT)
- equipmentSection.toning.wavelength: 1064nm Nd:YAG
- equipmentSection.toning.feature: 低出力繰り返し照射（MLAモード）
- equipmentSection.toning.advantage: ダウンタイムゼロ、すぐに日常生活可能
- equipmentSection.toning.targets[0]: くすんだ肌
- equipmentSection.toning.targets[1]: 小じわ
- equipmentSection.toning.targets[2]: 毛穴
- equipmentSection.toning.targets[3]: 肌質
- equipmentSection.toning.targets[4]: 明るさ改善
- equipmentSection.ulblanc.name: ウルブラン
- equipmentSection.ulblanc.nameEn: Ulblanc Whitening Laser
- equipmentSection.ulblanc.wavelength: 専用ホワイトニング波長
- equipmentSection.ulblanc.feature: メラニン選択的ターゲティング
- equipmentSection.ulblanc.advantage: 刺激なく肌トーン改善
- equipmentSection.ulblanc.targets[0]: 肌美白
- equipmentSection.ulblanc.targets[1]: トーン均一化
- equipmentSection.ulblanc.targets[2]: 透明感
- equipmentSection.ulblanc.targets[3]: 光沢
- equipmentSection.ulblanc.targets[4]: くすみ
- equipmentSection.synergyTitle: レーザートーニング + ウルブラン シナジー効果
- equipmentSection.synergyDesc: レーザートーニングで肌全体のコンディションを改善し、ウルブランでメラニンを直接ターゲティングすると、単独施術に比べて<strong>1.5〜2倍速い効果</strong>が期待できます。両機器ともダウンタイムがないため、負担なく併用治療が可能です。
- protocolSection.badge: 治療過程
- protocolSection.title: 3ステップ肌トーン改善プログラム
- protocolSection.subtitle: 体系的な段階別治療で自然で持続的な肌トーン改善を実現します
- protocolSection.steps[0].title: 肌コンディショニング
- protocolSection.steps[0].equipment: レーザートーニング
- protocolSection.steps[0].description: 1064nm波長で肌全体に低出力エネルギーを均一に照射し、肌のベースコンディションを改善します。
- protocolSection.steps[0].sessions: 週1回、4-5回
- protocolSection.steps[1].title: メラニンターゲティング
- protocolSection.steps[1].equipment: ウルブラン
- protocolSection.steps[1].description: メラニンに選択的に作用する専用波長で色素を徐々に分解し、肌の美白を促します。
- protocolSection.steps[1].sessions: 2週間間隔、3-4回
- protocolSection.steps[2].title: 維持管理
- protocolSection.steps[2].equipment: レーザートーニング + ウルブラン
- protocolSection.steps[2].description: 月1回の定期的なケアで明るくなった肌トーンを維持し、新たな色素沈着を予防します。
- protocolSection.steps[2].sessions: 月1回維持
- advantagesSection.title: レーザートーニングのメリット
- advantagesSection.subtitle: 忙しい現代人のための負担のない肌ケア
- advantagesSection.items[0].title: ダウンタイムゼロ
- advantagesSection.items[0].desc: 施術直後から日常生活可能
- advantagesSection.items[1].title: ランチタイム施術
- advantagesSection.items[1].desc: 15-20分で手軽
- advantagesSection.items[2].title: 自然な効果
- advantagesSection.items[2].desc: 徐々に明るくなる肌
- advantagesSection.items[3].title: 複合改善
- advantagesSection.items[3].desc: トーン、毛穴、弾力を同時ケア

### laser/skintone detail (zh)

- concernsSection.title: 您有这些肌肤困扰吗？
- concernsSection.subtitle: 肤色不均的原因多种多样。我们针对您的具体问题提供定制方案。
- concernsSection.customSolution: 定制方案
- concernsSection.concerns[0].title: 整体暗沉
- concernsSection.concerns[0].description: 因日晒、压力、疲劳等导致肤色整体暗淡无光
- concernsSection.concerns[0].solution: 激光嫩肤整体提亮肤色
- concernsSection.concerns[0].equipment[0]: 激光嫩肤
- concernsSection.concerns[0].equipment[1]: Ulblanc
- concernsSection.concerns[1].title: 局部色素沉着
- concernsSection.concerns[1].description: 脸颊、额头、颧骨周围局部出现深色色素沉着
- concernsSection.concerns[1].solution: 激光嫩肤密集治疗 + 皮秒激光联合
- concernsSection.concerns[1].equipment[0]: 激光嫩肤
- concernsSection.concerns[1].equipment[1]: Lucas
- concernsSection.concerns[2].title: 毛孔/肤质问题
- concernsSection.concerns[2].description: 因毛孔粗大、肤质粗糙导致肤色看起来不均匀
- concernsSection.concerns[2].solution: 利用激光嫩肤的胶原蛋白重塑效果
- concernsSection.concerns[2].equipment[0]: 激光嫩肤
- concernsSection.concerns[3].title: 肌肤透明度下降
- concernsSection.concerns[3].description: 肌肤暗淡无透明感，看起来不健康
- concernsSection.concerns[3].solution: Ulblanc恢复肌肤透明度和光泽
- concernsSection.concerns[3].equipment[0]: Ulblanc
- concernsSection.concerns[3].equipment[1]: 激光嫩肤
- toningSection.badge: 治疗原理
- toningSection.title: 激光嫩肤的科学
- toningSection.description1: 激光嫩肤使用<strong>1064nm Nd:YAG激光</strong>以低能量重复照射，逐渐分解皮肤中的黑色素。
- toningSection.description2: 与传统高能量激光不同，<strong>以低能量均匀覆盖大面积</strong>，最大程度减少对皮肤的刺激，同时最大化效果。
- toningSection.effectsTitle: 激光嫩肤的3大效果
- toningSection.effects[0].title: 黑色素分解
- toningSection.effects[0].desc: 逐步分解皮肤中的色素
- toningSection.effects[1].title: 胶原蛋白生成
- toningSection.effects[1].desc: 刺激真皮层改善皮肤弹性
- toningSection.effects[2].title: 毛孔收缩
- toningSection.effects[2].desc: 调节皮脂腺功能、收紧毛孔
- equipmentSection.badge: LIV 设备
- equipmentSection.title: 肤色改善专用设备
- equipmentSection.subtitle: 不影响日常生活，逐渐提亮肤色的专业设备
- equipmentSection.labels.wavelength: 波长
- equipmentSection.labels.feature: 特点
- equipmentSection.labels.advantage: 优势
- equipmentSection.labels.indications: 适应症
- equipmentSection.labels.recommendedSessions: 建议次数
- equipmentSection.toning.name: 激光嫩肤
- equipmentSection.toning.nameEn: Laser Toning (Spectra XT)
- equipmentSection.toning.wavelength: 1064nm Nd:YAG
- equipmentSection.toning.feature: 低能量重复照射（MLA模式）
- equipmentSection.toning.advantage: 零恢复期，立即恢复日常生活
- equipmentSection.toning.targets[0]: 暗沉肌肤
- equipmentSection.toning.targets[1]: 细纹
- equipmentSection.toning.targets[2]: 毛孔
- equipmentSection.toning.targets[3]: 肤质
- equipmentSection.toning.targets[4]: 提亮
- equipmentSection.ulblanc.name: Ulblanc
- equipmentSection.ulblanc.nameEn: Ulblanc Whitening Laser
- equipmentSection.ulblanc.wavelength: 专用美白波长
- equipmentSection.ulblanc.feature: 选择性靶向黑色素
- equipmentSection.ulblanc.advantage: 无刺激改善肤色
- equipmentSection.ulblanc.targets[0]: 美白
- equipmentSection.ulblanc.targets[1]: 均匀肤色
- equipmentSection.ulblanc.targets[2]: 透明感
- equipmentSection.ulblanc.targets[3]: 光泽
- equipmentSection.ulblanc.targets[4]: 暗沉
- equipmentSection.synergyTitle: 激光嫩肤 + Ulblanc 协同效果
- equipmentSection.synergyDesc: 激光嫩肤改善整体肤质，Ulblanc直接靶向黑色素，与单独治疗相比可期待<strong>1.5-2倍更快的效果</strong>。两种设备都无恢复期，可轻松进行联合治疗。
- protocolSection.badge: 治疗流程
- protocolSection.title: 3步肤色改善计划
- protocolSection.subtitle: 系统性分阶段治疗，实现自然持久的肤色改善
- protocolSection.steps[0].title: 肌肤调理
- protocolSection.steps[0].equipment: 激光嫩肤
- protocolSection.steps[0].description: 使用1064nm波长均匀地向皮肤照射低能量，改善皮肤基础状态。
- protocolSection.steps[0].sessions: 每周1次，4-5次
- protocolSection.steps[1].title: 黑色素靶向
- protocolSection.steps[1].equipment: Ulblanc
- protocolSection.steps[1].description: 使用选择性作用于黑色素的专用波长，逐步分解色素，促进皮肤美白。
- protocolSection.steps[1].sessions: 每2周，3-4次
- protocolSection.steps[2].title: 维护管理
- protocolSection.steps[2].equipment: 激光嫩肤 + Ulblanc
- protocolSection.steps[2].description: 每月定期护理维持提亮后的肤色，预防新的色素沉着。
- protocolSection.steps[2].sessions: 每月1次维护
- advantagesSection.title: 激光嫩肤的优势
- advantagesSection.subtitle: 为忙碌现代人提供轻松护肤方案
- advantagesSection.items[0].title: 零恢复期
- advantagesSection.items[0].desc: 治疗后立即恢复日常活动
- advantagesSection.items[1].title: 午休时段治疗
- advantagesSection.items[1].desc: 仅需15-20分钟
- advantagesSection.items[2].title: 自然效果
- advantagesSection.items[2].desc: 肌肤逐渐变亮
- advantagesSection.items[3].title: 综合改善
- advantagesSection.items[3].desc: 肤色、毛孔、弹性同步改善

### laser/skintone detail (zh-TW)

- concernsSection.title: 您有這些肌膚困擾嗎？
- concernsSection.subtitle: 膚色不均的原因多種多樣。我們針對您的具體問題提供定製方案。
- concernsSection.customSolution: 定製方案
- concernsSection.concerns[0].title: 整體暗沉
- concernsSection.concerns[0].description: 因日曬、壓力、疲勞等導致膚色整體暗淡無光
- concernsSection.concerns[0].solution: 激光嫩膚整體提亮膚色
- concernsSection.concerns[0].equipment[0]: 激光嫩膚
- concernsSection.concerns[0].equipment[1]: Ulblanc
- concernsSection.concerns[1].title: 局部色素沉著
- concernsSection.concerns[1].description: 臉頰、額頭、顴骨周圍局部出現深色色素沉著
- concernsSection.concerns[1].solution: 激光嫩膚密集治療 + 皮秒激光聯合
- concernsSection.concerns[1].equipment[0]: 激光嫩膚
- concernsSection.concerns[1].equipment[1]: Lucas
- concernsSection.concerns[2].title: 毛孔/膚質問題
- concernsSection.concerns[2].description: 因毛孔粗大、膚質粗糙導致膚色看起來不均勻
- concernsSection.concerns[2].solution: 利用激光嫩膚的膠原蛋白重塑效果
- concernsSection.concerns[2].equipment[0]: 激光嫩膚
- concernsSection.concerns[3].title: 肌膚透明度下降
- concernsSection.concerns[3].description: 肌膚暗淡無透明感，看起來不健康
- concernsSection.concerns[3].solution: Ulblanc恢復肌膚透明度和光澤
- concernsSection.concerns[3].equipment[0]: Ulblanc
- concernsSection.concerns[3].equipment[1]: 激光嫩膚
- toningSection.badge: 治療原理
- toningSection.title: 激光嫩膚的科學
- toningSection.description1: 激光嫩膚使用<strong>1064nm Nd:YAG激光</strong>以低能量重複照射，逐漸分解皮膚中的黑色素。
- toningSection.description2: 與傳統高能量激光不同，<strong>以低能量均勻覆蓋大面積</strong>，最大程度減少對皮膚的刺激，同時最大化效果。
- toningSection.effectsTitle: 激光嫩膚的3大效果
- toningSection.effects[0].title: 黑色素分解
- toningSection.effects[0].desc: 逐步分解皮膚中的色素
- toningSection.effects[1].title: 膠原蛋白生成
- toningSection.effects[1].desc: 刺激真皮層改善皮膚彈性
- toningSection.effects[2].title: 毛孔收縮
- toningSection.effects[2].desc: 調節皮脂腺功能、收緊毛孔
- equipmentSection.badge: LIV 設備
- equipmentSection.title: 膚色改善專用設備
- equipmentSection.subtitle: 不影響日常生活，逐漸提亮膚色的專業設備
- equipmentSection.labels.wavelength: 波長
- equipmentSection.labels.feature: 特點
- equipmentSection.labels.advantage: 優勢
- equipmentSection.labels.indications: 適應症
- equipmentSection.labels.recommendedSessions: 建議次數
- equipmentSection.toning.name: 激光嫩膚
- equipmentSection.toning.nameEn: Laser Toning (Spectra XT)
- equipmentSection.toning.wavelength: 1064nm Nd:YAG
- equipmentSection.toning.feature: 低能量重複照射（MLA模式）
- equipmentSection.toning.advantage: 零恢復期，立即恢復日常生活
- equipmentSection.toning.targets[0]: 暗沉肌膚
- equipmentSection.toning.targets[1]: 細紋
- equipmentSection.toning.targets[2]: 毛孔
- equipmentSection.toning.targets[3]: 膚質
- equipmentSection.toning.targets[4]: 提亮
- equipmentSection.ulblanc.name: Ulblanc
- equipmentSection.ulblanc.nameEn: Ulblanc Whitening Laser
- equipmentSection.ulblanc.wavelength: 專用美白波長
- equipmentSection.ulblanc.feature: 選擇性靶向黑色素
- equipmentSection.ulblanc.advantage: 無刺激改善膚色
- equipmentSection.ulblanc.targets[0]: 美白
- equipmentSection.ulblanc.targets[1]: 均勻膚色
- equipmentSection.ulblanc.targets[2]: 透明感
- equipmentSection.ulblanc.targets[3]: 光澤
- equipmentSection.ulblanc.targets[4]: 暗沉
- equipmentSection.synergyTitle: 激光嫩膚 + Ulblanc 協同效果
- equipmentSection.synergyDesc: 激光嫩膚改善整體膚質，Ulblanc直接靶向黑色素，與單獨治療相比可期待<strong>1.5-2倍更快的效果</strong>。兩種設備都無恢復期，可輕鬆進行聯合治療。
- protocolSection.badge: 治療流程
- protocolSection.title: 3步膚色改善計劃
- protocolSection.subtitle: 系統性分階段治療，實現自然持久的膚色改善
- protocolSection.steps[0].title: 肌膚調理
- protocolSection.steps[0].equipment: 激光嫩膚
- protocolSection.steps[0].description: 使用1064nm波長均勻地向皮膚照射低能量，改善皮膚基礎狀態。
- protocolSection.steps[0].sessions: 每週1次，4-5次
- protocolSection.steps[1].title: 黑色素靶向
- protocolSection.steps[1].equipment: Ulblanc
- protocolSection.steps[1].description: 使用選擇性作用於黑色素的專用波長，逐步分解色素，促進皮膚美白。
- protocolSection.steps[1].sessions: 每2周，3-4次
- protocolSection.steps[2].title: 維護管理
- protocolSection.steps[2].equipment: 激光嫩膚 + Ulblanc
- protocolSection.steps[2].description: 每月定期護理維持提亮後的膚色，預防新的色素沉著。
- protocolSection.steps[2].sessions: 每月1次維護
- advantagesSection.title: 激光嫩膚的優勢
- advantagesSection.subtitle: 為忙碌現代人提供輕鬆護膚方案
- advantagesSection.items[0].title: 零恢復期
- advantagesSection.items[0].desc: 治療後立即恢復日常活動
- advantagesSection.items[1].title: 午休時段治療
- advantagesSection.items[1].desc: 僅需15-20分鐘
- advantagesSection.items[2].title: 自然效果
- advantagesSection.items[2].desc: 肌膚逐漸變亮
- advantagesSection.items[3].title: 綜合改善
- advantagesSection.items[3].desc: 膚色、毛孔、彈性同步改善

### LASER_CATEGORIES treatmentProtocol / TREATMENTS.laser 회수 (ko 원문)

- pigmentation.treatmentProtocol: {"mild":{"treatment":"레이저 토닝","sessions":"5-10회","interval":"2주"},"moderate":{"treatment":"클래리티 II 755nm","sessions":"3-5회","interval":"3-4주"},"severe":{"treatment":"루카스 피코 + 토닝","sessions":"5-10회","interval":"2-4주"}}
- vascular.treatmentProtocol: {"mild":{"treatment":"클래리티 II 1064nm","sessions":"3-5회","interval":"3-4주"},"moderate":{"treatment":"클래리티 II 1064nm","sessions":"5-8회","interval":"3-4주"},"severe":{"treatment":"클래리티 II 집중 치료","sessions":"8-10회","interval":"2-3주"}}
- skintone.treatmentProtocol: {"mild":{"treatment":"울블랑 + 토닝","sessions":"5회","interval":"2주"},"moderate":{"treatment":"울블랑 + 토닝 + 클래리티","sessions":"10회","interval":"2주"},"severe":{"treatment":"집중 복합 관리","sessions":"15회+","interval":"1-2주"}}
- hair-removal.treatmentProtocol: {"face":{"treatment":"클래리티 II 755nm","sessions":"6-8회","interval":"4-6주"},"body":{"treatment":"클래리티 II 755nm","sessions":"6-10회","interval":"6-8주"},"bikini":{"treatment":"클래리티 II 755nm/1064nm","sessions":"8-10회","interval":"6-8주"}}
- tattoo.treatmentProtocol: {"black":{"treatment":"루카스 피코","sessions":"5-8회","interval":"6-8주"},"color":{"treatment":"루카스 피코 + 클래리티","sessions":"8-12회","interval":"6-8주"},"cosmetic":{"treatment":"루카스 피코","sessions":"3-5회","interval":"4-6주"}}
- laser.clarity: {"name":"클래리티 II","nameEn":"Clarity II","duration":"15-30분","anesthesia":"무마취 (크라이오겐 쿨링으로 통증 최소화)","recovery":"3-5일 (색소 부위 미세 딱지 가능)","results":"2-4주 간격 3-5회 시술 권장"}
- laser.lucas: {"name":"루카스 레이저","nameEn":"Lucas Laser","duration":"20-40분","anesthesia":"마취 크림 (선택)","recovery":"3-7일 (미세 딱지 가능)","results":"2-4주 간격 3-5회 시술 권장"}
- laser.toning: {"name":"레이저 토닝","nameEn":"Laser Toning","duration":"5-15분","anesthesia":"무마취","recovery":"없음 (즉시 일상 복귀)","results":"10회 이상 누적 시술 권장, 3-4회부터 효과 체감"}
- laser.ulblanc: {"name":"울블랑","nameEn":"Ulblanc","duration":"15-20분","anesthesia":"무마취","recovery":"없음 (즉시 일상 복귀)","results":"5-10회 누적 시술 권장"}

## 5. 외국인 안내 페이지 사실 (international 네임스페이스, en 기준; 다른 언어는 같은 키)

- hero.subtitle: LIV Clinic is a non-surgical anti-aging clinic in Gangnam, Seoul, one minute from Sinsa Station, next to Garosu-gil. Consultations are available in English, Japanese, and Chinese, with free interpretation arranged on request.
- why.items: Board-certified plastic surgeon — Every treatment is planned and performed under a board-certified plastic surgeon with SCI-indexed research publications. / Official Ultherapy Prime & Thermage FLX partner — LIV is an officially certified provider using genuine Ultherapy Prime and Thermage FLX systems with authentic cartridges. / Same price as Korean patients — International patients pay from the same price list as local patients. There is no foreigner surcharge. / Focused on non-surgical anti-aging — Lifting, skin tightening, botox, filler, and skin boosters — treatments designed for natural, refreshed results without surgery.
- communication.desc: Consultations are available in English, Japanese, and Chinese. If you prefer, we arrange interpretation free of charge so nothing is lost in translation.
- channels: English: WhatsApp · Live chat on this site / 日本語: LINE · Live chat / 中文: WeChat 微信 · Online chat
- booking.desc: Most non-surgical treatments take 30 to 90 minutes and require no hospitalization, so many patients are treated on the same day as their visit.; steps: 1) Contact us — Message us on WhatsApp, LINE, WeChat, or the live chat on this site, in your language. 2) Remote consultation & quote — Share your concerns and photos. We suggest suitable treatments and send a clear price estimate. 3) Schedule your visit — Pick a date and time that fits your travel plans and reserve your appointment. 4) Visit & same-day treatment — Meet the surgeon for a final in-person consultation, then receive your treatment the same day in most cases. 5) Remote aftercare — After you return home, we follow up and answer your questions through your messenger or chat.
- stay.rows: Ultherapy Prime: Same day · no revisit required / Thermage FLX: Same day · no revisit required / Botox: Same day · no revisit required / Filler: Same day · no revisit required / Skin boosters: Same day · no revisit required / Thread lift: Optional check about 1 week later, or a remote photo check (note: Timelines are general guidance and are confirmed during your consultation.)
- stay.rows(ja): ウルセラプライム: 当日 · 再来院不要 / サーマジFLX: 当日 · 再来院不要 / ボトックス: 当日 · 再来院不要 / フィラー: 当日 · 再来院不要 / スキンブースター: 当日 · 再来院不要 / 糸リフト: 約1週間後に任意の確認、または写真によるオンライン確認
- stay.rows(zh): Ultherapy Prime: 当天 · 无需复诊 / Thermage FLX: 当天 · 无需复诊 / 肉毒素: 当天 · 无需复诊 / 填充: 当天 · 无需复诊 / 水光针: 当天 · 无需复诊 / 线雕提升: 约1周后可选复查，或远程照片复查
- stay.rows(zh-TW): Ultherapy Prime: 當天 · 無需複診 / Thermage FLX: 當天 · 無需複診 / 肉毒桿菌素: 當天 · 無需複診 / 玻尿酸: 當天 · 無需複診 / 水光針: 當天 · 無需複診 / 埋線拉提: 約1周後可選複查，或遠程照片複查
- aftercare.desc: We provide a written aftercare guide in English, Japanese, and Chinese, and offer photo follow-up through your messenger or live chat so you can check in with us from anywhere.
- payment: We accept major international credit cards and Korean won in cash. Visa · Mastercard · American Express · JCB · UnionPay · KRW cash
- payment.methods(ja): Visa · Mastercard · American Express · JCB · UnionPay · 韓国ウォン(KRW) 現金
- payment.methods(zh): Visa · Mastercard · American Express · JCB · 银联(UnionPay) · 韩元(KRW)现金
- payment.methods(zh-TW): Visa · Mastercard · American Express · JCB · 銀聯(UnionPay) · 韓元(KRW)現金
- 메신저: WhatsApp +82 10-6888-2773 (wa.me/821068882773), LINE ID icps7972773, WeChat ID livps0414, 카카오채널(국내). 로케일별 1순위: ja→LINE, zh→WeChat, 그 외→WhatsApp (src/lib/messengerLinks.ts)

## 6. 의료 Q&A 전체 (MEDICAL_QA; ko 원문 + 4개 언어 답) — 상담비·할부·임신·첫 방문·외국인 항목 등 사이트가 이미 답한 질문

상담비: "1:1 전문 상담비용은 1만원이며 당일 시술 진행 시 시술 금액에서 전액 차감"(consultation-fee). 할부: 카드 할부 가능(payment-installment). 임신·수유 중 시술 비권장(pregnant-treatment). 이 답이 있는 항목은 [검수 필요] 대신 그대로 인용한다.

- **ulthera-vs-thermage** (ko) Q 울쎄라피 프라임과 써마지의 차이점은 무엇인가요? → 울쎄라피 프라임은 HIFU(고강도 집속 초음파) 기술을 사용하여 피부 깊은 층인 SMAS까지 에너지를 전달합니다. 반면 써마지는 RF(고주파) 에너지를 사용하여 진피층의 콜라겐을 수축시키고 재생을 촉진합니다. 울쎄라피 프라임은 처진 피부의 리프팅에 효과적이고, 써마지는 전반적인 피부 탄력 개선에 효과적입니다. 두 시술을 병행하면 시너지 효과를 볼 수 있습니다.
  - (en) Q What is the difference between Ultherapy Prime and Thermage? → Ultherapy Prime uses HIFU (High-Intensity Focused Ultrasound) technology to deliver energy deep into the skin's SMAS layer. Thermage uses RF (radiofrequency) energy to contract and promote regeneration of collagen in the dermal layer. Ultherapy Prime is effective for lifting sagging skin, while Thermage is effective for overall skin elasticity improvement. Combining both treatments can produce synergistic effects.
  - (ja) Q ウルセラとサーマジの違いは何ですか？ → ウルセラはHIFU（高密度焦点式超音波）技術を使用して、皮膚の深い層であるSMASまでエネルギーを伝達します。一方、サーマジはRF（高周波）エネルギーを使用して真皮層のコラーゲンを収縮させ、再生を促進します。ウルセラはたるんだ肌のリフティングに効果的で、サーマジは全体的な肌の弾力改善に効果的です。両方の施術を併用すると相乗効果が得られます。
  - (zh) Q 超声刀和热玛吉有什么区别？ → 超声刀使用HIFU（高强度聚焦超声波）技术将能量传递到皮肤深层的SMAS层。热玛吉则使用RF（射频）能量收缩并促进真皮层的胶原蛋白再生。超声刀有效提升下垂皮肤，热玛吉则有效改善整体皮肤弹性。两种治疗结合使用可产生协同效果。
  - (zh-TW) Q 音波拉提和鳳凰電波有什麼區別？ → 音波拉提使用HIFU（高強度聚焦超聲波）技術將能量傳遞到皮膚深層的SMAS層。鳳凰電波則使用RF（射頻）能量收縮並促進真皮層的膠原蛋白再生。音波拉提有效拉提下垂皮膚，鳳凰電波則有效改善整體皮膚彈性。兩種治療結合使用可產生協同效果。

- **lifting-pain** (ko) Q 리프팅 시술은 얼마나 아픈가요? → 리프팅 시술의 통증은 시술 종류와 개인차에 따라 다릅니다. 울쎄라피 프라임과 써마지 FLX 모두 시술 전 마취 크림을 30분 정도 바른 후 진행합니다. 특히 써마지 FLX는 진동 기술(Vibrating Tip)이 적용되어 통증이 크게 감소했으며, 대부분의 환자분들이 편안하게 시술을 받으실 수 있습니다. 통증에 민감하신 분은 추가적인 통증 조절이 가능하니 상담 시 말씀해주세요.
  - (en) Q How painful are lifting treatments? → The pain level of lifting treatments varies depending on the treatment type and individual tolerance. Both Ultherapy Prime and Thermage FLX are performed after applying numbing cream for about 30 minutes. Thermage FLX in particular uses vibration technology (Vibrating Tip) that significantly reduces discomfort. Most patients can receive treatment comfortably. If you are sensitive to pain, additional pain control is available - please let us know during consultation.
  - (ja) Q リフティング施術はどのくらい痛いですか？ → リフティング施術の痛みは、施術の種類や個人差によって異なります。ウルセラとサーマジFLXは、施術前に約30分間麻酔クリームを塗った後に行います。特にサーマジFLXは振動技術（Vibrating Tip）が適用されており、痛みが大幅に軽減されています。ほとんどの患者様が快適に施術を受けることができます。痛みに敏感な方は追加の痛み調節が可能ですので、ご相談時にお知らせください。
  - (zh) Q 提升治疗有多疼？ → 提升治疗的疼痛程度因治疗类型和个人差异而异。超声刀和热玛吉FLX治疗前都会涂抹约30分钟的麻醉膏。特别是热玛吉FLX采用振动技术（Vibrating Tip），大大减轻了疼痛，大多数患者都能舒适地接受治疗。如果您对疼痛敏感，可以进行额外的疼痛控制，请在咨询时告知我们。
  - (zh-TW) Q 拉提治療有多疼？ → 拉提治療的疼痛程度因治療類型和個人差異而異。音波拉提和鳳凰電波 FLX治療前都會塗抹約30分鐘的麻醉膏。特別是鳳凰電波 FLX採用振動技術（Vibrating Tip），大大減輕了疼痛，大多數患者都能舒適地接受治療。如果您對疼痛敏感，可以進行額外的疼痛控制，請在諮詢時告知我們。

- **lifting-frequency** (ko) Q 리프팅 시술은 얼마나 자주 받아야 하나요? → 울쎄라피 프라임은 1-2년에 1회, 써마지는 6개월-1년에 1회를 권장합니다. 슈링크나 인모드 등 유지 관리용 시술은 3-6개월 간격으로 받으실 수 있습니다. 피부 상태와 원하시는 효과에 따라 시술 주기가 달라질 수 있으므로, 정확한 주기는 상담을 통해 결정하시는 것이 좋습니다.
  - (en) Q How often should I get lifting treatments? → Ultherapy Prime is recommended once every 1-2 years, and Thermage once every 6 months to 1 year. Maintenance treatments like Shurink or InMode can be done every 3-6 months. The treatment cycle may vary depending on your skin condition and desired results, so it's best to determine the exact frequency through consultation.
  - (ja) Q リフティング施術はどのくらいの頻度で受けるべきですか？ → ウルセラは1-2年に1回、サーマジは6ヶ月-1年に1回をお勧めします。シュリンクやインモードなどのメンテナンス施術は3-6ヶ月間隔で受けることができます。肌の状態やご希望の効果によって施術周期が異なる場合がありますので、正確な周期はご相談を通じて決定することをお勧めします。
  - (zh) Q 提升治疗多久做一次？ → 超声刀建议1-2年做一次，热玛吉建议6个月-1年做一次。Shurink或InMode等维护性治疗可以每3-6个月进行一次。根据您的皮肤状况和期望效果，治疗周期可能会有所不同，建议通过咨询确定准确的周期。
  - (zh-TW) Q 拉提治療多久做一次？ → 音波拉提建議1-2年做一次，鳳凰電波建議6個月-1年做一次。Shurink或InMode等維護性治療可以每3-6個月進行一次。根據您的皮膚狀況和期望效果，治療週期可能會有所不同，建議通過諮詢確定準確的週期。

- **lifting-duration** (ko) Q 리프팅 효과는 얼마나 지속되나요? → 울쎄라피 프라임의 효과는 약 1년, 써마지는 6개월-1년 정도 지속됩니다. 다만 효과 지속 기간은 개인의 피부 상태, 나이, 생활 습관에 따라 달라질 수 있습니다. 정기적인 유지 관리 시술을 받으시면 효과를 더 오래 유지할 수 있습니다.
  - (en) Q How long do lifting results last? → Ultherapy Prime results last about 1 year, while Thermage lasts 6 months to 1 year. However, the duration may vary depending on individual skin condition, age, and lifestyle. Regular maintenance treatments can help extend the results.
  - (ja) Q リフティング効果はどのくらい持続しますか？ → ウルセラの効果は約1年、サーマジは6ヶ月-1年程度持続します。ただし、効果の持続期間は個人の肌状態、年齢、生活習慣によって異なる場合があります。定期的なメンテナンス施術を受けると、効果をより長く維持できます。
  - (zh) Q 提升效果能维持多久？ → 超声刀的效果约持续1年，热玛吉约6个月-1年。但效果持续时间可能因个人皮肤状况、年龄和生活习惯而异。定期进行维护治疗可以延长效果持续时间。
  - (zh-TW) Q 拉提效果能維持多久？ → 音波拉提的效果約持續1年，鳳凰電波約6個月-1年。但效果持續時間可能因個人皮膚狀況、年齡和生活習慣而異。定期進行維護治療可以延長效果持續時間。

- **botox-natural** (ko) Q 보톡스 맞으면 표정이 부자연스러워지나요? → 적정 용량을 정확한 위치에 주입하면 자연스러운 표정을 유지하면서 주름만 개선됩니다. 부자연스러운 표정은 주로 과용량 사용이나 잘못된 주입 위치로 인해 발생합니다. 리브성형외과에서는 숙련된 전문의가 개인의 근육 특성에 맞춰 적정량을 시술하므로 자연스러운 결과를 기대하실 수 있습니다.
  - (en) Q Will Botox make my facial expressions look unnatural? → When the proper amount is injected at the correct locations, natural expressions are maintained while only improving wrinkles. Unnatural expressions typically occur from overdosing or incorrect injection sites. At LIV Plastic Surgery, our experienced specialists inject appropriate amounts tailored to each individual's muscle characteristics, so you can expect natural results.
  - (ja) Q ボトックスを打つと表情が不自然になりますか？ → 適切な量を正確な位置に注入すれば、自然な表情を維持しながらシワだけを改善できます。不自然な表情は主に過剰投与や不適切な注入位置によって発生します。リブ形成外科では、熟練した専門医が個人の筋肉特性に合わせて適切な量を施術するため、自然な結果を期待できます。
  - (zh) Q 注射肉毒素后表情会不自然吗？ → 在正确位置注射适量可以在保持自然表情的同时只改善皱纹。不自然的表情通常是由于用量过多或注射位置不正确造成的。在LIV整形外科，熟练的专家会根据每个人的肌肉特点注射适量，您可以期待自然的效果。
  - (zh-TW) Q 注射肉毒桿菌素後表情會不自然嗎？ → 在正確位置注射適量可以在保持自然表情的同時只改善皺紋。不自然的表情通常是由於用量過多或注射位置不正確造成的。在LIV 整形外科，熟練的專家會根據每個人的肌肉特點注射適量，您可以期待自然的效果。

- **botox-duration** (ko) Q 보톡스 효과는 얼마나 지속되나요? → 보톡스 효과는 개인차가 있지만 보통 3-6개월 정도 지속됩니다. 정기적으로 시술받으면 근육이 점차 약화되어 효과가 더 오래 지속되고, 시술 간격도 늘어날 수 있습니다. 첫 시술 후 2-3주 뒤 추가 터치업이 필요할 수 있으니, 경과를 확인하시는 것이 좋습니다.
  - (en) Q How long does Botox last? → Botox results vary by individual but typically last 3-6 months. With regular treatments, muscles gradually weaken, making results last longer and extending the interval between treatments. A touch-up may be needed 2-3 weeks after the first treatment, so it's good to check progress.
  - (ja) Q ボトックス効果はどのくらい持続しますか？ → ボトックス効果は個人差がありますが、通常3-6ヶ月程度持続します。定期的に施術を受けると、筋肉が徐々に弱化して効果がより長く持続し、施術間隔も延びる可能性があります。初回施術後2-3週間後に追加タッチアップが必要な場合がありますので、経過を確認することをお勧めします。
  - (zh) Q 肉毒素效果能维持多久？ → 肉毒素效果因人而异，通常持续3-6个月。定期治疗可以使肌肉逐渐弱化，效果维持更久，治疗间隔也会延长。首次治疗后2-3周可能需要补打，建议观察恢复情况。
  - (zh-TW) Q 肉毒桿菌素效果能維持多久？ → 肉毒桿菌素效果因人而異，通常持續3-6個月。定期治療可以使肌肉逐漸弱化，效果維持更久，治療間隔也會延長。首次治療後2-3周可能需要補打，建議觀察恢復情況。

- **filler-dissolve** (ko) Q 필러는 녹일 수 있나요? → 네, 히알루론산 필러는 히알루로니다제(녹이는 주사)로 녹일 수 있습니다. 시술 결과가 마음에 들지 않거나 부작용이 발생했을 때 안전하게 제거할 수 있습니다. 이것이 히알루론산 필러의 큰 장점 중 하나입니다. 다만 비가역적 필러(예: 아테콜)는 녹일 수 없으므로, 필러 선택 시 이 점을 고려하셔야 합니다.
  - (en) Q Can fillers be dissolved? → Yes, hyaluronic acid fillers can be dissolved with hyaluronidase (dissolving injection). If you're not satisfied with the results or experience side effects, they can be safely removed. This is one of the major advantages of hyaluronic acid fillers. However, non-reversible fillers (e.g., Artecoll) cannot be dissolved, so consider this when choosing fillers.
  - (ja) Q フィラーは溶かすことができますか？ → はい、ヒアルロン酸フィラーはヒアルロニダーゼ（溶解注射）で溶かすことができます。施術結果に満足できない場合や副作用が発生した場合に安全に除去できます。これはヒアルロン酸フィラーの大きな利点の一つです。ただし、不可逆的なフィラー（例：アテコール）は溶かすことができないので、フィラー選択時にこの点を考慮してください。
  - (zh) Q 玻尿酸可以溶解吗？ → 是的，玻尿酸可以用透明质酸酶（溶解针）溶解。如果您对治疗效果不满意或出现副作用，可以安全去除。这是玻尿酸的一大优点。但不可逆的填充物（如Artecoll）无法溶解，选择填充物时请考虑这一点。
  - (zh-TW) Q 玻尿酸可以溶解嗎？ → 是的，玻尿酸可以用透明質酸酶（溶解針）溶解。如果您對治療效果不滿意或出現副作用，可以安全去除。這是玻尿酸的一大優點。但不可逆的填充物（如Artecoll）無法溶解，選擇填充物時請考慮這一點。

- **filler-lumps** (ko) Q 필러가 뭉치거나 울퉁불퉁해질 수 있나요? → 정품 필러를 적정량 사용하고, 해부학적 지식을 갖춘 숙련된 의료진이 시술하면 이런 문제가 거의 발생하지 않습니다. 간혹 발생하는 울퉁불퉁함은 대부분 마사지로 해결되며, 필요시 히알루로니다제로 조절할 수 있습니다. 시술 후 불편하신 점이 있으면 바로 상담해주세요.
  - (en) Q Can fillers cause lumps or unevenness? → When genuine fillers are used in appropriate amounts by experienced medical professionals with anatomical knowledge, these problems rarely occur. Occasional unevenness can usually be resolved with massage, and if necessary, can be adjusted with hyaluronidase. If you experience any discomfort after treatment, please consult us immediately.
  - (ja) Q フィラーが凸凹になることはありますか？ → 正規品フィラーを適切な量使用し、解剖学的知識を持った熟練した医師が施術すれば、このような問題はほとんど発生しません。時々発生する凸凹は大部分マッサージで解決でき、必要に応じてヒアルロニダーゼで調整できます。施術後に不快感がありましたら、すぐにご相談ください。
  - (zh) Q 玻尿酸会结块或凹凸不平吗？ → 使用适量正品填充物，由具有解剖学知识的熟练医生施术，这类问题几乎不会发生。偶尔出现的凹凸不平大多可以通过按摩解决，必要时可以用透明质酸酶调整。如果治疗后有任何不适，请立即咨询。
  - (zh-TW) Q 玻尿酸會結塊或凹凸不平嗎？ → 使用適量正品填充物，由具有解剖學知識的熟練醫生施術，這類問題幾乎不會發生。偶爾出現的凹凸不平大多可以通過按摩解決，必要時可以用透明質酸酶調整。如果治療後有任何不適，請立即諮詢。

- **skinbooster-frequency** (ko) Q 스킨부스터는 몇 회 맞아야 효과가 있나요? → 스킨부스터는 2-4주 간격으로 3-4회 시술을 기본 코스로 권장합니다. 1회 시술 후에도 수분감 개선을 느낄 수 있지만, 최적의 효과를 위해서는 코스 시술이 필요합니다. 이후에는 2-3개월마다 유지 시술을 받으시면 좋습니다.
  - (en) Q How many sessions of skin boosters are needed for results? → Skin boosters are recommended as a basic course of 3-4 sessions at 2-4 week intervals. You may notice hydration improvement after one session, but the optimal effect requires completing the full course. Afterward, maintenance treatments every 2-3 months are recommended.
  - (ja) Q スキンブースターは何回受ければ効果がありますか？ → スキンブースターは2-4週間隔で3-4回施術を基本コースとしてお勧めします。1回施術後でも保湿感の改善を感じることができますが、最適な効果のためにはコース施術が必要です。その後は2-3ヶ月ごとにメンテナンス施術を受けることをお勧めします。
  - (zh) Q 水光针需要做几次才有效？ → 水光针建议每2-4周进行3-4次作为基础疗程。单次治疗后即可感受到水润改善，但最佳效果需要完成整个疗程。之后建议每2-3个月进行维护治疗。
  - (zh-TW) Q 水光針需要做幾次才有效？ → 水光針建議每2-4周進行3-4次作為基礎療程。單次治療後即可感受到水潤改善，但最佳效果需要完成整個療程。之後建議每2-3個月進行維護治療。

- **laser-sun** (ko) Q 레이저 시술 후 햇빛을 피해야 하나요? → 네, 레이저 시술 후에는 자외선 차단이 매우 중요합니다. 시술 후 피부가 민감해져 자외선에 의한 색소침착 위험이 높아집니다. 최소 2-4주간은 자외선 차단제(SPF 50+)를 꼼꼼히 바르고, 모자나 양산을 사용하시는 것이 좋습니다. 야외 활동이 많은 시기에는 레이저 시술을 피하시는 것이 좋습니다.
  - (en) Q Should I avoid sunlight after laser treatment? → Yes, sun protection is very important after laser treatment. After treatment, your skin becomes sensitive and the risk of pigmentation from UV exposure increases. For at least 2-4 weeks, apply sunscreen (SPF 50+) thoroughly and use hats or parasols. It's best to avoid laser treatment during seasons with a lot of outdoor activities.
  - (ja) Q レーザー施術後は日光を避けるべきですか？ → はい、レーザー施術後は紫外線遮断が非常に重要です。施術後、肌が敏感になり、紫外線による色素沈着のリスクが高まります。最低2-4週間は日焼け止め（SPF 50+）を丁寧に塗り、帽子や日傘を使用することをお勧めします。野外活動が多い時期にはレーザー施術を避けることをお勧めします。
  - (zh) Q 激光治疗后需要避免阳光吗？ → 是的，激光治疗后防晒非常重要。治疗后皮肤变得敏感，紫外线导致色素沉着的风险增加。至少2-4周内应仔细涂抹防晒霜（SPF 50+），并使用帽子或遮阳伞。户外活动较多的季节最好避免激光治疗。
  - (zh-TW) Q 激光治療後需要避免陽光嗎？ → 是的，激光治療後防曬非常重要。治療後皮膚變得敏感，紫外線導致色素沉著的風險增加。至少2-4周內應仔細塗抹防曬霜（SPF 50+），並使用帽子或遮陽傘。戶外活動較多的季節最好避免激光治療。

- **laser-downtime** (ko) Q 레이저 시술 후 다운타임은 어느 정도인가요? → 레이저 종류에 따라 다릅니다. 레이저 토닝의 경우 거의 다운타임이 없어 바로 일상생활이 가능합니다. 클래리티 II 레이저로 표피 색소를 치료한 경우 3-5일 정도 색소가 진해지거나 얇은 딱지가 생겼다가 자연스럽게 떨어집니다.
  - (en) Q What is the downtime after laser treatment? → It depends on the type of laser. Laser toning has almost no downtime, allowing immediate return to daily activities. When treating surface pigmentation with Clarity II laser, the pigment may darken or thin scabs may form for 3-5 days before naturally falling off.
  - (ja) Q レーザー施術後のダウンタイムはどのくらいですか？ → レーザーの種類によって異なります。レーザートーニングの場合、ダウンタイムがほとんどなく、すぐに日常生活が可能です。クラリティIIレーザーで表皮色素を治療した場合、3-5日程度色素が濃くなったり、薄いかさぶたができたりしてから自然に剥がれます。
  - (zh) Q 激光治疗后需要多长恢复期？ → 取决于激光类型。激光调Q几乎没有恢复期，可以立即恢复日常生活。用Clarity II激光治疗表皮色素的情况下，色素会加深或形成薄痂，3-5天后自然脱落。
  - (zh-TW) Q 激光治療後需要多長恢復期？ → 取決於激光類型。激光調Q幾乎沒有恢復期，可以立即恢復日常生活。用Clarity II激光治療表皮色素的情況下，色素會加深或形成薄痂，3-5天後自然脫落。

- **thread-duration** (ko) Q 실리프팅 효과는 얼마나 유지되나요? → 실 종류에 따라 다릅니다. PDO(녹는 실)는 6-8개월, PLLA나 PCL 실은 12-18개월 정도 효과가 유지됩니다. 실이 녹으면서 콜라겐 재생을 촉진하므로, 실이 완전히 녹은 후에도 일정 기간 효과가 유지됩니다. 정기적인 유지 시술을 통해 효과를 지속시킬 수 있습니다.
  - (en) Q How long do thread lift results last? → It depends on the type of thread. PDO (dissolvable threads) last 6-8 months, while PLLA or PCL threads last 12-18 months. As threads dissolve, they promote collagen regeneration, so effects continue for some time even after threads are completely absorbed. Regular maintenance treatments can extend the results.
  - (ja) Q 糸リフト効果はどのくらい維持されますか？ → 糸の種類によって異なります。PDO（溶ける糸）は6-8ヶ月、PLLAやPCL糸は12-18ヶ月程度効果が維持されます。糸が溶けながらコラーゲン再生を促進するため、糸が完全に溶けた後も一定期間効果が維持されます。定期的なメンテナンス施術で効果を持続させることができます。
  - (zh) Q 线雕效果能维持多久？ → 取决于线的类型。PDO（可溶解线）6-8个月，PLLA或PCL线12-18个月。线溶解时会促进胶原蛋白再生，所以线完全溶解后效果也会持续一段时间。通过定期维护治疗可以延长效果。
  - (zh-TW) Q 埋線效果能維持多久？ → 取決於線的類型。PDO（可溶解線）6-8個月，PLLA或PCL線12-18個月。線溶解時會促進膠原蛋白再生，所以線完全溶解後效果也會持續一段時間。通過定期維護治療可以延長效果。

- **consultation-fee** (ko) Q 상담만 받아도 되나요? 비용이 있나요? → 네, 상담만 받으셔도 됩니다. 1:1 전문 상담비용은 1만원이며, 당일 시술 진행 시 시술 금액에서 전액 차감됩니다. 성형외과 전문의가 직접 피부 상태를 진단하고 최적의 시술 플랜을 제안해 드립니다. 충분히 고민하신 후 결정하셔도 괜찮습니다.
  - (en) Q Can I just have a consultation? Is there a fee? → Yes, you can have just a consultation. The 1:1 professional consultation fee is 10,000 KRW, which is fully deducted from the treatment cost if you proceed with treatment on the same day. Our board-certified plastic surgeon will personally diagnose your skin condition and recommend the optimal treatment plan. You can take your time to decide after the consultation.
  - (ja) Q 相談だけでも大丈夫ですか？費用はありますか？ → はい、相談だけでも大丈夫です。1:1専門相談費用は1万ウォンで、当日施術を行う場合は施術金額から全額差し引かれます。形成外科専門医が直接肌の状態を診断し、最適な施術プランをご提案いたします。十分にご検討いただいてからお決めいただいて大丈夫です。
  - (zh) Q 可以只咨询吗？有费用吗？ → 是的，可以只进行咨询。1对1专业咨询费用为1万韩元，当天进行治疗时可从治疗费用中全额抵扣。整形外科专家会亲自诊断您的皮肤状况并推荐最佳治疗方案。您可以充分考虑后再做决定。
  - (zh-TW) Q 可以只諮詢嗎？有費用嗎？ → 是的，可以只進行諮詢。1對1專業諮詢費用為1萬韓元，當天進行治療時可從治療費用中全額抵扣。整形外科專家會親自診斷您的皮膚狀況並推薦最佳治療方案。您可以充分考慮後再做決定。

- **payment-installment** (ko) Q 시술 비용 할부가 가능한가요? → 네, 카드 할부 결제가 가능합니다. 무이자 할부 혜택은 카드사와 결제 금액에 따라 다를 수 있으니, 상담 시 문의해주세요. 또한 시술별로 다양한 프로모션과 패키지 할인도 있으니 확인해보시기 바랍니다.
  - (en) Q Can I pay for treatments in installments? → Yes, credit card installment payments are available. Interest-free installment benefits may vary by credit card company and payment amount, so please inquire during consultation. There are also various promotions and package discounts available for different treatments.
  - (ja) Q 施術費用の分割払いは可能ですか？ → はい、カード分割払いが可能です。無利息分割払い特典はカード会社と決済金額によって異なる場合がありますので、ご相談時にお問い合わせください。また、施術別に様々なプロモーションやパッケージ割引もありますのでご確認ください。
  - (zh) Q 治疗费用可以分期吗？ → 是的，可以信用卡分期付款。免息分期优惠可能因信用卡公司和付款金额而异，请在咨询时询问。此外，各种治疗都有促销和套餐折扣，请查看。
  - (zh-TW) Q 治療費用可以分期嗎？ → 是的，可以信用卡分期付款。免息分期優惠可能因信用卡公司和付款金額而異，請在諮詢時詢問。此外，各種治療都有促銷和套餐折扣，請查看。

- **pregnant-treatment** (ko) Q 임신 중이나 수유 중에도 시술이 가능한가요? → 임신 중이나 수유 중에는 대부분의 미용 시술이 권장되지 않습니다. 보톡스, 필러, 리프팅 시술 모두 태아나 모유에 미치는 영향에 대한 안전성이 충분히 검증되지 않았기 때문입니다. 임신과 수유를 마친 후에 시술받으시는 것을 권장합니다.
  - (en) Q Can I receive treatment while pregnant or breastfeeding? → Most cosmetic treatments are not recommended during pregnancy or breastfeeding. The safety of Botox, fillers, and lifting treatments on the fetus or breast milk has not been sufficiently verified. We recommend receiving treatment after pregnancy and breastfeeding are complete.
  - (ja) Q 妊娠中や授乳中でも施術を受けられますか？ → 妊娠中や授乳中はほとんどの美容施術がお勧めされません。ボトックス、フィラー、リフティング施術はすべて胎児や母乳への影響に対する安全性が十分に検証されていないためです。妊娠と授乳が終わった後に施術を受けることをお勧めします。
  - (zh) Q 怀孕或哺乳期可以做治疗吗？ → 怀孕或哺乳期不建议进行大多数美容治疗。肉毒素、玻尿酸、提升治疗对胎儿或母乳的影响安全性尚未充分验证。建议在怀孕和哺乳结束后再进行治疗。
  - (zh-TW) Q 懷孕或哺乳期可以做治療嗎？ → 懷孕或哺乳期不建議進行大多數美容治療。肉毒桿菌素、玻尿酸、拉提治療對胎兒或母乳的影響安全性尚未充分驗證。建議在懷孕和哺乳結束後再進行治療。

- **liv-specialty** (ko) Q 리브성형외과에서 가장 잘하는 시술이 뭔가요? → 리브성형외과는 울쎄라피 프라임 정품 인증과 써마지 FLX 파트너 병원으로, 비수술 리프팅 시술을 전문으로 합니다. 성형외과 전문의가 SCI 논문 4편의 학술 경험을 바탕으로 환자 개개인에게 맞춤 시술을 제공합니다. 신사역 4번 출구 도보 1분 거리에 위치해 있습니다.
  - (en) Q What does LIV Plastic Surgery specialize in? → LIV Plastic Surgery is an official Ultherapy Prime certified clinic and Thermage FLX partner hospital, specializing in non-surgical lifting treatments. Our board-certified plastic surgeon provides customized treatments based on academic experience with 4 SCI publications. We are located just 1 minute walk from Sinsa Station Exit 4.
  - (ja) Q リブ形成外科で一番得意な施術は何ですか？ → リブ形成外科はウルセラ正規認証とサーマジFLXパートナー病院として、非手術リフティング施術を専門としています。形成外科専門医がSCI論文4編の学術経験を基に、患者様一人一人に合わせた施術を提供しています。新沙駅4番出口から徒歩1分の場所に位置しています。
  - (zh) Q LIV整形外科最擅长什么治疗？ → LIV整形外科是超声刀正品认证和热玛吉FLX合作医院，专注于非手术提升治疗。整形外科专家基于4篇SCI论文的学术经验，为每位患者提供定制治疗。位于新沙站4号出口步行1分钟处。
  - (zh-TW) Q LIV 整形外科最擅長什麼治療？ → LIV 整形外科是音波拉提正品認證和鳳凰電波 FLX合作醫院，專注於非手術拉提治療。整形外科專家基於4篇SCI論文的學術經驗，為每位患者提供定製治療。位於新沙站4號出口步行1分鐘處。

- **first-visit** (ko) Q 처음 방문하면 어떻게 진행되나요? → 전화(02-797-2773) 또는 카카오톡으로 상담 예약을 해주시면 됩니다. 방문 시 성형외과 전문의가 직접 피부 상태를 진단하고, 환자분의 고민과 원하시는 결과에 맞는 최적의 시술 플랜을 제안해 드립니다. 상담 후 충분히 고민하신 뒤 시술 여부를 결정하셔도 됩니다.
  - (en) Q What happens on my first visit? → Please make a consultation appointment by phone (02-797-2773) or KakaoTalk. During your visit, our board-certified plastic surgeon will personally diagnose your skin condition and recommend the optimal treatment plan based on your concerns and desired results. You can take your time to decide on treatment after the consultation.
  - (ja) Q 初めて訪問するとどのように進みますか？ → 電話（02-797-2773）またはカカオトークで相談予約をお願いいたします。ご来院時、形成外科専門医が直接肌の状態を診断し、患者様のお悩みとご希望の結果に合わせた最適な施術プランをご提案いたします。ご相談後、十分にご検討いただいてから施術をお決めいただいて大丈夫です。
  - (zh) Q 第一次来怎么进行？ → 请通过电话(02-797-2773)或KakaoTalk预约咨询。来访时，整形外科专家会亲自诊断您的皮肤状况，并根据您的需求和期望效果推荐最佳治疗方案。咨询后您可以充分考虑再决定是否治疗。
  - (zh-TW) Q 第一次來怎麼進行？ → 請通過電話(02-797-2773)或KakaoTalk預約諮詢。來訪時，整形外科專家會親自診斷您的皮膚狀況，並根據您的需求和期望效果推薦最佳治療方案。諮詢後您可以充分考慮再決定是否治療。

- **foreign-consultation-language** (ko) Q 영어·일본어·중국어 상담이 가능한가요? → 네, 영어·일본어·중국어 상담을 지원하며 통역은 무료로 준비해 드립니다. 왓츠앱(WhatsApp), 라인(LINE), 위챗(WeChat) 또는 홈페이지 실시간 채팅으로 편하게 예약하실 수 있습니다. 방문 상담 시에도 언어에 맞춰 안내해 드리니 걱정 없이 문의해 주세요.
  - (en) Q Do you offer consultations in English, Japanese or Chinese? → Yes. We support consultations in English, Japanese and Chinese, and interpretation is arranged free of charge. You can book easily via WhatsApp, LINE, WeChat or the live chat on our website, and we match your language for the in-person consultation as well.
  - (ja) Q 英語・日本語・中国語での相談はできますか？ → はい。英語・日本語・中国語での相談に対応しており、通訳は無料でご用意いたします。WhatsApp・LINE・WeChat、または当院サイトのライブチャットから簡単にご予約いただけます。ご来院時のカウンセリングも言語に合わせてご案内いたしますので、お気軽にお問い合わせください。
  - (zh) Q 可以提供英语、日语、中文咨询吗？ → 可以。我们支持英语、日语和中文咨询，并免费为您安排翻译。您可以通过 WhatsApp、LINE、微信（WeChat）或网站在线客服轻松预约，到院面诊时也会按您的语言进行接待。
  - (zh-TW) Q 可以提供英語、日語、中文諮詢嗎？ → 可以。我們支援英語、日語和中文諮詢，並免費為您安排翻譯。您可以透過 WhatsApp、LINE、微信（WeChat）或網站線上客服輕鬆預約，到院面診時也會依您的語言進行接待。

- **foreign-booking-overseas** (ko) Q 해외에서 어떻게 예약하나요? → 해외에서는 홈페이지 실시간 채팅, 왓츠앱(WhatsApp), 라인(LINE), 위챗(WeChat), 또는 상담 신청 폼으로 예약하실 수 있습니다. 문의는 영업일 기준 1일 이내에 답변드립니다. 상담 예약에는 예약금이 필요하지 않습니다.
  - (en) Q How do I book an appointment from overseas? → From overseas you can book through the live chat on our website, WhatsApp, LINE, WeChat or the online contact form. We reply within one business day. No deposit is required to reserve a consultation.
  - (ja) Q 海外からはどのように予約できますか？ → 海外からは、当院サイトのライブチャット、WhatsApp、LINE、WeChat、またはお問い合わせフォームからご予約いただけます。お問い合わせには営業日基準で1日以内に返信いたします。カウンセリングのご予約に予約金は必要ありません。
  - (zh) Q 在海外如何预约？ → 在海外，您可以通过网站在线客服、WhatsApp、LINE、微信（WeChat）或在线咨询表单预约。我们会在一个工作日内回复您的咨询。预约面诊无需支付定金。
  - (zh-TW) Q 在海外如何預約？ → 在海外，您可以透過網站線上客服、WhatsApp、LINE、微信（WeChat）或線上諮詢表單預約。我們會在一個工作日內回覆您的諮詢。預約面診無需支付訂金。

- **foreign-pricing-same** (ko) Q 외국인 환자는 비용을 더 내나요? → 아니요. 외국인 환자도 한국인 환자와 동일한 가격표가 적용됩니다. 시술 가격은 가격 안내 페이지에 공개되어 있어 방문 전에 확인하실 수 있습니다. 추가 언어 상담이나 통역에 대한 별도 비용도 없습니다.
  - (en) Q Do foreign patients pay more? → No. Foreign patients are charged the same price list as Korean patients. Treatment prices are published on our pricing page so you can check them before your visit. There is also no extra charge for language support or interpretation.
  - (ja) Q 外国人患者は費用が高くなりますか？ → いいえ。外国人患者も韓国人患者と同じ料金表が適用されます。施術料金は料金案内ページに公開しており、ご来院前に確認いただけます。多言語対応や通訳のための追加費用もかかりません。
  - (zh) Q 外国患者需要支付更高的费用吗？ → 不会。外国患者与韩国患者适用相同的价目表。项目价格已在价格说明页面公开，您可在到院前查看。语言服务或翻译也不收取额外费用。
  - (zh-TW) Q 外國患者需要支付更高的費用嗎？ → 不會。外國患者與韓國患者適用相同的價目表。項目價格已在價格說明頁面公開，您可在到院前查看。語言服務或翻譯也不收取額外費用。

- **foreign-stay-duration** (ko) Q 시술을 위해 서울에 며칠 머물러야 하나요? → 대부분의 비수술 리프팅·안티에이징 시술은 30~90분 내외로 당일에 끝나며 입원이 필요 없습니다. 울쎄라피 프라임과 써마지는 재방문 없이 1회로 마무리됩니다. 실리프팅은 필요 시 1주 후 경과 확인을 권장하지만 선택 사항입니다.
  - (en) Q How many days should I stay in Seoul for treatment? → Most non-surgical lifting and anti-aging treatments take about 30–90 minutes, are done in a single day and require no hospitalization. Ultherapy Prime and Thermage are completed in one session with no revisit needed. For a thread lift, an optional check-up after one week is recommended but not required.
  - (ja) Q 施術のためにソウルに何日滞在すればよいですか？ → ほとんどの非手術リフトアップ・アンチエイジング施術は30〜90分ほどで、日帰りで完了し入院は不要です。ウルセラプライムとサーマジは再来院なしで1回で完了します。糸リフトは必要に応じて1週間後の経過確認をおすすめしますが、任意です。
  - (zh) Q 做项目需要在首尔停留几天？ → 大多数非手术提拉紧致与抗衰项目约需30~90分钟，当天即可完成，无需住院。超声刀（Ultherapy Prime）和热玛吉（Thermage）一次即可完成，无需复诊。线雕如有需要建议一周后复查，但并非必需。
  - (zh-TW) Q 做項目需要在首爾停留幾天？ → 大多數非手術提拉緊緻與抗衰項目約需30~90分鐘，當天即可完成，無需住院。超音波拉提（Ultherapy Prime）和電波拉皮（Thermage）一次即可完成，無需複診。埋線如有需要建議一週後複查，但並非必需。

- **foreign-aftercare-remote** (ko) Q 귀국 후에도 사후 관리가 가능한가요? → 네, 귀국 후에도 채팅이나 메신저로 사진을 보내주시면 경과를 확인하고 관리를 도와드립니다. 영어·일본어·중국어로 된 사후 관리 안내문도 제공해 드립니다. 궁금한 점이 있으면 언제든 편하게 문의해 주세요.
  - (en) Q Is aftercare possible after I fly home? → Yes. After you return home, you can send photos via chat or messenger and we will review your progress and guide your aftercare. We also provide a written aftercare guide in English, Japanese and Chinese. Feel free to reach out any time with questions.
  - (ja) Q 帰国後もアフターケアは受けられますか？ → はい。ご帰国後もチャットやメッセンジャーで写真をお送りいただければ、経過を確認しアフターケアをサポートいたします。英語・日本語・中国語のアフターケア案内もご用意しています。ご不明な点はいつでもお気軽にお問い合わせください。
  - (zh) Q 回国后还能进行术后护理吗？ → 可以。回国后，您可通过在线客服或即时通讯发送照片，我们会查看恢复情况并指导术后护理。我们还提供英语、日语和中文的术后护理指南。如有疑问，欢迎随时联系。
  - (zh-TW) Q 回國後還能進行術後護理嗎？ → 可以。回國後，您可透過線上客服或即時通訊傳送照片，我們會查看恢復情況並指導術後護理。我們還提供英語、日語和中文的術後護理指南。如有疑問，歡迎隨時聯繫。

- **foreign-airport-access** (ko) Q 인천공항에서 병원까지 어떻게 오나요? → 인천공항에서 공항철도나 리무진버스를 이용해 지하철 3호선 신사역으로 오시면 됩니다. 신사역 4번 출구에서 도보 1분 거리에 위치합니다. 대중교통은 약 70~90분, 택시는 약 60분 소요됩니다.
  - (en) Q How do I get to the clinic from Incheon Airport? → From Incheon Airport, take the airport railroad (AREX) or a limousine bus to Sinsa Station on Subway Line 3. The clinic is a 1-minute walk from Exit 4. Public transport takes about 70–90 minutes and a taxi about 60 minutes.
  - (ja) Q 仁川空港からクリニックまではどう行きますか？ → 仁川空港からは空港鉄道（AREX）またはリムジンバスで地下鉄3号線の新沙駅（シンサ駅）へお越しください。新沙駅4番出口から徒歩1分の場所にあります。公共交通機関で約70〜90分、タクシーで約60分です。
  - (zh) Q 从仁川机场如何到达诊所？ → 从仁川机场，可乘坐机场铁路（AREX）或豪华巴士到地铁3号线新沙站。诊所位于新沙站4号出口步行1分钟处。公共交通约70~90分钟，出租车约60分钟。
  - (zh-TW) Q 從仁川機場如何到達診所？ → 從仁川機場，可搭乘機場鐵路（AREX）或豪華巴士到地鐵3號線新沙站。診所位於新沙站4號出口步行1分鐘處。大眾運輸約70~90分鐘，計程車約60分鐘。

- **foreign-payment-methods** (ko) Q 외국인 환자는 어떤 결제 수단을 사용하나요? → 외국인 환자는 Visa, Mastercard, American Express, UnionPay(은련), JCB 등 해외 발급 카드로 결제하실 수 있습니다. 원화(KRW) 현금 결제도 가능합니다. 결제 관련 문의는 상담 시 미리 말씀해 주시면 안내해 드립니다.
  - (en) Q What payment methods do foreign patients use? → Foreign patients can pay with internationally issued cards including Visa, Mastercard, American Express, UnionPay and JCB. Cash payment in Korean won (KRW) is also accepted. Let us know during your consultation if you have any questions about payment.
  - (ja) Q 外国人患者はどのような支払い方法を利用できますか？ → 外国人患者は、Visa、Mastercard、American Express、UnionPay（銀聯）、JCBなどの海外発行カードでお支払いいただけます。韓国ウォン（KRW）の現金でのお支払いも可能です。お支払いに関するご質問はカウンセリング時にお知らせください。
  - (zh) Q 外国患者可以使用哪些付款方式？ → 外国患者可使用 Visa、Mastercard、American Express、银联（UnionPay）、JCB 等境外发行的银行卡付款。也可使用韩元（KRW）现金付款。如对付款有任何疑问，请在面诊时告知我们。
  - (zh-TW) Q 外國患者可以使用哪些付款方式？ → 外國患者可使用 Visa、Mastercard、American Express、銀聯（UnionPay）、JCB 等境外發行的銀行卡付款。也可使用韓元（KRW）現金付款。如對付款有任何疑問，請在面診時告知我們。

- **foreign-device-authentic** (ko) Q 사용하는 장비는 정품인가요? → 네, 리브성형외과는 울쎄라피 프라임 정품 인증 병원이자 써마지 FLX 파트너 병원입니다. 정품 인증 핸드피스(팁)만 사용하여 시술합니다. 정품 사용 여부는 시술 전에 직접 확인하실 수 있습니다.
  - (en) Q Are the treatment devices authentic? → Yes. LIV is an official Ultherapy Prime certified clinic and a Thermage FLX partner clinic. We treat using only genuine, certified handpieces (tips). You are welcome to verify that authentic devices are used before your treatment.
  - (ja) Q 使用する機器は正規品ですか？ → はい。LIV美容クリニックはウルセラプライムの正規認証院であり、サーマジFLXのパートナー院です。正規認証のハンドピース（チップ）のみを使用して施術します。正規品の使用は施術前にご自身で確認いただけます。
  - (zh) Q 使用的仪器是正品吗？ → 是的。LIV整形外科是超声刀（Ultherapy Prime）正品认证诊所及热玛吉（Thermage FLX）合作诊所。我们仅使用正品认证的手具（探头）进行治疗。您可在治疗前亲自确认所用仪器为正品。
  - (zh-TW) Q 使用的儀器是正品嗎？ → 是的。LIV整形外科是超音波拉提（Ultherapy Prime）正品認證診所及電波拉皮（Thermage FLX）合作診所。我們僅使用正品認證的手具（探頭）進行治療。您可在治療前親自確認所用儀器為正品。

## 7. 의료진 (sections.doctors.kim, 4개 언어)

- en: Sooyoung Kim / Dr. Sooyoung Kim / Director / Board-certified Plastic Surgeon / 학력: M.D., Korea University College of Medicine; Internship, Korea University Medical Center; Residency in Plastic Surgery, Korea University Medical Center; M.S. in Plastic Surgery, Korea University Graduate School; Clinical Professor, Korea University College of Medicine; Fellowship, MD Anderson Cancer Center, Houston, Texas, USA / 자격: Member, Korean Association of Plastic Surgeons; Member, Korean Society of Plastic and Reconstructive Surgeons; Member, Korean Society of Aesthetic Plastic Surgery; Member, Korean Cleft Palate-Craniofacial Association; Member, Korean Society for Laser Medicine and Surgery / 전문: Ultherapy Prime Lifting; Thermage Lifting; Combination Lifting Treatments; Anti-Aging Programs
- ja: キム・スヨン / Dr. Sooyoung Kim / 代表院長 / 形成外科専門医 / 학력: 高麗大学校医科大学卒業; 高麗大学校医療院研修医修了; 高麗大学校医療院形成外科レジデント修了; 高麗大学校大学院形成外科学修士取得; 高麗大学校医科大学非常勤教授; 米国テキサス州ヒューストン MD Anderson Cancer Center 研修 / 자격: 大韓形成外科医師会正会員; 大韓形成外科学会正会員; 大韓美容形成外科学会正会員; 大韓頭蓋顔面形成外科学会正会員; 大韓医学レーザー学会正会員 / 전문: ウルセラプライムリフティング; サーマジリフティング; 複合リフティング施術; アンチエイジングプログラム
- zh: 金秀英 / Dr. Sooyoung Kim / 代表院长 / 整形外科专科医生 / 학력: 高丽大学医学院毕业; 高丽大学医疗院住院医师结业; 高丽大学医疗院整形外科住院医师结业; 高丽大学研究生院整形外科学硕士; 高丽大学医学院客座教授; 美国德克萨斯州休斯顿 MD Anderson Cancer Center 进修 / 자격: 大韩整形外科医师会正式会员; 大韩整形外科学会正式会员; 大韩美容整形外科学会正式会员; 大韩头颅颜面整形外科学会正式会员; 大韩医学激光学会正式会员 / 전문: 超声刀Prime提升; 热玛吉提升; 复合提升治疗; 抗衰老项目
- zh-TW: 金秀英 / Dr. Sooyoung Kim / 代表院長 / 整形外科專科醫生 / 학력: 高麗大學醫學院畢業; 高麗大學醫療院住院醫師結業; 高麗大學醫療院整形外科住院醫師結業; 高麗大學研究生院整形外科學碩士; 高麗大學醫學院客座教授; 美國德克薩斯州休斯頓 MD Anderson Cancer Center 進修 / 자격: 大韓整形外科醫師會正式會員; 大韓整形外科學會正式會員; 大韓美容整形外科學會正式會員; 大韓頭顱顏面整形外科學會正式會員; 大韓醫學激光學會正式會員 / 전문: 音波拉提Prime拉提; 鳳凰電波拉提; 複合拉提療程; 抗衰老療程
- SCI 논문 4편: src/app/[locale]/about/staff/page.tsx KIM_SCI_PUBLICATIONS (Arch Plast Surg 2024·2016, Dermatol Surg 2014, Microsurgery 2014) — 제목·저널만 인용, 링크 없음
- 두 번째 의료진: en: Shinhye Cheon (Board-certified Family Medicine Physician) / ja: チョン・シネ (家庭医学科専門医) / zh: 千信惠 (家庭医学科专科医生) / zh-TW: 千信惠 (家庭醫學科專科醫生)

## 8. 사이트에 없는 것 (가이드에서 [검수 필요]로 남길 항목)

- 시술별 비행 가능 시점, 붓기·붉음이 가라앉는 일수(울쎄라 "약간의 붓기·홍조 가능"만 있음), 술·사우나 제한 기간, 통증 점수
- 외국인 전용 패키지, 예약금·환불 규정(사이트: "상담 예약에는 예약금이 필요하지 않습니다"만 있음), Alipay/WeChat Pay 가능 여부
- 원장 논문 링크(PubMed/DOI), 장비 인증서 사진 사용 허가
- 9월 프로모션 조건(포스터에만 있음) — 가이드에서는 언급하지 않는다(할인 강조 금지)

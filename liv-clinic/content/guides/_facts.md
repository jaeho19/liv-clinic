# 가이드 근거 시트 (자동 생성 — 수정하지 말고 `npx tsx scripts/dump-guide-facts.mjs`로 재생성)

생성: 2026-09-05. 출처는 각 표의 머리말에 있다. **여기에 없는 가격·시간·자격·비행 시점은 가이드에 쓰지 않는다.**

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

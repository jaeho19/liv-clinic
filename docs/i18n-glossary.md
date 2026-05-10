# LIV 다국어 의료 용어집 (i18n Glossary)

> **목적**: LLM 번역 시 시술명·기기명·브랜드명의 표기를 강제 고정하여, 8개 locale에서 일관성 보장.
> **사용**: Claude/GPT로 메시지 파일 번역 시 시스템 프롬프트에 본 문서 전체를 주입.
> **갱신**: 신규 시술·기기 도입 시 해당 행만 추가.

---

## 1. 사용 원칙

1. **고유명사·제품명**: 영문 그대로 유지 (Thermage FLX, InMode, Ulthera Prime, Rejuran 등)
2. **시술 카테고리**: 각 언어 표준 의학 용어 사용
3. **브랜드명**: `LIV` 통일. 한국어/중국어 텍스트에서는 보조로 `리브성형외과`/`LIV 整形外科` 허용
4. **약어**: HIFU, RF, PDO, FDA 등 영문 약어는 모든 locale에서 영문 그대로
5. **모호한 의역 금지**: 직역으로 어색하면 영문 + 괄호 보조 (예: `非手術 (Non-surgical)`)

---

## 2. 브랜드명 (Brand Name)

| 한국어 | 영어 | zh (간체) | zh-TW (번체) | ja | vi | th | ru |
|--------|------|-----------|--------------|-----|-----|-----|-----|
| 리브성형외과 / LIV | LIV Plastic Surgery | LIV 整形外科 | LIV 整形外科 | リブ形成外科 / LIV | LIV Plastic Surgery | LIV Plastic Surgery | LIV Plastic Surgery |

**규칙**:
- 모든 신규 locale(vi/th/ru)에서는 **영문 LIV 그대로** 사용
- zh-TW는 zh와 동일하게 `LIV 整形外科` 사용
- "리브"의 음역(예: `LIV` → `리브`/`リブ`/`Liv`)은 추가하지 않음

---

## 3. 리프팅 시술 (Lifting Treatments)

### 3-1. 울쎄라피 (Ulthera/Ultherapy)

| Locale | 시술명 | 정식 표기 |
|--------|--------|-----------|
| ko | 울쎄라피 프라임 | 울쎄라 / 울쎄라피 프라임 |
| en | Ultherapy Prime | Ultherapy Prime (HIFU) |
| zh | 超声刀 Prime | 超声刀 / 超声刀 Prime |
| **zh-TW** | **超音波拉提 Prime** | 超音波拉提 / Ultherapy Prime |
| ja | ウルセラプライム | ウルセラ |
| **vi** | **Ultherapy Prime** | Ultherapy Prime (sóng siêu âm HIFU) |
| **th** | **อัลเทอร์รา ไพรม์** | Ultherapy Prime |
| **ru** | **Ультерапия Прайм** | Ultherapy Prime |

### 3-2. 써마지 (Thermage)

| Locale | 시술명 |
|--------|--------|
| ko | 써마지 FLX |
| en | Thermage FLX |
| zh | 热玛吉 FLX |
| **zh-TW** | **鳳凰電波 FLX** *(대만 표준 표기)* |
| ja | サーマジ FLX |
| **vi** | **Thermage FLX** |
| **th** | **เธอร์มาจ FLX** |
| **ru** | **Термаж FLX** |

### 3-3. 슈링크 (Shurink)

| Locale | 시술명 |
|--------|--------|
| ko | 슈링크 유니버스 |
| en | Shurink Universe |
| zh | 海芙 (Shurink) |
| **zh-TW** | **海芙音波 Universe** |
| ja | シュリンク |
| **vi** | **Shurink Universe** |
| **th** | **ชูริงค์ ยูนิเวิร์ส** |
| **ru** | **Шуринк Юниверс** |

### 3-4. 인모드 (InMode)

모든 locale에서 **영문 `InMode` 그대로 유지**. 단 보조 설명 추가 가능:
- ko: InMode (인모드)
- zh-TW: InMode (鳳凰電波黃金電波)
- vi: InMode (sóng RF)
- th: InMode (คลื่น RF)
- ru: InMode (RF-лифтинг)

### 3-5. 덴서티 (Density)

| Locale | 시술명 |
|--------|--------|
| ko | 덴서티 |
| en | Density |
| zh | Density |
| zh-TW | Density |
| ja | デンシティ |
| vi | Density |
| th | Density |
| ru | Density |

### 3-6. 실리프팅 (Thread Lift)

| Locale | 시술명 |
|--------|--------|
| ko | 실리프팅 |
| en | Thread Lift |
| zh | 埋线提升 |
| **zh-TW** | **埋線拉提** |
| ja | 糸リフト |
| **vi** | **Nâng cơ chỉ** |
| **th** | **ร้อยไหม (Thread Lift)** |
| **ru** | **Нитевой лифтинг** |

---

## 4. 안티에이징 시술 (Anti-aging)

### 4-1. 보톡스 (Botox)

| Locale | 시술명 |
|--------|--------|
| ko | 보톡스 |
| en | Botox |
| zh | 肉毒素 |
| **zh-TW** | **肉毒桿菌素** *(대만 표준)* |
| ja | ボトックス |
| **vi** | **Botox** |
| **th** | **โบท็อกซ์** |
| **ru** | **Ботокс** |

### 4-2. 필러 (Filler)

| Locale | 시술명 |
|--------|--------|
| ko | 필러 |
| en | Filler / Dermal Filler |
| zh | 玻尿酸 (필러) |
| **zh-TW** | **玻尿酸** |
| ja | フィラー / ヒアルロン酸 |
| **vi** | **Filler** |
| **th** | **ฟิลเลอร์** |
| **ru** | **Филлер** |

### 4-3. 스킨부스터 (Skin Booster)

| Locale | 시술명 |
|--------|--------|
| ko | 스킨부스터 |
| en | Skin Booster |
| zh | 水光针 |
| **zh-TW** | **水光針** |
| ja | スキンブースター / 水光注射 |
| **vi** | **Skin Booster** |
| **th** | **สกินบูสเตอร์** |
| **ru** | **Скинбустер** |

### 4-4. 리쥬란 (Rejuran)

| Locale | 시술명 |
|--------|--------|
| ko | 리쥬란 |
| en | Rejuran |
| zh | 婴儿针 (Rejuran) |
| **zh-TW** | **嬰兒針 (Rejuran)** |
| ja | リジュラン |
| **vi** | **Rejuran** |
| **th** | **รีจูรัน** |
| **ru** | **Реюран** |

### 4-5. 쥬베룩 (Juvelook)

모든 locale에서 **영문 `Juvelook` 그대로 유지**.

---

## 5. 레이저 시술 (Laser Treatments)

### 5-1. 피코 레이저 (Pico Laser)

| Locale | 시술명 |
|--------|--------|
| ko | 피코 레이저 |
| en | Pico Laser |
| zh | 皮秒激光 |
| **zh-TW** | **皮秒雷射** *(대만은 雷射)* |
| ja | ピコレーザー |
| **vi** | **Laser Pico** |
| **th** | **เลเซอร์พิโค** |
| **ru** | **Пико-лазер** |

### 5-2. 레이저 토닝

| Locale | 시술명 |
|--------|--------|
| ko | 레이저 토닝 |
| en | Laser Toning |
| zh | 激光美白 |
| zh-TW | 雷射美白 |
| ja | レーザートーニング |
| vi | Laser Toning |
| th | เลเซอร์โทนนิ่ง |
| ru | Лазерный тонинг |

### 5-3. Clarity II / 기기명

`Clarity II`, `Pastelle`, `Spectra`, `IPL` 등 **장비 영문명은 모든 locale에서 그대로 유지**.

---

## 6. 의학 일반 용어 (Medical Terms)

| 한국어 | 영어 | zh | zh-TW | ja | vi | th | ru |
|--------|------|----|----|-----|-----|-----|-----|
| 안티에이징 | Anti-aging | 抗衰老 | 抗老化 | アンチエイジング | Chống lão hóa | ต้านวัย | Антивозрастной |
| 리프팅 | Lifting | 提升 | 拉提 | リフティング | Nâng cơ | ยกกระชับ | Лифтинг |
| 비수술 | Non-surgical | 非手术 | 非手術 | 非手術 | Không phẫu thuật | ไม่ต้องผ่าตัด | Безоперационный |
| 회복기간 | Recovery (Downtime) | 恢复期 | 恢復期 | ダウンタイム | Thời gian hồi phục | ระยะพักฟื้น | Период восстановления |
| 시술 시간 | Duration | 治疗时间 | 治療時間 | 施術時間 | Thời gian thực hiện | ระยะเวลา | Длительность процедуры |
| 마취 | Anesthesia | 麻醉 | 麻醉 | 麻酔 | Gây tê | ยาชา | Анестезия |
| 마취 크림 | Topical anesthetic cream | 麻醉霜 | 麻醉霜 | 麻酔クリーム | Kem gây tê | ยาชาเฉพาะที่ | Анестезирующий крем |
| 부작용 | Side effects | 副作用 | 副作用 | 副作用 | Tác dụng phụ | ผลข้างเคียง | Побочные эффекты |
| 주의사항 | Cautions / Precautions | 注意事项 | 注意事項 | 注意事項 | Lưu ý | ข้อควรระวัง | Меры предосторожности |
| 효과 | Results / Effects | 效果 | 效果 | 効果 | Hiệu quả | ผลลัพธ์ | Результат |
| 콜라겐 | Collagen | 胶原蛋白 | 膠原蛋白 | コラーゲン | Collagen | คอลลาเจน | Коллаген |
| 진피층 | Dermis | 真皮层 | 真皮層 | 真皮層 | Lớp hạ bì | ชั้นหนังแท้ | Дерма |
| SMAS층 | SMAS layer | SMAS筋膜层 | SMAS筋膜層 | SMAS層 | Lớp SMAS | ชั้น SMAS | SMAS-слой |
| 모공 | Pores | 毛孔 | 毛孔 | 毛穴 | Lỗ chân lông | รูขุมขน | Поры |
| 주름 | Wrinkles | 皱纹 | 皺紋 | しわ | Nếp nhăn | ริ้วรอย | Морщины |
| 탄력 | Elasticity | 弹力 | 彈力 | 弾力 | Độ đàn hồi | ความยืดหยุ่น | Эластичность |
| 색소침착 | Pigmentation | 色素沉着 | 色素沉澱 | 色素沈着 | Tăng sắc tố | ฝ้า กระ | Пигментация |
| 기미 | Melasma | 黄褐斑 | 肝斑 | 肝斑 | Nám da | ฝ้า | Мелазма |
| 홍조 | Rosacea / Redness | 红血丝 | 紅血絲 | 赤ら顔 | Đỏ da | หน้าแดง | Розацеа |
| 흉터 | Scar | 疤痕 | 疤痕 | 傷跡 | Sẹo | แผลเป็น | Шрам |

---

## 7. 약어 (Abbreviations) — 모든 locale에서 영문 그대로

- **HIFU** (High-Intensity Focused Ultrasound)
- **RF** (Radiofrequency)
- **PDO** (Polydioxanone)
- **PLA** (Polylactic Acid)
- **PCL** (Polycaprolactone)
- **FDA** (Food and Drug Administration)
- **MFDS** / **KFDA** (한국 식약처)
- **IPL** (Intense Pulsed Light)
- **LDM** (Local Dynamic Micromassage)
- **PRP** (Platelet-Rich Plasma)

---

## 8. 시술 부위 (Treatment Areas) — 자주 쓰이는 표현

| 한국어 | 영어 | zh | zh-TW | ja | vi | th | ru |
|--------|------|----|----|-----|-----|-----|-----|
| 이마 | Forehead | 额头 | 額頭 | 額 | Trán | หน้าผาก | Лоб |
| 눈가 | Eye area | 眼周 | 眼周 | 目元 | Vùng mắt | รอบดวงตา | Область глаз |
| 미간 | Glabella | 眉间 | 眉間 | 眉間 | Giữa hai chân mày | หว่างคิ้ว | Межбровье |
| 볼 | Cheeks | 面颊 | 臉頰 | 頬 | Má | แก้ม | Щёки |
| 팔자주름 | Nasolabial folds | 法令纹 | 法令紋 | ほうれい線 | Nếp nhăn cười | ร่องแก้ม | Носогубные складки |
| 턱 | Jawline | 下颌线 | 下顎線 | 顎ライン | Đường viền hàm | กรามและคาง |  Линия подбородка |
| 목 | Neck | 颈部 | 頸部 | 首 | Cổ | คอ | Шея |
| 데콜테 | Décolletage | 颈胸部 | 頸胸部 | デコルテ | Vùng ngực trên | หน้าอก-ลำคอ | Декольте |

---

## 9. CTA / UI 공통 텍스트 (선택)

| 한국어 | en | zh | zh-TW | ja | vi | th | ru |
|--------|----|----|----|-----|-----|-----|-----|
| 상담 예약 | Book Consultation | 预约咨询 | 預約諮詢 | 相談予約 | Đặt lịch tư vấn | จองให้คำปรึกษา | Записаться на консультацию |
| 자세히 보기 | Learn More | 了解更多 | 了解更多 | 詳しく見る | Xem thêm | ดูเพิ่มเติม | Подробнее |
| 카카오톡 상담 | KakaoTalk Consultation | KakaoTalk 咨询 | KakaoTalk 諮詢 | カカオトーク相談 | Tư vấn qua KakaoTalk | ปรึกษาผ่าน KakaoTalk | Консультация через KakaoTalk |
| 본문으로 건너뛰기 | Skip to main content | 跳转到主要内容 | 跳到主要內容 | メインコンテンツにスキップ | Chuyển đến nội dung chính | ข้ามไปยังเนื้อหาหลัก | Перейти к основному содержанию |

---

## 10. LLM 번역 프롬프트 템플릿

```
You are translating the LIV Plastic Surgery clinic website from Korean (ko.json) to {target_locale}.

CRITICAL RULES:
1. Preserve all keys exactly. Translate ONLY values.
2. Keep ICU MessageFormat placeholders ({name}, {count}, etc.) unchanged.
3. Use the brand name "LIV" or "{target_locale_brand}" — never transliterate.
4. Apply the following glossary STRICTLY (override any general translation):

[INSERT TABLES FROM SECTIONS 2-8 FOR THE TARGET LOCALE]

5. For procedure/equipment names (Thermage FLX, InMode, Ulthera Prime, Rejuran, Juvelook, Clarity II, Pastelle, Pico Laser): keep ENGLISH unless the glossary specifies otherwise.
6. Medical abbreviations (HIFU, RF, PDO, FDA, IPL): keep ENGLISH.
7. Tone: professional, premium, reassuring (medical clinic for 30-50 age range).
8. Output ONLY valid JSON matching the input structure.
```

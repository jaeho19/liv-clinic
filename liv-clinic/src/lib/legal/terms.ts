/**
 * 이용약관(/{locale}/terms) 본문. 번역 JSON을 키우지 않기 위해 TS 사전으로 둔다(guides/ui.ts와 같은 방식).
 * 한국어본이 원본이며, 나머지 10개 언어는 같은 의미를 각 언어로 자연스럽게 옮긴 것이다.
 * 번역본과 한국어본이 다를 경우 한국어본이 우선한다(제10조).
 */
import type { Locale } from '@/i18n/routing';

export interface TermsSection {
  heading: string;
  body: string;
}

export interface TermsContent {
  /** page <h1> and breadcrumb name, e.g. "이용약관" */
  title: string;
  /** <title> tag, e.g. "이용약관 | 리브성형외과 신사역" — 20–60 characters */
  metaTitle: string;
  /** meta description — 70–160 characters, no Korean text in non-ko locales */
  metaDescription: string;
  /** "시행일" label */
  effectiveLabel: string;
  /** ISO-like date string shown to users: "2026-09-06" */
  effectiveDate: string;
  /** one-paragraph intro under the title */
  intro: string;
  sections: TermsSection[];
}

export const TERMS_EFFECTIVE_DATE = '2026-09-06';

export const TERMS: Record<Locale, TermsContent> = {
  ko: {
    title: '이용약관',
    metaTitle: '홈페이지 이용약관 | 리브성형외과 신사역',
    metaDescription:
      '리브성형외과 홈페이지(liv-clinic.net) 이용약관입니다. 사이트 이용 조건, 온라인 상담 신청, 개인정보 보호, 저작권과 콘텐츠, 책임의 한계, 준거법과 분쟁 해결에 관한 사항을 안내합니다.',
    effectiveLabel: '시행일',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      '이 약관은 리브성형외과가 운영하는 웹사이트(liv-clinic.net)와 온라인 서비스를 이용하는 모든 분께 적용됩니다. 사이트를 이용하시기 전에 아래 내용을 확인해 주시기 바랍니다.',
    sections: [
      {
        heading: '제1조 (목적)',
        body:
          '이 약관은 리브성형외과(이하 “의원”)가 운영하는 웹사이트 liv-clinic.net과 이를 통해 제공하는 온라인 서비스(상담 신청 양식, 채팅 상담, 이벤트 안내 등)의 이용 조건과 절차, 이용자와 의원의 권리·의무 및 책임에 관한 사항을 정하는 것을 목적으로 합니다.',
      },
      {
        heading: '제2조 (용어의 정의)',
        body:
          '“사이트”란 의원이 운영하는 웹사이트 liv-clinic.net과 그 하위 페이지를 말합니다. “이용자”란 사이트에 접속하여 이 약관에 따라 서비스를 이용하는 모든 분을 말합니다. “서비스”란 의원이 사이트를 통해 제공하는 시술 정보, 가격 안내, 이벤트 안내, 온라인 상담 신청, 채팅 상담 등을 말합니다. “상담 신청”이란 이용자가 사이트의 양식이나 채팅을 통해 의원에 상담이나 예약을 요청하는 행위를 말합니다.',
      },
      {
        heading: '제3조 (약관의 효력 및 변경)',
        body:
          '이 약관은 사이트에 게시함으로써 효력이 발생합니다. 의원은 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경된 약관은 시행일과 함께 사이트에 게시합니다. 변경된 약관은 게시된 시행일부터 적용되며, 이용자가 변경 이후에도 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 봅니다.',
      },
      {
        heading: '제4조 (서비스의 제공)',
        body:
          '의원은 사이트를 통해 시술과 진료 안내, 가격 안내, 이벤트 안내, 온라인 상담 신청, 채팅 상담 등의 서비스를 제공합니다. 온라인 상담과 채팅 상담은 진료나 진단이 아니며, 시술의 적합 여부와 구체적인 치료 계획은 의료진과의 대면 상담 후에 결정됩니다. 시술의 결과는 개인의 상태에 따라 다를 수 있습니다. 의원은 시스템 점검, 설비 교체 등 필요한 경우 서비스의 일부를 일시적으로 중단할 수 있습니다.',
      },
      {
        heading: '제5조 (예약 및 상담 신청)',
        body:
          '이용자는 상담 신청 시 이름, 연락처 등 필요한 정보를 정확하게 입력해야 하며, 부정확한 정보로 인한 불이익은 이용자가 부담합니다. 의원은 접수된 신청을 전화 또는 메신저로 확인한 뒤 상담 일정을 안내합니다. 상담 신청의 접수만으로 예약이 확정되는 것은 아니며, 의원의 확인이 있어야 예약이 확정됩니다. 예약을 변경하거나 취소하려는 경우에는 미리 의원에 알려 주시기 바랍니다.',
      },
      {
        heading: '제6조 (이용자의 의무)',
        body:
          '이용자는 서비스를 이용할 때 다음 행위를 해서는 안 됩니다. 허위 정보 입력이나 타인 명의 도용, 사이트나 서버에 대한 무단 접근이나 운영 방해, 불법적이거나 부당한 목적의 이용, 다른 사람의 개인정보 게시나 유출, 의료진·직원·다른 이용자에 대한 욕설이나 위협 등 부적절한 행위가 이에 해당합니다. 이용자가 이를 위반하여 의원이나 제3자에게 손해를 끼친 경우 그 책임은 이용자에게 있습니다.',
      },
      {
        heading: '제7조 (개인정보의 보호)',
        body:
          '의원은 서비스 제공을 위해 필요한 최소한의 개인정보를 수집하며, 개인정보 보호법 등 관련 법령에 따라 이를 안전하게 처리합니다. 개인정보의 수집 항목, 이용 목적, 보유 기간, 이용자의 권리 등 자세한 내용은 사이트에 게시된 개인정보처리방침에 따릅니다.',
      },
      {
        heading: '제8조 (지식재산권 및 콘텐츠)',
        body:
          '사이트에 게시된 글, 이미지, 영상, 시술 전후 사진, 디자인 등 모든 콘텐츠에 대한 저작권과 지식재산권은 의원 또는 정당한 권리자에게 있습니다. 이용자는 의원의 사전 서면 동의 없이 콘텐츠를 복제, 전송, 배포, 편집하거나 상업적으로 이용할 수 없습니다. 사이트에 게시된 후기는 작성자의 동의를 얻어 게시하며, 의원은 필요한 경우 후기를 수정하거나 삭제할 수 있습니다.',
      },
      {
        heading: '제9조 (면책 및 책임의 한계)',
        body:
          '사이트에 게시된 시술 정보와 가격 안내는 일반적인 참고 자료이며, 의료진의 전문적인 진료와 상담을 대신하지 않습니다. 의원은 통신망 장애, 천재지변, 불가항력 또는 메신저·지도 서비스 등 제3자가 제공하는 서비스의 문제로 인한 서비스 중단이나 지연에 대해 책임을 지지 않습니다. 사이트에 포함된 외부 사이트 링크는 이용자의 편의를 위한 것이며, 의원이 해당 사이트의 내용을 보증하는 것은 아닙니다.',
      },
      {
        heading: '제10조 (준거법 및 분쟁 해결)',
        body:
          '이 약관은 대한민국 법률에 따라 해석되고 적용됩니다. 서비스 이용과 관련하여 의원과 이용자 사이에 분쟁이 발생한 경우 양측은 먼저 성실하게 협의하여 해결하도록 노력하며, 협의가 이루어지지 않는 경우 대한민국 법령에 따른 관할 법원(서울중앙지방법원)에서 해결합니다. 이 약관의 번역본과 한국어본의 내용이 다를 경우 한국어본이 우선합니다. 약관에 관한 문의는 info@liv-clinic.net으로 연락해 주시기 바랍니다.',
      },
    ],
  },

  en: {
    title: 'Terms of Use',
    metaTitle: 'Terms of Use | LIV Plastic Surgery Sinsa, Seoul',
    metaDescription:
      'Terms of Use for the LIV Plastic Surgery website: site use, consultation requests, personal data, intellectual property, liability and governing law.',
    effectiveLabel: 'Effective date',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      'These Terms of Use apply to everyone who uses the website liv-clinic.net and the online services operated by LIV Plastic Surgery. Please read them before using the site.',
    sections: [
      {
        heading: '1. Purpose',
        body:
          'These Terms of Use (the "Terms") set out the conditions for using the website liv-clinic.net (the "Site") and the online services offered through it by LIV Plastic Surgery (the "Clinic"), including consultation request forms, chat and event information. They also describe the rights, obligations and responsibilities of the Clinic and of everyone who uses the Site.',
      },
      {
        heading: '2. Definitions',
        body:
          '"Site" means the website liv-clinic.net and all of its pages operated by the Clinic. "User" means any person who accesses the Site and uses the Service in accordance with these Terms. "Service" means the treatment information, price guide, event notices, online consultation requests, chat and other functions that the Clinic provides through the Site. "Consultation request" means a request for a consultation or an appointment that a User sends to the Clinic through a form or the chat on the Site.',
      },
      {
        heading: '3. Effect and amendment of the Terms',
        body:
          'These Terms take effect when they are posted on the Site. The Clinic may amend them to the extent permitted by applicable law. Amended Terms are announced on the Site together with their effective date and apply from that date. A User who continues to use the Service after the effective date is deemed to have accepted the amended Terms.',
      },
      {
        heading: '4. Services provided',
        body:
          'Through the Site the Clinic provides information about the Clinic and its treatments, a price guide, event notices, online consultation requests and chat. Online consultation and chat are not a medical examination or a diagnosis. Whether a treatment is suitable and what the treatment plan will be are decided only after an in-person consultation with a doctor. Treatment results vary from person to person. The Clinic may temporarily suspend part of the Service when necessary, for example for system maintenance or equipment replacement.',
      },
      {
        heading: '5. Reservations and consultation requests',
        body:
          'When submitting a consultation request, the User must provide accurate information such as name and contact details, and is responsible for any disadvantage caused by inaccurate information. The Clinic confirms received requests by phone or messenger and then proposes a consultation time. Submitting a request does not by itself create a confirmed booking; a booking is confirmed only once the Clinic has confirmed it. If you need to change or cancel an appointment, please notify the Clinic in advance.',
      },
      {
        heading: '6. Obligations of the User',
        body:
          'When using the Service, Users must not: enter false information or use another person\'s identity; access the Site or its servers without authorization or interfere with their normal operation; use the Service for unlawful or improper purposes; post or disclose the personal information of others; or behave abusively or threateningly toward medical staff, employees or other Users. A User who breaches these obligations and causes damage to the Clinic or to a third party is responsible for that damage.',
      },
      {
        heading: '7. Personal information',
        body:
          'The Clinic collects only the personal information needed to provide the Service and handles it securely in accordance with the Personal Information Protection Act of the Republic of Korea and other applicable laws. Details such as the items collected, the purposes of use, the retention period and the rights of Users are set out in the Privacy Policy posted on the Site.',
      },
      {
        heading: '8. Intellectual property and content',
        body:
          'All content on the Site, including text, images, videos, before-and-after photographs and design, is protected by copyright and other intellectual property rights that belong to the Clinic or to its licensors. Users may not copy, transmit, distribute, edit or commercially use this content without the prior written consent of the Clinic. Patient reviews are posted with the consent of their authors, and the Clinic may edit or remove a review where necessary.',
      },
      {
        heading: '9. Disclaimer and limitation of liability',
        body:
          'The treatment information and price guide on the Site are general reference material and do not replace professional medical advice, examination or consultation with a doctor. The Clinic is not liable for interruptions or delays of the Service caused by network failures, natural disasters, force majeure or problems with services provided by third parties, such as messengers or map services. Links to external websites are provided for convenience only and do not mean that the Clinic endorses their content.',
      },
      {
        heading: '10. Governing law and dispute resolution',
        body:
          'These Terms are governed by and interpreted in accordance with the laws of the Republic of Korea. If a dispute arises between the Clinic and a User in connection with the Service, both parties will first try to resolve it through good-faith consultation. If no agreement is reached, the dispute will be brought before the competent court under Korean law, the Seoul Central District Court. If a translation of these Terms differs from the Korean version, the Korean version prevails. Questions about these Terms may be sent to info@liv-clinic.net.',
      },
    ],
  },

  ja: {
    title: '利用規約',
    metaTitle: 'ウェブサイト利用規約 | LIV美容クリニック 新沙',
    metaDescription:
      'LIV美容クリニックのウェブサイト（liv-clinic.net）利用規約です。サイトの利用条件、オンライン相談の申し込み、個人情報の取り扱い、著作権とコンテンツ、免責事項、準拠法と紛争解決について定めています。',
    effectiveLabel: '施行日',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      'この利用規約は、LIV美容クリニックが運営するウェブサイト（liv-clinic.net）およびオンラインサービスをご利用になるすべての方に適用されます。サイトをご利用になる前に、以下の内容をご確認ください。',
    sections: [
      {
        heading: '第1条（目的）',
        body:
          'この規約は、LIV美容クリニック（以下「当院」）が運営するウェブサイト liv-clinic.net および当院がサイトを通じて提供するオンラインサービス（相談申込フォーム、チャット相談、イベント案内など）の利用条件と手続き、利用者と当院の権利・義務および責任に関する事項を定めることを目的とします。',
      },
      {
        heading: '第2条（用語の定義）',
        body:
          '「サイト」とは、当院が運営するウェブサイト liv-clinic.net およびその下位ページをいいます。「利用者」とは、サイトにアクセスし、この規約に従ってサービスを利用するすべての方をいいます。「サービス」とは、当院がサイトを通じて提供する施術情報、料金案内、イベント案内、オンライン相談申込、チャット相談などをいいます。「相談申込」とは、利用者がサイトのフォームまたはチャットを通じて当院に相談や予約を依頼することをいいます。',
      },
      {
        heading: '第3条（規約の効力および変更）',
        body:
          'この規約は、サイトに掲載することによって効力を生じます。当院は、関連法令に反しない範囲でこの規約を変更することができ、変更後の規約は施行日とともにサイトに掲載します。変更後の規約は掲載された施行日から適用され、利用者が変更後もサービスの利用を継続した場合、変更後の規約に同意したものとみなします。',
      },
      {
        heading: '第4条（サービスの提供）',
        body:
          '当院は、サイトを通じて施術・診療の案内、料金案内、イベント案内、オンライン相談申込、チャット相談などのサービスを提供します。オンライン相談およびチャット相談は診察や診断ではなく、施術の適否および具体的な治療計画は、医師との対面カウンセリングの後に決定されます。施術の結果には個人差があります。当院は、システム点検や設備の交換など必要な場合に、サービスの一部を一時的に停止することがあります。',
      },
      {
        heading: '第5条（予約および相談申込）',
        body:
          '利用者は、相談申込の際に氏名や連絡先などの必要な情報を正確に入力しなければならず、不正確な情報によって生じた不利益は利用者が負担します。当院は、受け付けた申込を電話またはメッセンジャーで確認したうえで、相談日時をご案内します。相談申込の受付のみでは予約は確定せず、当院の確認をもって予約が確定します。予約を変更または取り消す場合は、事前に当院までご連絡ください。',
      },
      {
        heading: '第6条（利用者の義務）',
        body:
          '利用者は、サービスの利用にあたり、次の行為を行ってはなりません。虚偽の情報の入力や他人の名義の無断使用、サイトやサーバーへの無断アクセスや運営の妨害、違法または不当な目的での利用、他人の個人情報の掲載や漏えい、医療スタッフ・職員・他の利用者に対する暴言や脅迫などの不適切な行為がこれに該当します。利用者がこれに違反して当院または第三者に損害を与えた場合、その責任は利用者が負います。',
      },
      {
        heading: '第7条（個人情報の保護）',
        body:
          '当院は、サービスの提供に必要な最小限の個人情報を収集し、大韓民国の個人情報保護法その他の関連法令に従って安全に取り扱います。収集する項目、利用目的、保有期間、利用者の権利などの詳細は、サイトに掲載しているプライバシーポリシーに従います。',
      },
      {
        heading: '第8条（知的財産権およびコンテンツ）',
        body:
          'サイトに掲載されている文章、画像、動画、施術前後の写真、デザインなどすべてのコンテンツの著作権および知的財産権は、当院または正当な権利者に帰属します。利用者は、当院の事前の書面による同意なく、コンテンツを複製、送信、配布、編集し、または商業的に利用することはできません。サイトに掲載されている体験談は、投稿者の同意を得て掲載しており、当院は必要に応じてこれを修正または削除することがあります。',
      },
      {
        heading: '第9条（免責および責任の制限）',
        body:
          'サイトに掲載されている施術情報および料金案内は一般的な参考資料であり、医師による専門的な診療や相談に代わるものではありません。当院は、通信回線の障害、天災、不可抗力、またはメッセンジャーや地図サービスなど第三者が提供するサービスの不具合によるサービスの中断や遅延について責任を負いません。サイトに含まれる外部サイトへのリンクは利用者の便宜のためのものであり、当院がその内容を保証するものではありません。',
      },
      {
        heading: '第10条（準拠法および紛争の解決）',
        body:
          'この規約は、大韓民国の法律に従って解釈され、適用されます。サービスの利用に関して当院と利用者の間に紛争が生じた場合、双方はまず誠実に協議して解決するよう努め、協議が調わない場合は、大韓民国の法令に基づく管轄裁判所（ソウル中央地方法院）で解決します。この規約の翻訳版と韓国語版の内容が異なる場合は、韓国語版が優先します。規約に関するお問い合わせは info@liv-clinic.net までご連絡ください。',
      },
    ],
  },

  zh: {
    title: '使用条款',
    metaTitle: '网站使用条款 | LIV整形外科 首尔新沙',
    metaDescription:
      'LIV整形外科网站（liv-clinic.net）使用条款。本页说明网站与在线服务的使用条件、在线咨询申请、个人信息保护、版权与内容、责任限制以及适用法律与争议解决等事项。',
    effectiveLabel: '生效日期',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      '本使用条款适用于所有使用 LIV整形外科运营的网站（liv-clinic.net）及在线服务的用户。请在使用本网站前阅读以下内容。',
    sections: [
      {
        heading: '第一条（目的）',
        body:
          '本条款旨在规定 LIV整形外科（以下简称“本院”）运营的网站 liv-clinic.net 及通过该网站提供的在线服务（咨询申请表、在线聊天咨询、活动信息等）的使用条件和程序，以及用户与本院之间的权利、义务和责任。',
      },
      {
        heading: '第二条（定义）',
        body:
          '“网站”指本院运营的网站 liv-clinic.net 及其所有子页面。“用户”指访问本网站并按照本条款使用服务的所有人。“服务”指本院通过网站提供的项目信息、价格指南、活动通知、在线咨询申请、在线聊天咨询等功能。“咨询申请”指用户通过网站的表单或聊天功能向本院提出咨询或预约请求的行为。',
      },
      {
        heading: '第三条（条款的效力与修改）',
        body:
          '本条款自在网站公布之日起生效。本院可在不违反相关法律法规的范围内修改本条款，修改后的条款将连同生效日期一并在网站公布。修改后的条款自公布的生效日期起适用；用户在修改后继续使用服务的，视为同意修改后的条款。',
      },
      {
        heading: '第四条（服务的提供）',
        body:
          '本院通过网站提供项目与诊疗介绍、价格指南、活动通知、在线咨询申请和在线聊天咨询等服务。在线咨询和聊天咨询不属于医疗诊察或诊断，项目是否适合以及具体的治疗方案，须经医生面诊后才能确定。治疗效果因人而异。在系统检修、设备更换等必要情况下，本院可暂时中止部分服务。',
      },
      {
        heading: '第五条（预约与咨询申请）',
        body:
          '用户在提交咨询申请时应准确填写姓名、联系方式等必要信息，因信息不准确造成的不利后果由用户自行承担。本院在收到申请后将通过电话或即时通讯工具进行确认，并告知咨询时间。仅提交咨询申请并不等于预约已确认，预约须经本院确认后方为有效。如需更改或取消预约，请提前通知本院。',
      },
      {
        heading: '第六条（用户的义务）',
        body:
          '用户在使用服务时不得从事下列行为：填写虚假信息或冒用他人名义；未经许可访问网站或服务器，或妨碍其正常运行；将服务用于违法或不正当目的；发布或泄露他人的个人信息；对医护人员、工作人员或其他用户进行辱骂、威胁等不当行为。用户违反上述规定并给本院或第三方造成损失的，由用户自行承担责任。',
      },
      {
        heading: '第七条（个人信息保护）',
        body:
          '本院仅收集提供服务所必需的最少量个人信息，并依据大韩民国《个人信息保护法》及其他相关法律法规予以安全处理。收集的项目、使用目的、保存期限以及用户权利等具体内容，以网站公布的隐私政策为准。',
      },
      {
        heading: '第八条（知识产权与内容）',
        body:
          '网站上发布的文字、图片、视频、治疗前后照片、设计等所有内容的著作权和知识产权归本院或合法权利人所有。未经本院事先书面同意，用户不得复制、传输、发布、编辑或将上述内容用于商业用途。网站上发布的患者评价均经作者同意后发布，本院可在必要时对其进行修改或删除。',
      },
      {
        heading: '第九条（免责与责任限制）',
        body:
          '网站上发布的项目信息和价格指南仅为一般性参考资料，不能替代医生的专业诊疗和咨询。因通信网络故障、自然灾害、不可抗力，或即时通讯工具、地图等第三方服务出现问题而导致的服务中断或延迟，本院不承担责任。网站中包含的外部网站链接仅为方便用户而提供，并不代表本院对其内容的认可或保证。',
      },
      {
        heading: '第十条（适用法律与争议解决）',
        body:
          '本条款依据大韩民国法律进行解释和适用。因使用服务而在本院与用户之间发生争议时，双方应首先本着诚信原则协商解决；协商不成的，由大韩民国法律规定的管辖法院（首尔中央地方法院）解决。本条款的翻译版本与韩文版本内容不一致时，以韩文版本为准。有关本条款的疑问，请发送电子邮件至 info@liv-clinic.net。',
      },
    ],
  },

  'zh-TW': {
    title: '使用條款',
    metaTitle: '網站使用條款 | LIV整形外科 首爾新沙',
    metaDescription:
      'LIV整形外科網站（liv-clinic.net）使用條款。本頁說明網站與線上服務的使用條件、線上諮詢申請、個人資料保護、著作權與內容、責任限制以及準據法與爭議解決等事項。',
    effectiveLabel: '生效日期',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      '本使用條款適用於所有使用 LIV整形外科營運之網站（liv-clinic.net）及線上服務的使用者。請於使用本網站前詳閱以下內容。',
    sections: [
      {
        heading: '第一條（目的）',
        body:
          '本條款旨在規範 LIV整形外科（以下簡稱「本院」）所營運之網站 liv-clinic.net，以及透過該網站提供之線上服務（諮詢申請表、線上聊天諮詢、活動資訊等）的使用條件與程序，並明定使用者與本院之間的權利、義務及責任。',
      },
      {
        heading: '第二條（定義）',
        body:
          '「網站」指本院營運之網站 liv-clinic.net 及其所有子頁面。「使用者」指瀏覽本網站並依本條款使用服務之所有人。「服務」指本院透過網站提供之療程資訊、價格指南、活動公告、線上諮詢申請、線上聊天諮詢等功能。「諮詢申請」指使用者透過網站表單或聊天功能向本院提出諮詢或預約請求之行為。',
      },
      {
        heading: '第三條（條款之效力與修訂）',
        body:
          '本條款自公告於網站之日起生效。本院得於不違反相關法令之範圍內修訂本條款，修訂後之條款將連同生效日期一併公告於網站。修訂後之條款自公告之生效日期起適用；使用者於修訂後仍繼續使用服務者，視為同意修訂後之條款。',
      },
      {
        heading: '第四條（服務之提供）',
        body:
          '本院透過網站提供療程與診療介紹、價格指南、活動公告、線上諮詢申請及線上聊天諮詢等服務。線上諮詢與聊天諮詢並非醫療診察或診斷，療程是否適合以及具體的治療計畫，須經醫師當面諮詢後方能決定。治療結果因人而異。於系統檢修、設備更換等必要情況下，本院得暫時中止部分服務。',
      },
      {
        heading: '第五條（預約與諮詢申請）',
        body:
          '使用者提出諮詢申請時，應正確填寫姓名、聯絡方式等必要資訊，因資訊不正確所生之不利益由使用者自行承擔。本院於收到申請後，將以電話或即時通訊軟體確認，並告知諮詢時間。僅提出諮詢申請並不代表預約已確認，預約須經本院確認後始生效力。如需變更或取消預約，請提前通知本院。',
      },
      {
        heading: '第六條（使用者之義務）',
        body:
          '使用者於使用服務時不得從事下列行為：填寫不實資訊或冒用他人名義；未經許可存取網站或伺服器，或妨礙其正常運作；將服務用於違法或不當目的；張貼或洩漏他人之個人資料；對醫護人員、工作人員或其他使用者為辱罵、威脅等不當行為。使用者違反上述規定致本院或第三人受有損害者，應自行負責。',
      },
      {
        heading: '第七條（個人資料保護）',
        body:
          '本院僅蒐集提供服務所必要之最少量個人資料，並依大韓民國《個人資訊保護法》及其他相關法令妥善處理。蒐集項目、利用目的、保存期間及使用者權利等詳細內容，依網站公告之隱私權政策辦理。',
      },
      {
        heading: '第八條（智慧財產權與內容）',
        body:
          '網站上刊登之文字、圖片、影片、療程前後照片、設計等所有內容之著作權及智慧財產權，均屬本院或合法權利人所有。未經本院事前書面同意，使用者不得重製、傳輸、散布、編輯或將上述內容用於商業用途。網站上刊登之患者評價均經作者同意後刊登，本院得於必要時予以修改或刪除。',
      },
      {
        heading: '第九條（免責與責任限制）',
        body:
          '網站上刊登之療程資訊與價格指南僅供一般參考，不能取代醫師之專業診療與諮詢。因通訊網路故障、天災、不可抗力，或即時通訊軟體、地圖等第三方服務發生問題所導致之服務中斷或延遲，本院不負責任。網站所含之外部網站連結僅為方便使用者而提供，不代表本院對其內容之認可或保證。',
      },
      {
        heading: '第十條（準據法與爭議解決）',
        body:
          '本條款依大韓民國法律解釋及適用。因使用服務而於本院與使用者之間發生爭議時，雙方應先本於誠信原則協商解決；協商不成者，由大韓民國法令所定之管轄法院（首爾中央地方法院）解決。本條款之翻譯版本與韓文版本內容不一致時，以韓文版本為準。有關本條款之疑問，請來信 info@liv-clinic.net。',
      },
    ],
  },

  vi: {
    title: 'Điều khoản sử dụng',
    metaTitle: 'Điều khoản sử dụng | Phẫu thuật Thẩm mỹ LIV Sinsa, Seoul',
    metaDescription:
      'Điều khoản sử dụng trang web Phẫu thuật Thẩm mỹ LIV: điều kiện sử dụng, yêu cầu tư vấn, thông tin cá nhân, sở hữu trí tuệ, trách nhiệm và luật áp dụng.',
    effectiveLabel: 'Ngày có hiệu lực',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      'Điều khoản sử dụng này áp dụng cho tất cả những người sử dụng trang web liv-clinic.net và các dịch vụ trực tuyến do Phẫu thuật Thẩm mỹ LIV vận hành. Vui lòng đọc kỹ nội dung dưới đây trước khi sử dụng trang web.',
    sections: [
      {
        heading: 'Điều 1. Mục đích',
        body:
          'Điều khoản này quy định các điều kiện và thủ tục sử dụng trang web liv-clinic.net do Phẫu thuật Thẩm mỹ LIV (sau đây gọi là "Phòng khám") vận hành, cùng các dịch vụ trực tuyến được cung cấp qua trang web như biểu mẫu yêu cầu tư vấn, trò chuyện trực tuyến và thông tin sự kiện. Điều khoản cũng xác định quyền, nghĩa vụ và trách nhiệm của Phòng khám và của người sử dụng.',
      },
      {
        heading: 'Điều 2. Định nghĩa',
        body:
          '"Trang web" là trang web liv-clinic.net và toàn bộ các trang con do Phòng khám vận hành. "Người dùng" là bất kỳ ai truy cập Trang web và sử dụng Dịch vụ theo Điều khoản này. "Dịch vụ" là thông tin về các liệu trình, bảng giá tham khảo, thông báo sự kiện, yêu cầu tư vấn trực tuyến, trò chuyện trực tuyến và các chức năng khác mà Phòng khám cung cấp qua Trang web. "Yêu cầu tư vấn" là việc Người dùng gửi đề nghị tư vấn hoặc đặt lịch hẹn đến Phòng khám thông qua biểu mẫu hoặc trò chuyện trên Trang web.',
      },
      {
        heading: 'Điều 3. Hiệu lực và sửa đổi Điều khoản',
        body:
          'Điều khoản này có hiệu lực kể từ khi được đăng tải trên Trang web. Phòng khám có thể sửa đổi Điều khoản trong phạm vi pháp luật cho phép; Điều khoản sửa đổi sẽ được công bố trên Trang web cùng với ngày có hiệu lực. Điều khoản sửa đổi được áp dụng kể từ ngày có hiệu lực đã công bố. Người dùng tiếp tục sử dụng Dịch vụ sau ngày đó được xem là đã chấp nhận Điều khoản sửa đổi.',
      },
      {
        heading: 'Điều 4. Dịch vụ cung cấp',
        body:
          'Thông qua Trang web, Phòng khám cung cấp thông tin về phòng khám và các liệu trình, bảng giá tham khảo, thông báo sự kiện, yêu cầu tư vấn trực tuyến và trò chuyện trực tuyến. Tư vấn trực tuyến và trò chuyện trực tuyến không phải là khám bệnh hay chẩn đoán y khoa. Việc một liệu trình có phù hợp hay không và kế hoạch điều trị cụ thể chỉ được quyết định sau khi tư vấn trực tiếp với bác sĩ. Kết quả điều trị khác nhau tùy theo từng người. Phòng khám có thể tạm ngừng một phần Dịch vụ khi cần thiết, chẳng hạn để bảo trì hệ thống hoặc thay thế thiết bị.',
      },
      {
        heading: 'Điều 5. Đặt lịch và yêu cầu tư vấn',
        body:
          'Khi gửi yêu cầu tư vấn, Người dùng phải cung cấp chính xác các thông tin cần thiết như họ tên và thông tin liên lạc, và tự chịu trách nhiệm về những bất lợi phát sinh do thông tin không chính xác. Phòng khám sẽ xác nhận yêu cầu đã nhận qua điện thoại hoặc ứng dụng nhắn tin, sau đó thông báo thời gian tư vấn. Việc gửi yêu cầu tư vấn không đồng nghĩa với việc lịch hẹn đã được xác nhận; lịch hẹn chỉ được xác nhận khi có sự xác nhận của Phòng khám. Nếu cần thay đổi hoặc hủy lịch hẹn, vui lòng thông báo trước cho Phòng khám.',
      },
      {
        heading: 'Điều 6. Nghĩa vụ của Người dùng',
        body:
          'Khi sử dụng Dịch vụ, Người dùng không được: cung cấp thông tin sai sự thật hoặc mạo danh người khác; truy cập trái phép vào Trang web hoặc máy chủ, hoặc cản trở hoạt động bình thường của chúng; sử dụng Dịch vụ cho mục đích bất hợp pháp hoặc không chính đáng; đăng tải hoặc tiết lộ thông tin cá nhân của người khác; có hành vi lăng mạ, đe dọa hoặc hành vi không phù hợp khác đối với nhân viên y tế, nhân viên phòng khám hoặc Người dùng khác. Người dùng vi phạm các quy định trên và gây thiệt hại cho Phòng khám hoặc bên thứ ba phải tự chịu trách nhiệm về thiệt hại đó.',
      },
      {
        heading: 'Điều 7. Bảo vệ thông tin cá nhân',
        body:
          'Phòng khám chỉ thu thập những thông tin cá nhân tối thiểu cần thiết để cung cấp Dịch vụ và xử lý an toàn theo Luật Bảo vệ thông tin cá nhân của Hàn Quốc cùng các quy định pháp luật liên quan. Các nội dung chi tiết như thông tin thu thập, mục đích sử dụng, thời hạn lưu giữ và quyền của Người dùng được quy định trong Chính sách bảo mật đăng trên Trang web.',
      },
      {
        heading: 'Điều 8. Quyền sở hữu trí tuệ và nội dung',
        body:
          'Bản quyền và các quyền sở hữu trí tuệ đối với toàn bộ nội dung trên Trang web, bao gồm văn bản, hình ảnh, video, ảnh trước và sau điều trị, thiết kế, thuộc về Phòng khám hoặc chủ sở hữu quyền hợp pháp. Người dùng không được sao chép, truyền tải, phân phối, chỉnh sửa hoặc sử dụng nội dung cho mục đích thương mại khi chưa có sự đồng ý trước bằng văn bản của Phòng khám. Các đánh giá của bệnh nhân được đăng tải với sự đồng ý của người viết, và Phòng khám có thể chỉnh sửa hoặc gỡ bỏ khi cần thiết.',
      },
      {
        heading: 'Điều 9. Miễn trừ và giới hạn trách nhiệm',
        body:
          'Thông tin về liệu trình và bảng giá tham khảo trên Trang web chỉ là tài liệu tham khảo chung, không thay thế cho việc khám, tư vấn và ý kiến chuyên môn của bác sĩ. Phòng khám không chịu trách nhiệm về việc gián đoạn hoặc chậm trễ Dịch vụ do sự cố mạng viễn thông, thiên tai, sự kiện bất khả kháng hoặc sự cố của các dịch vụ do bên thứ ba cung cấp như ứng dụng nhắn tin, bản đồ. Các liên kết đến trang web bên ngoài chỉ nhằm tạo thuận tiện cho Người dùng và không có nghĩa là Phòng khám bảo đảm hay xác nhận nội dung của các trang web đó.',
      },
      {
        heading: 'Điều 10. Luật áp dụng và giải quyết tranh chấp',
        body:
          'Điều khoản này được giải thích và áp dụng theo pháp luật Hàn Quốc. Khi phát sinh tranh chấp giữa Phòng khám và Người dùng liên quan đến việc sử dụng Dịch vụ, hai bên trước hết sẽ nỗ lực giải quyết thông qua thương lượng thiện chí; nếu không đạt được thỏa thuận, tranh chấp sẽ được giải quyết tại tòa án có thẩm quyền theo pháp luật Hàn Quốc (Tòa án Quận Trung tâm Seoul). Trường hợp bản dịch của Điều khoản này khác với bản tiếng Hàn, bản tiếng Hàn sẽ được ưu tiên áp dụng. Mọi thắc mắc về Điều khoản xin gửi về info@liv-clinic.net.',
      },
    ],
  },

  th: {
    title: 'ข้อกำหนดการใช้งาน',
    metaTitle: 'ข้อกำหนดการใช้งาน | ศัลยกรรมความงาม LIV Sinsa, Seoul',
    metaDescription:
      'ข้อกำหนดการใช้งานเว็บไซต์ศัลยกรรมความงาม LIV: เงื่อนไขการใช้งาน คำขอปรึกษา ข้อมูลส่วนบุคคล ทรัพย์สินทางปัญญา ความรับผิด และกฎหมายที่ใช้บังคับ',
    effectiveLabel: 'วันที่มีผลบังคับใช้',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      'ข้อกำหนดการใช้งานนี้ใช้กับทุกท่านที่ใช้เว็บไซต์ liv-clinic.net และบริการออนไลน์ซึ่งดำเนินการโดยศัลยกรรมความงาม LIV กรุณาอ่านเนื้อหาด้านล่างก่อนใช้งานเว็บไซต์',
    sections: [
      {
        heading: 'ข้อ 1 วัตถุประสงค์',
        body:
          'ข้อกำหนดนี้กำหนดเงื่อนไขและขั้นตอนการใช้เว็บไซต์ liv-clinic.net ซึ่งดำเนินการโดยศัลยกรรมความงาม LIV (ต่อไปนี้เรียกว่า "คลินิก") รวมถึงบริการออนไลน์ที่ให้บริการผ่านเว็บไซต์ เช่น แบบฟอร์มคำขอปรึกษา การแชต และข้อมูลกิจกรรม ตลอดจนกำหนดสิทธิ หน้าที่ และความรับผิดชอบระหว่างคลินิกกับผู้ใช้',
      },
      {
        heading: 'ข้อ 2 คำนิยาม',
        body:
          '"เว็บไซต์" หมายถึง เว็บไซต์ liv-clinic.net และหน้าย่อยทั้งหมดที่คลินิกดำเนินการ "ผู้ใช้" หมายถึง บุคคลใดก็ตามที่เข้าใช้เว็บไซต์และใช้บริการตามข้อกำหนดนี้ "บริการ" หมายถึง ข้อมูลหัตถการ คู่มือราคา ประกาศกิจกรรม การส่งคำขอปรึกษาออนไลน์ การแชต และฟังก์ชันอื่น ๆ ที่คลินิกให้บริการผ่านเว็บไซต์ "คำขอปรึกษา" หมายถึง การที่ผู้ใช้ส่งคำขอปรึกษาหรือขอนัดหมายไปยังคลินิกผ่านแบบฟอร์มหรือการแชตบนเว็บไซต์',
      },
      {
        heading: 'ข้อ 3 ผลบังคับใช้และการแก้ไขข้อกำหนด',
        body:
          'ข้อกำหนดนี้มีผลบังคับใช้เมื่อประกาศบนเว็บไซต์ คลินิกอาจแก้ไขข้อกำหนดนี้ได้ภายในขอบเขตที่กฎหมายที่เกี่ยวข้องอนุญาต โดยข้อกำหนดที่แก้ไขจะประกาศบนเว็บไซต์พร้อมวันที่มีผลบังคับใช้ ข้อกำหนดที่แก้ไขจะมีผลตั้งแต่วันที่ประกาศไว้ และหากผู้ใช้ยังคงใช้บริการต่อไปหลังจากวันดังกล่าว จะถือว่าผู้ใช้ยอมรับข้อกำหนดที่แก้ไขแล้ว',
      },
      {
        heading: 'ข้อ 4 บริการที่ให้',
        body:
          'คลินิกให้บริการผ่านเว็บไซต์ ได้แก่ ข้อมูลเกี่ยวกับคลินิกและหัตถการ คู่มือราคา ประกาศกิจกรรม การส่งคำขอปรึกษาออนไลน์ และการแชต การปรึกษาออนไลน์และการแชตไม่ใช่การตรวจหรือการวินิจฉัยทางการแพทย์ ความเหมาะสมของหัตถการและแผนการรักษาที่ชัดเจนจะกำหนดได้หลังจากปรึกษากับแพทย์ด้วยตนเองที่คลินิกเท่านั้น ผลลัพธ์ของการรักษาแตกต่างกันไปในแต่ละบุคคล คลินิกอาจระงับบริการบางส่วนชั่วคราวเมื่อจำเป็น เช่น เพื่อบำรุงรักษาระบบหรือเปลี่ยนอุปกรณ์',
      },
      {
        heading: 'ข้อ 5 การนัดหมายและคำขอปรึกษา',
        body:
          'เมื่อส่งคำขอปรึกษา ผู้ใช้ต้องกรอกข้อมูลที่จำเป็น เช่น ชื่อและช่องทางติดต่อ ให้ถูกต้อง และต้องรับผิดชอบต่อความเสียหายที่เกิดจากข้อมูลที่ไม่ถูกต้องเอง คลินิกจะยืนยันคำขอที่ได้รับทางโทรศัพท์หรือแอปพลิเคชันส่งข้อความ แล้วจึงแจ้งเวลานัดปรึกษา การส่งคำขอปรึกษาเพียงอย่างเดียวไม่ถือเป็นการนัดหมายที่ยืนยันแล้ว การนัดหมายจะสมบูรณ์เมื่อคลินิกยืนยันเท่านั้น หากต้องการเปลี่ยนแปลงหรือยกเลิกการนัดหมาย กรุณาแจ้งคลินิกล่วงหน้า',
      },
      {
        heading: 'ข้อ 6 หน้าที่ของผู้ใช้',
        body:
          'ในการใช้บริการ ผู้ใช้ต้องไม่กระทำการดังต่อไปนี้ กรอกข้อมูลเท็จหรือแอบอ้างเป็นบุคคลอื่น เข้าถึงเว็บไซต์หรือเซิร์ฟเวอร์โดยไม่ได้รับอนุญาต หรือรบกวนการทำงานตามปกติของระบบ ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมายหรือไม่เหมาะสม โพสต์หรือเปิดเผยข้อมูลส่วนบุคคลของผู้อื่น และใช้ถ้อยคำหยาบคาย ข่มขู่ หรือกระทำการไม่เหมาะสมต่อบุคลากรทางการแพทย์ พนักงาน หรือผู้ใช้รายอื่น หากผู้ใช้ฝ่าฝืนข้อกำหนดข้างต้นและก่อให้เกิดความเสียหายแก่คลินิกหรือบุคคลภายนอก ผู้ใช้ต้องรับผิดชอบต่อความเสียหายนั้น',
      },
      {
        heading: 'ข้อ 7 การคุ้มครองข้อมูลส่วนบุคคล',
        body:
          'คลินิกเก็บรวบรวมข้อมูลส่วนบุคคลเท่าที่จำเป็นต่อการให้บริการ และประมวลผลอย่างปลอดภัยตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคลของสาธารณรัฐเกาหลีและกฎหมายอื่นที่เกี่ยวข้อง รายละเอียดเกี่ยวกับข้อมูลที่เก็บรวบรวม วัตถุประสงค์การใช้ ระยะเวลาการเก็บรักษา และสิทธิของผู้ใช้ เป็นไปตามนโยบายความเป็นส่วนตัวที่ประกาศบนเว็บไซต์',
      },
      {
        heading: 'ข้อ 8 ทรัพย์สินทางปัญญาและเนื้อหา',
        body:
          'ลิขสิทธิ์และสิทธิในทรัพย์สินทางปัญญาในเนื้อหาทั้งหมดบนเว็บไซต์ รวมถึงข้อความ รูปภาพ วิดีโอ ภาพก่อนและหลังการรักษา และงานออกแบบ เป็นของคลินิกหรือผู้ทรงสิทธิที่ชอบด้วยกฎหมาย ผู้ใช้ไม่อาจทำซ้ำ ส่งต่อ เผยแพร่ ดัดแปลง หรือนำเนื้อหาไปใช้ในเชิงพาณิชย์โดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรล่วงหน้าจากคลินิก รีวิวของผู้รับบริการเผยแพร่โดยได้รับความยินยอมจากผู้เขียน และคลินิกอาจแก้ไขหรือลบรีวิวได้เมื่อจำเป็น',
      },
      {
        heading: 'ข้อ 9 ข้อยกเว้นและข้อจำกัดความรับผิด',
        body:
          'ข้อมูลหัตถการและคู่มือราคาบนเว็บไซต์เป็นข้อมูลทั่วไปเพื่อการอ้างอิงเท่านั้น ไม่สามารถใช้แทนการตรวจ การปรึกษา หรือคำแนะนำทางการแพทย์จากแพทย์ได้ คลินิกไม่รับผิดชอบต่อการหยุดชะงักหรือความล่าช้าของบริการที่เกิดจากความขัดข้องของเครือข่ายสื่อสาร ภัยธรรมชาติ เหตุสุดวิสัย หรือปัญหาของบริการที่ให้โดยบุคคลภายนอก เช่น แอปพลิเคชันส่งข้อความหรือบริการแผนที่ ลิงก์ไปยังเว็บไซต์ภายนอกมีไว้เพื่อความสะดวกของผู้ใช้เท่านั้น และไม่ได้หมายความว่าคลินิกรับรองเนื้อหาของเว็บไซต์เหล่านั้น',
      },
      {
        heading: 'ข้อ 10 กฎหมายที่ใช้บังคับและการระงับข้อพิพาท',
        body:
          'ข้อกำหนดนี้ตีความและบังคับใช้ตามกฎหมายของสาธารณรัฐเกาหลี หากเกิดข้อพิพาทระหว่างคลินิกกับผู้ใช้เกี่ยวกับการใช้บริการ ทั้งสองฝ่ายจะพยายามแก้ไขด้วยการปรึกษาหารือโดยสุจริตก่อน หากไม่สามารถตกลงกันได้ ข้อพิพาทจะได้รับการพิจารณาโดยศาลที่มีเขตอำนาจตามกฎหมายเกาหลี (ศาลแขวงกลางกรุงโซล) ในกรณีที่ฉบับแปลของข้อกำหนดนี้แตกต่างจากฉบับภาษาเกาหลี ให้ถือฉบับภาษาเกาหลีเป็นหลัก หากมีข้อสงสัยเกี่ยวกับข้อกำหนด กรุณาติดต่อ info@liv-clinic.net',
      },
    ],
  },

  ru: {
    title: 'Условия пользования',
    metaTitle: 'Условия пользования | Пластическая хирургия LIV Синса, Сеул',
    metaDescription:
      'Условия пользования сайтом Пластическая хирургия LIV: заявки на консультацию, персональные данные, авторские права, ответственность и применимое право.',
    effectiveLabel: 'Дата вступления в силу',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      'Настоящие Условия пользования распространяются на всех, кто использует сайт liv-clinic.net и онлайн-сервисы, которыми управляет клиника Пластическая хирургия LIV. Пожалуйста, ознакомьтесь с ними перед использованием сайта.',
    sections: [
      {
        heading: 'Статья 1. Цель',
        body:
          'Настоящие Условия определяют порядок и условия использования сайта liv-clinic.net, которым управляет клиника Пластическая хирургия LIV (далее — «Клиника»), а также онлайн-сервисов, предоставляемых через сайт: форм заявки на консультацию, чата и информации о мероприятиях. Условия также устанавливают права, обязанности и ответственность Клиники и пользователей.',
      },
      {
        heading: 'Статья 2. Определения',
        body:
          '«Сайт» — веб-сайт liv-clinic.net и все его страницы, которыми управляет Клиника. «Пользователь» — любое лицо, которое посещает Сайт и пользуется Сервисом в соответствии с настоящими Условиями. «Сервис» — информация о процедурах, ориентировочные цены, объявления о мероприятиях, онлайн-заявки на консультацию, чат и другие функции, которые Клиника предоставляет через Сайт. «Заявка на консультацию» — обращение Пользователя к Клинике через форму или чат на Сайте с просьбой о консультации или записи на приём.',
      },
      {
        heading: 'Статья 3. Действие и изменение Условий',
        body:
          'Настоящие Условия вступают в силу с момента их размещения на Сайте. Клиника вправе изменять Условия в пределах, допускаемых применимым законодательством; изменённые Условия публикуются на Сайте вместе с датой вступления в силу и применяются с этой даты. Если Пользователь продолжает пользоваться Сервисом после этой даты, считается, что он принял изменённые Условия.',
      },
      {
        heading: 'Статья 4. Предоставляемые услуги',
        body:
          'Через Сайт Клиника предоставляет информацию о клинике и процедурах, ориентировочные цены, объявления о мероприятиях, онлайн-заявки на консультацию и чат. Онлайн-консультация и чат не являются медицинским осмотром или постановкой диагноза. Подходит ли процедура и каким будет план лечения, определяется только после очной консультации с врачом. Результаты процедур у разных людей различаются. При необходимости, например для технического обслуживания системы или замены оборудования, Клиника может временно приостановить часть Сервиса.',
      },
      {
        heading: 'Статья 5. Запись и заявки на консультацию',
        body:
          'При подаче заявки на консультацию Пользователь обязан указать достоверные сведения, такие как имя и контактные данные, и несёт ответственность за неблагоприятные последствия, вызванные неточной информацией. Клиника подтверждает полученную заявку по телефону или через мессенджер и затем сообщает время консультации. Подача заявки сама по себе не означает подтверждённой записи; запись считается подтверждённой только после подтверждения Клиникой. Если вам необходимо изменить или отменить запись, пожалуйста, сообщите об этом Клинике заранее.',
      },
      {
        heading: 'Статья 6. Обязанности Пользователя',
        body:
          'При использовании Сервиса Пользователю запрещается: указывать ложные сведения или выдавать себя за другое лицо; получать несанкционированный доступ к Сайту или серверам либо нарушать их нормальную работу; использовать Сервис в незаконных или недобросовестных целях; публиковать или разглашать персональные данные других лиц; допускать оскорбления, угрозы и иное неподобающее поведение в отношении медицинского персонала, сотрудников или других Пользователей. Пользователь, нарушивший эти обязанности и причинивший ущерб Клинике или третьим лицам, несёт за это ответственность.',
      },
      {
        heading: 'Статья 7. Персональные данные',
        body:
          'Клиника собирает только те персональные данные, которые необходимы для предоставления Сервиса, и обрабатывает их безопасно в соответствии с Законом Республики Корея о защите персональной информации и иным применимым законодательством. Подробные сведения о собираемых данных, целях их использования, сроках хранения и правах Пользователей изложены в Политике конфиденциальности, размещённой на Сайте.',
      },
      {
        heading: 'Статья 8. Интеллектуальная собственность и контент',
        body:
          'Авторские и иные права интеллектуальной собственности на все материалы Сайта, включая тексты, изображения, видео, фотографии до и после процедур и дизайн, принадлежат Клинике или правообладателям. Пользователь не вправе копировать, передавать, распространять, редактировать или использовать эти материалы в коммерческих целях без предварительного письменного согласия Клиники. Отзывы пациентов публикуются с согласия их авторов; при необходимости Клиника может редактировать или удалять отзывы.',
      },
      {
        heading: 'Статья 9. Отказ от ответственности и её ограничение',
        body:
          'Информация о процедурах и ориентировочные цены на Сайте носят общий справочный характер и не заменяют профессиональную медицинскую консультацию, осмотр и рекомендации врача. Клиника не несёт ответственности за перебои или задержки в работе Сервиса, вызванные сбоями сетей связи, стихийными бедствиями, обстоятельствами непреодолимой силы или неполадками сервисов третьих лиц, таких как мессенджеры и картографические сервисы. Ссылки на внешние сайты приводятся исключительно для удобства и не означают, что Клиника одобряет их содержание.',
      },
      {
        heading: 'Статья 10. Применимое право и разрешение споров',
        body:
          'Настоящие Условия регулируются и толкуются в соответствии с законодательством Республики Корея. В случае спора между Клиникой и Пользователем в связи с использованием Сервиса стороны сначала стремятся урегулировать его путём добросовестных переговоров; если соглашение не достигнуто, спор передаётся в компетентный суд в соответствии с корейским законодательством — Центральный окружной суд Сеула. При расхождении между переводом настоящих Условий и их корейской версией преимущественную силу имеет корейская версия. Вопросы, связанные с Условиями, можно направлять по адресу info@liv-clinic.net.',
      },
    ],
  },

  fr: {
    title: 'Conditions d\'utilisation',
    metaTitle: 'Conditions d\'utilisation | LIV Chirurgie Esthétique Séoul',
    metaDescription:
      'Conditions d\'utilisation du site LIV Chirurgie Esthétique : consultations en ligne, données personnelles, droits d\'auteur, responsabilité et droit applicable.',
    effectiveLabel: 'Date d\'entrée en vigueur',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      'Les présentes Conditions d\'utilisation s\'appliquent à toute personne qui utilise le site liv-clinic.net et les services en ligne exploités par LIV Chirurgie Esthétique. Merci de les lire avant d\'utiliser le site.',
    sections: [
      {
        heading: 'Article 1 – Objet',
        body:
          'Les présentes Conditions définissent les modalités d\'utilisation du site liv-clinic.net exploité par LIV Chirurgie Esthétique (ci-après « la Clinique ») ainsi que des services en ligne proposés par son intermédiaire, notamment les formulaires de demande de consultation, la messagerie instantanée et les informations sur les événements. Elles précisent également les droits, les obligations et les responsabilités de la Clinique et des utilisateurs.',
      },
      {
        heading: 'Article 2 – Définitions',
        body:
          '« Site » désigne le site web liv-clinic.net et l\'ensemble de ses pages exploités par la Clinique. « Utilisateur » désigne toute personne qui accède au Site et utilise le Service conformément aux présentes Conditions. « Service » désigne les informations sur les soins, le guide des tarifs, les annonces d\'événements, les demandes de consultation en ligne, la messagerie instantanée et les autres fonctionnalités que la Clinique met à disposition sur le Site. « Demande de consultation » désigne la demande de consultation ou de rendez-vous qu\'un Utilisateur adresse à la Clinique au moyen d\'un formulaire ou de la messagerie du Site.',
      },
      {
        heading: 'Article 3 – Entrée en vigueur et modification des Conditions',
        body:
          'Les présentes Conditions entrent en vigueur dès leur publication sur le Site. La Clinique peut les modifier dans les limites autorisées par la législation applicable ; les Conditions modifiées sont publiées sur le Site avec leur date d\'entrée en vigueur et s\'appliquent à compter de cette date. L\'Utilisateur qui continue d\'utiliser le Service après cette date est réputé avoir accepté les Conditions modifiées.',
      },
      {
        heading: 'Article 4 – Services proposés',
        body:
          'Par l\'intermédiaire du Site, la Clinique met à disposition des informations sur la clinique et ses soins, un guide des tarifs, des annonces d\'événements, un formulaire de demande de consultation en ligne et une messagerie instantanée. La consultation en ligne et la messagerie ne constituent ni un examen médical ni un diagnostic. La pertinence d\'un soin et le plan de traitement ne sont déterminés qu\'après une consultation en personne avec un médecin. Les résultats des soins varient d\'une personne à l\'autre. La Clinique peut suspendre temporairement une partie du Service lorsque cela est nécessaire, par exemple pour la maintenance du système ou le remplacement d\'équipements.',
      },
      {
        heading: 'Article 5 – Rendez-vous et demandes de consultation',
        body:
          'Lorsqu\'il envoie une demande de consultation, l\'Utilisateur doit fournir des informations exactes, telles que son nom et ses coordonnées, et assume les conséquences d\'informations inexactes. La Clinique confirme les demandes reçues par téléphone ou par messagerie, puis propose un horaire de consultation. L\'envoi d\'une demande ne vaut pas rendez-vous confirmé : le rendez-vous n\'est confirmé qu\'après confirmation par la Clinique. Pour modifier ou annuler un rendez-vous, merci d\'en informer la Clinique à l\'avance.',
      },
      {
        heading: 'Article 6 – Obligations de l\'Utilisateur',
        body:
          'Dans le cadre de l\'utilisation du Service, l\'Utilisateur s\'interdit de : fournir de fausses informations ou usurper l\'identité d\'un tiers ; accéder sans autorisation au Site ou à ses serveurs, ou en perturber le fonctionnement normal ; utiliser le Service à des fins illicites ou abusives ; publier ou divulguer les données personnelles d\'autrui ; adopter un comportement injurieux, menaçant ou autrement inapproprié envers le personnel médical, les employés ou les autres Utilisateurs. L\'Utilisateur qui manque à ces obligations et cause un préjudice à la Clinique ou à un tiers en est responsable.',
      },
      {
        heading: 'Article 7 – Données personnelles',
        body:
          'La Clinique ne collecte que les données personnelles nécessaires à la fourniture du Service et les traite de manière sécurisée conformément à la loi coréenne sur la protection des informations personnelles et aux autres textes applicables. Les données collectées, les finalités du traitement, la durée de conservation et les droits des Utilisateurs sont détaillés dans la Politique de confidentialité publiée sur le Site.',
      },
      {
        heading: 'Article 8 – Propriété intellectuelle et contenus',
        body:
          'L\'ensemble des contenus du Site, notamment les textes, images, vidéos, photographies avant/après et éléments graphiques, est protégé par le droit d\'auteur et les autres droits de propriété intellectuelle appartenant à la Clinique ou à ses concédants. L\'Utilisateur ne peut reproduire, transmettre, diffuser, modifier ou exploiter commercialement ces contenus sans l\'accord écrit préalable de la Clinique. Les avis de patients sont publiés avec le consentement de leurs auteurs ; la Clinique peut les modifier ou les retirer si nécessaire.',
      },
      {
        heading: 'Article 9 – Exclusion et limitation de responsabilité',
        body:
          'Les informations sur les soins et le guide des tarifs figurant sur le Site sont fournis à titre indicatif et ne remplacent ni un avis médical professionnel, ni un examen, ni une consultation avec un médecin. La Clinique décline toute responsabilité en cas d\'interruption ou de retard du Service dus à une panne de réseau, à une catastrophe naturelle, à un cas de force majeure ou à un dysfonctionnement de services fournis par des tiers, tels que les messageries ou les services de cartographie. Les liens vers des sites externes sont proposés pour la commodité de l\'Utilisateur et n\'impliquent aucune approbation de leur contenu par la Clinique.',
      },
      {
        heading: 'Article 10 – Droit applicable et règlement des litiges',
        body:
          'Les présentes Conditions sont régies et interprétées conformément au droit de la République de Corée. En cas de litige entre la Clinique et un Utilisateur au sujet du Service, les parties s\'efforcent d\'abord de le résoudre à l\'amiable et de bonne foi ; à défaut d\'accord, le litige est porté devant le tribunal compétent en vertu du droit coréen, à savoir le Tribunal du district central de Séoul. En cas de divergence entre une traduction des présentes Conditions et leur version coréenne, la version coréenne prévaut. Toute question relative aux Conditions peut être adressée à info@liv-clinic.net.',
      },
    ],
  },

  mn: {
    title: 'Үйлчилгээний нөхцөл',
    metaTitle: 'Үйлчилгээний нөхцөл | LIV Гоо Заслын Эмнэлэг Синса, Сөүл',
    metaDescription:
      'LIV Гоо Заслын Эмнэлэг (liv-clinic.net) вэбсайтын үйлчилгээний нөхцөл: зөвлөгөөний хүсэлт, хувийн мэдээлэл, оюуны өмч, хариуцлага болон хэрэглэх хууль.',
    effectiveLabel: 'Хүчин төгөлдөр болох огноо',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      'Энэхүү үйлчилгээний нөхцөл нь LIV Гоо Заслын Эмнэлэг ажиллуулдаг liv-clinic.net вэбсайт болон онлайн үйлчилгээг ашиглаж буй бүх хүнд хамаарна. Сайтыг ашиглахын өмнө доорх агуулгатай танилцана уу.',
    sections: [
      {
        heading: '1 дүгээр зүйл. Зорилго',
        body:
          'Энэхүү нөхцөл нь LIV Гоо Заслын Эмнэлэг (цаашид «Эмнэлэг» гэх) ажиллуулдаг liv-clinic.net вэбсайт болон түүгээр дамжуулан үзүүлж буй онлайн үйлчилгээг (зөвлөгөөний хүсэлтийн маягт, чат зөвлөгөө, арга хэмжээний мэдээлэл гэх мэт) ашиглах нөхцөл, журам, түүнчлэн Хэрэглэгч болон Эмнэлгийн эрх, үүрэг, хариуцлагыг тогтооход оршино.',
      },
      {
        heading: '2 дугаар зүйл. Нэр томьёоны тодорхойлолт',
        body:
          '«Сайт» гэж Эмнэлгийн ажиллуулдаг liv-clinic.net вэбсайт болон түүний бүх дэд хуудсыг хэлнэ. «Хэрэглэгч» гэж Сайтад нэвтэрч, энэхүү нөхцөлийн дагуу үйлчилгээг ашиглаж буй аливаа хүнийг хэлнэ. «Үйлчилгээ» гэж Эмнэлгээс Сайтаар дамжуулан үзүүлж буй эмчилгээний мэдээлэл, үнийн лавлагаа, арга хэмжээний зар, онлайн зөвлөгөөний хүсэлт, чат зөвлөгөө зэрэг үйлчилгээг хэлнэ. «Зөвлөгөөний хүсэлт» гэж Хэрэглэгч Сайтын маягт эсвэл чатаар дамжуулан Эмнэлэгт зөвлөгөө авах буюу цаг захиалах хүсэлт илгээхийг хэлнэ.',
      },
      {
        heading: '3 дугаар зүйл. Нөхцөлийн хүчин төгөлдөр байдал, өөрчлөлт',
        body:
          'Энэхүү нөхцөл нь Сайтад нийтэлснээр хүчин төгөлдөр болно. Эмнэлэг холбогдох хууль тогтоомжид харшлахгүй хүрээнд энэхүү нөхцөлийг өөрчилж болох бөгөөд өөрчилсөн нөхцөлийг хүчин төгөлдөр болох огнооны хамт Сайтад нийтэлнэ. Өөрчилсөн нөхцөл нь нийтэлсэн хүчин төгөлдөр болох огнооноос эхлэн үйлчилнэ. Хэрэглэгч уг огнооны дараа үйлчилгээг үргэлжлүүлэн ашиглавал өөрчилсөн нөхцөлийг хүлээн зөвшөөрсөнд тооцно.',
      },
      {
        heading: '4 дүгээр зүйл. Үзүүлэх үйлчилгээ',
        body:
          'Эмнэлэг нь Сайтаар дамжуулан эмнэлэг болон эмчилгээний танилцуулга, үнийн лавлагаа, арга хэмжээний зар, онлайн зөвлөгөөний хүсэлт, чат зөвлөгөө зэрэг үйлчилгээг үзүүлнэ. Онлайн зөвлөгөө болон чат зөвлөгөө нь эмнэлгийн үзлэг, онош биш бөгөөд эмчилгээ тохирох эсэх, эмчилгээний тодорхой төлөвлөгөөг зөвхөн эмчтэй биечлэн зөвлөлдсөний дараа шийднэ. Эмчилгээний үр дүн хүн бүрд харилцан адилгүй байна. Эмнэлэг системийн засвар үйлчилгээ, тоног төхөөрөмж солих зэрэг шаардлагатай тохиолдолд үйлчилгээний зарим хэсгийг түр зогсоож болно.',
      },
      {
        heading: '5 дугаар зүйл. Цаг захиалга, зөвлөгөөний хүсэлт',
        body:
          'Хэрэглэгч зөвлөгөөний хүсэлт илгээхдээ нэр, холбоо барих мэдээлэл зэрэг шаардлагатай мэдээллийг үнэн зөв оруулах бөгөөд буруу мэдээллээс үүдэх хохирлыг Хэрэглэгч өөрөө хариуцна. Эмнэлэг хүлээн авсан хүсэлтийг утас эсвэл мессенжерээр баталгаажуулсны дараа зөвлөгөөний цагийг мэдэгдэнэ. Хүсэлт илгээснээр цаг захиалга баталгаажихгүй бөгөөд Эмнэлэг баталгаажуулснаар захиалга баталгаажна. Цаг захиалгаа өөрчлөх эсвэл цуцлах бол Эмнэлэгт урьдчилан мэдэгдэнэ үү.',
      },
      {
        heading: '6 дугаар зүйл. Хэрэглэгчийн үүрэг',
        body:
          'Хэрэглэгч үйлчилгээг ашиглахдаа дараах үйлдлийг хийхийг хориглоно: худал мэдээлэл оруулах эсвэл бусдын нэрийг хууль бусаар ашиглах; Сайт болон серверт зөвшөөрөлгүй нэвтрэх эсвэл хэвийн үйл ажиллагаанд саад учруулах; үйлчилгээг хууль бус эсвэл зохисгүй зорилгоор ашиглах; бусдын хувийн мэдээллийг нийтлэх эсвэл задруулах; эмч, ажилтан болон бусад Хэрэглэгчид доромжлол, заналхийлэл зэрэг зохисгүй үйлдэл хийх. Хэрэглэгч эдгээрийг зөрчиж Эмнэлэг эсвэл гуравдагч этгээдэд хохирол учруулсан бол Хэрэглэгч хариуцлага хүлээнэ.',
      },
      {
        heading: '7 дугаар зүйл. Хувийн мэдээллийн хамгаалалт',
        body:
          'Эмнэлэг үйлчилгээ үзүүлэхэд шаардлагатай хамгийн бага хэмжээний хувийн мэдээллийг цуглуулж, БНСУ-ын Хувийн мэдээлэл хамгаалах тухай хууль болон холбогдох бусад хууль тогтоомжийн дагуу аюулгүй боловсруулна. Цуглуулах мэдээлэл, ашиглах зорилго, хадгалах хугацаа, Хэрэглэгчийн эрх зэрэг дэлгэрэнгүй мэдээллийг Сайтад нийтэлсэн Нууцлалын бодлогод заасан болно.',
      },
      {
        heading: '8 дугаар зүйл. Оюуны өмч, агуулга',
        body:
          'Сайтад нийтэлсэн текст, зураг, видео, эмчилгээний өмнөх ба дараах зураг, дизайн зэрэг бүх агуулгын зохиогчийн эрх болон оюуны өмчийн эрх нь Эмнэлэг эсвэл хууль ёсны эрх эзэмшигчид хамаарна. Хэрэглэгч Эмнэлгийн бичгээр өгсөн урьдчилсан зөвшөөрөлгүйгээр агуулгыг хуулбарлах, дамжуулах, түгээх, засварлах эсвэл арилжааны зорилгоор ашиглахыг хориглоно. Сайтад нийтэлсэн үйлчлүүлэгчийн сэтгэгдлийг зохиогчийн зөвшөөрлөөр нийтэлдэг бөгөөд Эмнэлэг шаардлагатай тохиолдолд засах эсвэл устгаж болно.',
      },
      {
        heading: '9 дүгээр зүйл. Хариуцлагаас чөлөөлөх, хариуцлагын хязгаар',
        body:
          'Сайтад нийтэлсэн эмчилгээний мэдээлэл болон үнийн лавлагаа нь ерөнхий лавлах мэдээлэл бөгөөд эмчийн мэргэжлийн үзлэг, зөвлөгөөг орлохгүй. Харилцаа холбооны сүлжээний саатал, байгалийн гамшиг, давагдашгүй хүчин зүйл, эсвэл мессенжер, газрын зураг зэрэг гуравдагч этгээдийн үйлчилгээний доголдлоос үүдсэн үйлчилгээний тасалдал, саатлыг Эмнэлэг хариуцахгүй. Сайтад байрлуулсан гадны сайтын холбоос нь Хэрэглэгчийн тав тухыг хангах зорилготой бөгөөд Эмнэлэг тухайн сайтын агуулгыг баталгаажуулахгүй.',
      },
      {
        heading: '10 дугаар зүйл. Хэрэглэх хууль, маргаан шийдвэрлэх',
        body:
          'Энэхүү нөхцөлийг Бүгд Найрамдах Солонгос Улсын хуулийн дагуу тайлбарлаж, хэрэглэнэ. Үйлчилгээ ашиглахтай холбогдуулан Эмнэлэг болон Хэрэглэгчийн хооронд маргаан гарвал талууд эхлээд шударгаар харилцан зөвшилцөж шийдвэрлэхийг эрмэлзэх бөгөөд зөвшилцөлд хүрээгүй тохиолдолд Солонгос Улсын хуулийн дагуу харьяалах шүүх (Сөүлийн Төв Дүүргийн Шүүх)-ээр шийдвэрлүүлнэ. Энэхүү нөхцөлийн орчуулга болон солонгос хэл дээрх хувилбарын агуулга зөрвөл солонгос хэл дээрх хувилбарыг баримтална. Нөхцөлтэй холбоотой асуултыг info@liv-clinic.net хаягаар илгээнэ үү.',
      },
    ],
  },

  ar: {
    title: 'شروط الاستخدام',
    metaTitle: 'شروط الاستخدام | مستشفى ليف للتجميل سينسا، سيول',
    metaDescription:
      'شروط استخدام موقع مستشفى ليف للتجميل: استخدام الموقع، طلبات الاستشارة، البيانات الشخصية، الملكية الفكرية، حدود المسؤولية والقانون الواجب التطبيق.',
    effectiveLabel: 'تاريخ السريان',
    effectiveDate: TERMS_EFFECTIVE_DATE,
    intro:
      'تسري شروط الاستخدام هذه على كل من يستخدم الموقع الإلكتروني liv-clinic.net والخدمات الإلكترونية التي يديرها مستشفى ليف للتجميل. يرجى قراءة ما يلي قبل استخدام الموقع.',
    sections: [
      {
        heading: 'المادة 1 – الغرض',
        body:
          'تحدد هذه الشروط أحكام وإجراءات استخدام الموقع الإلكتروني liv-clinic.net الذي يديره مستشفى ليف للتجميل (ويشار إليه فيما يلي بـ«المستشفى»)، والخدمات الإلكترونية المقدمة من خلاله، بما في ذلك نماذج طلب الاستشارة والمحادثة الفورية ومعلومات الفعاليات. كما تبين حقوق المستشفى والمستخدمين والتزاماتهم ومسؤولياتهم.',
      },
      {
        heading: 'المادة 2 – التعريفات',
        body:
          'يقصد بـ«الموقع» الموقع الإلكتروني liv-clinic.net وجميع صفحاته التي يديرها المستشفى. ويقصد بـ«المستخدم» كل شخص يدخل إلى الموقع ويستخدم الخدمة وفقاً لهذه الشروط. ويقصد بـ«الخدمة» معلومات الإجراءات التجميلية ودليل الأسعار وإعلانات الفعاليات وطلبات الاستشارة الإلكترونية والمحادثة الفورية وغيرها من الوظائف التي يقدمها المستشفى عبر الموقع. ويقصد بـ«طلب الاستشارة» الطلب الذي يرسله المستخدم إلى المستشفى عبر نموذج أو محادثة على الموقع للحصول على استشارة أو حجز موعد.',
      },
      {
        heading: 'المادة 3 – سريان الشروط وتعديلها',
        body:
          'تسري هذه الشروط اعتباراً من نشرها على الموقع. ويجوز للمستشفى تعديلها في الحدود التي تسمح بها القوانين المعمول بها، وتُنشر الشروط المعدلة على الموقع مع تاريخ سريانها وتطبق اعتباراً من ذلك التاريخ. ويعد استمرار المستخدم في استخدام الخدمة بعد ذلك التاريخ قبولاً منه للشروط المعدلة.',
      },
      {
        heading: 'المادة 4 – الخدمات المقدمة',
        body:
          'يقدم المستشفى عبر الموقع معلومات عن المستشفى وإجراءاته التجميلية ودليل الأسعار وإعلانات الفعاليات وطلبات الاستشارة الإلكترونية والمحادثة الفورية. ولا تعد الاستشارة الإلكترونية أو المحادثة الفورية فحصاً طبياً أو تشخيصاً، ولا يتقرر مدى ملاءمة الإجراء وخطة العلاج إلا بعد استشارة حضورية مع الطبيب. وتختلف نتائج العلاج من شخص إلى آخر. ويجوز للمستشفى تعليق جزء من الخدمة مؤقتاً عند الضرورة، كأعمال صيانة النظام أو استبدال المعدات.',
      },
      {
        heading: 'المادة 5 – الحجز وطلبات الاستشارة',
        body:
          'يلتزم المستخدم عند إرسال طلب الاستشارة بتقديم معلومات صحيحة كالاسم وبيانات الاتصال، ويتحمل ما قد ينشأ عن المعلومات غير الصحيحة من ضرر. ويؤكد المستشفى الطلبات الواردة عبر الهاتف أو تطبيقات المراسلة ثم يبلغ المستخدم بموعد الاستشارة. ولا يعد إرسال الطلب وحده حجزاً مؤكداً، إذ لا يتأكد الحجز إلا بتأكيد المستشفى له. وفي حال الرغبة في تغيير الموعد أو إلغائه، يرجى إبلاغ المستشفى مسبقاً.',
      },
      {
        heading: 'المادة 6 – التزامات المستخدم',
        body:
          'يحظر على المستخدم عند استخدام الخدمة ما يلي: إدخال معلومات كاذبة أو انتحال شخصية الغير؛ الدخول إلى الموقع أو خوادمه دون تصريح أو إعاقة تشغيلهما الطبيعي؛ استخدام الخدمة لأغراض غير مشروعة أو غير لائقة؛ نشر البيانات الشخصية للآخرين أو إفشاؤها؛ الإساءة أو التهديد أو أي سلوك غير لائق تجاه الطاقم الطبي أو الموظفين أو المستخدمين الآخرين. ويتحمل المستخدم الذي يخالف هذه الالتزامات ويلحق ضرراً بالمستشفى أو بالغير المسؤولية عن ذلك الضرر.',
      },
      {
        heading: 'المادة 7 – حماية البيانات الشخصية',
        body:
          'يجمع المستشفى الحد الأدنى من البيانات الشخصية اللازمة لتقديم الخدمة، ويعالجها بشكل آمن وفقاً لقانون حماية المعلومات الشخصية في جمهورية كوريا والقوانين الأخرى ذات الصلة. وترد تفاصيل البيانات التي تُجمع وأغراض استخدامها ومدة الاحتفاظ بها وحقوق المستخدمين في سياسة الخصوصية المنشورة على الموقع.',
      },
      {
        heading: 'المادة 8 – الملكية الفكرية والمحتوى',
        body:
          'تعود حقوق النشر وحقوق الملكية الفكرية لجميع محتويات الموقع، بما فيها النصوص والصور ومقاطع الفيديو وصور ما قبل العلاج وبعده والتصميم، إلى المستشفى أو إلى أصحاب الحقوق المشروعين. ولا يجوز للمستخدم نسخ هذا المحتوى أو نقله أو توزيعه أو تعديله أو استخدامه لأغراض تجارية دون موافقة خطية مسبقة من المستشفى. وتُنشر آراء المرضى بموافقة أصحابها، ويجوز للمستشفى تعديلها أو حذفها عند الضرورة.',
      },
      {
        heading: 'المادة 9 – إخلاء المسؤولية وحدودها',
        body:
          'تعد معلومات الإجراءات التجميلية ودليل الأسعار المنشورة على الموقع مواد مرجعية عامة ولا تغني عن الاستشارة الطبية المتخصصة أو الفحص أو المشورة من الطبيب. ولا يتحمل المستشفى المسؤولية عن انقطاع الخدمة أو تأخرها بسبب أعطال شبكات الاتصال أو الكوارث الطبيعية أو القوة القاهرة أو أعطال الخدمات التي تقدمها أطراف ثالثة كتطبيقات المراسلة وخدمات الخرائط. وتُدرج روابط المواقع الخارجية لتسهيل الاستخدام فقط ولا تعني تأييد المستشفى لمحتواها.',
      },
      {
        heading: 'المادة 10 – القانون الواجب التطبيق وتسوية النزاعات',
        body:
          'تخضع هذه الشروط لقوانين جمهورية كوريا وتفسر وفقاً لها. وفي حال نشوء نزاع بين المستشفى والمستخدم بشأن استخدام الخدمة، يسعى الطرفان أولاً إلى تسويته بالتشاور بحسن نية، فإن تعذر الاتفاق يُعرض النزاع على المحكمة المختصة وفقاً للقانون الكوري، وهي محكمة سيول المركزية. وفي حال وجود اختلاف بين ترجمة هذه الشروط ونسختها الكورية، تسود النسخة الكورية. وتوجه الاستفسارات المتعلقة بهذه الشروط إلى info@liv-clinic.net.',
      },
    ],
  },
};

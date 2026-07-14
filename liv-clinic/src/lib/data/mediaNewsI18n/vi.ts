/**
 * Vietnamese overrides for Media & News (base: src/lib/data/mediaNewsData.ts).
 *
 * Outlet names keep each publication's own Latin rendering so the source stays
 * identifiable (Hi News · Medical Aesthetic · Issuemaker · Hemophilia Life ·
 * Medical Today · SBS Good Morning). Korean personal names use their Latin
 * romanisation. Unlike en.ts, `badge` must be overridden here because the base
 * badges are Latin/Korean-facing labels.
 */
import type { MediaNewsLocaleMap } from './types';

export const VI: MediaNewsLocaleMap = {
  // ── mediaNewsData ──
  '17': {
    badge: 'HỌC THUẬT',
    source: 'Tin LIV',
    title:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa — diễn giả khách mời tại AXA (Aptos Expert Alliance), hội nghị chuyên gia nâng cơ toàn cầu',
    description:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa của Phòng khám Phẫu thuật Thẩm mỹ LIV, đã được mời tham dự AXA (Aptos Expert Alliance) — hội nghị chuyên gia do APTOS, thương hiệu căng chỉ toàn cầu, tổ chức — và hoàn thành tốt đẹp phần trình bày.',
    body: [
      'Xin chào, đây là Phòng khám Phẫu thuật Thẩm mỹ LIV.',
      'Ngày 20 tháng 6 năm 2026, Bác sĩ Kim Sooyoung, Giám đốc Y khoa của Phòng khám Phẫu thuật Thẩm mỹ LIV, đã được mời tham dự AXA (Aptos Expert Alliance) — hội nghị chuyên gia do APTOS, thương hiệu căng chỉ toàn cầu, tổ chức — và hoàn thành tốt đẹp phần trình bày.',
      'AXA (Aptos Expert Alliance) là diễn đàn học thuật quốc tế, nơi các chuyên gia và bác sĩ master của APTOS từ nhiều quốc gia chia sẻ kinh nghiệm lâm sàng mới nhất cùng bí quyết thực hiện thủ thuật; đây cũng là sự kiện học thuật uy tín để trao đổi các kiến thức cập nhật và những ca lâm sàng đa dạng trong lĩnh vực nâng cơ toàn cầu.',
      'Bác sĩ Kim Sooyoung sở hữu chứng nhận APTOS International Trainer. Trong phần trình bày lần này, bác sĩ đã chia sẻ nhiều ca lâm sàng cùng kinh nghiệm căng chỉ của Phòng khám Phẫu thuật Thẩm mỹ LIV và có buổi trao đổi học thuật ý nghĩa với các bác sĩ tham dự.',
      'Phòng khám Phẫu thuật Thẩm mỹ LIV sẽ tiếp tục duy trì hoạt động trao đổi học thuật với đội ngũ y tế trong và ngoài nước, dựa trên nghiên cứu không ngừng cùng kinh nghiệm lâm sàng để nỗ lực mang đến dịch vụ y tế chống lão hóa cao cấp an toàn hơn và tinh tế hơn.',
      'Xin cảm ơn.',
    ],
  },
  '16': {
    badge: 'PHỎNG VẤN BÁO CHÍ',
    source: 'Medical Aesthetic',
    title: 'Bác sĩ Kim Sooyoung, Giám đốc Y khoa — phỏng vấn lâm sàng về APTOS Bio-Lifting',
    description:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa của Phòng khám Phẫu thuật Thẩm mỹ LIV, đã tham gia bài phỏng vấn về APTOS Bio-Lifting trên tạp chí chuyên ngành thẩm mỹ y khoa “Medical Aesthetic”. Bài báo tìm hiểu cách các bác sĩ Hàn Quốc được chứng nhận là giảng viên chính thức của APTOS ứng dụng APTOS trong thực tế lâm sàng. Bác sĩ Kim Sooyoung đã chia sẻ về thiết kế nâng cơ chính xác có tính đến cấu trúc gương mặt và tình trạng mô, sự thay đổi tự nhiên, cùng tầm quan trọng của cách tiếp cận Bio-Lifting được cá nhân hóa cho từng bệnh nhân.',
    body: [
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa của Phòng khám Phẫu thuật Thẩm mỹ LIV, đã tham gia bài báo “APTOS Bio-Lifting đang được ứng dụng như thế nào trong thực tế lâm sàng tại Hàn Quốc” trên tạp chí chuyên ngành thẩm mỹ y khoa “Medical Aesthetic”.',
      'Bài báo đề cập tới xu hướng APTOS, thương hiệu căng chỉ toàn cầu, đang mở rộng hoạt động học thuật tại thị trường Hàn Quốc với trọng tâm là các giảng viên chính thức, đồng thời giới thiệu APTOS không đơn thuần là sản phẩm căng chỉ kéo phần mô chảy xệ, mà là một nền tảng thủ thuật Bio-Lifting đòi hỏi vector design tinh tế tùy theo cấu trúc gương mặt và tình trạng mô.',
      'Với vai trò giảng viên chính thức của APTOS, bác sĩ Kim Sooyoung nhấn mạnh cấu trúc và chỉ định của từng sản phẩm, thiết kế theo tình trạng mô, cũng như tầm quan trọng của plane thực hiện và fixation point. Đặc biệt, APTOS Bio-Lifting vượt ra ngoài việc nâng đỡ cơ học đơn thuần: đây là cách tiếp cận thiết kế nâng đỡ mô và hướng nâng cho những vùng cần thiết, có tính đến kiểu lão hóa và cấu trúc gương mặt của từng bệnh nhân — điểm gặp gỡ với triết lý Slow Aging của Phòng khám Phẫu thuật Thẩm mỹ LIV.',
      'Phòng khám Phẫu thuật Thẩm mỹ LIV hướng tới sự cải thiện tự nhiên và tinh tế thay vì thay đổi quá mức. Trong bài phỏng vấn, bác sĩ Kim Sooyoung giải thích rằng gần đây bệnh nhân tại Hàn Quốc coi trọng đường nét gương mặt gọn gàng, sự cải thiện ổn định ở vùng giữa mặt và vùng dưới mặt cùng quá trình hồi phục tự nhiên, hơn là chỉnh sửa quá mức hay kết quả thiếu tự nhiên. Điều này trùng khớp với định hướng chống lão hóa tiết chế, nâng cơ chính xác và điều trị cá nhân hóa mà Phòng khám Phẫu thuật Thẩm mỹ LIV theo đuổi.',
      'Ngoài ra, APTOS còn được giới thiệu như một thủ thuật có thể thực hiện đơn lẻ hoặc kết hợp với thiết bị năng lượng, skin booster, chất làm đầy, botulinum toxin tùy theo tình trạng của bệnh nhân như độ đàn hồi da, sụt giảm thể tích hay thay đổi đường nét gương mặt. Phòng khám Phẫu thuật Thẩm mỹ LIV tiếp tục theo đuổi cách tiếp cận chống lão hóa tổng thể, lấy nâng đỡ cấu trúc gương mặt và vector correction làm trọng tâm, đồng thời cân nhắc kết cấu da, thể tích và điều chỉnh cơ biểu cảm.',
      'Bài phỏng vấn lần này cho thấy bác sĩ Kim Sooyoung, với vai trò giảng viên chính thức của APTOS, đang không ngừng mở rộng đào tạo học thuật và kinh nghiệm lâm sàng để mang đến cho bệnh nhân trong và ngoài nước những thủ thuật nâng cơ an toàn hơn và có tính tái lập cao hơn.',
    ],
  },
  '15': {
    badge: 'PHỎNG VẤN BÁO CHÍ',
    source: 'Medical Aesthetic',
    title: 'Bác sĩ Kim Sooyoung, Giám đốc Y khoa — phỏng vấn cùng “Medical Aesthetic”',
    description:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa, đã có buổi phỏng vấn chính thức với “Medical Aesthetic”, tạp chí chuyên về phẫu thuật thẩm mỹ và thiết bị y tế, chia sẻ kiến thức y khoa về triết lý Slow Aging của LIV, thủ thuật với thương hiệu nâng cơ toàn cầu APTOS và thuật toán tùy chỉnh theo từng vùng.',
    body: [
      'Xin chào, đây là Phòng khám Phẫu thuật Thẩm mỹ LIV.',
      'Gần đây, Bác sĩ Kim Sooyoung, Giám đốc Y khoa của Phòng khám Phẫu thuật Thẩm mỹ LIV, đã có buổi phỏng vấn chính thức và chụp hình cùng “Medical Aesthetic”, cơ quan báo chí có uy tín trong lĩnh vực phẫu thuật thẩm mỹ và thiết bị y tế.',
      'Trong buổi phỏng vấn hướng sự chú ý tới những bác sĩ dẫn dắt xu hướng của thị trường phẫu thuật thẩm mỹ trong và ngoài nước, bác sĩ Kim Sooyoung đã giới thiệu triết lý “Slow Aging” mà Phòng khám Phẫu thuật Thẩm mỹ LIV theo đuổi, đồng thời chia sẻ kiến thức y khoa chuyên sâu về thủ thuật với APTOS — thương hiệu nâng cơ toàn cầu đang được ngành thẩm mỹ y khoa quan tâm nhiều nhất hiện nay.',
      'Đặc biệt, với chứng nhận giảng viên chính thức của APTOS (International Trainer), bác sĩ Kim đã giải thích sâu về hiệu quả cộng hưởng khi công nghệ riêng biệt của APTOS gặp gỡ cách tiếp cận theo từng lớp giải phẫu của Phòng khám Phẫu thuật Thẩm mỹ LIV — “Site-specific algorithm (thuật toán tùy chỉnh theo từng vùng)”. Bí quyết căng chỉ khó thực hiện của riêng LIV — không kéo căng một cách gượng ép mà tái sắp xếp phần mô chảy xệ một cách chính xác về mặt giải phẫu để làm nổi bật nét ba chiều và vẻ thanh lịch vốn có của gương mặt — đã tạo được sự quan tâm và thán phục lớn từ đội ngũ phóng viên tại hiện trường.',
      'Phòng khám Phẫu thuật Thẩm mỹ LIV là nơi được các thương hiệu toàn cầu và chuyên gia thẩm mỹ y khoa tin tưởng và chú ý. Trên nền tảng kỹ thuật tinh tế được công nhận ở tầm quốc tế cùng hoạt động nghiên cứu học thuật không ngừng, LIV sẽ tiếp tục đặt ra tiêu chuẩn an toàn và khác biệt cho chăm sóc chống lão hóa cao cấp dành cho tất cả những ai tìm đến LIV, từ Hàn Quốc và các quốc gia khác.',
      'Toàn văn chi tiết của bài phỏng vấn sẽ được chia sẻ lại khi bài báo chính thức được đăng tải.',
      'Xin cảm ơn.',
    ],
  },
  '1': {
    badge: 'GIẢNG VIÊN TOÀN CẦU',
    source: 'Hi News',
    title: 'Chứng nhận giảng viên chính thức của APTOS',
    description:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa của Phòng khám Phẫu thuật Thẩm mỹ LIV, đã đạt chứng nhận International Trainer của APTOS, thương hiệu căng chỉ toàn cầu — sự ghi nhận chuyên môn trong thủ thuật nâng cơ dựa trên kinh nghiệm lâm sàng và độ thuần thục khi thực hiện.',
  },
  '2': {
    badge: 'TRUYỀN HÌNH',
    title: 'Xuất hiện trên chương trình SBS Good Morning',
    description:
      'Chia sẻ ý kiến chuyên môn về chăm sóc chống lão hóa, tập trung vào độ đàn hồi da, lão hóa do thói quen sinh hoạt và tái tạo collagen.',
  },
  '3': {
    badge: 'CHƯƠNG TRÌNH TOÀN CẦU',
    source: 'Issuemaker',
    title: 'Bài báo về APTOS International Program',
    description:
      'Được giới thiệu là bác sĩ đại diện Hàn Quốc do trụ sở APTOS mời, tham gia chương trình quốc tế liên quan tới thủ thuật nâng cơ.',
  },
  '4': {
    badge: 'BÀI BÌA',
    source: 'Issuemaker',
    title: 'Bài bìa của Issuemaker',
    description:
      'Định hướng thương hiệu và triết lý điều trị của Phòng khám Phẫu thuật Thẩm mỹ LIV được giới thiệu, bao gồm triết lý Slow Aging, các thủ thuật tái tạo và việc mở rộng tại ga Sinsa.',
  },
  '5': {
    badge: 'ULTHERAPY PRIME',
    source: 'Hemophilia Life',
    title: 'Phỏng vấn về việc đưa Ultherapy-Prime vào ứng dụng',
    description:
      'Giới thiệu cách tiếp cận của Phòng khám Phẫu thuật Thẩm mỹ LIV với Ultherapy-Prime và kỹ thuật nâng cơ nhắm chính xác vào lớp SMAS.',
  },
  '6': {
    badge: 'CHĂM SÓC TÁI TẠO',
    source: 'Medical Today',
    title: 'Giới thiệu hệ thống phối màu da y khoa GRIDA',
    description:
      'Bài báo giới thiệu thủ thuật tái tạo màu da tự nhiên cho vùng sẹo và vùng giảm sắc tố, sử dụng 52 tông màu cùng các sắc tố được FDA phê duyệt.',
  },
  '7': {
    badge: 'HỌC THUẬT',
    source: 'Tin LIV',
    title:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa — bài giảng khách mời tại Aesthetic Plastic Surgery Korea',
    description:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa, đã có bài báo cáo miệng chính thức theo lời mời với chủ đề “Site-specific algorithm for facial rejuvenation” tại Aesthetic Plastic Surgery Korea do Hội Phẫu thuật Tạo hình Thẩm mỹ Hàn Quốc tổ chức, giới thiệu cách tiếp cận chính xác theo từng vùng dựa trên đặc điểm giải phẫu của gương mặt cùng thuật toán thủ thuật riêng của LIV.',
  },
  '8': {
    badge: 'TIN LIV',
    source: 'Tin LIV',
    title: 'Trao bảng chứng nhận giảng viên toàn cầu chính thức của APTOS',
    description:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa, đã được trao bảng chứng nhận giảng viên chính thức của APTOS, thương hiệu căng chỉ toàn cầu. Chứng nhận này trở thành cơ hội để mở rộng hoạt động đào tạo bác sĩ trong và ngoài nước cũng như hoạt động học thuật trong lĩnh vực thủ thuật nâng cơ.',
  },
  '9': {
    badge: 'KHÁCH ĐẾN LIV',
    source: 'Tin LIV',
    title: 'Diễn viên Shim Hyung-tak tới thăm Phòng khám Phẫu thuật Thẩm mỹ LIV',
    description:
      'Diễn viên Shim Hyung-tak đã tới thăm Phòng khám Phẫu thuật Thẩm mỹ LIV. LIV mang đến trải nghiệm điều trị thoải mái dựa trên triết lý chăm sóc Slow Aging hướng tới sức khỏe và vẻ đẹp tự nhiên vốn có.',
  },
  '10': {
    badge: 'KHÁCH ĐẾN LIV',
    source: 'Tin LIV',
    title:
      'Ca sĩ Bae Ki-sung và người dẫn chương trình Lee Eun-bi tới thăm Phòng khám Phẫu thuật Thẩm mỹ LIV',
    description:
      'Ca sĩ Bae Ki-sung cùng vợ là người dẫn chương trình Lee Eun-bi đã tới thăm Phòng khám Phẫu thuật Thẩm mỹ LIV. LIV mang đến dịch vụ chăm sóc cá nhân hóa hướng tới việc duy trì đều đặn và chống lão hóa tự nhiên.',
  },
  '11': {
    badge: 'KHÁCH QUỐC TẾ',
    source: 'Tin LIV',
    title:
      'Nhiều người có sức ảnh hưởng nổi tiếng của Trung Quốc tới thăm Phòng khám Phẫu thuật Thẩm mỹ LIV',
    description:
      'Nhiều người có sức ảnh hưởng nổi tiếng của Trung Quốc đã tới thăm Phòng khám Phẫu thuật Thẩm mỹ LIV. Dựa trên dịch vụ chăm sóc chống lão hóa cao cấp của Hàn Quốc và triết lý Slow Aging tự nhiên, LIV cũng mang đến trải nghiệm điều trị khác biệt cho khách hàng quốc tế.',
  },
  '12': {
    badge: 'KHÁCH ĐẾN LIV',
    source: 'Tin LIV',
    title: 'Phát thanh viên Lee Jin-ju tới thăm Phòng khám Phẫu thuật Thẩm mỹ LIV',
    description:
      'Phát thanh viên Lee Jin-ju đã tới thăm Phòng khám Phẫu thuật Thẩm mỹ LIV. LIV theo đuổi triết lý chăm sóc Slow Aging có tính đến nét thanh nhã vốn có và độ đàn hồi da tự nhiên.',
  },
  '13': {
    badge: 'PHỎNG VẤN',
    source: 'Issuemaker',
    title: 'Phỏng vấn của Issuemaker',
    description:
      'Bài báo giới thiệu quá trình mở phòng khám phẫu thuật thẩm mỹ đầu tiên tại Dongbu-Ichon-dong, triết lý điều trị trung thực và định hướng hướng tới vẻ đẹp tự nhiên của Phòng khám Phẫu thuật Thẩm mỹ LIV.',
  },
  '14': {
    badge: 'CHUYÊN MỤC Y KHOA',
    source: 'Medical Today',
    title: 'Phỏng vấn của Medical Today về điều chỉnh cường độ sóng siêu âm',
    description:
      'Giải thích cách tiếp cận nâng cơ cá nhân hóa, trong đó cường độ năng lượng, độ sâu và phân bổ số shot được điều chỉnh theo độ dày và cấu trúc của da.',
  },

  // ── featuredMediaNews (home) ──
  f9: {
    badge: 'HỌC THUẬT',
    title: 'Bài trình bày theo lời mời tại AXA (Aptos Expert Alliance)',
    description:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa, được mời tham dự AXA — hội nghị chuyên gia do APTOS, thương hiệu căng chỉ toàn cầu, tổ chức — và đã trình bày các ca lâm sàng cùng kinh nghiệm căng chỉ.',
  },
  f8: {
    badge: 'PHỎNG VẤN BÁO CHÍ',
    title: 'Bác sĩ Kim Sooyoung, Giám đốc Y khoa — phỏng vấn lâm sàng về APTOS Bio-Lifting',
    description:
      'Tham gia bài phỏng vấn về APTOS Bio-Lifting trên tạp chí chuyên ngành thẩm mỹ y khoa “Medical Aesthetic”, chia sẻ về thiết kế nâng cơ chính xác có tính đến cấu trúc gương mặt và tình trạng mô, cùng cách tiếp cận Bio-Lifting cá nhân hóa cho từng bệnh nhân.',
  },
  f7: {
    badge: 'PHỎNG VẤN BÁO CHÍ',
    title: 'Phỏng vấn cùng “Medical Aesthetic”',
    description:
      'Có buổi phỏng vấn chính thức với “Medical Aesthetic”, tạp chí chuyên về thẩm mỹ và thiết bị y tế, làm nổi bật triết lý Slow Aging và các thủ thuật nâng cơ toàn cầu APTOS.',
  },
  f1: {
    badge: 'TRUYỀN HÌNH',
    title: 'Xuất hiện trên chương trình SBS Good Morning',
    description:
      'Chia sẻ ý kiến chuyên môn về độ đàn hồi da, lão hóa do thói quen sinh hoạt và tái tạo collagen.',
  },
  f2: {
    badge: 'BÀI BÌA',
    title: 'Bài bìa của Issuemaker',
    description:
      'Giới thiệu định hướng của Phòng khám Phẫu thuật Thẩm mỹ LIV — triết lý Slow Aging, các thủ thuật tái tạo và việc mở rộng tại ga Sinsa.',
  },
  f3: {
    badge: 'GIẢNG VIÊN TOÀN CẦU',
    title: 'Chứng nhận giảng viên chính thức của APTOS',
    description:
      'Bác sĩ Kim Sooyoung, Giám đốc Y khoa, đã đạt chứng nhận International Trainer của APTOS, thương hiệu căng chỉ toàn cầu.',
  },
};

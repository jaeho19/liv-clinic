import { z } from 'zod';

// 진료과목 옵션
export const TREATMENT_OPTIONS = [
  '레이저 시술',
  '필러 시술',
  '보톡스',
  '피부 관리',
  '리프팅',
  '안티에이징',
  '기타',
] as const;

// Zod 스키마
export const consultationFormSchema = z.object({
  name: z
    .string()
    .min(2, '성함은 2자 이상 입력해주세요')
    .max(50, '성함은 50자 이하로 입력해주세요'),
  password: z
    .string()
    .min(4, '비밀번호는 4자 이상 입력해주세요')
    .max(20, '비밀번호는 20자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    // 국내·해외 번호 모두 허용: 선택적 '+' 뒤 7~20자(숫자/공백/하이픈/괄호/점)
    .regex(/^\+?[\d\s().-]{7,20}$/, '올바른 연락처를 입력해주세요')
    // 실제 숫자 최소 7개 sanity check
    .refine((val) => (val.match(/\d/g)?.length ?? 0) >= 7, '올바른 연락처를 입력해주세요')
    // 저장 정규화: 공백·하이픈·괄호·점 제거 (국내번호는 숫자열, 해외번호는 '+' 보존)
    .transform((val) => val.replace(/[\s().-]/g, '')),
  treatment: z
    .string()
    .min(1, '진료과목을 선택해주세요'),
  // 선택 입력 — 이메일·국가·희망 상담일시 (마찰 완화용, 모두 optional)
  email: z
    .string()
    .email('올바른 이메일을 입력해주세요')
    .optional()
    .or(z.literal('')),
  country: z
    .string()
    .max(60, '국가명은 60자 이하로 입력해주세요')
    .optional()
    .or(z.literal('')),
  preferredDate: z
    .string()
    .optional()
    .or(z.literal('')),
  preferredTime: z
    .string()
    .optional()
    .or(z.literal('')),
  agreePrivacy: z
    .boolean()
    .refine((val) => val === true, {
      message: '개인정보 수집 및 이용에 동의해주세요',
    }),
});

export type ConsultationFormData = z.infer<typeof consultationFormSchema>;

// API 응답 타입
export interface ConsultationResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    created_at: string;
  };
  error?: string;
}

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
    .regex(/^010-?\d{4}-?\d{4}$/, '올바른 휴대폰 번호를 입력해주세요 (010-0000-0000)')
    .transform((val) => val.replace(/-/g, '')),
  treatment: z
    .string()
    .min(1, '진료과목을 선택해주세요'),
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

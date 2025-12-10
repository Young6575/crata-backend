import { IsString, IsNumber, IsOptional, Matches } from 'class-validator';

// 알림톡 발송 요청 DTO
export class SendAlimtalkDto {
  @IsNumber()
  ticketId: number;

  @IsString()
  @Matches(/^01[0-9]{8,9}$/, { message: '유효한 휴대폰 번호를 입력해주세요' })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  clientName?: string;
}

// 알림톡 템플릿 변수
export interface AlimtalkTemplateVars {
  clientName: string;
  ticketCode: string;
  testUrl: string;
  productName: string;
  expiryDate?: string;
}

// 알림톡 발송 결과
export interface AlimtalkResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

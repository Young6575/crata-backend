import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  /**
   * 사용자가 선택한 보기 값 코드(예: STRONGLY_AGREE)
   */
  @IsOptional()
  @IsString()
  valueCode?: string;

  /**
   * 채점에 사용할 점수(예: 5)
   */
  @IsOptional()
  score?: number;

  /**
   * 카테고리 ID (예: CAT_INTUITIVE)
   */
  @IsOptional()
  @IsString()
  categoryId?: string;

  /**
   * 부모 카테고리 ID (예: CAT_INFO_PROCESSING)
   */
  @IsOptional()
  @IsString()
  parentId?: string;

  /**
   * 카테고리 이름 (예: 직관형)
   */
  @IsOptional()
  @IsString()
  categoryName?: string;

  /**
   * 필요시 추가 메타데이터(자유형식)
   */
  @IsOptional()
  @IsObject()
  meta?: any;
}

export class SubmitResultDto {
  /**
   * 결과 저장 시 사용된 티켓 코드 (없을 수도 있음)
   */
  @IsOptional()
  @IsString()
  ticketCode?: string;

  /**
   * 응답자 정보 (이름, 생년월일, 성별 등)
   */
  @IsOptional()
  @IsObject()
  userMeta?: any;

  /**
   * 계산/시각화를 위한 스냅샷 데이터 (선택)
   */
  @IsOptional()
  @IsObject()
  resultSnapshot?: any;

  /**
   * 프런트/백 버전 식별자 (기본 'v1')
   */
  @IsOptional()
  @IsString()
  resultVersion?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

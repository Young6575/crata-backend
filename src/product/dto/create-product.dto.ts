import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

// 1. 가격 구간 DTO
class PriceTierDTO {
  @IsInt()
  @Min(1) // 최소 인원은 1명 이상.
  minQuantity: number;

  @IsInt()
  @IsOptional()
  maxQuantity?: number;

  @IsInt()
  @Min(0)
  unitPrice: number; // 1인당 가격
}

// 2. 포함된 검사
class ContentDTO {
  @IsString()
  testId: string; // "BEHAVIOR", "EMOTION" 등

  @IsString()
  @IsOptional()
  categoryId?: string;
}

// 3. 메인 DTO
export class CreateProductDto {
  @IsString()
  name: string; // 예: "신입사원 종합 패키지"

  @IsString()
  type: 'TEST' | 'SERVICE' // 'TEST' (검사지) - 검사지 코드 발급.  'SERVICE' (용역/서비스) - 디브리핑,워크숍 등 직접 시간을 써야 하는 경우

  @IsInt()
  @IsOptional()
  price?: number; // 예: 15000

  @IsString()
  @IsOptional()
  unit?: string; // 예: "EA", "SESSION"

  @IsString()
  @IsOptional()
  description?: string; // 예: "우리 회사 직원들의 스트레스를..."

  @IsString()
  @IsOptional()
  category?: string // 예: "조직진단", "개인상담"

  @IsString()
  @IsOptional()
  status?: string; // 예: "ACTIVE", "INACTIVE"

  @IsString()
  @IsOptional()
  imageUrl?: string; // 예: "https://..."

  // ---------------------------------------------------
  // [조립 1] 포함된 검사 목록 (필수)
  // ---------------------------------------------------

  @IsArray()
  @ValidateNested({ each: true})
  @Type(() => ContentDTO)
  contents: ContentDTO[];


  // ---------------------------------------------------
  // [조립 2] 구간별 가격표 (선택)
  // ---------------------------------------------------

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true})
  @Type(() => PriceTierDTO)
  priceTiers?: PriceTierDTO[];
}


import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 엑셀에서 파싱된 단일 행 데이터
export class ExcelQuestionRowDto {
  @IsString()
  검사유형: string; // 예: '행동방식유형검사'

  @IsString()
  질문내용: string; // 예: '나는 섭섭한 마음을 이야기하는 편이다.'

  @IsString()
  카테고리: string; // 예: '전술형'

  @IsString()
  옵션셋: string; // 예: '4점 척도'

  @IsOptional()
  @IsString()
  추가정보?: string; // JSON 문자열 (선택)
}

// 미리보기 요청 DTO
export class BulkUploadPreviewDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcelQuestionRowDto)
  rows: ExcelQuestionRowDto[];

  @IsOptional()
  @IsString()
  version?: string; // 예: 'V1', 'V2' (기본값: V1)
}

// 미리보기 응답 - 단일 행 결과
export class PreviewRowResult {
  rowIndex: number;
  status: 'success' | 'warning' | 'error';
  originalData: ExcelQuestionRowDto;
  resolvedData?: {
    testId: string;
    testName: string;
    categoryId: string;
    categoryName: string;
    optionSetId: string;
    optionSetName: string;
    baseCode: string;
    questionId: string;
  };
  errors: string[];
  warnings: string[];
  suggestions?: {
    category?: string[];
    optionSet?: string[];
    test?: string[];
  };
}

// 미리보기 응답 DTO
export class BulkUploadPreviewResponseDto {
  totalRows: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  rows: PreviewRowResult[];
}

// 실제 등록 요청 DTO
export class BulkUploadConfirmDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExcelQuestionRowDto)
  rows: ExcelQuestionRowDto[];

  @IsOptional()
  @IsString()
  version?: string; // 예: 'V1', 'V2' (기본값: V1)

  @IsOptional()
  skipErrors?: boolean; // 에러 행 스킵하고 나머지만 등록
}

// 등록 결과 응답
export class BulkUploadResultDto {
  totalRows: number;
  successCount: number;
  failedCount: number;
  createdQuestions: {
    rowIndex: number;
    questionId: string;
    baseCode: string;
    defaultText: string;
  }[];
  failedRows: {
    rowIndex: number;
    reason: string;
  }[];
}

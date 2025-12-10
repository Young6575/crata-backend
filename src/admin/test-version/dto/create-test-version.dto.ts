import { IsString, IsArray, IsOptional, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionMapItemDto {
  @IsString()
  questionBankId: string;

  @IsInt()
  @Min(1)
  displayOrder: number;
}

export class CreateTestVersionDto {
  @IsString()
  testId: string; // 예: 'BEHAVIOR'

  @IsString()
  versionCode: string; // 예: 'v11'

  @IsString()
  @IsOptional()
  status?: string; // 기본값: 'INACTIVE'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionMapItemDto)
  questions: QuestionMapItemDto[];
}

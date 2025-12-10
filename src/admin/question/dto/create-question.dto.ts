import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestionOptionDto {
  @IsString()
  label: string;

  @IsOptional()
  score?: number;

  @IsString()
  valueCode: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateQuestionDto {
  @IsString()
  baseCode: string;

  @IsString()
  testId: string;

  @IsString()
  questionType: string;

  @IsString()
  defaultText: string;

  @IsEnum(['SET', 'UNIQUE'])
  optionType: 'SET' | 'UNIQUE';

  @IsOptional()
  @IsString()
  optionSetId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  uniqueOptions?: CreateQuestionOptionDto[];
}

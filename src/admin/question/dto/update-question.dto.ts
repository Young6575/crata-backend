import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionOptionDto } from './create-question.dto';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  defaultText?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  optionSetId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  uniqueOptions?: CreateQuestionOptionDto[];
}

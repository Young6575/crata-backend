import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionMapItemDto } from './create-test-version.dto';

export class UpdateTestVersionDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionMapItemDto)
  @IsOptional()
  questions?: QuestionMapItemDto[];
}

export class UpdateStatusDto {
  @IsString()
  status: string; // 'ACTIVE' | 'INACTIVE'
}

import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSetOptionDto {
  @IsString()
  label: string;

  @IsNumber()
  score: number;

  @IsString()
  valueCode: string;
}

export class CreateOptionSetDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSetOptionDto)
  options: CreateSetOptionDto[];
}

import { IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  id: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

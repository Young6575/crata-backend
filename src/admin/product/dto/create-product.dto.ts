import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductContentDto {
  @IsString()
  testId: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class PriceTierDto {
  @IsNumber()
  minQuantity: number;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number;

  @IsNumber()
  unitPrice: number;
}

export class CreateAdminProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['TEST', 'SERVICE'])
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductContentDto)
  contents?: ProductContentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTierDto)
  priceTiers?: PriceTierDto[];
}

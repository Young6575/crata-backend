import { Type } from "class-transformer";
import { IsArray, IsInt, Min, ValidateNested } from "class-validator";

// 1. 주문 항목 하나하나의 정보
export class CreateOrderItemDto {
    @IsInt()
    @Min(1)
    productId: number; // 구매할 상품 ID

    @IsInt()
    @Min(1)
    quantity: number; // 구매할 상품 수량
}

// 2. 주문 전체 정보
export class CreateOrderDto {

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}
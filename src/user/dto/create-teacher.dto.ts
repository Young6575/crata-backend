import { IsOptional, IsString } from "class-validator";
import { BaseUserDto } from "./base-user.dto";

export class CreateTeacherDto extends BaseUserDto {
    // 상담사/강사 자격증 정보 (선택)
    @IsOptional()
    @IsString()
    certification?: string;

    // 소속 기관 (선택)
    @IsOptional()
    @IsString()
    organization?: string;

    // 전문 분야 (선택)
    @IsOptional()
    @IsString()
    specialty?: string;
}

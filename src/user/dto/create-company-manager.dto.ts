import { IsString } from "class-validator";
import { BaseUserDto } from "./base-user.dto";

export class CreateCompanyManagerDto extends BaseUserDto {

    // [핵심] 기업 정보는 필수입니다. @IsOptional()이 없습니다!
    @IsString()
    companyName: string;

    @IsString()
    position: string;
}

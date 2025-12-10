import { IsDate, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseUserDto {

// 1. 아이디 (accoutId)
    @IsString()
    @MinLength(4)
    accountId: string;

    // 2. 비밀번호
    @IsString()
    @MinLength(6, { message: '비밀번호는 6글자 이상이어야 합니다.'})
    password : string;

    // 3. 이름
    @IsString()
    name : string;

    // 4. 생년월일
    @Type(() => Date)
    @IsDate()
    birthDate: Date;

    // 5. 휴대폰 번호
    @IsOptional()
    @IsString()
    @Matches(/^010-\d{4}-\d{4}$/, { message: '휴대폰 번호 형식이 올바르지 않습니다.'})
    phoneNumber: string;



}
import { IsNotEmpty, IsString } from 'class-validator';

export class WithdrawUserDto {
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  @IsString()
  password: string;
}

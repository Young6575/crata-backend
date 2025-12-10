import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UserModule,

    JwtModule.register({
      global: true, // 어디서든 사용 가능
    secret: 'SECRECT_KEY', // 토큰 위조 방지 비밀키 (나중애 .env 파일로 빼기)
    signOptions: {expiresIn: '1h'} // 토큰 유효기간: 1시간
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy]
})
export class AuthModule {}

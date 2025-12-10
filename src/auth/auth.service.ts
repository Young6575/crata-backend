import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}

    async login(loginDto: LoginDto) {
        const { accountId, password} = loginDto;

        // 1. 유저가 존재하는지 확인
        const user = await this.userService.findByAccountId(accountId);

        // 2. 유저가 없거나, 비밀번호가 틀리면 에러
        if (!user || ! (await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException("아이디 또는 비밀번호가 틀렸습니다.");
        }

        // 3. 새 세션 토큰 생성 (동시 로그인 방지용)
        const sessionToken = uuidv4();

        // 4. 유저의 세션 토큰 업데이트 (기존 세션 무효화)
        await this.userService.updateSessionToken(user.userId, sessionToken);

        // 5. 로그인 성공! 토큰 만들기
        const payload = { 
            sub: user.userId, 
            username: user.accountId, 
            role: user.role,
            sessionToken // 세션 토큰도 JWT에 포함
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    // 세션 토큰 검증 (동시 로그인 체크)
    async validateSession(userId: number, sessionToken: string): Promise<boolean> {
        const user = await this.userService.findById(userId);
        return user?.sessionToken === sessionToken;
    }

    // 로그아웃 (세션 토큰 삭제)
    async logout(userId: number): Promise<void> {
        await this.userService.updateSessionToken(userId, null);
    }

}

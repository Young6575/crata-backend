import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// --- 토큰 검사기 ---
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            // 1. 토큰을 어디서 가져올까? => 헤더(Header)의 Bearer Token에서 가져옴
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            // 2. 만료된 토큰은 거절함
            ignoreExpiration: false,

            // 3. 아까 AuthModule에서 썻던 비밀키랑 같아야 함.
            secretOrKey: 'SECRECT_KEY',
        });
    }


    // 4. 토큰 검사가 성공하면 이 함수가 실행됨
    // payload: 토큰을 해독한 내용( sub, username, role, sessionToken)
    async validate(payload: any) {
        // 여기서 리턴한 값은 자동으로 'req.user'에 들어간다.
        return { 
            sub: payload.sub,
            userId: payload.sub, 
            accountId: payload.username, 
            role: payload.role,
            sessionToken: payload.sessionToken 
        }
    }
}
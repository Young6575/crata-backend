import { Body, Controller, HttpCode, HttpStatus, Post, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth') // 주소: http://localhost:3000/auth
export class AuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK) // 로그인 성공 시 200 OK 반환
    @Post('login')
    singIn(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    // 세션 유효성 검증 (동시 로그인 체크)
    @UseGuards(JwtAuthGuard)
    @Get('validate-session')
    async validateSession(@Request() req) {
        const { sub: userId, sessionToken } = req.user;
        const isValid = await this.authService.validateSession(userId, sessionToken);
        return { valid: isValid };
    }

    // 로그아웃
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req) {
        const { sub: userId } = req.user;
        await this.authService.logout(userId);
        return { message: '로그아웃 되었습니다.' };
    }

}

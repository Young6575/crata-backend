import { Body, Controller, Delete, Get, Post, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';

// 👇 [추가] 분리된 DTO 3개를 임포트합니다.
import { CreateIndividualUserDto } from './dto/create-individual-user.dto';
import { CreateCompanyManagerDto } from './dto/create-company-manager.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { WithdrawUserDto } from './dto/withdraw-user.dto';

@Controller('user') // http://localhost:3000/user
export class UserController {
    constructor(private readonly userService: UserService) {}

    // --- 회원가입 창구 분리 ---

    // 1. [개인 회원가입] POST /user/signup/individual
    @Post('signup/individual')
    async signupIndividual(@Body(ValidationPipe) dto: CreateIndividualUserDto) {
        // ValidationPipe가 BaseUserDto의 필수 항목을 검사합니다.
        return this.userService.CreateIndividualUser(dto);
    }

    // 2. [기업 담당자 가입] POST /user/signup/manager
    // ValidationPipe가 BaseUserDto + 기업 필수 항목을 모두 검사합니다.
    @Post('signup/manager')
    async signupManager(@Body(ValidationPipe) dto: CreateCompanyManagerDto) {
        return this.userService.createCompanyManager(dto);
    }

    // 3. [상담사/강사 가입] POST /user/signup/teacher
    @Post('signup/teacher')
    async signupTeacher(@Body(ValidationPipe) dto: CreateTeacherDto) {
        return this.userService.createTeacher(dto);
    }


    
    // --- 기존 API 유지 ---
    @UseGuards(AuthGuard('jwt')) // 🚧 "검표원: JWT 토큰 없으면 못 지나갑니다!"
    @Get('/profile')
    async getProfile(@Request() req) {
        // DB에서 사용자 정보 조회 (name, email 등 포함)
        return this.userService.findById(req.user.userId);
    }

    // 4. [회원 탈퇴] DELETE /user/withdraw
    @UseGuards(AuthGuard('jwt'))
    @Delete('/withdraw')
    async withdraw(@Request() req, @Body(ValidationPipe) dto: WithdrawUserDto) {
        return this.userService.withdrawUser(req.user.userId, dto.password);
    }
}
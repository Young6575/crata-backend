import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateCompanyManagerDto } from './dto/create-company-manager.dto';
import { CreateIndividualUserDto } from './dto/create-individual-user.dto';


@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User)
        private userRepository : Repository<User>,
    ) {}

    // ----------------------------------------------------
    // 1. [핵심] 기업 담당자 회원가입 (ROLE: COMPANY_MANAGER)
    // ----------------------------------------------------
    // CreateCompanyManagerDto를 받으면 companyName이 필수입니다.
    async createCompanyManager(managerDto: CreateCompanyManagerDto): Promise<User> {

        // 모든 필드를 가져와서 변수에 담습니다.
        const { accountId, password, name, phoneNumber, birthDate, companyName, position } = managerDto;

        const userRole = UserRole.COMPANY_MANAGER; // 역할 확정

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = this.userRepository.create({
            accountId,
            password: hashedPassword,
            name,
            phoneNumber,
            birthDate,
            role: userRole,
            companyName,
            position,
            status: 'active'
        });

        return this.userRepository.save(user);
    }

    // ----------------------------------------------------
    // 2. [핵심] 개인 회원가입 (ROLE: USER)
    // ----------------------------------------------------
    // CreateIndividualUserDto를 받으면 기업 필드는 없습니다.
    async CreateIndividualUser(individualDto: CreateIndividualUserDto): Promise<User> {
        const { accountId, password, name, phoneNumber, birthDate } = individualDto;

        const userRole = UserRole.USER; // 역할 확정

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = this.userRepository.create({
            accountId,
            password: hashedPassword,
            name,
            phoneNumber,
            birthDate,
            role: userRole,
            status: 'active'
        });

        return this.userRepository.save(user);
    }


    // ----------------------------------------------------
    // 3. [공통] DB 저장 로직 (중복 에러 처리 포함)
    // ----------------------------------------------------
    private async saveUser(user: User): Promise<User> {
        try {
            // 3. DB에 저장
            await this.userRepository.save(user);
            this.logger.log(`새 유저 등록 성공: ${user.name}, ${user.role}`)
            return user;
        } catch (error) {
            // (예외 처리) 아이디 중복 시 에러 코드 '23505'
            if (error?.code === '23505') {
                throw new ConflictException('이미 존재하는 아이디입니다.');
                } else {
                this.logger.error(`회원가입 중 알 수 없는 오류 발생: ${error.message}`);
                throw new InternalServerErrorException('회원가입 처리 중 알 수 없는 오류가 발생했습니다.');
            }
        }
    }

    // ----------------------------------------------------
    // 4. [기존] 아이디(accountId)로 유저 정보 찾아오는 함수
    // ----------------------------------------------------
    async findByAccountId(accountId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { accountId } });
    }

    // ----------------------------------------------------
    // 5. userId로 유저 정보 찾기
    // ----------------------------------------------------
    async findById(userId: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { userId } });
    }

    // ----------------------------------------------------
    // 6. 세션 토큰 업데이트 (동시 로그인 방지용)
    // ----------------------------------------------------
    async updateSessionToken(userId: number, sessionToken: string | null): Promise<void> {
        await this.userRepository.update(userId, { 
            sessionToken,
            lastLoginAt: sessionToken ? new Date() : undefined 
        });
    }

}


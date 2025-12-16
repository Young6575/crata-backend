import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateCompanyManagerDto } from './dto/create-company-manager.dto';
import { CreateIndividualUserDto } from './dto/create-individual-user.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { TestResult } from '../result/test-result.entity';
import { Statistics } from '../statistics/statistics.entity';


@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User)
        private userRepository : Repository<User>,
        @InjectRepository(TestResult)
        private testResultRepository: Repository<TestResult>,
        @InjectRepository(Statistics)
        private statisticsRepository: Repository<Statistics>,
        private dataSource: DataSource,
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
    // 3. [핵심] 상담사/강사 회원가입 (ROLE: TEACHER)
    // ----------------------------------------------------
    async createTeacher(teacherDto: CreateTeacherDto): Promise<User> {
        const { accountId, password, name, phoneNumber, birthDate, certification, organization, specialty } = teacherDto;

        const userRole = UserRole.TEACHER;

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
    // 4. [공통] DB 저장 로직 (중복 에러 처리 포함)
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
        if (!userId) {
            this.logger.warn('updateSessionToken: userId가 없습니다.');
            return;
        }
        await this.userRepository.update(userId, { 
            sessionToken,
            lastLoginAt: sessionToken ? new Date() : undefined 
        });
    }

    // ----------------------------------------------------
    // 7. [핵심] 회원 탈퇴 (개인정보 삭제 + 통계 데이터 보존)
    // ----------------------------------------------------
    async withdrawUser(userId: number, password: string): Promise<{ success: boolean; message: string }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. 사용자 조회
            const user = await this.userRepository.findOne({ where: { userId } });
            if (!user) {
                throw new NotFoundException('사용자를 찾을 수 없습니다.');
            }

            // 2. 비밀번호 확인
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
            }

            // 3. 사용자의 검사 결과 조회
            const testResults = await this.testResultRepository.find({
                where: { user: { userId } },
                relations: ['test', 'version'],
            });

            // 4. 검사 결과를 익명 통계 데이터로 변환하여 저장
            for (const result of testResults) {
                // userMeta에서 연령대와 성별 추출 (개인정보 제외)
                const userMeta = result.userMeta || {};
                const birthDate = userMeta.birthDate;
                let ageGroup = '미상';
                
                if (birthDate) {
                    const birthYear = new Date(birthDate).getFullYear();
                    const currentYear = new Date().getFullYear();
                    const age = currentYear - birthYear;
                    if (age < 20) ageGroup = '10대';
                    else if (age < 30) ageGroup = '20대';
                    else if (age < 40) ageGroup = '30대';
                    else if (age < 50) ageGroup = '40대';
                    else if (age < 60) ageGroup = '50대';
                    else ageGroup = '60대 이상';
                }

                const gender = userMeta.gender || '미상';

                // 통계 데이터 생성 (개인정보 제외, 결과 데이터만 보존)
                const statistics = this.statisticsRepository.create({
                    test: result.test,
                    ageGroup,
                    gender,
                    resultData: {
                        resultSnapshot: result.resultSnapshot,
                        versionId: result.version?.id,
                        resultVersion: result.resultVersion,
                    },
                    testDate: result.createdAt,
                });

                await queryRunner.manager.save(statistics);
            }

            // 5. 검사 결과에서 사용자 연결 해제 (userMeta 익명화)
            for (const result of testResults) {
                result.user = null;
                // userMeta에서 개인정보 제거 (이름, 전화번호 등)
                if (result.userMeta) {
                    result.userMeta = {
                        gender: result.userMeta.gender,
                        ageGroup: result.userMeta.ageGroup,
                        // 개인정보 필드 제거: name, birthDate, phoneNumber, phone
                    };
                }
                await queryRunner.manager.save(result);
            }

            // 6. 사용자 삭제
            await queryRunner.manager.remove(user);

            await queryRunner.commitTransaction();
            this.logger.log(`회원 탈퇴 완료: userId=${userId}, 통계 데이터 ${testResults.length}건 보존`);

            return {
                success: true,
                message: '회원 탈퇴가 완료되었습니다. 개인정보는 삭제되었으며, 검사 결과는 익명 통계 데이터로 보존됩니다.',
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`회원 탈퇴 실패: ${error.message}`);
            
            if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('회원 탈퇴 처리 중 오류가 발생했습니다.');
        } finally {
            await queryRunner.release();
        }
    }

}


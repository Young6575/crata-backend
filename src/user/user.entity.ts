import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { TestResult } from './../result/test-result.entity';
import {UserRole } from '../common/enums/user-role.enum';

@Entity({ name : 'users'})
export class User {

    // --- user_id ---
    @PrimaryGeneratedColumn({ type : 'bigint'})
    userId : number;
    // --- accoutId --- [로그인 ID]
    @Column({ type : 'varchar', unique : true, nullable : false})
    accountId : string;
    // --- password --- [비밀번호]
    @Column({ type : 'varchar', nullable : false})
    password : string;
    // --- name --- [사용자 이름]
    @Column({ type : 'varchar', nullable : false})
    name : string;
    // --- birth_date --- [생년월일]
    @Column({ type: 'date', name: 'birth_date', nullable: true })
    birthDate: Date;
    // --- phone_number --- [전화번호]
    @Column({ type : 'varchar', unique : true, nullable : true})
    phoneNumber : string;
    // --- role --- [역할]
    @Column({ type : 'enum', enum: UserRole, default: UserRole.USER ,nullable : false})
    role : UserRole;
    // --- status--- [상태]
    @Column({ type : 'varchar', nullable : false, default : 'active'})
    status : string;

    // --- (기업 담당자용 정보) ---
    @Column({ nullable: true }) // 일반 회원은 없으므로 nullable 필수
    companyName: string;

    @Column({ nullable: true })
    position: string; // 직급 (예: 인사팀 대리)

    // "한 명의 유저는 여러 개의 검사 결과(TestResult)를 가질 수 있다."
    @OneToMany(() => TestResult, (result) => result.user)
    testResults: TestResult[];

    
    // --- created_at --- [생성일]
    @CreateDateColumn()
    createdAt : Date;
    // --- updated_at --- [업데이트 일]
    @UpdateDateColumn()
    updatedAt : Date;
    // --- last_login_at --- [마지막 로그인]
    @Column({ nullable : true})
    lastLoginAt : Date;

    // --- session_token --- [현재 활성 세션 토큰 - 동시 로그인 방지용]
    @Column({ type: 'varchar', nullable: true, name: 'session_token' })
    sessionToken: string | null;

}
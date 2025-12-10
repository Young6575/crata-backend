// src/license/license.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { User } from '../user/user.entity'; 

@Entity({ name: 'licenses' })
export class License {

  // --- license_id ---
  @PrimaryGeneratedColumn({ type: 'bigint' })
  licenseId: number;

  // --- user_id (FK) ---
  // [핵심] 자격증(Many) : 유저(One) 관계 설정
  // DB에는 'user_id'라는 컬럼이 자동으로 생깁니다.
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' }) // DB 컬럼 이름을 'user_id'로 강제 지정
  user: User;

  // --- license_name --- [자격증 이름]
  @Column({ nullable: false })
  licenseName: string;

  // --- license_number --- [자격증 번호]
  @Column({ nullable: false })
  licenseNumber: string;

  // --- issue_date --- [발급일]
  @Column({ type: 'date', nullable: false })
  issueDate: Date;

  // --- expire_date --- [만료일]
  @Column({ type: 'date', nullable: true })
  expireDate: Date;

  // --- last_training_date ---
  // 마지막 보수교육일 (nullable: true 추천)
  @Column({ type: 'date', nullable: true })
  lastTrainingDate: Date;


@BeforeInsert()
setDefaultExpireDate() {
    if (!this.expireDate && this.issueDate) {
        const expiry = new Date(this.issueDate);
        expiry.setFullYear(expiry.getFullYear() + 2);
        this.expireDate = expiry;
    }
}

}



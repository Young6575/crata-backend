import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'manse' })
export class Manse {
  @PrimaryColumn({ type: 'date' })
  solarDate: string;

  @Column({ type: 'date' })
  lunarDate: string;

  @Column({ type: 'varchar', nullable: true })
  season: string | null;

  @Column({ type: 'timestamp', nullable: true })
  seasonStartTime: Date | null;

  @Column({ type: 'int', default: 0 })
  leapMonth: number;

  @Column({ type: 'varchar' })
  yearSky: string;

  @Column({ type: 'varchar' })
  yearGround: string;

  @Column({ type: 'varchar' })
  monthSky: string;

  @Column({ type: 'varchar' })
  monthGround: string;

  @Column({ type: 'varchar' })
  daySky: string;

  @Column({ type: 'varchar' })
  dayGround: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}

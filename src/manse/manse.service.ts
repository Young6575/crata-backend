import { Injectable, Logger } from '@nestjs/common';
import { DataSource, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Manse } from './manse.entity';
import { ManseProvider, ManseRow, convertBirthtimeToSajuPub, convertBirthToMansePub } from '@crata/saju-core';

@Injectable()
export class ManseService {
  private readonly logger = new Logger(ManseService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Manse)
    private readonly manseRepository: Repository<Manse>,
  ) {}

  private mapRow(row: Manse | null): ManseRow | null {
    if (!row) return null;
    return {
      solarDate: row.solarDate,
      lunarDate: row.lunarDate,
      season: row.season,
      seasonStartTime: row.seasonStartTime
        ? row.seasonStartTime.toISOString()
        : null,
      leapMonth: row.leapMonth,
      yearSky: row.yearSky,
      yearGround: row.yearGround,
      monthSky: row.monthSky,
      monthGround: row.monthGround,
      daySky: row.daySky,
      dayGround: row.dayGround,
    };
  }

  private buildProvider(): ManseProvider {
    return {
      findBySolarDate: async (date: string) =>
        this.mapRow(
          await this.manseRepository.findOne({ where: { solarDate: date } }),
        ),
      findByLunarDate: async (date: string) =>
        this.mapRow(
          await this.manseRepository.findOne({ where: { lunarDate: date } }),
        ),
      findSeasonAfter: async (time: string) =>
        this.mapRow(
          await this.manseRepository.findOne({
            where: { seasonStartTime: MoreThanOrEqual(new Date(time)) },
            order: { solarDate: 'ASC' },
          }),
        ),
      findSeasonBefore: async (time: string) =>
        this.mapRow(
          await this.manseRepository.findOne({
            where: { seasonStartTime: LessThanOrEqual(new Date(time)) },
            order: { solarDate: 'DESC' },
          }),
        ),
    };
  }

  /**
   * 단건 사주 계산
   */
  async calcManse(params: {
    gender: string;
    birthdayType: 'SOLAR' | 'LUNAR';
    birthday: string; // YYYYMMDD 또는 YYYY-MM-DD
    time?: string | null; // HH:mm
  }) {
    const provider = this.buildProvider();
    const normalizedBirth =
      params.birthday.length === 8
        ? `${params.birthday.slice(0, 4)}-${params.birthday.slice(4, 6)}-${params.birthday.slice(6, 8)}`
        : params.birthday;

    const normalizedTime = (() => {
      if (!params.time) return null;
      const trimmed = params.time.replace(':', '');
      if (trimmed.length === 4) {
        const hours = parseInt(trimmed.slice(0, 2), 10);
        const minutes = parseInt(trimmed.slice(2, 4), 10);
        // 유효한 시간인지 검증 (00:00 ~ 23:59)
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          return `${trimmed.slice(0, 2)}:${trimmed.slice(2, 4)}`;
        }
        // 유효하지 않으면 null 반환 (시간 정보 없이 계산)
        return null;
      }
      if (trimmed.length === 3) {
        return `0${trimmed[0]}:${trimmed.slice(1, 3)}`;
      }
      return params.time;
    })();

    // 먼저 해당 날짜의 만세력 데이터가 있는지 확인
    const manseData = await this.manseRepository.findOne({
      where: { solarDate: normalizedBirth },
    });

    if (!manseData) {
      this.logger.warn(`만세력 데이터 없음: ${normalizedBirth}`);
      throw new Error(
        `해당 날짜(${normalizedBirth})의 만세력 데이터가 없습니다. POST /manse/seed를 실행하여 데이터를 추가해주세요.`,
      );
    }

    const input = {
      gender: params.gender,
      birthdayType: params.birthdayType,
      birthday: normalizedBirth,
      time: normalizedTime,
    };

    try {
      const saju = await convertBirthtimeToSajuPub(input, provider);
      const manseFormat = await convertBirthToMansePub(
        input,
        saju,
        null,
        null,
        provider,
      );

      return {
        member: {
          id: null,
          nickname: '',
          age: null,
          birthday: normalizedBirth,
          time: input.time,
          birthdayType: input.birthdayType,
          gender: input.gender,
          type: null,
          createdAt: null,
        },
        ...manseFormat,
      };
    } catch (error) {
      this.logger.error(`사주 계산 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 파일에서 SQL을 읽어 manse 테이블에 삽입한다.
   * 기본 경로: C:\Users\wnsdu\Desktop\data\manses_202511042355.sql
   */
  async seedFromFile(filePath?: string) {
    const targetPath =
      filePath ||
      path.join(
        'C:',
        'Users',
        'wnsdu',
        'Desktop',
        'data',
        'manses_202511042355.sql',
      );

    if (!fs.existsSync(targetPath)) {
      throw new Error(`파일을 찾을 수 없습니다: ${targetPath}`);
    }

    const raw = fs.readFileSync(targetPath, 'utf8');

    const quotedColumns =
      `"solarDate","lunarDate","season","seasonStartTime","leapMonth","yearSky","yearGround","monthSky","monthGround","daySky","dayGround","createdAt","updatedAt"`;

    const normalized = raw
      .replace(/INSERT INTO\s+db\.manses\s*\([^)]+\)/gi, `INSERT INTO manse (${quotedColumns})`)
      .replace(/INSERT INTO\s+manse\s*\([^)]+\)/gi, `INSERT INTO manse (${quotedColumns})`);

    const statements = normalized
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const rawStmt of statements) {
        const stmt = `${rawStmt} ON CONFLICT ("solarDate") DO NOTHING`;
        await queryRunner.query(stmt);
      }
      await queryRunner.commitTransaction();
      this.logger.log(`manse 시드 완료 (${statements.length} statements)`);
      return { success: true, count: statements.length };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('manse 시드 실패', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

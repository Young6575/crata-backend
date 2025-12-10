import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from './test.entity';
import { TestVersion } from './test-version.entity';
import { SubmitResultDto } from './dto/submit-result.dto';
import { TestResult } from '../result/test-result.entity';
import { Ticket } from '../ticket/ticket.entity';
import { ManseService } from '../manse/manse.service';

// 일간별 행동유형 매핑
const DAY_STEM_TO_TYPE: Record<string, { motivationLocation: string; motivationOrientation: string }> = {
  '갑': { motivationLocation: 'internal', motivationOrientation: 'growth' },
  '을': { motivationLocation: 'external', motivationOrientation: 'growth' },
  '병': { motivationLocation: 'internal', motivationOrientation: 'divergence' },
  '정': { motivationLocation: 'external', motivationOrientation: 'divergence' },
  '무': { motivationLocation: 'internal', motivationOrientation: 'balance' },
  '기': { motivationLocation: 'external', motivationOrientation: 'balance' },
  '경': { motivationLocation: 'internal', motivationOrientation: 'harvest' },
  '신': { motivationLocation: 'external', motivationOrientation: 'harvest' },
  '임': { motivationLocation: 'internal', motivationOrientation: 'accumulation' },
  '계': { motivationLocation: 'external', motivationOrientation: 'accumulation' },
};

// 십성 그룹 정의
const TEN_STAR_GROUPS = {
  top: ['정관', '편관'],
  left: ['편인', '정인'],
  right: ['상관', '식신'],
  bottom: ['편재', '정재'],
  size: ['비견', '겁재'],
};

// 십성 → 업무방식 매핑
const TEN_STAR_TO_WORK_STYLE: Record<string, { category: string; type: string }> = {
  '정관': { category: 'purposeAchievement', type: 'task' },
  '편관': { category: 'purposeAchievement', type: 'relational' },
  '정인': { category: 'infoProcessing', type: 'intuitive' },
  '편인': { category: 'infoProcessing', type: 'experiential' },
  '상관': { category: 'abilityExpression', type: 'design' },
  '식신': { category: 'abilityExpression', type: 'technical' },
  '정재': { category: 'goalExecution', type: 'tactical' },
  '편재': { category: 'goalExecution', type: 'strategic' },
};

@Injectable()
export class TestRunService {
  private readonly logger = new Logger(TestRunService.name);

  constructor(
    @InjectRepository(TestVersion)
    private readonly testVersionRepository: Repository<TestVersion>,
    @InjectRepository(TestResult)
    private readonly testResultRepository: Repository<TestResult>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly manseService: ManseService,
  ) {}

  /**
   * Load active version and questions (with option set & category) via test slug.
   */
  async getQuestionsBySlug(slug: string) {
    const version = await this.findActiveVersionWithQuestions(slug);
    if (!version) throw new NotFoundException('Active test version not found.');

    const sortedMaps = [...(version.questionMap || [])].sort((a,b) => {
      const aParent = a.questionBank?.category?.parent?.id ?? null;
      const bParent = b.questionBank?.category?.parent?.id ?? null;

      // 1. ParentId 우선 정렬
      // 1순위: parentId가 다르면 parentId 기준으로 그룹/순서 정함
      if (aParent !== bParent) {
        if (aParent === null) return 1;
        if (bParent === null) return -1;
        return aParent.localeCompare(bParent);
      }

        // 2순위: displayOrder
        return a.displayOrder - b.displayOrder;
    }
    );

    const questions = sortedMaps.map((map) => {
      const qb = map.questionBank;
      return {
        id: qb.id,
        order: map.displayOrder,
        text: qb.defaultText,
        category: qb.category
          ? {
              id: qb.category.id,
              code: qb.category.code,
              name: qb.category.name,
              parentId: qb.category.parent?.id ?? null,
            }
          : null,
        optionSet: qb.optionSet
          ? {
              id: qb.optionSet.id,
              name: qb.optionSet.name,
              description: qb.optionSet.description,
              options: (qb.optionSet.options || [])
                .sort((a, b) => b.score - a.score)
                .map((opt) => ({
                  id: opt.id,
                  label: opt.label,
                  valueCode: opt.valueCode,
                  score: opt.score,
                })),
            }
          : null,

      };
    });

    return {
      test: {
        id: version.test.id,
        slug: version.test.slug,
        name: version.test.name,
        description: version.test.description,
      },
      version: {
        id: version.id,
        code: version.versionCode,
      },
      questions,
    };
  }

  /**
   * Save user answers and optionally consume a ticket.
   */
  async submitResult(slug: string, dto: SubmitResultDto) {
    const version = await this.findActiveVersionWithQuestions(slug);
    if (!version) throw new NotFoundException('Active test version not found.');

    const validQuestionIds = new Set(
      (version.questionMap || []).map((m) => m.questionBank.id),
    );

    const invalid = dto.answers?.filter(
      (ans) => !validQuestionIds.has(ans.questionId),
    );
    if (invalid.length) {
      throw new BadRequestException(
        `Unknown question IDs included: ${invalid
          .map((a) => a.questionId)
          .join(', ')}`,
      );
    }

    let ticket: Ticket | null = null;
    if (dto.ticketCode) {
      ticket = await this.ticketRepository.findOne({
        where: { code: dto.ticketCode },
        relations: ['product', 'group'],
      });
      if (!ticket) throw new NotFoundException('Ticket not found.');
      if (ticket.status !== 'AVAILABLE') {
        throw new BadRequestException('Ticket already used or expired.');
      }

      ticket.status = 'USED';
      ticket.isCompleted = true;
      ticket.usedAt = new Date();
      await this.ticketRepository.save(ticket);
    }

    // 만세력 데이터 계산 (생일 기반 분석용)
    let manseSnapshot: any = null;
    const userMeta = dto.userMeta ?? {};
    
    if (userMeta.birthday) {
      try {
        const manseResult: any = await this.manseService.calcManse({
          gender: userMeta.gender || 'MALE',
          birthdayType: userMeta.birthdayType || 'SOLAR',
          birthday: userMeta.birthday,
          time: userMeta.time || null,
        });

        // 일간(daySky)에서 행동유형 추출
        const dayStem = manseResult?.saju?.daySky?.korean || '';
        const behaviorType = DAY_STEM_TO_TYPE[dayStem] || null;

        // 십성 데이터 추출
        const saju = manseResult?.saju;
        const tenStars = saju ? [
          saju.dayGround?.tenStar,
          saju.monthGround?.tenStar,
          saju.yearGround?.tenStar,
          saju.daySky?.tenStar,
          saju.monthSky?.tenStar,
          saju.yearSky?.tenStar,
        ].filter(Boolean) : [];

        // 십성 그룹별 개수 계산
        const countByGroup = (groupKey: keyof typeof TEN_STAR_GROUPS) =>
          tenStars.filter((star) => TEN_STAR_GROUPS[groupKey].includes(star)).length;

        const topCount = countByGroup('top');
        const leftCount = countByGroup('left');
        const rightCount = countByGroup('right');
        const bottomCount = countByGroup('bottom');
        const sizeCount = countByGroup('size');

        // 조직구조방식 계산
        let orgStructure: string | null = null;
        const hasTop = topCount > 0;
        const hasRight = rightCount > 0;
        const hasBottom = bottomCount > 0;
        const hasLeft = leftCount > 0;
        
        if (hasTop || hasRight || hasBottom || hasLeft) {
          if ((hasTop && !hasRight && !hasBottom && !hasLeft) ||
              (!hasTop && !hasRight && hasBottom && !hasLeft) ||
              (hasTop && !hasRight && hasBottom && !hasLeft) ||
              (hasTop && hasRight && hasBottom && !hasLeft) ||
              (hasTop && !hasRight && hasBottom && hasLeft)) {
            orgStructure = 'groupGrowth';
          } else if ((!hasTop && hasRight && !hasBottom && !hasLeft) ||
                     (!hasTop && !hasRight && !hasBottom && hasLeft) ||
                     (!hasTop && hasRight && !hasBottom && hasLeft) ||
                     (!hasTop && hasRight && hasBottom && hasLeft) ||
                     (hasTop && hasRight && !hasBottom && hasLeft)) {
            orgStructure = 'selfGrowth';
          } else {
            orgStructure = 'both';
          }
        }

        // 자기의사결정방식 계산 (colorSize = sizeCount + 1)
        const colorSize = sizeCount + 1;
        let selfDetermination: string | null = null;
        if (colorSize < 4) {
          selfDetermination = 'standAlone';
        } else if (colorSize === 4) {
          selfDetermination = 'both';
        } else {
          selfDetermination = 'group';
        }

        // 자기향상 행동방식 계산
        const hasBigyeon = tenStars.includes('비견');
        const hasGeopjae = tenStars.includes('겁재');
        let selfImprovement: string | null = null;
        if (hasBigyeon && hasGeopjae) {
          selfImprovement = 'both';
        } else if (hasBigyeon) {
          selfImprovement = 'rival';
        } else if (hasGeopjae) {
          selfImprovement = 'comparative';
        }

        // 업무방식 계산 (십성 매핑)
        const workStyle: Record<string, string[]> = {
          purposeAchievement: [],
          infoProcessing: [],
          abilityExpression: [],
          goalExecution: [],
        };
        tenStars.forEach((star) => {
          const mapping = TEN_STAR_TO_WORK_STYLE[star];
          if (mapping && !workStyle[mapping.category].includes(mapping.type)) {
            workStyle[mapping.category].push(mapping.type);
          }
        });

        manseSnapshot = {
          dayStem,
          motivationLocation: behaviorType?.motivationLocation || null,
          motivationOrientation: behaviorType?.motivationOrientation || null,
          orgStructure,
          selfDetermination,
          selfImprovement,
          workStyle,
          tenStars,
          saju: manseResult?.saju || null,
        };

        this.logger.log(`만세력 계산 완료: ${dayStem} -> ${JSON.stringify(behaviorType)}`);
      } catch (error) {
        this.logger.warn(`만세력 계산 실패: ${error.message}`);
        // 만세력 계산 실패해도 결과 저장은 진행
      }
    }

    const result = this.testResultRepository.create({
      test: { id: version.test.id } as Test,
      version: { id: version.id } as TestVersion,
      ticket: ticket ?? undefined,
      userMeta: dto.userMeta ?? {},
      answers: dto.answers ?? [],
      resultSnapshot: {
        ...(dto.resultSnapshot ?? {}),
        manse: manseSnapshot,
      },
      resultVersion: dto.resultVersion ?? 'v1',
    });

    const saved = await this.testResultRepository.save(result);

    return {
      resultId: saved.id,
      testId: version.test.id,
      versionId: version.id,
    };
  }

  /**
   * Helper: fetch latest active version with all required relations.
   */
  private findActiveVersionWithQuestions(slug: string) {
    return this.testVersionRepository
      .createQueryBuilder('version')
      .leftJoinAndSelect('version.test', 'test')
      .leftJoinAndSelect('version.questionMap', 'map')
      .leftJoinAndSelect('map.questionBank', 'qb')
      .leftJoinAndSelect('qb.category', 'category')
      .leftJoinAndSelect('category.parent', 'categoryParent')
      .leftJoinAndSelect('qb.optionSet', 'optionSet')
      .leftJoinAndSelect('optionSet.options', 'setOptions')
      .where('test.slug = :slug', { slug })
      .andWhere('version.status = :status', { status: 'ACTIVE' })
      .orderBy('version.publishedAt', 'DESC')
      .addOrderBy('map.displayOrder', 'ASC')
      .addOrderBy('setOptions.score', 'DESC')
      .getOne();
  }
}

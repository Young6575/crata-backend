import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TestVersion } from '../../assessment/test-version.entity';
import { VersionQuestionMap } from '../../assessment/version-question-map.entity';
import { Test } from '../../assessment/test.entity';
import { QuestionBank } from '../../question/question-bank.entity';
import { CreateTestVersionDto, UpdateTestVersionDto, UpdateStatusDto } from './dto';

@Injectable()
export class AdminTestVersionService {
  constructor(
    @InjectRepository(TestVersion)
    private readonly testVersionRepo: Repository<TestVersion>,
    @InjectRepository(VersionQuestionMap)
    private readonly questionMapRepo: Repository<VersionQuestionMap>,
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
    @InjectRepository(QuestionBank)
    private readonly questionBankRepo: Repository<QuestionBank>,
  ) {}

  /**
   * 모든 TestVersion 목록 조회 (Test별 그룹화)
   */
  async findAll() {
    const versions = await this.testVersionRepo.find({
      relations: ['test', 'questionMap', 'questionMap.questionBank'],
      order: { publishedAt: 'DESC' },
    });

    // Test별로 그룹화
    const grouped = versions.reduce((acc, version) => {
      const testId = version.test?.id || 'unknown';
      if (!acc[testId]) {
        acc[testId] = {
          test: version.test,
          versions: [],
        };
      }
      acc[testId].versions.push({
        ...version,
        questionCount: version.questionMap?.length || 0,
      });
      return acc;
    }, {} as Record<string, { test: Test; versions: any[] }>);

    return Object.values(grouped);
  }

  /**
   * 특정 TestVersion 상세 조회
   */
  async findOne(id: string) {
    const version = await this.testVersionRepo.findOne({
      where: { id },
      relations: [
        'test',
        'questionMap',
        'questionMap.questionBank',
        'questionMap.questionBank.category',
        'questionMap.questionBank.optionSet',
      ],
    });

    if (!version) {
      throw new NotFoundException(`TestVersion '${id}' not found`);
    }

    // questionMap을 displayOrder로 정렬
    const sortedQuestionMap = version.questionMap?.sort(
      (a, b) => a.displayOrder - b.displayOrder,
    ) || [];

    return {
      ...version,
      questionMap: sortedQuestionMap,
      questionCount: sortedQuestionMap.length,
    };
  }


  /**
   * 새 TestVersion 생성
   */
  async create(dto: CreateTestVersionDto) {
    // Test 존재 확인
    const test = await this.testRepo.findOne({ where: { id: dto.testId } });
    if (!test) {
      throw new NotFoundException(`Test '${dto.testId}' not found`);
    }

    // 버전 ID 생성 (예: BEHAVIOR_V11)
    const versionId = `${dto.testId}_${dto.versionCode.toUpperCase()}`;

    // 중복 확인
    const existing = await this.testVersionRepo.findOne({ where: { id: versionId } });
    if (existing) {
      throw new ConflictException(`TestVersion '${versionId}' already exists`);
    }

    // 질문 존재 확인
    const questionIds = dto.questions.map((q) => q.questionBankId);
    const questions = await this.questionBankRepo.find({
      where: { id: In(questionIds) },
    });

    if (questions.length !== questionIds.length) {
      const foundIds = questions.map((q) => q.id);
      const missingIds = questionIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Questions not found: ${missingIds.join(', ')}`);
    }

    // TestVersion 생성
    const version = this.testVersionRepo.create({
      id: versionId,
      test,
      versionCode: dto.versionCode,
      status: dto.status || 'INACTIVE',
    });

    await this.testVersionRepo.save(version);

    // VersionQuestionMap 생성
    const questionMaps = dto.questions.map((q) => {
      return this.questionMapRepo.create({
        version,
        questionBank: questions.find((qb) => qb.id === q.questionBankId)!,
        displayOrder: q.displayOrder,
      });
    });

    await this.questionMapRepo.save(questionMaps);

    return this.findOne(versionId);
  }

  /**
   * TestVersion 수정 (질문 구성 변경)
   */
  async update(id: string, dto: UpdateTestVersionDto) {
    const version = await this.testVersionRepo.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`TestVersion '${id}' not found`);
    }

    // 상태 업데이트
    if (dto.status) {
      version.status = dto.status;
      await this.testVersionRepo.save(version);
    }

    // 질문 구성 업데이트
    if (dto.questions) {
      // 기존 매핑 삭제
      await this.questionMapRepo.delete({ version: { id } });

      // 질문 존재 확인
      const questionIds = dto.questions.map((q) => q.questionBankId);
      const questions = await this.questionBankRepo.find({
        where: { id: In(questionIds) },
      });

      if (questions.length !== questionIds.length) {
        const foundIds = questions.map((q) => q.id);
        const missingIds = questionIds.filter((qid) => !foundIds.includes(qid));
        throw new BadRequestException(`Questions not found: ${missingIds.join(', ')}`);
      }

      // 새 매핑 생성
      const questionMaps = dto.questions.map((q) => {
        return this.questionMapRepo.create({
          version,
          questionBank: questions.find((qb) => qb.id === q.questionBankId)!,
          displayOrder: q.displayOrder,
        });
      });

      await this.questionMapRepo.save(questionMaps);
    }

    return this.findOne(id);
  }

  /**
   * TestVersion 상태 변경
   */
  async updateStatus(id: string, dto: UpdateStatusDto) {
    const version = await this.testVersionRepo.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`TestVersion '${id}' not found`);
    }

    version.status = dto.status;
    await this.testVersionRepo.save(version);

    return this.findOne(id);
  }

  /**
   * TestVersion 삭제
   */
  async remove(id: string) {
    const version = await this.testVersionRepo.findOne({
      where: { id },
      relations: ['testResults'],
    });

    if (!version) {
      throw new NotFoundException(`TestVersion '${id}' not found`);
    }

    // 사용 중인 버전인지 확인 (결과가 있으면 삭제 불가)
    if (version.testResults && version.testResults.length > 0) {
      throw new ConflictException(
        `Cannot delete version '${id}' because it has ${version.testResults.length} test results`,
      );
    }

    // 매핑 먼저 삭제
    await this.questionMapRepo.delete({ version: { id } });

    // 버전 삭제
    await this.testVersionRepo.delete(id);

    return { success: true, message: 'Version deleted successfully' };
  }

  /**
   * 특정 Test의 사용 가능한 질문 목록 조회
   */
  async getAvailableQuestions(testId: string) {
    const questions = await this.questionBankRepo.find({
      where: { test: { id: testId } },
      relations: ['category', 'optionSet'],
      order: { baseCode: 'ASC' },
    });

    return questions;
  }
}

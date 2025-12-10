import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { QuestionBank } from '../../question/question-bank.entity';
import { QuestionOption } from '../../question/question-option.entity';
import { CategoryTree } from '../../question/category-tree/category-tree.entity';
import { OptionSet } from '../../question/option-set.entity';
import { Test } from '../../assessment/test.entity';
import { VersionQuestionMap } from '../../assessment/version-question-map.entity';
import { 
  CreateQuestionDto, 
  UpdateQuestionDto,
  ExcelQuestionRowDto,
  PreviewRowResult,
  BulkUploadPreviewResponseDto,
  BulkUploadResultDto,
} from './dto';

@Injectable()
export class AdminQuestionService {
  constructor(
    @InjectRepository(QuestionBank)
    private questionBankRepo: Repository<QuestionBank>,
    @InjectRepository(QuestionOption)
    private questionOptionRepo: Repository<QuestionOption>,
    @InjectRepository(CategoryTree)
    private categoryTreeRepo: Repository<CategoryTree>,
    @InjectRepository(OptionSet)
    private optionSetRepo: Repository<OptionSet>,
    @InjectRepository(Test)
    private testRepo: Repository<Test>,
    @InjectRepository(VersionQuestionMap)
    private versionQuestionMapRepo: Repository<VersionQuestionMap>,
  ) {}

  // 질문 목록 조회 (트리 구조)
  async findAll() {
    const tests = await this.testRepo.find();
    const result: any[] = [];

    for (const test of tests) {
      const questions = await this.questionBankRepo.find({
        where: { test: { id: test.id } },
        relations: ['category', 'optionSet', 'options'],
        order: { baseCode: 'ASC' },
      });

      // baseCode별로 그룹화
      const groupedByBaseCode = questions.reduce((acc, q) => {
        if (!acc[q.baseCode]) {
          acc[q.baseCode] = [];
        }
        acc[q.baseCode].push(q);
        return acc;
      }, {} as Record<string, QuestionBank[]>);

      result.push({
        test,
        questionGroups: Object.entries(groupedByBaseCode).map(([baseCode, versions]) => ({
          baseCode,
          versions: versions.map(v => ({
            id: v.id,
            defaultText: v.defaultText,
            category: v.category,
            optionType: v.optionType,
          })),
          latestVersion: versions[versions.length - 1],
        })),
      });
    }

    return result;
  }

  // 질문 생성
  async create(dto: CreateQuestionDto) {
    const test = await this.testRepo.findOne({ where: { id: dto.testId } });
    if (!test) {
      throw new NotFoundException('검사 유형을 찾을 수 없습니다.');
    }

    let category: CategoryTree | null = null;
    if (dto.categoryId) {
      category = await this.categoryTreeRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('카테고리를 찾을 수 없습니다.');
      }
    }

    let optionSet: OptionSet | null = null;
    if (dto.optionType === 'SET' && dto.optionSetId) {
      optionSet = await this.optionSetRepo.findOne({ where: { id: dto.optionSetId } });
      if (!optionSet) {
        throw new NotFoundException('옵션셋을 찾을 수 없습니다.');
      }
    }

    // 버전 ID 생성
    // baseCode가 직접 제공된 경우 해당 baseCode의 다음 버전 생성
    // baseCode: Q_TEST_{검사유형ID}_CAT_{카테고리ID}_{순번}
    let baseCode = dto.baseCode;
    let questionId: string;
    
    if (baseCode) {
      // 기존 baseCode에 새 버전 추가
      const existingVersions = await this.questionBankRepo.find({
        where: { baseCode },
      });
      const versionNumber = existingVersions.length + 1;
      questionId = `${baseCode}_V${versionNumber}`;
    } else {
      // 새 질문 생성 - baseCode 자동 생성
      // baseCode: Q_{검사유형ID}_{카테고리ID}_{순번}
      // test.id는 이미 TEST_COLOR 형태, category.id는 CAT_COLOR_RED 형태
      const basePrefix = `Q_${test.id}_${category?.id || 'NONE'}`;
      
      const existingQuestions = await this.questionBankRepo
        .createQueryBuilder('q')
        .where('q.baseCode LIKE :prefix', { prefix: `${basePrefix}_%` })
        .getMany();
      
      let maxSeq = 0;
      for (const q of existingQuestions) {
        const match = q.baseCode.match(/_(\d+)$/);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      }
      
      baseCode = `${basePrefix}_${maxSeq + 1}`;
      questionId = `${baseCode}_V1`;
    }

    const question = this.questionBankRepo.create({
      id: questionId,
      baseCode: dto.baseCode,
      test,
      questionType: dto.questionType,
      defaultText: dto.defaultText,
      optionType: dto.optionType,
      optionSet,
      category,
      metadata: dto.metadata,
    });

    const savedQuestion = await this.questionBankRepo.save(question);

    // UNIQUE 옵션인 경우 개별 옵션 저장
    if (dto.optionType === 'UNIQUE' && dto.uniqueOptions) {
      for (const opt of dto.uniqueOptions) {
        const option = this.questionOptionRepo.create({
          questionBank: savedQuestion,
          label: opt.label,
          score: opt.score || 0,
          valueCode: opt.valueCode,
          metadata: opt.metadata,
        });
        await this.questionOptionRepo.save(option);
      }
    }

    return savedQuestion;
  }

  // 질문 직접 수정 (기존 질문 업데이트)
  async update(id: string, dto: UpdateQuestionDto) {
    const existingQuestion = await this.questionBankRepo.findOne({
      where: { id },
      relations: ['test', 'category', 'optionSet', 'options'],
    });

    if (!existingQuestion) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    // 카테고리 변경
    if (dto.categoryId) {
      const category = await this.categoryTreeRepo.findOne({ where: { id: dto.categoryId } });
      if (category) {
        existingQuestion.category = category;
      }
    }

    // 옵션셋 변경
    if (dto.optionSetId) {
      const optionSet = await this.optionSetRepo.findOne({ where: { id: dto.optionSetId } });
      if (optionSet) {
        existingQuestion.optionSet = optionSet;
      }
    }

    // 질문 텍스트 변경
    if (dto.defaultText) {
      existingQuestion.defaultText = dto.defaultText;
    }

    // 메타데이터 변경
    if (dto.metadata) {
      existingQuestion.metadata = dto.metadata;
    }

    const savedQuestion = await this.questionBankRepo.save(existingQuestion);

    // UNIQUE 옵션 업데이트
    if (existingQuestion.optionType === 'UNIQUE' && dto.uniqueOptions) {
      // 기존 옵션 삭제
      await this.questionOptionRepo.delete({ questionBank: { id } });
      
      // 새 옵션 저장
      for (const opt of dto.uniqueOptions) {
        const option = this.questionOptionRepo.create({
          questionBank: savedQuestion,
          label: opt.label,
          score: opt.score || 0,
          valueCode: opt.valueCode,
          metadata: opt.metadata,
        });
        await this.questionOptionRepo.save(option);
      }
    }

    return savedQuestion;
  }

  // 질문 삭제 (활성 버전에 매핑되어 있으면 차단)
  async delete(id: string) {
    const question = await this.questionBankRepo.findOne({ where: { id } });
    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    // 활성 TestVersion에 매핑되어 있는지 확인
    const mappings = await this.versionQuestionMapRepo.find({
      where: { questionBank: { id } },
      relations: ['version'],
    });

    const activeMappings = mappings.filter(m => m.version.status === 'ACTIVE');
    if (activeMappings.length > 0) {
      throw new BadRequestException(
        '이 질문은 활성 검사 버전에 포함되어 있어 삭제할 수 없습니다.',
      );
    }

    // 연관된 옵션 삭제
    await this.questionOptionRepo.delete({ questionBank: { id } });
    
    // 질문 삭제
    await this.questionBankRepo.delete(id);

    return { message: '질문이 삭제되었습니다.' };
  }

  // 버전 히스토리 조회
  async getVersionHistory(baseCode: string) {
    const versions = await this.questionBankRepo.find({
      where: { baseCode },
      relations: ['category', 'optionSet'],
      order: { id: 'ASC' },
    });

    return versions.map(v => ({
      id: v.id,
      defaultText: v.defaultText,
      category: v.category?.name,
      optionType: v.optionType,
      optionSet: v.optionSet?.name,
    }));
  }

  // 단일 질문 조회
  async findOne(id: string) {
    const question = await this.questionBankRepo.findOne({
      where: { id },
      relations: ['test', 'category', 'optionSet', 'options'],
    });

    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    return question;
  }

  // ========== 엑셀 벌크 업로드 관련 메서드 ==========

  // 유사 문자열 찾기 (레벤슈타인 거리 기반)
  private similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    
    const costs: number[] = [];
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[longer.length] = lastValue;
    }
    return (longer.length - costs[longer.length]) / longer.length;
  }

  // 유사한 이름 추천
  private findSimilarNames(target: string, items: { name: string }[], limit = 3): string[] {
    return items
      .map(item => ({ name: item.name, score: this.similarity(target.toLowerCase(), item.name.toLowerCase()) }))
      .filter(item => item.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.name);
  }

  // 엑셀 업로드 미리보기
  async bulkUploadPreview(rows: ExcelQuestionRowDto[], version?: string): Promise<BulkUploadPreviewResponseDto> {
    const ver = version || 'V1';
    // 모든 참조 데이터 미리 로드
    const [allTests, allCategories, allOptionSets] = await Promise.all([
      this.testRepo.find(),
      this.categoryTreeRepo.find(),
      this.optionSetRepo.find(),
    ]);

    const results: PreviewRowResult[] = [];
    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: PreviewRowResult['suggestions'] = {};

      // 1. 검사유형 찾기 (이름으로)
      const test = allTests.find(t => t.name === row.검사유형);
      if (!test) {
        errors.push(`검사유형 "${row.검사유형}"을 찾을 수 없습니다.`);
        suggestions.test = this.findSimilarNames(row.검사유형, allTests);
      }

      // 2. 카테고리 찾기 (이름으로)
      const category = allCategories.find(c => c.name === row.카테고리);
      if (!category) {
        errors.push(`카테고리 "${row.카테고리}"를 찾을 수 없습니다.`);
        suggestions.category = this.findSimilarNames(row.카테고리, allCategories);
      }

      // 3. 옵션셋 찾기 (이름으로)
      const optionSet = allOptionSets.find(o => o.name === row.옵션셋);
      if (!optionSet) {
        errors.push(`옵션셋 "${row.옵션셋}"을 찾을 수 없습니다.`);
        suggestions.optionSet = this.findSimilarNames(row.옵션셋, allOptionSets);
      }

      // 4. 필수값 체크
      if (!row.질문내용 || row.질문내용.trim() === '') {
        errors.push('질문내용이 비어있습니다.');
      }

      // 5. 추가정보 JSON 유효성 체크
      if (row.추가정보) {
        try {
          JSON.parse(row.추가정보);
        } catch {
          errors.push('추가정보가 올바른 JSON 형식이 아닙니다.');
        }
      }

      // 결과 생성
      const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success';
      
      let resolvedData: PreviewRowResult['resolvedData'] = undefined;
      if (test && category && optionSet) {
        // baseCode: Q_{검사유형ID}_{카테고리ID}_{순번}
        // test.id는 이미 TEST_COLOR 형태, category.id는 CAT_COLOR_RED 형태
        const basePrefix = `Q_${test.id}_${category.id}`;
        
        // 같은 basePrefix로 시작하는 질문들 중 가장 큰 순번 찾기
        const existingQuestions = await this.questionBankRepo
          .createQueryBuilder('q')
          .where('q.baseCode LIKE :prefix', { prefix: `${basePrefix}_%` })
          .getMany();
        
        let maxSeq = 0;
        for (const q of existingQuestions) {
          const match = q.baseCode.match(/_(\d+)$/);
          if (match) {
            const seq = parseInt(match[1], 10);
            if (seq > maxSeq) maxSeq = seq;
          }
        }
        
        const baseCode = `${basePrefix}_${maxSeq + 1}`;
        const questionId = `${baseCode}_${ver}`;
        
        resolvedData = {
          testId: test.id,
          testName: test.name,
          categoryId: category.id,
          categoryName: category.name,
          optionSetId: optionSet.id,
          optionSetName: optionSet.name,
          baseCode,
          questionId,
        };
      }

      if (status === 'success') successCount++;
      else if (status === 'warning') warningCount++;
      else errorCount++;

      results.push({
        rowIndex: i + 1,
        status,
        originalData: row,
        resolvedData,
        errors,
        warnings,
        suggestions: Object.keys(suggestions).length > 0 ? suggestions : undefined,
      });
    }

    return {
      totalRows: rows.length,
      successCount,
      warningCount,
      errorCount,
      rows: results,
    };
  }

  // 엑셀 업로드 실제 등록
  async bulkUploadConfirm(rows: ExcelQuestionRowDto[], version?: string, skipErrors = false): Promise<BulkUploadResultDto> {
    const ver = version || 'V1';
    const [allTests, allCategories, allOptionSets] = await Promise.all([
      this.testRepo.find(),
      this.categoryTreeRepo.find(),
      this.optionSetRepo.find(),
    ]);

    const createdQuestions: BulkUploadResultDto['createdQuestions'] = [];
    const failedRows: BulkUploadResultDto['failedRows'] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const test = allTests.find(t => t.name === row.검사유형);
        const category = allCategories.find(c => c.name === row.카테고리);
        const optionSet = allOptionSets.find(o => o.name === row.옵션셋);

        if (!test || !category || !optionSet) {
          const missing: string[] = [];
          if (!test) missing.push(`검사유형 "${row.검사유형}"`);
          if (!category) missing.push(`카테고리 "${row.카테고리}"`);
          if (!optionSet) missing.push(`옵션셋 "${row.옵션셋}"`);
          throw new Error(`찾을 수 없음: ${missing.join(', ')}`);
        }

        if (!row.질문내용 || row.질문내용.trim() === '') {
          throw new Error('질문내용이 비어있습니다.');
        }

        // baseCode 및 questionId 생성
        // baseCode: Q_{검사유형ID}_{카테고리ID}_{순번}
        // test.id는 이미 TEST_COLOR 형태, category.id는 CAT_COLOR_RED 형태
        const basePrefix = `Q_${test.id}_${category.id}`;
        
        // 같은 basePrefix로 시작하는 질문들 중 가장 큰 순번 찾기
        const existingQuestions = await this.questionBankRepo
          .createQueryBuilder('q')
          .where('q.baseCode LIKE :prefix', { prefix: `${basePrefix}_%` })
          .getMany();
        
        let maxSeq = 0;
        for (const q of existingQuestions) {
          const match = q.baseCode.match(/_(\d+)$/);
          if (match) {
            const seq = parseInt(match[1], 10);
            if (seq > maxSeq) maxSeq = seq;
          }
        }
        
        const baseCode = `${basePrefix}_${maxSeq + 1}`;
        const questionId = `${baseCode}_${ver}`;

        // 질문 저장
        const question = this.questionBankRepo.create({
          id: questionId,
          baseCode,
          test,
          questionType: test.id,
          defaultText: row.질문내용.trim(),
          optionType: 'SET',
          optionSet,
          category,
          metadata: row.추가정보 ? JSON.parse(row.추가정보) : null,
        });

        await this.questionBankRepo.save(question);

        createdQuestions.push({
          rowIndex: i + 1,
          questionId,
          baseCode,
          defaultText: row.질문내용.trim(),
        });
      } catch (error) {
        if (!skipErrors) {
          throw new BadRequestException(`행 ${i + 1} 처리 실패: ${error.message}`);
        }
        failedRows.push({
          rowIndex: i + 1,
          reason: error.message,
        });
      }
    }

    return {
      totalRows: rows.length,
      successCount: createdQuestions.length,
      failedCount: failedRows.length,
      createdQuestions,
      failedRows,
    };
  }

  // 참조 데이터 목록 조회 (프론트엔드 드롭다운용)
  async getReferenceData() {
    const [tests, categories, optionSets] = await Promise.all([
      this.testRepo.find(),
      this.categoryTreeRepo.find(),
      this.optionSetRepo.find(),
    ]);

    return {
      tests: tests.map(t => ({ id: t.id, name: t.name })),
      categories: categories.map(c => ({ id: c.id, name: c.name, code: c.code })),
      optionSets: optionSets.map(o => ({ id: o.id, name: o.name })),
    };
  }
}

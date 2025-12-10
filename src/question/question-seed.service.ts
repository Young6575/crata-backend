import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Test } from '../assessment/test.entity'
import { TestVersion } from '../assessment/test-version.entity';
import { QuestionBank } from '../question/question-bank.entity';
import { VersionQuestionMap } from '../assessment/version-question-map.entity';
import { OptionSet } from '../question/option-set.entity';
import { CategoryTree } from '../question/category-tree/category-tree.entity';
// 👇 방금 만든 데이터 파일 임포트
import { QUESTIONS_RAW_DATA, TEST_TYPE_MAP, CATEGORY_MAP } from './seed/questions.data';
import { CATEGORIES_DATA } from './seed/categories.data';

@Injectable()
export class QuestionSeedService {
  private readonly logger = new Logger(QuestionSeedService.name);

  constructor(private dataSource: DataSource) {}

  async seedQuestions() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`🚀 질문지 시딩 시작... (총 ${QUESTIONS_RAW_DATA.length}개)`);

      // 1. 5가지 검사지 정의
      const testDefinitions = [
        { id: 'TEST_ADULT', name: '성인용 행동방식유형검사', slug: 'behavior-adult' },
        { id: 'TEST_TODDLER', name: '유아용(만3~5세) 행동방식유형검사', slug: 'behavior-toddler' },
        { id: 'TEST_CHILD_LOW', name: '아동용(만6세~초3) 행동방식유형검사', slug: 'behavior-child-low' },
        { id: 'TEST_CHILD_HIGH', name: '초등고학년(초4~중1) 행동방식유형검사', slug: 'behavior-child-high' },
        { id: 'TEST_YOUTH', name: '청소년용(중2~고3) 행동방식유형검사', slug: 'behavior-youth' },
      ];

      // 2. 기본 보기 세트 확인 (없으면 에러)
      const defaultOptionSet = await queryRunner.manager.findOne(OptionSet, { where: { id: 'LIKERT_5' } });
      if (!defaultOptionSet) throw new Error("'LIKERT_5' 보기 세트가 DB에 없습니다. TestAssetSeeder를 먼저 실행해주세요!");

      // 3. 검사지별 데이터 생성 루프
      for (const def of testDefinitions) {
        
        // (A) Test 생성
        await queryRunner.manager.createQueryBuilder()
          .insert().into(Test).values(def).orIgnore().execute();

        // (B) Version (v1) 생성
        const versionId = `${def.id}_V1`;
        const existingVersion = await queryRunner.manager.findOne(TestVersion, { where: { id: versionId } });
        
        let version = existingVersion;
        if (!version) {
            version = queryRunner.manager.create(TestVersion, {
                id: versionId,
                test: { id: def.id },
                versionCode: 'v1.0.0',
                status: 'ACTIVE',
            });
            await queryRunner.manager.save(version);
            this.logger.log(`✅ 버전 생성됨: ${versionId}`);
        }

        // (C) 엑셀 데이터 필터링 (현재 검사지에 해당하는 질문만 골라내기)
        // TEST_TYPE_MAP에서 현재 ID(def.id)에 해당하는 한글 키(예: '성인용')를 찾습니다.
        const targetTypeKey = Object.keys(TEST_TYPE_MAP).find(key => TEST_TYPE_MAP[key] === def.id);
        
        // 그 한글 키를 가진 질문들만 필터링합니다.
        const questions = QUESTIONS_RAW_DATA.filter(q => q.type === targetTypeKey);

        this.logger.log(`👉 ${def.name}: ${questions.length}개 질문 처리 중...`);

        for (const qData of questions) {
            // (D) 카테고리 ID 매핑
            const categoryId = CATEGORY_MAP[qData.category];
            if (!categoryId) {
                this.logger.warn(`⚠️ 카테고리 매핑 실패 (건너뜀): "${qData.category}" - 질문: ${qData.text.substring(0, 10)}...`);
                continue;
            }

            // (E) QuestionBank 생성
            // ID: Q_{검사ID}_{카테고리ID}_{순서}
            const questionId = `Q_${def.id}_${categoryId}_${qData.order}`;

            let question = await queryRunner.manager.findOne(QuestionBank, { where: { id: questionId } });
            if (!question) {
                question = queryRunner.manager.create(QuestionBank, {
                    id: questionId,
                    baseCode: `${def.id}_${categoryId}`, // 족보
                    test: { id: def.id },
                    questionType: 'BEHAVIOR',
                    defaultText: qData.text,
                    optionType: 'SET',
                    optionSet: defaultOptionSet, // 5점 척도
                    category: { id: categoryId } as CategoryTree
                });
                await queryRunner.manager.save(question);
            }

            // (F) 조립도(Map) 연결
            const linkExists = await queryRunner.manager.findOne(VersionQuestionMap, {
                where: { version: { id: versionId }, questionBank: { id: questionId } }
            });
            if (!linkExists) {
                const map = queryRunner.manager.create(VersionQuestionMap, {
                    version: version,
                    questionBank: question,
                    displayOrder: qData.order
                });
                await queryRunner.manager.save(map);
            }
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log('🎉 모든 질문지 데이터 시딩 완료!');
      return true;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('❌ 시딩 실패', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 카테고리 트리 시딩 (색채심리 포함)
   */
  async seedCategories() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`🎨 카테고리 시딩 시작... (총 ${CATEGORIES_DATA.length}개)`);

      // 부모가 없는 것부터 순서대로 처리 (parentId가 null인 것 먼저)
      const sortedCategories = [...CATEGORIES_DATA].sort((a, b) => {
        if (a.parentId === null && b.parentId !== null) return -1;
        if (a.parentId !== null && b.parentId === null) return 1;
        return 0;
      });

      let created = 0;
      let skipped = 0;

      for (const catData of sortedCategories) {
        // 이미 존재하는지 확인
        const existing = await queryRunner.manager.findOne(CategoryTree, {
          where: { id: catData.id },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // 부모 카테고리 찾기
        let parent: CategoryTree | null = null;
        if (catData.parentId) {
          parent = await queryRunner.manager.findOne(CategoryTree, {
            where: { id: catData.parentId },
          });
          if (!parent) {
            this.logger.warn(`⚠️ 부모 카테고리 없음: ${catData.parentId} (${catData.name} 건너뜀)`);
            continue;
          }
        }

        // 카테고리 생성
        const category = queryRunner.manager.create(CategoryTree, {
          id: catData.id,
          code: catData.code,
          name: catData.name,
          parent: parent,
        });

        await queryRunner.manager.save(category);
        created++;
        this.logger.log(`✅ 카테고리 생성: ${catData.name} (${catData.id})`);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`🎉 카테고리 시딩 완료! (생성: ${created}, 스킵: ${skipped})`);
      return { created, skipped, total: CATEGORIES_DATA.length };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('❌ 카테고리 시딩 실패', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 색채심리 카테고리만 시딩
   */
  async seedColorCategories() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 색채 관련 카테고리만 필터링
      const colorCategories = CATEGORIES_DATA.filter(c => 
        c.id.startsWith('CAT_COLOR')
      );

      this.logger.log(`🎨 색채 카테고리 시딩 시작... (총 ${colorCategories.length}개)`);

      let created = 0;
      let skipped = 0;

      // 순서대로 처리 (ROOT -> GROUP -> 개별 색상)
      for (const catData of colorCategories) {
        const existing = await queryRunner.manager.findOne(CategoryTree, {
          where: { id: catData.id },
        });

        if (existing) {
          this.logger.log(`⏭️ 이미 존재: ${catData.name}`);
          skipped++;
          continue;
        }

        let parent: CategoryTree | null = null;
        if (catData.parentId) {
          parent = await queryRunner.manager.findOne(CategoryTree, {
            where: { id: catData.parentId },
          });
          if (!parent) {
            this.logger.warn(`⚠️ 부모 없음: ${catData.parentId}`);
            continue;
          }
        }

        const category = queryRunner.manager.create(CategoryTree, {
          id: catData.id,
          code: catData.code,
          name: catData.name,
          parent: parent,
        });

        await queryRunner.manager.save(category);
        created++;
        this.logger.log(`✅ 생성: ${catData.name} (${catData.code})`);
      }

      await queryRunner.commitTransaction();
      this.logger.log(`🎉 색채 카테고리 시딩 완료! (생성: ${created}, 스킵: ${skipped})`);
      return { created, skipped };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('❌ 색채 카테고리 시딩 실패', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
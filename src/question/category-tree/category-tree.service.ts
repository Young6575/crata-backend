// src/question/category-tree.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryTree } from './category-tree.entity';
import { CATEGORIES_DATA } from '../seed/categories.data'; // 👈 2단계에서 만든 데이터 파일 임포트

@Injectable()
export class CategoryTreeService {
  private readonly logger = new Logger(CategoryTreeService.name);

  constructor(
    @InjectRepository(CategoryTree) // CategoryTree 엔티티 리포지토리를 주입받습니다.
    private categoryRepository: Repository<CategoryTree>,
  ) {}

  /**
   * [핵심] CategoryTree 데이터를 DB에 삽입하는 함수
   * 부모-자식 관계가 얽혀 있어 순서대로 저장하는 것이 중요합니다.
   */
  async seedCategories(): Promise<number> {
    this.logger.log('--- 카테고리 계층 구조 데이터 삽입 시작 ---');

    let savedCount = 0;
    
    // 1. 데이터 배열을 순회하며 하나씩 저장합니다.
    // (TypeORM은 객체 안에 parentId: '...' 문자열이 있으면 알아서 관계를 연결해줍니다!)
    for (const data of CATEGORIES_DATA) {
      
      // 이미 존재하는지 확인 (중복 실행 방지)
      const exists = await this.categoryRepository.findOne({ where: { id: data.id } });
      if (exists) {
        this.logger.warn(`Category ${data.id} is already seeded. Skipping.`);
        continue;
      }
      
      // 2. 부모 ID가 있다면 관계를 연결합니다.
      const parent = data.parentId ? { id: data.parentId } : null; 

      // 3. 엔티티 객체 생성
      const category = this.categoryRepository.create({
        id: data.id,
        name: data.name,
        code: data.code,
        // 부모 관계를 객체 형태로 넘겨줌 (TypeORM이 알아서 FK 처리)
        parent: parent as CategoryTree, 
        // [주의] 부모가 없으면 parent: null
      });

      // 4. 저장
      await this.categoryRepository.save(category);
      savedCount++;
    }

    this.logger.log(`--- 총 ${savedCount}개 카테고리 삽입 완료 ---`);
    return savedCount;
  }
}
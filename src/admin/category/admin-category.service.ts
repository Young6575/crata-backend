import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CategoryTree } from '../../question/category-tree/category-tree.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class AdminCategoryService {
  constructor(
    @InjectRepository(CategoryTree)
    private categoryTreeRepo: Repository<CategoryTree>,
  ) {}

  // 카테고리 트리 조회
  async getTree() {
    const rootCategories = await this.categoryTreeRepo.find({
      where: { parent: IsNull() },
      relations: ['children'],
    });

    const buildTree = async (categories: CategoryTree[]): Promise<any[]> => {
      const result: any[] = [];
      for (const cat of categories) {
        const children = await this.categoryTreeRepo.find({
          where: { parent: { id: cat.id } },
          relations: ['children'],
        });
        result.push({
          id: cat.id,
          code: cat.code,
          name: cat.name,
          children: children.length > 0 ? await buildTree(children) : [],
        });
      }
      return result;
    };

    return buildTree(rootCategories);
  }

  // 카테고리 생성
  async create(dto: CreateCategoryDto) {
    const existing = await this.categoryTreeRepo.findOne({ where: { id: dto.id } });
    if (existing) {
      throw new BadRequestException('이미 존재하는 카테고리 ID입니다.');
    }

    const existingCode = await this.categoryTreeRepo.findOne({ where: { code: dto.code } });
    if (existingCode) {
      throw new BadRequestException('이미 존재하는 카테고리 코드입니다.');
    }

    let parent: CategoryTree | null = null;
    if (dto.parentId) {
      parent = await this.categoryTreeRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('부모 카테고리를 찾을 수 없습니다.');
      }
    }

    const category = this.categoryTreeRepo.create({
      id: dto.id,
      code: dto.code,
      name: dto.name,
      parent,
    });

    return this.categoryTreeRepo.save(category);
  }

  // 모든 카테고리 목록 (flat)
  async findAll() {
    return this.categoryTreeRepo.find({
      relations: ['parent'],
      order: { id: 'ASC' },
    });
  }
}

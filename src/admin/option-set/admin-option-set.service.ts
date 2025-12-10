import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OptionSet } from '../../question/option-set.entity';
import { SetOption } from '../../question/set-option.entity';
import { CreateOptionSetDto } from './dto/create-option-set.dto';

@Injectable()
export class AdminOptionSetService {
  constructor(
    @InjectRepository(OptionSet)
    private optionSetRepo: Repository<OptionSet>,
    @InjectRepository(SetOption)
    private setOptionRepo: Repository<SetOption>,
  ) {}

  // 옵션셋 목록 조회
  async findAll() {
    return this.optionSetRepo.find({
      relations: ['options'],
      order: { id: 'ASC' },
    });
  }

  // 단일 옵션셋 조회
  async findOne(id: string) {
    const optionSet = await this.optionSetRepo.findOne({
      where: { id },
      relations: ['options'],
    });

    if (!optionSet) {
      throw new NotFoundException('옵션셋을 찾을 수 없습니다.');
    }

    return optionSet;
  }

  // 옵션셋 생성
  async create(dto: CreateOptionSetDto) {
    const existing = await this.optionSetRepo.findOne({ where: { id: dto.id } });
    if (existing) {
      throw new BadRequestException('이미 존재하는 옵션셋 ID입니다.');
    }

    const optionSet = this.optionSetRepo.create({
      id: dto.id,
      name: dto.name,
      description: dto.description,
    });

    const savedOptionSet = await this.optionSetRepo.save(optionSet);

    // 옵션들 저장
    for (const opt of dto.options) {
      const setOption = this.setOptionRepo.create({
        set: savedOptionSet,
        label: opt.label,
        score: opt.score,
        valueCode: opt.valueCode,
      });
      await this.setOptionRepo.save(setOption);
    }

    return this.findOne(savedOptionSet.id);
  }
}

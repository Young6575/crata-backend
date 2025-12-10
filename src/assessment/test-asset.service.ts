import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Test } from './test.entity';
import { OptionSet } from 'src/question/option-set.entity';
import { Repository } from 'typeorm';
import { OPTION_SET_MASTER_DATA, TEST_MASTER_DATA } from './seed/test-assets.data';
import { SetOption } from 'src/question/set-option.entity';
import { SET_OPTIONS_DATA } from 'src/question/seed/set-options.data';

@Injectable()
export class TestAssetService {
    private readonly logger = new Logger(TestAssetService.name);

    constructor(
        @InjectRepository(Test)
        private testRepository: Repository<Test>,
        @InjectRepository(OptionSet)
        private optionSetRepository: Repository<OptionSet>,
        @InjectRepository(SetOption)
        private setOptionRepository: Repository<SetOption>,
    ) {}

    async seedTestAssets(): Promise<number> {
        this.logger.log('--- 검사지 및 보기 세트 마스터 데이터 삽입 시작 ---');
        let count = 0;

    // 1. Test 마스터 데이터 삽입
    for (const data of TEST_MASTER_DATA) {
        const exists = await this.testRepository.findOne({ where: { id: data.id } });
        if (!exists) {
            await this.testRepository.save(data);
            count++;
        }
    }

    // 2. OptionSet 마스터 데이터 삽입
    for (const data of OPTION_SET_MASTER_DATA) {
      const exists = await this.optionSetRepository.findOne({ where: { id: data.id } });
      if (!exists) {
        await this.optionSetRepository.save(data);
        count++;
      }
    }

    // 3. SetOption (보기 항목) 데이터 삽입
    for (const data of SET_OPTIONS_DATA) {
      const exists = await this.setOptionRepository.findOne({ where: { label: data.label, set: { id: data.setId } } });
      if (!exists) {
        const setOption = this.setOptionRepository.create({
            ...data,
            set: { id: data.setId } // 👈 [핵심] FK 연결 (Relation Shortcut)
        });
        await this.setOptionRepository.save(setOption);
        count++;
      }
    }

        this.logger.log(`--- 총 ${count}개 자산 데이터 삽입 완료 ---`);
        return count;
    }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from './test.entity';
import { TestVersion } from './test-version.entity';
import { VersionQuestionMap } from './version-question-map.entity';
import { TestAssetService } from './test-asset.service';
import { TestAssetController } from './test-asset.controller';
import { TestController } from './test.controller';
import { OptionSet } from 'src/question/option-set.entity';
import { SetOption } from 'src/question/set-option.entity';
import { TestRunService } from './test-run.service';
import { TestRunController } from './test-run.controller';
import { TestResult } from '../result/test-result.entity';
import { Ticket } from '../ticket/ticket.entity';
import { QuestionBank } from '../question/question-bank.entity';
import { ManseModule } from '../manse/manse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Test, // whole test (e.g., behavior)
      TestVersion, // version of a test (e.g., v1)
      VersionQuestionMap, // mapping between version and questions
      OptionSet,
      SetOption,
      TestResult,
      Ticket,
      QuestionBank,
    ]),
    ManseModule,
  ],
  controllers: [TestAssetController, TestRunController, TestController],
  providers: [TestAssetService, TestRunService],
})
export class AssessmentModule {}

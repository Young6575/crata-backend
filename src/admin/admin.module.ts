import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionBank } from '../question/question-bank.entity';
import { CategoryTree } from '../question/category-tree/category-tree.entity';
import { OptionSet } from '../question/option-set.entity';
import { SetOption } from '../question/set-option.entity';
import { QuestionOption } from '../question/question-option.entity';
import { Test } from '../assessment/test.entity';
import { TestVersion } from '../assessment/test-version.entity';
import { VersionQuestionMap } from '../assessment/version-question-map.entity';
import { Product } from '../product/product.entity';
import { ProductContents } from '../product/product-contents.entity';
import { ProductPriceTier } from '../product/product-price-tier.entity';
import { TestResult } from '../result/test-result.entity';
import { User } from '../user/user.entity';
import { Ticket } from '../ticket/ticket.entity';
import { Payment } from '../payment/payment.entity';
import { Order } from '../order/order.entity';
import { AdminQuestionController } from './question/admin-question.controller';
import { AdminQuestionService } from './question/admin-question.service';
import { AdminCategoryController } from './category/admin-category.controller';
import { AdminCategoryService } from './category/admin-category.service';
import { AdminOptionSetController } from './option-set/admin-option-set.controller';
import { AdminOptionSetService } from './option-set/admin-option-set.service';
import { AdminProductController } from './product/admin-product.controller';
import { AdminProductService } from './product/admin-product.service';
import { AdminTestVersionController } from './test-version/admin-test-version.controller';
import { AdminTestVersionService } from './test-version/admin-test-version.service';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuestionBank,
      CategoryTree,
      OptionSet,
      SetOption,
      QuestionOption,
      Test,
      TestVersion,
      VersionQuestionMap,
      Product,
      ProductContents,
      ProductPriceTier,
      TestResult,
      User,
      Ticket,
      Payment,
      Order,
    ]),
  ],
  controllers: [
    AdminQuestionController,
    AdminCategoryController,
    AdminOptionSetController,
    AdminProductController,
    AdminTestVersionController,
    AdminDashboardController,
  ],
  providers: [
    AdminQuestionService,
    AdminCategoryService,
    AdminOptionSetService,
    AdminProductService,
    AdminTestVersionService,
    AdminDashboardService,
  ],
})
export class AdminModule {}

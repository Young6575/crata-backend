import { Controller, Post } from '@nestjs/common';
import { TestAssetService } from './test-asset.service';

@Controller('assessment/seed')
export class TestAssetController {
    constructor(private readonly testAssetService: TestAssetService) {}

    @Post('assets') // POST http://localhost:3000/assessment/seed/assets
    async seedTestAssets() {
        const count = await this.testAssetService.seedTestAssets();
        return { success: true, message: `기본 검사지 및 보기 세트 ${count}개 삽입 완료.` };
    }


}

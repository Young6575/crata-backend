import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ManseService } from './manse.service';

@Controller('manse')
export class ManseController {
  constructor(private readonly manseService: ManseService) {}

  /**
   * POST /manse/seed
   * { "filePath": "C:\\\\Users\\\\...\\\\manses_202511042355.sql" } 형태로 보내면 해당 파일을 사용.
   * filePath 생략 시 기본 경로(C:\Users\wnsdu\Desktop\data\manses_202511042355.sql)를 사용.
   */
  @Post('seed')
  async seed(@Body('filePath') filePath?: string) {
    return this.manseService.seedFromFile(filePath);
  }

  @Get()
  async getManse(
    @Query('gender') gender: string,
    @Query('birthdayType') birthdayType: 'SOLAR' | 'LUNAR',
    @Query('birthday') birthday: string,
    @Query('time') time?: string,
  ) {
    return this.manseService.calcManse({ gender, birthdayType, birthday, time });
  }

  @Post('list')
  async getManseList(
    @Body('items')
    items: Array<{
      gender: string;
      birthdayType: 'SOLAR' | 'LUNAR';
      birthday: string;
      time?: string;
    }>,
  ) {
    const list = await Promise.all(
      (items || []).map((item) => this.manseService.calcManse(item)),
    );
    return { data: list };
  }
}

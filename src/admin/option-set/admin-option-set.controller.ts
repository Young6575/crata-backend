import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminOptionSetService } from './admin-option-set.service';
import { CreateOptionSetDto } from './dto/create-option-set.dto';

@Controller('api/admin/option-sets')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminOptionSetController {
  constructor(private readonly adminOptionSetService: AdminOptionSetService) {}

  // 옵션셋 목록 조회
  @Get()
  async findAll() {
    return this.adminOptionSetService.findAll();
  }

  // 단일 옵션셋 조회
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminOptionSetService.findOne(id);
  }

  // 옵션셋 생성
  @Post()
  async create(@Body() dto: CreateOptionSetDto) {
    return this.adminOptionSetService.create(dto);
  }
}

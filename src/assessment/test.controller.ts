import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from './test.entity';

@Controller('api/tests')
export class TestController {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
  ) {}

  @Get()
  async getAll(): Promise<Test[]> {
    return this.testRepository.find();
  }
}

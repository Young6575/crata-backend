import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestResult } from './test-result.entity';

@Injectable()
export class ResultService {
  constructor(
    @InjectRepository(TestResult)
    private readonly testResultRepo: Repository<TestResult>,
  ) {}

  /**
   * 사용자의 검사 결과 목록 조회
   * - user가 직접 연결된 결과
   * - ticket -> order -> user로 연결된 결과
   */
  async findByUser(userId: number) {
    // 직접 user가 연결된 결과 + ticket을 통해 연결된 결과 모두 조회
    const results = await this.testResultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.test', 'test')
      .leftJoinAndSelect('result.version', 'version')
      .leftJoinAndSelect('result.user', 'user')
      .leftJoinAndSelect('result.ticket', 'ticket')
      .leftJoinAndSelect('ticket.order', 'order')
      .leftJoinAndSelect('order.user', 'orderUser')
      .where('user.userId = :userId', { userId })
      .orWhere('orderUser.userId = :userId', { userId })
      .orderBy('result.createdAt', 'DESC')
      .getMany();

    return results.map((result) => ({
      id: result.id,
      testName: result.test?.name || '알 수 없음',
      testSlug: result.test?.slug || '',
      versionCode: result.version?.versionCode || '',
      resultVersion: result.resultVersion,
      userMeta: {
        name: result.userMeta?.name || '익명',
      },
      createdAt: result.createdAt,
    }));
  }

  /**
   * 특정 검사 결과 상세 조회
   */
  async findOne(id: string, userId: number) {
    const result = await this.testResultRepo.findOne({
      where: { id },
      relations: ['test', 'version', 'user', 'ticket', 'ticket.order', 'ticket.order.user'],
    });

    if (!result) {
      throw new NotFoundException('검사 결과를 찾을 수 없습니다.');
    }

    // 본인 결과만 조회 가능
    const directUserId = result.user?.userId;
    const ticketUserId = result.ticket?.order?.user?.userId;
    
    if (directUserId !== userId && ticketUserId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return {
      id: result.id,
      testName: result.test?.name || '알 수 없음',
      testSlug: result.test?.slug || '',
      versionCode: result.version?.versionCode || '',
      resultVersion: result.resultVersion,
      userMeta: result.userMeta,
      resultSnapshot: {
        ...result.resultSnapshot,
        answers: result.answers, // 설문 응답 데이터 포함
      },
      createdAt: result.createdAt,
    };
  }
}

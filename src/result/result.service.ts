import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestResult } from './test-result.entity';
import { Ticket } from '../ticket/ticket.entity';

@Injectable()
export class ResultService {
  constructor(
    @InjectRepository(TestResult)
    private readonly testResultRepo: Repository<TestResult>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  /**
   * Fortune(1년 컨설팅) 결과 저장
   * test/version 없이 저장 가능
   */
  async saveFortuneResult(dto: {
    ticketCode: string;
    userMeta: any;
    resultSnapshot: any;
  }) {
    // 티켓 검증
    const ticket = await this.ticketRepo.findOne({
      where: { code: dto.ticketCode },
      relations: ['product', 'group'],
    });

    if (!ticket) {
      throw new NotFoundException('티켓을 찾을 수 없습니다.');
    }

    if (ticket.status !== 'AVAILABLE') {
      throw new BadRequestException('이미 사용된 티켓입니다.');
    }

    // 티켓 상태 업데이트
    ticket.status = 'USED';
    ticket.isCompleted = true;
    ticket.usedAt = new Date();
    await this.ticketRepo.save(ticket);

    // 결과 저장 (test/version은 null)
    const result = this.testResultRepo.create({
      test: null,
      version: null,
      ticket,
      group: ticket.group || null,
      userMeta: dto.userMeta,
      answers: [],
      resultSnapshot: {
        ...dto.resultSnapshot,
        type: 'fortune',
      },
      resultVersion: 'fortune-v1',
    });

    const saved = await this.testResultRepo.save(result);

    return {
      resultId: saved.id,
      message: 'Fortune 결과가 저장되었습니다.',
    };
  }

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
      .leftJoinAndSelect('result.group', 'resultGroup')
      .leftJoinAndSelect('result.ticket', 'ticket')
      .leftJoinAndSelect('ticket.order', 'order')
      .leftJoinAndSelect('ticket.group', 'ticketGroup')
      .leftJoinAndSelect('order.user', 'orderUser')
      .where('user.userId = :userId', { userId })
      .orWhere('orderUser.userId = :userId', { userId })
      .orderBy('result.createdAt', 'DESC')
      .getMany();

    return results.map((result) => {
      // 나이 계산
      let age: number | null = null;
      const birthDate = result.userMeta?.birthDate;
      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }

      return {
        id: result.id,
        testName: result.test?.name || '알 수 없음',
        testSlug: result.test?.slug || '',
        versionCode: result.version?.versionCode || '',
        resultVersion: result.resultVersion,
        userMeta: {
          name: result.userMeta?.name || '익명',
          birthDate: result.userMeta?.birthDate || null,
          age,
        },
        group: result.group ? {
          id: result.group.groupId,
          name: result.group.groupName,
        } : result.ticket?.group ? {
          id: result.ticket.group.groupId,
          name: result.ticket.group.groupName,
        } : null,
        createdAt: result.createdAt,
      };
    });
  }

  /**
   * 관리자용: 모든 검사 결과 목록 조회
   */
  async findAll() {
    const results = await this.testResultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.test', 'test')
      .leftJoinAndSelect('result.version', 'version')
      .orderBy('result.createdAt', 'DESC')
      .take(500)
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
   * admin인 경우 모든 결과 접근 가능
   */
  async findOne(id: string, userId: number, role?: string) {
    const result = await this.testResultRepo.findOne({
      where: { id },
      relations: ['test', 'version', 'user', 'ticket', 'ticket.order', 'ticket.order.user', 'ticket.product'],
    });

    if (!result) {
      throw new NotFoundException('검사 결과를 찾을 수 없습니다.');
    }

    // admin이 아닌 경우 본인 결과만 조회 가능
    if (role !== 'admin') {
      const directUserId = result.user?.userId;
      const ticketUserId = result.ticket?.order?.user?.userId;
      
      if (directUserId !== userId && ticketUserId !== userId) {
        throw new ForbiddenException('접근 권한이 없습니다.');
      }
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
      // 결과지 페이지 조합 (behavior 검사용) - product에서 가져옴
      resultPages: result.ticket?.product?.resultPages || null,
      // 결과지 타입 (behavior, color, fortune)
      resultType: result.ticket?.product?.resultType || 'behavior',
    };
  }
}

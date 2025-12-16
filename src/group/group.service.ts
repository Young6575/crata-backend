import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { Group } from './group.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { TestResult } from '../result/test-result.entity';
import { Ticket } from '../ticket/ticket.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(TestResult)
    private testResultRepository: Repository<TestResult>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  // [추가] 내 그룹 목록 조회 (티켓 개수 포함)
  async findMyGroups(userId: number) {
    return this.groupRepository.find({
      where: { admin: { userId } }, // 내가 관리자인 그룹만
      relations: ['tickets'], // 티켓 정보도 같이 (개수 세려고)
      order: { createdAt: 'DESC' },
    });
  }

  // 그룹 상세 조회 (티켓 목록 + 직접 추가된 결과 포함)
  async findGroupDetail(userId: number, groupId: number) {
    const group = await this.groupRepository.findOne({
      where: { groupId, admin: { userId } },
      relations: ['tickets', 'tickets.product', 'tickets.testResult'],
    });

    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // testResult에서 userMeta 추출해서 반환
    const ticketsWithUserMeta = group.tickets.map(ticket => ({
      ...ticket,
      testResult: ticket.testResult ? {
        id: ticket.testResult.id,
        userMeta: ticket.testResult.userMeta,
      } : null,
    }));

    // 티켓 없이 직접 그룹에 추가된 결과들 조회
    const ticketResultIds = group.tickets
      .filter(t => t.testResult)
      .map(t => t.testResult.id);
    
    // getMany()로 전체 엔티티를 가져와야 transformer가 적용됨
    const directResultsRaw = await this.testResultRepository
      .createQueryBuilder('result')
      .where('result.group_id = :groupId', { groupId })
      .andWhere(ticketResultIds.length > 0 
        ? 'result.id NOT IN (:...ticketResultIds)' 
        : '1=1', 
        { ticketResultIds }
      )
      .orderBy('result.createdAt', 'DESC')
      .getMany();
    
    // 필요한 필드만 반환
    const directResults = directResultsRaw.map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      userMeta: r.userMeta,
    }));

    return {
      ...group,
      tickets: ticketsWithUserMeta,
      directResults, // 티켓 없이 직접 추가된 결과들
    };
  }

  // 그룹 생성
  async createGroup(userId: number, dto: CreateGroupDto): Promise<Group> {
    const group = this.groupRepository.create({
        groupName: dto.groupName,
        admin: { userId },
        serviceStatus: 'NONE',
    })
    return this.groupRepository.save(group);
  }

  // test_results를 그룹에 추가
  async addResultsToGroup(userId: number, groupId: number, resultIds: string[]) {
    // 그룹 확인
    const group = await this.groupRepository.findOne({
      where: { groupId, admin: { userId } },
    });
    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 결과들 업데이트
    const updateResult = await this.testResultRepository.update(
      { id: In(resultIds) },
      { group: { groupId } }
    );

    return { 
      success: true, 
      updatedCount: updateResult.affected,
      message: `${updateResult.affected}개의 결과가 그룹에 추가되었습니다.`
    };
  }

  // test_results를 그룹에서 제외 (티켓도 함께 제외)
  async removeResultsFromGroup(userId: number, groupId: number, resultIds: string[]) {
    // 그룹 확인
    const group = await this.groupRepository.findOne({
      where: { groupId, admin: { userId } },
    });
    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 1. test_results의 group_id를 null로 설정
    const updateResult = await this.testResultRepository
      .createQueryBuilder()
      .update()
      .set({ group: null as any })
      .where('id IN (:...ids)', { ids: resultIds })
      .andWhere('group_id = :groupId', { groupId })
      .execute();

    // 2. 해당 결과와 연결된 티켓의 group_id도 null로 설정
    await this.ticketRepository
      .createQueryBuilder()
      .update()
      .set({ group: null as any })
      .where('group_id = :groupId', { groupId })
      .andWhere('ticket_id IN (SELECT ticket_id FROM test_results WHERE id IN (:...ids))', { ids: resultIds })
      .execute();

    return { 
      success: true, 
      updatedCount: updateResult.affected,
      message: `${updateResult.affected}개의 결과가 그룹에서 제외되었습니다.`
    };
  }

  // 그룹에 속한 test_results 조회
  async getGroupResults(userId: number, groupId: number) {
    const group = await this.groupRepository.findOne({
      where: { groupId, admin: { userId } },
    });
    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // getMany()로 전체 엔티티를 가져와야 transformer가 적용됨
    const results = await this.testResultRepository
      .createQueryBuilder('result')
      .where('result.group_id = :groupId', { groupId })
      .orderBy('result.createdAt', 'DESC')
      .getMany();
    
    // 필요한 필드만 반환
    return results.map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      userMeta: r.userMeta,
    }));
  }

  // 그룹에 속하지 않은 test_results 조회 (그룹에 추가할 후보)
  async getUnassignedResults(userId: number) {
    // getMany()로 전체 엔티티를 가져와야 transformer가 적용됨
    const results = await this.testResultRepository
      .createQueryBuilder('result')
      .where('result.group_id IS NULL')
      .orderBy('result.createdAt', 'DESC')
      .take(100)
      .getMany();
    
    // 필요한 필드만 반환
    return results.map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      userMeta: r.userMeta,
    }));
  }

}

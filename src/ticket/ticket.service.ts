import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { Ticket } from './ticket.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Group } from 'src/group/group.entity';

@Injectable()
export class TicketService {
    constructor(
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        @InjectRepository(Group)
        private groupRepository: Repository<Group>,
    ){}

    // 티켓을 특정 그룹으로 배정하기
    async assignTicketToGroup(userId: number, dto: AssignTicketDto) {
        

        // 1. 티켓 확인 (내가 산 티켓인가? + 아직 안 썼나?)
        const ticket = await this.ticketRepository.findOne({
            where: { ticketId: dto.ticketId },
            relations: ['order', 'order.user'],
        });

        if (!ticket) throw new NotFoundException('티켓을 찾을 수 없습니다.');
        if (ticket.order.user.userId !== userId) throw new NotFoundException('본인의 티켓만 이동할 수 있습니다.');
        if (ticket.status !== 'AVAILABLE') throw new NotFoundException('이미 사용된 티켓은 이동할 수 없습니다.');

        // 2. 그룹 확인 (내가 관리하는 그룹인가?)
        const group = await this.groupRepository.findOne({
            where: { groupId: dto.targetGroupId, admin: { userId} },
        });

        // 3. 이동 업데이트
        ticket.group = group;
        return await this.ticketRepository.save(ticket);
    }

    // 내가 사용 가능한 티켓 검색
    async findMyAvailableTickets(userId: number) {
        return this.ticketRepository.find({
        where: {
            order: { user: { userId } }, // 내가 산 것
            group: IsNull(),             // 그룹에 안 속한 것 (개인용 인벤토리)
            status: 'AVAILABLE',         // 아직 안 쓴 것
        },
        relations: ['product'], // 상품명 표시용
        order: { createdAt: 'DESC' },
        });
    }

    async validateTicketByCode(code: string) {
        const ticket = await this.ticketRepository.findOne({
            where: { code },
            relations: ['product', 'product.contents', 'product.contents.test', 'order', 'order.user'],
        
        });

        if (!ticket) {
            throw new NotFoundException('티켓을 찾을 수 없습니다.');
        } 
        if (ticket.status !== 'AVAILABLE') {
            throw new BadRequestException('이미 사용되었거나 만료된 티켓입니다.');
        }

        // 디버깅 로그
        console.log('🎫 티켓 검증 - product:', ticket.product?.name);
        console.log('🎫 티켓 검증 - contents:', ticket.product?.contents?.map(c => ({
            id: c.id,
            testId: c.test?.id,
            testSlug: c.test?.slug,
            testName: c.test?.name,
        })));

        // 첫 번째 검사의 slug를 기본 testSlug로 사용
        const firstTest = ticket.product.contents?.[0]?.test;
        const testSlug = firstTest?.slug || 'behavior-adult';
        
        console.log('🎫 선택된 testSlug:', testSlug);

        // 보안상 필요한 정보만 리턴
        return {
            ticketId: ticket.ticketId,
            clientName: ticket.clientName,
            productName: ticket.product.name,
            tests: ticket.product.contents.map(c => c.test.name), // 검사 목록
            testSlug, // 검사 slug (프론트에서 질문 로드에 사용)
            testSlugs: ticket.product.contents.map(c => c.test.slug), // 모든 검사 slug 목록
            purchaserName: ticket.order?.user?.name,
            role: ticket.order?.user?.role,
            status: ticket.order?.user?.status
        }
    }
}


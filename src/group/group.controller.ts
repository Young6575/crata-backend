import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateGroupDto } from './dto/create-group.dto';
import { AssignTicketDto } from 'src/ticket/dto/assign-ticket.dto';
import { TicketService } from 'src/ticket/ticket.service';

@Controller('group')
@UseGuards(AuthGuard('jwt'))
export class GroupController {
    
  constructor(
    private readonly groupService: GroupService,
    private readonly ticketService: TicketService,
  ) {}

  @Get('my')
  async getMyGroups(@Req() req) {
    return this.groupService.findMyGroups(req.user.userId);
  }

  @Get(':id')
  async getGroupDetail(@Req() req, @Param('id') id: string) {
    return this.groupService.findGroupDetail(req.user.userId, Number(id));
  }

  @Post()
  async createGroup(@Req() req, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(req.user.userId, dto);
  }

  @Patch('assign')
  async assignTicket(@Req() req, @Body() dto: AssignTicketDto){
    await this.ticketService.assignTicketToGroup(req.user.userId, dto);
    return { success: true, message: '티켓이 성공적으로 그룹으로 이동되었습니다.' };
  }

  // test_results를 그룹에 추가
  @Patch(':id/results')
  async addResultsToGroup(
    @Req() req, 
    @Param('id') id: string,
    @Body() body: { resultIds: string[] }
  ) {
    return this.groupService.addResultsToGroup(req.user.userId, Number(id), body.resultIds);
  }

  // test_results를 그룹에서 제외
  @Patch(':id/results/remove')
  async removeResultsFromGroup(
    @Req() req, 
    @Param('id') id: string,
    @Body() body: { resultIds: string[] }
  ) {
    return this.groupService.removeResultsFromGroup(req.user.userId, Number(id), body.resultIds);
  }

  // 그룹에 속한 결과 목록 조회
  @Get(':id/results')
  async getGroupResults(@Req() req, @Param('id') id: string) {
    return this.groupService.getGroupResults(req.user.userId, Number(id));
  }

  // 그룹에 속하지 않은 결과 목록 조회
  @Get('unassigned/results')
  async getUnassignedResults(@Req() req) {
    return this.groupService.getUnassignedResults(req.user.userId);
  }
}

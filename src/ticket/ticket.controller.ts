import { BadRequestException, Body, Controller, Get, Inject, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { AuthGuard } from '@nestjs/passport';
import { AssignTicketDto } from './dto/assign-ticket.dto';

@Controller('ticket')
export class TicketController {
    constructor(
        @Inject(TicketService)
        private ticketService: TicketService
    ) {}

    @UseGuards(AuthGuard('jwt'))
    @Get('available')
    async getMyAvailableTickets(@Req() req) {
        return this.ticketService.findMyAvailableTickets(req.user.userId);
    }

    @Get('validate')
    async validateTicket(@Query('code') code: string) {
        if (!code) throw new BadRequestException('검사 티켓 코드가 없습니다');
        return this.ticketService.validateTicketByCode(code);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('assign-to-group')
    async assignTicketToGroup(@Req() req, @Body() dto: AssignTicketDto) {
        return this.ticketService.assignTicketToGroup(req.user.userId, dto);
    }
}

import { Module } from '@nestjs/common';
import { Ticket } from './ticket.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { Group } from 'src/group/group.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Ticket, Group])
    ],
    providers: [TicketService],
    controllers: [TicketController],
    exports: [TicketService]
})
export class TicketModule {}

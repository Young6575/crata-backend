import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignTicketDto {
  @IsNotEmpty()
  ticketId: number; // 이동할 티켓 ID (bigint이므로 number나 string)

  @IsNotEmpty()
  targetGroupId: number; // 이동할 목적지 그룹 ID
}
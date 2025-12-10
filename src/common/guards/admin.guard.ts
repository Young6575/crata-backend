import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('인증이 필요합니다.');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }

    return true;
  }
}

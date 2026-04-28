import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { EventStaff } from '../../events/entities/event-staff.entity';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

interface RequestBody {
  eventId?: string;
}

@Injectable()
export class EventAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(EventStaff)
    private readonly eventStaffRepo: Repository<EventStaff>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser; body?: RequestBody }>();

    const user = req.user;

    // ADMIN bypasses the per-event check
    if (user?.role === 'ADMIN') return true;

    const paramEventId = req.params['eventId'] as string | undefined;
    const body = req.body as RequestBody | undefined;
    const bodyEventId = body?.eventId;
    const rawId = paramEventId ?? bodyEventId;

    if (!rawId) throw new ForbiddenException('Event ID is required');

    const numericEventId = Number(rawId);
    if (isNaN(numericEventId)) throw new ForbiddenException('Invalid event ID');

    const assignment = await this.eventStaffRepo.findOne({
      where: { event_id: numericEventId, user_id: user.id },
    });

    if (!assignment) throw new ForbiddenException('Not assigned to this event');

    return true;
  }
}

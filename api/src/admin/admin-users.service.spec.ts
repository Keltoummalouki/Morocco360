/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));

import { AdminUsersService } from './admin-users.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { Role, RoleName } from '../users/entities/role.entity';
import { Event } from '../events/entities/event.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { Order } from '../orders/entities/order.entity';

function chainableQb(rows: unknown[], total: number) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['leftJoinAndSelect', 'andWhere', 'orderBy', 'skip', 'take']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getManyAndCount = jest.fn().mockResolvedValue([rows, total]);
  return qb;
}

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let eventRepo: jest.Mocked<Repository<Event>>;
  let staffRepo: jest.Mocked<Repository<EventStaff>>;

  beforeEach(async () => {
    const repo = () => ({
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((v: unknown) => v),
      save: jest.fn((v: unknown) => Promise.resolve(v)),
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: getRepositoryToken(User), useValue: repo() },
        { provide: getRepositoryToken(Role), useValue: repo() },
        { provide: getRepositoryToken(Event), useValue: repo() },
        { provide: getRepositoryToken(EventStaff), useValue: repo() },
        { provide: getRepositoryToken(Order), useValue: repo() },
      ],
    }).compile();

    service = module.get(AdminUsersService);
    userRepo = module.get(getRepositoryToken(User));
    roleRepo = module.get(getRepositoryToken(Role));
    eventRepo = module.get(getRepositoryToken(Event));
    staffRepo = module.get(getRepositoryToken(EventStaff));
  });

  describe('list', () => {
    it('scopes by role and applies status + search filters', async () => {
      const qb = chainableQb([], 0);
      userRepo.createQueryBuilder.mockReturnValue(qb as never);

      await service.list(
        { page: 1, limit: 20, status: UserStatus.ACTIVE, search: 'ali' },
        RoleName.ORGANIZER,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('r.name = :role', {
        role: RoleName.ORGANIZER,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('u.status = :status', {
        status: UserStatus.ACTIVE,
      });
    });
  });

  describe('create', () => {
    it('rejects a duplicate email', async () => {
      userRepo.findOne.mockImplementation((opts: unknown) => {
        const where = (opts as { where?: { email?: string } }).where;
        return Promise.resolve(where?.email ? ({ id: 2 } as User) : null);
      });

      await expect(
        service.create(
          { username: 'a', email: 'dup@x.com', password: 'Passw0rd' },
          RoleName.USER,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password and assigns the role', async () => {
      userRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue({ id: 1, name: RoleName.STAFF } as Role);

      await service.create(
        { username: 'newstaff', email: 's@x.com', password: 'Passw0rd' },
        RoleName.STAFF,
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('Passw0rd', 12);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed', status: UserStatus.ACTIVE }),
      );
    });
  });

  describe('setStatus', () => {
    it('clears the refresh token when suspending', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 3,
        status: UserStatus.ACTIVE,
        refresh_token_hash: 'tok',
      } as User);

      await service.setStatus(3, UserStatus.SUSPENDED);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: UserStatus.SUSPENDED,
          refresh_token_hash: null,
        }),
      );
    });
  });

  describe('getOrganizerEvents', () => {
    it('merges created and assigned events without duplicates', async () => {
      userRepo.findOne.mockResolvedValue({ id: 9 } as User);
      eventRepo.find.mockResolvedValue([
        { id: 1, title: 'Created', date_start: new Date() } as Event,
      ]);
      staffRepo.find.mockResolvedValue([
        { event: { id: 1, title: 'Created' } } as EventStaff, // dup of created
        { event: { id: 2, title: 'Assigned' } } as EventStaff,
      ]);

      const events = (await service.getOrganizerEvents(9)) as {
        id: number;
        source: string;
      }[];

      expect(events).toHaveLength(2);
      expect(events.find((e) => e.id === 1)?.source).toBe('created');
      expect(events.find((e) => e.id === 2)?.source).toBe('assigned');
    });
  });
});

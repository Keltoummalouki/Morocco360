import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { EventsController } from '../src/events/events.controller';
import { EventsService } from '../src/events/events.service';
import { Event } from '../src/events/entities/event.entity';
import { TicketCategory } from '../src/events/entities/ticket-category.entity';
import { User } from '../src/users/entities/user.entity';

// ── Fixtures ──────────────────────────────────────────────
const mockCategory: TicketCategory = {
  id: 1,
  name: 'General',
  price: 50,
  stock_allocated: 100,
  event: null as unknown as Event,
  tickets: [],
};

const mockEvent: Event = {
  id: 1,
  title: 'Marrakech Jazz Festival',
  description: 'An annual jazz festival in the heart of Marrakech.',
  date_start: new Date('2025-07-15'),
  date_end: new Date('2025-07-17'),
  location_name: 'Jemaa el-Fna, Marrakech',
  latitude: 31.6258,
  longitude: -7.9892,
  image_url: null as unknown as string,
  total_stock: 200,
  is_active: true,
  created_at: new Date(),
  organizer: null as unknown as User,
  categories: [mockCategory],
};

// ── Suite ─────────────────────────────────────────────────
describe('Events endpoints (e2e)', () => {
  let app: INestApplication<App>;

  const eventRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ limit: 1000, ttl: 60_000 }])],
      controllers: [EventsController],
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: eventRepoMock },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET /events ────────────────────────────────────────
  describe('GET /events', () => {
    it('200 – returns an array of active events', async () => {
      eventRepoMock.find.mockResolvedValue([mockEvent]);

      const res = await request(app.getHttpServer()).get('/events').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as Event[]).length).toBe(1);
      expect((res.body as Event[])[0].title).toBe(mockEvent.title);
    });

    it('200 – returns an empty array when no events exist', async () => {
      eventRepoMock.find.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/events').expect(200);

      expect(res.body).toEqual([]);
    });
  });

  // ── GET /events/:id ────────────────────────────────────
  describe('GET /events/:id', () => {
    it('200 – returns the event when found', async () => {
      eventRepoMock.findOne.mockResolvedValue(mockEvent);

      const res = await request(app.getHttpServer())
        .get('/events/1')
        .expect(200);

      expect((res.body as Event).id).toBe(mockEvent.id);
      expect((res.body as Event).title).toBe(mockEvent.title);
    });

    it('404 – returns NotFound when event does not exist', async () => {
      eventRepoMock.findOne.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/events/999').expect(404);
    });

    it('400 – returns BadRequest when id is not a number', async () => {
      await request(app.getHttpServer()).get('/events/abc').expect(400);
    });
  });
});

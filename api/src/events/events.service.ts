import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findAll(): Promise<Event[]> {
    return this.repo.find({
      where: { is_active: true },
      relations: ['categories'],
      order: { date_start: 'ASC' },
    });
  }

  findAllAdmin(): Promise<Event[]> {
    return this.repo.find({
      relations: ['categories'],
      order: { date_start: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.repo.findOne({
      where: { id },
      relations: ['categories', 'organizer'],
    });
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    return event;
  }

  create(dto: CreateEventDto): Promise<Event> {
    const event = this.repo.create(dto);
    return this.repo.save(event);
  }

  async update(id: number, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    const { categories, ...rest } = dto;
    Object.assign(event, rest);
    if (categories !== undefined) {
      event.categories = categories.map((c) =>
        this.repo.manager.create(TicketCategory, c),
      );
    }
    return this.repo.save(event);
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    await this.repo.remove(event);
  }

  async getSaved(userId: number): Promise<Event[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedEvents', 'savedEvents.categories'],
    });
    return user?.savedEvents ?? [];
  }

  async saveEvent(eventId: number, userId: number): Promise<void> {
    const [user, event] = await Promise.all([
      this.userRepo.findOne({
        where: { id: userId },
        relations: ['savedEvents'],
      }),
      this.repo.findOne({ where: { id: eventId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!event) throw new NotFoundException('Event not found');
    if (!user.savedEvents.some((e) => e.id === eventId)) {
      user.savedEvents.push(event);
      await this.userRepo.save(user);
    }
  }

  async unsaveEvent(eventId: number, userId: number): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedEvents'],
    });
    if (!user) throw new NotFoundException('User not found');
    user.savedEvents = user.savedEvents.filter((e) => e.id !== eventId);
    await this.userRepo.save(user);
  }
}

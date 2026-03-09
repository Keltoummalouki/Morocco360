import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
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
}

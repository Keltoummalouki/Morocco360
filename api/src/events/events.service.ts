import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

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

  async findOne(id: number): Promise<Event> {
    const event = await this.repo.findOne({
      where: { id },
      relations: ['categories', 'organizer'],
    });
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    return event;
  }
}

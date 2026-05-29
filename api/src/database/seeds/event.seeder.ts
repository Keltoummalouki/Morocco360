import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Event, EventCategory } from '../../events/entities/event.entity';
import { TicketCategory } from '../../events/entities/ticket-category.entity';
import { User } from '../../users/entities/user.entity';
import {
  EventStaff,
  EventStaffRole,
} from '../../events/entities/event-staff.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';
import { Ticket, TicketStatus } from '../../orders/entities/ticket.entity';

interface SeedCategory {
  name: string;
  price: number;
  stock_allocated: number;
}

interface SeedEvent {
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string;
  category: EventCategory;
  latitude: number;
  longitude: number;
  total_stock: number;
  categories: SeedCategory[];
}

const SEED_EVENTS: SeedEvent[] = [
  {
    title: 'Marrakech Jazz Festival',
    description:
      'Festival annuel de jazz reunissant des artistes nationaux et internationaux' +
      ' au coeur de la place Jemaa el-Fna. Trois jours de musique live, ateliers et jam sessions.',
    date_start: '2025-07-15',
    date_end: '2025-07-17',
    location_name: 'Jemaa el-Fna, Marrakech',
    city: 'Marrakech',
    category: EventCategory.MUSIQUE,
    latitude: 31.6258,
    longitude: -7.9892,
    total_stock: 1500,
    categories: [
      { name: 'Entree generale', price: 150, stock_allocated: 1000 },
      { name: 'VIP', price: 450, stock_allocated: 300 },
      { name: 'Pass 3 jours', price: 350, stock_allocated: 200 },
    ],
  },
  {
    title: 'Festival des Musiques Sacrees de Fes',
    description:
      'Le celebre festival de musiques sacrees du monde qui transforme la medina de Fes en' +
      ' scene internationale. Concerts dans les palais, les mosquees et les jardins historiques.',
    date_start: '2025-06-06',
    date_end: '2025-06-14',
    location_name: 'Medina de Fes',
    city: 'Fès',
    category: EventCategory.MUSIQUE,
    latitude: 34.0609,
    longitude: -4.9816,
    total_stock: 3000,
    categories: [
      { name: 'Concert soir', price: 200, stock_allocated: 2000 },
      { name: 'Pass festival complet', price: 1200, stock_allocated: 500 },
      { name: 'Loges VIP', price: 600, stock_allocated: 500 },
    ],
  },
  {
    title: 'Gnaoua World Music Festival',
    description:
      'Le festival Gnaoua est un grand rassemblement de musique mondiale base a Essaouira.' +
      ' Fusion unique entre les maalems gnaoua et les artistes world music.',
    date_start: '2025-06-26',
    date_end: '2025-06-29',
    location_name: 'Essaouira',
    city: 'Essaouira',
    category: EventCategory.MUSIQUE,
    latitude: 31.5085,
    longitude: -9.7595,
    total_stock: 5000,
    categories: [
      { name: 'Acces libre scene principale', price: 0, stock_allocated: 3000 },
      { name: 'Espace premium', price: 300, stock_allocated: 1500 },
      { name: 'Pass VIP podium', price: 800, stock_allocated: 500 },
    ],
  },
  {
    title: 'Mawazine — Rythmes du Monde',
    description:
      'Un des plus grands festivals de musique en Afrique. Stars mondiales et artistes' +
      ' arabes se retrouvent a Rabat pour dix jours de concerts gratuits et payants.',
    date_start: '2025-05-23',
    date_end: '2025-06-01',
    location_name: 'Rabat — Scenes OLM Souissi & Bouregreg',
    city: 'Rabat',
    category: EventCategory.MUSIQUE,
    latitude: 34.0209,
    longitude: -6.8417,
    total_stock: 10000,
    categories: [
      { name: 'Scene gratuite', price: 0, stock_allocated: 7000 },
      { name: 'Tribune OLM', price: 250, stock_allocated: 2000 },
      { name: 'Carre or', price: 700, stock_allocated: 1000 },
    ],
  },
  {
    title: 'Tanjazz — Festival International de Jazz de Tanger',
    description:
      'Festival de jazz emblematique dans la ville detroit. Concerts en plein air' +
      ' au Jardin de la Mendoubia et dans les clubs historiques de Tanger.',
    date_start: '2025-09-18',
    date_end: '2025-09-21',
    location_name: 'Jardin de la Mendoubia, Tanger',
    city: 'Tanger',
    category: EventCategory.MUSIQUE,
    latitude: 35.7595,
    longitude: -5.834,
    total_stock: 2000,
    categories: [
      { name: 'Entree soiree', price: 100, stock_allocated: 1500 },
      { name: 'Pass 4 nuits', price: 300, stock_allocated: 400 },
      { name: 'Table VIP', price: 600, stock_allocated: 100 },
    ],
  },
  {
    title: 'Festival du Cinema de Marrakech',
    description:
      'Un des festivals de cinema les plus prestigieux en Afrique et dans le monde arabe.' +
      " Projections, rencontres avec les realisateurs et ceremonie de remise de l'Etoile d'Or.",
    date_start: '2025-11-28',
    date_end: '2025-12-06',
    location_name: 'Palais des Congres, Marrakech',
    city: 'Marrakech',
    category: EventCategory.CINEMA,
    latitude: 31.634,
    longitude: -7.9956,
    total_stock: 4000,
    categories: [
      { name: 'Seance unique', price: 80, stock_allocated: 2500 },
      { name: 'Pass semaine', price: 400, stock_allocated: 1000 },
      { name: 'Pass presse/industrie', price: 1000, stock_allocated: 500 },
    ],
  },
  {
    title: 'Marathon des Sables',
    description:
      'La course a pied la plus dure du monde — 250 km en six etapes dans le Sahara marocain.' +
      " Participation internationale, paysages grandioses, defi ultime d'endurance.",
    date_start: '2025-04-11',
    date_end: '2025-04-20',
    location_name: "Desert du Sahara, region d'Ouarzazate",
    city: 'Ouarzazate',
    category: EventCategory.SPORT,
    latitude: 30.9335,
    longitude: -6.937,
    total_stock: 1000,
    categories: [
      { name: 'Inscription coureur', price: 3500, stock_allocated: 900 },
      {
        name: 'Pack supporter acces bivouac',
        price: 500,
        stock_allocated: 100,
      },
    ],
  },
  {
    title: 'Rallye Aicha des Gazelles',
    description:
      'Rallye 100% feminin a travers les dunes, les rochers et les pistes du Maroc.' +
      ' Navigation a la boussole et a la carte, sans GPS, pour des equipages de 2 femmes.',
    date_start: '2025-03-15',
    date_end: '2025-03-26',
    location_name: 'Depart Agadir — arrivee Essaouira',
    city: 'Agadir',
    category: EventCategory.SPORT,
    latitude: 30.4278,
    longitude: -9.5981,
    total_stock: 600,
    categories: [
      { name: 'Inscription equipage', price: 7500, stock_allocated: 500 },
      { name: 'Badge supporter', price: 200, stock_allocated: 100 },
    ],
  },
  {
    title: 'Marrakech du Rire',
    description:
      "Grand festival de l'humour initie par Jamel Debbouze. Les plus grands comiques" +
      ' francophones se retrouvent a Marrakech pour des spectacles et fous rires garantis.',
    date_start: '2025-06-19',
    date_end: '2025-06-22',
    location_name: 'Palmeraie et scenes ouvertes, Marrakech',
    city: 'Marrakech',
    category: EventCategory.HUMOUR,
    latitude: 31.6889,
    longitude: -7.9525,
    total_stock: 3000,
    categories: [
      { name: 'Carre standard', price: 350, stock_allocated: 2000 },
      { name: 'Carre prestige', price: 700, stock_allocated: 800 },
      { name: 'Loge VIP', price: 1500, stock_allocated: 200 },
    ],
  },
  {
    title: 'Atlas Electronic',
    description:
      "Festival de musique electronique au pied des montagnes de l'Atlas." +
      ' Sets 24h dans un cadre naturel unique, camping sur site et line-up international.',
    date_start: '2025-10-03',
    date_end: '2025-10-05',
    location_name: "Domaine Ourika, pied de l'Atlas",
    city: 'Marrakech',
    category: EventCategory.MUSIQUE,
    latitude: 31.3553,
    longitude: -7.8543,
    total_stock: 2500,
    categories: [
      { name: 'Ticket jour', price: 200, stock_allocated: 1500 },
      { name: 'Pass 3 jours', price: 450, stock_allocated: 800 },
      { name: 'Pass 3 jours + camping', price: 600, stock_allocated: 200 },
    ],
  },
];

@Injectable()
export class EventSeeder {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(TicketCategory)
    private readonly categoryRepo: Repository<TicketCategory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EventStaff)
    private readonly staffRepo: Repository<EventStaff>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async seed(): Promise<void> {
    const organizer = await this.userRepo.findOne({
      where: { email: 'organizer@morocco360.ma' },
    });
    if (!organizer) {
      console.warn(
        '  [EventSeeder] Organizer user not found — run user seeder first',
      );
      return;
    }

    const testUser = await this.userRepo.findOne({
      where: { email: 'user@morocco360.ma' },
    });

    let firstEvent: Event | null = null;

    for (const data of SEED_EVENTS) {
      const exists = await this.eventRepo.findOne({
        where: { title: data.title },
      });
      if (exists) {
        console.log(`  [EventSeeder] Event already exists: ${data.title}`);
        if (!firstEvent) firstEvent = exists;
        continue;
      }

      const event = this.eventRepo.create({
        title: data.title,
        description: data.description,
        date_start: new Date(data.date_start),
        date_end: new Date(data.date_end),
        location_name: data.location_name,
        city: data.city,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        total_stock: data.total_stock,
        is_active: true,
        organizer,
      });
      const savedEvent = await this.eventRepo.save(event);

      for (const cat of data.categories) {
        await this.categoryRepo.save(
          this.categoryRepo.create({ ...cat, event: savedEvent }),
        );
      }

      if (!firstEvent) firstEvent = savedEvent;
      console.log(`  [EventSeeder] Created event: ${data.title}`);
    }

    if (!firstEvent) return;

    // Assign organizer as ORGANIZER for first event
    await this.upsertStaff(
      firstEvent,
      organizer,
      EventStaffRole.ORGANIZER,
      organizer,
    );

    // Seed 10 VALID tickets with valid HMAC QR codes for the test user
    if (testUser) await this.seedTickets(firstEvent, testUser);
  }

  private async upsertStaff(
    event: Event,
    user: User,
    role: EventStaffRole,
    by: User,
  ) {
    const exists = await this.staffRepo.findOne({
      where: { event_id: event.id, user_id: user.id },
    });
    if (exists) {
      console.log(`  [EventSeeder] Staff already assigned: ${user.email}`);
      return;
    }
    await this.staffRepo.save(
      this.staffRepo.create({
        event,
        event_id: event.id,
        user,
        user_id: user.id,
        staff_role: role,
        assigned_by: by,
        assigned_by_user_id: by.id,
      }),
    );
    console.log(
      `  [EventSeeder] Assigned ${user.email} as ${role} for "${event.title}"`,
    );
  }

  private async seedTickets(event: Event, user: User) {
    const existing = await this.orderRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (existing) {
      console.log('  [EventSeeder] Sample order already exists');
      return;
    }

    const category = await this.categoryRepo.findOne({
      where: { event: { id: event.id } },
    });
    if (!category) return;

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        user,
        total_amount: category.price * 10,
        status: OrderStatus.PAID,
      }),
    );

    const secret = process.env.QR_HMAC_SECRET;

    for (let i = 0; i < 10; i++) {
      const saved = await this.ticketRepo.save(
        this.ticketRepo.create({
          order,
          category,
          event,
          event_id: event.id,
          status: TicketStatus.VALID,
          qr_code: `PLACEHOLDER-${Date.now()}-${i}`,
        }),
      );
      const raw = JSON.stringify({ t: String(saved.id), e: String(event.id) });
      const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
      const qr = Buffer.from(
        JSON.stringify({ t: String(saved.id), e: String(event.id), sig }),
      ).toString('base64url');
      await this.ticketRepo.update(saved.id, { qr_code: qr });
    }
    console.log(
      `  [EventSeeder] Created 10 sample VALID tickets for "${event.title}"`,
    );
  }
}

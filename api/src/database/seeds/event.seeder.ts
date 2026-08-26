import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Event,
  EventCategory,
  EventStatus,
} from '../../events/entities/event.entity';
import { TicketCategory } from '../../events/entities/ticket-category.entity';
import { User } from '../../users/entities/user.entity';
import {
  EventStaff,
  EventStaffRole,
} from '../../events/entities/event-staff.entity';
import { daysFromNow } from './seed.utils';

interface SeedTicketCategory {
  name: string;
  price: number;
  stock_allocated: number;
}

interface SeedEvent {
  title: string;
  description: string;
  /** Days from "now" — negative for past events. Keeps the dataset evergreen. */
  starts_in_days: number;
  duration_days: number;
  location_name: string;
  city: string;
  category: EventCategory;
  status: EventStatus;
  latitude: number;
  longitude: number;
  image_url: string;
  total_stock: number;
  /** Email of the owning organizer. */
  organizer: string;
  /** Emails of the scanning staff assigned to this event. */
  staff: string[];
  categories: SeedTicketCategory[];
}

const ORGANIZER_1 = 'organizer@eventhub.com';
const ORGANIZER_2 = 'organizer2@eventhub.com';
const STAFF_1 = 'staff@eventhub.com';
const STAFF_2 = 'staff2@eventhub.com';

const SEED_EVENTS: SeedEvent[] = [
  {
    title: 'Atlas Electronic',
    description:
      "Festival de musique electronique au pied des montagnes de l'Atlas." +
      ' Sets 24h dans un cadre naturel unique, camping sur site et line-up international.',
    starts_in_days: 3,
    duration_days: 3,
    location_name: "Domaine Ourika, pied de l'Atlas",
    city: 'Marrakech',
    category: EventCategory.MUSIQUE,
    status: EventStatus.ACTIVE,
    latitude: 31.3553,
    longitude: -7.8543,
    image_url: '/events/hero-marrakech.webp',
    total_stock: 2500,
    organizer: ORGANIZER_2,
    staff: [STAFF_1, STAFF_2],
    categories: [
      { name: 'Ticket jour', price: 200, stock_allocated: 1500 },
      { name: 'Pass 3 jours', price: 450, stock_allocated: 800 },
      { name: 'Pass 3 jours + camping', price: 600, stock_allocated: 200 },
    ],
  },
  {
    title: 'Marrakech Jazz Festival',
    description:
      'Festival annuel de jazz reunissant des artistes nationaux et internationaux' +
      ' au coeur de la place Jemaa el-Fna. Trois jours de musique live, ateliers et jam sessions.',
    starts_in_days: 12,
    duration_days: 3,
    location_name: 'Jemaa el-Fna, Marrakech',
    city: 'Marrakech',
    category: EventCategory.MUSIQUE,
    status: EventStatus.ACTIVE,
    latitude: 31.6258,
    longitude: -7.9892,
    image_url: '/events/hero-marrakech.webp',
    total_stock: 1500,
    organizer: ORGANIZER_1,
    staff: [STAFF_1],
    categories: [
      { name: 'Entree generale', price: 150, stock_allocated: 1000 },
      { name: 'VIP', price: 450, stock_allocated: 300 },
      { name: 'Pass 3 jours', price: 350, stock_allocated: 200 },
    ],
  },
  {
    title: 'Nuit du Patrimoine de Chefchaouen',
    description:
      'Une nuit blanche dans la ville bleue : visites guidees des riads historiques,' +
      ' concerts de musique andalouse et ateliers artisanaux dans la medina.',
    starts_in_days: 18,
    duration_days: 2,
    location_name: 'Medina de Chefchaouen',
    city: 'Chefchaouen',
    category: EventCategory.CULTURE,
    status: EventStatus.SOLD_OUT,
    latitude: 35.1688,
    longitude: -5.2636,
    image_url: '/events/medina.webp',
    total_stock: 400,
    organizer: ORGANIZER_1,
    staff: [STAFF_2],
    categories: [
      { name: 'Parcours patrimoine', price: 120, stock_allocated: 300 },
      { name: 'Parcours + diner', price: 350, stock_allocated: 100 },
    ],
  },
  {
    title: "Biennale d'Art Contemporain de Casablanca",
    description:
      "Trois semaines d'expositions, d'installations urbaines et de performances" +
      ' portees par des artistes marocains et africains dans toute la ville blanche.',
    starts_in_days: 30,
    duration_days: 20,
    location_name: 'Abattoirs de Casablanca',
    city: 'Casablanca',
    category: EventCategory.ART,
    status: EventStatus.DRAFT,
    latitude: 33.5731,
    longitude: -7.5898,
    image_url: '/events/casa.webp',
    total_stock: 1200,
    organizer: ORGANIZER_2,
    staff: [],
    categories: [
      { name: 'Entree journee', price: 80, stock_allocated: 900 },
      { name: 'Pass biennale', price: 250, stock_allocated: 300 },
    ],
  },
  {
    title: 'Gnaoua World Music Festival',
    description:
      'Le festival Gnaoua est un grand rassemblement de musique mondiale base a Essaouira.' +
      ' Fusion unique entre les maalems gnaoua et les artistes world music.',
    starts_in_days: 40,
    duration_days: 4,
    location_name: 'Essaouira',
    city: 'Essaouira',
    category: EventCategory.MUSIQUE,
    status: EventStatus.ACTIVE,
    latitude: 31.5085,
    longitude: -9.7595,
    image_url: '/events/gnaoua.webp',
    total_stock: 5000,
    organizer: ORGANIZER_2,
    staff: [STAFF_2],
    categories: [
      { name: 'Acces libre scene principale', price: 0, stock_allocated: 3000 },
      { name: 'Espace premium', price: 300, stock_allocated: 1500 },
      { name: 'Pass VIP podium', price: 800, stock_allocated: 500 },
    ],
  },
  {
    title: 'Festival des Cerises de Sefrou',
    description:
      'Fete populaire classee au patrimoine immateriel de l’UNESCO : defiles,' +
      ' fanfares et election de la Reine des cerises.',
    starts_in_days: 50,
    duration_days: 3,
    location_name: 'Centre-ville de Sefrou',
    city: 'Meknès',
    category: EventCategory.AUTRE,
    status: EventStatus.CANCELLED,
    latitude: 33.8302,
    longitude: -4.8358,
    image_url: '/events/medina.webp',
    total_stock: 800,
    organizer: ORGANIZER_2,
    staff: [],
    categories: [{ name: 'Entree', price: 50, stock_allocated: 800 }],
  },
  {
    title: 'Mawazine — Rythmes du Monde',
    description:
      'Un des plus grands festivals de musique en Afrique. Stars mondiales et artistes' +
      ' arabes se retrouvent a Rabat pour dix jours de concerts gratuits et payants.',
    starts_in_days: 60,
    duration_days: 10,
    location_name: 'Rabat — Scenes OLM Souissi & Bouregreg',
    city: 'Rabat',
    category: EventCategory.MUSIQUE,
    status: EventStatus.ACTIVE,
    latitude: 34.0209,
    longitude: -6.8417,
    image_url: '/events/casa.webp',
    total_stock: 10000,
    organizer: ORGANIZER_1,
    staff: [STAFF_2],
    categories: [
      { name: 'Scene gratuite', price: 0, stock_allocated: 7000 },
      { name: 'Tribune OLM', price: 250, stock_allocated: 2000 },
      { name: 'Carre or', price: 700, stock_allocated: 1000 },
    ],
  },
  {
    title: 'Surf Contest Taghazout',
    description:
      'Competition internationale de surf sur les spots mythiques de Taghazout,' +
      ' avec animations plage, marche artisanal et concerts au coucher du soleil.',
    starts_in_days: 75,
    duration_days: 4,
    location_name: 'Spot Anchor Point, Taghazout',
    city: 'Agadir',
    category: EventCategory.SPORT,
    status: EventStatus.SUSPENDED,
    latitude: 30.5453,
    longitude: -9.7101,
    image_url: '/events/taghazout.webp',
    total_stock: 1200,
    organizer: ORGANIZER_1,
    staff: [],
    categories: [
      { name: 'Spectateur', price: 60, stock_allocated: 1000 },
      { name: 'Inscription rider', price: 450, stock_allocated: 200 },
    ],
  },
  {
    title: 'Festival des Musiques Sacrees de Fes',
    description:
      'Le celebre festival de musiques sacrees du monde qui transforme la medina de Fes en' +
      ' scene internationale. Concerts dans les palais, les mosquees et les jardins historiques.',
    starts_in_days: 95,
    duration_days: 9,
    location_name: 'Medina de Fes',
    city: 'Fès',
    category: EventCategory.MUSIQUE,
    status: EventStatus.ACTIVE,
    latitude: 34.0609,
    longitude: -4.9816,
    image_url: '/events/medina.webp',
    total_stock: 3000,
    organizer: ORGANIZER_1,
    staff: [STAFF_1],
    categories: [
      { name: 'Concert soir', price: 200, stock_allocated: 2000 },
      { name: 'Pass festival complet', price: 1200, stock_allocated: 500 },
      { name: 'Loges VIP', price: 600, stock_allocated: 500 },
    ],
  },
  {
    title: 'Tanjazz — Festival International de Jazz de Tanger',
    description:
      'Festival de jazz emblematique dans la ville detroit. Concerts en plein air' +
      ' au Jardin de la Mendoubia et dans les clubs historiques de Tanger.',
    starts_in_days: 140,
    duration_days: 4,
    location_name: 'Jardin de la Mendoubia, Tanger',
    city: 'Tanger',
    category: EventCategory.MUSIQUE,
    status: EventStatus.ACTIVE,
    latitude: 35.7595,
    longitude: -5.834,
    image_url: '/events/medina.webp',
    total_stock: 2000,
    organizer: ORGANIZER_2,
    staff: [STAFF_1],
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
    starts_in_days: 180,
    duration_days: 9,
    location_name: 'Palais des Congres, Marrakech',
    city: 'Marrakech',
    category: EventCategory.CINEMA,
    status: EventStatus.ACTIVE,
    latitude: 31.634,
    longitude: -7.9956,
    image_url: '/events/hero-marrakech.webp',
    total_stock: 4000,
    organizer: ORGANIZER_1,
    staff: [STAFF_1],
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
    starts_in_days: 220,
    duration_days: 10,
    location_name: "Desert du Sahara, region d'Ouarzazate",
    city: 'Ouarzazate',
    category: EventCategory.SPORT,
    status: EventStatus.ACTIVE,
    latitude: 30.9335,
    longitude: -6.937,
    image_url: '/events/taghazout.webp',
    total_stock: 1000,
    organizer: ORGANIZER_2,
    staff: [STAFF_2],
    categories: [
      { name: 'Inscription coureur', price: 3500, stock_allocated: 900 },
      {
        name: 'Pack supporter acces bivouac',
        price: 500,
        stock_allocated: 100,
      },
    ],
  },

  // ── Past events — feed the booking history, reviews and check-in stats ──
  {
    title: 'Marrakech du Rire',
    description:
      "Grand festival de l'humour initie par Jamel Debbouze. Les plus grands comiques" +
      ' francophones se retrouvent a Marrakech pour des spectacles et fous rires garantis.',
    starts_in_days: -12,
    duration_days: 4,
    location_name: 'Palmeraie et scenes ouvertes, Marrakech',
    city: 'Marrakech',
    category: EventCategory.HUMOUR,
    status: EventStatus.ACTIVE,
    latitude: 31.6889,
    longitude: -7.9525,
    image_url: '/events/hero-marrakech.webp',
    total_stock: 3000,
    organizer: ORGANIZER_1,
    staff: [STAFF_1],
    categories: [
      { name: 'Carre standard', price: 350, stock_allocated: 2000 },
      { name: 'Carre prestige', price: 700, stock_allocated: 800 },
      { name: 'Loge VIP', price: 1500, stock_allocated: 200 },
    ],
  },
  {
    title: 'Rallye Aicha des Gazelles',
    description:
      'Rallye 100% feminin a travers les dunes, les rochers et les pistes du Maroc.' +
      ' Navigation a la boussole et a la carte, sans GPS, pour des equipages de 2 femmes.',
    starts_in_days: -30,
    duration_days: 12,
    location_name: 'Depart Agadir — arrivee Essaouira',
    city: 'Agadir',
    category: EventCategory.SPORT,
    status: EventStatus.ACTIVE,
    latitude: 30.4278,
    longitude: -9.5981,
    image_url: '/events/taghazout.webp',
    total_stock: 600,
    organizer: ORGANIZER_2,
    staff: [STAFF_2],
    categories: [
      { name: 'Inscription equipage', price: 7500, stock_allocated: 500 },
      { name: 'Badge supporter', price: 200, stock_allocated: 100 },
    ],
  },
  {
    title: "Festival des Roses de Kelaat M'Gouna",
    description:
      'Trois jours de fete au coeur de la vallee des roses : chars fleuris, danses' +
      ' ahidous, souk des distillateurs et election de la Reine des roses.',
    starts_in_days: -55,
    duration_days: 3,
    location_name: "Kelaat M'Gouna, vallee du Dades",
    city: 'Ouarzazate',
    category: EventCategory.CULTURE,
    status: EventStatus.ACTIVE,
    latitude: 31.2394,
    longitude: -6.1361,
    image_url: '/events/medina.webp',
    total_stock: 900,
    organizer: ORGANIZER_1,
    staff: [STAFF_1],
    categories: [
      { name: 'Entree festival', price: 70, stock_allocated: 700 },
      { name: 'Circuit vallee guide', price: 400, stock_allocated: 200 },
    ],
  },
];

/** Public-site flags derived from the admin lifecycle status. */
function flagsForStatus(status: EventStatus) {
  return {
    is_active: status === EventStatus.ACTIVE,
    is_sold_out: status === EventStatus.SOLD_OUT,
  };
}

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
  ) {}

  async seed(): Promise<void> {
    const users = await this.userRepo.find();
    const userByEmail = new Map(users.map((u) => [u.email, u]));

    for (const data of SEED_EVENTS) {
      const organizer = userByEmail.get(data.organizer);
      if (!organizer) {
        console.warn(
          `  [EventSeeder] Organizer not found: ${data.organizer} — run user seeder first`,
        );
        continue;
      }

      let event = await this.eventRepo.findOne({
        where: { title: data.title },
      });
      if (event) {
        console.log(`  [EventSeeder] Event already exists: ${data.title}`);
      } else {
        event = await this.eventRepo.save(
          this.eventRepo.create({
            title: data.title,
            description: data.description,
            date_start: daysFromNow(data.starts_in_days),
            date_end: daysFromNow(data.starts_in_days + data.duration_days),
            location_name: data.location_name,
            city: data.city,
            category: data.category,
            latitude: data.latitude,
            longitude: data.longitude,
            image_url: data.image_url,
            total_stock: data.total_stock,
            status: data.status,
            ...flagsForStatus(data.status),
            organizer,
          }),
        );
        for (const cat of data.categories) {
          await this.categoryRepo.save(
            this.categoryRepo.create({ ...cat, event }),
          );
        }
        console.log(`  [EventSeeder] Created event: ${data.title}`);
      }

      await this.upsertStaff(
        event,
        organizer,
        EventStaffRole.ORGANIZER,
        organizer,
      );
      for (const email of data.staff) {
        const member = userByEmail.get(email);
        if (member) {
          await this.upsertStaff(
            event,
            member,
            EventStaffRole.STAFF,
            organizer,
          );
        }
      }
    }
  }

  private async upsertStaff(
    event: Event,
    user: User,
    role: EventStaffRole,
    by: User,
  ): Promise<void> {
    const exists = await this.staffRepo.findOne({
      where: { event: { id: event.id }, user: { id: user.id } },
    });
    if (exists) return;

    await this.staffRepo.save(
      this.staffRepo.create({
        event,
        user,
        staff_role: role,
        assigned_by: by,
      }),
    );
    console.log(
      `  [EventSeeder] Assigned ${user.email} as ${role} for "${event.title}"`,
    );
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../../settings/entities/country.entity';
import { City } from '../../settings/entities/city.entity';
import { Language } from '../../settings/entities/language.entity';
import { EventCategory as EventCategoryEntity } from '../../settings/entities/event-category.entity';
import { Event } from '../../events/entities/event.entity';
import { User } from '../../users/entities/user.entity';
import {
  EventReview,
  ReviewStatus,
} from '../../reviews/entities/event-review.entity';

interface SeedCity {
  name: string;
  latitude: number;
  longitude: number;
}

const MOROCCO_CITIES: SeedCity[] = [
  { name: 'Marrakech', latitude: 31.6295, longitude: -7.9811 },
  { name: 'Fès', latitude: 34.0181, longitude: -5.0078 },
  { name: 'Casablanca', latitude: 33.5731, longitude: -7.5898 },
  { name: 'Rabat', latitude: 34.0209, longitude: -6.8416 },
  { name: 'Tanger', latitude: 35.7595, longitude: -5.834 },
  { name: 'Essaouira', latitude: 31.5085, longitude: -9.7595 },
  { name: 'Agadir', latitude: 30.4278, longitude: -9.5981 },
  { name: 'Ouarzazate', latitude: 30.9335, longitude: -6.937 },
  { name: 'Meknès', latitude: 33.8935, longitude: -5.5473 },
  { name: 'Chefchaouen', latitude: 35.1688, longitude: -5.2636 },
];

const LANGUAGES = [
  { name: 'Arabic', code: 'ar' },
  { name: 'French', code: 'fr' },
  { name: 'English', code: 'en' },
  { name: 'Spanish', code: 'es' },
  { name: 'Amazigh', code: 'zgh' },
];

const COUNTRIES = [
  {
    name: 'Morocco',
    iso_code: 'MA',
    latitude: 31.7917,
    longitude: -7.0926,
    languages: ['ar', 'fr', 'zgh', 'en'],
    withCities: true,
  },
  {
    name: 'France',
    iso_code: 'FR',
    latitude: 46.2276,
    longitude: 2.2137,
    languages: ['fr', 'en'],
    withCities: false,
  },
  {
    name: 'Spain',
    iso_code: 'ES',
    latitude: 40.4637,
    longitude: -3.7492,
    languages: ['es', 'en'],
    withCities: false,
  },
];

// Mirrors the legacy EventCategory enum values so events backfill cleanly.
const EVENT_CATEGORIES = [
  { name: 'Musique', description: 'Concerts, festivals et musique live.' },
  { name: 'Sport', description: 'Compétitions et évènements sportifs.' },
  { name: 'Culture', description: 'Patrimoine, expositions et traditions.' },
  { name: 'Cinema', description: 'Projections et festivals de cinéma.' },
  { name: 'Humour', description: 'Spectacles de stand-up et comédie.' },
  { name: 'Art', description: 'Arts visuels, galeries et performances.' },
  { name: 'Autre', description: 'Autres types d’évènements.' },
];

@Injectable()
export class SettingsSeeder {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(City) private readonly cityRepo: Repository<City>,
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    @InjectRepository(EventCategoryEntity)
    private readonly categoryRepo: Repository<EventCategoryEntity>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(EventReview)
    private readonly reviewRepo: Repository<EventReview>,
  ) {}

  async seed(): Promise<void> {
    const languages = await this.seedLanguages();
    const morocco = await this.seedCountries(languages);
    await this.seedCities(morocco);
    await this.seedCategories();
    await this.backfillEvents();
    await this.seedReviews();
  }

  /** A few sample reviews so the moderation screen has content. */
  private async seedReviews(): Promise<void> {
    const existing = await this.reviewRepo.count();
    if (existing > 0) return;

    const [events, user] = await Promise.all([
      this.eventRepo.find({ take: 3, order: { id: 'ASC' } }),
      this.userRepo
        .createQueryBuilder('u')
        .leftJoin('u.role', 'r')
        .where('r.name = :role', { role: 'USER' })
        .getOne(),
    ]);
    if (!user || events.length === 0) return;

    const samples: { rating: number; comment: string; status: ReviewStatus }[] =
      [
        { rating: 5, comment: 'Événement incroyable, très bien organisé !', status: ReviewStatus.PENDING },
        { rating: 4, comment: 'Bonne ambiance mais un peu bondé.', status: ReviewStatus.APPROVED },
        { rating: 2, comment: 'Décevant par rapport au prix.', status: ReviewStatus.PENDING },
      ];

    for (let i = 0; i < samples.length; i++) {
      const event = events[i % events.length];
      await this.reviewRepo.save(
        this.reviewRepo.create({ ...samples[i], event, user }),
      );
    }
  }

  private async seedLanguages(): Promise<Map<string, Language>> {
    const byCode = new Map<string, Language>();
    for (const l of LANGUAGES) {
      let lang = await this.languageRepo.findOne({ where: { code: l.code } });
      if (!lang) {
        lang = await this.languageRepo.save(this.languageRepo.create(l));
      }
      byCode.set(l.code, lang);
    }
    return byCode;
  }

  private async seedCountries(
    languages: Map<string, Language>,
  ): Promise<Country> {
    let morocco!: Country;
    for (const c of COUNTRIES) {
      let country = await this.countryRepo.findOne({
        where: { name: c.name },
        relations: ['languages'],
      });
      if (!country) {
        country = this.countryRepo.create({
          name: c.name,
          iso_code: c.iso_code,
          latitude: c.latitude,
          longitude: c.longitude,
        });
      }
      country.languages = c.languages
        .map((code) => languages.get(code))
        .filter((l): l is Language => Boolean(l));
      country = await this.countryRepo.save(country);
      if (c.name === 'Morocco') morocco = country;
    }
    return morocco;
  }

  private async seedCities(country: Country): Promise<void> {
    for (const c of MOROCCO_CITIES) {
      const existing = await this.cityRepo.findOne({ where: { name: c.name } });
      if (!existing) {
        await this.cityRepo.save(this.cityRepo.create({ ...c, country }));
      }
    }
  }

  private async seedCategories(): Promise<void> {
    for (const c of EVENT_CATEGORIES) {
      const existing = await this.categoryRepo.findOne({
        where: { name: c.name },
      });
      if (!existing) {
        await this.categoryRepo.save(this.categoryRepo.create(c));
      }
    }
  }

  /** Link existing events to the normalized city/category by name. */
  private async backfillEvents(): Promise<void> {
    const [events, cities, categories] = await Promise.all([
      this.eventRepo.find({ relations: ['cityEntity', 'categoryEntity'] }),
      this.cityRepo.find(),
      this.categoryRepo.find(),
    ]);
    const cityByName = new Map(
      cities.map((c) => [c.name.toLowerCase(), c]),
    );
    const categoryByName = new Map(
      categories.map((c) => [c.name.toLowerCase(), c]),
    );

    for (const event of events) {
      let changed = false;
      if (!event.cityEntity && event.city) {
        const match = cityByName.get(event.city.toLowerCase());
        if (match) {
          event.cityEntity = match;
          changed = true;
        }
      }
      if (!event.categoryEntity && event.category) {
        const match = categoryByName.get(String(event.category).toLowerCase());
        if (match) {
          event.categoryEntity = match;
          changed = true;
        }
      }
      if (changed) await this.eventRepo.save(event);
    }
  }
}

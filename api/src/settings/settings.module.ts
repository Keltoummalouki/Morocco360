import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/country.entity';
import { City } from './entities/city.entity';
import { Language } from './entities/language.entity';
import { EventCategory } from './entities/event-category.entity';
import { Event } from '../events/entities/event.entity';
import { CountriesService } from './countries.service';
import { CitiesService } from './cities.service';
import { LanguagesService } from './languages.service';
import { EventCategoriesService } from './event-categories.service';
import { CountriesController } from './countries.controller';
import { CitiesController } from './cities.controller';
import { LanguagesController } from './languages.controller';
import { EventCategoriesController } from './event-categories.controller';

/**
 * Admin-managed reference data (countries, cities, languages, event
 * categories). The `Event` repo is registered here only for delete-safety
 * checks (a city/category in use by events can't be hard-deleted).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Country, City, Language, EventCategory, Event]),
  ],
  controllers: [
    CountriesController,
    CitiesController,
    LanguagesController,
    EventCategoriesController,
  ],
  providers: [
    CountriesService,
    CitiesService,
    LanguagesService,
    EventCategoriesService,
  ],
  exports: [TypeOrmModule],
})
export class SettingsModule {}

import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

/** `npm run seed` — add `-- --fresh` to wipe the seeded tables first. */
async function bootstrap() {
  const fresh = process.argv.includes('--fresh');

  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['error', 'warn'],
  });

  const seeder = app.get(SeederService);
  await seeder.seed(fresh);
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

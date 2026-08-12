import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

type TypeOrmOverrides = Partial<TypeOrmModuleOptions>;

/**
 * Shared TypeORM configuration for the API and seed runner.
 *
 * Production uses Supabase's session-pooler DATABASE_URL. Local Docker
 * development can continue using the individual DB_* variables.
 */
export function createTypeOrmOptions(
  config: ConfigService,
  overrides: TypeOrmOverrides = {},
): TypeOrmModuleOptions {
  const databaseUrl = config.get<string>('DATABASE_URL')?.trim();
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const useSsl = config.get<boolean>('DB_SSL', false);

  const connection = databaseUrl
    ? { url: databaseUrl }
    : {
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'morocco360'),
        password: config.get<string>('DB_PASS', 'morocco360'),
        database: config.get<string>('DB_NAME', 'morocco360'),
      };

  return {
    type: 'postgres',
    ...connection,
    autoLoadEntities: true,
    synchronize: config.get<boolean>(
      'DB_SYNCHRONIZE',
      !isProduction && !databaseUrl,
    ),
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    // Supabase migrations are applied independently in production. Keep the
    // legacy TypeORM migrations available for existing local Docker databases.
    migrationsRun: config.get<boolean>('DB_RUN_MIGRATIONS', !databaseUrl),
    ssl: useSsl
      ? {
          rejectUnauthorized: config.get<boolean>(
            'DB_SSL_REJECT_UNAUTHORIZED',
            true,
          ),
        }
      : false,
    extra: {
      max: config.get<number>('DB_POOL_MAX', 5),
      connectionTimeoutMillis: config.get<number>(
        'DB_CONNECTION_TIMEOUT_MS',
        10_000,
      ),
    },
    ...overrides,
  } as TypeOrmModuleOptions;
}

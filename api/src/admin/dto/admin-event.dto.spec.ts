import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateAdminEventDto } from './admin-event.dto';

const BASE = {
  title: 'MOGA Essaouira 2026',
  description: 'A boutique electronic music festival.',
  date_start: '2026-10-02T00:00:00.000Z',
  date_end: '2026-10-04T00:00:00.000Z',
  location_name: 'Hotel Le Golf D’Essaouira & Spa',
};

function validate(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateAdminEventDto, payload);
  const errors = validateSync(dto, { whitelist: true });
  return {
    dto,
    properties: errors.map((e) => e.property),
  };
}

describe('CreateAdminEventDto', () => {
  it('accepts the base payload', () => {
    expect(validate(BASE).properties).toEqual([]);
  });

  // A <select> hands back strings, so the ids arrive as "5" rather than 5.
  // Before the coercion these failed with "cityId must be an integer number"
  // even though the admin had picked a perfectly valid city.
  it('coerces numeric-string ids into numbers', () => {
    const { dto, properties } = validate({
      ...BASE,
      cityId: '5',
      categoryId: '12',
      organizerId: '3',
    });

    expect(properties).toEqual([]);
    expect(dto.cityId).toBe(5);
    expect(dto.categoryId).toBe(12);
    expect(dto.organizerId).toBe(3);
  });

  it('leaves real numbers alone', () => {
    const { dto, properties } = validate({ ...BASE, cityId: 5 });

    expect(properties).toEqual([]);
    expect(dto.cityId).toBe(5);
  });

  it('omits ids that were never sent', () => {
    const { dto, properties } = validate(BASE);

    expect(properties).toEqual([]);
    expect(dto.cityId).toBeUndefined();
    expect(dto.categoryId).toBeUndefined();
  });

  // Coercion turns junk into 0, which would otherwise slip through @IsInt()
  // and hit the database as a foreign key that cannot exist.
  it.each([
    ['an empty string', ''],
    ['whitespace', '   '],
  ])(
    'rejects %s as a city id rather than coercing it to 0',
    (_label, value) => {
      expect(validate({ ...BASE, cityId: value }).properties).toContain(
        'cityId',
      );
    },
  );

  // `@IsOptional()` skips null as well as undefined, so null reads as
  // "leave it alone" — the service guards on `== null` to match.
  it('treats an explicit null id as not provided', () => {
    expect(validate({ ...BASE, cityId: null }).properties).toEqual([]);
  });

  it('rejects a non-numeric id', () => {
    expect(validate({ ...BASE, cityId: 'Essaouira' }).properties).toContain(
      'cityId',
    );
  });

  it('rejects a negative id', () => {
    expect(validate({ ...BASE, categoryId: -1 }).properties).toContain(
      'categoryId',
    );
  });
});

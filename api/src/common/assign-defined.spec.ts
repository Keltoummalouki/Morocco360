import { assignDefined } from './assign-defined';

interface Target {
  title: string;
  city: string;
  stock: number;
  note: string | null;
}

const target = (): Target => ({
  title: 'Old',
  city: 'Fès',
  stock: 10,
  note: 'keep',
});

describe('assignDefined', () => {
  it('copies the listed keys that are present', () => {
    const t = target();

    assignDefined(t, { title: 'New', stock: 42 }, ['title', 'stock']);

    expect(t.title).toBe('New');
    expect(t.stock).toBe(42);
  });

  it('skips keys left undefined by a partial payload', () => {
    const t = target();

    assignDefined(t, { title: 'New', city: undefined }, ['title', 'city']);

    expect(t.title).toBe('New');
    expect(t.city).toBe('Fès');
  });

  it('ignores source keys that were not listed', () => {
    const t = target();
    // Real call sites pass a DTO holding more fields than the key list.
    const dto = { title: 'New', city: 'Rabat' };

    assignDefined(t, dto, ['title']);

    expect(t.title).toBe('New');
    expect(t.city).toBe('Fès');
  });

  it('assigns falsy values, including null and 0', () => {
    const t = target();

    assignDefined(t, { note: null, stock: 0, city: '' }, [
      'note',
      'stock',
      'city',
    ]);

    expect(t.note).toBeNull();
    expect(t.stock).toBe(0);
    expect(t.city).toBe('');
  });

  it('rejects at compile time a key the source cannot supply', () => {
    const t = target();
    const dto = { title: 'New' };

    // If the DTO is renamed out from under a key list, the build must break
    // rather than silently skipping the field. `@ts-expect-error` fails the
    // build if this call ever stops erroring.
    // @ts-expect-error 'stock' is not a key of `dto`.
    assignDefined(t, dto, ['title', 'stock']);

    expect(t.stock).toBe(10);
  });

  it('leaves the target untouched when no keys are listed', () => {
    const t = target();

    assignDefined(t, { title: 'New' }, []);

    expect(t).toEqual(target());
  });
});

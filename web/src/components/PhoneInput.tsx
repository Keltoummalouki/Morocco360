'use client';

import { useState } from 'react';
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/components/LocaleProvider';
import { selectItemWrap } from '@/lib/utils';

const DEFAULT_COUNTRY: CountryCode = 'MA';

/** Split an incoming E.164 value into { country, national } for the two inputs. */
function seedFrom(value: string): { country: CountryCode; national: string } {
  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  return {
    country: (parsed?.country as CountryCode) ?? DEFAULT_COUNTRY,
    national: parsed?.nationalNumber?.toString() ?? '',
  };
}

/**
 * Country dial-code + national number, emitting a normalised E.164 string
 * (e.g. "+212612345678"). The API re-validates with libphonenumber, so this is
 * UX, not the security boundary.
 */
export default function PhoneInput({
  value,
  onChange,
  id,
  disabled,
}: {
  value: string;
  onChange: (e164: string) => void;
  id?: string;
  disabled?: boolean;
}) {
  const { t, locale } = useLocale();

  // Seeded once from the incoming value; the parent owns the E.164 string.
  const [phone, setPhone] = useState(() => seedFrom(value));

  const regionNames = new Intl.DisplayNames([locale === 'ar' ? 'ar' : locale], {
    type: 'region',
  });
  const countries = getCountries()
    .map((code) => ({
      code,
      dial: getCountryCallingCode(code),
      name: regionNames.of(code) ?? code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  function emit(country: CountryCode, national: string) {
    setPhone({ country, national });
    const digits = national.replace(/\D/g, '');
    if (!digits) {
      onChange('');
      return;
    }
    const parsed = parsePhoneNumberFromString(digits, country);
    onChange(parsed ? parsed.number : `+${getCountryCallingCode(country)}${digits}`);
  }

  const invalid =
    phone.national.trim().length > 0 && !isValidPhoneNumber(phone.national, phone.country);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Select
          value={phone.country}
          disabled={disabled}
          onValueChange={(c) => emit(c as CountryCode, phone.national)}
        >
          <SelectTrigger className="h-11 w-[130px] shrink-0" aria-label={t.app.country}>
            <SelectValue>+{getCountryCallingCode(phone.country)}</SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-72 w-[280px]">
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code} className={selectItemWrap}>
                {c.name} (+{c.dial})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          value={phone.national}
          aria-invalid={invalid}
          placeholder="612345678"
          onChange={(e) => emit(phone.country, e.target.value)}
          className="h-11"
        />
      </div>

      {invalid && (
        <p className="text-xs" style={{ color: 'var(--error)' }}>
          {t.app.phone} — {t.app.genericError}
        </p>
      )}
    </div>
  );
}

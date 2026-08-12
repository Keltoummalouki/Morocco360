// Typed BFF helpers for the admin Settings domain. Every call hits a
// same-origin /api/admin/settings/** route handler (never the NestJS API
// directly), so the httpOnly auth cookie is attached server-side.

import {
  jsonInit,
  readJson,
  toQuery,
  expectOk,
  type Paginated,
  type SettingStatus,
} from './http';

export type { Paginated, PageMeta, SettingStatus } from './http';

export interface LanguageRef {
  id: number;
  name: string;
  code: string;
}

export interface CountryRef {
  id: number;
  name: string;
  iso_code?: string | null;
}

export interface Country {
  id: number;
  name: string;
  iso_code: string | null;
  latitude: number | null;
  longitude: number | null;
  status: SettingStatus;
  cityCount?: number;
  cities?: City[];
  languages?: LanguageRef[];
  created_at: string;
  updated_at: string;
}

export interface City {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  status: SettingStatus;
  country: CountryRef | null;
  created_at: string;
  updated_at: string;
}

export interface Language {
  id: number;
  name: string;
  code: string;
  status: SettingStatus;
  countries?: CountryRef[];
  created_at: string;
  updated_at: string;
}

export interface EventCategory {
  id: number;
  name: string;
  description: string | null;
  status: SettingStatus;
  created_at: string;
  updated_at: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SettingStatus | '';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  countryId?: number;
}

const BASE = '/api/admin/settings';

// ── Countries ──────────────────────────────────────────────
export function listCountries(p: ListParams): Promise<Paginated<Country>> {
  return fetch(`${BASE}/countries${toQuery(p)}`).then(readJson<Paginated<Country>>);
}
export function getCountry(id: number): Promise<Country> {
  return fetch(`${BASE}/countries/${id}`).then(readJson<Country>);
}
export function createCountry(body: Partial<Country> & { languageIds?: number[] }): Promise<Country> {
  return fetch(`${BASE}/countries`, jsonInit('POST', body)).then(readJson<Country>);
}
export function updateCountry(id: number, body: Partial<Country> & { languageIds?: number[] }): Promise<Country> {
  return fetch(`${BASE}/countries/${id}`, jsonInit('PATCH', body)).then(readJson<Country>);
}
export function deleteCountry(id: number): Promise<void> {
  return fetch(`${BASE}/countries/${id}`, { method: 'DELETE' }).then(expectOk);
}

// ── Cities ─────────────────────────────────────────────────
export function listCities(p: ListParams): Promise<Paginated<City>> {
  return fetch(`${BASE}/cities${toQuery(p)}`).then(readJson<Paginated<City>>);
}
export function createCity(body: {
  name: string;
  countryId?: number;
  latitude?: number;
  longitude?: number;
  status?: SettingStatus;
}): Promise<City> {
  return fetch(`${BASE}/cities`, jsonInit('POST', body)).then(readJson<City>);
}
export function updateCity(id: number, body: Partial<{
  name: string;
  countryId: number;
  latitude: number;
  longitude: number;
  status: SettingStatus;
}>): Promise<City> {
  return fetch(`${BASE}/cities/${id}`, jsonInit('PATCH', body)).then(readJson<City>);
}
export function deleteCity(id: number): Promise<void> {
  return fetch(`${BASE}/cities/${id}`, { method: 'DELETE' }).then(expectOk);
}

// ── Languages ──────────────────────────────────────────────
export function listLanguages(p: ListParams): Promise<Paginated<Language>> {
  return fetch(`${BASE}/languages${toQuery(p)}`).then(readJson<Paginated<Language>>);
}
export function createLanguage(body: {
  name: string;
  code: string;
  status?: SettingStatus;
  countryIds?: number[];
}): Promise<Language> {
  return fetch(`${BASE}/languages`, jsonInit('POST', body)).then(readJson<Language>);
}
export function updateLanguage(id: number, body: Partial<{
  name: string;
  code: string;
  status: SettingStatus;
  countryIds: number[];
}>): Promise<Language> {
  return fetch(`${BASE}/languages/${id}`, jsonInit('PATCH', body)).then(readJson<Language>);
}
export function deleteLanguage(id: number): Promise<void> {
  return fetch(`${BASE}/languages/${id}`, { method: 'DELETE' }).then(expectOk);
}

// ── Event categories ───────────────────────────────────────
export function listEventCategories(p: ListParams): Promise<Paginated<EventCategory>> {
  return fetch(`${BASE}/event-categories${toQuery(p)}`).then(readJson<Paginated<EventCategory>>);
}
export function createEventCategory(body: {
  name: string;
  description?: string;
  status?: SettingStatus;
}): Promise<EventCategory> {
  return fetch(`${BASE}/event-categories`, jsonInit('POST', body)).then(readJson<EventCategory>);
}
export function updateEventCategory(id: number, body: Partial<{
  name: string;
  description: string;
  status: SettingStatus;
}>): Promise<EventCategory> {
  return fetch(`${BASE}/event-categories/${id}`, jsonInit('PATCH', body)).then(readJson<EventCategory>);
}
export function deleteEventCategory(id: number): Promise<void> {
  return fetch(`${BASE}/event-categories/${id}`, { method: 'DELETE' }).then(expectOk);
}

// Fetch all active languages/countries for the assignment pickers (small sets).
export function allLanguages(): Promise<LanguageRef[]> {
  return listLanguages({ limit: 100, sortBy: 'name', sortOrder: 'ASC' }).then((r) => r.data);
}
export function allCountries(): Promise<CountryRef[]> {
  return listCountries({ limit: 100, sortBy: 'name', sortOrder: 'ASC' }).then((r) => r.data);
}

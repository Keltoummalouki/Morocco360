/**
 * Copies the listed keys from `source` onto `target`, skipping the ones left
 * `undefined` (i.e. absent from a PATCH payload).
 *
 * Keeps partial-update loops type-safe: `keys` must be real keys of `target`
 * and each value must match the target's type for that key, so no `as any`
 * casts are needed at the call sites.
 */
export function assignDefined<
  T,
  S extends { [P in K]?: T[P] },
  K extends keyof T & keyof S,
>(target: T, source: S, keys: readonly K[]): void {
  for (const key of keys) {
    const value = source[key];
    // Sound by the `S extends { [P in K]?: T[P] }` constraint — TypeScript just
    // cannot narrow a mapped-type lookup spanning two generics on its own.
    if (value !== undefined) target[key] = value as T[K];
  }
}

/** Page numbers to render, with '…' gaps for long ranges. */
export function buildRange(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pageCount];
  if (page >= pageCount - 3) {
    return [1, '…', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, '…', page - 1, page, page + 1, '…', pageCount];
}

/** Total pages for a list (always >= 1 so the UI never shows "page 1 of 0"). */
export function pageCountFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

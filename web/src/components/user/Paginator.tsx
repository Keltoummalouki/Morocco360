'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/LocaleProvider';
import { buildRange } from '@/lib/pagination';

export default function Paginator({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
}) {
  const { t } = useLocale();
  if (pageCount <= 1) return null;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label={t.app.prev}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
      </Button>

      {buildRange(page, pageCount).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <Button
            key={p}
            type="button"
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(p)}
            aria-label={`${t.app.pageLabel} ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        aria-label={t.app.next}
      >
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
      </Button>
    </nav>
  );
}

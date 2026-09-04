'use client';

import { SongsTable } from '@/components/admin/songs-table';
import { useAdminSongs } from '@/hooks/admin/use-admin-songs';
import type { SortingState } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { parseAsIndex, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

export function SongsPageClient() {
  const t = useTranslations('Dashboard.admin.publish');
  const [{ page, pageSize, search, sortId, sortDesc, status }, setQueryStates] = useQueryStates({
    page: parseAsIndex.withDefault(0),
    pageSize: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    sortId: parseAsString.withDefault('createdAt'),
    sortDesc: parseAsInteger.withDefault(1),
    status: parseAsString.withDefault('all'),
  });

  const sorting: SortingState = useMemo(() => [{ id: sortId, desc: Boolean(sortDesc) }], [sortId, sortDesc]);

  // Cast string to specific union type
  const filterStatus = (['all', 'published', 'scheduled', 'unpublished'].includes(status) ? status : 'all') as
    | 'all'
    | 'published'
    | 'scheduled'
    | 'unpublished';

  const { data, isLoading } = useAdminSongs(page, pageSize, search, sorting, filterStatus);

  // Normalize data to match SongItem type (handle nulls)
  const tableData = useMemo(() => {
    return (data?.items || []).map((item) => ({
      ...item,
      isPublished: item.isPublished ?? undefined,
    }));
  }, [data?.items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <SongsTable
        data={tableData}
        total={data?.total || 0}
        pageIndex={page}
        pageSize={pageSize}
        search={search}
        status={filterStatus}
        sorting={sorting}
        loading={isLoading}
        onSearch={(newSearch) => setQueryStates({ search: newSearch, page: 0 })}
        onStatusChange={(newStatus) => setQueryStates({ status: newStatus, page: 0 })}
        onPageChange={(newPageIndex) => setQueryStates({ page: newPageIndex })}
        onPageSizeChange={(newPageSize) => setQueryStates({ pageSize: newPageSize, page: 0 })}
        onSortingChange={(newSorting) => {
          if (newSorting.length > 0) {
            setQueryStates({
              sortId: newSorting[0].id,
              sortDesc: newSorting[0].desc ? 1 : 0,
            });
          }
        }}
      />
    </div>
  );
}

'use client';

import { SongsTable } from '@/components/admin/songs-table';
import { useAdminSongs } from '@/hooks/admin/use-admin-songs';
import type { SortingState } from '@tanstack/react-table';
import { parseAsIndex, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

export function SongsPageClient() {
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
  const filterStatus = (['all', 'published', 'unpublished'].includes(status) ? status : 'all') as
    | 'all'
    | 'published'
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Song Publishing</h1>
        <p className="text-muted-foreground">Manage and publish official songs to the Trending Gallery.</p>
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

import { getAdminSongsAction } from '@/actions/admin/get-admin-songs';
import { updateSongPublishAction } from '@/actions/admin/update-song-publish';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';

// Query keys
export const adminSongsKeys = {
  all: ['admin-songs'] as const,
  lists: () => [...adminSongsKeys.all, 'lists'] as const,
  list: (filters: {
    pageIndex: number;
    pageSize: number;
    search: string;
    sorting: SortingState;
    status: 'all' | 'published' | 'unpublished';
  }) => [...adminSongsKeys.lists(), filters] as const,
};

// Hook to fetch admin songs with pagination, search, and sorting
export function useAdminSongs(
  pageIndex: number,
  pageSize: number,
  search: string,
  sorting: SortingState,
  status: 'all' | 'published' | 'unpublished' = 'all'
) {
  return useQuery({
    queryKey: adminSongsKeys.list({ pageIndex, pageSize, search, sorting, status }),
    queryFn: async () => {
      const result = await getAdminSongsAction({
        pageIndex,
        pageSize,
        search,
        sorting,
        status,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch songs');
      }

      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      };
    },
    placeholderData: keepPreviousData,
  });
}

// Hook to toggle publish status
export function useTogglePublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ songId, isPublished }: { songId: string; isPublished: boolean }) => {
      const result = await updateSongPublishAction(songId, isPublished);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update status');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isPublished ? 'Song published' : 'Song unpublished');
      // Invalidate all admin songs queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: adminSongsKeys.all,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

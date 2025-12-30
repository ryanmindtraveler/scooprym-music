import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UseSongLikeProps {
  songId: string;
  initialIsLiked: boolean;
}

export function useSongLike({ songId, initialIsLiked }: UseSongLikeProps) {
  // We maintain a local state for immediate UI feedback (Optimistic UI)
  // This state is initialized with the prop but then managed locally
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Sync local state with prop when parent updates (e.g. after router.refresh)
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  const { mutate: toggleLike, isPending } = useMutation({
    mutationFn: async () => {
      // Optimistic update
      const newState = !isLiked;
      setIsLiked(newState);

      const res = await fetch(`/api/songs/${songId}/favorite`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to update favorite');
      }

      return data.data; // { isFavorite: boolean }
    },
    onSuccess: (data) => {
      // Ensure state matches server response
      if (typeof data?.isFavorite === 'boolean') {
        setIsLiked(data.isFavorite);
      }

      // Invalidate queries to refresh lists if they are using useQuery
      queryClient.invalidateQueries({ queryKey: ['favorites'] });

      // Refresh RSC payload to ensure server components reflect the change
      router.refresh();

      // Bonus: If we want to support "Dashboard List Sync" immediately without refactoring Lists to useQuery,
      // We can dispatch a custom event.
      window.dispatchEvent(
        new CustomEvent('song-like-change', {
          detail: { songId, isLiked: data.isFavorite },
        })
      );
    },
    onError: (error) => {
      // Revert state
      setIsLiked(!isLiked);
      toast.error('Failed to update favorite status');
      console.error(error);
    },
  });

  return {
    isLiked,
    toggleLike,
    isLoading: isPending,
  };
}

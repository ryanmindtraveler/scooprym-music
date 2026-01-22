'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, PauseCircle, PlayCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRef, useState } from 'react';

// Define the shape of joined data
export type SongWithUser = {
  id: string;
  title: string;
  userId: string;
  userName: string | null;
  audioUrl: string;
  coverImageUrl: string | null;
  processingStatus: string | null;
  createdAt: Date;
  plays: number;
};

// Simple inline audio player for Admin
const AudioCell = ({ url }: { url: string }) => {
  if (!url || url === 'processing' || url.startsWith('pending'))
    return <span className="text-muted-foreground text-xs">N/A</span>;

  // biome-ignore lint/a11y/useMediaCaption: Admin preview only
  return <audio controls src={url} className="h-8 w-40" />;
};

export const columns: ColumnDef<SongWithUser>[] = [
  {
    accessorKey: 'coverImageUrl',
    header: 'Cover',
    cell: ({ row }) => {
      const url = row.original.coverImageUrl;
      return url ? (
        <img src={url} alt="Cover" className="h-10 w-10 rounded object-cover" />
      ) : (
        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-xs">No Img</div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <span className="font-medium truncate max-w-[200px] block" title={row.getValue('title')}>
        {row.getValue('title')}
      </span>
    ),
  },
  {
    accessorKey: 'userName', // Custom accessor for joined name
    header: 'User',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{row.original.userName || 'Unknown'}</span>
        <span className="text-xs text-muted-foreground">{row.original.userId.slice(0, 8)}...</span>
      </div>
    ),
  },
  {
    accessorKey: 'processingStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('processingStatus') as string;
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';

      if (status === 'completed') variant = 'default'; // green-ish usually or default primary
      if (status?.includes('failed')) variant = 'destructive';

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'audioUrl',
    header: 'Playback',
    cell: ({ row }) => <AudioCell url={row.original.audioUrl} />,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString() +
      ' ' +
      new Date(row.original.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const song = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(song.id)}>Copy Song ID</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(song.audioUrl)}>
              Copy Audio URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

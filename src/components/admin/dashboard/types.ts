export interface AdminStats {
  revenue: number;
  revenueGrowth: number;
  users: number;
  usersGrowth: number;
  songs: number;
  songsGrowth: number;
  activeSubs: number;
  subsGrowth: number;
  queueLength: number;
  recentRevenue: number; // Added
  recentUsers: number;   // Added
  recentSongs: number;   // Added
  recentSubs: number;    // Added
}

export interface LiveSong {
  id: string;
  title: string;
  coverImageUrl: string | null;
  audioUrl: string;
  tags: string | null;
  duration: number | null;
  createdAt: Date;
  user: {
    name: string;
    image: string | null;
    email: string;
  } | null;
}

export interface RecentTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  } | null;
}

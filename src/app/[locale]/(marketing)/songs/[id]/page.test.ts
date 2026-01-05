
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMetadata } from './page';

// Mock dependencies
vi.mock('server-only', () => ({}));

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};

vi.mock('@/db', () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

// Mock constructMetadata to avoid import issues or complex logic
vi.mock('@/lib/metadata', () => ({
  constructMetadata: vi.fn((params) => params),
}));

// Mock server utils if used (like getSession, though generateMetadata usually doesn't need session)
vi.mock('@/lib/server', () => ({
  getSession: vi.fn(),
}));

describe('Song Page Metadata', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDb.select.mockReturnThis();
        mockDb.from.mockReturnThis();
        mockDb.where.mockReturnThis();
        mockDb.limit.mockReturnThis();
    });

    it('should generate correct metadata for existing song', async () => {
        const mockSong = {
            id: 'song-123',
            title: 'Test Song',
            newsSummary: 'A summary about news',
            coverImageUrl: 'https://example.com/image.png'
        };

        // Mock DB response
        mockDb.limit.mockResolvedValueOnce([mockSong]);

        const params = Promise.resolve({ id: 'song-123', locale: 'en' as any });
        const metadata = await generateMetadata({ params });

        expect(metadata).toEqual(expect.objectContaining({
            title: 'Test Song | ScoopRYM Music',
            description: 'A summary about news',
            image: 'https://example.com/image.png',
            locale: 'en',
            pathname: '/songs/song-123'
        }));
    });

    it('should generate fallback metadata for missing song', async () => {
        // Mock DB return empty
        mockDb.limit.mockResolvedValueOnce([]);

        const params = Promise.resolve({ id: 'missing-123', locale: 'en' as any });
        const metadata = await generateMetadata({ params });

        expect(metadata).toEqual(expect.objectContaining({
            title: 'Song Not Found',
            locale: 'en'
        }));
    });
});

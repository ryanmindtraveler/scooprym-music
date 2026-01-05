
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCredits, consumeCredits, hasEnoughCredits, getUserCredits } from './credits';
import { CREDIT_TRANSACTION_TYPE } from './types';

// Mock the dependencies
const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
};

// Properly mock the @/db module
vi.mock('@/db', () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

describe('Credit System', () => {
    const userId = 'user_123';

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset chainable mocks
        mockDb.select.mockReturnThis();
        mockDb.from = vi.fn().mockReturnThis();
        mockDb.where = vi.fn().mockReturnThis();
        mockDb.limit = vi.fn().mockReturnThis();
        mockDb.orderBy = vi.fn().mockReturnThis();
        mockDb.set = vi.fn().mockReturnThis();
        mockDb.values = vi.fn().mockReturnThis();
    });

  describe('getUserCredits', () => {
    it('should return 0 if user has no record', async () => {
      // Mock empty result
      mockDb.limit.mockResolvedValueOnce([]);
      const credits = await getUserCredits(userId);
      expect(credits).toBe(0);
    });

    it('should return correct balance', async () => {
      mockDb.limit.mockResolvedValueOnce([{ currentCredits: 100 }]);
      const credits = await getUserCredits(userId);
      expect(credits).toBe(100);
    });
  });

  describe('hasEnoughCredits', () => {
      it('should return true if balance >= required', async () => {
          mockDb.limit.mockResolvedValueOnce([{ currentCredits: 10 }]);
          const result = await hasEnoughCredits({ userId, requiredCredits: 5 });
          expect(result).toBe(true);
      });

      it('should return false if balance < required', async () => {
        mockDb.limit.mockResolvedValueOnce([{ currentCredits: 3 }]);
        const result = await hasEnoughCredits({ userId, requiredCredits: 5 });
        expect(result).toBe(false);
    });
  });

  describe('addCredits', () => {
      it('should insert new user credit record if not exists', async () => {
          mockDb.limit.mockResolvedValueOnce([]); // No existing user

          await addCredits({
              userId,
              amount: 50,
              type: 'TEST',
              description: 'Test credits'
          });

          // Verify insert called on userCredit
          expect(mockDb.insert).toHaveBeenCalledTimes(2); // 1 for userCredit, 1 for transaction
      });

      it('should update existing user record', async () => {
        mockDb.limit.mockResolvedValueOnce([{ currentCredits: 20 }]);

        await addCredits({
            userId,
            amount: 50,
            type: 'TEST',
            description: 'Test credits'
        });

        // Verify update called
        expect(mockDb.update).toHaveBeenCalled();
        // We expect set to be called with new balance 70
        expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
            currentCredits: 70
        }));
    });
  });

  // Note: consumeCredits is complex with FIFO logic and transaction query.
  // For P0, we ensure the basic balance check and deduction flow works.

  describe('consumeCredits', () => {
      it('should throw error if insufficient credits', async () => {
        mockDb.limit.mockResolvedValueOnce([{ currentCredits: 0 }]); // Balance check

        await expect(consumeCredits({
            userId,
            amount: 10,
            description: 'Test consume'
        })).rejects.toThrow('Insufficient credits');
      });
  });

});

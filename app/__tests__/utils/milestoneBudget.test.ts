import { distributeMilestoneBudgets } from '../../lib/utils/milestoneBudget';

describe('distributeMilestoneBudgets', () => {
  it('splits total evenly across milestones', () => {
    const result = distributeMilestoneBudgets(1000, 4);
    expect(result).toHaveLength(4);
    result.forEach(item => expect(item.amount).toBe(250));
  });

  it('handles remainder by adding cents to first milestones', () => {
    const result = distributeMilestoneBudgets(100, 3);
    const amounts = result.map(item => item.amount);
    expect(amounts.reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 2);
  });

  it('uses existing titles when provided', () => {
    const result = distributeMilestoneBudgets(300, 2, ['Design', 'Build']);
    expect(result[0].title).toBe('Design');
    expect(result[1].title).toBe('Build');
  });

  it('returns empty array when invalid input', () => {
    expect(distributeMilestoneBudgets(NaN, 3)).toEqual([]);
    expect(distributeMilestoneBudgets(100, 0)).toEqual([]);
  });
});

export interface MilestoneBudgetSuggestion {
  title: string;
  amount: number;
}

export const distributeMilestoneBudgets = (
  total: number,
  count: number,
  existingTitles: string[] = []
): MilestoneBudgetSuggestion[] => {
  if (count <= 0 || !Number.isFinite(total)) {
    return [];
  }

  const baseAmount = Math.floor((total / count) * 100) / 100;
  let remainder = Math.round((total - baseAmount * count) * 100) / 100;

  const suggestions: MilestoneBudgetSuggestion[] = [];

  for (let i = 0; i < count; i++) {
    let amount = baseAmount;
    if (remainder > 0) {
      const delta = Math.min(remainder, 0.01);
      amount = Math.round((amount + delta) * 100) / 100;
      remainder = Math.round((remainder - delta) * 100) / 100;
    }

    const title = existingTitles[i] || `Milestone ${i + 1}`;
    suggestions.push({ title, amount });
  }

  return suggestions;
};

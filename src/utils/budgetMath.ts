// Helpers to compute per-month budgets when "special spendings" (extras) are
// added on top of the auto-calculated monthly budget.
//
// Rule:
//   baseAuto      = yearly / 12  (auto per-month if nothing special)
//   specialMonth  = baseAuto + extra[m]
//   otherMonth    = (yearly - sum(specialMonth budgets)) / (12 - numSpecials)
//                 = baseAuto - totalExtras / (12 - numSpecials)
//
// So adding 20k to April keeps yearly fixed and shrinks the other 11 months.

export const keyFor = (y: number, m: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}`;

export interface RecomputeResult {
  overrides: Record<string, number>;
  otherBudget: number;
  baseAuto: number;
  totalExtras: number;
  numSpecials: number;
  overYearly: boolean;
}

export const recomputeOverrides = (
  yearly: number,
  fyStartMonth: number,
  fyStartYear: number,
  extras: Record<string, number>,
): RecomputeResult => {
  const cleanExtras: Record<string, number> = {};
  Object.entries(extras || {}).forEach(([k, v]) => {
    if (typeof v === 'number' && v > 0) cleanExtras[k] = v;
  });

  // Build the 12 FY month keys
  const fyKeys: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(fyStartYear, fyStartMonth + i, 1);
    fyKeys.push(keyFor(d.getFullYear(), d.getMonth()));
  }

  // Only count extras that fall inside the current FY for the math
  const fyExtras: Record<string, number> = {};
  fyKeys.forEach(k => { if (cleanExtras[k]) fyExtras[k] = cleanExtras[k]; });

  const numSpecials = Object.keys(fyExtras).length;
  const totalExtras = Object.values(fyExtras).reduce((s, v) => s + v, 0);
  const baseAuto = yearly > 0 ? yearly / 12 : 0;
  const otherCount = Math.max(0, 12 - numSpecials);
  const otherBudget = yearly > 0 && otherCount > 0
    ? baseAuto - totalExtras / otherCount
    : baseAuto;

  const overrides: Record<string, number> = {};
  if (yearly > 0) {
    fyKeys.forEach(k => {
      const extra = fyExtras[k] || 0;
      if (extra > 0) {
        overrides[k] = Math.round(baseAuto + extra);
      } else if (otherCount > 0) {
        overrides[k] = Math.max(0, Math.round(otherBudget));
      }
    });
  } else {
    // No yearly → still expose specials as raw extras on top of whatever
    // the default monthly is (computed by caller).
    Object.entries(fyExtras).forEach(([k, v]) => { overrides[k] = v; });
  }

  // Keep any out-of-FY extras as-is (legacy / future planning)
  Object.entries(cleanExtras).forEach(([k, v]) => {
    if (!fyKeys.includes(k)) overrides[k] = v;
  });

  return {
    overrides,
    otherBudget: Math.round(otherBudget),
    baseAuto: Math.round(baseAuto),
    totalExtras,
    numSpecials,
    overYearly: yearly > 0 && (totalExtras > yearly || (otherCount > 0 && otherBudget < 0)),
  };
};
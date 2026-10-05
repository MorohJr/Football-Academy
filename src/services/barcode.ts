// The single exception to E3 (SPEC 1.1, 15.10): a barcode number is sent to Open Food Facts to get nutrition values.
// Nothing else leaves the device. Coverage of Israeli products is partial; kosher class is set by hand.

export interface OffProduct {
  code: string;
  name: string;
  brand: string;
  per100: { kcal: number; protein: number; carbs: number; fat: number };
}

const FIELDS = 'code,product_name,product_name_he,generic_name,brands,nutriments';

interface OffRaw {
  code?: string;
  product_name?: string;
  product_name_he?: string;
  generic_name?: string;
  brands?: string;
  nutriments?: Record<string, number | string | undefined>;
}

const num = (v: unknown) => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

export function mapOff(p: OffRaw): OffProduct | null {
  const n = p.nutriments ?? {};
  let kcal = num(n['energy-kcal_100g']);
  if (kcal === null) {
    const kj = num(n['energy_100g']);
    kcal = kj === null ? null : kj / 4.184;
  }
  const name = (p.product_name_he || p.product_name || p.generic_name || '').trim();
  if (!name || kcal === null) return null;
  const r1 = (x: number | null) => Math.round((x ?? 0) * 10) / 10;
  return {
    code: p.code ?? '',
    name,
    brand: (p.brands ?? '').split(',')[0]!.trim(),
    per100: { kcal: Math.round(kcal), protein: r1(num(n['proteins_100g'])), carbs: r1(num(n['carbohydrates_100g'])), fat: r1(num(n['fat_100g'])) },
  };
}

export async function productByBarcode(code: string): Promise<OffProduct | null> {
  if (!navigator.onLine) throw new Error('אין אינטרנט. אפשר להוסיף ידנית');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`שגיאה מהשרת (${res.status})`);
    const data = (await res.json()) as { status?: number; product?: OffRaw };
    if (!data.product || data.status === 0) return null;
    return mapOff({ ...data.product, code });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('החיפוש לקח יותר מדי זמן', { cause: e });
    throw e;
  } finally {
    clearTimeout(t);
  }
}

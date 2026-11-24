export const years = [2026, 2027, 2028, 2029, 2030];

export type Metric = {
  id: string;
  name: string;
  slice: string;
  intermediate: boolean;
  formula: string;
  values: (number | null)[];
};

export type Sheet = { id: string; name: string; metrics: Metric[]; previous?: Metric[] };
export type Model = { id: string; name: string; sheets: Sheet[] };

export function createSheet(number: number): Sheet {
  return { id: 'sheet-' + number, name: 'Лист ' + number, metrics: [] };
}

export const initialModels: Model[] = ['Модель 1', 'Модель 2', 'Модель N'].map((name, index) => ({
  id: 'FM-' + String(1001 + index),
  name,
  sheets: [createSheet(1)],
}));

const operators = {
  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b,
};
const numberPattern = '[+-]?(?:\\d+(?:[.,]\\d+)?|[.,]\\d+)';
const formulaPattern = new RegExp('^(' + numberPattern + ')(?:\\s*([+*/-])\\s*(' + numberPattern + '))?$');

export function calculate(formula: string): number | null {
  const match = formula.trim().replace(/^=\s*/, '').match(formulaPattern);
  if (!match) return null;
  const [, left, operator, right] = match;
  const first = Number(left.replace(',', '.'));
  const result = operator ? operators[operator as keyof typeof operators](first, Number(right.replace(',', '.'))) : first;
  return Number.isFinite(result) ? result : null;
}

export function exportSheet(model: Model, sheet: Sheet) {
  function escape(value: string | number | null) {
    const text = String(value ?? '');
    const safe = typeof value === 'string' && /^[\s]*[=+@-]/.test(value) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
  }
  const rows = [
    ['Показатель', 'Аналитический срез', 'Формула', ...years],
    ...sheet.metrics.map(metric => [metric.name, metric.slice, metric.formula, ...metric.values]),
  ];
  const csv = rows.map(row => row.map(escape).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = model.name + ' — ' + sheet.name + '.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, IconButton, ModalDF, TextField } from '@daisforge/ui';
import { Canvas, TableCanvas, type ColumnConfig } from '@daisforge/ui/components/TableCanvas';
import {
  IconChevronLeft, IconChevronRight, IconDownload, IconFilter, IconFolderOutline, IconFullscreenOn,
  IconKeyOutline, IconListView, IconPinOutline, IconPlus, IconSearch, IconSettingsOutline,
} from '@daisforge/ui/icons';
import { colors, ReportDialog, ReportPage } from './styles';
import { calculate, createSheet, exportSheet, initialModels, years, type Metric, type Model, type Sheet } from './workbook';

export const meta = {
  title: 'Конструктор отчётов',
  description: 'Модели, показатели и прогнозы по годам в редакторе отчётов.',
  category: 'Финансовое моделирование',
};

type Dialog = 'model' | 'metric' | 'intermediate' | 'settings' | 'errors';
type GridRow = {
  id: string;
  cells: Record<string, string>;
  band: 'header' | 'data' | 'blank';
  groupStart?: boolean;
};

const emptyValues = () => years.map(() => null);
const format = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const initialYearSelection = years.slice();

function sheetColumns(visibleYears: number[], hasMetrics: boolean): ColumnConfig<GridRow>[] {
  const specs = [
    { key: 'number', name: '', width: 48 },
    { key: 'metric', name: 'A', width: 238 },
    { key: 'slice', name: 'B', width: 215 },
    { key: 'formula', name: 'C', width: 150 },
    ...visibleYears.map(year => ({ key: String(year), name: String.fromCharCode(68 + years.indexOf(year)), width: 142 })),
  ];
  return specs.map(column => ({
    ...column,
    contentAlign: column.key === 'number' ? 'center' : 'left',
    themeOverride: ({ row }) => {
      if (column.key === 'number' || row.band === 'header') return { bgCell: colors.header };
      if (row.groupStart || (!hasMetrics && row.id === 'blank-0')) return { bgCell: colors.selected };
      return undefined;
    },
    renderCell: ({ row }) => {
      const label = row.cells[column.key] ?? '';
      if (!label || row.band !== 'header') return label;
      return <Canvas.Container alignItems="center" padding={{ left: 8, right: 8 }}><Canvas.Text font="600 12px SB Sans Text" color={colors.ink}>{label}</Canvas.Text></Canvas.Container>;
    },
  }));
}

export default function ReportBuilder() {
  const [models, setModels] = useState(initialModels);
  const [modelId, setModelId] = useState(initialModels[0].id);
  const [sheetId, setSheetId] = useState('sheet-1');
  const [modelQuery, setModelQuery] = useState('');
  const [tableQuery, setTableQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(true);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formulaInput, setFormulaInput] = useState('');
  const [name, setName] = useState('');
  const [slice, setSlice] = useState('');
  const [visibleYears, setVisibleYears] = useState(initialYearSelection);
  const [grouped, setGrouped] = useState(false);
  const [keyView, setKeyView] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState('Нет изменений');
  const [errors, setErrors] = useState<string[]>([]);
  const editor = useRef<HTMLElement>(null);
  const addButton = useRef<HTMLDivElement>(null);
  const menuBox = useRef<HTMLDivElement>(null);

  const model = models.find(item => item.id === modelId) ?? models[0];
  const sheet = model.sheets.find(item => item.id === sheetId) ?? model.sheets[0];
  const selected = sheet.metrics.find(metric => metric.id === selectedId);
  const query = tableQuery.trim().toLocaleLowerCase('ru');
  const modelNeedle = modelQuery.trim().toLocaleLowerCase('ru');
  const filteredModels = models.filter(item => (item.name + ' ' + item.id).toLocaleLowerCase('ru').includes(modelNeedle));
  const visibleMetrics = sheet.metrics.filter(metric =>
    [metric.name, metric.slice, metric.formula, metric.id].some(value => value.toLocaleLowerCase('ru').includes(query)),
  );
  if (grouped) visibleMetrics.sort((a, b) => a.slice.localeCompare(b.slice, 'ru') || a.name.localeCompare(b.name, 'ru'));
  const hasMetrics = sheet.metrics.length > 0;
  const columns = useMemo(() => sheetColumns(visibleYears, hasMetrics), [visibleYears, hasMetrics]);

  const rows: GridRow[] = [
    { id: 'years', band: 'header', cells: { formula: 'Год', ...Object.fromEntries(years.map(year => [year, String(year)])) } },
    { id: 'types', band: 'header', cells: { formula: 'Тип данных', ...Object.fromEntries(years.map(year => [year, 'Прогноз'])) } },
    { id: 'labels', band: 'header', cells: { metric: 'Показатель', slice: 'Аналитический срез', formula: 'Формула' } },
    ...visibleMetrics.map((metric, index): GridRow => ({
      id: metric.id,
      band: 'data',
      groupStart: grouped && (index === 0 || visibleMetrics[index - 1].slice !== metric.slice),
      cells: {
        number: String(index + 1),
        metric: keyView ? metric.id : (metric.intermediate ? 'ƒ  ' : '') + metric.name,
        slice: metric.slice,
        formula: metric.formula,
        ...Object.fromEntries(years.map((year, yearIndex) => {
          const value = metric.values[yearIndex];
          return [year, value === null ? '' : format.format(value)];
        })),
      },
    })),
    ...Array.from({ length: Math.max(31 - visibleMetrics.length, 4) }, (_, index): GridRow => ({
      id: 'blank-' + index,
      band: 'blank',
      cells: { number: String(visibleMetrics.length + index + 1) },
    })),
  ];
  const sum = selected?.values.reduce<number>((total, value, index) => total + (visibleYears.includes(years[index]) ? value ?? 0 : 0), 0) ?? 0;

  useEffect(() => {
    if (!menu) return;
    function dismiss(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuBox.current?.contains(target) && !addButton.current?.contains(target)) setMenu(false);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenu(false);
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [menu]);

  function updateSheet(update: (current: Sheet) => Sheet) {
    setModels(previous => previous.map(item => item.id === model.id
      ? { ...item, sheets: item.sheets.map(current => current.id === sheet.id ? update(current) : current) }
      : item));
  }

  function selectMetric(metric?: Metric) {
    setSelectedId(metric?.id ?? null);
    setFormulaInput(metric?.formula ?? '');
  }

  function changeSheet(nextModel: string, nextSheet: string) {
    setModelId(nextModel);
    setSheetId(nextSheet);
    selectMetric();
    setTableQuery('');
    setErrors([]);
    setMenu(false);
    setStatus('Лист открыт');
  }

  function openDialog(next: Dialog) {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setMenu(false);
    setName('');
    setSlice('');
    setDialog(next);
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = name.trim();
    if (!label) return;
    if (dialog === 'model') {
      const next: Model = { id: 'FM-' + String(1001 + models.length), name: label, sheets: [createSheet(1)] };
      setModels(items => [...items, next]);
      setModelQuery('');
      changeSheet(next.id, next.sheets[0].id);
      setStatus('Модель добавлена');
    } else {
      const metric: Metric = {
        id: 'P-' + String(sheet.metrics.length + 1).padStart(3, '0'),
        name: label,
        slice: slice.trim(),
        intermediate: dialog === 'intermediate',
        formula: '',
        values: emptyValues(),
      };
      updateSheet(current => ({ ...current, metrics: [...current.metrics, metric], previous: current.metrics }));
      setTableQuery('');
      selectMetric(metric);
      setStatus(dialog === 'intermediate' ? 'Промежуточный показатель создан' : 'Показатель добавлен');
    }
    setDialog(null);
  }

  function updateFormula(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const formula = formulaInput.trim();
    if (formula === selected.formula) return;
    updateSheet(current => ({
      ...current,
      previous: current.metrics,
      metrics: current.metrics.map(metric => metric.id === selected.id ? { ...metric, formula, values: emptyValues() } : metric),
    }));
    setStatus('Формула обновлена');
  }

  function runCalculation() {
    if (!sheet.metrics.length) {
      setStatus('Добавьте показатель для расчёта');
      return;
    }
    const draft = formulaInput.trim();
    const changes = selected && draft !== selected.formula;
    const notices: string[] = [];
    let count = 0;
    const metrics = sheet.metrics.map(metric => {
      const formula = changes && selected.id === metric.id ? draft : metric.formula;
      if (!formula) return { ...metric, formula, values: emptyValues() };
      const value = calculate(formula);
      if (value === null) notices.push(metric.name + ': проверьте выражение');
      else count += 1;
      return { ...metric, formula, values: years.map(() => value) };
    });
    updateSheet(current => ({ ...current, previous: current.metrics, metrics }));
    setErrors(notices);
    setStatus(notices.length ? 'Есть ошибки расчёта' : count ? 'Рассчитано показателей: ' + count : 'Введите формулу для расчёта');
  }

  function undo() {
    if (!sheet.previous) return;
    const restored = sheet.previous;
    updateSheet(current => ({ ...current, metrics: restored, previous: undefined }));
    selectMetric(restored.find(metric => metric.id === selectedId));
    setErrors([]);
    setStatus('Изменение отменено');
  }

  function addSheet() {
    const next = createSheet(model.sheets.length + 1);
    setModels(previous => previous.map(item => item.id === model.id ? { ...item, sheets: [...item.sheets, next] } : item));
    changeSheet(model.id, next.id);
    setStatus('Лист добавлен');
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await editor.current?.requestFullscreen();
    } catch {
      setStatus('Полноэкранный режим недоступен');
    }
  }

  const metricDialog = dialog === 'metric' || dialog === 'intermediate';
  const dialogTitle = dialog === 'model' ? 'Новая модель' : dialog === 'intermediate' ? 'Промежуточный показатель'
    : dialog === 'metric' ? 'Добавить показатель' : dialog === 'settings' ? 'Настройки таблицы' : 'Журнал ошибок';

  return <ReportPage aria-label={meta.title}>
    <header className="report-bar">
      <div className="report-brand"><span className="report-mark" aria-hidden="true"><IconListView size="s" /></span>Модельер</div>
      <div className="report-profile"><span>{model.name} / {sheet.name}</span><span className="report-avatar" aria-hidden="true">КК</span></div>
    </header>
    <div className="report-title">
      <IconButton size="s" view="secondary" aria-label="К списку прототипов" onClick={() => { location.hash = "/"; }}><IconChevronLeft size="s" /></IconButton>
      <h1>{meta.title}</h1>
    </div>
    <div className="report-layout" data-collapsed={collapsed}>
      <aside className="report-card model-panel" data-collapsed={collapsed} aria-label="Навигация по моделям">
        {collapsed ? <IconButton size="s" view="clear" aria-label="Развернуть навигацию" onClick={() => setCollapsed(false)}><IconChevronRight size="s" /></IconButton> : <>
          <div className="model-heading">
            <h2>Навигация по моделям</h2>
            <IconButton size="s" view="clear" aria-label="Свернуть навигацию" onClick={() => setCollapsed(true)}><IconChevronLeft size="s" /></IconButton>
          </div>
          <div className="model-search">
            <TextField size="s" aria-label="Поиск моделей" placeholder="Поиск моделей" value={modelQuery} contentLeft={<IconSearch size="s" />} onChange={event => setModelQuery(event.target.value)} />
            <IconButton size="s" view="accent" aria-label="Добавить модель" onClick={() => openDialog('model')}><IconPlus size="s" /></IconButton>
          </div>
          <div className="model-list">
            {filteredModels.map(item =>
              <button key={item.id} type="button" className="model-option" aria-pressed={item.id === model.id}
                onClick={() => changeSheet(item.id, item.sheets[0].id)}>
                <IconFolderOutline size="s" /><span><strong>{item.name}</strong><small>{item.id}</small></span>
              </button>,
            )}
            {!filteredModels.length && <p className="model-empty">Модели не найдены</p>}
          </div>
        </>}
      </aside>
      <section className="report-card report-editor" aria-label="Рабочая область отчёта" ref={editor}>
        <form className="report-formula" onSubmit={updateFormula}>
          <TextField size="s" aria-label="Формула показателя" placeholder="Введите формулу, например =120*1,05"
            contentLeft={<span className="report-formula-symbol">ƒₓ</span>} value={formulaInput}
            onChange={event => setFormulaInput(event.target.value)} disabled={!selected} />
          <IconButton type="button" size="s" view="secondary" aria-label="Настройки формулы и таблицы" onClick={() => openDialog('settings')}><IconSettingsOutline size="s" /></IconButton>
          <Button type="button" size="s" view="accent" onClick={runCalculation}>Рассчитать модель</Button>
        </form>
        <div className="report-workspace">
          <div className="grid-tools">
            <div className="grid-search"><TextField size="xs" placeholder="Поиск" aria-label="Поиск показателей" value={tableQuery}
              contentLeft={<IconSearch size="xs" />} onChange={event => setTableQuery(event.target.value)} /></div>
            <div className="grid-actions">
              <Button size="xs" view="clear" contentLeft={<IconPlus size="xs" />} onClick={() => openDialog('metric')}>Показатель</Button>
              <Button size="xs" view="secondary" contentLeft={<IconDownload size="xs" />} onClick={() => exportSheet(model, sheet)}>Выгрузить</Button>
              <Button size="xs" view={keyView ? 'secondary' : 'clear'} aria-pressed={keyView} contentLeft={<IconKeyOutline size="xs" />} onClick={() => setKeyView(value => !value)}>Ключ-текст</Button>
              <Button size="xs" view={grouped ? 'secondary' : 'clear'} aria-pressed={grouped} contentLeft={<IconFilter size="xs" />} onClick={() => setGrouped(value => !value)}>Группировать</Button>
              <Button size="xs" view="clear" disabled={!sheet.previous} onClick={undo}>Отменить</Button>
              <IconButton size="xs" view={pinned ? 'secondary' : 'clear'} aria-label="Закрепить столбец показателей" aria-pressed={pinned} onClick={() => setPinned(value => !value)}><IconPinOutline size="xs" /></IconButton>
              <IconButton size="xs" view="clear" aria-label="Полноэкранный режим" onClick={() => void toggleFullscreen()}><IconFullscreenOn size="xs" /></IconButton>
            </div>
          </div>
          <div className="report-grid-shell">
            <div className="report-grid" role="region" aria-label="Таблица прогноза">
              <TableCanvas rows={rows} columnConfig={columns} tableConfig={{
                containerStyle: { height: 'var(--report-grid-height)' },
                controlBlock: { show: false },
                rowHeight: 22,
                headerRowHeight: 22,
                appearance: { variant: 'default', zebra: false },
                borders: { vertical: true, horizontal: true },
                resizableColumn: true,
                stickyColumns: pinned ? ['number', 'metric'] : ['number'],
                highlightActiveType: 'row',
                onCellClicked: (_cell, { row }) => {
                  if (row.band === 'data') selectMetric(sheet.metrics.find(metric => metric.id === row.id));
                  if (row.band === 'blank' && row.id === 'blank-0' && !sheet.metrics.length) setMenu(true);
                },
              }} />
              {!sheet.metrics.length && !query && <div className="metric-action" ref={addButton}>
                <Button size="xs" view="clear" aria-expanded={menu} aria-controls={menu ? "report-metric-menu" : undefined} onClick={() => setMenu(value => !value)} contentLeft={<IconPlus size="xs" />}>Добавить показатель</Button>
              </div>}
              {menu && !sheet.metrics.length && !query && <div className="metric-menu" id="report-metric-menu" ref={menuBox}>
                <Button size="s" view="secondary" onClick={() => openDialog('metric')}>Добавить показатель</Button>
                <Button size="s" view="clear" onClick={() => openDialog('intermediate')}>Промежуточный показатель</Button>
              </div>}
            </div>
            <aside className="report-side-tools" aria-label="Инструменты таблицы">
              <IconButton size="xs" view="clear" aria-label="Настройки столбцов" onClick={() => openDialog('settings')}><IconSettingsOutline size="xs" /></IconButton>
              <IconButton size="xs" view="clear" aria-label="Журнал расчётов" onClick={() => openDialog('errors')}><IconListView size="xs" /></IconButton>
            </aside>
          </div>
          <div className="report-status">
            <span role="status">{status}</span>
            {query && <span>Найдено: {visibleMetrics.length}</span>}
            <Button size="xs" view="clear" onClick={() => openDialog('errors')}>Журнал ошибок{errors.length ? ' (' + errors.length + ')' : ''}</Button>
            <div className="report-totals">
              <span>Выбрано <strong>{selected ? 1 : 0}</strong></span>
              <span>Сумма <strong>{format.format(sum)}</strong></span>
            </div>
          </div>
        </div>
        <div className="report-tabs" aria-label="Листы модели">
          {model.sheets.map(item => <Button key={item.id} size="s" view={item.id === sheet.id ? 'secondary' : 'clear'} aria-pressed={item.id === sheet.id}
            onClick={() => changeSheet(model.id, item.id)}>{item.name}</Button>)}
          <IconButton size="s" view="secondary" aria-label="Добавить лист" onClick={addSheet}><IconPlus size="s" /></IconButton>
        </div>
      </section>
    </div>
    <ModalDF isOpen={dialog !== null} onClose={() => setDialog(null)} closeOnEsc closeOnOverlayClick aria-labelledby="report-dialog-title">
      <ModalDF.Main><ReportDialog>
        <h2 id="report-dialog-title">{dialogTitle}</h2>
        {(dialog === 'model' || metricDialog) && <form onSubmit={create}>
          <TextField label="Название" value={name} onChange={event => setName(event.target.value)} autoFocus required />
          {metricDialog && <TextField label="Аналитический срез" value={slice} onChange={event => setSlice(event.target.value)} />}
          <div className="dialog-actions">
            <Button size="s" view="clear" type="button" onClick={() => setDialog(null)}>Отмена</Button>
            <Button size="s" view="accent" type="submit" disabled={!name.trim()}>Добавить</Button>
          </div>
        </form>}
        {dialog === 'settings' && <>
          <p>Выберите годы прогноза. Для расчёта введите число или выражение из двух чисел, например =120 * 1,05. Результат применяется ко всем годам.</p>
          <div className="dialog-actions">{years.map(year => <Button key={year} size="s" view={visibleYears.includes(year) ? 'secondary' : 'clear'}
            aria-pressed={visibleYears.includes(year)} onClick={() => setVisibleYears(current => current.includes(year) ? current.filter(value => value !== year) : [...current, year].sort())}>{year}</Button>)}</div>
        </>}
        {dialog === 'errors' && (errors.length ? <ul className="report-error-list">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul> : <p>Ошибок нет.</p>)}
        {(dialog === 'settings' || dialog === 'errors') && <div className="dialog-actions">
          <Button size="s" view="secondary" onClick={() => setDialog(null)}>Закрыть</Button>
        </div>}
      </ReportDialog></ModalDF.Main>
    </ModalDF>
  </ReportPage>;
}

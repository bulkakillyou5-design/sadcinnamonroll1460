import styled from 'styled-components';
import { surfaceSolidCard, textPrimary, textSecondary } from '@daisforge/ui/tokens';

export const colors = {
  ink: '#29213d',
  brand: '#34264f',
  accent: '#6742ad',
  page: '#f5f2f9',
  line: '#e0d9eb',
  header: '#f3edf9',
  selected: '#eae0f8',
  muted: '#6c627e',
};

export const ReportPage = styled.main`
  color: ${textPrimary};
  background: ${colors.page};
  min-height: 100vh;
  font-family: 'SB Sans Text', sans-serif;
  --report-grid-height: max(440px, calc(100vh - 362px));

  .report-bar {
    min-height: 62px;
    padding: 0 26px;
    background: ${colors.brand};
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }
  .report-brand, .report-profile, .report-title, .model-heading, .model-search,
  .report-formula, .grid-tools, .grid-actions, .report-status, .report-tabs {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .report-brand { gap: 12px; font-size: 18px; font-weight: 600; }
  .report-mark, .report-avatar {
    display: grid;
    place-items: center;
    height: 34px;
    width: 34px;
    border-radius: 9px;
    color: #f3eaff;
    background: #604781;
  }
  .report-avatar { border-radius: 50%; font-size: 12px; font-weight: 600; }
  .report-profile { color: #e2d5f3; font-size: 13px; }
  .report-title { padding: 18px 26px; gap: 12px; }
  .report-title h1 {
    color: ${colors.ink};
    font-family: 'SB Sans Display', sans-serif;
    font-size: clamp(24px, 2vw, 36px);
    font-weight: 600;
    line-height: 1.15;
  }
  .report-layout {
    display: grid;
    grid-template-columns: clamp(222px, 19vw, 360px) minmax(0, 1fr);
    gap: 16px;
    padding: 0 26px 24px;
  }
  .report-layout[data-collapsed='true'] { grid-template-columns: 50px minmax(0, 1fr); }
  .report-card {
    min-width: 0;
    background: ${surfaceSolidCard};
    border: 1px solid ${colors.line};
    border-radius: 14px;
    box-shadow: 0 4px 16px #3726510c;
  }
  .model-panel { padding: 16px 12px; }
  .model-panel[data-collapsed='true'] { padding: 10px 4px; }
  .model-heading { justify-content: space-between; padding-left: 3px; margin-bottom: 10px; }
  .model-heading h2 { font-family: 'SB Sans Display', sans-serif; font-size: 19px; line-height: 1.15; font-weight: 600; }
  .model-search > :first-child, .report-formula > :first-child { flex: 1; min-width: 0; }
  .model-list { display: grid; gap: 6px; margin-top: 16px; }
  .model-option {
    width: 100%;
    background: transparent;
    color: ${textPrimary};
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 11px 12px;
    text-align: left;
    cursor: pointer;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
  }
  .model-option:hover { background: ${colors.header}; }
  .model-option[aria-pressed='true'] {
    color: ${colors.ink};
    background: ${colors.header};
    border-color: ${colors.line};
    box-shadow: inset 3px 0 ${colors.accent};
  }
  .model-option svg { color: ${colors.accent}; }
  .model-option strong, .model-option small { display: block; }
  .model-option strong { font-size: 15px; font-weight: 600; }
  .model-option small, .model-empty { color: ${textSecondary}; font-size: 12px; margin-top: 3px; }
  .report-editor { padding: 10px; }
  .report-formula { margin-bottom: 8px; }
  .report-formula-symbol { font-family: Georgia, serif; font-style: italic; }
  .report-workspace {
    border: 1px solid ${colors.line};
    border-radius: 8px;
    overflow: hidden;
  }
  .grid-tools {
    padding: 4px 6px;
    justify-content: space-between;
    flex-wrap: wrap;
    border-bottom: 1px solid ${colors.line};
  }
  .grid-search { flex: 1; min-width: 135px; max-width: 230px; }
  .grid-actions { flex-wrap: wrap; gap: 4px; }
  .report-grid-shell { display: grid; grid-template-columns: minmax(0, 1fr) 38px; }
  .report-grid { position: relative; min-width: 0; background: white; }
  .report-side-tools {
    border-left: 1px solid ${colors.line};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 0;
    gap: 4px;
  }
  .report-side-tools > :last-child { margin-top: auto; }
  .metric-action {
    position: absolute;
    z-index: 2;
    top: 88px;
    left: 52px;
  }
  .metric-menu {
    position: absolute;
    z-index: 3;
    top: 114px;
    left: clamp(62px, 12vw, 250px);
    width: min(252px, calc(100% - 74px));
    padding: 5px;
    border: 1px solid ${colors.line};
    border-radius: 10px;
    background: ${surfaceSolidCard};
    box-shadow: 0 8px 24px #32214f25;
    display: grid;
    gap: 3px;
  }
  .metric-menu button { width: 100%; justify-content: flex-start; }
  .report-status {
    min-height: 33px;
    padding: 2px 8px;
    border-top: 1px solid ${colors.line};
    flex-wrap: wrap;
    color: ${colors.muted};
    font-size: 12px;
  }
  .report-totals { margin-left: auto; display: flex; gap: 12px; }
  .report-totals strong { color: ${colors.ink}; font-variant-numeric: tabular-nums; }
  .report-tabs { margin-top: 8px; flex-wrap: wrap; gap: 4px; }
  .report-editor:fullscreen { background: ${surfaceSolidCard}; }
  .report-editor:fullscreen .report-grid { --report-grid-height: calc(100vh - 167px); }
  @media (max-width: 860px) {
    .report-layout, .report-layout[data-collapsed='true'] { grid-template-columns: minmax(0, 1fr); gap: 10px; }
    .model-list { grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); }
    .model-panel[data-collapsed='true'] { padding: 4px 12px; }
  }
  @media (max-width: 540px) {
    .report-bar, .report-title { padding-inline: 12px; }
    .report-layout { padding-inline: 10px; }
    .report-editor { padding: 6px; }
    .report-formula { flex-wrap: wrap; }
    .report-formula > :first-child { flex-basis: 100%; }
    .report-formula > :last-child { margin-left: auto; }
    .report-grid-shell { grid-template-columns: minmax(0, 1fr); }
    .report-side-tools { display: none; }
  }
`;

export const ReportDialog = styled.div`
  width: min(410px, calc(100vw - 64px));
  display: grid;
  gap: 12px;
  color: ${textPrimary};
  h2 { font-size: 22px; font-weight: 600; }
  p, .report-error-list { color: ${textSecondary}; font-size: 14px; margin: 0; }
  form { display: grid; gap: 12px; }
  .dialog-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
`;

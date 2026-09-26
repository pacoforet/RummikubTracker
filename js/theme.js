import { getState } from './state.js';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

/** Applies 'dark' | 'light' | 'auto' and syncs the browser UI color. */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const effective = theme === 'auto' ? (darkQuery.matches ? 'dark' : 'light') : theme;
  const color = effective === 'dark' ? '#121212' : '#ffffff';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}

/** Keeps 'auto' in sync when the OS switches between light and dark. */
export function watchSystemTheme(onChange) {
  darkQuery.addEventListener('change', () => {
    if (getState().settings.theme === 'auto') {
      applyTheme('auto');
      onChange?.();
    }
  });
}

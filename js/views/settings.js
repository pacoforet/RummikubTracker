import { setLanguage } from '../i18n.js';
import { getState, setState } from '../state.js';
import { openModal, setSegmentValue } from '../ui.js';
import { applyTheme } from '../theme.js';

function syncSettingsControls() {
  const { settings } = getState();
  setSegmentValue('theme', settings.theme);
  setSegmentValue('language', settings.language);
}

export const actions = {
  'open-settings': () => {
    syncSettingsControls();
    openModal('modal-settings');
  },
  'set-theme': (target) => {
    const theme = target.dataset.value;
    applyTheme(theme);
    setState((s) => ({ ...s, settings: { ...s.settings, theme } }));
    syncSettingsControls();
  },
  'set-language': (target) => {
    const language = target.dataset.value;
    setState((s) => ({ ...s, settings: { ...s.settings, language } }));
    setLanguage(language); // triggers a full re-translation via onLanguageChange
    syncSettingsControls();
  },
};

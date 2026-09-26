const translations = {
  es: {
    app: {
      title: 'Rummikub',
    },
    setup: {
      config: 'Configuración',
      targetScore: 'Puntuación Objetivo (Opcional)',
      targetPlaceholder: 'ej. 200',
      scoringRule: 'Regla de Puntuación',
      standard: 'Estándar',
      simple: 'Simple',
      standardDesc:
        'El ganador suma los puntos de los perdedores. Los perdedores restan sus puntos.',
      simpleDesc: 'Introduce el cambio de puntuación (+/-) para cada jugador manualmente.',
      players: 'Jugadores',
      addPlayer: '+ Añadir Jugador',
      startGame: 'Iniciar Partida',
      quickStart: 'Repetir Última Partida',
      defaultPlayer: 'Jugador {n}',
    },
    scoreboard: {
      round: 'RONDA',
      target: 'META',
      undo: 'Deshacer',
      end: 'Fin',
      recordRound: '+ Registrar Ronda',
      noTarget: '-',
      targetPrefix: 'Meta:',
      sortByScore: 'Ordenar',
      position: ['1ro', '2do', '3ro', '4to', '5to', '6to'],
    },
    roundEntry: {
      title: 'Resultados de la Ronda',
      instructionStandard: 'Selecciona el GANADOR, luego marca las fichas de los perdedores.',
      instructionSimple: 'Introduce los puntos (+/-) para cada jugador.',
      winner: 'GANADOR',
      choose: 'Elegir',
      tiles: 'fichas',
      pts: 'pts',
      clear: 'Limpiar',
      useNumeric: 'Usar entrada numérica',
      useTiles: 'Usar fichas',
      points: 'Puntos',
      save: 'Guardar Ronda',
      projected: 'Proyección',
    },
    history: {
      title: 'Historial de la Partida',
      empty: 'Sin historial todavía. ¡Registra tu primera ronda!',
      round: 'Ronda',
    },
    winner: {
      title: '¡Ganador!',
      finalScores: 'Puntuaciones Finales',
      newGame: 'Nueva Partida',
      keepPlaying: 'Seguir Jugando',
    },
    summary: {
      title: 'Resumen de la Partida',
      totalRounds: 'Total de Rondas',
      winner: 'Ganador',
      bestRound: 'Mejor Ronda',
      mostWins: 'Más Rondas Ganadas',
      share: 'Compartir Resultados',
      newGame: 'Nueva Partida',
      keepPlaying: 'Seguir Jugando',
    },
    chart: {
      title: 'Gráfico de Puntuación',
      round: 'Ronda',
      points: 'Puntos',
      noData: 'Aún no hay datos',
    },
    archive: {
      title: 'Partidas Anteriores',
      empty: 'No hay partidas guardadas todavía.',
      rounds: 'rondas',
      players: 'jugadores',
      delete: 'Eliminar',
    },
    stats: {
      roundsWon: 'Rondas Ganadas',
      avgPerRound: 'Promedio/Ronda',
      bestRound: 'Mejor Ronda',
    },
    settings: {
      title: 'Ajustes',
      theme: 'Tema',
      dark: 'Oscuro',
      light: 'Claro',
      auto: 'Auto',
      language: 'Idioma',
    },
    dialog: {
      endGameTitle: 'Terminar Partida',
      endGameMsg: '¿Estás seguro de que quieres terminar esta partida?',
      undoTitle: 'Deshacer Ronda',
      undoMsg: '¿Deshacer la última ronda?',
      deleteRoundTitle: 'Eliminar Ronda',
      deleteRoundMsg: '¿Eliminar esta ronda? Las puntuaciones se recalcularán.',
      deleteArchiveTitle: 'Eliminar Partida',
      deleteArchiveMsg: '¿Eliminar esta partida del historial?',
      noRoundsUndo: 'No hay rondas para deshacer.',
      selectWinner: 'Por favor, selecciona un ganador.',
      invalidTarget: 'La puntuación objetivo debe ser un número entero mayor que 0.',
      emptyName: 'Todos los jugadores necesitan un nombre.',
      duplicateName: 'Hay dos jugadores con el mismo nombre.',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      ok: 'Aceptar',
    },
    toast: {
      roundSaved: 'Ronda guardada',
      roundDeleted: 'Ronda eliminada',
      roundUndone: 'Última ronda deshecha',
      gameArchived: 'Partida archivada',
      copied: 'Copiado al portapapeles',
      shared: 'Resultados compartidos',
      installReady: 'App lista para instalar',
      dataRecovered: 'No se pudo cargar la partida guardada. Se ha hecho una copia de seguridad.',
      archiveTrimmed: 'Se ha eliminado la partida más antigua del archivo (máx. {n}).',
      updateAvailable: 'Nueva versión disponible',
      reload: 'Recargar',
    },
    a11y: {
      description: 'Lleva la puntuación de tus partidas de Rummikub',
      chart: 'Gráfico de puntuación',
      history: 'Historial de la partida',
      archive: 'Partidas anteriores',
      settings: 'Ajustes',
      close: 'Cerrar',
      setup: 'Configuración de la partida',
      scoreboard: 'Marcador',
      playerScores: 'Puntuaciones de los jugadores',
      playerName: 'Nombre del jugador {n}',
      removePlayer: 'Eliminar a {name}',
      tile: 'Ficha {v}, cantidad: {n}',
      joker: 'Comodín, cantidad: {n}',
      deleteRound: 'Eliminar ronda {n}',
      points: 'Puntos de {name}',
    },
  },

  en: {
    app: {
      title: 'Rummikub',
    },
    setup: {
      config: 'Configuration',
      targetScore: 'Target Score (Optional)',
      targetPlaceholder: 'e.g. 200',
      scoringRule: 'Scoring Rule',
      standard: 'Standard',
      simple: 'Simple',
      standardDesc:
        "The winner gets the sum of losers' remaining tiles. Losers get negative points.",
      simpleDesc: 'Manually enter the score change (+/-) for each player.',
      players: 'Players',
      addPlayer: '+ Add Player',
      startGame: 'Start Game',
      quickStart: 'Repeat Last Game',
      defaultPlayer: 'Player {n}',
    },
    scoreboard: {
      round: 'ROUND',
      target: 'GOAL',
      undo: 'Undo',
      end: 'End',
      recordRound: '+ Record Round',
      noTarget: '-',
      targetPrefix: 'Goal:',
      sortByScore: 'Sort',
      position: ['1st', '2nd', '3rd', '4th', '5th', '6th'],
    },
    roundEntry: {
      title: 'Round Results',
      instructionStandard: "Select the WINNER, then mark the losers' remaining tiles.",
      instructionSimple: 'Enter the points (+/-) for each player.',
      winner: 'WINNER',
      choose: 'Choose',
      tiles: 'tiles',
      pts: 'pts',
      clear: 'Clear',
      useNumeric: 'Use numeric input',
      useTiles: 'Use tiles',
      points: 'Points',
      save: 'Save Round',
      projected: 'Projected',
    },
    history: {
      title: 'Game History',
      empty: 'No history yet. Record your first round!',
      round: 'Round',
    },
    winner: {
      title: 'Winner!',
      finalScores: 'Final Scores',
      newGame: 'New Game',
      keepPlaying: 'Keep Playing',
    },
    summary: {
      title: 'Game Summary',
      totalRounds: 'Total Rounds',
      winner: 'Winner',
      bestRound: 'Best Round',
      mostWins: 'Most Rounds Won',
      share: 'Share Results',
      newGame: 'New Game',
      keepPlaying: 'Keep Playing',
    },
    chart: {
      title: 'Score Chart',
      round: 'Round',
      points: 'Points',
      noData: 'No data yet',
    },
    archive: {
      title: 'Past Games',
      empty: 'No saved games yet.',
      rounds: 'rounds',
      players: 'players',
      delete: 'Delete',
    },
    stats: {
      roundsWon: 'Rounds Won',
      avgPerRound: 'Avg/Round',
      bestRound: 'Best Round',
    },
    settings: {
      title: 'Settings',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      auto: 'Auto',
      language: 'Language',
    },
    dialog: {
      endGameTitle: 'End Game',
      endGameMsg: 'Are you sure you want to end this game?',
      undoTitle: 'Undo Round',
      undoMsg: 'Undo the last round?',
      deleteRoundTitle: 'Delete Round',
      deleteRoundMsg: 'Delete this round? Scores will be recalculated.',
      deleteArchiveTitle: 'Delete Game',
      deleteArchiveMsg: 'Delete this game from history?',
      noRoundsUndo: 'No rounds to undo.',
      selectWinner: 'Please select a winner.',
      invalidTarget: 'The target score must be a whole number greater than 0.',
      emptyName: 'Every player needs a name.',
      duplicateName: 'Two players have the same name.',
      confirm: 'Confirm',
      cancel: 'Cancel',
      ok: 'OK',
    },
    toast: {
      roundSaved: 'Round saved',
      roundDeleted: 'Round deleted',
      roundUndone: 'Last round undone',
      gameArchived: 'Game archived',
      copied: 'Copied to clipboard',
      shared: 'Results shared',
      installReady: 'App ready to install',
      dataRecovered: 'The saved game could not be loaded. A backup copy was kept.',
      archiveTrimmed: 'The oldest game was removed from the archive (max {n}).',
      updateAvailable: 'New version available',
      reload: 'Reload',
    },
    a11y: {
      description: 'Track your Rummikub game scores',
      chart: 'Score chart',
      history: 'Game history',
      archive: 'Past games',
      settings: 'Settings',
      close: 'Close',
      setup: 'Game setup',
      scoreboard: 'Scoreboard',
      playerScores: 'Player scores',
      playerName: 'Player {n} name',
      removePlayer: 'Remove {name}',
      tile: 'Tile {v}, count: {n}',
      joker: 'Joker, count: {n}',
      deleteRound: 'Delete round {n}',
      points: '{name} points',
    },
  },
};

let currentLang = 'es';
const listeners = [];

/**
 * Translates a dotted key. `{name}` placeholders are replaced with `params`.
 * Returns the key itself when no translation exists.
 */
export function t(key, params) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    if (value == null) return key;
    value = value[k];
  }
  if (value == null) return key;
  if (params && typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
  }
  return value;
}

/**
 * Applies translations to static markup: `data-i18n` sets textContent,
 * `data-i18n-aria` sets aria-label and `data-i18n-placeholder` sets placeholder.
 */
export function translateDocument(root = document) {
  root.documentElement?.setAttribute('lang', currentLang);
  root.querySelector?.('meta[name="description"]')?.setAttribute('content', t('a11y.description'));
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  });
}

export function setLanguage(lang) {
  if (translations[lang] && lang !== currentLang) {
    currentLang = lang;
    listeners.forEach((fn) => fn(lang));
  }
}

export function getLanguage() {
  return currentLang;
}

export function getAvailableLanguages() {
  return Object.keys(translations);
}

export function onLanguageChange(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

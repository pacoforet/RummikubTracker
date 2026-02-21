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
      scoreDirection: 'Gana el que tiene...',
      highest: 'Mayor puntuación',
      lowest: 'Menor puntuación',
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
        'The winner gets the sum of losers\' remaining tiles. Losers get negative points.',
      simpleDesc: 'Manually enter the score change (+/-) for each player.',
      players: 'Players',
      addPlayer: '+ Add Player',
      startGame: 'Start Game',
      quickStart: 'Repeat Last Game',
      scoreDirection: 'Winner has...',
      highest: 'Highest score',
      lowest: 'Lowest score',
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
      instructionStandard: 'Select the WINNER, then mark the losers\' remaining tiles.',
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
    },
  },
};

let currentLang = 'es';
const listeners = [];

export function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    if (value == null) return key;
    value = value[k];
  }
  return value ?? key;
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

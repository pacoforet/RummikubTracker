export function renderChart(canvas, players, rounds) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Build cumulative score data per player
  const data = {};
  players.forEach((p) => {
    data[p.id] = [0]; // start at 0
  });

  let runningScores = {};
  players.forEach((p) => (runningScores[p.id] = 0));

  rounds.forEach((round) => {
    round.changes.forEach((c) => {
      if (runningScores[c.playerId] !== undefined) {
        runningScores[c.playerId] += c.points;
      }
    });
    players.forEach((p) => {
      data[p.id].push(runningScores[p.id]);
    });
  });

  const totalPoints = rounds.length + 1; // includes starting 0
  if (totalPoints < 2) {
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--text-sec')
      .trim();
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet', w / 2, h / 2);
    return;
  }

  // Find min/max
  let minVal = 0;
  let maxVal = 0;
  players.forEach((p) => {
    data[p.id].forEach((v) => {
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    });
  });

  // Add padding to range
  const range = maxVal - minVal || 1;
  minVal -= range * 0.1;
  maxVal += range * 0.1;

  const isDark =
    document.documentElement.dataset.theme === 'dark' ||
    (document.documentElement.dataset.theme === 'auto' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? '#B0B3B8' : '#666';
  const zeroLineColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';

  // Draw grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + (chartH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();

    // Y-axis labels
    const val = maxVal - ((maxVal - minVal) / gridLines) * i;
    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(val), pad.left - 8, y + 4);
  }

  // Zero line if range includes 0
  if (minVal < 0 && maxVal > 0) {
    const zeroY = pad.top + chartH * (1 - (0 - minVal) / (maxVal - minVal));
    ctx.strokeStyle = zeroLineColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, zeroY);
    ctx.lineTo(pad.left + chartW, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // X-axis labels
  ctx.fillStyle = textColor;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < totalPoints; i++) {
    const x = pad.left + (chartW / (totalPoints - 1)) * i;
    if (i === 0 || i === totalPoints - 1 || totalPoints <= 10 || i % Math.ceil(totalPoints / 8) === 0) {
      ctx.fillText(i === 0 ? '0' : `R${i}`, x, h - pad.bottom + 20);
    }
  }

  // Draw lines for each player
  players.forEach((p) => {
    const points = data[p.id];
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    points.forEach((val, i) => {
      const x = pad.left + (chartW / (totalPoints - 1)) * i;
      const y = pad.top + chartH * (1 - (val - minVal) / (maxVal - minVal));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Draw endpoint dot
    const lastX = pad.left + chartW;
    const lastY =
      pad.top + chartH * (1 - (points[points.length - 1] - minVal) / (maxVal - minVal));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Legend
  const legendY = h - 8;
  let legendX = pad.left;
  ctx.font = '11px sans-serif';
  players.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.fillRect(legendX, legendY - 8, 12, 12);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    const name = p.name.length > 8 ? p.name.substring(0, 8) + '…' : p.name;
    ctx.fillText(name, legendX + 16, legendY + 2);
    legendX += ctx.measureText(name).width + 30;
  });
}

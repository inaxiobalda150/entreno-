// ===== COACH IÑAKI · anillos, camino a Monegros y confeti de récords =====
'use strict';
function retoSemana(lm) {
  let gP = 0, gH = 0, sP = 0, sH = 0;
  for (let i = 0; i < 7; i++) {
    const d = addD(lm, i); const x = diaPlan(d);
    if (x.tipo === 'gym' || x.tipo === 'cardio') { gP++; if (hechoGym(d)) gH++; }
    if (salidaDe(d)) { sP++; if (DB.salidas[key(d)]) sH++; }
  }
  const tot = gP + sP, hech = Math.min(gH, gP) + Math.min(sH, sP);
  return { gP, gH, sP, sH, frac: tot ? hech / tot : 0, ok: tot > 0 && hech >= tot };
}
function confeti() {
  const c = document.createElement('canvas'); c.className = 'confeti';
  const W = c.width = innerWidth, H = c.height = innerHeight; document.body.append(c);
  const x = c.getContext('2d'); const col = ['#f97316', '#38bdf8', '#22c55e', '#eab308', '#ec4899', '#a78bfa'];
  const ps = Array.from({ length: 140 }, () => ({ x: W / 2 + (Math.random() - .5) * 80, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4, c: col[Math.floor(Math.random() * col.length)], a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
  const t0 = performance.now();
  const f = t => {
    const e = t - t0; x.clearRect(0, 0, W, H);
    ps.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - e / 2600); x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (e < 2600) requestAnimationFrame(f); else c.remove();
  };
  requestAnimationFrame(f);
}

// ---------- piezas visuales ----------
function anillo(frac, col, txt, lab) {
  const r = 32, L = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return `<div class="ring"><svg viewBox="0 0 78 78"><circle cx="39" cy="39" r="${r}" fill="none" stroke="#1f2b39" stroke-width="9"/>
  <circle class="rarc" cx="39" cy="39" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${(L * (1 - f)).toFixed(1)}" style="--L:${L.toFixed(1)}" transform="rotate(-90 39 39)"/>
  <text x="39" y="44" text-anchor="middle">${txt}</text></svg><span>${lab}</span></div>`;
}
// Camino a Monegros: avanzas con cada entreno y cada salida hechos
const SEG = [[[10, 92], [60, 92], [60, 40], [110, 50]], [[110, 50], [160, 60], [170, 95], [210, 60]], [[210, 60], [250, 25], [260, 20], [290, 22]]];
function enCamino(t) {
  t = Math.max(0, Math.min(1, t)); const s = Math.min(2, Math.floor(t * 3)); const u = t * 3 - s; const [a, b, c, d] = SEG[s]; const k = 1 - u;
  return [0, 1].map(i => k * k * k * a[i] + 3 * k * k * u * b[i] + 3 * k * u * u * c[i] + u * u * u * d[i]);
}
function trazo(t0, t1) { const n = 48, p = []; for (let i = 0; i <= n; i++) { const q = enCamino(t0 + (t1 - t0) * i / n); p.push(q[0].toFixed(1) + ',' + q[1].toFixed(1)); } return p.join(' '); }
function camino() {
  const P = DB.perfil; if (!P.finde || !P.monegros || !DB.plan) return null;
  const ini = monday(parse(DB.plan.creado)), meta = parse(P.monegros); if (meta <= ini) return null;
  let total = 0, hecho = 0;
  for (let d = new Date(ini); d <= meta; d = addD(d, 1)) {
    const x = diaPlan(d); if (x.tipo === 'gym' || x.tipo === 'cardio') { total++; if (hechoGym(d)) hecho++; }
    if (salidaDe(d)) { total++; if (DB.salidas[key(d)]) hecho++; }
  }
  const pT = Math.min(1, (today() - ini) / (meta - ini)), pH = total ? hecho / total : 0;
  const paradas = FASES.slice(0, 4).map(f => ({ n: f.n, c: f.c, t: (addD(monday(meta), -(25 - f.de) * 7) - ini) / (meta - ini) })).filter(s => s.t >= 0);
  const sig = paradas.find(s => s.t > pH);
  const [tx, ty] = enCamino(pH), [hx, hy] = enCamino(pT);
  const dias = Math.round((meta - today()) / DAY);
  return `<div class="card camino"><div class="chead"><b>Camino a Monegros</b><span>${dias >= 0 ? `${dias} días` : '¡Hecho!'}</span></div>
  <svg viewBox="0 0 300 112" class="chart">
   <polyline points="${trazo(0, 1)}" fill="none" stroke="#2a3747" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
   ${pH > 0 ? `<polyline class="ctrazo" points="${trazo(0, pH)}" fill="none" stroke="#f97316" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
   ${paradas.map(s => { const [x, y] = enCamino(s.t); const pas = s.t <= pH; return `<circle cx="${x}" cy="${y}" r="5" fill="${pas ? s.c : '#2a3747'}"/><text x="${Math.max(2, x)}" y="${y + 18}" text-anchor="${x < 30 ? 'start' : 'middle'}" class="cl">${s.n}</text>`; }).join('')}
   <circle cx="290" cy="22" r="7" fill="#eab308"/><text x="282" y="12" text-anchor="end" class="cl" fill="#eab308">Meta</text>
   ${pT > pH + 0.02 ? `<circle cx="${hx}" cy="${hy}" r="4" fill="#eef2f6" opacity=".8"/>` : ''}
   <circle cx="${tx}" cy="${ty}" r="9" fill="#f97316" stroke="#0f1720" stroke-width="3"/><text x="${tx}" y="${ty - 14}" text-anchor="middle" class="cv">Tú</text>
  </svg>
  <p class="mut">${hecho} de ${total} sesiones hechas. ${pT > pH + 0.02 ? 'El punto blanco es donde tocaría ir hoy: cada entreno y cada salida te acercan.' : sig ? `Próxima parada: ${sig.n}.` : '¡Ya ves la meta!'}</p></div>`;
}

// ===== COACH IÑAKI · puntos, niveles, medallas, camino a Monegros y celebraciones =====
'use strict';
const NIVELES = ['Novato', 'Aprendiz', 'Constante', 'Currante', 'Rodador', 'Escalador', 'Fondista', 'Duro de pelar', 'Máquina', 'Titán', 'Monegrino', 'Leyenda'];
const umbral = n => 50 * (n - 1) * n; // puntos para llegar al nivel n
const PUNTOS = { gym: 50, cardio: 30, record: 20, chequeo: 20, reto: 100 };

const MEDALLAS = [
  ['m1', '🏋️', 'Primer entreno', 'Termina tu primer entreno', S => S.gym >= 1],
  ['m10', '💪', '10 entrenos', 'Completa 10 entrenos de fuerza', S => S.gym >= 10],
  ['m25', '🔥', '25 entrenos', 'Completa 25 entrenos de fuerza', S => S.gym >= 25],
  ['m50', '⚙️', '50 entrenos', 'Completa 50 entrenos de fuerza', S => S.gym >= 50],
  ['rec1', '🏆', 'Primer récord', 'Bate tu primera marca', S => S.recs >= 1],
  ['rec10', '🥇', '10 récords', 'Bate 10 marcas', S => S.recs >= 10],
  ['reto1', '✅', 'Semana 100%', 'Cumple el reto de una semana', S => S.retos >= 1],
  ['reto4', '📅', '4 semanas 100%', 'Cumple 4 retos semanales', S => S.retos >= 4],
  ['racha4', '🔗', '4 semanas seguidas', 'Entrena 4 semanas sin fallar ninguna', S => S.racha >= 4],
  ['racha12', '⛓️', '12 semanas seguidas', 'Entrena 12 semanas sin fallar ninguna', S => S.racha >= 12],
  ['t10', '🏗️', '10 toneladas', 'Mueve 10.000 kg en total', S => S.vol >= 10000],
  ['t50', '🚛', '50 toneladas', 'Mueve 50.000 kg en total', S => S.vol >= 50000],
  ['h10', '🚵', '10 h fuera', '10 horas de bici y monte', S => S.horas >= 10],
  ['h50', '🗻', '50 h fuera', '50 horas de bici y monte', S => S.horas >= 50],
  ['larga', '⏱️', 'Salida de 4 h', 'Haz una salida de 4 horas o más', S => S.larga >= 240],
  ['chq4', '📋', '4 chequeos', 'Haz 4 chequeos semanales', S => S.chequeos >= 4],
  ['kg2', '⚖️', '−2 kg', 'Baja 2 kg desde el inicio', S => S.bajado >= 2],
  ['obj', '🎯', 'Peso objetivo', 'Llega a tu peso objetivo', S => S.objetivo],
  ['constr', '🧱', 'Construcción', 'Llega a la fase de construcción', S => S.semana >= 14],
  ['mone', '🏁', 'Monegros', 'Termina la Orbea Monegros', S => S.monegros],
];

function semanasPlan() { // lunes desde que creaste el plan hasta hoy
  if (!DB.plan) return [];
  const out = []; let d = monday(parse(DB.plan.creado)); const lm = monday(today());
  while (d <= lm) { out.push(d); d = addD(d, 7); } return out;
}
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
function stats() {
  const gym = DB.logs.filter(l => !l.cardio), cardio = DB.logs.filter(l => l.cardio);
  const sal = Object.entries(DB.salidas);
  const recs = DB.logs.reduce((a, l) => a + (l.res || []).filter(r => r.record).length, 0);
  const retos = semanasPlan().filter(lm => retoSemana(lm).ok).length;
  const lm = monday(today()); let racha = 0;
  for (let i = 1; i < 80; i++) { const wk = key(addD(lm, -7 * i)); if (DB.logs.some(l => wkey(parse(l.fecha)) === wk)) racha++; else break; }
  if (DB.logs.some(l => wkey(parse(l.fecha)) === key(lm))) racha++;
  const ps = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1);
  const P = DB.perfil || {};
  const S = {
    gym: gym.length, cardio: cardio.length, recs, retos, racha,
    vol: gym.reduce((a, l) => a + l.vol, 0),
    minFuera: sal.reduce((a, [, s]) => a + (s.min || 0), 0),
    larga: Math.max(0, ...sal.map(([, s]) => s.min || 0)),
    chequeos: Object.keys(DB.recup).length,
    bajado: ps.length ? ps[0].kg - ps[ps.length - 1].kg : 0,
    objetivo: P.objetivo === 'bajar' && ps.length > 1 && ps[ps.length - 1].kg <= P.pesoObj,
    semana: P.finde ? semanaBici(today()) : 0,
    monegros: sal.some(([, s]) => s.tipo === 'race'),
  };
  S.horas = S.minFuera / 60;
  S.pts = S.gym * PUNTOS.gym + S.cardio * PUNTOS.cardio + Math.round(S.minFuera / 2) + S.recs * PUNTOS.record + S.chequeos * PUNTOS.chequeo + S.retos * PUNTOS.reto;
  let n = 1; while (n < NIVELES.length && S.pts >= umbral(n + 1)) n++;
  S.nivel = n; S.nombre = NIVELES[n - 1];
  S.desde = umbral(n); S.hasta = n < NIVELES.length ? umbral(n + 1) : null;
  return S;
}

// Comprueba si hay medallas o nivel nuevo y lo celebra
function logros(silencio) {
  if (!DB.perfil) return;
  const S = stats(); const nuevas = [];
  const primera = !DB.medallas; DB.medallas = DB.medallas || {};
  MEDALLAS.forEach(([id, , , , f]) => { if (!DB.medallas[id] && f(S)) { DB.medallas[id] = key(today()); nuevas.push(id); } });
  const subeNivel = (DB.nivelVisto || 1) < S.nivel && !primera;
  DB.nivelVisto = Math.max(DB.nivelVisto || 1, S.nivel);
  save();
  if (primera || silencio) return;
  if (nuevas.length || subeNivel) celebrar(nuevas, subeNivel ? S : null);
}

function celebrar(nuevas, nivel) {
  confeti();
  const fondo = el(`<div class="celeb"><div class="cbox">
    ${nivel ? `<div class="cniv">${nivel.nivel}</div><h2>¡Subes de nivel!</h2><p class="cbig">${nivel.nombre}</p>` : ''}
    ${nuevas.length ? `<h2>${nuevas.length > 1 ? '¡Medallas nuevas!' : '¡Medalla nueva!'}</h2>${nuevas.map(id => { const m = MEDALLAS.find(x => x[0] === id); return `<div class="cmed"><span>${m[1]}</span><div><b>${m[2]}</b><p class="mut">${m[3]}</p></div></div>`; }).join('')}` : ''}
    <button class="btn big wide">¡Vamos!</button></div></div>`);
  fondo.querySelector('button').onclick = () => fondo.remove();
  document.body.append(fondo);
  try { navigator.vibrate && navigator.vibrate([80, 60, 80, 60, 200]); } catch (e) { }
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
function cabeceraNivel(S) {
  const frac = S.hasta ? (S.pts - S.desde) / (S.hasta - S.desde) : 1;
  return `<div class="lvl"><div class="lnum">${S.nivel}</div><div class="linfo"><b>Nivel ${S.nivel} · ${S.nombre}</b>
  <div class="lbar"><span style="width:${(frac * 100).toFixed(0)}%"></span></div>
  <small>${S.hasta ? `${S.pts} / ${S.hasta} puntos al nivel ${S.nivel + 1}` : `${S.pts} puntos · nivel máximo`}</small></div>
  <div class="lrac"><b>🔥</b><small>${S.racha} sem.</small></div></div>`;
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
function tarjetaReto() {
  const R = retoSemana(monday(today())); if (!R.gP && !R.sP) return '';
  return `<div class="card reto ${R.ok ? 'ok' : ''}"><div class="chead"><b>${R.ok ? '✅ Reto cumplido' : '🎯 Reto de la semana'}</b><span>+${PUNTOS.reto} pts</span></div>
  <p>${R.gP} entreno${R.gP !== 1 ? 's' : ''}${R.sP ? ` + ${R.sP} salida${R.sP !== 1 ? 's' : ''}` : ''}: llevas ${R.gH + R.sH} de ${R.gP + R.sP}</p>
  <div class="lbar"><span style="width:${(R.frac * 100).toFixed(0)}%"></span></div></div>`;
}
function filaMedallas() {
  const ganadas = MEDALLAS.filter(m => DB.medallas && DB.medallas[m[0]]).sort((a, b) => DB.medallas[b[0]] < DB.medallas[a[0]] ? -1 : 1);
  const prox = MEDALLAS.filter(m => !(DB.medallas && DB.medallas[m[0]]));
  const ver = [...ganadas.slice(0, 2), ...prox.slice(0, 4 - Math.min(2, ganadas.length))].slice(0, 4);
  const c = el(`<button class="card medrow"><div class="chead"><b>Medallas</b><span>${ganadas.length} / ${MEDALLAS.length} ›</span></div>
   <div class="meds">${ver.map(m => { const g = DB.medallas && DB.medallas[m[0]]; return `<div class="med ${g ? 'on' : ''}"><span>${m[1]}</span><small>${m[2]}</small></div>`; }).join('')}</div></button>`);
  c.onclick = verMedallas; return c;
}
function verMedallas() {
  const S = stats();
  const o = overlay('Medallas', `${MEDALLAS.filter(m => DB.medallas && DB.medallas[m[0]]).length} de ${MEDALLAS.length} conseguidas`);
  o.body.innerHTML = cabeceraNivel(S) + `<div class="medgrid">${MEDALLAS.map(m => { const g = DB.medallas && DB.medallas[m[0]]; return `<div class="med big ${g ? 'on' : ''}"><span>${m[1]}</span><b>${m[2]}</b><small>${g ? `Conseguida el ${fmt(parse(g))}` : m[3]}</small></div>`; }).join('')}</div>
  <div class="card sug"><b>Cómo se ganan puntos</b><ul><li>Entreno de fuerza: ${PUNTOS.gym}</li><li>Bici estática o intervalos: ${PUNTOS.cardio}</li><li>Salidas: 1 punto cada 2 minutos</li><li>Cada récord: ${PUNTOS.record}</li><li>Chequeo del lunes: ${PUNTOS.chequeo}</li><li>Reto semanal cumplido: ${PUNTOS.reto}</li></ul></div>`;
}

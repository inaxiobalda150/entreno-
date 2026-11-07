// ===== LÓGICA DE LA APP =====
const $ = (s, el = document) => el.querySelector(s);
const DAY = 86400000;
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_C = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const TIPO = { btt: ['🚵', 'BTT'], trail: ['🏃', 'Trail'], walk: ['🥾', 'Caminata'], race: ['🏁', 'Carrera'], rest: ['😴', 'Descanso'] };

// ---------- almacenamiento ----------
const KEY = 'entreno_inaki_v1';
let DB = { logs: {}, done: {}, weights: [], supl: {}, swaps: {}, drafts: {}, perfil: { ...PERFIL_DEF } };
try { const raw = localStorage.getItem(KEY); if (raw) DB = Object.assign(DB, JSON.parse(raw)); } catch (e) { }
DB.perfil = Object.assign({ ...PERFIL_DEF }, DB.perfil);
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } }

// ---------- fechas ----------
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const fmt = d => `${DIAS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
const fmtC = d => `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
function weekOf(d) { return Math.floor((d - START) / DAY / 7) + 1; }
function dayIdx(d) { return (d.getDay() + 6) % 7; }
function dateOf(w, di) { return addD(START, (w - 1) * 7 + di); }
const horas = h => { const H = Math.floor(h), M = Math.round((h - H) * 60); return !H ? `${M} min` : M ? `${H} h ${M} min` : `${H} h`; };

// ---------- plan ----------
const MAXW = 52;
function fase(w) { return FASES.find(f => w >= f.de && w <= f.a) || FASES[FASES.length - 1]; }
function descarga(w) { return w % 4 === 0 && w !== 24 && w <= MAXW; }

function gymFor(w, di) {
  // Semanas 1-13: 3 sesiones (L/X/V). Desde la 14: 2 sesiones (L/X) para llegar fresco a las tiradas del finde.
  if (![0, 2, 4].includes(di) || w < 1 || w > MAXW) return null;
  if (w >= 14 && w !== 25 && di === 4) return w <= 24 ? { tpl: 'INT', light: false } : null; // viernes: bici con intervalos
  let tpl;
  if (w === 25) tpl = ['A', 'ACT', null][di / 2];
  else if (w <= 13) tpl = ['A', 'B', 'C'][di / 2];
  else if (w <= 27) tpl = ['A', 'C'][di / 2];
  else tpl = ['A', 'CT'][di / 2];
  if (!tpl) return { rest: true, t: 'Descanso: mañana es Monegros.' };
  const light = descarga(w) || w >= 24 && w <= 27;
  return { tpl, light, prueba: w === 1 };
}

function postFinde(w) {
  const k = w - 25, d = descarga(w) ? 0.65 : 1;
  const r = x => Math.round(x * 4) / 4;
  if (k <= 2) return [['btt', 1.5, 'Recuperación: paseo suave en bici.'], ['walk', 1, 'Caminata tranquila.']];
  if (w <= 35) { const h = r((1.25 + (w - 28) * 0.17) * d); return [['trail', h, (d < 1 ? 'SEMANA DE DESCANSO. ' : '') + 'Tirada de trail con desnivel. Subidas andando, bajadas con cuidado.'], ['btt', r(2.5 * d), 'BTT a ritmo cómodo.']]; }
  if (w <= 44) { const h = r((2.5 + (w - 36) * 0.25) * d); return [['trail', h, (d < 1 ? 'SEMANA DE DESCANSO. ' : '') + 'Larga de trail con desnivel. Practica comida y material de la carrera.'], ['trail', r(1.25 * d), 'Trote suave con las piernas cansadas (doblete).']]; }
  const h = r(Math.min(5, 4 + (w - 45) * 0.25) * d);
  return [['trail', h, (d < 1 ? 'SEMANA DE DESCANSO. ' : '') + 'Ensayo largo de ultra. Cuando elijas carrera, ajustamos.'], ['trail', r(1.5 * d), 'Trote suave.']];
}
function findeFor(w) {
  let f = w <= 25 ? FINDE[w] : postFinde(w);
  if (!f) return null;
  f = f.map(x => ({ tipo: x[0], h: x[1], t: x[2] }));
  if (DB.swaps[w]) f = [f[1], f[0]];
  return f;
}

function dayPlan(d) {
  const w = weekOf(d), di = dayIdx(d), items = [];
  if (w < 1 || w > MAXW) return { w, di, items };
  const g = gymFor(w, di);
  if (g && !g.rest) items.push({ k: 'gym', ...g });
  if (g && g.rest) items.push({ k: 'rest', t: g.t });
  if (di >= 5) { const f = findeFor(w); if (f) items.push({ k: 'out', ...f[di - 5] }); }
  if (di === 6 && w !== 25) items.push({ k: 'stretch' });
  if (!items.length) items.push({ k: 'rest', t: 'Descanso. Si te apetece, paseo de 30 min.' });
  return { w, di, items };
}

// ---------- utilidades UI ----------
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function img(id, n) { return `img/${id}_${n}.jpg`; }
let actx;
function beep(times = 3) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime + i * 0.35; g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.3);
    }
  } catch (e) { }
  if (times > 0) try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { }
}
let wakeLock = null;
async function keepAwake(on) {
  try { if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); else if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) { }
}
function toast(msg) { const t = el(`<div class="toast">${msg}</div>`); document.body.append(t); setTimeout(() => t.remove(), 2600); }
function confirmBox(msg, ok) {
  const o = el(`<div class="modal"><div class="box"><p>${msg}</p><div class="row"><button class="btn ghost">Cancelar</button><button class="btn">Sí</button></div></div></div>`);
  o.querySelectorAll('button')[0].onclick = () => o.remove();
  o.querySelectorAll('button')[1].onclick = () => { o.remove(); ok(); };
  document.body.append(o);
}

// ---------- navegación ----------
let VIEW = 'hoy', planWeek = null;
function go(v) { VIEW = v; render(); window.scrollTo(0, 0); }
function render() {
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === VIEW));
  const m = $('#main'); m.innerHTML = '';
  ({ hoy: vHoy, plan: vPlan, prog: vProg, nutri: vNutri, mas: vMas })[VIEW](m);
}

// ---------- tarjetas de plan ----------
function itemCard(it, d) {
  const key = ymd(d), done = DB.done[key] || {};
  if (it.k === 'gym') {
    const T = GYM[it.tpl], ok = done.gym;
    const c = el(`<button class="card item gym ${ok ? 'ok' : ''}"><div class="ic">🏋️</div><div class="tx"><b>${T.n}${it.light ? ' · suave' : ''}</b><span>Gimnasio 6:00 · ${T.items.length ? T.items.length + ' ejercicios + ' : ''}${T.cardio.min} min cardio</span>${it.prueba ? '<em>Semana de prueba: busca tu peso</em>' : ''}</div><div class="st">${ok ? '✅' : '›'}</div></button>`);
    c.onclick = () => openGym(d, it); return c;
  }
  if (it.k === 'out') {
    const [ico, nom] = TIPO[it.tipo], ok = done.out;
    const c = el(`<button class="card item out ${ok ? 'ok' : ''}"><div class="ic">${ico}</div><div class="tx"><b>${nom} · ${horas(it.h)}</b><span>${esc(it.t)}</span></div><div class="st">${ok ? '✅' : '›'}</div></button>`);
    c.onclick = () => openOut(d, it); return c;
  }
  if (it.k === 'stretch') {
    const ok = done.str;
    const c = el(`<button class="card item str ${ok ? 'ok' : ''}"><div class="ic">🧘</div><div class="tx"><b>Estiramientos y movilidad</b><span>Por la tarde · unos 25 min guiados</span></div><div class="st">${ok ? '✅' : '›'}</div></button>`);
    c.onclick = () => openStretch(STRETCH_DOM, 'Estiramientos del domingo', () => { mark(d, 'str'); }); return c;
  }
  return el(`<div class="card item rest"><div class="ic">😴</div><div class="tx"><b>Descanso</b><span>${esc(it.t)}</span></div></div>`);
}
function mark(d, k, v = true) { const key = ymd(d); DB.done[key] = DB.done[key] || {}; DB.done[key][k] = v; save(); }

// ---------- VISTA HOY ----------
function vHoy(m) {
  const t = today(), w = weekOf(t), P = DB.perfil;
  const mon = parse(P.monegros), dias = Math.round((mon - t) / DAY);
  m.append(el(`<header class="hero"><div class="date">${fmt(t)}</div>${w >= 1 ? `<div class="ph" style="--c:${fase(w).c}">Semana ${w} · ${fase(w).n}${descarga(w) ? ' · descanso' : ''}</div>` : '<div class="ph" style="--c:#22c55e">Pretemporada</div>'}
    ${dias >= 0 ? `<div class="count"><b>${dias}</b> días para Monegros</div>` : ''}</header>`));
  if (w < 1) {
    m.append(el(`<div class="card note"><b>Empiezas el lunes 2 de noviembre 💪</b><p>La primera semana es de prueba: buscas el peso de cada ejercicio con calma. Aquí tienes lo que toca el primer día.</p></div>`));
    m.append(el(`<h3>Lunes 2 de noviembre</h3>`));
    dayPlan(START).items.forEach(it => m.append(itemCard(it, START)));
  } else {
    m.append(el(`<h3>Hoy</h3>`));
    dayPlan(t).items.forEach(it => m.append(itemCard(it, t)));
    // próximo día con algo
    for (let i = 1; i < 7; i++) { const d = addD(t, i), p = dayPlan(d); const real = p.items.filter(x => x.k !== 'rest'); if (real.length) { m.append(el(`<h3>Próximo · ${fmt(d)}</h3>`)); real.forEach(it => m.append(itemCard(it, d))); break; } }
  }
  m.append(suplCard(t));
  alerts().forEach(a => m.append(el(`<div class="card warn">⚠️ ${a}</div>`)));
}

function suplCard(d) {
  const k = ymd(d), s = DB.supl[k] || {};
  const c = el(`<div class="card supl"><h4>Suplementos de hoy</h4><label><input type="checkbox" ${s.c ? 'checked' : ''} data-k="c"> ☀️ Creatina (mañana)</label><label><input type="checkbox" ${s.m ? 'checked' : ''} data-k="m"> 🌙 Magnesio (noche)</label></div>`);
  c.querySelectorAll('input').forEach(i => i.onchange = () => { DB.supl[k] = DB.supl[k] || {}; DB.supl[k][i.dataset.k] = i.checked; save(); });
  return c;
}

// ---------- VISTA PLAN ----------
function vPlan(m) {
  const tw = Math.max(1, Math.min(MAXW, weekOf(today())));
  if (planWeek == null) planWeek = tw;
  const w = planWeek, f = fase(w);
  // línea de fases
  const bar = el(`<div class="phases"></div>`);
  FASES.forEach(F => { const s = el(`<button style="flex:${F.a - F.de + 1};background:${F.c}" title="${F.n}"></button>`); s.onclick = () => { planWeek = F.de; render(); }; bar.append(s); });
  const mk = el(`<div class="mk" style="left:calc(${(w - 0.5) / MAXW * 100}% - 6px)"></div>`); bar.append(mk);
  m.append(el(`<h2>Plan</h2>`)); m.append(bar);
  m.append(el(`<div class="phlegend">${FASES.map(F => `<span><i style="background:${F.c}"></i>${F.n}</span>`).join('')}</div>`));
  const nav = el(`<div class="weeknav"><button class="btn ghost sm">‹</button><div><b>Semana ${w}</b><span>${fmtC(dateOf(w, 0))} – ${fmtC(dateOf(w, 6))}</span></div><button class="btn ghost sm">›</button></div>`);
  nav.querySelectorAll('button')[0].onclick = () => { planWeek = Math.max(1, w - 1); render(); };
  nav.querySelectorAll('button')[1].onclick = () => { planWeek = Math.min(MAXW, w + 1); render(); };
  m.append(nav);
  m.append(el(`<div class="card note" style="border-color:${f.c}"><b style="color:${f.c}">${f.n}${descarga(w) ? ' · semana de descanso' : ''}</b><p>${f.t}</p></div>`));
  for (let di = 0; di < 7; di++) {
    const d = dateOf(w, di), p = dayPlan(d);
    m.append(el(`<h4 class="dayh ${ymd(d) === ymd(today()) ? 'tod' : ''}">${DIAS[di]} ${d.getDate()}</h4>`));
    p.items.forEach(it => m.append(itemCard(it, d)));
  }
  const sw = el(`<button class="btn ghost wide">🌧️ Cambiar sábado ↔ domingo ${DB.swaps[w] ? '(cambiado)' : ''}</button>`);
  sw.onclick = () => { DB.swaps[w] = !DB.swaps[w]; save(); render(); toast(DB.swaps[w] ? 'Sábado y domingo cambiados' : 'Vuelto al orden normal'); };
  m.append(sw);
  if (w !== tw) { const b = el(`<button class="btn ghost wide">Ir a esta semana</button>`); b.onclick = () => { planWeek = tw; render(); }; m.append(b); }
}

// ---------- SESIÓN DE GIMNASIO ----------
function lastLog(id, before) {
  const L = (DB.logs[id] || []).filter(x => x.d < before);
  return L.length ? L[L.length - 1] : null;
}
function suggest(id, it, before) {
  const E = EX[id], last = lastLog(id, before);
  if (it.seg) {
    if (!last) return { v: it.seg[0], msg: `Empieza con ${it.seg[0]} s.` };
    const best = Math.max(...last.sets.map(s => +s.reps || 0));
    return best >= it.seg[1] ? { v: it.seg[1], msg: `Ya llegas a ${it.seg[1]} s: mantén y hazlo perfecto.` } : { v: Math.min(it.seg[1], best + 5), msg: `La última vez: ${best} s. Hoy +5 s.` };
  }
  if (!last) return { kg: '', msg: E.maq ? 'Primera vez: elige un peso con el que hagas las repes y te sobren 2-3.' : 'Primera vez: elige una mancuerna con la que hagas las repes y te sobren 2-3.' };
  const kg = +last.sets[0].kg || 0, allTop = last.sets.every(s => +s.reps >= it.r[1]), anyLow = last.sets.some(s => +s.reps < it.r[0]);
  const inc = E.maq ? 2.5 : 1;
  if (it.fijo) return { kg, msg: `Igual que la última vez (${kg} kg). Es prevención.` };
  if (allTop && last.rir !== '0-1') return { kg: +(kg + inc).toFixed(1), msg: `¡Toca subir! La última vez hiciste todas las repes. Prueba ${kg + inc} kg${E.maq ? '' : ' por mancuerna'}.` };
  if (anyLow && last.rir === '0-1') return { kg, msg: `Mismo peso (${kg} kg). La última vez costó: intenta llegar a ${it.r[0]} en todas.` };
  return { kg, msg: `Mismo peso (${kg} kg) e intenta 1 repe más por serie.` };
}

function openGym(d, it) {
  const key = ymd(d), T = GYM[it.tpl];
  const draft = DB.drafts[key] || { ex: {}, cardio: false, str: false };
  DB.drafts[key] = draft;
  keepAwake(true);
  const o = el(`<div class="over"><div class="ohead"><button class="back">‹</button><div><b>${T.n}</b><span>${fmt(d)}</span></div></div><div class="obody"></div></div>`);
  const body = $('.obody', o);
  const close = () => { keepAwake(false); o.remove(); render(); };
  $('.back', o).onclick = close;
  const draw = () => {
    body.innerHTML = '';
    if (it.prueba) body.append(el(`<div class="card note"><b>Semana de prueba</b><p>Busca el peso con el que hagas las repeticiones y te sobren 2-3 (podrías hacer 2-3 más). Mejor quedarse corto que pasarse.</p></div>`));
    if (it.light) body.append(el(`<div class="card note"><b>Sesión suave</b><p>Mismo peso, menos series. Hoy toca recuperar.</p></div>`));
    body.append(el(`<div class="card warm"><b>🔥 Calentamiento (10 min)</b><p>${CALENTAMIENTO}</p></div>`));
    T.items.forEach((x, i) => {
      const E = EX[x.id], st = draft.ex[x.id] || {}, n = it.light ? Math.min(2, x.s) : x.s;
      const done = (st.sets || []).filter(s => s && s.ok).length;
      const presc = x.seg ? `${n} × ${x.seg[0]}-${x.seg[1]} s` : `${n} × ${x.r[0] === x.r[1] ? x.r[0] : x.r[0] + '-' + x.r[1]}${E.uni ? ' por lado' : ''}`;
      const c = el(`<button class="card exrow ${done >= n ? 'ok' : ''}"><img src="${img(x.id, 0)}" alt=""><div class="tx"><b>${i + 1}. ${E.n}</b><span>${presc} · descanso ${x.d} s</span><span class="prog">${done}/${n} series</span></div><div class="st">${done >= n ? '✅' : '›'}</div></button>`);
      c.onclick = () => openEx(x, it, d, draft, n, draw);
      body.append(c);
    });
    const C = T.cardio, CE = EX[C.id];
    let ct = C.t || '';
    if (C.interval) { const w = weekOf(d); ct = w <= 17 ? '8 min suave + 4×(2 min fuerte / 2 min suave) + 5 min suave' : w <= 21 ? '6 min suave + 4×(3 min fuerte / 2 min suave) + 3 min suave' : '8 min suave + 3×(3 min fuerte / 2 min suave) + 5 min suave'; ct += '. "Fuerte" = te cuesta hablar, pero aguantas el ritmo.'; }
    const cc = el(`<button class="card exrow ${draft.cardio ? 'ok' : ''}"><img src="${img(C.id, 0)}" alt=""><div class="tx"><b>Cardio · ${CE.n} ${C.min} min</b><span>${ct}</span></div><div class="st">${draft.cardio ? '✅' : '›'}</div></button>`);
    cc.onclick = () => openCardio(C, ct, () => { draft.cardio = true; save(); draw(); });
    body.append(cc);
    const sc = el(`<button class="card exrow ${draft.str ? 'ok' : ''}"><div class="ic">🧘</div><div class="tx"><b>Estiramientos (unos 8 min)</b><span>Guiados con temporizador</span></div><div class="st">${draft.str ? '✅' : '›'}</div></button>`);
    sc.onclick = () => openStretch(STRETCH_POST, 'Estiramientos', () => { draft.str = true; save(); draw(); });
    body.append(sc);
    const fin = el(`<button class="btn wide big">✔ Terminar sesión</button>`);
    fin.onclick = () => {
      T.items.forEach(x => {
        const st = draft.ex[x.id]; if (!st || !st.sets) return;
        const sets = st.sets.filter(s => s && s.ok).map(s => ({ kg: s.kg, reps: s.reps }));
        if (!sets.length) return;
        DB.logs[x.id] = (DB.logs[x.id] || []).filter(l => l.d !== key);
        DB.logs[x.id].push({ d: key, sets, rir: st.rir || '' });
        DB.logs[x.id].sort((a, b) => a.d < b.d ? -1 : 1);
      });
      mark(d, 'gym', it.tpl); save();
      const b = DESAYUNOS[pickDesayuno(d)];
      close();
      const mm = el(`<div class="modal"><div class="box"><h3>¡Sesión hecha! 💪</h3><p><b>Desayuno:</b> ${b.n}</p><p class="mut">${b.t}</p><p>☀️ Tómate la creatina con el desayuno.</p><button class="btn wide">Vale</button></div></div>`);
      mm.querySelector('button').onclick = () => mm.remove();
      document.body.append(mm);
    };
    body.append(fin);
  };
  draw();
  document.body.append(o);
}

function exInfo(E, id) {
  const c = el(`<div><div class="pics"><img src="${img(id, 0)}" alt="Posición inicial"><img src="${img(id, 1)}" alt="Posición final"></div><div class="piclab"><span>Inicio</span><span>Final</span></div>
  <h4>Paso a paso</h4><ol>${E.pasos.map(p => `<li>${p}</li>`).join('')}</ol>
  ${E.err ? `<h4>Errores típicos</h4><ul class="err">${E.err.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
  ${E.gem ? `<div class="card gem">🦵 <b>Gemelo:</b> ${E.gem}</div>` : ''}</div>`);
  c.querySelectorAll('.pics img').forEach(im => im.onclick = () => openZoom(id));
  return c;
}
function openZoom(id) {
  let n = 0; const z = el(`<div class="zoom"><img src="${img(id, 0)}"><p>Toca para ver inicio / final · fuera para cerrar</p></div>`);
  const im = z.querySelector('img'); im.onclick = e => { e.stopPropagation(); n = 1 - n; im.src = img(id, n); };
  z.onclick = () => z.remove(); document.body.append(z);
}

function openEx(x, it, d, draft, n, redraw) {
  const E = EX[x.id], key = ymd(d);
  const st = draft.ex[x.id] = draft.ex[x.id] || { sets: [] };
  const sg = suggest(x.id, x, key);
  const o = el(`<div class="over"><div class="ohead"><button class="back">‹</button><div><b>${E.n}</b><span>${x.seg ? `${n} × ${x.seg[0]}-${x.seg[1]} s` : `${n} series × ${x.r[0]}-${x.r[1]} repes${E.uni ? ' por lado' : ''}`} · descanso ${x.d} s</span></div></div><div class="obody"></div></div>`);
  const body = $('.obody', o);
  $('.back', o).onclick = () => { o.remove(); redraw(); };
  body.append(exInfo(E, x.id));
  body.append(el(`<div class="card sug">💡 ${sg.msg}</div>`));
  const last = lastLog(x.id, key);
  if (last) body.append(el(`<p class="mut">Última vez (${fmtC(parse(last.d))}): ${last.sets.map(s => x.seg ? s.reps + ' s' : `${s.kg} kg × ${s.reps}`).join(' · ')}</p>`));
  const tbl = el(`<div class="sets"></div>`);
  for (let i = 0; i < n; i++) {
    const s = st.sets[i] || { kg: x.seg ? '' : sg.kg, reps: x.seg ? sg.v : x.r[1], ok: false };
    st.sets[i] = s;
    const row = el(`<div class="set ${s.ok ? 'ok' : ''}"><span class="sn">${i + 1}</span>
      ${x.seg ? '' : `<label><input type="number" inputmode="decimal" step="0.5" value="${s.kg}" placeholder="kg"><small>${E.maq ? 'kg' : 'kg/mano'}</small></label>`}
      <label><input type="number" inputmode="numeric" value="${s.reps}"><small>${x.seg ? 'seg' : 'repes'}</small></label>
      <button class="chk">${s.ok ? '✓' : 'Hecha'}</button></div>`);
    const ins = row.querySelectorAll('input');
    const read = () => { if (x.seg) s.reps = ins[0].value; else { s.kg = ins[0].value; s.reps = ins[1].value; } save(); };
    ins.forEach(inp => inp.onchange = read);
    row.querySelector('.chk').onclick = () => {
      read(); s.ok = !s.ok; save();
      row.classList.toggle('ok', s.ok); row.querySelector('.chk').textContent = s.ok ? '✓' : 'Hecha';
      if (s.ok) {
        // copia el peso a la siguiente serie
        const nx = tbl.children[i + 1]; if (nx && !x.seg) { const ni = nx.querySelectorAll('input'); if (!st.sets[i + 1].ok) { ni[0].value = s.kg; st.sets[i + 1].kg = s.kg; } }
        if (x.seg && actx === undefined) beep(0);
        if (x.seg) openTimer(+s.reps || 30, 'Aguanta', () => openTimer(x.d, 'Descanso'));
        else if (i < n - 1) openTimer(x.d, 'Descanso');
        else rirAsk();
      }
    };
    tbl.append(row);
  }
  body.append(tbl);
  const rirBox = el(`<div class="card rir"><b>Al acabar: ¿cuántas repes te sobraban?</b><div class="row">${['0-1', '2-3', '4+'].map(v => `<button class="btn ghost sm ${st.rir === v ? 'sel' : ''}" data-v="${v}">${v}</button>`).join('')}</div><small>Sirve para saber si toca subir peso la próxima vez.</small></div>`);
  rirBox.querySelectorAll('button').forEach(b => b.onclick = () => { st.rir = b.dataset.v; save(); rirBox.querySelectorAll('button').forEach(z => z.classList.toggle('sel', z === b)); });
  const rirAsk = () => { rirBox.scrollIntoView({ behavior: 'smooth' }); rirBox.classList.add('pulse'); };
  if (!x.seg) body.append(rirBox);
  document.body.append(o);
}

// ---------- temporizadores ----------
function openTimer(sec, label, after) {
  let left = sec, iv;
  const o = el(`<div class="timer"><div class="tl">${label}</div><div class="tn"></div><div class="row"><button class="btn ghost">+15 s</button><button class="btn">Saltar</button></div></div>`);
  const tn = o.querySelector('.tn');
  const tick = () => { tn.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; };
  const end = (b) => { clearInterval(iv); o.remove(); if (b) beep(); after && after(); };
  o.querySelectorAll('button')[0].onclick = () => { left += 15; tick(); };
  o.querySelectorAll('button')[1].onclick = () => end(false);
  tick(); iv = setInterval(() => { left--; if (left <= 0) end(true); else { tick(); if (left <= 3) beep(1); } }, 1000);
  document.body.append(o);
}

function openCardio(C, txt, done) {
  const E = EX[C.id];
  const o = el(`<div class="over"><div class="ohead"><button class="back">‹</button><div><b>${E.n} · ${C.min} min</b><span>Cardio</span></div></div><div class="obody"></div></div>`);
  $('.back', o).onclick = () => o.remove();
  const body = $('.obody', o);
  body.append(el(`<div class="card sug">${txt}</div>`));
  body.append(exInfo(E, C.id));
  const b = el(`<button class="btn wide big">▶ Empezar ${C.min} min</button>`);
  b.onclick = () => openTimer(C.min * 60, E.n, () => { done(); o.remove(); });
  const b2 = el(`<button class="btn ghost wide">Marcar como hecho</button>`);
  b2.onclick = () => { done(); o.remove(); };
  body.append(b, b2);
  document.body.append(o);
}

function openStretch(list, title, done) {
  // pasos: cada estiramiento, y si tiene lados, izquierda y derecha
  const steps = [];
  list.forEach(id => { const S = ST[id]; if (S.lados) { steps.push({ id, lado: 'Lado izquierdo' }); steps.push({ id, lado: 'Lado derecho' }); } else steps.push({ id }); });
  const total = steps.reduce((a, s) => a + ST[s.id].s, 0);
  let i = 0, left = 0, iv = null, run = false, pic = 0, picIv;
  keepAwake(true);
  const o = el(`<div class="over"><div class="ohead"><button class="back">‹</button><div><b>${title}</b><span>${steps.length} pasos · unos ${Math.round(total / 60 + steps.length * 0.15)} min</span></div></div><div class="obody stretch"></div></div>`);
  const body = $('.obody', o);
  const stop = () => { clearInterval(iv); clearInterval(picIv); keepAwake(false); };
  $('.back', o).onclick = () => { stop(); o.remove(); };
  const show = () => {
    const s = steps[i], S = ST[s.id]; left = S.s;
    body.innerHTML = `<div class="sprog"><i style="width:${i / steps.length * 100}%"></i></div><p class="mut">${i + 1} de ${steps.length}</p>
      <img class="simg" src="${img(s.id, 0)}"><h3>${S.n}</h3>${s.lado ? `<div class="lado">${s.lado}${s.lado.includes('izq') && /Calf|Soleus|Gastro/.test(s.id) ? ' · suave, es el gemelo a cuidar' : ''}</div>` : ''}
      <p>${S.t}</p><div class="tn big">${left}</div>
      <div class="row"><button class="btn ghost">‹ Anterior</button><button class="btn">${run ? 'Pausa' : '▶ Empezar'}</button><button class="btn ghost">Siguiente ›</button></div>`;
    const bs = body.querySelectorAll('.row button');
    bs[0].onclick = () => { if (i > 0) { i--; show(); } };
    bs[1].onclick = () => { run = !run; bs[1].textContent = run ? 'Pausa' : '▶ Seguir'; beep(0); };
    bs[2].onclick = () => next();
    clearInterval(picIv); pic = 0; picIv = setInterval(() => { pic = 1 - pic; const im = body.querySelector('.simg'); if (im) im.src = img(s.id, pic); }, 2500);
  };
  const next = () => { if (i < steps.length - 1) { i++; show(); } else finish(); };
  const finish = () => { stop(); done && done(); o.remove(); toast('Estiramientos hechos 🧘'); render(); };
  iv = setInterval(() => { if (!run) return; left--; const tn = body.querySelector('.tn'); if (tn) tn.textContent = left; if (left <= 0) { beep(2); next(); } }, 1000);
  show();
  document.body.append(o);
}

// ---------- SALIDAS (fin de semana) ----------
function fuel(h, tipo) {
  if (tipo === 'walk' || h < 1.5) return { cena: 'Normal.', des: 'Desayuno normal.', llevar: ['1 bidón de agua'], durante: 'No hace falta comer. Bebe a tu ritmo.', despues: 'Comida normal.' };
  const tomas = Math.floor(h), litros = h * 0.6;
  const comida = ['barrita', 'plátano', 'gel', 'bocadillo pequeño de jamón', 'barrita', 'gel', 'dátiles o membrillo'].slice(0, tomas);
  const env = tipo === 'trail' ? `${Math.ceil(litros / 0.5)} flasks de 500 ml (rellena en fuentes si hace falta)` : `${Math.max(1, Math.ceil(litros / 0.75))} bidones de 750 ml`;
  return {
    cena: h >= 3 ? 'Normal, con algo más de hidrato: arroz, pasta o patata.' : 'Normal.',
    des: '2 h antes: corn flakes con leche + plátano, o tostadas con pavo + plátano.',
    llevar: [env + (h >= 2 ? ', uno con sales' : ''), `${tomas} tomas de comida: ${comida.join(', ')}`, tipo === 'btt' || tipo === 'race' ? 'Herramienta, cámara/tubeless y bomba' : 'Chaleco, cortavientos y móvil cargado'],
    durante: 'Alarmas del Garmin: <b>beber cada 15 min</b> y <b>comer cada hora</b> (una toma de la lista en cada alarma). Empieza desde el principio, no esperes a tener hambre.',
    despues: 'En la primera hora: comida con proteína (pollo, huevos, atún…) + hidrato. Hoy no se recorta comida.'
  };
}
function fuelHTML(F, tipo) {
  return `<div class="fuel"><h4>🍽️ Comida y bebida</h4>
  <div class="fl"><b>Cena de la víspera</b><span>${F.cena}</span></div>
  <div class="fl"><b>Desayuno</b><span>${F.des}</span></div>
  <div class="fl"><b>Qué llevar</b><span>${F.llevar.map(x => '• ' + x).join('<br>')}</span></div>
  <div class="fl"><b>Durante</b><span>${F.durante}</span></div>
  <div class="fl"><b>Al volver</b><span>${F.despues}</span></div>
  ${tipo === 'btt' || tipo === 'race' ? '<p class="mut">Ensaya aquí lo que vas a comer en Monegros: el día de la prueba, nada nuevo.</p>' : ''}</div>`;
}
function openOut(d, it) {
  const key = ymd(d), [ico, nom] = TIPO[it.tipo], dn = (DB.done[key] || {}).out || {};
  const F = fuel(it.h, it.tipo);
  const o = el(`<div class="over"><div class="ohead"><button class="back">‹</button><div><b>${ico} ${nom} · ${horas(it.h)}</b><span>${fmt(d)}</span></div></div><div class="obody">
    <div class="card sug">${esc(it.t)}</div>
    ${it.tipo === 'trail' ? '<div class="card gem">🦵 <b>Gemelo:</b> calienta 10 min andando. Si notas pinchazo o tirón, para y vuelve andando. Las subidas fuertes, andando.</div>' : ''}
    ${fuelHTML(F, it.tipo)}
    <h4>Registrar salida</h4>
    <div class="form"><label>Km<input type="number" inputmode="decimal" name="km" value="${dn.km || ''}"></label><label>Desnivel (m)<input type="number" inputmode="numeric" name="des" value="${dn.des || ''}"></label><label>Tiempo (h)<input type="number" inputmode="decimal" step="0.25" name="h" value="${dn.h || it.h}"></label></div>
    <div class="chips" data-n="sen"><b>Sensaciones</b>${['Bien', 'Normal', 'Mal'].map(v => `<button class="btn ghost sm ${dn.sen === v ? 'sel' : ''}">${v}</button>`).join('')}</div>
    <div class="chips" data-n="gem"><b>Gemelo</b>${['Perfecto', 'Algo cargado', 'Molestia'].map(v => `<button class="btn ghost sm ${dn.gem === v ? 'sel' : ''}">${v}</button>`).join('')}</div>
    <textarea name="notas" placeholder="Notas: qué comiste, qué tal fue…">${esc(dn.notas || '')}</textarea>
    <button class="btn wide big save">✔ Guardar salida</button></div></div>`);
  $('.back', o).onclick = () => o.remove();
  const val = { sen: dn.sen, gem: dn.gem };
  o.querySelectorAll('.chips').forEach(ch => ch.querySelectorAll('button').forEach(b => b.onclick = () => { val[ch.dataset.n] = b.textContent; ch.querySelectorAll('button').forEach(z => z.classList.toggle('sel', z === b)); }));
  $('.save', o).onclick = () => {
    const g = n => o.querySelector(`[name=${n}]`).value;
    mark(d, 'out', { km: g('km'), des: g('des'), h: g('h'), notas: g('notas'), ...val, tipo: it.tipo });
    o.remove(); render(); toast('Salida guardada');
    if (val.gem === 'Molestia') setTimeout(() => toast('Gemelo con molestia: esta semana trail andando y vigílalo'), 2700);
  };
  document.body.append(o);
}

// ---------- NUTRICIÓN ----------
function pickDesayuno(d) {
  const w = weekOf(d), di = dayIdx(d), g = gymFor(w, di);
  const sat = findeFor(w);
  const duro = g && g.tpl === 'B2' || di === 4 && sat && sat[0].h >= 3;
  if (duro) return 4;
  return ((w * 3 + di / 2) | 0) % 4;
}
function vNutri(m) {
  const t = today(), P = DB.perfil;
  m.append(el(`<h2>Nutrición</h2>`));
  m.append(suplCard(t));
  const g = gymFor(weekOf(t), dayIdx(t));
  const dref = g && !g.rest ? t : (() => { for (let i = 1; i < 8; i++) { const d = addD(t, i); const gg = gymFor(weekOf(d), dayIdx(d)); if (gg && !gg.rest) return d; } return START; })();
  const b = DESAYUNOS[pickDesayuno(dref)];
  m.append(el(`<div class="card"><h4>🍳 Desayuno después del gimnasio ${dref === t ? '(hoy)' : '· ' + fmt(dref)}</h4><p><b>${b.n}</b></p><p class="mut">${b.t}</p><details><summary>Ver todas las opciones</summary><ol>${DESAYUNOS.map(x => `<li><b>${x.n}</b><br><span class="mut">${x.t}</span></li>`).join('')}</ol></details></div>`));
  // próxima salida
  for (let i = 0; i < 8; i++) {
    const d = addD(t, i), w = weekOf(d), di = dayIdx(d);
    if (di >= 5 && w >= 1) { const f = findeFor(w); if (!f) break; const it = f[di - 5]; const [ico, nom] = TIPO[it.tipo]; const c = el(`<div class="card"><h4>${ico} Próxima salida · ${fmt(d)}</h4><p><b>${nom} · ${horas(it.h)}</b></p>${fuelHTML(fuel(it.h, it.tipo), it.tipo)}</div>`); m.append(c); break; }
  }
  const sem = Math.ceil((P.pesoIni - P.pesoObj) / P.ritmo);
  m.append(el(`<div class="card"><h4>⚖️ Bajar peso sin perder fuerza</h4><p>Objetivo: de <b>${P.pesoIni}</b> a <b>${P.pesoObj} kg</b> a unos <b>${P.ritmo} kg/semana</b> (unas ${sem} semanas). Después, <b>mantener</b> hasta Monegros.</p>
  <ul><li><b>Proteína en cada comida</b>: pollo, pavo, huevos, atún, legumbre, yogur griego, queso.</li>
  <li><b>Recorta entre semana</b>, no en las tiradas: el día de salida larga se come lo necesario antes, durante y después.</li>
  <li>Verdura en comida y cena (tomate, lechuga, pimiento, calabacín, champiñón).</li>
  <li>Menos picoteo, bollería y bebidas con azúcar. Pan y arroz, sí, pero en su ración.</li>
  <li>Pésate <b>1 vez por semana</b>, mismo día, en ayunas.</li></ul>
  <p class="mut">Alarma automática: si bajas más de 0,8 kg en una semana o tus pesos del gimnasio bajan 2 semanas seguidas, la app te avisa para comer algo más.</p></div>`));
  m.append(el(`<div class="card"><h4>💊 Suplementos</h4><p>☀️ <b>Creatina</b> por la mañana (con el desayuno).<br>🌙 <b>Magnesio</b> por la noche.</p><p class="mut">Si tomas alguna medicación, coméntalo con tu médico.</p></div>`));
}

// ---------- PROGRESO ----------
function chart(points, opts = {}) {
  // points: [{x:Date, y}] ; opts.target: [{x,y}]
  const W = 340, H = 170, pad = 30;
  const all = points.concat(opts.target || []);
  if (!all.length) return '<p class="mut">Aún no hay datos.</p>';
  const xs = all.map(p => +p.x), ys = all.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= DAY * 7; x1 += DAY * 7; }
  let y0 = Math.min(...ys), y1 = Math.max(...ys); if (y0 === y1) { y0 -= 1; y1 += 1; } const yp = (y1 - y0) * 0.1; y0 -= yp; y1 += yp;
  const X = x => pad + (x - x0) / (x1 - x0) * (W - pad - 10), Y = y => H - 20 - (y - y0) / (y1 - y0) * (H - 35);
  const line = (ps, cls) => ps.length ? `<polyline class="${cls}" points="${ps.map(p => `${X(+p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}"/>` : '';
  const dots = points.map(p => `<circle cx="${X(+p.x)}" cy="${Y(p.y)}" r="3.5"/>`).join('');
  const ticks = [y0 + yp, (y0 + y1) / 2, y1 - yp].map(v => `<text x="2" y="${Y(v) + 4}">${v.toFixed(1)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${ticks}${line(opts.target || [], 'tgt')}${line(points, 'ln')}${dots}</svg>`;
}
function targetLine() {
  const P = DB.perfil, pts = []; const sem = (P.pesoIni - P.pesoObj) / P.ritmo;
  pts.push({ x: START, y: P.pesoIni }); pts.push({ x: addD(START, Math.round(sem * 7)), y: P.pesoObj }); pts.push({ x: parse(P.monegros), y: P.pesoObj });
  return pts;
}
function weeklyVolume() {
  const v = {};
  Object.entries(DB.logs).forEach(([id, L]) => L.forEach(l => { const w = weekOf(parse(l.d)); l.sets.forEach(s => { v[w] = (v[w] || 0) + (+s.kg || 0) * (+s.reps || 0); }); }));
  return v;
}
function alerts() {
  const A = [], W = DB.weights;
  if (W.length >= 2) {
    const a = W[W.length - 1], b = W[W.length - 2]; const dd = (parse(a.d) - parse(b.d)) / DAY;
    if (dd > 0 && dd <= 10 && (b.kg - a.kg) / dd * 7 > 0.8) A.push(`Has bajado ${(b.kg - a.kg).toFixed(1)} kg en ${Math.round(dd)} días: demasiado rápido. Come algo más (sobre todo hidrato en el desayuno y en la comida).`);
  }
  const v = weeklyVolume(), w = weekOf(today()) - 1;
  if (v[w] && v[w - 1] && v[w - 2] && !descarga(w) && !descarga(w - 1) && v[w] < v[w - 1] && v[w - 1] < v[w - 2]) A.push('Tus pesos del gimnasio llevan 2 semanas bajando. Revisa que comes suficiente y que duermes bien.');
  return A;
}
function vProg(m) {
  const P = DB.perfil;
  m.append(el(`<h2>Progreso</h2>`));
  // peso corporal
  const W = DB.weights; const last = W[W.length - 1];
  const c = el(`<div class="card"><h4>⚖️ Peso corporal</h4>
    <div class="big2">${last ? last.kg + ' kg' : P.pesoIni + ' kg'} <small>objetivo ${P.pesoObj} kg</small></div>
    ${last ? `<p class="mut">${(P.pesoIni - last.kg) >= 0 ? 'Llevas ' + (P.pesoIni - last.kg).toFixed(1) + ' kg menos' : 'Llevas ' + (last.kg - P.pesoIni).toFixed(1) + ' kg más'} · te faltan ${Math.max(0, last.kg - P.pesoObj).toFixed(1)} kg</p>` : ''}
    ${chart(W.map(x => ({ x: parse(x.d), y: +x.kg })), { target: targetLine() })}
    <p class="mut legend"><i class="l1"></i> tu peso <i class="l2"></i> objetivo (0,5 kg/sem y después mantener)</p>
    <div class="form"><label>Fecha<input type="date" name="d" value="${ymd(today())}"></label><label>Peso (kg)<input type="number" inputmode="decimal" step="0.1" name="kg" placeholder="78.5"></label><button class="btn">Guardar</button></div></div>`);
  c.querySelector('.form button').onclick = () => {
    const d = c.querySelector('[name=d]').value, kg = parseFloat(String(c.querySelector('[name=kg]').value).replace(',', '.'));
    if (!d || !kg) return toast('Pon fecha y peso');
    DB.weights = DB.weights.filter(x => x.d !== d); DB.weights.push({ d, kg }); DB.weights.sort((a, b) => a.d < b.d ? -1 : 1); save(); render(); toast('Peso guardado');
  };
  m.append(c);
  if (W.length) { const lst = el(`<details class="card"><summary>Historial de peso</summary>${W.slice().reverse().map(x => `<div class="hrow"><span>${fmtC(parse(x.d))}</span><b>${x.kg} kg</b><button class="x" data-d="${x.d}">✕</button></div>`).join('')}</details>`); lst.querySelectorAll('.x').forEach(b => b.onclick = () => confirmBox('¿Borrar este peso?', () => { DB.weights = DB.weights.filter(x => x.d !== b.dataset.d); save(); render(); })); m.append(lst); }
  alerts().forEach(a => m.append(el(`<div class="card warn">⚠️ ${a}</div>`)));
  // calendario
  m.append(calMonth());
  // fuerza por ejercicio
  const ids = Object.keys(DB.logs).filter(id => DB.logs[id].length && EX[id]);
  const f = el(`<div class="card"><h4>💪 Fuerza por ejercicio</h4>${ids.length ? `<select>${ids.map(id => `<option value="${id}">${EX[id].n}</option>`).join('')}</select><div class="fch"></div>` : '<p class="mut">Cuando registres sesiones verás aquí cómo suben tus pesos.</p>'}</div>`);
  if (ids.length) {
    const sel = f.querySelector('select'), box = f.querySelector('.fch');
    const draw = () => { const L = DB.logs[sel.value]; const seg = L.some(l => l.sets.every(s => !s.kg)); box.innerHTML = chart(L.map(l => ({ x: parse(l.d), y: Math.max(...l.sets.map(s => +(seg ? s.reps : s.kg) || 0)) }))) + `<p class="mut">${seg ? 'Segundos' : 'Kg'} máximos por sesión · ${L.length} sesiones</p>`; };
    sel.onchange = draw; draw();
  }
  m.append(f);
  // resumen salidas
  const outs = Object.entries(DB.done).filter(([, v]) => v.out && v.out.km);
  if (outs.length) {
    const km = outs.reduce((a, [, v]) => a + (+v.out.km || 0), 0), des = outs.reduce((a, [, v]) => a + (+v.out.des || 0), 0);
    m.append(el(`<div class="card"><h4>🚵 Salidas registradas</h4><div class="big2">${outs.length} <small>salidas</small> · ${km.toFixed(0)} <small>km</small> · ${des} <small>m+</small></div></div>`));
  }
}
let calRef = null;
function calMonth() {
  const t = today(); calRef = calRef || new Date(Math.max(+START, +t));
  const y = calRef.getFullYear(), mo = calRef.getMonth(), first = new Date(y, mo, 1), off = dayIdx(first), n = new Date(y, mo + 1, 0).getDate();
  let cells = ''; for (let i = 0; i < off; i++) cells += '<div></div>';
  for (let d = 1; d <= n; d++) {
    const dt = new Date(y, mo, d), k = ymd(dt), dn = DB.done[k] || {}, p = dayPlan(dt);
    const plan = p.items.some(x => x.k !== 'rest');
    const marks = (dn.gym ? '<i class="g"></i>' : '') + (dn.out ? '<i class="o"></i>' : '') + (dn.str ? '<i class="s"></i>' : '');
    cells += `<div class="cd ${k === ymd(t) ? 'tod' : ''} ${plan && !marks && dt < t ? 'miss' : ''} ${plan ? 'pl' : ''}"><span>${d}</span><div>${marks}</div></div>`;
  }
  const c = el(`<div class="card"><div class="calh"><button class="btn ghost sm">‹</button><h4>${MESES[mo]} ${y}</h4><button class="btn ghost sm">›</button></div><div class="cal">${DIAS_C.map(x => `<b>${x}</b>`).join('')}${cells}</div><p class="mut legend"><i class="g"></i> gimnasio <i class="o"></i> salida <i class="s"></i> estiramientos</p></div>`);
  const bs = c.querySelectorAll('.calh button');
  bs[0].onclick = () => { calRef = new Date(y, mo - 1, 1); render(); };
  bs[1].onclick = () => { calRef = new Date(y, mo + 1, 1); render(); };
  return c;
}

// ---------- MÁS / AJUSTES ----------
function vMas(m) {
  const P = DB.perfil;
  m.append(el(`<h2>Ajustes</h2>`));
  const f = el(`<div class="card"><h4>Mis datos</h4><div class="form col">
    <label>Edad<input type="number" name="edad" value="${P.edad}"></label>
    <label>Peso inicial (kg)<input type="number" step="0.1" name="pesoIni" value="${P.pesoIni}"></label>
    <label>Peso objetivo (kg)<input type="number" step="0.1" name="pesoObj" value="${P.pesoObj}"></label>
    <label>Ritmo de bajada (kg/semana)<input type="number" step="0.1" name="ritmo" value="${P.ritmo}"></label>
    <label>Fecha Orbea Monegros<input type="date" name="monegros" value="${P.monegros}"></label>
    <label>Fecha ultratrail (cuando la tengas)<input type="date" name="ultra" value="${P.ultra}"></label>
    <button class="btn">Guardar</button></div><p class="mut">La fecha de Monegros 2027 es estimada (último sábado de abril). Cámbiala cuando la publiquen.</p></div>`);
  f.querySelector('button').onclick = () => { f.querySelectorAll('input').forEach(i => { DB.perfil[i.name] = i.type === 'number' ? parseFloat(i.value) : i.value; }); save(); toast('Guardado'); };
  m.append(f);
  // ejercicios (biblioteca)
  const lib = el(`<details class="card"><summary>📚 Todos los ejercicios con fotos</summary><div class="lib"></div></details>`);
  const lb = lib.querySelector('.lib');
  Object.entries(EX).forEach(([id, E]) => { const b = el(`<button class="card exrow"><img src="${img(id, 0)}" alt=""><div class="tx"><b>${E.n}</b><span>${E.g}</span></div><div class="st">›</div></button>`); b.onclick = () => { const o = el(`<div class="over"><div class="ohead"><button class="back">‹</button><div><b>${E.n}</b><span>${E.g}</span></div></div><div class="obody"></div></div>`); $('.back', o).onclick = () => o.remove(); $('.obody', o).append(exInfo(E, id)); document.body.append(o); }; lb.append(b); });
  m.append(lib);
  // copia de seguridad
  const bk = el(`<div class="card"><h4>💾 Copia de seguridad</h4><p class="mut">Tus datos están solo en este móvil. Haz una copia de vez en cuando y guárdala (por ejemplo en Google Drive o mándatela por WhatsApp).</p>
    <div class="row"><button class="btn">Descargar copia</button><button class="btn ghost">Copiar texto</button></div>
    <h4>Recuperar copia</h4><input type="file" accept=".json,application/json"><textarea placeholder="…o pega aquí el texto de la copia"></textarea><button class="btn ghost wide">Recuperar desde el texto</button></div>`);
  const [bDl, bCp] = bk.querySelectorAll('.row button');
  const dump = () => JSON.stringify(DB);
  bDl.onclick = () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([dump()], { type: 'application/json' })); a.download = `entreno-copia-${ymd(today())}.json`; document.body.append(a); a.click(); a.remove(); toast('Copia descargada'); } catch (e) { toast('No se pudo descargar: usa "Copiar texto"'); } };
  bCp.onclick = async () => { try { await navigator.clipboard.writeText(dump()); toast('Copiado. Pégalo en una nota o WhatsApp'); } catch (e) { bk.querySelector('textarea').value = dump(); toast('Selecciona el texto de abajo y cópialo'); } };
  const restore = txt => { try { const d = JSON.parse(txt); if (!d.logs) throw 0; confirmBox('¿Recuperar esta copia? Se sustituyen los datos actuales.', () => { DB = Object.assign(DB, d); save(); toast('Copia recuperada'); render(); }); } catch (e) { toast('Ese texto no es una copia válida'); } };
  bk.querySelector('input[type=file]').onchange = e => { const f = e.target.files[0]; if (f) f.text().then(restore); };
  bk.querySelector('.wide').onclick = () => restore(bk.querySelector('textarea').value);
  m.append(bk);
  m.append(el(`<div class="card"><h4>📲 Instalar en el móvil</h4><p>En Chrome: menú ⋮ → <b>Añadir a pantalla de inicio</b> / <b>Instalar app</b>.</p><p class="mut">Fotos de ejercicios: Free Exercise DB (dominio público). Esta app no sustituye el consejo médico.</p></div>`));
}

// ---------- arranque ----------
document.querySelectorAll('nav button').forEach(b => b.onclick = () => go(b.dataset.v));
render();
if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { } }

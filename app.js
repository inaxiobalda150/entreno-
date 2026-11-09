// ===== COACH IÑAKI · lógica de la app =====
'use strict';
const KEY = 'coach_inaki_v1';
const DAY = 864e5;
const DN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DC = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

let DB = { v: 1, perfil: null, plan: null, swaps: {}, prog: {}, logs: [], volAdj: {}, recup: {}, pesos: [], nut: { ajuste: 0 }, salidas: {}, activo: null };
try { const raw = localStorage.getItem(KEY); if (raw) DB = Object.assign(DB, JSON.parse(raw)); } catch (e) { }
try { localStorage.removeItem('entreno_inaki_v1'); } catch (e) { } // datos de la app vieja fuera
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast('No se ha podido guardar'); } }

// ---------- utilidades ----------
const $ = s => document.querySelector(s);
function el(h) { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; }
function toast(t) { const x = el(`<div class="toast">${t}</div>`); document.body.append(x); setTimeout(() => x.remove(), 2600); }
const pad = n => String(n).padStart(2, '0');
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayIdx = d => (d.getDay() + 6) % 7;
const monday = d => addD(d, -dayIdx(d));
const wkey = d => key(monday(d));
const fmt = d => `${d.getDate()} ${MES[d.getMonth()]}`;
const r10 = x => Math.round(x / 10) * 10;
const num = (x, dec = 1) => (Math.round(x * 10 ** dec) / 10 ** dec).toLocaleString('es-ES');
const img = id => `img/${id}_0.jpg`;
function roundInc(kg, inc) { return inc ? Math.max(inc, Math.round(kg / inc) * inc) : 0; }

// ---------- calendario de bici / Monegros ----------
function semanaBici(d) {
  const P = DB.perfil; if (!P || !P.monegros) return null;
  const wr = monday(parse(P.monegros));
  const hasta = Math.round((wr - monday(d)) / DAY / 7);
  return FINDE.length - 1 - hasta; // 25 = semana de la prueba
}
function fase(d) { const w = semanaBici(d); if (w == null) return null; return FASES.find(f => w >= f.de && w <= f.a) || null; }
function descarga(d) {
  const P = DB.perfil;
  if (P && P.finde) { const w = semanaBici(d); const f = FINDE[w]; return !!(f && /DESCANSO/.test(f[0][2])); }
  if (!DB.plan) return false;
  const n = Math.round((monday(d) - monday(parse(DB.plan.creado))) / DAY / 7) + 1;
  return n > 0 && n % 5 === 0;
}
function salidaDe(d) {
  const P = DB.perfil; if (!P || !P.finde) return null;
  const di = dayIdx(d); if (di < 5) return null;
  const w = semanaBici(d);
  if (w >= 1 && w < FINDE.length) { const s = FINDE[w][di - 5]; return { tipo: s[0], h: s[1], t: s[2], w }; }
  if (w < 1) return di === 5 ? { tipo: 'btt', h: 1.5, t: 'Antes del plan: rodaje suave por terreno cómodo.', w } : { tipo: 'walk', h: 0.75, t: 'Caminata por monte a ritmo cómodo.', w };
  return di === 5 ? { tipo: 'trail', h: 1, t: 'Después de Monegros: trail suave. El plan del ultra lo montamos cuando lo elijas.', w } : null;
}
const TIPO = { btt: ['🚵', 'BTT'], trail: ['🏃', 'Trail'], walk: ['🥾', 'Caminata'], race: ['🏁', 'Prueba'] };

// ---------- GENERADOR DEL PLAN ----------
function generarPlan(P) {
  const n = P.dias.length;
  const keys = n <= 2 ? ['A', 'B'] : n === 3 ? ['A', 'B', 'C'] : ['L1', 'U1', 'L2', 'U2'];
  const nEj = P.min <= 45 ? 5 : P.min <= 60 ? 6 : 7;
  const uso = {};
  const sesiones = keys.map(k => {
    let slots = PLANTILLAS[k].slots.slice();
    if (!P.gemelo) slots = slots.filter(s => s !== 'gemelo');
    if (P.prioridad === 'pierna' && !k.startsWith('L') && !k.startsWith('U')) {
      const extra = k === 'B' ? 'femoral' : k === 'A' ? 'cadera' : 'unilateral';
      slots.splice(3, 0, extra);
    }
    if (P.prioridad === 'superior' && !k.startsWith('L')) slots.splice(3, 0, k === 'B' ? 'empuje_h' : 'tiron_h');
    // recortar por tiempo, guardando core y gemelo
    let fuera = slots.filter(s => s !== 'core' && s !== 'gemelo');
    const fijos = slots.filter(s => s === 'core' || s === 'gemelo');
    fuera = fuera.slice(0, Math.max(3, nEj - fijos.length));
    slots = slots.filter((s, i) => fuera.includes(s) && slots.indexOf(s) === i || fijos.includes(s));
    const items = slots.map(p => {
      const c = candidatos(p, P); const u = uso[p] || 0; uso[p] = u + 1;
      return { p, id: c.length ? c[u % c.length] : null };
    }).filter(x => x.id);
    return { k, n: PLANTILLAS[k].n, items };
  });
  return { creado: key(today()), sesiones };
}
function candidatos(p, P) {
  P = P || DB.perfil;
  const ord = P.nivel === 'cero' ? { maq: 0, polea: 1, manc: 2, peso: 3, barra: 4 } : { manc: 0, maq: 1, polea: 2, barra: 3, peso: 4 };
  return Object.keys(LIB).filter(id => {
    const e = LIB[id]; if (e.p !== p) return false;
    if (P.lumbar && !e.lum) return false;
    if (P.lugar === 'casa' && !['peso', 'manc'].includes(e.eq)) return false;
    return true;
  }).sort((a, b) => ord[LIB[a].eq] - ord[LIB[b].eq]);
}
function ejDe(ses, i) { return DB.swaps[ses.k + ':' + i] || ses.items[i].id; }

// series y repeticiones de cada hueco, con ajustes de recuperación y descarga
function receta(id, d) {
  const e = LIB[id]; const P = DB.perfil;
  const comp = COMPUESTOS.includes(e.p);
  let s = comp ? 3 : 2;
  if (P.prioridad === 'pierna' && ['Pierna', 'Glúteo'].includes(e.m) && e.p !== 'gemelo') s += comp ? 0 : 1;
  if (P.prioridad === 'pierna' && comp && ['Pierna', 'Glúteo'].includes(e.m)) s += 1;
  if (e.p === 'core') s = 3;
  s += DB.volAdj[e.m] || 0;
  if (descarga(d)) s -= 1;
  s = Math.max(1, Math.min(5, s));
  if (e.fijo) s = 2;
  let r = comp ? (P.nivel === 'cero' ? [10, 12] : [8, 12]) : [12, 15];
  if (e.seg) r = [20, 40];
  if (id === 'Dead_Bug') r = [8, 10];
  if (e.fijo) r = [15, 15];
  const desc = comp ? 90 : e.p === 'core' ? 45 : 60;
  return { s, r, desc };
}

// qué toca cada día
function diaPlan(d) {
  const P = DB.perfil; if (!P || !DB.plan) return { tipo: 'nada' };
  const di = dayIdx(d);
  const pos = P.dias.indexOf(di);
  const sal = salidaDe(d);
  if (pos >= 0) {
    const ses = DB.plan.sesiones;
    if (pos >= ses.length) return { tipo: 'cardio', n: 'Bici estática en zona 2', t: '40 min suaves: puedes hablar sin ahogarte.' };
    // fase de construcción: el último día de gimnasio de la semana pasa a ser bici con intervalos
    const w = P.finde ? semanaBici(d) : null;
    if (w >= 14 && w <= 24 && P.dias.length >= 3 && pos === P.dias.length - 1) return { tipo: 'cardio', n: 'Bici con intervalos', t: INTERVALOS, int: true };
    if (w === 25 && di >= 3) return { tipo: 'cardio', n: 'Activación pre-Monegros', t: '25 min muy suave con 3 cambios de 1 min alegre. Nada más.' };
    const k = ses[pos % ses.length];
    return { tipo: 'gym', ses: k, sal };
  }
  if (sal) return { tipo: 'salida', sal };
  return { tipo: 'descanso' };
}
const hechoGym = d => DB.logs.find(l => l.fecha === key(d));

// ---------- PROGRESIÓN AUTOMÁTICA DE PESOS ----------
function sugerencia(id, r) {
  const e = LIB[id]; const st = DB.prog[id];
  if (e.seg) return { kg: 0, reps: st ? st.reps : r[0], nuevo: !st };
  if (!st) return { kg: DB.perfil.lugar === 'casa' && e.eq === 'manc' ? Math.min(e.ini, 8) : e.ini, reps: r[0], nuevo: true };
  return { kg: st.kg, reps: Math.min(Math.max(st.reps, r[0]), e.inc ? r[1] : r[1] + 8), nuevo: false };
}
function progresar(it) {
  const e = LIB[it.id]; const hechas = it.sets.filter(s => s.ok); if (!hechas.length) return null;
  const r = it.r; const st = DB.prog[it.id] || { kg: 0, reps: r[0], fails: 0, best: 0 };
  const kg = Math.max(...hechas.map(s => +s.kg || 0)); const reps = hechas.map(s => +s.reps || 0);
  const minR = Math.min(...reps); let msg = null; const antes = st.kg;
  st.kg = kg;
  if (e.fijo) { st.reps = r[0]; }
  else if (e.seg) { if (minR >= st.reps) { st.reps = Math.min(r[1] + 20, minR + 5); msg = `+5 s la próxima vez`; } }
  else if (!e.inc) { if (minR >= st.reps) { st.reps = Math.min(r[1] + 8, minR + 1); msg = `${st.reps} repeticiones la próxima vez`; } }
  else if (minR >= r[1] && it.feel !== 'duro') {
    st.kg = kg + e.inc * (it.feel === 'facil' ? 2 : 1); st.reps = r[0]; st.fails = 0;
    msg = `Sube a ${num(st.kg)} kg`;
  } else if (minR < r[0]) {
    st.fails = (st.fails || 0) + 1;
    if (st.fails >= 2) { st.kg = roundInc(kg * 0.9, e.inc); st.reps = r[0]; st.fails = 0; msg = `Baja a ${num(st.kg)} kg y vuelve a construir`; }
    else msg = 'Mismo peso, a por las repeticiones';
  } else { st.fails = 0; st.reps = Math.min(r[1], minR + 1); msg = `Mismo peso, busca ${st.reps} repeticiones`; }
  const e1 = Math.max(...hechas.map(s => (+s.kg || 0) * (1 + (+s.reps || 0) / 30)));
  const record = e.inc && st.best && e1 > st.best + 0.01;
  if (e1 > (st.best || 0)) st.best = e1;
  DB.prog[it.id] = st;
  return { msg, record, antes };
}

// ---------- NUTRICIÓN ----------
function pesoActual() { const p = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1); return p.length ? p[p.length - 1].kg : DB.perfil.peso; }
function nutri() {
  const P = DB.perfil; const kg = pesoActual();
  const bmr = 10 * kg + 6.25 * P.altura - 5 * P.edad + (P.sexo === 'm' ? -161 : 5);
  const tdee = bmr * 1.4;
  let def = 0;
  if (P.objetivo === 'bajar' && kg > P.pesoObj) def = Math.min(P.ritmo, 0.75) * 1100;
  if (P.objetivo === 'musculo') def = -250;
  const kcal = Math.max(r10(bmr * 1.05), r10(tdee - def + (DB.nut.ajuste || 0)));
  const p = Math.round(1.8 * kg), g = Math.round(0.8 * kg), c = Math.max(0, Math.round((kcal - p * 4 - g * 9) / 4));
  return { kcal, p, g, c, bmr: Math.round(bmr), def: Math.round(def), kg };
}
function extraDia(d) {
  const s = salidaDe(d); if (!s || !['btt', 'trail', 'race'].includes(s.tipo)) return null;
  const k = r10(s.h * (s.tipo === 'trail' ? 550 : 450));
  return { kcal: k, c: Math.round(k * 0.8 / 4), t: s.h >= 2 ? `Durante la salida: 40-60 g de hidrato por hora (plátano, dátiles, bocadillo, bebida).` : 'Salida corta: basta con desayunar bien antes.' };
}

// ---------- CHEQUEO SEMANAL ----------
function chequeoPendiente() {
  if (!DB.plan) return false;
  const wk = wkey(today());
  if (DB.recup[wk]) return false;
  return monday(parse(DB.plan.creado)) < monday(today());
}
function aplicarChequeo(resp, pesoKg) {
  const wk = wkey(today()); const msgs = [];
  MUSCULOS.forEach(m => {
    const v = resp[m]; if (!v) return;
    const a = DB.volAdj[m] || 0;
    if (v === 1 && a < 2) { DB.volAdj[m] = a + 1; msgs.push(`${m}: vas fresco, +1 serie esta semana.`); }
    if (v === 3 && a > -1) { DB.volAdj[m] = a - 1; msgs.push(`${m}: cargado, −1 serie para que recupere.`); }
    if (v === 4) { DB.volAdj[m] = Math.max(-2, a - 1); msgs.push(`${m}: con molestia, −1 serie y sin forzar. Si sigue, para y consúltalo.`); }
  });
  if (resp.Pierna >= 3 && DB.perfil.finde) msgs.push('Pierna cargada: la salida del finde, más suave de lo marcado.');
  if (pesoKg) {
    const ant = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1).filter(p => parse(p.f) <= addD(today(), -5)).pop();
    DB.pesos = DB.pesos.filter(p => p.f !== key(today())); DB.pesos.push({ f: key(today()), kg: pesoKg });
    const P = DB.perfil;
    if (ant && P.objetivo === 'bajar' && pesoKg > P.pesoObj) {
      const sem = Math.max(1, (today() - parse(ant.f)) / DAY / 7);
      const baja = (ant.kg - pesoKg) / sem;
      if (baja < P.ritmo * 0.5 && (DB.nut.ajuste || 0) > -400) { DB.nut.ajuste = (DB.nut.ajuste || 0) - 100; msgs.push(`Bajas ${num(baja)} kg/semana: quito 100 kcal al día.`); }
      else if (baja > Math.max(0.9, P.ritmo * 1.6)) { DB.nut.ajuste = (DB.nut.ajuste || 0) + 150; msgs.push(`Bajas ${num(baja)} kg/semana, demasiado rápido: sumo 150 kcal para no perder fuerza.`); }
      else msgs.push(`Bajas ${num(baja)} kg/semana: vas bien, calorías igual.`);
    }
    if (pesoKg <= P.pesoObj && P.objetivo === 'bajar') msgs.push('¡Peso objetivo alcanzado! Pasas a calorías de mantenimiento.');
  }
  const v = volSemanas(3);
  if (v[0] && v[1] && v[2] && v[2] < v[1] && v[1] < v[0] && !descarga(addD(today(), -7))) {
    DB.nut.ajuste = (DB.nut.ajuste || 0) + 100; msgs.push('Tus kilos movidos llevan 2 semanas bajando: sumo 100 kcal y vigila el sueño.');
  }
  DB.recup[wk] = { resp, msgs };
  save(); return msgs;
}
function volSemanas(n) { // kg totales de las últimas n semanas completas (más antigua primero)
  const out = []; for (let i = n; i >= 1; i--) { const wk = key(addD(monday(today()), -7 * i)); out.push(DB.logs.filter(l => wkey(parse(l.fecha)) === wk).reduce((a, l) => a + l.vol, 0)); } return out;
}

// ---------- RENDER ----------
let tab = 'hoy', planWk = 0;
function render() {
  const m = $('#main'); m.innerHTML = '';
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  $('nav').style.display = DB.perfil ? 'flex' : 'none';
  if (!DB.perfil) return onboarding();
  ({ hoy: vHoy, plan: vPlan, comida: vComida, progreso: vProgreso, ajustes: vAjustes })[tab](m);
  window.scrollTo(0, 0);
}

// ---------- HOY ----------
function vHoy(m) {
  const t = today(); const P = DB.perfil; const f = P.finde ? fase(t) : null;
  m.append(el(`<div class="fecha"><span>${DN[dayIdx(t)]}, ${fmt(t)}</span>${f ? `<span class="ph" style="--c:${f.c}">${f.n}${descarga(t) ? ' · descarga' : ''}</span>` : descarga(t) ? '<span class="ph" style="--c:#a3a3a3">Semana de descarga</span>' : ''}</div>`));
  if (DB.activo) { const c = el(`<button class="card warn item"><span class="ic">⏱️</span><span class="tx"><b>Entreno en marcha</b><span>${DB.activo.n} · toca para seguir</span></span><span class="st">›</span></button>`); c.onclick = abrirEntreno; m.append(c); }
  if (chequeoPendiente()) { const c = el(`<button class="card note item"><span class="ic">📋</span><span class="tx"><b>Chequeo de la semana</b><span>Cómo te has recuperado y cuánto pesas. 1 minuto.</span></span><span class="st">›</span></button>`); c.onclick = abrirChequeo; m.append(c); }
  // anillos de la semana
  const R = retoSemana(monday(t));
  let minP = 0, minH = 0; for (let i = 0; i < 7; i++) { const d = addD(monday(t), i); const s = salidaDe(d); if (s) minP += s.h * 60; const r = DB.salidas[key(d)]; if (r) minH += r.min; }
  const ps = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1);
  const kg0 = ps.length ? ps[0].kg : P.peso, kgA = pesoActual();
  const fPeso = P.objetivo === 'bajar' && kg0 > P.pesoObj ? (kg0 - kgA) / (kg0 - P.pesoObj) : null;
  m.append(el(`<div class="rings">${anillo(R.gP ? R.gH / R.gP : 0, '#f97316', `${R.gH}/${R.gP}`, 'Gimnasio')}
    ${P.finde ? anillo(minP ? minH / minP : 0, '#38bdf8', hm(minH / 60).replace(' min', '′'), 'Bici y monte') : ''}
    ${fPeso != null ? anillo(fPeso, '#22c55e', `${num(kg0 - kgA)}`, 'kg bajados') : anillo(R.frac, '#22c55e', `${Math.round(R.frac * 100)}%`, 'Semana')}</div>`));
  m.append(tarjetaHoy(t));
  const cm = camino(); if (cm) m.append(el(cm));
  const N = nutri(); const ex = extraDia(t);
  const c = el(`<button class="card item"><span class="ic">🍽️</span><span class="tx"><b>${r10(N.kcal + (ex ? ex.kcal : 0))} kcal hoy</b><span>${N.p} g de proteína${ex ? ` · +${ex.kcal} por la salida` : ''}</span></span><span class="st">›</span></button>`);
  c.onclick = () => { tab = 'comida'; render(); }; m.append(c);
  m.append(el('<h3>Próximos días</h3>'));
  for (let i = 1; i <= 6; i++) { const d = addD(t, i); const x = diaPlan(d); if (x.tipo === 'descanso') continue; m.append(tarjetaDia(d, false)); }
}
// tarjeta grande de hoy, con foto
function tarjetaHoy(t) {
  const x = diaPlan(t); const box = el('<div class="hoy"></div>');
  if (x.tipo === 'gym') {
    const ses = x.ses; const h = hechoGym(t); const ids = ses.items.map((y, i) => ejDe(ses, i));
    const ult = DB.logs.filter(l => l.k === ses.k).pop(); const sube = ult && (ult.res || []).find(r => /^Sube/.test(r.msg || '') && ids.includes(r.id)); const rec = sube ? sube.id : null;
    const c = el(`<div class="hcard ${h ? 'ok' : ''}"><div class="hfoto">${ids.slice(0, 3).map(id => `<img src="${img(id)}" alt="">`).join('')}<span class="hpill">Hoy · ${ses.n}</span></div>
      <div class="hbody"><div><b>${h ? `Hecho · ${Math.round(h.dur)} min · ${num(h.vol / 1000)} t` : `${ses.items.length} ejercicios · ~${DB.perfil.min} min`}</b><small>${h ? 'Toca para ver el resumen' : rec ? `Hoy toca subir peso en ${LIB[rec].n.toLowerCase()}` : 'Toca las fotos para ver los ejercicios'}</small></div>
      ${h ? '<span class="st">✓</span>' : DB.activo ? '' : '<button class="btn">Empezar</button>'}</div></div>`);
    c.querySelector('.hfoto').onclick = () => h ? verResumen(h) : verSesion(ses, t);
    const b = c.querySelector('.hbody .btn'); if (b) b.onclick = () => empezar(ses, t);
    if (h) c.querySelector('.hbody').onclick = () => verResumen(h);
    box.append(c);
    if (x.sal) box.append(tarjetaSalida(t, x.sal, 'También: '));
    return box;
  }
  if (x.tipo === 'salida') {
    const s = x.sal; const r = DB.salidas[key(t)]; const [ic, n] = TIPO[s.tipo];
    const c = el(`<div class="hcard out ${r ? 'ok' : ''}"><div class="hfoto big"><span class="hic">${ic}</span><span class="hpill">Hoy · ${n} · ${hm(s.h)}</span></div>
      <div class="hbody"><div><b>${r ? `Hecho · ${r.min} min · ${r.sens}` : s.t}</b><small>${r ? 'Toca para cambiarlo' : 'Cuando vuelvas, apunta los minutos'}</small></div>${r ? '<span class="st">✓</span>' : '<button class="btn">Apuntar</button>'}</div></div>`);
    c.onclick = () => apuntarSalida(t, s); box.append(c); return box;
  }
  box.append(tarjetaDia(t, true)); return box;
}
function tarjetaDia(d, grande) {
  const x = diaPlan(d); const lab = grande ? '' : `${DN[dayIdx(d)]} ${d.getDate()} · `;
  const pas = d < today();
  if (x.tipo === 'gym') {
    const ses = x.ses; const h = hechoGym(d);
    const c = el(`<div></div>`);
    const b = el(`<button class="card item gym ${h ? 'ok' : ''}"><span class="ic">🏋️</span><span class="tx"><b>${lab}${ses.n}</b><span>${h ? `Hecho · ${Math.round(h.dur)} min · ${num(h.vol / 1000)} t movidas` : `${ses.items.length} ejercicios · ~${DB.perfil.min} min`}</span></span><span class="st">${h ? '✓' : '›'}</span></button>`);
    b.onclick = () => h ? verResumen(h) : verSesion(ses, d); c.append(b);
    if (grande && !h && !DB.activo) { const s = el('<button class="btn big wide">Empezar entreno</button>'); s.onclick = () => empezar(ses, d); c.append(s); }
    if (x.sal) c.append(tarjetaSalida(d, x.sal, lab));
    return c;
  }
  if (x.tipo === 'cardio') {
    const h = hechoGym(d);
    const c = el(`<button class="card item str ${h ? 'ok' : ''}"><span class="ic">🚴</span><span class="tx"><b>${lab}${x.n}</b><span>${x.t}</span></span><span class="st">${h ? '✓' : ''}</span></button>`);
    c.onclick = () => { if (h) return; if (confirm('¿Marcar como hecho?')) { DB.logs.push({ fecha: key(d), ses: x.n, dur: 30, vol: 0, items: [], cardio: true }); save(); render(); } };
    return c;
  }
  if (x.tipo === 'salida') return tarjetaSalida(d, x.sal, lab);
  if (x.tipo === 'descanso') return el(`<div class="card item"><span class="ic">😌</span><span class="tx"><b>${lab}Descanso</b><span>Caminar un rato y estirar si te apetece.</span></span></div>`);
  return el('<div></div>');
}
function tarjetaSalida(d, s, lab) {
  const r = DB.salidas[key(d)]; const [ic, n] = TIPO[s.tipo];
  const c = el(`<button class="card item out ${r ? 'ok' : ''}"><span class="ic">${ic}</span><span class="tx"><b>${lab}${n} · ${hm(s.h)}</b><span>${r ? `Hecho · ${r.min} min · ${r.sens}` : s.t}</span></span><span class="st">${r ? '✓' : '›'}</span></button>`);
  c.onclick = () => apuntarSalida(d, s); return c;
}
const hm = h => { const t = Math.round(h * 60); return t < 60 ? `${t} min` : `${Math.floor(t / 60)} h${t % 60 ? ' ' + pad(t % 60) : ''}`; };

function apuntarSalida(d, s) {
  const r = DB.salidas[key(d)] || {}; const [ic, n] = TIPO[s.tipo];
  const o = overlay(`${ic} ${n}`, `${DN[dayIdx(d)]} ${fmt(d)}`);
  o.body.innerHTML = `<div class="card"><b>Lo que toca: ${hm(s.h)}</b><p>${s.t}</p></div>
  <label class="lab">Minutos que has hecho<input id="smin" type="number" inputmode="numeric" value="${r.min || Math.round(s.h * 60)}"></label>
  <div class="lab">¿Qué tal?</div><div class="row" id="ssens">${['Bien', 'Cansado', 'Molestia'].map(x => `<button class="btn ghost ${r.sens === x ? 'sel' : ''}">${x}</button>`).join('')}</div>
  <button class="btn big wide" id="sok">Guardar</button>${r.min ? '<button class="btn ghost wide" id="sdel">Borrar este registro</button>' : ''}`;
  let sens = r.sens || 'Bien';
  o.body.querySelectorAll('#ssens button').forEach(b => b.onclick = () => { sens = b.textContent; o.body.querySelectorAll('#ssens button').forEach(x => x.classList.toggle('sel', x === b)); });
  o.body.querySelector('#sok').onclick = () => {
    DB.salidas[key(d)] = { min: +o.body.querySelector('#smin').value || 0, sens, tipo: s.tipo }; save(); o.close(); render();
    if (sens === 'Molestia') toast('Con molestia: la próxima, más suave. Si sigue, para.');
  };
  const del = o.body.querySelector('#sdel'); if (del) del.onclick = () => { delete DB.salidas[key(d)]; save(); o.close(); render(); };
}

// ---------- OVERLAY ----------
function overlay(t, sub, onclose) {
  const o = el(`<div class="over"><div class="ohead"><button class="back">‹</button><div><b>${t}</b><span>${sub || ''}</span></div></div><div class="obody"></div></div>`);
  document.body.append(o); document.body.style.overflow = 'hidden';
  const api = { el: o, body: o.querySelector('.obody'), head: o.querySelector('.ohead'), close() { o.remove(); if (!document.querySelector('.over')) document.body.style.overflow = ''; if (onclose) onclose(); } };
  o.querySelector('.back').onclick = api.close; return api;
}

// ---------- FICHA DE EJERCICIO ----------
function ficha(id) {
  const e = LIB[id] || ST[id];
  const o = overlay(e.n, LIB[id] ? `${PATRON_N[e.p]} · ${{ maq: 'máquina', polea: 'polea', manc: 'mancuernas', peso: 'peso corporal', barra: 'barra' }[e.eq]}` : 'Estiramiento');
  const st = DB.prog[id];
  o.body.innerHTML = `<div class="pics"><img src="img/${id}_0.jpg" alt=""><img src="img/${id}_1.jpg" alt=""></div><div class="piclab"><span>Inicio</span><span>Final</span></div>
  ${e.pasos ? `<h4>Cómo se hace</h4><ol>${e.pasos.map(x => `<li>${x}</li>`).join('')}</ol>` : `<p>${e.t}</p>`}
  ${e.err && e.err.length ? `<h4>Errores típicos</h4><ul class="err">${e.err.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
  ${e.gem && DB.perfil.gemelo ? `<div class="card gem">🦵 ${e.gem}</div>` : ''}
  ${st && LIB[id] && LIB[id].inc ? `<div class="card"><b>Tu peso ahora: ${num(st.kg)} kg</b><p class="mut">Mejor marca estimada (1 repetición): ${num(st.best || 0)} kg</p>${grafEj(id)}</div>` : ''}`;
}
function grafEj(id) {
  const pts = [];
  DB.logs.forEach(l => (l.items || []).forEach(it => { if (it.id !== id) return; const h = it.sets.filter(s => s.ok); if (h.length) pts.push({ x: +parse(l.fecha), y: Math.max(...h.map(s => +s.kg || 0)) }); }));
  return pts.length > 1 ? linea(pts, null, 'kg') : '';
}

// ---------- ESTIRAMIENTOS CON FOTOS ----------
function listaEstir(ids) {
  const box = el('<div></div>');
  ids.forEach(id => {
    const e = ST[id];
    const c = el(`<button class="card estir"><div class="pics"><img src="img/${id}_0.jpg" alt="" loading="lazy"><img src="img/${id}_1.jpg" alt="" loading="lazy"></div>
      <div class="etx"><b>${e.n}</b><span class="eseg">${e.s} s${e.lados ? ' por lado' : ''}</span></div><p class="mut">${e.t}</p></button>`);
    c.onclick = () => ficha(id); box.append(c);
  });
  return box;
}
function verEstiramientos() {
  const o = overlay('Estiramientos', 'Toca uno para verlo en grande');
  o.body.append(el('<h4>Después del gimnasio (5 min)</h4>'));
  o.body.append(listaEstir(STRETCH_POST));
  o.body.append(el('<h4>Más estiramientos (después de bici o monte)</h4>'));
  o.body.append(listaEstir(Object.keys(ST).filter(id => !STRETCH_POST.includes(id))));
}

// ---------- VER SESIÓN / CAMBIAR EJERCICIO ----------
function verSesion(ses, d) {
  const o = overlay(ses.n, d ? `${DN[dayIdx(d)]} ${fmt(d)}${descarga(d) ? ' · descarga' : ''}` : 'Tu plan');
  const pint = () => {
    o.body.innerHTML = `<div class="card warm">🔥 <b>Calentamiento:</b> ${CALENTAMIENTO}</div>`;
    ses.items.forEach((x, i) => {
      const id = ejDe(ses, i); const e = LIB[id]; const rc = receta(id, d || today()); const sg = sugerencia(id, rc.r);
      const c = el(`<div class="card exrow"><img src="${img(id)}" alt=""><span class="tx"><b>${e.n}</b><span>${rc.s} × ${e.seg ? `${sg.reps} s` : `${rc.r[0]}-${rc.r[1]}`}${e.inc ? ` · ${num(sg.kg)} kg${sg.nuevo ? ' (prueba)' : ''}` : ''}</span></span><button class="btn ghost sm">⇄</button></div>`);
      c.querySelector('img').onclick = c.querySelector('.tx').onclick = () => ficha(id);
      c.querySelector('button').onclick = () => cambiar(ses, i, () => pint());
      o.body.append(c);
    });
    if (DB.perfil.finde) o.body.append(el(`<div class="card mut">🚴 Al final: 10-12 min de bici estática suave (zona 2).</div>`));
    if (d && !hechoGym(d) && !DB.activo) { const b = el('<button class="btn big wide">Empezar entreno</button>'); b.onclick = () => { o.close(); empezar(ses, d); }; o.body.append(b); }
  };
  pint();
}
function cambiar(ses, i, done) {
  const actual = ejDe(ses, i); const p = LIB[actual].p;
  const c = candidatos(p).filter(x => x !== actual);
  const o = overlay('Cambiar ejercicio', `${PATRON_N[p]} · se queda guardado`);
  if (!c.length) o.body.innerHTML = '<p class="mut">No hay otro ejercicio equivalente con tu material.</p>';
  c.forEach(id => {
    const b = el(`<button class="card exrow"><img src="${img(id)}" alt=""><span class="tx"><b>${LIB[id].n}</b><span>${{ maq: 'Máquina', polea: 'Polea', manc: 'Mancuernas', peso: 'Peso corporal', barra: 'Barra' }[LIB[id].eq]}</span></span><span class="st">›</span></button>`);
    b.onclick = () => { DB.swaps[ses.k + ':' + i] = id; save(); o.close(); toast('Cambiado. La app lo recordará.'); done(id); };
    o.body.append(b);
  });
}

// ---------- ENTRENO EN MARCHA ----------
function empezar(ses, d) {
  const items = ses.items.map((x, i) => {
    const id = ejDe(ses, i); const rc = receta(id, d); const sg = sugerencia(id, rc.r);
    return { id, i, r: rc.r, desc: rc.desc, seg: !!LIB[id].seg, feel: null, sets: Array.from({ length: rc.s }, () => ({ kg: sg.kg, reps: sg.reps, ok: false })), nuevo: sg.nuevo };
  });
  DB.activo = { k: ses.k, n: ses.n, fecha: key(d), t0: Date.now(), pausa: 0, pausadoEn: null, items, abierto: 0 };
  save(); render(); abrirEntreno();
}
let timerInt = null, descInt = null;
function abrirEntreno() {
  const A = DB.activo; if (!A) return;
  const o = overlay(A.n, '', () => { clearInterval(timerInt); render(); });
  const reloj = el(`<div class="reloj"><b id="tt">0:00</b><button class="btn ghost sm" id="tp"></button></div>`);
  o.head.append(reloj);
  const tick = () => { const ms = (A.pausadoEn || Date.now()) - A.t0 - A.pausa; const s = Math.max(0, Math.floor(ms / 1000)); reloj.querySelector('#tt').textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`; reloj.querySelector('#tp').textContent = A.pausadoEn ? 'Seguir' : 'Pausa'; };
  reloj.querySelector('#tp').onclick = () => { if (A.pausadoEn) { A.pausa += Date.now() - A.pausadoEn; A.pausadoEn = null; } else A.pausadoEn = Date.now(); save(); tick(); };
  clearInterval(timerInt); timerInt = setInterval(tick, 1000); tick();
  const pint = () => {
    o.body.innerHTML = '';
    if (descarga(parse(A.fecha))) o.body.append(el('<div class="card note"><b>Semana de descarga</b><p>Una serie menos y mismos pesos. Sales con ganas.</p></div>'));
    o.body.append(el(`<div class="card warm">🔥 <b>Calentamiento:</b> ${CALENTAMIENTO}</div>`));
    A.items.forEach((it, n) => o.body.append(tarjetaEj(it, n, pint)));
    const vc = el(`<button class="card item"><span class="ic">🧘</span><span class="tx"><b>Vuelta a la calma</b><span>${STRETCH_POST.length} estiramientos con fotos · 5 min</span></span><span class="st">›</span></button>`);
    vc.onclick = () => { const o2 = overlay('Vuelta a la calma', 'Toca uno para verlo en grande'); o2.body.append(listaEstir(STRETCH_POST)); };
    o.body.append(vc);
    const fin = el('<button class="btn big wide">Terminar entreno</button>'); fin.onclick = () => terminar(o); o.body.append(fin);
    const dis = el('<button class="btn ghost wide">Descartar entreno</button>');
    dis.onclick = () => { if (confirm('¿Descartar este entreno? No se guarda nada.')) { DB.activo = null; save(); o.close(); } };
    o.body.append(dis);
  };
  pint();
}
function tarjetaEj(it, n, repaint) {
  const A = DB.activo; const e = LIB[it.id]; const abierto = A.abierto === n;
  const hechas = it.sets.filter(s => s.ok).length; const todo = hechas === it.sets.length;
  const c = el(`<div class="card exc ${todo ? 'ok' : ''}"></div>`);
  const h = el(`<button class="exrow"><img src="${img(it.id)}" alt=""><span class="tx"><b>${e.n}</b><span>${hechas}/${it.sets.length} series · ${it.seg ? 'segundos' : `${it.r[0]}-${it.r[1]} reps`}</span></span><span class="st">${todo ? '✓' : abierto ? '▾' : '▸'}</span></button>`);
  h.onclick = () => { A.abierto = abierto ? -1 : n; save(); repaint(); }; c.append(h);
  if (!abierto) return c;
  const anim = el(`<div class="anim"><img src="img/${it.id}_0.jpg" alt=""><img src="img/${it.id}_1.jpg" alt="" class="b"></div>`); c.append(anim);
  if (it.nuevo && e.inc) c.append(el(`<div class="card sug">🔎 Primera vez: el peso es orientativo. Ajústalo hasta que la última repetición cueste, pero te queden 2 en la recámara.</div>`));
  if (e.gem && DB.perfil.gemelo) c.append(el(`<div class="card gem">🦵 ${e.gem}</div>`));
  const box = el('<div class="sets"></div>');
  it.sets.forEach((s, j) => {
    const r = el(`<div class="set ${s.ok ? 'ok' : ''}"><span class="sn">${j + 1}</span>
      ${e.inc ? `<label><span>kg${e.eq === 'manc' && !e.uni && !e.una ? ' (c/u)' : ''}</span><input type="number" inputmode="decimal" step="0.5" value="${s.kg}"></label>` : ''}
      <label><span>${it.seg ? 'segundos' : 'repes'}</span><input type="number" inputmode="numeric" value="${s.reps}"></label>
      <button class="chk">${s.ok ? '✓' : '○'}</button></div>`);
    const ins = r.querySelectorAll('input');
    if (e.inc) ins[0].onchange = () => { s.kg = +ins[0].value || 0; for (let k = j + 1; k < it.sets.length; k++) if (!it.sets[k].ok) it.sets[k].kg = s.kg; save(); repaint(); };
    ins[ins.length - 1].onchange = () => { s.reps = +ins[ins.length - 1].value || 0; save(); };
    r.querySelector('.chk').onclick = () => {
      s.kg = e.inc ? +ins[0].value || 0 : 0; s.reps = +ins[ins.length - 1].value || 0; s.ok = !s.ok; save();
      if (s.ok && it.sets.some(x => !x.ok)) descanso(it.desc);
      repaint();
    };
    box.append(r);
  });
  c.append(box);
  const row = el(`<div class="row"><button class="btn ghost sm">+ Serie</button><button class="btn ghost sm">⇄ Cambiar</button><button class="btn ghost sm">ⓘ Ficha</button></div>`);
  const [bAdd, bCh, bFi] = row.querySelectorAll('button');
  bAdd.onclick = () => { const l = it.sets[it.sets.length - 1]; it.sets.push({ kg: l.kg, reps: l.reps, ok: false }); save(); repaint(); };
  bFi.onclick = () => ficha(it.id);
  bCh.onclick = () => { const ses = DB.plan.sesiones.find(x => x.k === A.k); if (!ses) return; cambiar(ses, it.i, id => { const sg = sugerencia(id, it.r); it.id = id; it.seg = !!LIB[id].seg; it.nuevo = sg.nuevo; it.sets = it.sets.map(() => ({ kg: sg.kg, reps: sg.reps, ok: false })); save(); repaint(); }); };
  c.append(row);
  if (todo) {
    const f = el(`<div><div class="lab">¿Cómo ha ido?</div><div class="row">${[['facil', 'Fácil'], ['bien', 'Bien'], ['duro', 'Duro']].map(([k, t]) => `<button class="btn ghost ${it.feel === k ? 'sel' : ''}" data-k="${k}">${t}</button>`).join('')}</div></div>`);
    f.querySelectorAll('button').forEach(b => b.onclick = () => { it.feel = b.dataset.k; const nx = A.items.findIndex(x => x.sets.some(s => !s.ok)); A.abierto = nx; save(); repaint(); });
    c.append(f);
  }
  return c;
}
function descanso(seg) {
  clearInterval(descInt); document.querySelectorAll('.rest').forEach(x => x.remove());
  let fin = Date.now() + seg * 1000;
  const b = el(`<div class="rest"><span>Descanso</span><b>0:00</b><button class="btn ghost sm">+15 s</button><button class="btn sm">Saltar</button></div>`);
  document.body.append(b);
  const [mas, sal] = b.querySelectorAll('button');
  const t = () => { const s = Math.ceil((fin - Date.now()) / 1000); if (s <= 0) { clearInterval(descInt); b.remove(); try { navigator.vibrate && navigator.vibrate([300, 120, 300]); } catch (e) { } toast('¡A por la siguiente serie!'); return; } b.querySelector('b').textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`; };
  mas.onclick = () => { fin += 15000; t(); }; sal.onclick = () => { clearInterval(descInt); b.remove(); };
  descInt = setInterval(t, 250); t();
}
function terminar(o) {
  const A = DB.activo; const hechas = A.items.reduce((a, it) => a + it.sets.filter(s => s.ok).length, 0);
  if (!hechas) return toast('Marca al menos una serie con ○');
  const pend = A.items.reduce((a, it) => a + it.sets.filter(s => !s.ok).length, 0);
  if (pend && !confirm(`Te quedan ${pend} series sin marcar. ¿Terminar igualmente?`)) return;
  const fin = A.pausadoEn || Date.now();
  const dur = (fin - A.t0 - A.pausa) / 60000;
  let vol = 0; const res = [];
  A.items.forEach(it => {
    const e = LIB[it.id];
    it.sets.filter(s => s.ok).forEach(s => vol += (+s.kg || 0) * (+s.reps || 0) * (e.eq === 'manc' && !e.uni && !e.una ? 2 : 1) * (e.seg ? 0 : 1));
    const p = progresar(it); if (p) res.push({ id: it.id, ...p });
  });
  const prev = DB.logs.filter(l => l.k === A.k).pop();
  const log = { fecha: A.fecha, k: A.k, ses: A.n, dur, vol, items: A.items.map(it => ({ id: it.id, feel: it.feel, sets: it.sets })), res, prevVol: prev ? prev.vol : null };
  DB.logs.push(log); DB.activo = null; save();
  clearInterval(descInt); document.querySelectorAll('.rest').forEach(x => x.remove());
  o.close(); verResumen(log, true);
  if (res.some(r => r.record)) setTimeout(confeti, 300);
}
function verResumen(l, recien) {
  const o = overlay(recien ? '¡Entreno hecho! 💪' : l.ses, `${DN[dayIdx(parse(l.fecha))]} ${fmt(parse(l.fecha))}`, () => render());
  const series = (l.items || []).reduce((a, it) => a + it.sets.filter(s => s.ok).length, 0);
  const recs = (l.res || []).filter(r => r.record);
  const dif = l.prevVol ? Math.round((l.vol - l.prevVol) / l.prevVol * 100) : null;
  o.body.innerHTML = `<div class="stats"><div><b>${Math.round(l.dur)}</b><span>minutos</span></div><div><b>${num(l.vol / 1000)}</b><span>toneladas</span></div><div><b>${series}</b><span>series</span></div></div>
  ${dif != null ? `<div class="card ${dif >= 0 ? 'gem' : ''}">${dif >= 0 ? '📈' : '📉'} ${dif >= 0 ? '+' : ''}${dif}% de kilos movidos respecto a la última vez que hiciste esta sesión.</div>` : ''}
  ${recs.length ? `<div class="card warn"><b>🏆 ${recs.length} récord${recs.length > 1 ? 's' : ''}</b><ul>${recs.map(r => `<li>${LIB[r.id].n}</li>`).join('')}</ul></div>` : ''}
  <h4>Para la próxima vez</h4>${(l.res || []).map(r => `<div class="card exrow"><img src="${img(r.id)}" alt=""><span class="tx"><b>${LIB[r.id].n}</b><span class="prog">${r.msg || 'Igual'}</span></span></div>`).join('')}
  `;
  if (recien) { o.body.append(el('<h4>Vuelta a la calma (5 min)</h4>')); o.body.append(listaEstir(STRETCH_POST)); }
  if (!recien) { const b = el('<button class="btn ghost wide">Borrar este entreno</button>'); b.onclick = () => { if (confirm('¿Borrar este entreno del historial?')) { DB.logs = DB.logs.filter(x => x !== l); save(); o.close(); } }; o.body.append(b); }
  else { const b = el('<button class="btn big wide">Listo</button>'); b.onclick = () => o.close(); o.body.append(b); }
}

// ---------- CHEQUEO SEMANAL ----------
function abrirChequeo() {
  const o = overlay('Chequeo de la semana', 'Con esto ajusto series y calorías', () => render());
  const resp = {}; const OP = [[1, 'Fresco'], [2, 'Normal'], [3, 'Cargado'], [4, 'Molestia']];
  o.body.innerHTML = `<p class="mut">¿Cómo tienes cada zona después de esta semana (gimnasio + salidas)?</p>`;
  MUSCULOS.forEach(m => {
    const r = el(`<div class="card"><b>${m}</b><div class="row seg">${OP.map(([v, t]) => `<button class="btn ghost sm" data-v="${v}">${t}</button>`).join('')}</div></div>`);
    r.querySelectorAll('button').forEach(b => b.onclick = () => { resp[m] = +b.dataset.v; r.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); });
    o.body.append(r);
  });
  o.body.append(el(`<label class="lab">Tu peso de hoy (en ayunas)<input id="cpeso" type="number" inputmode="decimal" step="0.1" placeholder="${num(pesoActual())}"></label>`));
  const b = el('<button class="btn big wide">Guardar chequeo</button>');
  b.onclick = () => {
    const pk = parseFloat(String(o.body.querySelector('#cpeso').value).replace(',', '.')) || null;
    const msgs = aplicarChequeo(resp, pk);
    o.body.innerHTML = `<h3>Ajustes de esta semana</h3>${msgs.length ? msgs.map(x => `<div class="card">${x}</div>`).join('') : '<div class="card">Todo en orden: el plan sigue igual.</div>'}`;
    const ok = el('<button class="btn big wide">Vale</button>'); ok.onclick = () => o.close(); o.body.append(ok);
  };
  o.body.append(b);
}

// ---------- PLAN ----------
function vPlan(m) {
  const P = DB.perfil; const lm = addD(monday(today()), planWk * 7);
  m.append(el('<h2>Plan</h2>'));
  const f = P.finde ? fase(lm) : null; const w = P.finde ? semanaBici(lm) : null;
  const nav = el(`<div class="wnav"><button class="btn ghost sm">‹</button><div><b>Semana del ${fmt(lm)}</b><span>${w >= 1 && w <= 25 ? `Semana ${w} de 25${f ? ' · ' + f.n : ''}` : ''}${descarga(lm) ? ' · descarga' : ''}</span></div><button class="btn ghost sm">›</button></div>`);
  const [bp, bn] = nav.querySelectorAll('button'); bp.onclick = () => { planWk--; render(); }; bn.onclick = () => { planWk++; render(); };
  m.append(nav);
  if (f) m.append(el(`<div class="card note" style="border-left-color:${f.c}"><b style="color:${f.c}">${f.n}</b><p>${f.t}</p></div>`));
  for (let i = 0; i < 7; i++) m.append(tarjetaDia(addD(lm, i), false));
  if (planWk) { const b = el('<button class="btn ghost wide">Volver a esta semana</button>'); b.onclick = () => { planWk = 0; render(); }; m.append(b); }
  m.append(el('<h3>Tus sesiones</h3>'));
  DB.plan.sesiones.forEach(s => { const c = el(`<button class="card item gym"><span class="ic">🏋️</span><span class="tx"><b>${s.n}</b><span>${s.items.map((x, i) => LIB[ejDe(s, i)].n).join(' · ')}</span></span><span class="st">›</span></button>`); c.onclick = () => verSesion(s); m.append(c); });
  const lb = el('<button class="btn ghost wide">📚 Biblioteca de ejercicios</button>'); lb.onclick = biblioteca; m.append(lb);
  const es = el('<button class="btn ghost wide">🧘 Estiramientos con fotos</button>'); es.onclick = verEstiramientos; m.append(es);
}
function biblioteca() {
  const o = overlay('Biblioteca', `${Object.keys(LIB).length} ejercicios y ${Object.keys(ST).length} estiramientos`);
  const q = el('<input class="search" placeholder="Buscar…">'); o.body.append(q); const box = el('<div></div>'); o.body.append(box);
  const pint = () => {
    const t = q.value.toLowerCase(); box.innerHTML = '';
    [...MUSCULOS, 'Gemelo', 'Cardio', 'Estiramientos'].forEach(g => {
      const ids = g === 'Estiramientos' ? Object.keys(ST).filter(id => ST[id].n.toLowerCase().includes(t)) : Object.keys(LIB).filter(id => LIB[id].m === g && LIB[id].n.toLowerCase().includes(t));
      if (!ids.length) return; box.append(el(`<h4>${g}</h4>`));
      ids.forEach(id => { const e = LIB[id] || ST[id]; const b = el(`<button class="card exrow"><img src="${img(id)}" alt="" loading="lazy"><span class="tx"><b>${e.n}</b><span>${LIB[id] ? PATRON_N[e.p] : `${e.s} s`}</span></span><span class="st">›</span></button>`); b.onclick = () => ficha(id); box.append(b); });
    });
  };
  q.oninput = pint; pint();
}

// ---------- COMIDA ----------
let recTipo = 'Todas';
function vComida(m) {
  const N = nutri(); const P = DB.perfil; const ex = extraDia(today());
  m.append(el('<h2>Comida</h2>'));
  const tot = N.p * 4 + N.c * 4 + N.g * 9;
  m.append(el(`<div class="card"><div class="kcal"><b>${N.kcal}</b><span>kcal al día</span></div>
    <div class="macro"><span style="flex:${N.p * 4 / tot};background:#38bdf8"></span><span style="flex:${N.c * 4 / tot};background:#f97316"></span><span style="flex:${N.g * 9 / tot};background:#eab308"></span></div>
    <div class="mrow"><div><b>${N.p} g</b><span>Proteína</span></div><div><b>${N.c} g</b><span>Hidratos</span></div><div><b>${N.g} g</b><span>Grasa</span></div></div>
    <p class="mut">${P.objetivo === 'bajar' && N.def > 0 ? `Para bajar unos ${num(Math.min(P.ritmo, 0.75))} kg/semana.` : P.objetivo === 'musculo' ? 'Con un pequeño superávit para ganar músculo.' : 'Mantenimiento.'} Se recalcula cada semana con tu peso.${DB.nut.ajuste ? ` Ajuste acumulado: ${DB.nut.ajuste > 0 ? '+' : ''}${DB.nut.ajuste} kcal.` : ''}</p></div>`));
  if (ex) m.append(el(`<div class="card gem"><b>Hoy hay salida: +${ex.kcal} kcal</b> (unos ${ex.c} g más de hidrato).<p>${ex.t}</p></div>`));
  m.append(el(`<div class="card sug"><b>Reglas de la casa</b><ul><li>Recorta entre semana, no en los días de salida.</li><li>Proteína en cada comida (unos ${Math.round(N.p / 4)} g).</li><li>Pésate 1 vez por semana, mismo día, en ayunas: va en el chequeo semanal.</li></ul></div>`));
  m.append(el('<h3>Peso</h3>'));
  const ps = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1);
  const g = el(`<div class="card">${ps.length > 1 ? linea(ps.map(p => ({ x: +parse(p.f), y: p.kg })), P.objetivo === 'bajar' ? P.pesoObj : null, 'kg') : '<p class="mut">Cuando tengas dos pesadas verás aquí la gráfica.</p>'}
    <div class="row"><input id="npeso" type="number" inputmode="decimal" step="0.1" placeholder="Peso de hoy"><button class="btn sm">Apuntar</button></div>
    <p class="mut">Ahora ${num(pesoActual())} kg${P.objetivo === 'bajar' ? ` · objetivo ${num(P.pesoObj)} kg` : ''}</p></div>`);
  g.querySelector('button').onclick = () => { const v = parseFloat(String(g.querySelector('input').value).replace(',', '.')); if (!v) return toast('Pon el peso'); DB.pesos = DB.pesos.filter(p => p.f !== key(today())); DB.pesos.push({ f: key(today()), kg: v }); save(); render(); };
  m.append(g);
  m.append(el('<h3>Recetas</h3>'));
  const tipos = ['Todas', ...new Set(RECETAS.map(r => r.tipo))];
  const ch = el(`<div class="chips">${tipos.map(t => `<button class="${t === recTipo ? 'on' : ''}">${t}</button>`).join('')}</div>`);
  ch.querySelectorAll('button').forEach(b => b.onclick = () => { recTipo = b.textContent; render(); }); m.append(ch);
  RECETAS.filter(r => recTipo === 'Todas' || r.tipo === recTipo).forEach(r => {
    const c = el(`<button class="card item"><span class="ic">${{ Desayuno: '🥣', Comida: '🍲', Cena: '🥗', Recena: '🥛', Salida: '🥪' }[r.tipo]}</span><span class="tx"><b>${r.n}</b><span>${r.kcal} kcal · P ${r.p} · H ${r.c} · G ${r.g}</span></span><span class="st">›</span></button>`);
    c.onclick = () => { const o = overlay(r.n, `${r.tipo} · valores aproximados`); o.body.innerHTML = `<div class="mrow card"><div><b>${r.kcal}</b><span>kcal</span></div><div><b>${r.p} g</b><span>Proteína</span></div><div><b>${r.c} g</b><span>Hidratos</span></div><div><b>${r.g} g</b><span>Grasa</span></div></div><h4>Ingredientes</h4><p>${r.ing}</p><h4>Cómo</h4><p>${r.t}</p>`; };
    m.append(c);
  });
}

// ---------- PROGRESO ----------
function vProgreso(m) {
  m.append(el('<h2>Progreso</h2>'));
  const gym = DB.logs.filter(l => !l.cardio);
  const lm = monday(today());
  const estaVol = gym.filter(l => wkey(parse(l.fecha)) === key(lm)).reduce((a, l) => a + l.vol, 0);
  let racha = 0; for (let i = 1; i < 60; i++) { const wk = key(addD(lm, -7 * i)); if (DB.logs.some(l => wkey(parse(l.fecha)) === wk)) racha++; else break; }
  if (DB.logs.some(l => wkey(parse(l.fecha)) === key(lm))) racha++;
  const horas = Object.entries(DB.salidas).filter(([f]) => wkey(parse(f)) === key(lm)).reduce((a, [, s]) => a + s.min, 0);
  m.append(el(`<div class="stats"><div><b>${gym.length}</b><span>entrenos</span></div><div><b>${racha}</b><span>semanas seguidas</span></div><div><b>${num(estaVol / 1000)}</b><span>t esta semana</span></div><div><b>${num(horas / 60)}</b><span>horas fuera esta semana</span></div></div>`));
  const labs = [], vals = []; for (let i = 7; i >= 0; i--) { const d = addD(lm, -7 * i); labs.push(`${d.getDate()}/${d.getMonth() + 1}`); vals.push(gym.filter(l => wkey(parse(l.fecha)) === key(d)).reduce((a, l) => a + l.vol, 0) / 1000); }
  m.append(el(`<div class="card"><b>Toneladas movidas por semana</b>${barras(vals, labs)}</div>`));
  const sv = [], sl = []; for (let i = 7; i >= 0; i--) { const d = addD(lm, -7 * i); sl.push(`${d.getDate()}/${d.getMonth() + 1}`); sv.push(Object.entries(DB.salidas).filter(([f]) => wkey(parse(f)) === key(d)).reduce((a, [, s]) => a + s.min, 0) / 60); }
  if (DB.perfil.finde) m.append(el(`<div class="card"><b>Horas de bici y monte por semana</b>${barras(sv, sl, '#38bdf8')}</div>`));
  const ps = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1);
  if (ps.length > 1) m.append(el(`<div class="card"><b>Peso</b>${linea(ps.map(p => ({ x: +parse(p.f), y: p.kg })), DB.perfil.objetivo === 'bajar' ? DB.perfil.pesoObj : null, 'kg')}</div>`));
  const recs = Object.entries(DB.prog).filter(([id, s]) => LIB[id] && LIB[id].inc && s.best).sort((a, b) => b[1].best - a[1].best);
  if (recs.length) {
    m.append(el('<h3>Tus marcas</h3>'));
    recs.forEach(([id, s]) => { const c = el(`<button class="card exrow"><img src="${img(id)}" alt=""><span class="tx"><b>${LIB[id].n}</b><span>Trabajas con ${num(s.kg)} kg · máx. estimado ${num(s.best)} kg</span></span><span class="st">›</span></button>`); c.onclick = () => ficha(id); m.append(c); });
  }
  m.append(el('<h3>Historial</h3>'));
  if (!DB.logs.length) m.append(el('<p class="mut">Aquí irán tus entrenos.</p>'));
  DB.logs.slice().reverse().slice(0, 30).forEach(l => { const c = el(`<button class="card item ${l.cardio ? 'str' : 'gym'}"><span class="ic">${l.cardio ? '🚴' : '🏋️'}</span><span class="tx"><b>${l.ses}</b><span>${fmt(parse(l.fecha))}${l.cardio ? '' : ` · ${Math.round(l.dur)} min · ${num(l.vol / 1000)} t`}</span></span><span class="st">›</span></button>`); if (!l.cardio) c.onclick = () => verResumen(l); m.append(c); });
}

// ---------- GRÁFICAS (SVG) ----------
function barras(v, l, col = '#f97316') {
  const W = 320, H = 120, mx = Math.max(...v, 0.001), bw = W / v.length;
  return `<svg viewBox="0 0 ${W} ${H + 18}" class="chart">${v.map((x, i) => { const h = x / mx * (H - 16); return `<rect x="${i * bw + 4}" y="${H - h}" width="${bw - 8}" height="${h}" rx="4" fill="${col}" opacity="${i === v.length - 1 ? 1 : .6}"/>${x ? `<text x="${i * bw + bw / 2}" y="${H - h - 4}" text-anchor="middle" class="cv">${num(x)}</text>` : ''}<text x="${i * bw + bw / 2}" y="${H + 14}" text-anchor="middle" class="cl">${l[i]}</text>`; }).join('')}</svg>`;
}
function linea(pts, obj, u) {
  const W = 320, H = 130, P = 26;
  const ys = pts.map(p => p.y).concat(obj != null ? [obj] : []); let y0 = Math.min(...ys), y1 = Math.max(...ys); if (y1 - y0 < 1) { y0 -= 0.5; y1 += 0.5; }
  const x0 = pts[0].x, x1 = pts[pts.length - 1].x || x0 + 1;
  const X = x => P + (x - x0) / ((x1 - x0) || 1) * (W - P - 8), Y = y => 8 + (y1 - y) / (y1 - y0) * (H - 24);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${obj != null ? `<line x1="${P}" x2="${W - 8}" y1="${Y(obj)}" y2="${Y(obj)}" stroke="#22c55e" stroke-dasharray="4 4"/><text x="${W - 8}" y="${Y(obj) - 4}" text-anchor="end" class="cl" fill="#22c55e">objetivo ${num(obj)}</text>` : ''}
  <path d="${d}" fill="none" stroke="#f97316" stroke-width="2.5"/>${pts.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3" fill="#f97316"/>`).join('')}
  <text x="2" y="${Y(y1) + 4}" class="cl">${num(y1)}</text><text x="2" y="${Y(y0) + 4}" class="cl">${num(y0)}</text>
  <text x="${P}" y="${H - 2}" class="cl">${fmt(new Date(x0))}</text><text x="${W - 8}" y="${H - 2}" text-anchor="end" class="cl">${fmt(new Date(x1))}</text></svg>`;
}

// ---------- AJUSTES ----------
function vAjustes(m) {
  const P = DB.perfil;
  m.append(el('<h2>Ajustes</h2>'));
  m.append(el(`<div class="card"><b>Tu perfil</b><p class="mut">${P.edad} años · ${P.altura} cm · ${num(pesoActual())} kg · ${{ bajar: 'bajar peso y ganar fuerza', musculo: 'ganar músculo', mantener: 'mantener y rendir' }[P.objetivo]}<br>${{ cero: 'Empezando', algo: 'Algo de experiencia', mucho: 'Con experiencia' }[P.nivel]} · ${P.lugar === 'gym' ? 'gimnasio' : 'casa'} · ${P.dias.map(d => DC[d]).join(' ')} · ${P.min} min<br>Prioridad: ${{ pierna: 'pierna', equilibrado: 'equilibrado', superior: 'tren superior' }[P.prioridad]}${P.lumbar ? ' · cuida lumbar' : ''}${P.gemelo ? ' · cuida gemelo' : ''}${P.finde ? ` · Monegros ${fmt(parse(P.monegros))}` : ''}</p></div>`));
  const b1 = el('<button class="btn wide">Rehacer el cuestionario</button>'); b1.onclick = () => { if (confirm('Rehaces el cuestionario y se genera un plan nuevo. Tu historial y tus pesos se conservan. ¿Seguimos?')) { onboarding(true); } }; m.append(b1);
  const b2 = el('<button class="btn ghost wide">⬇️ Guardar copia de seguridad</button>'); b2.onclick = exportar; m.append(b2);
  const b3 = el('<button class="btn ghost wide">⬆️ Cargar copia de seguridad</button>'); b3.onclick = importar; m.append(b3);
  const b4 = el('<button class="btn ghost wide danger">Borrar todo y empezar de cero</button>'); b4.onclick = () => { if (confirm('Se borra TODO: plan, entrenos, pesos. No hay vuelta atrás. ¿Seguro?')) { localStorage.removeItem(KEY); location.reload(); } }; m.append(b4);
  m.append(el('<p class="mut" style="text-align:center;margin-top:20px">Coach Iñaki · v3</p>'));
}
function exportar() {
  const b = new Blob([JSON.stringify(DB)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `coach-copia-${key(today())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importar() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json';
  i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); if (!d.v) throw 0; if (!confirm('Esto sustituye los datos actuales por los de la copia. ¿Seguro?')) return; DB = d; save(); render(); toast('Copia cargada'); } catch (e) { toast('Ese archivo no es una copia válida'); } }); };
  i.click();
}

// ---------- CUESTIONARIO INICIAL ----------
function onboarding(rehacer) {
  const A = Object.assign({}, PERFIL_DEF, DB.perfil || {});
  const pasos = [
    { t: '¿Hombre o mujer?', s: 'Para calcular tus calorías.', op: [['h', 'Hombre'], ['m', 'Mujer']], k: 'sexo' },
    { t: 'Tus datos', s: 'Edad, altura y peso de hoy.', f: [['edad', 'Edad', 'años'], ['altura', 'Altura', 'cm'], ['peso', 'Peso', 'kg']] },
    { t: '¿Qué buscas?', op: [['bajar', 'Bajar peso y ganar fuerza'], ['musculo', 'Ganar músculo'], ['mantener', 'Mantener y rendir en bici']], k: 'objetivo' },
    { t: '¿A qué peso quieres llegar?', s: 'Y a qué ritmo. Más de 0,5 kg por semana cuesta fuerza.', f: [['pesoObj', 'Peso objetivo', 'kg'], ['ritmo', 'Ritmo', 'kg/semana']], si: () => A.objetivo === 'bajar' },
    { t: '¿Qué experiencia tienes en el gimnasio?', op: [['cero', 'Ninguna o casi ninguna'], ['algo', 'Algo: conozco las máquinas'], ['mucho', 'Bastante: entreno hace tiempo']], k: 'nivel' },
    { t: '¿Dónde entrenas?', op: [['gym', 'En el gimnasio'], ['casa', 'En casa (mancuernas y peso corporal)']], k: 'lugar' },
    { t: '¿Qué días vas a entrenar fuerza?', s: 'Elige de 2 a 4. Con 4 se reparte en pierna y tren superior.', dias: true },
    { t: '¿Cuánto tiempo por sesión?', op: [[45, '45 minutos'], [60, '1 hora'], [75, '1 hora y cuarto']], k: 'min' },
    { t: '¿Qué quieres priorizar?', op: [['pierna', 'Pierna (más series)'], ['equilibrado', 'Todo por igual'], ['superior', 'Tren superior']], k: 'prioridad' },
    { t: '¿Algo que cuidar?', s: 'Quito los ejercicios que no te convienen.', chk: [['lumbar', 'Lumbar delicada'], ['gemelo', 'Gemelo (prevención)']] },
    { t: 'Bici y monte', s: '¿Metemos el plan de fin de semana de BTT y trail hasta Monegros?', op: [[true, 'Sí, con el plan de Monegros'], [false, 'No, solo gimnasio']], k: 'finde' },
    { t: '¿Cuándo es Monegros?', s: 'Fecha estimada: último sábado de abril. Cámbiala cuando la publiquen.', fecha: 'monegros', si: () => A.finde },
  ];
  let i = 0;
  const o = overlay(rehacer ? 'Rehacer el plan' : 'Vamos a hacer tu plan', '');
  if (!rehacer) o.head.querySelector('.back').style.visibility = 'hidden';
  const back = () => { do { i--; } while (i > 0 && pasos[i].si && !pasos[i].si()); if (i < 0) { if (rehacer) o.close(); i = 0; } pint(); };
  o.head.querySelector('.back').onclick = () => i === 0 ? (rehacer ? o.close() : null) : back();
  const sig = () => { do { i++; } while (i < pasos.length && pasos[i].si && !pasos[i].si()); if (i >= pasos.length) return acabar(); pint(); };
  const pint = () => {
    const p = pasos[i]; const B = o.body; const vis = pasos.filter(x => !x.si || x.si()); const n = vis.indexOf(p) + 1;
    o.head.querySelector('span').textContent = `Paso ${n} de ${vis.length}`;
    B.innerHTML = `<div class="barra"><span style="width:${n / vis.length * 100}%"></span></div><h2>${p.t}</h2>${p.s ? `<p class="mut">${p.s}</p>` : ''}`;
    if (p.op) p.op.forEach(([v, t]) => { const b = el(`<button class="card opt ${A[p.k] === v ? 'sel' : ''}">${t}</button>`); b.onclick = () => { A[p.k] = v; sig(); }; B.append(b); });
    if (p.f) { p.f.forEach(([k, t, u]) => B.append(el(`<label class="lab">${t} (${u})<input type="number" inputmode="decimal" step="0.1" data-k="${k}" value="${A[k]}"></label>`))); }
    if (p.fecha) B.append(el(`<label class="lab">Fecha<input type="date" data-k="${p.fecha}" value="${A[p.fecha]}"></label>`));
    if (p.dias) { const r = el(`<div class="chips big">${DC.map((d, j) => `<button class="${A.dias.includes(j) ? 'on' : ''}">${d}</button>`).join('')}</div>`); r.querySelectorAll('button').forEach((b, j) => b.onclick = () => { A.dias = A.dias.includes(j) ? A.dias.filter(x => x !== j) : [...A.dias, j].sort(); b.classList.toggle('on'); }); B.append(r); }
    if (p.chk) p.chk.forEach(([k, t]) => { const b = el(`<button class="card opt ${A[k] ? 'sel' : ''}">${A[k] ? '☑' : '☐'} ${t}</button>`); b.onclick = () => { A[k] = !A[k]; pint(); }; B.append(b); });
    if (!p.op) {
      const b = el('<button class="btn big wide">Siguiente</button>');
      b.onclick = () => {
        let ok = true;
        B.querySelectorAll('input[data-k]').forEach(x => { if (x.type === 'date') { if (!x.value) ok = false; A[x.dataset.k] = x.value; } else { const v = parseFloat(String(x.value).replace(',', '.')); if (!v) ok = false; A[x.dataset.k] = v; } });
        if (p.dias && (A.dias.length < 2 || A.dias.length > 4)) return toast('Elige entre 2 y 4 días');
        if (!ok) return toast('Rellena todos los datos');
        sig();
      };
      B.append(b);
    }
  };
  const acabar = () => {
    o.body.innerHTML = `<div class="calc"><div class="spin"></div><h3>Calculando tu plan…</h3><p class="mut">Eligiendo ejercicios, series y pesos para ti.</p></div>`;
    setTimeout(() => {
      DB.perfil = A; DB.plan = generarPlan(A); DB.swaps = {}
      if (!DB.pesos.length || rehacer) { DB.pesos = DB.pesos.filter(p => p.f !== key(today())); DB.pesos.push({ f: key(today()), kg: A.peso }); }
      save();
      const N = nutri();
      o.body.innerHTML = `<h2>Tu plan está listo 💪</h2>
      <div class="card"><b>${DB.plan.sesiones.length} sesiones de fuerza</b><p class="mut">${A.dias.map(d => DN[d]).join(', ')} · unos ${A.min} min</p>${DB.plan.sesiones.map(s => `<p>• ${s.n}: ${s.items.length} ejercicios</p>`).join('')}</div>
      <div class="card"><b>${N.kcal} kcal al día</b><p class="mut">${N.p} g proteína · ${N.c} g hidratos · ${N.g} g grasa</p></div>
      ${A.finde ? `<div class="card"><b>Plan de bici y monte hasta Monegros</b><p class="mut">Sábados y domingos, con semanas de descarga.</p></div>` : ''}
      <div class="card sug">La primera semana es de prueba: los pesos son orientativos y la app aprende de lo que apuntes. Cada lunes te pregunto cómo vas y ajusto.</div>`;
      const b = el('<button class="btn big wide">Empezar</button>'); b.onclick = () => { o.close(); tab = 'hoy'; render(); }; o.body.append(b);
    }, 1400);
  };
  pint();
}

// ---------- arranque ----------
document.querySelectorAll('nav button').forEach(b => b.onclick = () => { tab = b.dataset.t; planWk = 0; render(); });
render();
if (DB.activo && DB.perfil) abrirEntreno();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(r => navigator.serviceWorker.ready).then(r => r.active && r.active.postMessage('fotos')).catch(() => { });

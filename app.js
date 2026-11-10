// ===== CAMINO A MONEGROS · lógica de la app =====
'use strict';
const KEY = 'monegros_gym_v1', OLD = 'coach_inaki_v1', LAMK = 'monegros_laminas', DAY = 864e5;
const DN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DC = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

let DB = { v: 1, prog: {}, logs: [], pesos: [], salidas: {}, hecho: {}, recetas: {}, compra: {}, chequeo: {}, ajuste: 0, draft: null };
(function cargar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { DB = Object.assign(DB, JSON.parse(raw)); return; }
    const old = localStorage.getItem(OLD); // de la versión anterior: peso corporal, kilos de cada ejercicio y salidas
    if (old) {
      const o = JSON.parse(old);
      DB.pesos = Array.isArray(o.pesos) ? o.pesos : [];
      DB.salidas = o.salidas && typeof o.salidas === 'object' ? o.salidas : {};
      Object.entries(o.prog || {}).forEach(([id, p]) => { if (p && p.kg != null) DB.prog[id] = { kg: +p.kg || 0, reps: +p.reps || 0 }; });
    }
  } catch (e) { }
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast('No se ha podido guardar'); } }

// ---------- utilidades ----------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function el(h) { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; }
function toast(t) { const x = el(`<div class="toast">${t}</div>`); document.body.append(x); setTimeout(() => x.remove(), 2800); }
const pad = n => String(n).padStart(2, '0');
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayIdx = d => (d.getDay() + 6) % 7;
const monday = d => addD(d, -dayIdx(d));
const wkey = d => key(monday(d));
const dias = (a, b) => Math.round((b - a) / DAY);
const fmt = d => `${d.getDate()} ${MES[d.getMonth()]}`;
const num = (x, dec = 1) => (Math.round(x * 10 ** dec) / 10 ** dec).toLocaleString('es-ES');
const im = (id, n = 0) => `img/${id}_${n}.jpg`;
const horas = h => { const H = Math.floor(h), M = Math.round((h - H) * 60); return !H ? `${M} min` : M ? `${H} h ${M} min` : `${H} h`; };
const roundInc = (kg, inc) => inc ? Math.max(inc, Math.round(kg / inc) * inc) : 0;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function pitido() {
  try { navigator.vibrate && navigator.vibrate([250, 120, 250]); } catch (e) { }
  try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.value = .15; o.start(); setTimeout(() => { o.stop(); a.close(); }, 350); } catch (e) { }
}
let wake = null;
async function despierto(on) { try { if (on && 'wakeLock' in navigator) wake = await navigator.wakeLock.request('screen'); else if (!on && wake) { wake.release(); wake = null; } } catch (e) { } }

// ---------- láminas propias (solo en este móvil, nunca se suben) ----------
function laminas() { try { return JSON.parse(localStorage.getItem(LAMK)) || {}; } catch (e) { return {}; } }
function guardarLamina(k, file) {
  if (!file) return;
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const sc = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    const L = laminas(); L[k] = c.toDataURL('image/jpeg', 0.8);
    try { localStorage.setItem(LAMK, JSON.stringify(L)); toast('Lámina guardada en tu móvil'); } catch (e) { toast('No cabe más: quita alguna lámina'); }
    render();
  };
  img.onerror = () => toast('No he podido leer esa imagen');
  img.src = url;
}
function bloqueLamina(k, texto) {
  const L = laminas()[k];
  const c = el(`<div class="card">${L ? `<img src="${L}" alt="" style="width:100%;border-radius:10px;display:block"><div class="row" style="gap:8px;margin-top:8px"><button class="sm ghost" data-a="ver">Ver grande</button><label class="sm ghost">Cambiar<input type="file" accept="image/*" hidden></label><button class="sm ghost" data-a="del">Quitar</button></div>`
    : `<label class="row" style="cursor:pointer"><div class="ic">📷</div><div class="grow"><b>Añadir mi lámina</b><div class="small mut">${texto}. Se guarda solo en tu móvil, no se sube a internet.</div></div><input type="file" accept="image/*" hidden></label>`}</div>`);
  $('input', c).onchange = e => guardarLamina(k, e.target.files[0]);
  const v = $('[data-a=ver]', c); if (v) v.onclick = () => { const o = el(`<div class="ov" style="background:#000;overflow:auto"><img src="${L}" style="width:100%"></div>`); o.onclick = () => o.remove(); document.body.append(o); };
  const d = $('[data-a=del]', c); if (d) d.onclick = () => { const X = laminas(); delete X[k]; localStorage.setItem(LAMK, JSON.stringify(X)); render(); };
  return c;
}

// ---------- calendario ----------
const START = parse(INICIO), RACE = parse(MONEGROS);
const semana = d => Math.floor(dias(START, monday(d)) / 7) + 1;
const fase = w => FASES.find(f => w >= f.de && w <= f.a) || FASES[0];
const descarga = w => w >= 1 && w <= 20 && w % 4 === 0;
function suave(d) { const w = semana(d); return descarga(w) || (w >= 22 && w <= 27) || !!(DB.chequeo[wkey(d)] && DB.chequeo[wkey(d)].suave); }
function sesionDe(d) {
  const w = semana(d), di = dayIdx(d);
  if (w < 1) return null;
  if (w === 25 && di === 4) return null; // víspera de Monegros
  return { 0: 'L', 2: 'X', 4: 'V' }[di] || null;
}
function salidaDe(d) {
  const di = dayIdx(d); if (di < 5) return null;
  const w = semana(d);
  if (w < 1) return null;
  if (w < FINDE.length) { const s = FINDE[w][di - 5]; return { tipo: s[0], h: s[1], t: s[2] }; }
  if (w <= 27) return di === 5 ? { tipo: 'btt', h: 1.5, t: 'Recuperación: paseo suave en bici.' } : { tipo: 'walk', h: 1, t: 'Caminata tranquila.' };
  return di === 5 ? { tipo: 'trail', h: 2, t: 'Tirada libre de trail o BTT. Cuando elijas el siguiente objetivo, la montamos.' } : { tipo: 'btt', h: 1.5, t: 'Rodaje suave.' };
}
function itemsDia(d) {
  const out = []; const s = sesionDe(d); const sal = salidaDe(d);
  if (s) out.push({ k: 'gym', ses: s });
  if (sal) out.push(Object.assign({ k: 'out' }, sal));
  if (semana(d) === 25 && dayIdx(d) === 4) out.push({ k: 'rest', t: 'Descanso total: mañana es Monegros. Prepara bici, comida y bebida.' });
  return out;
}
const hechoItem = (d, it) => it.k === 'gym' ? !!(DB.hecho[key(d)] && DB.hecho[key(d)].gym) : it.k === 'out' ? !!DB.salidas[key(d)] : false;
function statsSemana(lun) {
  let p = 0, h = 0;
  for (let i = 0; i < 7; i++) { const d = addD(lun, i); itemsDia(d).forEach(it => { if (it.k === 'rest') return; p++; if (hechoItem(d, it)) h++; }); }
  return { p, h, frac: p ? h / p : 0 };
}

// ---------- pesos y progresión ----------
function sugerencia(it) {
  const e = LIB[it.id] || {}; const st = DB.prog[it.id];
  if (it.seg) return { kg: 0, reps: st && st.reps ? st.reps : it.seg[0], nuevo: !st };
  if (!st) return { kg: e.ini || 0, reps: it.r[0], nuevo: true };
  return { kg: st.kg, reps: Math.min(Math.max(st.reps || it.r[0], it.r[0]), e.inc ? it.r[1] : it.r[1] + 8), nuevo: false };
}
function progresar(it, x) { // it = ejercicio del plan, x = lo hecho {id, sets, feel}
  const e = LIB[x.id] || {}; const hechas = x.sets.filter(s => s.ok); if (!hechas.length) return null;
  const st = DB.prog[x.id] || { kg: 0, reps: 0, fails: 0 };
  const kg = Math.max(...hechas.map(s => +s.kg || 0)); const minR = Math.min(...hechas.map(s => +s.reps || 0));
  let msg;
  if (it.seg) {
    st.kg = 0;
    if (minR >= (st.reps || it.seg[0]) && x.feel !== 'duro') { st.reps = Math.min(it.seg[1] + 30, minR + 5); msg = `Próxima vez: ${st.reps} s`; }
    else { st.reps = minR; msg = `Próxima vez: ${minR} s otra vez`; }
  } else if (it.fijo) { st.kg = kg; st.reps = it.r[0]; msg = 'Mismo peso: es de prevención'; }
  else if (!e.inc) {
    st.kg = 0;
    if (minR >= it.r[0] && x.feel !== 'duro') { st.reps = Math.min(it.r[1] + 8, minR + 1); msg = `Próxima vez: ${st.reps} repeticiones`; }
    else { st.reps = Math.max(it.r[0], minR); msg = 'Mismas repeticiones'; }
  } else if ((minR >= it.r[1] && x.feel !== 'duro') || (x.feel === 'facil' && minR >= it.r[0])) {
    st.kg = kg + e.inc * (x.feel === 'facil' && minR >= it.r[1] ? 2 : 1); st.reps = it.r[0]; st.fails = 0;
    msg = `Sube a ${num(st.kg)} kg`;
  } else if (minR < it.r[0]) {
    st.fails = (st.fails || 0) + 1; st.kg = kg;
    if (st.fails >= 2) { st.kg = roundInc(kg * 0.9, e.inc); st.reps = it.r[0]; st.fails = 0; msg = `Baja a ${num(st.kg)} kg y vuelve a subir`; }
    else { st.reps = it.r[0]; msg = `Mismo peso (${num(kg)} kg), a por ${it.r[0]} repeticiones`; }
  } else { st.kg = kg; st.fails = 0; st.reps = Math.min(it.r[1], minR + 1); msg = `Mismo peso (${num(kg)} kg), busca ${st.reps} repeticiones`; }
  DB.prog[x.id] = st;
  return msg;
}
const presc = (it, n) => it.seg ? `${n} × ${it.seg[0]}-${it.seg[1]} s${it.uni ? ' por lado' : ''}` : `${n} × ${it.r[0] === it.r[1] ? it.r[0] : it.r[0] + '-' + it.r[1]}${it.uni ? ' por lado' : ''}`;

// ---------- nutrición ----------
function pesoActual() { const p = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1); return p.length ? +p[p.length - 1].kg : PERFIL.peso; }
function nutri() {
  const kg = pesoActual();
  const bmr = 10 * kg + 6.25 * PERFIL.altura - 5 * PERFIL.edad + 5;
  const def = kg > PERFIL.pesoObj ? PERFIL.ritmo * 1000 : 0;
  const kcal = Math.max(Math.round(bmr * 1.05 / 10) * 10, Math.round((bmr * 1.45 - def + (DB.ajuste || 0)) / 10) * 10);
  const p = Math.round(1.8 * kg), g = Math.round(0.8 * kg), c = Math.max(0, Math.round((kcal - p * 4 - g * 9) / 4));
  return { kcal, p, g, c };
}

// ---------- navegación ----------
let tab = 'hoy', rutSel = null;
function render() {
  const m = $('#main'); m.innerHTML = '';
  ({ hoy: vHoy, rut: vRutinas, cam: vCamino, pro: vProgreso })[tab](m);
}
function ir(t) { tab = t; render(); scrollTo(0, 0); }
function atras() { const b = el('<button class="sm ghost" style="margin-bottom:10px;position:sticky;top:calc(8px + env(safe-area-inset-top));z-index:4;background:var(--bg)">‹ Hoy</button>'); b.onclick = () => ir('hoy'); return b; }
function overlay(titulo, sub, onclose) {
  const o = el(`<div class="ov"><div class="hd"><button class="back">‹</button><div class="grow"><b>${titulo}</b><span>${sub || ''}</span></div></div><div class="bd"></div></div>`);
  const cerrar = () => { o.remove(); onclose && onclose(); };
  $('.back', o).onclick = cerrar; document.body.append(o);
  return { o, bd: $('.bd', o), cerrar, hd: $('.hd', o) };
}
function hoja(html) {
  const o = el(`<div class="ov sheet"><div class="box"><div class="bd" style="padding-bottom:calc(24px + env(safe-area-inset-bottom))"></div></div></div>`);
  $('.bd', o).innerHTML = html; o.onclick = e => { if (e.target === o) o.remove(); };
  document.body.append(o); return o;
}

// ---------- HOY ----------
function vHoy(m) {
  const t = today(), w = semana(t), f = fase(Math.max(1, w)), falta = dias(t, RACE);
  m.append(el(`<div class="top"><div><div class="d">${DN[dayIdx(t)]}, ${fmt(t)}</div><h1>Hoy toca</h1></div><span class="pill" style="--c:${f.c}">Semana ${Math.max(1, w)} · ${f.n}</span></div>`));
  const its = itemsDia(t);
  if (!its.length) m.append(el(`<div class="card" style="text-align:center;padding:24px 14px"><div style="font-size:44px">😌</div><h2 style="font-size:34px">Descanso</h2><div class="mut">Hoy no toca nada. Descansa y bebe agua.</div></div>`));
  else its.forEach(it => m.append(tarjeta(t, it)));
  let n = addD(t, 1); while (!itemsDia(n).length && n - t < 8 * DAY) n = addD(n, 1);
  const nx = itemsDia(n)[0];
  if (nx) { const c = el(`<button class="card btn"><div class="row"><div class="grow"><div class="small mut">LO SIGUIENTE · ${DN[dayIdx(n)].toUpperCase()} ${fmt(n)}</div><b>${textoItem(nx)}</b></div><span class="mut">›</span></div></button>`); c.onclick = () => verDia(n); m.append(c); }
  m.append(el('<div class="sec">Esta semana</div>'));
  const lista = el('<div class="card" style="padding:4px 0"></div>');
  for (let i = 0; i < 7; i++) {
    const d = addD(monday(t), i), di = itemsDia(d).filter(x => x.k !== 'rest'), hoy = key(d) === key(t);
    const ok = di.length && di.every(x => hechoItem(d, x)), pasado = d < t;
    const est = ok ? '✅' : !di.length ? '' : hoy ? '<span class="pill">hoy</span>' : pasado ? '<span class="small mut">sin hacer</span>' : '';
    const r = el(`<button class="drow ${hoy ? 'hoy' : ''}"><b>${DC[i]} ${d.getDate()}</b><span class="grow">${di.length ? di.map(textoItem).join(' + ') : '<span class="mut">Descanso</span>'}</span>${est}</button>`);
    r.onclick = () => verDia(d); lista.append(r);
  }
  m.append(lista);
  if (chequeoPendiente()) { const q = el(`<button class="card btn warn"><div class="row"><div class="ic">📝</div><div class="grow"><b>Revisión de la semana</b><div class="small mut">1 minuto: cómo vas y tu peso</div></div><span class="sm">Hacer</span></div></button>`); q.onclick = abrirChequeo; m.append(q); }
  m.append(el(`<div class="card"><div class="row"><div class="ic">🍽️</div><div class="grow small">${consejoComida(t)}</div></div></div>`));
  const acc = el(`<div class="tres"><button><span>🏋️</span>Rutinas</button><button><span>🗺️</span>Camino<small>${falta > 0 ? falta + ' días' : ''}</small></button><button><span>📈</span>Progreso</button></div>`);
  ['rut', 'cam', 'pro'].forEach((k, i) => $$('button', acc)[i].onclick = () => ir(k)); m.append(acc);
}
function consejoComida(d) {
  const n = nutri(), hoy = salidaDe(d), man = salidaDe(addD(d, 1)); let t;
  if (hoy && hoy.h >= 2) t = 'Salida larga: desayuna bien y come algo cada hora (plátano, dátiles o bocadillo). Bebe cada 15 minutos.';
  else if (man && man.h >= 3) t = 'Mañana toca tirada larga: cena con hidratos (pasta o arroz) y deja la comida de la salida preparada.';
  else if (sesionDe(d)) t = 'Gimnasio en ayunas: después, desayuno con proteína (yogur griego, huevos o pavo) y algo de pan o fruta.';
  else t = 'Día tranquilo: proteína en cada comida, verdura en comida y cena, y sin picar entre horas.';
  return `<b>${t}</b><div class="mut" style="margin-top:4px">Objetivo del día: unas ${n.kcal} kcal y ${n.p} g de proteína.</div>`;
}
const textoItem = it => it.k === 'gym' ? `🏋️ ${SESIONES[it.ses].n}` : it.k === 'out' ? `${TIPO[it.tipo][0]} ${TIPO[it.tipo][1]} ${horas(it.h)}` : '🏁 Descanso';
function tarjeta(d, it, futuro) {
  if (it.k === 'rest') return el(`<div class="card note"><b>🏁 ${it.t}</b></div>`);
  const ok = hechoItem(d, it);
  if (it.k === 'gym') {
    const S = SESIONES[it.ses], dr = DB.draft && DB.draft.k === key(d) && DB.draft.ses === it.ses;
    const c = el(`<div class="card ${ok ? 'ok' : ''}" style="border-left:4px solid ${S.c}">
      <div class="row"><div class="grow"><div class="small mut">${S.dia.toUpperCase()} · 6:00 · 1 HORA${suave(d) ? ' · SEMANA SUAVE' : ''}</div><h2 style="font-size:30px;line-height:1.05">${S.n}</h2></div>${ok ? '<div style="font-size:30px">✅</div>' : ''}</div>
      <div class="row" style="gap:6px;margin:10px 0;overflow:hidden">${S.items.slice(0, 5).map(x => `<img class="thumb" src="${im(x.id, 1)}" alt="" style="width:62px;height:46px">`).join('')}</div>
      <div class="small mut">Calentamiento 8' · ${S.items.length} ejercicios · cinta 12' · 12 estiramientos</div>
      ${futuro ? '' : `<button class="big" style="margin-top:12px">${ok ? 'Ver lo que hice' : dr ? 'CONTINUAR' : 'EMPEZAR'}</button>`}</div>`);
    const b = $('button.big', c); if (b) b.onclick = () => ok ? verResumenDia(key(d)) : abrirEntreno(it.ses, d);
    if (futuro) { c.style.cursor = 'pointer'; c.append(el('<div class="small" style="color:var(--accent);margin-top:8px">Ver la rutina ›</div>')); c.onclick = () => { rutSel = it.ses; ir('rut'); }; }
    return c;
  }
  const s = DB.salidas[key(d)];
  const c = el(`<div class="card ${ok ? 'ok' : ''}" style="border-left:4px solid var(--blue)"><div class="row"><div class="ic">${TIPO[it.tipo][0]}</div><div class="grow"><div class="small mut">${TIPO[it.tipo][1].toUpperCase()} · ${horas(it.h)}</div><b>${esc(it.t)}</b>
    ${s ? `<div class="small" style="color:var(--accent);margin-top:4px">Hecho: ${s.km ? num(+s.km) + ' km · ' : ''}${s.h ? horas(+s.h) : ''}${s.des ? ' · ' + s.des + ' m' : ''}</div>` : ''}</div></div>
    ${futuro ? '' : `<button class="sm ${ok ? 'ghost' : ''}" style="margin-top:10px">${ok ? 'Editar' : 'Apuntar salida'}</button>`}</div>`);
  const b = $('button', c); if (b) b.onclick = () => apuntarSalida(d, it);
  if (futuro) { c.style.cursor = 'pointer'; c.onclick = () => verDia(d); }
  return c;
}
function verDia(d) {
  const its = itemsDia(d), o = hoja(`<div class="small mut">${DN[dayIdx(d)]} · semana ${semana(d)}</div><h2 style="font-size:32px;margin-bottom:10px">${fmt(d)}</h2><div id="its"></div>`);
  if (!its.length) $('#its', o).append(el('<div class="card"><div class="row"><div class="ic">😌</div><b>Día de descanso</b></div></div>'));
  its.forEach(it => {
    if (it.k === 'rest') { $('#its', o).append(el(`<div class="card note"><b>🏁 ${it.t}</b></div>`)); return; }
    const c = tarjeta(d, it, false);
    $$('button', c).forEach(b => b.addEventListener('click', () => o.remove()));
    if (it.k === 'gym') {
      const v = el('<button class="big ghost" style="margin-top:8px">Ver la rutina</button>');
      v.onclick = () => { o.remove(); rutSel = it.ses; ir('rut'); }; c.append(v);
    }
    $('#its', o).append(c);
  });
}

// ---------- RUTINAS (estilo lámina) ----------
function vRutinas(m) {
  if (!rutSel) rutSel = sesionDe(today()) || 'L';
  m.append(atras()); m.append(el('<div class="top"><h1>Rutinas</h1><span class="mut small">L · X · V a las 6:00</span></div>'));
  const ch = el('<div class="chips"></div>');
  Object.entries(SESIONES).forEach(([k, S]) => { const b = el(`<button class="chip ${rutSel === k ? 'on' : ''}">${S.dia}</button>`); b.onclick = () => { rutSel = k; render(); }; ch.append(b); });
  m.append(ch);
  const S = SESIONES[rutSel];
  m.append(el(`<div class="lam" style="--c:${S.c}"><div class="lam-t">${S.n}</div><div class="lam-s">${S.dia} · 1 hora · ${S.items.length} ejercicios</div></div>`));
  m.append(bloqueLamina(rutSel, 'Guarda aquí la captura de la rutina que te gusta'));
  m.append(el(`<div class="sec">1 · Calentamiento · 8 min</div>`));
  const cal = el('<div class="card"></div>');
  CALENTAMIENTO.forEach(c => cal.append(el(`<div class="exrow" style="margin-bottom:8px">${c.id ? `<img src="${im(c.id)}" alt="">` : '<div class="thumb ico">🔁</div>'}<div class="grow"><b>${c.n}</b><div class="small mut">${c.t}</div></div></div>`)));
  m.append(cal);
  m.append(el(`<div class="sec">2 · Fuerza · ${S.items.length} ejercicios</div>`));
  S.items.forEach((it, i) => {
    const e = LIB[it.id], sg = sugerencia(it);
    const c = el(`<button class="card btn"><div class="row" style="align-items:flex-start"><span class="nb">${i + 1}</span><div class="grow"><div class="lam-n">${e.n}</div><div class="small mut">${e.mus || e.m}</div></div><span class="sr">${presc(it, it.s)}</span></div>
      <div class="pair"><div><img src="${im(it.id, 0)}" alt="" loading="lazy"><span>Inicial</span></div><div><img src="${im(it.id, 1)}" alt="" loading="lazy"><span>Final</span></div></div>
      <div class="small" style="color:var(--accent)">${it.seg ? `Tu tiempo: ${sg.reps} s` : !e.inc ? `Peso corporal · ${sg.reps} repeticiones` : sg.nuevo ? `Primera vez: empieza con unos ${num(sg.kg)} kg` : `Tu peso: ${num(sg.kg)} kg`} · descanso ${it.d} s</div></button>`);
    c.onclick = () => ficha(it.id); m.append(c);
  });
  m.append(el(`<div class="sec">3 · Cardio · ${CARDIO.min} min</div>`));
  const ca = el(`<button class="card btn"><div class="exrow"><img src="${im(CARDIO.id)}" alt=""><div class="grow"><b>Cinta de correr · ${CARDIO.min} min</b><div class="small mut">${CARDIO.t}</div></div></div></button>`);
  ca.onclick = () => ficha(CARDIO.id); m.append(ca);
  m.append(el(`<div class="sec">4 · Estiramientos · 20-30 s cada uno</div>`));
  m.append(gridEst());
  m.append(bloqueLamina('est', 'Guarda aquí la captura de los estiramientos'));
  const est = el('<button class="big ghost" style="margin:4px 0 12px">Hacer solo los estiramientos</button>'); est.onclick = () => estirar(null); m.append(est);
  const go = el(`<button class="big">EMPEZAR ${S.dia.toUpperCase()}</button>`); go.onclick = () => abrirEntreno(rutSel, today()); m.append(go);
}
function gridEst() {
  const g = el('<div class="grid3"></div>');
  ESTIRAMIENTOS.forEach((id, i) => g.append(el(`<div class="gst"><span class="nb sm2">${i + 1}</span><img src="${im(id)}" alt="" loading="lazy"><b>${ST[id].n}</b></div>`)));
  return g;
}
function ficha(id) {
  const e = LIB[id] || {};
  hoja(`<h2 style="font-size:28px">${e.n || id}</h2><div class="small mut" style="margin-bottom:10px">${e.mus || e.m || ''}</div>
    <div class="pair"><div><img src="${im(id, 0)}" alt=""><span>Inicial</span></div><div><img src="${im(id, 1)}" alt=""><span>Final</span></div></div>
    ${e.pasos ? `<div class="sec">Cómo se hace</div><ol class="l">${e.pasos.map(p => `<li>${p}</li>`).join('')}</ol>` : ''}
    ${e.err ? `<div class="sec">Errores típicos</div><ul class="l">${e.err.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
    ${e.gem ? `<div class="card note" style="margin-top:12px">${e.gem}</div>` : ''}`);
}

// ---------- ENTRENAMIENTO ----------
let restT = null;
function nuevoDraft(ses, d) {
  const S = SESIONES[ses], lig = suave(d);
  return { k: key(d), ses, paso: 0, t0: Date.now(), cal: {}, cardio: false, est: false, lig,
    ex: S.items.map(it => { const sg = sugerencia(it), n = lig ? Math.min(2, it.s) : it.s; return { id: it.id, feel: null, sets: Array.from({ length: n }, () => ({ kg: sg.kg, reps: sg.reps, ok: false })) }; }) };
}
function abrirEntreno(ses, d) {
  if (!DB.draft || DB.draft.k !== key(d) || DB.draft.ses !== ses) { DB.draft = nuevoDraft(ses, d); save(); }
  const D = DB.draft, S = SESIONES[ses], N = S.items.length;
  const pasos = ['cal', ...S.items.map((_, i) => i), 'cardio', 'est'];
  const ov = overlay(S.n, '', () => { pararDescanso(); despierto(false); render(); });
  despierto(true);
  const foot = el('<div class="foot"></div>'); ov.o.append(foot);
  const ir = i => { D.paso = Math.max(0, Math.min(pasos.length - 1, i)); save(); dibujar(); ov.bd.scrollTop = 0; };
  const botones = (txt, fn) => {
    foot.innerHTML = '';
    const g = el(`<div style="display:grid;grid-template-columns:${D.paso ? '1fr 3fr' : '1fr'};gap:8px"></div>`);
    if (D.paso) { const a = el('<button class="big ghost">‹</button>'); a.onclick = () => ir(D.paso - 1); g.append(a); }
    const b = el(`<button class="big">${txt}</button>`); b.onclick = fn || (() => ir(D.paso + 1)); g.append(b); foot.append(g);
  };
  const dibujar = () => {
    const p = pasos[D.paso], top = ov.bd.scrollTop; ov.bd.innerHTML = '';
    $('span', ov.hd).textContent = p === 'cal' ? 'Calentamiento' : typeof p === 'number' ? `Ejercicio ${p + 1} de ${N}` : p === 'cardio' ? 'Cinta' : 'Estiramientos';
    if (D.lig && D.paso === 0) ov.bd.append(el('<div class="card note small"><b>Semana suave:</b> mismo peso y solo 2 series. Toca recuperar.</div>'));
    if (p === 'cal') {
      ov.bd.append(el('<div><h2 style="font-size:32px">Calentamiento</h2><div class="mut" style="margin-bottom:10px">8 minutos, en este orden</div></div>'));
      CALENTAMIENTO.forEach((c, i) => ov.bd.append(el(`<div class="card"><div class="exrow">${c.id ? `<img src="${im(c.id)}" alt="">` : '<div class="thumb ico">🔁</div>'}<div class="grow"><b>${i + 1}. ${c.n}</b><div class="small mut">${c.t}</div></div></div></div>`)));
      botones('YA HE CALENTADO →');
    } else if (typeof p === 'number') {
      dibujarEj(ov.bd, S.items[p], D.ex[p], p, N, dibujar);
      botones(p === N - 1 ? 'IR A LA CINTA →' : 'SIGUIENTE EJERCICIO →');
      ov.bd.scrollTop = top;
    } else if (p === 'cardio') {
      ov.bd.append(el(`<h2 style="font-size:32px">Cinta · ${CARDIO.min} minutos</h2>`));
      ov.bd.append(el(`<div class="pair"><div><img src="${im(CARDIO.id, 0)}" alt=""></div><div><img src="${im(CARDIO.id, 1)}" alt=""></div></div>`));
      ov.bd.append(el(`<div class="card"><b>Anda rápido en cuesta</b> (inclinación 6-10 %, 5-5,5 km/h) <b>o trota suave</b> si el gemelo va bien. Tienes que poder hablar.</div>`));
      ov.bd.append(reloj(CARDIO.min * 60, () => { D.cardio = true; save(); }));
      botones('CINTA HECHA → ESTIRAR', () => { D.cardio = true; ir(D.paso + 1); });
    } else {
      ov.bd.append(el('<div><h2 style="font-size:32px">Estiramientos</h2><div class="mut" style="margin-bottom:10px">Pulsa empezar y van solos, uno detrás de otro (unos 8 min).</div></div>'));
      const b = el(`<button class="big" style="margin-bottom:12px">${D.est ? '✓ Hechos · repetir' : '▶ EMPEZAR ESTIRAMIENTOS'}</button>`);
      b.onclick = () => estirar(() => { D.est = true; save(); terminar(ov); }); ov.bd.append(b);
      ov.bd.append(gridEst());
      botones('TERMINAR SESIÓN ✓', () => terminar(ov));
    }
  };
  dibujar();
}
function dibujarEj(bd, it, x, i, n, redraw) {
  const e = LIB[x.id] || {}, conPeso = !it.seg && e.inc, hechas = x.sets.filter(s => s.ok).length, s0 = x.sets.find(s => !s.ok) || x.sets[x.sets.length - 1];
  const rango = it.seg ? `${it.seg[0]}-${it.seg[1]} segundos` : `${it.r[0] === it.r[1] ? it.r[0] : it.r[0] + '-' + it.r[1]} repeticiones`;
  bd.append(el(`<div><div class="lam-n" style="font-size:32px">${e.n}</div><div class="small mut">${e.mus || e.m || ''}</div></div>`));
  const pr = el(`<div class="pair"><div><img src="${im(x.id, 0)}" alt=""><span>Inicial</span></div><div><img src="${im(x.id, 1)}" alt=""><span>Final</span></div></div>`);
  pr.onclick = () => ficha(x.id); bd.append(pr);
  const nuevo = !DB.prog[x.id] && conPeso;
  bd.append(el(`<div class="target">Haz <b>${x.sets.length} series</b> de <b>${rango}</b>${it.uni ? ' <b>por lado</b>' : ''}${conPeso ? ` con <b>${num(+s0.kg)} kg</b>` : it.seg ? '' : ' (sin peso)'}
    ${nuevo ? '<div class="small" style="margin-top:6px;color:var(--warn)">Primera vez: el peso es orientativo. Que te sobren 2-3 repeticiones; si no, bájalo.</div>' : ''}
    <div class="small mut" style="margin-top:6px">Descansa ${it.d} s entre series.</div></div>`));
  x.sets.forEach((s, j) => {
    const lbl = `${conPeso ? num(+s.kg) + ' kg × ' : ''}${s.reps} ${it.seg ? 's' : 'rep'}`;
    const b = el(`<button class="setb ${s.ok ? 'ok' : ''}"><span>Serie ${j + 1}</span><span class="grow small" style="text-align:right;margin-right:12px">${lbl}</span><span class="ck">${s.ok ? '✓' : ''}</span></button>`);
    b.onclick = () => {
      s.ok = !s.ok;
      if (s.ok) x.sets.slice(j + 1).forEach(q => { if (!q.ok) { q.kg = s.kg; q.reps = s.reps; } });
      save(); redraw(); if (s.ok) empezarDescanso(it.d, x.sets.every(q => q.ok));
    };
    bd.append(b);
  });
  const ed = el(`<button class="sm ghost" style="margin:4px 0 10px">${x.edit ? 'Listo' : conPeso ? 'Cambiar peso o repeticiones' : 'Cambiar repeticiones'}</button>`);
  ed.onclick = () => { x.edit = !x.edit; save(); redraw(); }; bd.append(ed);
  if (x.edit) {
    const s = s0;
    const r = el(`<div class="card">${conPeso ? `<div class="small mut">Peso</div><div class="stp" style="margin:4px 0 10px"><button data-a="k-">−</button><span>${num(+s.kg)}<small> kg</small></span><button data-a="k+">+</button></div>` : ''}
      <div class="small mut">${it.seg ? 'Segundos' : 'Repeticiones'}</div><div class="stp" style="margin-top:4px"><button data-a="r-">−</button><span>${s.reps}<small> ${it.seg ? 's' : 'rep'}</small></span><button data-a="r+">+</button></div>
      <div class="small mut" style="margin-top:8px">Se aplica a la serie que toca y a las siguientes.</div></div>`);
    $$('[data-a]', r).forEach(b => b.onclick = () => {
      const a = b.dataset.a; let kg = +s.kg, rp = s.reps;
      if (a === 'k-') kg = Math.max(0, kg - (e.inc || 1)); if (a === 'k+') kg = kg + (e.inc || 1);
      if (a === 'r-') rp = Math.max(0, rp - (it.seg ? 5 : 1)); if (a === 'r+') rp = rp + (it.seg ? 5 : 1);
      x.sets.forEach(q => { if (!q.ok || q === s) { q.kg = kg; q.reps = rp; } }); save(); redraw();
    });
    bd.append(r);
  }
  if (hechas === x.sets.length) {
    bd.append(el('<div class="sec">¿Cómo ha ido?</div>'));
    const f = el(`<div class="feel"><button data-f="facil" class="${x.feel === 'facil' ? 'on' : ''}">😌 Fácil</button><button data-f="bien" class="${x.feel === 'bien' ? 'on' : ''}">👍 Bien</button><button data-f="duro" class="${x.feel === 'duro' ? 'on' : ''}">🥵 Duro</button></div>`);
    $$('button', f).forEach(b => b.onclick = () => { x.feel = b.dataset.f; save(); redraw(); });
    bd.append(f);
  }
  const lnk = el('<div class="row" style="gap:8px;margin-top:6px"><button class="sm ghost">Cómo se hace</button><button class="sm ghost">Máquina ocupada: cambiar</button></div>');
  $$('button', lnk)[0].onclick = () => ficha(x.id); $$('button', lnk)[1].onclick = () => cambiar(it, x, redraw);
  bd.append(lnk);
}
function cambiar(it, x, redraw) {
  const e = LIB[it.id]; const alts = Object.keys(LIB).filter(k => k !== x.id && k !== it.id && LIB[k].p && LIB[k].p === e.p && LIB[k].lum !== false);
  if (it.id !== x.id) alts.unshift(it.id);
  const o = hoja(`<h2 style="font-size:26px">Cambiar por…</h2><div class="small mut" style="margin-bottom:10px">Si la máquina está ocupada o no te va bien</div><div id="alts"></div>`);
  if (!alts.length) $('#alts', o).innerHTML = '<div class="mut">No hay otro equivalente en la lista.</div>';
  alts.forEach(k => {
    const b = el(`<button class="card btn"><div class="exrow"><img src="${im(k)}" alt=""><div class="grow"><b>${LIB[k].n}</b><div class="small mut">${LIB[k].mus || LIB[k].m}</div></div></div></button>`);
    b.onclick = () => { const sg = sugerencia(Object.assign({}, it, { id: k })); x.id = k; x.feel = null; x.sets.forEach(s => { s.kg = sg.kg; s.reps = sg.reps; s.ok = false; }); save(); o.remove(); redraw(); };
    $('#alts', o).append(b);
  });
}
function empezarDescanso(seg, ultimo) {
  pararDescanso();
  let fin = Date.now() + seg * 1000;
  const b = el(`<div class="rest"><div class="grow"><div class="small mut">${ultimo ? 'Descansa y pasa al siguiente' : 'Descanso'}</div><b>0:00</b></div><button class="sm ghost" data-a="mas">+15 s</button><button class="sm" data-a="fin">Listo</button></div>`);
  document.body.append(b);
  const tick = () => { const r = Math.max(0, Math.round((fin - Date.now()) / 1000)); $('b', b).textContent = `${Math.floor(r / 60)}:${pad(r % 60)}`; if (r <= 0) { pitido(); pararDescanso(); } };
  $('[data-a=mas]', b).onclick = () => { fin += 15000; tick(); };
  $('[data-a=fin]', b).onclick = () => pararDescanso();
  restT = { b, i: setInterval(tick, 500) }; tick();
}
function pararDescanso() { if (restT) { clearInterval(restT.i); restT.b.remove(); restT = null; } }
function reloj(seg, onFin) {
  let rest = seg, t = null;
  const c = el(`<div class="card" style="text-align:center;margin-top:10px"><div class="bebas" style="font-size:64px;color:var(--accent);line-height:1">0:00</div><div class="row" style="justify-content:center;gap:8px;margin-top:8px"><button class="sm">Empezar</button><button class="sm ghost">Reiniciar</button></div></div>`);
  const pinta = () => { $('.bebas', c).textContent = `${Math.floor(rest / 60)}:${pad(rest % 60)}`; };
  const [bS, bR] = $$('button', c);
  bS.onclick = () => {
    if (t) { clearInterval(t); t = null; bS.textContent = 'Seguir'; return; }
    bS.textContent = 'Pausa';
    t = setInterval(() => { if (!document.body.contains(c)) { clearInterval(t); return; } rest--; pinta(); if (rest <= 0) { clearInterval(t); t = null; pitido(); bS.textContent = 'Hecho ✓'; onFin && onFin(); } }, 1000);
  };
  bR.onclick = () => { if (t) clearInterval(t); t = null; rest = seg; bS.textContent = 'Empezar'; pinta(); };
  pinta(); return c;
}
function terminar(ov) {
  const D = DB.draft, S = SESIONES[D.ses];
  const hechos = D.ex.filter(x => x.sets.some(s => s.ok));
  if (!hechos.length && !confirm('No has marcado ninguna serie. ¿Terminar igualmente?')) return;
  const msgs = []; let vol = 0;
  D.ex.forEach((x, i) => { const m = progresar(S.items[i], x); if (m) msgs.push([x.id, m]); x.sets.filter(s => s.ok).forEach(s => vol += (+s.kg || 0) * (+s.reps || 0) * (S.items[i].uni ? 2 : 1)); });
  const min = Math.round((Date.now() - D.t0) / 60000);
  DB.logs = DB.logs.filter(l => !(l.f === D.k && l.ses === D.ses));
  DB.logs.push({ f: D.k, ses: D.ses, min, vol: Math.round(vol), msgs, ex: D.ex.map(x => ({ id: x.id, feel: x.feel, sets: x.sets.filter(s => s.ok).map(s => ({ kg: +s.kg, reps: +s.reps })) })) });
  DB.hecho[D.k] = { gym: true, cardio: D.cardio, est: D.est };
  DB.draft = null; save(); pararDescanso(); despierto(false);
  ov.o.remove(); verResumenDia(D.k, true);
}
function verResumenDia(k, recien) {
  const l = DB.logs.filter(x => x.f === k).pop(); if (!l) return;
  const S = SESIONES[l.ses] || { n: l.ses }, h = DB.hecho[k] || {};
  const ov = overlay(recien ? '¡Sesión hecha!' : S.n, fmt(parse(k)), render);
  ov.bd.innerHTML = `<div class="hero" style="text-align:center"><div class="cnt" style="font-size:56px">${num(l.vol / 1000)} t</div><div class="lbl">kilos movidos · ${l.min} min</div>
    <div class="small mut" style="margin-top:8px">${h.cardio ? '✅' : '◻️'} Cinta · ${h.est ? '✅' : '◻️'} Estiramientos</div></div>
    <div class="sec">Para la próxima vez</div>${l.msgs.map(([id, m]) => `<div class="card"><div class="exrow"><img src="${im(id)}" alt=""><div class="grow"><b>${LIB[id] ? LIB[id].n : id}</b><div class="small" style="color:var(--accent)">${m}</div></div></div></div>`).join('')}`;
}

// ---------- ESTIRAMIENTOS GUIADOS ----------
function estirar(onDone) {
  const pasos = []; ESTIRAMIENTOS.forEach(id => { if (ST[id].lados) { pasos.push([id, 1]); pasos.push([id, 2]); } else pasos.push([id, 0]); });
  let i = 0, t = null, rest = 0, fase = 'listo';
  const ov = overlay('Estiramientos', 'Van solos: tú solo sigue la foto', () => { clearInterval(t); despierto(false); if (!onDone) render(); });
  despierto(true);
  const foot = el('<div class="foot"></div>'); ov.o.append(foot);
  const pinta = () => {
    const [id, lado] = pasos[i], s = ST[id];
    const prep = fase === 'prep';
    ov.bd.innerHTML = `<div class="small mut">${i + 1} de ${pasos.length}</div><div class="bar" style="margin:6px 0 12px"><i style="width:${(i + 1) / pasos.length * 100}%"></i></div>
      ${prep ? '<div class="pill" style="--c:var(--warn)">Prepárate</div>' : ''}
      <h2 style="font-size:34px">${s.n}${lado ? ` · lado ${lado}` : ''}</h2>
      <div class="pair"><div><img src="${im(id, 0)}" alt=""></div><div><img src="${im(id, 1)}" alt=""></div></div>
      <div class="card" style="margin-top:10px">${s.t}</div>
      <div style="text-align:center"><div class="bebas" style="font-size:84px;color:${prep ? 'var(--warn)' : 'var(--accent)'};line-height:1">${fase === 'listo' ? s.s : rest}</div><div class="small mut">${prep ? 'empieza en…' : 'segundos'}</div></div>`;
    foot.innerHTML = '';
    const g = el('<div style="display:grid;grid-template-columns:3fr 1fr;gap:8px"></div>');
    const go = el(`<button class="big">${fase === 'listo' ? '▶ EMPEZAR' : t ? '⏸ PAUSA' : '▶ SEGUIR'}</button>`);
    go.onclick = () => { if (fase === 'listo') { fase = 'prep'; rest = 5; arrancar(); } else if (t) { clearInterval(t); t = null; pinta(); } else arrancar(); };
    const sk = el('<button class="big ghost">Saltar</button>'); sk.onclick = () => siguiente(true);
    g.append(go, sk); foot.append(g);
  };
  const arrancar = () => { clearInterval(t); t = setInterval(tick, 1000); pinta(); };
  const tick = () => {
    rest--;
    if (rest > 0) { pinta(); return; }
    if (fase === 'prep') { fase = 'hold'; rest = ST[pasos[i][0]].s; pitido(); pinta(); return; }
    siguiente(false);
  };
  const siguiente = salto => {
    if (i < pasos.length - 1) { i++; if (!salto || t) { fase = 'prep'; rest = 5; if (!t) arrancar(); else pinta(); } else { fase = 'listo'; pinta(); } }
    else { clearInterval(t); pitido(); toast('¡Estiramientos hechos!'); ov.o.remove(); despierto(false); onDone ? onDone() : render(); }
  };
  pinta();
}

// ---------- SALIDAS ----------
function apuntarSalida(d, it) {
  const s = DB.salidas[key(d)] || {};
  const o = hoja(`<h2 style="font-size:28px">${TIPO[it.tipo][0]} ${TIPO[it.tipo][1]} · ${fmt(d)}</h2><div class="small mut" style="margin-bottom:12px">${esc(it.t)}</div>
    <div class="two"><div class="fld"><label>Kilómetros</label><input id="km" inputmode="decimal" value="${esc(s.km || '')}"></div><div class="fld"><label>Desnivel (m)</label><input id="des" inputmode="numeric" value="${esc(s.des || '')}"></div></div>
    <div class="two"><div class="fld"><label>Horas</label><input id="hh" inputmode="numeric" value="${s.h ? Math.floor(s.h) : ''}"></div><div class="fld"><label>Minutos</label><input id="mm" inputmode="numeric" value="${s.h ? Math.round((s.h % 1) * 60) : ''}"></div></div>
    <div class="fld"><label>Sensaciones</label><div class="chips" id="sen">${['Muy bien', 'Normal', 'Cansado'].map(x => `<button class="chip ${s.sen === x ? 'on' : ''}">${x}</button>`).join('')}</div></div>
    <div class="fld"><label>Gemelo izquierdo</label><div class="chips" id="gem">${['Bien', 'Algo cargado', 'Molesta'].map(x => `<button class="chip ${s.gem === x ? 'on' : ''}">${x}</button>`).join('')}</div></div>
    <div class="fld"><label>Notas (comida, terreno…)</label><input id="not" value="${esc(s.notas || '')}"></div>
    <button class="big" id="ok">Guardar</button>${DB.salidas[key(d)] ? '<button class="big ghost" id="del" style="margin-top:8px">Borrar</button>' : ''}`);
  ['sen', 'gem'].forEach(g => $$(`#${g} button`, o).forEach(b => b.onclick = () => { $$(`#${g} button`, o).forEach(x => x.classList.remove('on')); b.classList.add('on'); }));
  $('#ok', o).onclick = () => {
    const v = id => ($('#' + id, o).value || '').replace(',', '.');
    const h = (+v('hh') || 0) + (+v('mm') || 0) / 60;
    DB.salidas[key(d)] = { tipo: it.tipo, km: v('km'), des: v('des'), h: Math.round(h * 100) / 100, sen: ($('#sen .on', o) || {}).textContent || '', gem: ($('#gem .on', o) || {}).textContent || '', notas: $('#not', o).value };
    save(); o.remove(); toast('Salida guardada'); render();
  };
  const del = $('#del', o); if (del) del.onclick = () => { delete DB.salidas[key(d)]; save(); o.remove(); render(); };
}

// ---------- CHEQUEO SEMANAL ----------
function chequeoPendiente() { const t = today(); return semana(t) >= 2 && !DB.chequeo[wkey(t)]; }
function abrirChequeo() {
  const Q = [['energia', 'Energía esta semana', ['😃 Bien', '😐 Normal', '🥱 Cansado']], ['piernas', 'Piernas', ['Frescas', 'Normales', 'Cargadas']],
    ['lumbar', 'Lumbar', ['Bien', 'Algo', 'Molesta']], ['gemelo', 'Gemelo izquierdo', ['Bien', 'Algo', 'Molesta']]];
  const o = hoja(`<h2 style="font-size:28px">Chequeo de la semana</h2><div class="small mut" style="margin-bottom:12px">Con esto ajusto la semana</div>
    ${Q.map(([k, t, ops]) => `<div class="fld"><label>${t}</label><div class="chips" data-k="${k}">${ops.map((x, i) => `<button class="chip" data-v="${i + 1}">${x}</button>`).join('')}</div></div>`).join('')}
    <div class="fld"><label>Peso de hoy (kg, en ayunas)</label><input id="pk" inputmode="decimal" placeholder="${num(pesoActual())}"></div><button class="big" id="ok">Guardar</button>`);
  $$('.chips', o).forEach(g => $$('button', g).forEach(b => b.onclick = () => { $$('button', g).forEach(x => x.classList.remove('on')); b.classList.add('on'); }));
  $('#ok', o).onclick = () => {
    const r = {}; $$('.chips', o).forEach(g => { const b = $('.on', g); r[g.dataset.k] = b ? +b.dataset.v : 1; });
    const msgs = []; let lig = false;
    if (r.lumbar === 3) { lig = true; msgs.push('Lumbar molesta: semana suave. Baja peso en la sentadilla y, si duele, cámbiala por prensa o goblet.'); }
    if (r.gemelo === 3) { lig = true; msgs.push('Gemelo molesto: sáltate la elevación de gemelo y en la cinta anda, no trotes.'); }
    if (r.energia === 3 && r.piernas === 3) { lig = true; msgs.push('Cansado y con piernas cargadas: semana suave, 2 series por ejercicio.'); }
    else if (r.piernas === 3) msgs.push('Piernas cargadas: la salida del finde, al tiempo marcado pero muy suave.');
    if (r.lumbar === 2 || r.gemelo === 2) msgs.push('Algo de molestia: sigue el plan sin subir peso en lo que la cargue.');
    const pk = +($('#pk', o).value || '').replace(',', '.');
    if (pk > 30) {
      const ant = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1).filter(p => parse(p.f) <= addD(today(), -5)).pop();
      DB.pesos = DB.pesos.filter(p => p.f !== key(today())); DB.pesos.push({ f: key(today()), kg: pk });
      if (ant && pk > PERFIL.pesoObj) {
        const baja = (ant.kg - pk) / Math.max(1, dias(parse(ant.f), today()) / 7);
        if (baja < 0.2 && (DB.ajuste || 0) > -400) { DB.ajuste = (DB.ajuste || 0) - 100; msgs.push(`Bajas ${num(baja)} kg/semana: quito 100 kcal al día.`); }
        else if (baja > 0.9) { DB.ajuste = (DB.ajuste || 0) + 150; msgs.push(`Bajas ${num(baja)} kg/semana, demasiado rápido: sumo 150 kcal para no perder fuerza.`); }
        else msgs.push(`Bajas ${num(baja)} kg/semana: vas bien.`);
      }
    }
    if (!msgs.length) msgs.push('Todo en orden: sigue el plan tal cual.');
    DB.chequeo[wkey(today())] = { r, suave: lig, msgs }; save(); o.remove();
    const h = hoja(`<h2 style="font-size:28px">Esta semana</h2>${msgs.map(x => `<div class="card note">${x}</div>`).join('')}<div class="small mut" style="margin:8px 0">Si quieres que Claude revise la semana y ajuste el plan, copia tus datos y pégaselos en el chat.</div><button class="big ghost" id="cp" style="margin-bottom:8px">📤 Copiar mis datos para Claude</button><button class="big" id="okk">Entendido</button>`);
    $('#okk', h).onclick = () => h.remove(); $('#cp', h).onclick = exportar;
    render();
  };
}

// ---------- CAMINO A MONEGROS ----------
function vCamino(m) {
  const t = today(), wNow = semana(t), N = 25;
  const sal = Object.values(DB.salidas), kmTot = sal.reduce((a, s) => a + (+s.km || 0), 0), hTot = sal.reduce((a, s) => a + (+s.h || 0), 0);
  m.append(atras()); m.append(el(`<div class="top"><h1>Camino a Monegros</h1><span class="mut small">24 abr 2027</span></div>`));
  m.append(el(`<div class="stats"><div><b>${Math.max(0, Math.min(N, wNow))}</b><span>de 25 semanas</span></div><div><b>${Object.values(DB.hecho).filter(h => h.gym).length}</b><span>gimnasio</span></div><div><b>${num(kmTot, 0)}</b><span>km en bici</span></div><div><b>${num(hTot, 0)}</b><span>horas fuera</span></div></div>`));
  const W = 360, step = 92, H = N * step + 150, pts = [];
  for (let w = 1; w <= N; w++) pts.push([W / 2 + Math.sin(w * 0.85) * 105, H - 60 - (w - 1) * step]);
  let d = `M${pts[0][0]},${pts[0][1] + 60} L${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], my = (y0 + y1) / 2; d += ` C${x0},${my} ${x1},${my} ${x1},${y1}`; }
  d += ` L${pts[N - 1][0]},40`;
  let mont = '';
  for (let i = 0; i < 16; i++) { const y = 120 + i * (H - 200) / 16, x = i % 2 ? 22 : W - 22, s = 26 + (i * 7) % 18; mont += `<path d="M${x - s},${y + s} L${x},${y - s * .4} L${x + s},${y + s}Z" fill="#1a2714"/>`; }
  let nodes = '', fasesL = '';
  FASES.filter(f => f.de <= N).forEach(f => { const [x, y] = pts[f.de - 1]; const left = x > W / 2; fasesL += `<text x="${left ? x - 34 : x + 34}" y="${y + 6}" text-anchor="${left ? 'end' : 'start'}" fill="${f.c}" font-family="Bebas Neue" font-size="20" letter-spacing="1">${f.n.toUpperCase()}</text>`; });
  pts.forEach(([x, y], i) => {
    const w = i + 1, lun = addD(START, (w - 1) * 7), st = statsSemana(lun), f = fase(w), cur = w === wNow, past = w < wNow;
    const fill = st.frac >= 1 ? f.c : past || cur ? '#162013' : '#0E1209', r = cur ? 23 : 17;
    const arc = st.frac > 0 && st.frac < 1 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${f.c}" stroke-width="4" stroke-dasharray="${(2 * Math.PI * r * st.frac).toFixed(1)} 999" transform="rotate(-90 ${x} ${y})"/>` : '';
    nodes += `<g class="wk" data-w="${w}">${cur ? `<circle cx="${x}" cy="${y}" r="${r + 8}" fill="none" stroke="${f.c}" stroke-width="2" class="pulse"/>` : ''}
      <circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${past || cur || st.frac ? f.c : '#26361D'}" stroke-width="2"/>${arc}
      <text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Bebas Neue" font-size="${cur ? 22 : 18}" fill="${st.frac >= 1 ? '#0E1209' : '#F2F5EC'}">${w}</text>
      ${descarga(w) ? `<text x="${x + r + 2}" y="${y - r + 8}" font-size="14">😴</text>` : ''}
      ${cur ? `<text x="${x}" y="${y - r - 12}" text-anchor="middle" font-size="26">🚵</text>` : ''}</g>`;
  });
  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${mont}
    <path d="${d}" fill="none" stroke="#26361D" stroke-width="30" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#3b5229" stroke-width="2" stroke-dasharray="10 12"/>
    <text x="${pts[N - 1][0]}" y="34" text-anchor="middle" font-size="34">🏁</text><text x="${pts[N - 1][0] + 26}" y="30" font-family="Bebas Neue" font-size="22" fill="#C8A84A">MONEGROS</text>
    <text x="${pts[0][0]}" y="${H - 8}" text-anchor="middle" font-family="Bebas Neue" font-size="16" fill="#8A9C7C">SALIDA · 2 NOV</text>
    ${fasesL}${nodes}</svg>`;
  const road = el(`<div class="road">${svg}</div>`); m.append(road);
  $$('.wk', road).forEach(g => g.onclick = () => verSemana(+g.dataset.w));
  const cur = $(`.wk[data-w="${Math.max(1, Math.min(N, wNow))}"]`, road);
  setTimeout(() => cur && cur.scrollIntoView({ block: 'center' }), 60);
}
function verSemana(w) {
  const lun = addD(START, (w - 1) * 7), f = fase(w), st = statsSemana(lun);
  let h = `<span class="pill" style="--c:${f.c}">${f.n}${descarga(w) ? ' · descarga' : ''}</span><h2 style="font-size:32px;margin-top:6px">Semana ${w}</h2><div class="small mut">${fmt(lun)} – ${fmt(addD(lun, 6))} · ${st.h} de ${st.p} hechos</div><div class="small" style="margin:8px 0 12px">${f.t}</div>`;
  for (let i = 0; i < 7; i++) {
    const d = addD(lun, i);
    itemsDia(d).forEach(it => {
      const ok = hechoItem(d, it);
      const tx = it.k === 'gym' ? `🏋️ ${SESIONES[it.ses].n}` : it.k === 'out' ? `${TIPO[it.tipo][0]} ${TIPO[it.tipo][1]} ${horas(it.h)} · <span class="mut">${esc(it.t)}</span>` : `🏁 ${it.t}`;
      h += `<div class="card ${ok ? 'ok' : ''}" style="padding:10px 12px"><div class="row"><b style="width:28px">${DC[i]}</b><div class="grow small">${tx}</div>${ok ? '✅' : ''}</div></div>`;
    });
  }
  hoja(h);
}

// ---------- PROGRESO ----------
let proSel = null;
function grafica(pts, obj, u) {
  if (pts.length < 1) return '<div class="card mut small">Aún no hay datos.</div>';
  const W = 340, H = 170, P = 30; const ys = pts.map(p => p.y).concat(obj != null ? [obj] : []);
  let lo = Math.min(...ys), hi = Math.max(...ys); if (hi - lo < 1) { hi += 1; lo -= 1; }
  const X = i => P + (pts.length === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (pts.length - 1)), Y = v => H - P + 8 - (v - lo) / (hi - lo) * (H - 2 * P);
  const line = pts.map((p, i) => `${X(i)},${Y(p.y)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${obj != null ? `<line x1="${P}" x2="${W - 10}" y1="${Y(obj)}" y2="${Y(obj)}" stroke="#C8A84A" stroke-dasharray="5 5"/><text x="${W - 12}" y="${Y(obj) - 5}" text-anchor="end" fill="#C8A84A" font-size="11">objetivo ${num(obj)}</text>` : ''}
    <polyline points="${line}" fill="none" stroke="#8CBF5A" stroke-width="3"/>${pts.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.y)}" r="4" fill="#8CBF5A"/>`).join('')}
    <text x="4" y="${Y(hi) + 4}" fill="#8A9C7C" font-size="11">${num(hi)}</text><text x="4" y="${Y(lo) + 4}" fill="#8A9C7C" font-size="11">${num(lo)}</text>
    <text x="${P}" y="${H - 4}" fill="#8A9C7C" font-size="11">${pts[0].x}</text><text x="${W - 10}" y="${H - 4}" text-anchor="end" fill="#8A9C7C" font-size="11">${pts[pts.length - 1].x}${u ? ' · ' + u : ''}</text></svg>`;
}
function vProgreso(m) {
  m.append(atras()); m.append(el('<div class="top"><h1>Progreso</h1></div>'));
  if (chequeoPendiente()) { const c = el(`<button class="card btn warn"><div class="row"><div class="ic">📝</div><div class="grow"><b>Chequeo de la semana</b><div class="small mut">1 minuto: cómo vas, lumbar, gemelo y peso</div></div><span class="sm">Hacer</span></div></button>`); c.onclick = abrirChequeo; m.append(c); }
  const ps = DB.pesos.slice().sort((a, b) => a.f < b.f ? -1 : 1);
  m.append(el('<div class="sec">Peso corporal</div>'));
  const pc = el(`<div class="card"><div class="row"><div class="grow"><div class="bebas" style="font-size:40px;line-height:1">${num(pesoActual())} kg</div><div class="small mut">objetivo ${num(PERFIL.pesoObj)} kg · faltan ${num(Math.max(0, pesoActual() - PERFIL.pesoObj))} kg</div></div>
    <input id="np" inputmode="decimal" placeholder="kg" style="width:76px;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px;font-size:16px"><button class="sm">Apuntar</button></div></div>`);
  $('button', pc).onclick = () => { const v = +($('#np', pc).value || '').replace(',', '.'); if (v > 30) { DB.pesos = DB.pesos.filter(p => p.f !== key(today())); DB.pesos.push({ f: key(today()), kg: v }); save(); toast('Peso apuntado'); render(); } };
  m.append(pc);
  m.append(el(grafica(ps.map(p => ({ x: fmt(parse(p.f)), y: +p.kg })), PERFIL.pesoObj, 'kg')));
  m.append(el('<div class="sec">Fuerza por ejercicio</div>'));
  const ids = [...new Set(DB.logs.flatMap(l => l.ex.filter(x => x.sets.length).map(x => x.id)))].filter(id => LIB[id] && LIB[id].inc);
  if (!ids.length) m.append(el('<div class="card mut small">Cuando hagas tu primera sesión, aquí verás cómo suben tus pesos.</div>'));
  else {
    if (!ids.includes(proSel)) proSel = ids[0];
    const ch = el('<div class="chips"></div>'); ids.forEach(id => { const b = el(`<button class="chip ${id === proSel ? 'on' : ''}">${LIB[id].n}</button>`); b.onclick = () => { proSel = id; render(); }; ch.append(b); }); m.append(ch);
    const pts = DB.logs.slice().sort((a, b) => a.f < b.f ? -1 : 1).map(l => { const x = l.ex.find(e => e.id === proSel); return x && x.sets.length ? { x: fmt(parse(l.f)), y: Math.max(...x.sets.map(s => s.kg)) } : null; }).filter(Boolean);
    m.append(el(grafica(pts, null, 'kg')));
  }
  m.append(el('<div class="sec">Constancia</div>'));
  const tot = Object.values(DB.hecho).filter(h => h.gym).length, sal = Object.values(DB.salidas);
  m.append(el(`<div class="stats"><div><b>${tot}</b><span>sesiones gym</span></div><div><b>${sal.length}</b><span>salidas</span></div><div><b>${num(sal.reduce((a, s) => a + (+s.km || 0), 0), 0)}</b><span>km</span></div><div><b>${num(sal.reduce((a, s) => a + (+s.des || 0), 0), 0)}</b><span>m desnivel</span></div></div>`));
  DB.logs.slice().sort((a, b) => a.f < b.f ? 1 : -1).slice(0, 5).forEach(l => { const c = el(`<button class="card btn"><div class="row"><div class="grow"><b>${SESIONES[l.ses] ? SESIONES[l.ses].n : l.ses}</b><div class="small mut">${fmt(parse(l.f))} · ${l.min} min · ${num(l.vol / 1000)} t</div></div><span class="mut">›</span></div></button>`); c.onclick = () => verResumenDia(l.f); m.append(c); });
  m.append(el('<div class="sec">Revisión y copia de seguridad</div>'));
  const b1 = el('<button class="big ghost" style="margin-bottom:8px">📝 Hacer la revisión de la semana</button>'); b1.onclick = abrirChequeo; m.append(b1);
  const b2 = el('<button class="big ghost" style="margin-bottom:8px">📤 Copiar mis datos (para pasárselos a Claude)</button>'); b2.onclick = exportar; m.append(b2);
  const b3 = el('<button class="big ghost">📥 Cargar una copia</button>'); b3.onclick = importar; m.append(b3);
}
function exportar() {
  const txt = JSON.stringify(DB);
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = `monegros-copia-${key(today())}.json`; a.click(); } catch (e) { }
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Copiado y descargado')).catch(() => {
    hoja(`<h2 style="font-size:26px">Tus datos</h2><div class="small mut">Selecciona todo y copia</div><textarea style="width:100%;height:240px;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:8px">${esc(txt)}</textarea>`);
  });
}
function importar() {
  const o = hoja(`<h2 style="font-size:26px">Cargar una copia</h2><div class="small mut" style="margin-bottom:8px">Pega aquí el texto de la copia. Sustituye lo que hay ahora.</div><textarea id="tx" style="width:100%;height:200px;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:8px"></textarea><button class="big" id="ok" style="margin-top:10px">Cargar</button>`);
  $('#ok', o).onclick = () => { try { const d = JSON.parse($('#tx', o).value); if (!d || typeof d !== 'object' || !d.prog) throw 0; DB = Object.assign(DB, d); save(); o.remove(); toast('Copia cargada'); render(); } catch (e) { toast('Ese texto no es una copia válida'); } };
}

// ---------- arranque ----------
render();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(r => {
    const fotos = [...new Set([...Object.values(SESIONES).flatMap(S => S.items.map(i => i.id)), CARDIO.id, ...ESTIRAMIENTOS, ...CALENTAMIENTO.filter(c => c.id).map(c => c.id)])].flatMap(id => [im(id, 0), im(id, 1)]);
    navigator.serviceWorker.ready.then(reg => reg.active && reg.active.postMessage({ fotos }));
  }).catch(() => { });
}

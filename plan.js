// ===== PLAN: semanas, fases, sesiones de gimnasio y lista de la compra =====
// Para cambiar el plan se toca este archivo.

const INICIO = '2026-11-02';          // lunes de la semana 1
const MONEGROS = '2027-04-24';        // sábado de la semana 25
const PERFIL = { edad: 58, altura: 179, peso: 78.5, pesoObj: 72.5, ritmo: 0.5 };

const FASES = [
  { n: 'Vuelta', de: 1, a: 4, c: '#8CBF5A', t: 'Recuperar el hábito y aprender la técnica. Todo suave, sin ir al límite.' },
  { n: 'Base', de: 5, a: 13, c: '#5AACCE', t: 'Más horas de bici y fuerza en el gimnasio tres días por semana.' },
  { n: 'Construcción', de: 14, a: 21, c: '#D4784E', t: 'Tiradas largas con desnivel. Gimnasio lunes y miércoles; el viernes, bici con intervalos suaves.' },
  { n: 'Afinado', de: 22, a: 25, c: '#C8A84A', t: 'Bajar volumen para llegar fresco a Monegros.' },
  { n: 'Recuperación', de: 26, a: 27, c: '#8A9C7C', t: 'Descansar después de Monegros.' },
  { n: 'Después', de: 28, a: 99, c: '#A78BFA', t: 'Mantener la fuerza y elegir el siguiente objetivo (ultratrail).' },
];

// s = series · r = repeticiones [mín, máx] · seg = segundos · d = descanso (s)
// fijo = peso ligero que no sube · uni = se hace por cada lado
const SESIONES = {
  A: { n: 'Pierna y empuje', foco: 'Prensa, femoral, pecho y espalda', items: [
    { id: 'Leg_Press', s: 3, r: [10, 12], d: 90 },
    { id: 'Seated_Leg_Curl', s: 3, r: [10, 12], d: 75 },
    { id: 'Leverage_Chest_Press', s: 3, r: [10, 12], d: 90 },
    { id: 'Wide-Grip_Lat_Pulldown', s: 3, r: [10, 12], d: 90 },
    { id: 'Seated_Calf_Raise', s: 2, r: [15, 15], d: 60, fijo: true },
    { id: 'Plank', s: 3, seg: [20, 40], d: 45 },
  ], cardio: { id: 'Bicycling_Stationary', min: 12, t: 'Zona 2: suave, puedes hablar.' } },
  B: { n: 'Glúteo y tirón', foco: 'Sentadilla, puente, remo y hombro', items: [
    { id: 'Goblet_Squat', s: 3, r: [8, 12], d: 90 },
    { id: 'Butt_Lift_Bridge', s: 3, r: [12, 15], d: 60 },
    { id: 'Seated_Cable_Rows', s: 3, r: [10, 12], d: 90 },
    { id: 'Seated_Dumbbell_Press', s: 3, r: [8, 12], d: 90 },
    { id: 'Pallof_Press', s: 2, r: [10, 10], d: 45, uni: true },
  ], cardio: { id: 'Elliptical_Trainer', min: 12, t: 'Suave, talón apoyado en el pedal.' } },
  C: { n: 'Pierna a una y espalda', foco: 'Cajón, cuádriceps, pecho y remo', items: [
    { id: 'Dumbbell_Step_Ups', s: 3, r: [8, 10], d: 75, uni: true },
    { id: 'Leg_Extensions', s: 3, r: [12, 15], d: 60 },
    { id: 'Incline_Dumbbell_Press', s: 3, r: [8, 12], d: 90 },
    { id: 'One-Arm_Dumbbell_Row', s: 3, r: [10, 12], d: 60, uni: true },
    { id: 'Seated_Calf_Raise', s: 2, r: [15, 15], d: 60, fijo: true },
    { id: 'Side_Bridge', s: 2, seg: [20, 30], d: 45, uni: true },
  ], cardio: { id: 'Bicycling_Stationary', min: 12, t: 'Zona 2: suave, puedes hablar.' } },
  D: { n: 'Pierna a una y tirón', foco: 'Cajón, puente, remo y hombro', items: [
    { id: 'Dumbbell_Step_Ups', s: 3, r: [8, 10], d: 75, uni: true },
    { id: 'Butt_Lift_Bridge', s: 3, r: [12, 15], d: 60 },
    { id: 'Seated_Cable_Rows', s: 3, r: [10, 12], d: 90 },
    { id: 'Seated_Dumbbell_Press', s: 3, r: [8, 12], d: 90 },
    { id: 'Seated_Calf_Raise', s: 2, r: [15, 15], d: 60, fijo: true },
    { id: 'Pallof_Press', s: 2, r: [10, 10], d: 45, uni: true },
  ], cardio: { id: 'Elliptical_Trainer', min: 10, t: 'Suave, para soltar las piernas.' } },
  ACT: { n: 'Activación pre-Monegros', foco: 'Solo bici suave', items: [],
    cardio: { id: 'Bicycling_Stationary', min: 30, t: '25 min muy suave con 3 cambios de 1 min alegre. Nada más: el sábado es el día.' } },
  INT: { n: 'Bici con intervalos', foco: 'Intervalos suaves', items: [],
    cardio: { id: 'Bicycling_Stationary', min: 28, interval: true } },
};

const TIPO = { btt: ['🚵', 'BTT'], trail: ['🏃', 'Trail'], walk: ['🥾', 'Caminata'], race: ['🏁', 'Monegros'] };

function intervalosTexto(w) {
  const tr = w <= 17 ? '4×(2 min fuerte / 2 min suave)' : w <= 21 ? '4×(3 min fuerte / 2 min suave)' : '3×(3 min fuerte / 2 min suave)';
  return `8 min suave + ${tr} + 5 min suave. "Fuerte" = te cuesta hablar, pero aguantas el ritmo.`;
}

// Lista de la compra (categorías y colores como en la app de la HU108)
const COMPRA = [
  { k: 'prot', n: 'Proteínas', e: '🥩', items: [
    ['Pechuga de pollo', '600 g'], ['Pavo en lonchas', '300 g'], ['Huevos', '1 docena'], ['Atún al natural', '4 latas'],
    ['Yogur griego natural', '6 unidades'], ['Jamón', '150 g'], ['Queso en lonchas', '1 paquete'],
    ['Merluza', '400 g'], ['Salmón', '300 g'], ['Bacalao desalado', '360 g'] ] },
  { k: 'veg', n: 'Verduras y fruta', e: '🥬', items: [
    ['Lechuga y ensalada', '2 bolsas'], ['Tomate', '1 kg'], ['Calabacín', '3 unidades'], ['Pimiento', '3 unidades'],
    ['Cebolla', '1 malla'], ['Puerro', '3 unidades'], ['Zanahoria', '500 g'], ['Espinacas', '1 bolsa'],
    ['Ajo', '1 cabeza'], ['Plátanos', '1 racimo'], ['Fruta de temporada', '6 piezas'] ] },
  { k: 'carb', n: 'Carbohidratos', e: '🍚', items: [
    ['Pan', '1 barra grande'], ['Arroz', '500 g'], ['Pasta', '500 g'], ['Lentejas', '500 g'],
    ['Garbanzos cocidos', '1 bote'], ['Patatas', '1 kg'], ['Corn flakes', '1 caja'], ['Dátiles', '1 bolsa'] ] },
  { k: 'extra', n: 'Otros', e: '🧂', items: [
    ['Leche', '2 l'], ['Aceite de oliva', '1 botella'], ['Nueces', '1 bolsa'], ['Chorizo', '1 trozo'],
    ['Salsa vizcaína', '1 bote'], ['Tomate triturado', '1 bote'], ['Pimentón y comino', 'revisar'], ['Quesitos', '1 caja'] ] },
];

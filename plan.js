// ===== PLAN: rutinas de lunes, miércoles y viernes, semanas hasta Monegros =====
// Para cambiar el plan se toca este archivo.

const INICIO = '2026-11-02';          // lunes de la semana 1
const MONEGROS = '2027-04-24';        // sábado de la semana 25
const PERFIL = { edad: 58, altura: 179, peso: 78.5, pesoObj: 72.5, ritmo: 0.5 };

// ---------- ejercicios nuevos o ajustados (fotos libres de free-exercise-db) ----------
Object.assign(LIB, {
  Smith_Machine_Squat: Object.assign({}, LIB.Smith_Machine_Squat, { m: 'Pierna', mus: 'Cuádriceps · glúteo', ini: 20, inc: 5,
    gem: 'Espalda recta y abdomen apretado todo el rato. Si la lumbar avisa, baja el peso o cambia a sentadilla goblet.' }),
  Barbell_Hip_Thrust: Object.assign({}, LIB.Barbell_Hip_Thrust, { mus: 'Glúteo · femoral', ini: 20, inc: 5 }),
  Lying_Leg_Curls: Object.assign({}, LIB.Lying_Leg_Curls, { mus: 'Femoral', ini: 15, inc: 5 }),
  Thigh_Abductor: Object.assign({}, LIB.Thigh_Abductor, { n: 'Abductores en máquina', mus: 'Glúteo medio', ini: 25, inc: 5 }),
  Thigh_Adductor: { p: 'aductor', m: 'Pierna', mus: 'Aductores (cara interna del muslo)', eq: 'maq', lum: true, ini: 25, inc: 5, n: 'Aductores en máquina',
    pasos: ['Siéntate con la espalda bien apoyada y las rodillas por dentro de las almohadillas.', 'Cierra las piernas despacio apretando la cara interna del muslo.', 'Aguanta 1 s con las almohadillas juntas.', 'Abre despacio en 2-3 s sin dejar que el peso caiga de golpe.'],
    err: ['Abrir de golpe al volver.', 'Despegar la espalda del respaldo.'] },
  Split_Squat_with_Dumbbells: { p: 'unilateral', m: 'Pierna', mus: 'Cuádriceps · glúteo', eq: 'manc', lum: true, ini: 4, inc: 2, n: 'Sentadilla búlgara',
    pasos: ['De espaldas a un banco, apoya el empeine de un pie encima. El otro pie, un paso largo por delante.', 'Una mancuerna en cada mano, brazos colgando.', 'Baja recto hasta que la rodilla de atrás casi toque el suelo.', 'Sube empujando con el talón de la pierna de delante. Haz todas las repes y cambia.'],
    err: ['Pie de delante demasiado cerca del banco.', 'Rodilla de delante hacia dentro.', 'Inclinar mucho el tronco.'],
    gem: 'Empieza sin peso hasta que tengas equilibrio. El talón de delante siempre apoyado.' },
  'One-Legged_Cable_Kickback': { p: 'gluteo', m: 'Glúteo', mus: 'Glúteo mayor', eq: 'polea', lum: true, ini: 5, inc: 2.5, n: 'Patada en polea a 45°',
    pasos: ['Pon la tobillera en la polea baja y engánchala a un tobillo.', 'De cara a la máquina, agárrate a ella e inclina un poco el tronco.', 'Lleva la pierna hacia atrás y un poco hacia fuera (45°) apretando el glúteo.', 'Vuelve despacio. Haz todas las repes y cambia de pierna.'],
    err: ['Arquear la lumbar al subir la pierna.', 'Balancear la pierna con impulso.'] },
  Plie_Dumbbell_Squat: { p: 'rodilla', m: 'Pierna', mus: 'Aductores · glúteo · cuádriceps', eq: 'manc', lum: true, ini: 10, inc: 2, n: 'Sentadilla sumo con mancuerna',
    pasos: ['Pies bastante más abiertos que los hombros, puntas hacia fuera.', 'Sujeta una mancuerna por un extremo con las dos manos, colgando entre las piernas.', 'Baja con el pecho alto y las rodillas abiertas, en la línea de los pies.', 'Sube apretando glúteos.'],
    err: ['Rodillas hacia dentro.', 'Redondear la espalda.'] },
  Butt_Lift_Bridge: Object.assign({}, LIB.Butt_Lift_Bridge, { n: 'Puente de cadera con mancuerna', mus: 'Glúteo · femoral', eq: 'manc', ini: 8, inc: 2,
    pasos: ['Boca arriba, rodillas dobladas, pies apoyados cerca del culo.', 'Apoya una mancuerna sobre la cadera y sujétala con las manos.', 'Empuja con los talones y sube la cadera hasta alinear rodillas, cadera y hombros.', 'Aprieta el glúteo 1-2 s arriba y baja despacio.'] }),
  'Wide-Grip_Lat_Pulldown': Object.assign({}, LIB['Wide-Grip_Lat_Pulldown'], { mus: 'Dorsal' }),
  Dumbbell_Incline_Row: { p: 'tiron_h', m: 'Espalda', mus: 'Espalda media · dorsal', eq: 'manc', lum: true, ini: 8, inc: 2, n: 'Remo en banco inclinado',
    pasos: ['Banco inclinado a unos 30-45°. Túmbate boca abajo con el pecho apoyado.', 'Una mancuerna en cada mano, brazos colgando.', 'Tira llevando los codos hacia atrás y juntando los omóplatos.', 'Baja despacio hasta estirar los brazos.'],
    err: ['Despegar el pecho del banco.', 'Encoger los hombros hacia las orejas.'],
    gem: 'Con el pecho apoyado la lumbar no trabaja: es el remo más seguro para tu espalda.' },
  'Straight-Arm_Pulldown': Object.assign({}, LIB['Straight-Arm_Pulldown'], { n: 'Jalón con brazo recto', mus: 'Dorsal' }),
  Leverage_Chest_Press: Object.assign({}, LIB.Leverage_Chest_Press, { mus: 'Pecho · tríceps' }),
  Leverage_Shoulder_Press: Object.assign({}, LIB.Leverage_Shoulder_Press, { mus: 'Hombro · tríceps' }),
  Seated_Calf_Raise: Object.assign({}, LIB.Seated_Calf_Raise, { n: 'Elevación de gemelo sentado', mus: 'Gemelo' }),
  Seated_Leg_Curl: Object.assign({}, LIB.Seated_Leg_Curl, { mus: 'Femoral' }),
  Plank: Object.assign({}, LIB.Plank, { n: 'Plancha frontal', mus: 'Abdomen' }),
  Side_Bridge: Object.assign({}, LIB.Side_Bridge, { mus: 'Oblicuos' }),
  Crunches: { p: 'core', m: 'Core', mus: 'Abdomen', eq: 'peso', lum: true, ini: 0, inc: 0, n: 'Crunch',
    pasos: ['Boca arriba, rodillas dobladas y pies apoyados.', 'Manos a los lados de la cabeza, sin tirar del cuello.', 'Sube solo los hombros del suelo apretando el abdomen.', 'Baja despacio sin apoyar del todo la cabeza.'],
    err: ['Tirar de la cabeza con las manos.', 'Subir con impulso.'] },
  Running_Treadmill: { m: 'Cardio', eq: 'maq', lum: true, n: 'Cinta de correr',
    pasos: ['Empieza 1-2 min andando para coger el ritmo.', 'Opción A: andar rápido en cuesta (inclinación 6-10 %, 5-5,5 km/h).', 'Opción B: trote suave (7-8 km/h) si el gemelo va bien.', 'Ritmo de zona 2: respiras fuerte pero puedes hablar.'],
    err: ['Agarrarse a las barras en cuesta.', 'Ir tan rápido que no puedas hablar.'],
    gem: 'Si el gemelo izquierdo está cargado, mejor andar en cuesta que trotar.' },
  Walking_Treadmill: { m: 'Cardio', eq: 'maq', lum: true, n: 'Cinta andando' },
});

// ---------- estiramientos de la lámina (20-30 s cada uno) ----------
Object.assign(ST, {
  Side_Neck_Stretch: { n: 'Cuello', s: 25, lados: true, t: 'Hombros relajados. Inclina la cabeza hacia un hombro y ayúdate suave con la mano.' },
  Shoulder_Stretch: { n: 'Hombro', s: 25, lados: true, t: 'Cruza un brazo estirado por delante del pecho y acércalo con el otro brazo.' },
  Triceps_Stretch: { n: 'Tríceps', s: 25, lados: true, t: 'Lleva una mano detrás de la cabeza, agarra el codo con la otra y tira suave.' },
  Standing_Lateral_Stretch: { n: 'Lateral (costado)', s: 25, lados: true, t: 'Piernas algo abiertas. Una mano en la cadera, el otro brazo por encima de la cabeza, inclínate hacia el lado.' },
  Childs_Pose: { n: 'Espalda (postura del niño)', s: 30, t: 'De rodillas, siéntate sobre los talones y lleva los brazos estirados al frente. Deja que la espalda se estire.' },
});
ST.Chest_And_Front_Of_Shoulder_Stretch.n = 'Pecho';
ST.Cat_Stretch.n = 'Gato-vaca'; ST.Cat_Stretch.s = 30;
ST.Seated_Floor_Hamstring_Stretch.n = 'Isquiotibiales'; ST.Seated_Floor_Hamstring_Stretch.s = 30;
ST.Kneeling_Hip_Flexor.n = 'Flexores de cadera'; ST.Kneeling_Hip_Flexor.s = 25;
ST.On_Your_Side_Quad_Stretch.n = 'Cuádriceps tumbado'; ST.On_Your_Side_Quad_Stretch.s = 25;
ST.Quad_Stretch.n = 'Cuádriceps de pie'; ST.Quad_Stretch.s = 25;
ST.Standing_Gastrocnemius_Calf_Stretch.n = 'Gemelos'; ST.Standing_Gastrocnemius_Calf_Stretch.s = 30;

const ESTIRAMIENTOS = ['Side_Neck_Stretch', 'Shoulder_Stretch', 'Chest_And_Front_Of_Shoulder_Stretch', 'Triceps_Stretch',
  'Standing_Lateral_Stretch', 'Cat_Stretch', 'Seated_Floor_Hamstring_Stretch', 'Kneeling_Hip_Flexor', 'Childs_Pose',
  'On_Your_Side_Quad_Stretch', 'Quad_Stretch', 'Standing_Gastrocnemius_Calf_Stretch'];

// ---------- calentamiento (8 min) ----------
const CALENTAMIENTO = [
  { id: 'Walking_Treadmill', n: 'Cinta andando', t: '5 min andando rápido, subiendo poco a poco a inclinación 3-5 %.' },
  { id: 'Cat_Stretch', st: true, n: 'Gato-vaca', t: '8 repeticiones lentas, respirando con el movimiento.' },
  { id: 'Worlds_Greatest_Stretch', st: true, n: 'El mejor estiramiento del mundo', t: '4 por lado, despacio.' },
  { id: 'Bodyweight_Squat', n: 'Sentadilla sin peso', t: '10 repeticiones suaves.' },
  { id: null, n: 'Serie de aproximación', t: 'Antes del primer ejercicio, una serie de 10 con la mitad del peso.' },
];

// ---------- rutinas ----------
// s = series · r = repeticiones [mín, máx] · seg = segundos · d = descanso (s)
// fijo = peso ligero que no sube · uni = por cada lado
const SESIONES = {
  L: { dia: 'Lunes', n: 'Pierna completa', c: '#8CBF5A', items: [
    { id: 'Smith_Machine_Squat', s: 3, r: [10, 12], d: 90 },
    { id: 'Barbell_Hip_Thrust', s: 3, r: [12, 15], d: 90 },
    { id: 'Lying_Leg_Curls', s: 3, r: [10, 12], d: 75 },
    { id: 'Thigh_Adductor', s: 3, r: [12, 15], d: 60 },
    { id: 'Thigh_Abductor', s: 3, r: [12, 15], d: 60 },
    { id: 'Seated_Calf_Raise', s: 2, r: [15, 15], d: 60, fijo: true },
  ] },
  X: { dia: 'Miércoles', n: 'Espalda, pecho y abdomen', c: '#5AACCE', items: [
    { id: 'Wide-Grip_Lat_Pulldown', s: 3, r: [8, 12], d: 90 },
    { id: 'Dumbbell_Incline_Row', s: 3, r: [8, 12], d: 75 },
    { id: 'Straight-Arm_Pulldown', s: 3, r: [12, 15], d: 60 },
    { id: 'Leverage_Chest_Press', s: 3, r: [10, 12], d: 75 },
    { id: 'Leverage_Shoulder_Press', s: 3, r: [10, 12], d: 75 },
    { id: 'Plank', s: 3, seg: [30, 45], d: 45 },
    { id: 'Crunches', s: 3, r: [15, 20], d: 45 },
  ] },
  V: { dia: 'Viernes', n: 'Glúteo y femoral', c: '#D4784E', items: [
    { id: 'Split_Squat_with_Dumbbells', s: 3, r: [8, 10], d: 90, uni: true },
    { id: 'Butt_Lift_Bridge', s: 3, r: [15, 20], d: 60 },
    { id: 'One-Legged_Cable_Kickback', s: 3, r: [12, 15], d: 45, uni: true },
    { id: 'Seated_Leg_Curl', s: 3, r: [10, 12], d: 75 },
    { id: 'Plie_Dumbbell_Squat', s: 3, r: [10, 12], d: 75 },
    { id: 'Plank', s: 3, seg: [30, 45], d: 45 },
    { id: 'Side_Bridge', s: 2, seg: [20, 30], d: 45, uni: true },
  ] },
};
const CARDIO = { id: 'Running_Treadmill', min: 12, t: 'Andar rápido en cuesta (6-10 %) o trote suave. Zona 2: puedes hablar.' };

const FASES = [
  { n: 'Vuelta', de: 1, a: 4, c: '#8CBF5A', t: 'Aprender la técnica y coger el hábito. Pesos cómodos, sin ir al límite.' },
  { n: 'Base', de: 5, a: 13, c: '#5AACCE', t: 'Subir pesos poco a poco y sumar horas de bici el fin de semana.' },
  { n: 'Construcción', de: 14, a: 21, c: '#D4784E', t: 'Tiradas largas con desnivel. En el gimnasio, mantener pesos sin buscar récords.' },
  { n: 'Afinado', de: 22, a: 25, c: '#C8A84A', t: 'Menos series para llegar fresco a Monegros.' },
  { n: 'Recuperación', de: 26, a: 27, c: '#8A9C7C', t: 'Descansar después de Monegros.' },
  { n: 'Después', de: 28, a: 99, c: '#A78BFA', t: 'Mantener la fuerza y elegir el siguiente objetivo.' },
];
const TIPO = { btt: ['🚵', 'BTT'], trail: ['🏃', 'Trail'], walk: ['🥾', 'Caminata'], race: ['🏁', 'Monegros'] };

// Lista de la compra (categorías y colores de la app de la HU108)
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

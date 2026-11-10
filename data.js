// ===== DATOS DE LA APP: ejercicios, plan de bici y trail, recetas =====
// Para cambiar cosas, se toca este archivo.


// p = patrón (para cambiar por otro equivalente) · m = músculo · eq = equipo (maq, polea, manc, peso, barra)
// lum = apto lumbar delicada · ini = peso de arranque orientativo · inc = salto de peso
const LIB = {
 "Leg_Press": {
  "p": "rodilla",
  "m": "Pierna",
  "eq": "maq",
  "lum": true,
  "ini": 40,
  "inc": 5,
  "n": "Prensa de piernas",
  "pasos": [
   "Siéntate con la espalda y la cadera bien pegadas al respaldo.",
   "Pies en el centro de la plataforma, a la anchura de las caderas, puntas un poco hacia fuera.",
   "Quita los seguros y baja despacio (2-3 s) doblando rodillas hasta unos 90°.",
   "Empuja con todo el pie (sobre todo talones) hasta casi estirar, sin bloquear las rodillas.",
   "Expulsa el aire al empujar."
  ],
  "err": [
   "Despegar la cadera del asiento al bajar.",
   "Bloquear las rodillas arriba.",
   "Que las rodillas se vayan hacia dentro."
  ],
  "gem": "Empuja con talones y planta, no con la punta de los pies: así el gemelo no trabaja de más."
 },
 "Goblet_Squat": {
  "p": "rodilla",
  "m": "Pierna",
  "eq": "manc",
  "lum": true,
  "ini": 10,
  "inc": 2,
  "una": true,
  "n": "Sentadilla goblet",
  "pasos": [
   "Sujeta una mancuerna o kettlebell pegada al pecho con las dos manos.",
   "Pies algo más abiertos que las caderas, puntas un poco hacia fuera.",
   "Baja como si te sentaras en una silla, pecho alto y rodillas en la línea de los pies.",
   "Baja hasta donde mantengas la espalda recta y sube empujando el suelo."
  ],
  "err": [
   "Levantar los talones.",
   "Redondear la espalda abajo.",
   "Rodillas hacia dentro."
  ],
  "gem": "Talones siempre apoyados. Si notas tirantez en el gemelo, pon un disco fino bajo los talones."
 },
 "Hack_Squat": {
  "p": "rodilla",
  "m": "Pierna",
  "eq": "maq",
  "lum": true,
  "ini": 20,
  "inc": 5,
  "n": "Sentadilla hack en máquina",
  "pasos": [
   "Espalda y hombros bien apoyados en el respaldo.",
   "Pies a la anchura de las caderas en el centro de la plataforma.",
   "Baja despacio hasta unos 90° de rodilla.",
   "Sube empujando con todo el pie, sin bloquear las rodillas."
  ],
  "err": [
   "Despegar la espalda del respaldo.",
   "Rodillas hacia dentro."
  ]
 },
 "Smith_Machine_Squat": {
  "p": "rodilla",
  "m": "Pierna",
  "eq": "maq",
  "lum": false,
  "ini": 20,
  "inc": 5,
  "n": "Sentadilla en multipower",
  "pasos": [
   "Barra apoyada en la parte alta de la espalda, no en el cuello.",
   "Pies un poco por delante de la barra.",
   "Baja controlado con el pecho alto.",
   "Sube empujando con talones."
  ],
  "err": [
   "Redondear la espalda abajo.",
   "Bajar de golpe."
  ]
 },
 "Bodyweight_Squat": {
  "p": "rodilla",
  "m": "Pierna",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "n": "Sentadilla sin peso",
  "pasos": [
   "Pies a la anchura de los hombros.",
   "Brazos al frente para equilibrar.",
   "Baja como para sentarte en una silla.",
   "Sube empujando el suelo."
  ],
  "err": [
   "Levantar los talones.",
   "Rodillas hacia dentro."
  ]
 },
 "Dumbbell_Step_Ups": {
  "p": "unilateral",
  "m": "Pierna",
  "eq": "manc",
  "lum": true,
  "ini": 6,
  "inc": 2,
  "uni": true,
  "n": "Subida al cajón con mancuernas",
  "pasos": [
   "Cajón o banco a la altura de la rodilla (o algo menos). Una mancuerna en cada mano.",
   "Pon un pie entero encima del cajón.",
   "Sube empujando con esa pierna, sin impulsarte con la de abajo.",
   "Baja despacio. Haz las repes con una pierna y cambia."
  ],
  "err": [
   "Impulsarse con el pie de abajo.",
   "Rodilla hacia dentro."
  ],
  "gem": "Apoya el pie entero (talón incluido) en el cajón."
 },
 "Dumbbell_Lunges": {
  "p": "unilateral",
  "m": "Pierna",
  "eq": "manc",
  "lum": true,
  "ini": 6,
  "inc": 2,
  "uni": true,
  "n": "Zancada con mancuernas",
  "pasos": [
   "De pie, una mancuerna en cada mano.",
   "Da un paso largo al frente.",
   "Baja hasta que la rodilla de atrás casi toque el suelo.",
   "Vuelve empujando con la pierna de delante. Alterna."
  ],
  "err": [
   "Paso demasiado corto.",
   "Inclinar el tronco hacia delante."
  ]
 },
 "Butt_Lift_Bridge": {
  "p": "cadera",
  "m": "Glúteo",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "n": "Puente de glúteo",
  "pasos": [
   "Boca arriba, rodillas dobladas y pies apoyados cerca del culo.",
   "Empuja con los talones y sube la cadera hasta alinear rodillas, cadera y hombros.",
   "Aprieta el glúteo 2 s arriba y baja despacio."
  ],
  "err": [
   "Arquear la lumbar arriba.",
   "Empujar con las puntas."
  ]
 },
 "Single_Leg_Glute_Bridge": {
  "p": "cadera",
  "m": "Glúteo",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "uni": true,
  "n": "Puente de glúteo a una pierna",
  "pasos": [
   "Boca arriba, una rodilla doblada y la otra pierna estirada al aire.",
   "Empuja con el talón y sube la cadera.",
   "Aprieta el glúteo 1 s arriba.",
   "Baja despacio. Cambia de lado."
  ],
  "err": [
   "Arquear la lumbar en vez de apretar el glúteo."
  ]
 },
 "Barbell_Hip_Thrust": {
  "p": "cadera",
  "m": "Glúteo",
  "eq": "barra",
  "lum": true,
  "ini": 20,
  "inc": 5,
  "n": "Hip thrust con barra",
  "pasos": [
   "Espalda alta apoyada en un banco, barra sobre la cadera con almohadilla.",
   "Pies apoyados, rodillas dobladas.",
   "Sube la cadera hasta que quede en línea con el tronco.",
   "Aprieta glúteo arriba y baja controlado."
  ],
  "err": [
   "Hiperextender la lumbar arriba.",
   "Empujar con la punta de los pies."
  ]
 },
 "Glute_Kickback": {
  "p": "gluteo",
  "m": "Glúteo",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "uni": true,
  "n": "Patada de glúteo",
  "pasos": [
   "A cuatro patas, espalda recta.",
   "Lleva una pierna atrás y arriba con la rodilla doblada.",
   "Aprieta el glúteo arriba.",
   "Baja sin apoyar. Cambia de lado."
  ],
  "err": [
   "Arquear la espalda al subir la pierna."
  ]
 },
 "Thigh_Abductor": {
  "p": "gluteo",
  "m": "Glúteo",
  "eq": "maq",
  "lum": true,
  "ini": 25,
  "inc": 5,
  "n": "Abductores en máquina",
  "pasos": [
   "Siéntate con la espalda apoyada y las almohadillas por fuera de las rodillas.",
   "Abre las piernas empujando hacia fuera.",
   "Vuelve despacio sin dejar que el peso golpee."
  ],
  "err": [
   "Ir a tirones.",
   "Separar la espalda del respaldo."
  ]
 },
 "Seated_Leg_Curl": {
  "p": "femoral",
  "m": "Pierna",
  "eq": "maq",
  "lum": true,
  "ini": 20,
  "inc": 5,
  "n": "Curl femoral sentado",
  "pasos": [
   "Ajusta la máquina: rodilla alineada con el eje y rodillo encima del tobillo.",
   "Baja el rodillo doblando las rodillas todo lo que puedas.",
   "Vuelve despacio sin dejar caer el peso."
  ],
  "err": [
   "Levantar la cadera del asiento.",
   "Soltar de golpe."
  ],
  "gem": "Mantén el pie relajado (no en punta) para no cargar el gemelo."
 },
 "Lying_Leg_Curls": {
  "p": "femoral",
  "m": "Pierna",
  "eq": "maq",
  "lum": true,
  "ini": 15,
  "inc": 5,
  "n": "Curl femoral tumbado",
  "pasos": [
   "Boca abajo, el rodillo justo encima de los talones.",
   "Cadera pegada al banco.",
   "Lleva los talones hacia el culo.",
   "Baja despacio."
  ],
  "err": [
   "Levantar la cadera.",
   "Bajar de golpe."
  ]
 },
 "Ball_Leg_Curl": {
  "p": "femoral",
  "m": "Pierna",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "n": "Curl femoral con fitball",
  "pasos": [
   "Boca arriba con los talones sobre el fitball.",
   "Sube la cadera.",
   "Trae la pelota hacia ti doblando rodillas.",
   "Estira despacio sin bajar la cadera."
  ],
  "err": [
   "Dejar caer la cadera."
  ]
 },
 "Leg_Extensions": {
  "p": "cuadriceps",
  "m": "Pierna",
  "eq": "maq",
  "lum": true,
  "ini": 20,
  "inc": 5,
  "n": "Extensión de cuádriceps",
  "pasos": [
   "Ajusta el respaldo: rodilla alineada con el eje de la máquina, rodillo sobre el tobillo.",
   "Estira las piernas hasta arriba y aprieta 1 s.",
   "Baja despacio en 2-3 s."
  ],
  "err": [
   "Dar patadas rápidas.",
   "Levantar la cadera."
  ]
 },
 "Seated_Calf_Raise": {
  "p": "gemelo",
  "m": "Gemelo",
  "eq": "maq",
  "lum": true,
  "ini": 15,
  "inc": 5,
  "fijo": true,
  "n": "Gemelo sentado (prevención)",
  "pasos": [
   "Siéntate en la máquina con las rodillas bajo el apoyo y la punta del pie en el escalón.",
   "Baja el talón despacio (3 s) hasta notar estiramiento suave.",
   "Sube de puntillas lo más alto posible y aguanta 1 s arriba.",
   "Peso ligero: es prevención, no fuerza."
  ],
  "err": [
   "Rebotar abajo.",
   "Ir rápido.",
   "Meter mucho peso."
  ],
  "gem": "Este ejercicio es para cuidar el gemelo izquierdo. Nunca con dolor: si molesta ese día, sáltalo."
 },
 "Dumbbell_Bench_Press": {
  "p": "empuje_h",
  "m": "Pecho",
  "eq": "manc",
  "lum": true,
  "ini": 10,
  "inc": 2,
  "n": "Press banca con mancuernas",
  "pasos": [
   "Túmbate en el banco con una mancuerna en cada mano apoyada en los muslos.",
   "Súbelas a la altura del pecho al tumbarte, palmas mirando a los pies.",
   "Empuja hacia arriba hasta casi estirar los brazos, juntando un poco las mancuernas.",
   "Baja despacio hasta que los codos queden algo por debajo del banco.",
   "Pies firmes en el suelo y hombros pegados atrás todo el rato."
  ],
  "err": [
   "Abrir los codos a 90° del cuerpo (mejor a unos 45°).",
   "Arquear mucho la espalda.",
   "Bajar de golpe."
  ]
 },
 "Leverage_Chest_Press": {
  "p": "empuje_h",
  "m": "Pecho",
  "eq": "maq",
  "lum": true,
  "ini": 20,
  "inc": 5,
  "n": "Press de pecho en máquina",
  "pasos": [
   "Ajusta el asiento para que los agarres queden a la altura del pecho.",
   "Espalda pegada al respaldo.",
   "Empuja hasta casi estirar los brazos.",
   "Vuelve despacio."
  ],
  "err": [
   "Encoger los hombros.",
   "Bloquear los codos."
  ]
 },
 "Pushups": {
  "p": "empuje_h",
  "m": "Pecho",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "n": "Flexiones",
  "pasos": [
   "Manos algo más abiertas que los hombros.",
   "Cuerpo recto de cabeza a talones.",
   "Baja el pecho cerca del suelo, codos a unos 45°.",
   "Empuja hasta estirar. Si cuesta, apoya rodillas."
  ],
  "err": [
   "Cadera caída.",
   "Codos muy abiertos."
  ]
 },
 "Incline_Push-Up": {
  "p": "empuje_h",
  "m": "Pecho",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "n": "Flexiones inclinadas",
  "pasos": [
   "Manos en un banco o mesa firme.",
   "Cuerpo recto.",
   "Baja el pecho hacia el banco.",
   "Empuja hasta estirar."
  ],
  "err": [
   "Doblar la cadera."
  ]
 },
 "Incline_Dumbbell_Press": {
  "p": "empuje_inc",
  "m": "Pecho",
  "eq": "manc",
  "lum": true,
  "ini": 8,
  "inc": 2,
  "n": "Press inclinado con mancuernas",
  "pasos": [
   "Banco inclinado a unos 30°. Mancuernas a la altura del pecho alto.",
   "Empuja hacia arriba y un poco hacia dentro.",
   "Baja despacio hasta notar estiramiento en el pecho.",
   "Si en el Sparta hay máquina de press inclinado, vale igual."
  ],
  "err": [
   "Inclinar demasiado el banco (trabaja más el hombro).",
   "Despegar la espalda."
  ]
 },
 "Butterfly": {
  "p": "aperturas",
  "m": "Pecho",
  "eq": "maq",
  "lum": true,
  "ini": 20,
  "inc": 5,
  "n": "Aperturas en máquina (contractor)",
  "pasos": [
   "Asiento a la altura que deje los agarres a media altura del pecho.",
   "Codos un poco doblados.",
   "Junta los brazos delante del pecho.",
   "Abre despacio hasta notar estiramiento."
  ],
  "err": [
   "Abrir demasiado atrás.",
   "Ir con impulso."
  ]
 },
 "Cable_Crossover": {
  "p": "aperturas",
  "m": "Pecho",
  "eq": "polea",
  "lum": true,
  "ini": 5,
  "inc": 2.5,
  "n": "Cruce de poleas",
  "pasos": [
   "Poleas altas, un agarre en cada mano, un paso al frente.",
   "Codos un poco doblados.",
   "Lleva las manos juntas hacia abajo y al frente.",
   "Vuelve despacio."
  ],
  "err": [
   "Doblar mucho los codos (se convierte en press)."
  ]
 },
 "Seated_Dumbbell_Press": {
  "p": "empuje_v",
  "m": "Hombro",
  "eq": "manc",
  "lum": true,
  "ini": 6,
  "inc": 2,
  "n": "Press de hombro sentado",
  "pasos": [
   "Banco con respaldo vertical. Mancuernas a la altura de las orejas, palmas al frente.",
   "Empuja hacia arriba hasta casi estirar los brazos.",
   "Baja despacio hasta la altura de las orejas.",
   "Espalda pegada al respaldo todo el rato."
  ],
  "err": [
   "Arquear la lumbar.",
   "Bajar demasiado o de golpe."
  ]
 },
 "Leverage_Shoulder_Press": {
  "p": "empuje_v",
  "m": "Hombro",
  "eq": "maq",
  "lum": true,
  "ini": 15,
  "inc": 5,
  "n": "Press de hombro en máquina",
  "pasos": [
   "Asiento con los agarres a la altura de los hombros.",
   "Espalda pegada.",
   "Empuja hacia arriba sin bloquear.",
   "Baja despacio."
  ],
  "err": [
   "Arquear la espalda."
  ]
 },
 "Side_Lateral_Raise": {
  "p": "hombro_lat",
  "m": "Hombro",
  "eq": "manc",
  "lum": true,
  "ini": 4,
  "inc": 1,
  "n": "Elevaciones laterales",
  "pasos": [
   "De pie, mancuernas a los lados.",
   "Sube los brazos hacia los lados hasta la altura de los hombros.",
   "Codos un poco doblados.",
   "Baja despacio."
  ],
  "err": [
   "Subir con impulso.",
   "Encoger los hombros."
  ]
 },
 "Wide-Grip_Lat_Pulldown": {
  "p": "tiron_v",
  "m": "Espalda",
  "eq": "maq",
  "lum": true,
  "ini": 30,
  "inc": 5,
  "n": "Jalón al pecho",
  "pasos": [
   "Ajusta el rodillo para que sujete bien los muslos.",
   "Agarra la barra algo más ancho que los hombros, palmas hacia delante.",
   "Saca pecho, inclínate apenas hacia atrás.",
   "Tira de la barra hacia la parte alta del pecho llevando los codos hacia abajo y atrás.",
   "Sube despacio hasta estirar los brazos."
  ],
  "err": [
   "Tirar con los brazos en vez de con la espalda.",
   "Echarse muy atrás y balancearse.",
   "Bajar la barra por detrás de la nuca."
  ]
 },
 "Close-Grip_Front_Lat_Pulldown": {
  "p": "tiron_v",
  "m": "Espalda",
  "eq": "maq",
  "lum": true,
  "ini": 30,
  "inc": 5,
  "n": "Jalón agarre estrecho",
  "pasos": [
   "Pon el maneral estrecho (agarre neutro, palmas enfrentadas) si lo hay.",
   "Sentado, muslos sujetos, pecho alto.",
   "Tira hacia la parte alta del pecho llevando los codos pegados al cuerpo.",
   "Sube despacio hasta estirar."
  ],
  "err": [
   "Balancear el cuerpo.",
   "Encoger los hombros."
  ]
 },
 "Straight-Arm_Pulldown": {
  "p": "tiron_v",
  "m": "Espalda",
  "eq": "polea",
  "lum": true,
  "ini": 10,
  "inc": 2.5,
  "n": "Pullover en polea",
  "pasos": [
   "De pie frente a la polea alta, brazos casi estirados.",
   "Inclínate un poco hacia delante.",
   "Lleva la barra hacia los muslos con los brazos rectos.",
   "Sube despacio."
  ],
  "err": [
   "Doblar los codos."
  ]
 },
 "Seated_Cable_Rows": {
  "p": "tiron_h",
  "m": "Espalda",
  "eq": "polea",
  "lum": true,
  "ini": 25,
  "inc": 5,
  "n": "Remo sentado en polea",
  "pasos": [
   "Siéntate con los pies en los apoyos y rodillas algo flexionadas.",
   "Agarra el maneral con la espalda recta.",
   "Tira llevando el maneral al ombligo y junta los omóplatos.",
   "Vuelve despacio estirando los brazos, sin redondear la espalda."
  ],
  "err": [
   "Balancear el tronco para tirar.",
   "Encoger los hombros hacia las orejas."
  ]
 },
 "One-Arm_Dumbbell_Row": {
  "p": "tiron_h",
  "m": "Espalda",
  "eq": "manc",
  "lum": true,
  "ini": 10,
  "inc": 2,
  "uni": true,
  "n": "Remo con mancuerna a una mano",
  "pasos": [
   "Apoya rodilla y mano del mismo lado en el banco, espalda recta y paralela al suelo.",
   "Con la otra mano coge la mancuerna con el brazo estirado.",
   "Tira llevando el codo hacia la cadera, pegado al cuerpo.",
   "Baja despacio. Haz todas las repes y cambia de lado."
  ],
  "err": [
   "Girar el tronco para subir.",
   "Tirar hacia el hombro en vez de hacia la cadera."
  ]
 },
 "Leverage_High_Row": {
  "p": "tiron_h",
  "m": "Espalda",
  "eq": "maq",
  "lum": true,
  "ini": 20,
  "inc": 5,
  "n": "Remo en máquina",
  "pasos": [
   "Pecho apoyado en el respaldo.",
   "Agarra las asas con los brazos estirados.",
   "Tira llevando los codos atrás y junta los omóplatos.",
   "Vuelve despacio."
  ],
  "err": [
   "Separar el pecho del apoyo.",
   "Encoger los hombros."
  ]
 },
 "Inverted_Row": {
  "p": "tiron_h",
  "m": "Espalda",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "n": "Remo invertido",
  "pasos": [
   "Bajo una barra a la altura de la cadera, agárrala.",
   "Cuerpo recto, talones en el suelo.",
   "Tira del pecho hacia la barra.",
   "Baja despacio."
  ],
  "err": [
   "Cadera caída."
  ]
 },
 "Face_Pull": {
  "p": "posterior",
  "m": "Hombro",
  "eq": "polea",
  "lum": true,
  "ini": 10,
  "inc": 2.5,
  "n": "Face pull",
  "pasos": [
   "Polea a la altura de la cara con cuerda.",
   "Tira hacia la frente abriendo los codos.",
   "Junta los omóplatos.",
   "Vuelve despacio."
  ],
  "err": [
   "Tirar con la espalda baja.",
   "Mucho peso."
  ]
 },
 "Reverse_Flyes": {
  "p": "posterior",
  "m": "Hombro",
  "eq": "manc",
  "lum": true,
  "ini": 3,
  "inc": 1,
  "n": "Pájaros con mancuernas",
  "pasos": [
   "Sentado e inclinado hacia delante, pecho sobre los muslos.",
   "Mancuernas colgando.",
   "Abre los brazos hacia los lados.",
   "Baja despacio."
  ],
  "err": [
   "Subir con impulso."
  ]
 },
 "Dumbbell_Bicep_Curl": {
  "p": "biceps",
  "m": "Brazos",
  "eq": "manc",
  "lum": true,
  "ini": 6,
  "inc": 2,
  "n": "Curl de bíceps con mancuernas",
  "pasos": [
   "De pie, codos pegados al cuerpo.",
   "Sube las mancuernas girando la palma hacia arriba.",
   "Baja despacio hasta estirar."
  ],
  "err": [
   "Balancear el cuerpo.",
   "Despegar los codos."
  ]
 },
 "Hammer_Curls": {
  "p": "biceps",
  "m": "Brazos",
  "eq": "manc",
  "lum": true,
  "ini": 6,
  "inc": 2,
  "n": "Curl martillo",
  "pasos": [
   "De pie, palmas mirándose.",
   "Sube las mancuernas sin girar la muñeca.",
   "Baja despacio."
  ],
  "err": [
   "Balancear el cuerpo."
  ]
 },
 "Triceps_Pushdown": {
  "p": "triceps",
  "m": "Brazos",
  "eq": "polea",
  "lum": true,
  "ini": 15,
  "inc": 2.5,
  "n": "Extensión de tríceps en polea",
  "pasos": [
   "Polea alta, codos pegados al cuerpo.",
   "Empuja hacia abajo hasta estirar los brazos.",
   "Sube despacio hasta 90°."
  ],
  "err": [
   "Despegar los codos.",
   "Echar el cuerpo encima."
  ]
 },
 "Cable_Rope_Overhead_Triceps_Extension": {
  "p": "triceps",
  "m": "Brazos",
  "eq": "polea",
  "lum": true,
  "ini": 10,
  "inc": 2.5,
  "n": "Tríceps por encima de la cabeza",
  "pasos": [
   "De espaldas a la polea, cuerda por detrás de la cabeza.",
   "Codos apuntando al frente.",
   "Estira los brazos hacia delante y arriba.",
   "Vuelve despacio."
  ],
  "err": [
   "Abrir los codos."
  ]
 },
 "Bench_Dips": {
  "p": "triceps",
  "m": "Brazos",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "n": "Fondos en banco",
  "pasos": [
   "Manos en el borde de un banco, piernas al frente.",
   "Baja doblando codos hasta unos 90°.",
   "Sube empujando."
  ],
  "err": [
   "Bajar demasiado (carga el hombro)."
  ]
 },
 "Plank": {
  "p": "core",
  "m": "Core",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "seg": true,
  "n": "Plancha",
  "pasos": [
   "Apoya antebrazos (codos bajo los hombros) y puntas de los pies.",
   "Cuerpo recto de cabeza a talones: aprieta glúteo y abdomen.",
   "Respira normal y aguanta el tiempo marcado."
  ],
  "err": [
   "Cadera caída (carga la lumbar).",
   "Culo muy arriba.",
   "Aguantar la respiración."
  ]
 },
 "Side_Bridge": {
  "p": "core",
  "m": "Core",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "seg": true,
  "uni": true,
  "n": "Plancha lateral",
  "pasos": [
   "De lado, apoyado en el antebrazo (codo bajo el hombro) y el canto del pie.",
   "Sube la cadera hasta que el cuerpo quede recto.",
   "Aguanta y cambia de lado. Si cuesta, apoya las rodillas."
  ],
  "err": [
   "Dejar caer la cadera.",
   "Girar el tronco."
  ]
 },
 "Dead_Bug": {
  "p": "core",
  "m": "Core",
  "eq": "peso",
  "lum": true,
  "ini": 0,
  "inc": 0,
  "n": "Dead bug (bicho muerto)",
  "pasos": [
   "Boca arriba, brazos estirados al techo y rodillas a 90° encima de la cadera.",
   "Pega la zona lumbar al suelo.",
   "Estira a la vez brazo derecho atrás y pierna izquierda al frente, sin que la lumbar se despegue.",
   "Vuelve y cambia de lado. Lento y controlado."
  ],
  "err": [
   "Arquear la espalda.",
   "Ir rápido."
  ]
 },
 "Pallof_Press": {
  "p": "core",
  "m": "Core",
  "eq": "polea",
  "lum": true,
  "ini": 5,
  "inc": 2.5,
  "uni": true,
  "n": "Pallof press (antirrotación)",
  "pasos": [
   "Polea a la altura del pecho. Ponte de lado a la polea, agarre con las dos manos pegado al pecho.",
   "Separa un paso de la polea para notar tensión.",
   "Estira los brazos al frente sin dejar que el cuerpo gire.",
   "Aguanta 2 s y vuelve al pecho. Haz las repes y cambia de lado."
  ],
  "err": [
   "Dejar que el tronco gire hacia la polea.",
   "Usar demasiado peso."
  ]
 },
 "Bicycling_Stationary": {
  "p": "cardio",
  "m": "Cardio",
  "eq": "maq",
  "lum": true,
  "n": "Bici estática",
  "pasos": [
   "Ajusta el sillín: con el pedal abajo, la rodilla queda casi estirada.",
   "Pedalea a ritmo cómodo: tienes que poder hablar (zona 2).",
   "Cadencia ágil, unas 85-95 pedaladas por minuto."
  ],
  "err": [
   "Sillín bajo.",
   "Ir demasiado fuerte en los días de zona 2."
  ]
 },
 "Elliptical_Trainer": {
  "p": "cardio",
  "m": "Cardio",
  "eq": "maq",
  "lum": true,
  "n": "Elíptica",
  "pasos": [
   "Pies enteros sobre los pedales.",
   "Ritmo cómodo, espalda recta, usa también los brazos.",
   "Puedes hablar sin ahogarte."
  ],
  "err": [
   "Apoyarse con todo el peso en las manos."
  ],
  "gem": "Mantén el talón apoyado en el pedal todo el movimiento."
 },
 "Rowing_Stationary": {
  "p": "cardio",
  "m": "Cardio",
  "eq": "maq",
  "lum": false,
  "n": "Remo ergómetro",
  "pasos": [
   "Pies sujetos con la cinta a la altura del metatarso.",
   "Orden: piernas empujan, luego el tronco se echa algo atrás, luego tiran los brazos.",
   "Vuelta al revés: brazos, tronco, piernas.",
   "Ritmo suave, unas 20-24 paladas por minuto."
  ],
  "err": [
   "Tirar solo con los brazos.",
   "Redondear la espalda."
  ]
 }
};

const ST = {
 "Standing_Gastrocnemius_Calf_Stretch": {
  "n": "Gemelo contra la pared",
  "s": 30,
  "lados": true,
  "t": "Manos en la pared, pierna de atrás estirada y talón en el suelo. Echa la cadera hacia delante. Suave, sin rebotar."
 },
 "Standing_Soleus_And_Achilles_Stretch": {
  "n": "Sóleo y Aquiles",
  "s": 30,
  "lados": true,
  "t": "Igual que el anterior pero doblando un poco la rodilla de atrás. Talón apoyado."
 },
 "Hamstring_Stretch": {
  "n": "Isquiotibiales",
  "s": 30,
  "lados": true,
  "t": "Pierna estirada apoyada, inclina el tronco hacia delante con la espalda recta hasta notar el estiramiento."
 },
 "Quad_Stretch": {
  "n": "Cuádriceps",
  "s": 30,
  "lados": true,
  "t": "De pie, coge el empeine y lleva el talón al culo. Rodillas juntas, apóyate en algo."
 },
 "Kneeling_Hip_Flexor": {
  "n": "Flexor de cadera",
  "s": 30,
  "lados": true,
  "t": "Rodilla atrás en el suelo, la otra pierna delante a 90°. Aprieta el glúteo y lleva la cadera adelante."
 },
 "Chest_And_Front_Of_Shoulder_Stretch": {
  "n": "Pecho y hombro",
  "s": 30,
  "lados": true,
  "t": "Brazo apoyado en una columna o marco, gira el cuerpo hacia el lado contrario."
 },
 "Upper_Back_Stretch": {
  "n": "Espalda alta",
  "s": 40,
  "t": "Entrelaza las manos al frente, redondea la espalda y empuja las manos lejos."
 },
 "Cat_Stretch": {
  "n": "Gato-camello",
  "s": 60,
  "t": "A cuatro patas. Alterna despacio: espalda redonda hacia arriba y luego hundida. Respira con el movimiento."
 },
 "Worlds_Greatest_Stretch": {
  "n": "El mejor estiramiento del mundo",
  "s": 60,
  "lados": true,
  "t": "Zancada larga, mano contraria al suelo, gira el tronco abriendo el brazo al techo. 5 repeticiones lentas."
 },
 "Runners_Stretch": {
  "n": "Estiramiento del corredor",
  "s": 40,
  "lados": true,
  "t": "Zancada con manos en el suelo, lleva la cadera atrás estirando la pierna de delante."
 },
 "IT_Band_and_Glute_Stretch": {
  "n": "Glúteo y cintilla",
  "s": 40,
  "lados": true,
  "t": "Tumbado, cruza un tobillo sobre la rodilla contraria y tira de la pierna hacia el pecho."
 },
 "Seated_Floor_Hamstring_Stretch": {
  "n": "Isquios sentado",
  "s": 60,
  "t": "Sentado, piernas estiradas, inclínate hacia los pies con la espalda larga."
 },
 "Calf_Stretch_Hands_Against_Wall": {
  "n": "Gemelo en pared (suave)",
  "s": 40,
  "lados": true,
  "t": "Manos en la pared, pierna atrás estirada. Muy suave en el lado izquierdo."
 },
 "Seated_Calf_Stretch": {
  "n": "Gemelo sentado con toalla",
  "s": 40,
  "lados": true,
  "t": "Sentado, toalla en la planta del pie, tira suave hacia ti con la pierna estirada."
 },
 "On_Your_Side_Quad_Stretch": {
  "n": "Cuádriceps de lado",
  "s": 40,
  "lados": true,
  "t": "Tumbado de lado, coge el empeine de arriba y lleva el talón al culo."
 },
 "Spinal_Stretch": {
  "n": "Torsión de espalda",
  "s": 40,
  "lados": true,
  "t": "Sentado, cruza una pierna y gira el tronco hacia ese lado con la espalda recta."
 },
 "Side_Lying_Groin_Stretch": {
  "n": "Aductores",
  "s": 60,
  "t": "Boca arriba, junta las plantas de los pies y deja caer las rodillas a los lados."
 },
 "Overhead_Stretch": {
  "n": "Estiramiento arriba",
  "s": 30,
  "t": "De pie, brazos arriba entrelazados, estírate hacia el techo e inclínate un poco a cada lado."
 }
};
const STRETCH_POST = ["Standing_Gastrocnemius_Calf_Stretch","Standing_Soleus_And_Achilles_Stretch","Hamstring_Stretch","Quad_Stretch","Kneeling_Hip_Flexor","Chest_And_Front_Of_Shoulder_Stretch","Upper_Back_Stretch"];

// Fases y fines de semana hasta Monegros (la semana 25 es la de la prueba)
const FINDE = [null,[["btt",1.5,"Rodaje suave por terreno cómodo. Solo volver a sentir la bici."],["trail",0.75,"Caminar rápido por monte con 6×(1 min trote / 3 min andar)."]],[["btt",1.75,"Rodaje suave, alguna subida tranquila."],["trail",0.83,"Caminar rápido con 6×(2 min trote / 3 min andar)."]],[["btt",2,"Rodaje suave con subidas cortas sentado."],["trail",0.92,"Caminar rápido con 6×(3 min trote / 2 min andar)."]],[["btt",1.5,"SEMANA DE DESCANSO: paseo suave."],["walk",0.75,"Caminata por monte sin trotar."]],[["btt",2.25,"Unos 400 m de desnivel a ritmo cómodo."],["trail",1,"5×(4 min trote / 2 min andar). Subidas andando."]],[["btt",2.5,"Unos 500 m de desnivel."],["trail",1,"4×(6 min trote / 2 min andar)."]],[["btt",2.75,"Unos 550 m de desnivel."],["trail",1.1,"3×(10 min trote / 2 min andar)."]],[["btt",2,"SEMANA DE DESCANSO: suave."],["trail",0.75,"Trote suave 20-25 min seguidos si el gemelo va bien. Si no, andar."]],[["btt",3,"Unos 600 m de desnivel. Practica comer cada hora."],["trail",1,"30-40 min de trote continuo por terreno fácil."]],[["btt",3.25,"Unos 650 m de desnivel."],["btt",1.75,"Rodaje suave de recuperación."]],[["btt",3.5,"Unos 700 m de desnivel."],["trail",1.15,"45 min de trote con las subidas andando."]],[["btt",2.5,"SEMANA DE DESCANSO: suave."],["trail",0.83,"Trote suave."]],[["btt",3.5,"Unos 750 m. Ritmo constante en pistas largas."],["btt",2,"Rodaje suave."]],[["btt",3.75,"Unos 800 m de desnivel."],["btt",2,"Rodaje suave."]],[["btt",4,"Unos 900 m. Come y bebe como en Monegros."],["trail",1.25,"Trote suave con subidas andando."]],[["btt",3,"SEMANA DE DESCANSO: suave."],["btt",1.5,"Paseo suave."]],[["btt",4.25,"Pistas largas a ritmo de Monegros (constante, sin cebarse)."],["btt",2.5,"Rodaje suave."]],[["btt",4.5,"Unos 1.000 m de desnivel."],["trail",1.25,"Trote suave."]],[["btt",5,"Unos 90 km. La más larga hasta ahora."],["btt",2,"Rodaje muy suave."]],[["btt",3,"SEMANA DE DESCANSO: suave."],["trail",1,"Trote suave."]],[["btt",5,"ENSAYO GENERAL: unos 100 km con la comida, bebida y ritmo de Monegros."],["btt",1.5,"Recuperación muy suave."]],[["btt",4,"Larga a ritmo cómodo."],["btt",2,"Rodaje suave."]],[["btt",3,"Con 3×15 min a ritmo de carrera."],["trail",0.83,"Trote suave."]],[["btt",2,"Con 3×10 min a ritmo de carrera. Revisa la bici."],["btt",1.5,"Rodaje muy suave."]],[["race",7,"ORBEA MONEGROS (larga). Come cada hora y bebe cada 15 min desde el principio."],["walk",0.75,"Paseo suave o descanso total."]]];





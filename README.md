# Coquídoku

Juego de lógica original con coquíes de Puerto Rico. Tableros de 8 × 8, 60 niveles con solución única, reto diario, 3 pistas gratuitas por tablero y tres ambientes en Preferencias: Aventura en la hoja, Bosque encantado y Nido tropical.

## Jugar

https://fravier3.github.io/coquidoku/

Un coquí por fila, columna y región. No pueden tocarse, ni en diagonal. Cambia entre colocar coquíes y marcar X con el botón central. Las partidas empiezan vacías, sin coquíes ni X automáticas. El marcado automático se puede activar en Preferencias. Cada partida normal selecciona un tablero base y una de ocho rotaciones/reflejos, excluyendo la base y la solución de la partida anterior. El reto diario es estable durante el día y una partida guardada conserva su tablero al reabrirla. Cada partida tiene 4 vidas y 3 pistas. Deshacer no devuelve pistas ni vidas. El modo relajado permite errores ilimitados, con el mismo límite de 3 pistas. Bosque encantado es el tema predeterminado; las preferencias se conservan después del primer cambio de versión. Los coquíes aparecen al instante sin animación y sus nodos se reutilizan al marcar X. Las pistas colocan un coquí correcto y explican sus descartes; no son un solver didáctico paso a paso.

PWA estática, sin cuentas, backend, anuncios ni dependencias externas. Guarda la partida y preferencias en localStorage. Sonidos sintéticos opcionales inspirados en el canto del coquí. Para instalar en iPhone: Safari → Compartir → Añadir a pantalla de inicio. El navegador controla el soporte de instalación y audio.

## Desarrollo

Servir esta carpeta con cualquier servidor HTTP estático. Verificación: `python tests/validate.py` y `node --check app.js`. `tests/generate.py` genera los 60 tableros con semilla reproducible, regiones conexas y solución única. Se verifica y publica automáticamente al actualizar main mediante .github/workflows/pages.yml, usando los archivos estáticos directamente.

La aplicación consulta actualizaciones al cargar y volver al primer plano. El service worker usa red primero y copia offline; incrementar CACHE y las versiones de recursos al publicar cambios, preservando localStorage. Datos guardados limitados al dispositivo y origen.

Arte original generado para Coquídoku. Implementación propia basada en las reglas públicas del género de lógica de regiones. No contiene código, niveles o recursos extraídos de Meowdoku; REA no se ejecutó contra su binario.

## v1.3.0 · Coquíes y bosque

Colección de seis personajes: Sol desde el inicio; Menta con 5 victorias únicas, Brisa con 10, Flor con 20, Luna con 35 y Aurora con 50. El personaje elegido aparece en el tablero y se guarda en el dispositivo.

Cada nivel distinto o reto diario único completado añade un brote (hasta 60 brotes visibles). El paisaje evoluciona a las 10, 25 y 50 victorias. Repetir un nivel no duplica las recompensas. Los niveles completados anteriormente cuentan; se conservan las partidas, las preferencias y las reglas de cuatro vidas y tres pistas por tablero.

## v1.4.0 · El Yunque y minijuegos

El Yunque muestra únicamente su paisaje actual y las semillas que faltan para el próximo cambio. Todos los personajes desbloqueados viven allí. Cada uno puede explorar con pequeños brincos o descansar, y cambiar de rincón (río, árbol, claro). La colección, las decoraciones, las posiciones y el movimiento se guardan en el dispositivo. Los efectos del bosque respetan reducir movimiento; las piezas del tablero siguen sin saltos.

Completar un tablero abre un minijuego alternado de parejas, memoria del canto o patrones. **Los puntos proceden únicamente de superar los minijuegos** (20 por ronda, una sola recompensa por ronda). Completar niveles no da puntos ni hay concesión retroactiva de puntos. Repetir un nivel permite jugar otra ronda, pero no duplica semillas ni niveles completados. El minijuego puede cerrarse y retomarse hasta completar otro tablero, que lo sustituye.

Los personajes se consiguen por niveles distintos completados o por puntos: Menta 5/80, Brisa 10/160, Flor 20/320, Luna 35/560, Aurora 50/800 (niveles/puntos). La compra requiere confirmación y nunca usa dinero real. Los amigos obtenidos en versiones anteriores se conservan. Boricua, inspirado en la bandera de Puerto Rico, solo se consigue completando los 60 niveles normales; los diarios y los puntos no sustituyen este requisito.

Los tableros alternan semillas, flores escondidas, precisión, luciérnagas y encuentros. Encontrar correctamente la flor o resolver un tablero de precisión sin errores ni pistas concede una decoración anticipada, sin puntos. El resto de decoraciones aparece con semillas. El canto del personaje es una síntesis musical inspirada en el coquí, no una grabación de campo.

Arte generado con la herramienta integrada de imágenes: `assets/coqui-boricua.webp` y `assets/decor-{fern,flowers,log,stones,fireflies,sapling}.webp`. Prompts: coquí 3D frontal con piel roja/blanca y frente azul con estrella blanca, fondo transparente; atlas transparente 3×2 de helecho, hibiscos, tronco con musgo, piedras, luciérnagas y arbolito, estilo de bosque tropical 3D cálido. Los PNG originales se optimizaron a WebP conservando alfa.

Validación: pruebas Node de economía, compras, minijuegos, progreso y migración; validador de los 60 tableros y recursos. La revisión visual e interacción en un iPhone físico queda pendiente.

## v1.4.1 · Canto, brincos y día/noche

El canto se activa una vez al actualizar (después se conserva la elección de silenciarlo). AudioContext se reanuda desde el toque y las dos notas se programan después de la reanudación para evitar sonidos perdidos en Safari. Aumenta la claridad del saludo y evita duplicarlo al encontrar el último coquí. Es sonido sintetizado, no una grabación.

Los coquíes exploran por defecto; solo descansan si el usuario lo elige. La secuencia del bosque hace un brinco visible al abrir y se repite cada 30 segundos, sin animar las piezas del tablero. Se respetan las preferencias de reducir movimiento.

Al abrir El Yunque se elige al azar día o noche, sin cambiar la etapa, coquíes ni decoraciones. Cambiar una decoración o posición conserva la hora de esa visita. Arte diurno en `assets/forest-{0,1,2,3}-day.webp`, generado con la herramienta integrada editando el atlas nocturno: mismas cuatro etapas, composición y río, con cielo azul, nubes suaves y sol de mañana, sin luna ni estrellas.

Pruebas adicionales con audio simulado: reanudar antes de programar, sonido al encontrar, silencio en errores/X, recuperación de audio interrumpido/cerrado y silencio persistente. También se verifican las cuatro etapas diurnas/nocturnas y el descanso explícito. La prueba auditiva y visual en un iPhone físico queda pendiente.

## v1.4.2 · Reproductor nativo y coquíes sin brincos

Se retiran los brincos, la respiración animada y el selector de movimiento a petición del usuario. Los personajes siguen presentes en El Yunque y se pueden colocar en sus rincones.

Se sustituye Web Audio por un elemento HTML audio precargado con `assets/coqui-call.mp3`, una grabación real. `play()` se llama directamente desde el toque sin esperar antes a otras promesas. Se solicita sesión playback cuando está disponible; los bloqueos/cargas fallidas se muestran dentro del diálogo visible. Preferencias incluye controles nativos para probar el mismo archivo; el botón del personaje reproduce aunque el sonido de partida esté silenciado. El último acierto no duplica el canto con la victoria.

Audio: fragmento 4.0–6.4 segundos de «Coquíes1.ogg», ValWey, Hatillo (Puerto Rico), 27 mayo 2012. Original: https://commons.wikimedia.org/wiki/File:Coqu%C3%ADes1.ogg . Audio original y adaptación CC BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/ . Cambios: recorte, mono MP3, filtrado, normalización y fundidos. Créditos también en `assets/audio-credits.txt` y Preferencias. Esta licencia se refiere al audio adaptado.

Verificación: decodificación completa del MP3 con ffmpeg, duración y volumen no nulo; pruebas del flujo de reproducción nativa, silencio, botones y mensajes de error; ausencia de animación del bosque y selector. No se afirma una escucha comprobada en un iPhone físico.

El service worker sirve rangos de bytes de audio (respuestas 206 con Content-Range), incluidos los sondeos de Safari y la reproducción sin conexión. Pruebas con el MP3 real comprueban rangos iniciales, abiertos, finales e inválidos.

## v1.5.0 · El Yunque inmersivo y mapa de Puerto Rico

Audio único: `assets/coqui-user.mp3`, copia idéntica del MP3 aportado por el usuario (SHA256 e3092efeaecbdb2ad01f0de6df52c20959e28ac7a961a4fab4df0dcbc880e18b). Se retira el sonido anterior y sus créditos de la publicación. El reproductor nativo y los rangos de bytes usan exclusivamente este archivo.

El Yunque ocupa toda la pantalla, con botón Volver, día/noche aleatorio y la etapa actual. Hay partículas de luz, reflejos, decoración y todos los personajes obtenidos. Alimentar permite tocar el suelo para dejar insectos, con tres segundos entre raciones; los coquíes activos se acercan. Alimentar no cuesta ni concede puntos/semillas y no hay abandono ni pérdida de progreso. Su contador se guarda localmente.

Los coquíes saltan mediante requestAnimationFrame: arco de 900 ms con altura de 36 px, primer saludo al abrir y siguientes saltos cada 30 segundos. Descansar y Reducir animaciones detienen el movimiento. El ciclo se detiene al cerrar o pasar a segundo plano. Las piezas del tablero siguen sin saltos. Se conservan los rincones elegidos.

Mapa de 60 niveles en seis recorridos: Viejo San Juan, Luquillo, El Yunque, bahía luminosa, Cayey y cumbre. Muestra completados, nivel en juego y próximo sin completar. Los futuros se habilitan con el progreso; los niveles ya accesibles por progreso antiguo se conservan. Tocar el nivel en curso reanuda sin borrar jugadas. Desde la victoria se puede abrir personajes, y cerrar esa vista con la X conduce al mapa. La X de victoria y Ver mapa también abren el mapa. Los minijuegos y compras conservan su lógica.

Arte en `assets/map-0.webp` a `assets/map-5.webp`, generado con la herramienta integrada: seis dioramas tropicales 3D con referencias puertorriqueñas y espacio central para el camino, sin números ni botones en el bitmap. Nodos y rutas son controles reales. La imagen presentada en el chat es una referencia visual, no una captura de la aplicación.

Pruebas: reloj de fotogramas a inicio, ápice y repetición de 30 segundos; reposo, reducción de movimiento y cierre; alimento y conservación de puntos; 60 nodos y progresión; reanudar tablero; cierre de colección al mapa; identidad exacta de audio. Pendiente: revisión física en iPhone y percepción de fluidez en ese dispositivo.

## v1.6.0 · Hábitat vertical, alimento real y mapa ascendente

Fondos nuevos en retrato 1:2 para pantalla móvil: `assets/yunque-{0,1,2,3}-{day,night}.webp`. La imagen mantiene su proporción al adaptarse, sin estirar el paisaje horizontal anterior. La fauna salta cada 15 segundos. Sin preselección de personaje al inicio ni modo de alimentar activado al entrar; se conservan personajes elegidos distintos del Sol anterior por defecto.

Se elimina la decoración manual. Los paisajes y elementos aparecen automáticamente al progresar. Un aviso discreto en una esquina invita a desbloquear más habitantes. El alimento es el sprite generado `assets/insect-fly.webp`, con alas, patas y cuerpo. Cada insecto se asigna al coquí activo más cercano; el coquí avanza con saltos de distancia limitada hasta alcanzarlo. Solo al llegar a su posición se elimina ese insecto. El reposo no consume alimento. El alimento no da puntos ni semillas. Las raciones se limitan para evitar acumulación.

El mapa se recorre del 1 inferior hacia números superiores, sin estrellas ni botón Continuar. Solo aparecen los paisajes de regiones alcanzadas. El nivel en juego tiene un color diferente y los futuros muestran un candado sin fondo. Los pasos tienen volumen y relieve de piedra.

Minijuegos: parejas reales de imágenes (3 parejas), memoria de una secuencia explícita de 4 símbolos y conteo de insectos entre flores con tres opciones numéricas. Se retira el patrón ambiguo. El conteo se valida contra los objetos mostrados; la secuencia debe repetirse completa. Puntos únicamente al completar el objetivo, con una sola recompensa por ronda. Se mantienen el MP3 aportado, vidas, pistas y progreso.

Arte generado con la herramienta integrada: atlas de ocho fondos verticales 4×2, etapas diurnas arriba/nocturnas abajo, mismo terreno y vegetación creciente; insecto 3D con alfa; referencia visual del mapa con piedras elevadas, 1 abajo y 10 arriba, sin estrellas y nivel actual dorado. La referencia es conceptual, no una captura. Verificación adicional de 120 rondas para conteos/alternativas, llegada y consumo de insectos, 15 segundos, regiones alcanzadas y ausencia de preselección. Pendiente percepción visual y fluidez en un iPhone físico.

Escalones: `assets/step-done.webp`, `assets/step-current.webp`, `assets/step-locked.webp`, generados como plataformas de piedra 3D con caras laterales, musgo/tono dorado/pizarra. Sin números en el bitmap: números y candados son UI real.

## v1.7.0 · Estados del mapa y revisión de minijuegos

El mapa usa estados exclusivos: completado verde, próximo nivel pendiente amarillo (solo uno), bloqueado gris con un candado lateral sin fondo. Repetir un nivel completado no lo vuelve amarillo. Al completar los 60 niveles todos quedan verdes. Los saltos verticales entre nodos aumentan a 118 px; el candado queda anclado a la derecha del propio escalón, separado de números, caminos y otros escalones. Las reglas nuevas usan un componente CSS aislado de los estilos anteriores.

El Yunque da el foco al botón Volver al abrirse, evitando que el navegador dibuje un anillo de foco en el primer coquí. Sin preselección inicial. Se retiran los insectos decorativos y las partículas: quedan únicamente las mosquitas que el usuario deja como alimento. Se reemplazan los ocho fondos por retratos individuales de mayor resolución, sin dividir atlas. En pantallas anchas el hábitat principal conserva su encuadre vertical y los laterales son un fondo ambiental, sin estirar el terreno interactivo.

Nombres visibles actualizados conservando IDs, compras y progreso: Sol → Coquí Dorado; Menta → Pistoco; Brisa → Amapola. Flor → Sila; Luna → Betances; Aurora → Rita. Boricua conserva su nombre y el orden se mantiene.

Cada minijuego valida su objetivo antes de permitir cualquier recompensa. Parejas muestra turnos y explica los fallos; memoria tiene indicadores de los cuatro pasos; conteo confirma la cantidad acertada. Pruebas: 120 rondas completas con entradas erróneas, pasos parciales y doble finalización; las 61 fronteras de progreso; repetir niveles completados; 320/375/430/500 px de ancho con cajas de escalones, candados y leyenda que no se intersecan; nombres y foco inicial. No equivalen a una revisión física en iPhone.

Arte: reemplazos individuales de `assets/yunque-{0,1,2,3}-{day,night}.webp`, generados con la herramienta integrada; prompt de retrato de pantalla completa 9:19.5 con claro abierto y cascada de El Yunque, vegetación creciente, versión diurna/nocturna, sin insectos ni partículas ni interfaz. Se mantienen resolución nativa y proporciones, optimizando a WebP.

## v1.8.0 · Mapa completo y coquíes que puedes mover

Una sola región de diez niveles se muestra completa dentro del espacio disponible de pantalla. El escenario, el camino y las coordenadas comparten un encuadre 400×700; se escala conservando proporciones, sin alargar el fondo. Las flechas permiten volver solamente a regiones ya alcanzadas. Se conservan las piedras 3D, el número ascendente y un único nivel amarillo con «Estás aquí». El nivel actual se obtiene del avance más alto y de la partida normal guardada, evitando volver al 1 por huecos de registros antiguos. Los pasos anteriores se muestran verdes sin inventar victorias, puntos, semillas ni recompensas. Repetir un nivel completado no cambia la referencia de progreso.

En El Yunque, arrastrar con el dedo pausa el movimiento del personaje y guarda su nueva posición en `forestCoordinates`, dentro del mismo almacenamiento `coquidoku-v1`. Un toque breve sigue abriendo su ficha. Pointer capture permite soltar fuera de la imagen sin dejarlo agarrado; se gestionan cancelaciones, límites del terreno y el clic posterior al arrastre. El rincón elegido desde su ficha reemplaza la posición libre. Las preferencias y el progreso anterior se conservan.

Alimentar permite varios toques seguidos, hasta 30 insectos simultáneos. Cada tanda redistribuye los objetivos entre coquíes activos por proximidad: cada personaje tiene un insecto distinto, los que descansan o están siendo arrastrados quedan fuera. Los insectos permanecen hasta el contacto real, sin premios por alimentar.

Pruebas: regresión específica de partida en nivel 7 con el nivel 1 ausente del registro; 61 fronteras de progreso; navegación de regiones; geometría de los seis mapas en cuatro tamaños; arrastre con captura, cancelación, límites, pausa y persistencia tras recarga; distinción entre toque y arrastre; varios puntos de alimento a la vez, asignación exclusiva, descanso y límite de alimento. Se mantienen las 120 rondas de minijuegos y las pruebas de audio. El entorno no dispone de control de navegador: falta validar percepción visual y tacto en un iPhone físico.

### Arte del mapa

Herramienta integrada de generación de imágenes, seis retratos independientes, 948×1659 nativos, WebP calidad 90. Destinos: `assets/map-0.webp`, `assets/map-1.webp`, `assets/map-2.webp`, `assets/map-3.webp`, `assets/map-4.webp`, `assets/map-5.webp`.

Prompt base final, sustituyendo `{theme}` por cada tema de la lista:

> Use case: stylized-concept. Production game map BACKGROUND ONLY, one high resolution portrait 4:7 image (1024x1792 preferred), full frame made for a phone. Premium cozy animated 3D game diorama of {theme}. Camera near overhead, 65 degrees looking down, NO sky or horizon at all. All central 75% width from 12% down to 94% height must be unobstructed gently textured flat walkable terrain, for ten UI stepping stones to be placed later. Beautiful crafted 3D detail at the LEFT AND RIGHT BORDERS ONLY, central ground simple readable broad clearing, no central objects. Warm inviting cinematic color, crisp detailed textures, natural proportions. NO path drawn, NO stepping stones, NO UI, no numbers, no text, no icons, no circles, no frogs, no humans, no panels or atlas. One coherent portrait ground view, not a stretched landscape.

Temas, en orden: Viejo San Juan: colorful colonial houses and historic fort walls only on the extreme edges, central open grassy plaza; Luquillo beach: sand terrain, tropical palms on edges, blue ocean narrow strip at far right; El Yunque rainforest: mossy open forest floor clearing, tropical ferns and small waterfall only on extreme edges; Puerto Rico bioluminescent bay at blue twilight: broad mossy island ground and water along far edges; Cayey mountains: broad open grassy hilltop, tiny coffee plants and distant hill ridges only at edges; Puerto Rico summit: magical emerald moss plateau, orchids, stone ruins and forest cliffs framing edges.

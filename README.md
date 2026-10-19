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

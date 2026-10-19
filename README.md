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

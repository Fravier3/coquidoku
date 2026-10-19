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

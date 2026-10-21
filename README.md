# Coquídoku

## v1.23.0 · Un compañero nuevo y una pista para comenzar

Cada tablero conserva ocho coquíes: uno aparece revelado y fijo desde el inicio; el contador muestra los siete restantes, de 0/7 a 7/7. La pista inicial se conserva al reiniciar el mismo tablero y al recargar. Las partidas anteriores reciben una pista sin borrar marcas, vidas, pistas usadas ni progreso.

Al desbloquear un personaje por niveles aparece un popup con su imagen y nombre y queda seleccionado para el siguiente tablero. Las repeticiones y los retos diarios no repiten el aviso. El bebé también queda seleccionado al presentarse en su final. La selección manual posterior se conserva hasta el siguiente desbloqueo.

Juego estático PWA de 60 niveles 8×8 en GitHub Pages. Sin minijuegos, monedas, compras de personajes o corazones, ni protecciones obtenidas como premios. Cuatro vidas y tres pistas por tablero; al perder se reinicia ese mismo tablero. Los niveles y los retos diarios nuevos plantan semillas para el bosque.

Los personajes se desbloquean al completar niveles distintos: Coquí Dorado (inicio), Pistoco (5), Amapola (10), Sila (20), Betances (35), Rita (50), Colombiana (55) y Boricua (60). Los personajes desbloqueados en versiones anteriores se conservan, incluidos los que se habían adquirido con la economía anterior. Esa economía se retira del estado activo al migrar.

Al completar los 60 niveles se guarda family.pairedAt como hora real de unión de Colombiana y Boricua. Pasadas exactamente 24 horas reales, family.bornAt conserva ese vencimiento y desbloquea al bebé secreto Borinbiano. Antes de su llegada, la última tarjeta muestra solamente una silueta negra genérica, el título Personaje bonus y el requisito de mantener a Boricua y Colombiana juntos en El Yunque durante 24 horas. No muestra el nombre ni la imagen real del bebé, ni permite seleccionarlo. Al llegar se sustituye por la ficha verdadera sin duplicarla. Si el juego estaba cerrado, la llegada se calcula al abrir. La presentación final se muestra una sola vez dentro de El Yunque. Todos siguen disponibles para cuidar; el reinicio total es opcional y pide confirmación. Se conservan los ajustes al reiniciar, pero se borra solamente el progreso de esta app.

Colombiana tiene los colores amarillo, azul y rojo y Borinbiano es gris perla. En la cabeza tiene el triángulo azul con una estrella blanca y las franjas rojas y blancas verticales que completan una mini bandera de Puerto Rico entre los ojos; solamente en la panza lleva las franjas amarilla, azul y roja de Colombia. Ambos tienen sprites despiertos y dormidos. El bebé se muestra más pequeño. Los padres aparecen juntos por defecto, respetando las coordenadas que el usuario haya guardado al arrastrarlos.

El cuidado conserva hambre lenta, cuatro alimentos con recogida por el vecino activo más cercano, canto al mantener pulsado, saltos independientes cada 10–15 segundos y siestas de 15–25 minutos reales con hora de despertar persistente. El sueño vuelve entre 3 y 4 horas después de despertar, nunca antes de tres horas. La actualización conserva las siestas activas y sus vencimientos, y migra el antiguo ciclo de pocos minutos. La barra y el indicador de sueño acompañan el salto. Despierto, la barra verde indica alimento. Dormido, la barra azul avanza de 0 a 100% usando sleepStartedAt y sleepUntil; al despertar vuelve a alimento. Tener sueño, dormir o el receso manual pausa los saltos. El coquí con sueño muestra la luna y espera a que el usuario lo ponga a dormir. Al despertar vuelve a programarse un salto inmediato. Los alimentos del suelo se asignan al vecino activo sin sueño más cercano. El inicio utiliza un solo botón Comenzar cuando el navegador exige un gesto para la música. Música separada por pantalla y efectos de tablero con silenciamiento maestro.

Estado local: coquidoku-v1. No se eliminan niveles, partidas, coquíes o posiciones al actualizar. El service worker versiona recursos y conserva el almacenamiento local. Sin backend ni dependencias de ejecución.

El contador n/8 coquíes aparece encima de los corazones rojos. Ver más / Ver menos agrupa Cómo jugar, Reto del día, Reiniciar tablero, Mis coquíes, El Yunque y el resumen de progreso. El reinicio conserva exactamente el mismo puzzle y variante y devuelve 4 vidas y 3 pistas, con confirmación si hay una partida activa. Los accesos conservan bordes suaves. Los tres controles principales conservan su relieve y acento dorado.

Siempre se conserva al menos un habitante despierto, sin sueño y en exploración. Si todos quedarían dormidos, con sueño o en receso, se elige aleatoriamente otro para mantener activo El Yunque; no se pierde alimento ni progreso. Con un único habitante no puede ponerse a dormir, porque es quien mantiene vivo el refugio. Reducir animaciones sigue siendo respetado.

## Validación

node --check app.js
node --check sw.js
node tests/game.test.cjs
node tests/audio.test.cjs
python3 tests/validate.py

Las pruebas cubren reglas, vidas y pistas, desbloqueos y migración, secreto hasta 24 horas, cierre/reapertura, nacimiento durante la sesión, presentación única, reinicio confirmado, cuidado de todos los personajes y alimentos, música y recursos offline. No sustituyen una prueba física en iPhone.

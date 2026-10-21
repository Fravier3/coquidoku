# Coquídoku

## v1.21.0 · Mini bandera en la frente y personaje bonus por revelar

Juego estático PWA de 60 niveles 8×8 en GitHub Pages. Sin minijuegos, monedas, compras de personajes o corazones, ni protecciones obtenidas como premios. Cuatro vidas y tres pistas por tablero; al perder se reinicia ese mismo tablero. Los niveles y los retos diarios nuevos plantan semillas para el bosque.

Los personajes se desbloquean al completar niveles distintos: Coquí Dorado (inicio), Pistoco (5), Amapola (10), Sila (20), Betances (35), Rita (50), Colombiana (55) y Boricua (60). Los personajes desbloqueados en versiones anteriores se conservan, incluidos los que se habían adquirido con la economía anterior. Esa economía se retira del estado activo al migrar.

Al completar los 60 niveles se guarda family.pairedAt como hora real de unión de Colombiana y Boricua. Pasadas exactamente 24 horas reales, family.bornAt conserva ese vencimiento y desbloquea al bebé secreto Borinbiano. Antes de su llegada, la última tarjeta muestra solamente una silueta negra genérica, el título Personaje bonus y el requisito de mantener a Boricua y Colombiana juntos en El Yunque durante 24 horas. No muestra el nombre ni la imagen real del bebé, ni permite seleccionarlo. Al llegar se sustituye por la ficha verdadera sin duplicarla. Si el juego estaba cerrado, la llegada se calcula al abrir. La presentación final se muestra una sola vez dentro de El Yunque. Todos siguen disponibles para cuidar; el reinicio total es opcional y pide confirmación. Se conservan los ajustes al reiniciar, pero se borra solamente el progreso de esta app.

Colombiana tiene los colores amarillo, azul y rojo y Borinbiano es gris perla. En la cabeza tiene el triángulo azul con una estrella blanca y las franjas rojas y blancas verticales que completan una mini bandera de Puerto Rico entre los ojos; solamente en la panza lleva las franjas amarilla, azul y roja de Colombia. Ambos tienen sprites despiertos y dormidos. El bebé se muestra más pequeño. Los padres aparecen juntos por defecto, respetando las coordenadas que el usuario haya guardado al arrastrarlos.

El cuidado conserva hambre lenta, cuatro alimentos con recogida por el vecino activo más cercano, canto al mantener pulsado, saltos independientes cada 10–15 segundos y siestas de 15–25 minutos reales con hora de despertar persistente. La barra de alimento y el sueño acompañan el salto. El inicio utiliza un solo botón Comenzar cuando el navegador exige un gesto para la música. Música separada por pantalla y efectos de tablero con silenciamiento maestro.

Estado local: coquidoku-v1. No se eliminan niveles, partidas, coquíes o posiciones al actualizar. El service worker versiona recursos y conserva el almacenamiento local. Sin backend ni dependencias de ejecución.

Los accesos Cómo jugar, Reto del día, Otro tablero, Mis coquíes y El Yunque tienen bordes suaves individuales con esquinas redondeadas y superficies transparentes. Los tres controles principales conservan su relieve y acento dorado.

## Validación

node --check app.js
node --check sw.js
node tests/game.test.cjs
node tests/audio.test.cjs
python3 tests/validate.py

Las pruebas cubren reglas, vidas y pistas, desbloqueos y migración, secreto hasta 24 horas, cierre/reapertura, nacimiento durante la sesión, presentación única, reinicio confirmado, cuidado de todos los personajes y alimentos, música y recursos offline. No sustituyen una prueba física en iPhone.

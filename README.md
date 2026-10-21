# Coquídoku

## v1.25.0 · Treinta niveles y dos nuevas formas de jugar

La aventura se distribuye en 20 niveles clásicos, 5 de Camino a casa (3, 9, 15, 21, 27) y 5 de Hora de comer (6, 12, 18, 24, 29). Los niveles 1 y 30 son clásicos. Se conservan las seis regiones de Puerto Rico, ahora con cinco escalones cada una e indicadores del tipo de reto.

Camino a casa: tablero 5×5 con tramos rectos y curvas que giran con cada toque. Debe conectarse la salida con el refugio pasando por tres luces. Hora de comer: ruta ortogonal por cuatro insectos, sin repetir casillas ni pasar por piedras, terminando en la hoja. Los cinco diseños de insectos se verifican por búsqueda exhaustiva: entre 1 y 18 soluciones válidas y ninguna de menos de 15 casillas. Las diez variantes empiezan sin resolver y tienen solución comprobada. Las comprobaciones incorrectas consumen una vida; planear, girar, borrar o deshacer no consumen vidas. Cada nivel tiene tres vidas y una pista. El coquí seleccionado recorre el camino correcto con animación; las entradas quedan bloqueadas durante el recorrido y salir cancela el recorrido de forma segura.

El motor puro variants.js valida rutas, conexiones recíprocas, obstáculos, repeticiones y objetivos. El progreso de los retos, la única pista gastada y las vidas restantes se guardan en el mismo almacenamiento. Los retos diarios siguen siendo tableros clásicos.

Migración: se conserva el nivel alcanzado hasta el nuevo máximo de 30 y se archiva el listado anterior en legacyAdventure. Una partida clásica activa continúa como clásica aunque su escalón ahora tenga otro tipo; al volver a empezar ese nivel desde el mapa después de completarlo se usa su tipo nuevo. Los personajes anteriores, coordenadas, alimento, sueño y fechas familiares se conservan. Las semillas por encima de 30 se mantienen con legacySeeds para no quitar crecimiento al bosque. El crecimiento natural ahora cambia a las 5, 13 y 25 semillas. No se crean puntos ni minijuegos entre niveles.

El mapa y el contador comparten el progreso real. Al actualizar, los guardados antiguos que ya mostraban escalones previos superados se reconcilian sin retroceder al jugador: al comenzar el nivel 18 se muestran 17/30 completados. Repetir niveles no cambia la frontera. Cada tablero comienza con tres corazones y una pista adicional; el coquí inicial revelado se conserva. Las partidas guardadas limitan las vidas restantes a tres y las pistas utilizadas a una, sin recuperar consumibles gastados. El canto al mantener pulsado se reproduce una vez por pulsación, sin bucle, tanto con Web Audio como con el reproductor de respaldo. Los botones secundarios tienen el mismo fondo de cristal que los controles principales.

Cada tablero conserva ocho coquíes: uno aparece revelado y fijo desde el inicio; el contador muestra los siete restantes, de 0/7 a 7/7. La pista inicial se conserva al reiniciar el mismo tablero y al recargar. Las partidas anteriores reciben una pista sin borrar marcas, vidas, pistas usadas ni progreso.

Al desbloquear un personaje por niveles aparece un popup con su imagen y nombre y queda seleccionado para el siguiente tablero. Las repeticiones y los retos diarios no repiten el aviso. El bebé también queda seleccionado al presentarse en su final. La selección manual posterior se conserva hasta el siguiente desbloqueo.

Juego estático PWA de 30 niveles, con tablero clásico 8×8 y dos variantes 5×5 en GitHub Pages. Sin minijuegos, monedas, compras de personajes o corazones, ni protecciones obtenidas como premios. Tres vidas y una pista por tablero; al perder se reinicia ese mismo tablero. Los niveles y los retos diarios nuevos plantan semillas para el bosque.

Los personajes se desbloquean al completar niveles distintos: Coquí Dorado (inicio), Pistoco (3), Amapola (5), Sila (10), Betances (18), Rita (25), Colombiana (28) y Boricua (30). Los personajes desbloqueados en versiones anteriores se conservan, incluidos los que se habían adquirido con la economía anterior. Esa economía se retira del estado activo al migrar.

Al completar los 30 niveles se guarda family.pairedAt como hora real de unión de Colombiana y Boricua. Pasadas exactamente 24 horas reales, family.bornAt conserva ese vencimiento y desbloquea al bebé secreto Borinbiano. Antes de su llegada, la última tarjeta muestra solamente una silueta negra genérica, el título Personaje bonus y el requisito de mantener a Boricua y Colombiana juntos en El Yunque durante 24 horas. No muestra el nombre ni la imagen real del bebé, ni permite seleccionarlo. Al llegar se sustituye por la ficha verdadera sin duplicarla. Si el juego estaba cerrado, la llegada se calcula al abrir. La presentación final se muestra una sola vez dentro de El Yunque. Todos siguen disponibles para cuidar; el reinicio total es opcional y pide confirmación. Se conservan los ajustes al reiniciar, pero se borra solamente el progreso de esta app.

Colombiana tiene los colores amarillo, azul y rojo y Borinbiano es gris perla. En la cabeza tiene el triángulo azul con una estrella blanca y las franjas rojas y blancas verticales que completan una mini bandera de Puerto Rico entre los ojos; solamente en la panza lleva las franjas amarilla, azul y roja de Colombia. Ambos tienen sprites despiertos y dormidos. El bebé se muestra más pequeño. Los padres aparecen juntos por defecto, respetando las coordenadas que el usuario haya guardado al arrastrarlos.

El cuidado conserva hambre lenta, cuatro alimentos con recogida por el vecino activo más cercano, canto al mantener pulsado, saltos independientes cada 10–15 segundos y siestas de 15–25 minutos reales con hora de despertar persistente. El sueño vuelve entre 3 y 4 horas después de despertar, nunca antes de tres horas. La actualización conserva las siestas activas y sus vencimientos, y migra el antiguo ciclo de pocos minutos. La barra y el indicador de sueño acompañan el salto. Despierto, la barra verde indica alimento. Dormido, la barra azul avanza de 0 a 100% usando sleepStartedAt y sleepUntil; al despertar vuelve a alimento. Tener sueño, dormir o el receso manual pausa los saltos. El coquí con sueño muestra la luna y espera a que el usuario lo ponga a dormir. Al despertar vuelve a programarse un salto inmediato. Los alimentos del suelo se asignan al vecino activo sin sueño más cercano. El inicio utiliza un solo botón Comenzar cuando el navegador exige un gesto para la música. Música separada por pantalla y efectos de tablero con silenciamiento maestro.

Estado local: coquidoku-v1. No se eliminan niveles, partidas, coquíes o posiciones al actualizar. El service worker versiona recursos y conserva el almacenamiento local. Sin backend ni dependencias de ejecución.

El contador n/7 coquíes aparece encima de los corazones rojos. Ver más / Ver menos agrupa Cómo jugar, Reto del día, Reiniciar tablero, Mis coquíes, El Yunque y el resumen de progreso. El reinicio conserva exactamente el mismo puzzle y variante y devuelve 3 vidas y 1 pista, con confirmación si hay una partida activa. Los accesos conservan bordes suaves. Los tres controles principales conservan su relieve y acento dorado.

Siempre se conserva al menos un habitante despierto, sin sueño y en exploración. Si todos quedarían dormidos, con sueño o en receso, se elige aleatoriamente otro para mantener activo El Yunque; no se pierde alimento ni progreso. Con un único habitante no puede ponerse a dormir, porque es quien mantiene vivo el refugio. Reducir animaciones sigue siendo respetado.

## Validación

node --check app.js
node --check variants.js
node --check sw.js
node tests/game.test.cjs
node tests/variants.test.cjs
node tests/audio.test.cjs
python3 tests/validate.py

Las pruebas cubren reglas, vidas y pistas, desbloqueos y migración, secreto hasta 24 horas, cierre/reapertura, nacimiento durante la sesión, presentación única, reinicio confirmado, cuidado de todos los personajes y alimentos, música y recursos offline. No sustituyen una prueba física en iPhone.

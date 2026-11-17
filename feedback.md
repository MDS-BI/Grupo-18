Feedback Avance 01 (26/10/26)

- muy buen avance, ojo si con las imagenes (para speckit deberian ser solo referenciales).

Proximos pasos:
 
- rectificar puntos anteriores 
- trabajar en los specs (historias de usuario, US) para definir tareas
- dividirse las US y tareas para una siguiente iteracion (avances cada semana)
- ejecutar una version integrada de prueba

Feedback Avance 02 (2/11/26)

- Se insiste en el manejo de los specs (revisar video). Cada carpeta debe tener toda la estructura base (y editar sobre ella).
- Se observan historias de usuario por miembro del grupo, muy bien
- Evitar trabajar con modelos de IA fuera de speckit en local, porque crean ramas nuevas y se pierde la integridad del proyecto

Proximos pasos:

- rectificar puntos anteriores y crear tareas a partir de los specs
- hacer primera implmentacion, registar modificaciones/incremental y volver al spec
- dividir el grupo entre modificaciones (ajustes previos) e incremental (nueva funcionalidad)
- integrar nueva version en 2 semanas

Feedback Avance 03 (16/11/26)

Cambios en la especificacion:

- spec.md se reescribió: US1–US6 con reglas de negocio, escenarios de aceptación y sesión de clarificaciones (08/11 y 16/11). tasks.md pasó de 4 a más de 60 tareas con rutas reales `src/rrhh/...` y notas de evidencia ("Falta: ...").
- Es claro y coherente entre ambos, pero la carpeta se llama `001-erp-base-module` y mezcla el ERP base con RR.HH. (antes se usaba `002-rrhh-planilla`). El encabezado de spec.md quedó con un "A" suelto en "Estado".

Consistencia sitio-especificacion:

- T045, T046 y T061 están en "[X]" y coinciden con `src/rrhh/calculo/rut.js`. Pero T001 está en "[X]" aunque la propia nota dice que faltan `src/utils/` y `tests/setup/`.
- Clarificación 16/11 y T022/T025: la pantalla genérica debe excluir Trabajadores y Liquidaciones, pero `src/app.js` y `src/storage.js` los siguen listando y permiten eliminarlos (`deleteEntity`, `index.html`).
- hacer mejoras de funcionalidad e interfaz de usuario, incluir data simulada para probar campos, incluir mejoras de estilo, transicion, navegacion, etcetera.

Presentacion de MVP final en 2 semanas.

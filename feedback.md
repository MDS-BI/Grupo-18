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

- No hubo cambios esta semana. spec.md no existe en `specs/002-rrhh-planilla/` y tasks.md no se modificó, así que no se puede contrastar con una especificación.

Consistencia sitio-especificacion:

- Todas las tareas de tasks.md siguen como "[ ]", pero hay mucho implementado. T010-T013 (US1) están en `src/rrhh/views/trabajadores-view.js` y `trabajador-form.js`. T024-T029 (US2) están en `contrato-form.js`, `contratos-service.js` y `alertas-service.js`, y la alerta se muestra en `src/components/dashboard.js`.
- Las rutas de tasks.md no coinciden con el código. Ejemplos: `src/contract-alerts.js`, `src/components/contract-form.js` y `tests/unit/contracts.test.js`, que en el sitio son `src/rrhh/...` y `tests/unit/rrhh-contratos.test.js`.
- Hay funcionalidades sin tarea: roles y sesión (`src/rrhh/seguridad/`), catálogos, cierre de períodos, costo empleador, validación de RUT e impresión de liquidación.
- hacer mejoras de funcionalidad e interfaz de usuario, incluir data simulada para probar campos, incluir mejoras de estilo, transicion, navegacion, etcetera.

Presentacion de MVP final en 2 semanas.

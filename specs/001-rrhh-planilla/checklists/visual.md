# Checklist visual SC-030/SC-031

Fecha: 2026-11-23.

Alcance verificado: login, selección de representado y pestañas superiores del módulo RR.HH. (Resumen, Asistencia, Planilla, Períodos, Trabajadores, Contratos, Catálogos, Liquidaciones, Auditoría). Quedan fuera US7 Vacaciones, US8 Cargas familiares, US10 Reportes y la cobertura SC-030 completa de US1–US12, pendientes de sus historias.

| Criterio FR-110 / SC-030 / SC-031 | Resultado | Evidencia |
| --- | --- | --- |
| Colores del tema común, sin variables `--color-*` sin definir | OK | `src/styles.css`, `src/components/shell.js`, `tests/integration/workspace-shell.test.js` |
| Contraste AA del acento configurable frente a texto blanco | OK | `src/module-config.js`, `tests/unit/module-config.test.js` |
| Tipografía y espaciados consistentes; sin textos cortados | OK | `src/styles.css`, revisión de las 9 pestañas |
| Título y acción principal en la misma posición en pantallas con alta | OK | `.rrhh-section-header` + `.rrhh-primary-action`, `tests/integration/rrhh-panel-lateral-us1.test.js` |
| Fila de encabezado de tablas y grillas | OK | `src/rrhh/views/`, grillas `.rrhh-table-row` |
| Sin desplazamiento horizontal de página entre 768 px y 1920 px | OK | `.rrhh-list-container` con `overflow-x:auto`, `tests/integration/workspace-shell.test.js` |
| Errores visibles, anunciados y asociados al campo | OK | `src/rrhh/components/feedback.js`, tests de integración de formularios |
| Paginación de 25 filas con foco y estado accesible | OK | `src/rrhh/components/pagination.js`, tests unitarios y de integración |

Verificación ejecutada desde la raíz del repositorio: `npm run test:run`, `npm run lint`, `npm run format:check` y `npm run build`, todos en verde.

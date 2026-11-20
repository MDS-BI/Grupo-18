# Lista de Verificación de Calidad de la Especificación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Propósito**: Validar la completitud y calidad de la especificación antes de proceder a la planificación
**Creada**: 2026-07-08
**Actualizada**: 2026-11-20 (validación integral tras clarify, ampliación a US1–US12, ajustes de interfaz, impresión/PDF y cargo único)
**Funcionalidad**: [Enlace a spec.md](spec.md)

## Calidad del Contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs)
- [x] Enfocada en el valor para el usuario y las necesidades del negocio
- [x] Escrita para partes interesadas no técnicas
- [x] Todas las secciones obligatorias completadas

## Completitud de los Requisitos

- [x] No quedan marcadores [NEEDS CLARIFICATION]
- [x] Los requisitos son comprobables y sin ambigüedades
- [x] Los criterios de éxito son medibles
- [x] Los criterios de éxito son agnósticos a la tecnología (sin detalles de implementación)
- [x] Todos los escenarios de aceptación están definidos
- [x] Los casos límite están identificados
- [x] El alcance está claramente delimitado
- [x] Dependencias y suposiciones identificadas

## Preparación de la Funcionalidad

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros
- [x] Los escenarios de usuario cubren los flujos principales
- [x] La funcionalidad cumple los resultados medibles definidos en los Criterios de Éxito
- [x] No hay filtración de detalles de implementación en la especificación

## Notas

- La especificación está lista para la planificación y la implementación.
- Inventario: 12 historias de usuario, 77 requisitos funcionales (FR-040 a FR-116) y 21 criterios de éxito (SC-011 a SC-031), todos de Recursos Humanos y Planilla. No quedan marcadores [NEEDS CLARIFICATION].
- Alcance: exclusivamente el módulo de Recursos Humanos y Planilla (US1–US12).
- 2026-11-08: se corrigieron las suposiciones contradictorias sobre flujos de aprobación y períodos (ahora dentro del alcance de US3/US4) y sobre las reglas de cálculo (US4, no US5).
- 2026-11-08: se retiraron detalles de implementación de las suposiciones (monograma sin referencia a SVG; persistencia local sin nombrar la API del navegador; sanitización de contenido sin referencias al DOM/HTML).
- 2026-11-08: se eliminaron las referencias obsoletas a una "Historia de Usuario 16" y a numeraciones duplicadas; la numeración vigente en ese momento era FR-001–FR-107 y SC-001–SC-029.
- 2026-11-18: se retiró del spec el módulo base genérico (FR-001–FR-039, XR-001–XR-005, SC-001–SC-010, sus casos límite, entidades y suposiciones) por no corresponder a Recursos Humanos y Planilla; la numeración vigente no se reutiliza.
- 2026-11-16: se agregaron FR-063 a FR-084 con reglas importantes de US1–US4 (cada uno remitido a su historia), se alinearon FR-040 a FR-050 con US5, se aclaró FR-003 (eliminación de Entidad genérica; Trabajadores se desactivan) y se actualizaron las Suposiciones para incluir US1, US2 y US6 en la versión inicial.
- 2026-11-17: se completaron las historias US11 y US12 con escenarios de aceptación, se amplió el inventario a US1–US12 / FR-107 / SC-029 y se alinearon plan, modelo de datos, contratos y tareas.
- 2026-11-16: se aplicó pasada de alineación fina (terminología de sesión identificada, visibilidad por rol y respaldo JSON/bitácora en US6 y FR-051–FR-060, escenarios y casos límite sincronizados) y se agregaron FR-085 a FR-087 como complemento explícito de US6.
- 2026-11-19: se agregaron el control de visibilidad de contraseña (FR-113), los avisos del panel principal por rol (FR-114), las dos pestañas superiores del Trabajador, "Resumen" y "Liquidaciones" (FR-114), y el despliegue de la liquidación bajo la fila en cálculo o mediante "Ver liquidación" en la pestaña "Liquidaciones" (FR-115) y el panel lateral de formularios de alta y edición (FR-116), con sus escenarios en US1, US2, US4, US5 y US6; además se renombró la pestaña superior "Novedades" a "Asistencia" en US3; la auditoría sigue siendo el último escenario de cada historia afectada.
- 2026-11-20: se precisaron en US5 y US6 el PDF idéntico a "Ver liquidación" sin hoja inicial en blanco, el selector de representado extendido y centrado, el resumen del Trabajador en tarjeta con tabla, el período cerrado `2026-08` con liquidaciones pagadas y el cargo único en el comprobante (incluidos datos guardados anteriormente). Las tareas T123, T156–T165 quedan marcadas como completadas y alineadas con sus escenarios; la auditoría continúa siendo el último escenario de US1–US6.

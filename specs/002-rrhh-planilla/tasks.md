# Tasks: Módulo de Recursos Humanos y Planilla (Trabajo grupal)

**Input**: Diseño del módulo RR.HH. desde `/specs/002-rrhh-planilla/`
**Propósito**: Coordinar el trabajo del equipo sin mezclar tareas de distintas personas ni bloquear las historias de otros compañeros.

**Regla del equipo**:
- Cada historia tiene un responsable asignado.
- Las tareas de una historia no deben reescribirse por otra persona.
- Las dependencias se gestionan por fase, no por “todo el archivo”.
- Este archivo sirve para división del trabajo y forja de entregables por sprint.

## Formato: `[ID] [P?] [Historia] [Responsable] Descripción`

- **[P]**: puede ejecutarse en paralelo con otra tarea de otra historia.
- **[Historia]**: código de la historia asignada (ej. US1, US2, US3).
- **[Responsable]**: persona o subequipo encargado.
- Los archivos de implementación se indican en la descripción.

---

## Fase 1: Configuración compartida y base del módulo

**Propósito**: Preparar la base del ERP para RR.HH. y dejar la estructura común lista para todas las historias.

- [ ] T001 [P] [BASE] [Equipo] Revisar y dejar documentado el entorno base ERP y confirmar que la capa de `Entity`/`Document` y `localStorage` soporta la extensión del módulo en `src/storage.js` y `src/app.js`
- [ ] T002 [P] [BASE] [Equipo] Ajustar `src/module-config.js` con los nombres y etiquetas del dominio RR.HH. (`Trabajador`, `Liquidación de Sueldo`, etc.)
- [ ] T003 [P] [BASE] [Equipo] Validar el almacenamiento, campos personalizados y ciclo de vida del módulo para la persistencia de trabajadores, contratos y liquidaciones

**Checkpoint**: La base del módulo está lista y todas las historias pueden seguir en paralelo sin reescribir la misma capa.

---

## Fase 2: Historia de Usuario 1 - Ficha del trabajador (Prioridad: P1)

**Objetivo**: Crear y mantener la ficha del trabajador con datos básicos y búsquedas funcionales.

**Prueba Independiente**: Un usuario puede crear un trabajador, verlo en la lista y buscarlo por nombre o identificador.

### Implementación para US1

- [ ] T010 [P] [US1] [Persona 1] Diseñar y validar el modelo del trabajador sobre la estructura base en `src/storage.js`
- [ ] T011 [P] [US1] [Persona 1] Crear el formulario de trabajador y los campos requeridos en `src/components/entity-form.js`
- [ ] T012 [US1] [Persona 1] Conectar la persistencia y la validación de creación/edición en `src/app.js`
- [ ] T013 [US1] [Persona 1] Mostrar la lista y la búsqueda del trabajador en `src/components/entity-list.js` y `src/components/search-bar.js`

**Punto de control**: US1 queda validada como un entregable independiente del resto del módulo.

---

## Fase 3: Historia de Usuario 2 - Gestión de contratos y alertas de plazo (Prioridad: P1)

**Enunciado**: Como analista de remuneraciones, quiero registrar los contratos de trabajo (sueldo base, jornada y tipo de contrato) y recibir alertas de vencimiento para controlar las condiciones vigentes del personal.

**Por qué esta prioridad**: El contrato define los parámetros fundamentales del cálculo de sueldos y previene riesgos laborales por contratos vencidos.

**Prueba Independiente**: Se asocia un contrato a un trabajador y el panel advierte sobre contratos a plazo fijo que vencen dentro de los próximos 30 días. Al registrar un nuevo contrato o anexo por un cambio de sueldo, se conserva el registro anterior y cada condición queda asociada a su período de vigencia.

### Criterios de aceptación para US2

1. Dado un contrato a plazo fijo cercano a vencer, cuando faltan 30 días o menos, entonces el panel principal muestra una alerta visual.
2. Dado que se modifica el sueldo base, cuando se registra un nuevo contrato o anexo, entonces el sistema lo asocia al período correspondiente de forma histórica.

### Pruebas para US2

- [ ] T020 [P] [US2] [Persona 2] Añadir pruebas unitarias de validación del contrato, asociación obligatoria al trabajador y fechas de vigencia en `tests/unit/contracts.test.js`
- [ ] T021 [P] [US2] [Persona 2] Añadir pruebas unitarias de alertas: vencimiento dentro de 30 días inclusive, más de 30 días, contrato indefinido y contrato vencido en `tests/unit/contracts.test.js`
- [ ] T022 [P] [US2] [Persona 2] Añadir pruebas unitarias para registrar un cambio de sueldo como nuevo contrato o anexo, conservar el sueldo anterior y asociar ambos registros a sus períodos en `tests/unit/contracts.test.js`
- [ ] T023 [P] [US2] [Persona 2] Añadir pruebas de integración para crear un contrato asociado a un trabajador y visualizar la alerta de vencimiento en el panel principal en `tests/integration/contracts.test.js`

### Implementación para US2

- [ ] T024 [P] [US2] [Persona 2] Definir y validar el modelo persistente del contrato, incluyendo trabajador, sueldo base, jornada, tipo de contrato y período de vigencia, en `src/storage.js`
- [ ] T025 [P] [US2] [Persona 2] Crear el formulario de contrato con sueldo base, jornada, tipo de contrato, fecha de inicio y fecha de término en `src/components/contract-form.js`
- [ ] T026 [US2] [Persona 2] Conectar la creación, edición y persistencia de contratos vinculados al trabajador en `src/app.js`
- [ ] T027 [US2] [Persona 2] Implementar la selección de contratos a plazo fijo cuya fecha de término ocurre entre hoy y los próximos 30 días, excluyendo contratos ya vencidos, en `src/contract-alerts.js`
- [ ] T028 [US2] [Persona 2] Registrar cambios de sueldo como un nuevo contrato o anexo con su período de vigencia, sin sobrescribir los registros históricos, en `src/storage.js`
- [ ] T029 [US2] [Persona 2] Mostrar las alertas de vencimiento de contratos en el panel principal usando el resultado de `src/contract-alerts.js` en `src/components/dashboard.js`

**Punto de control**: US2 funciona de forma independiente y puede entregarse sin depender de US3/US4.

---

## Fase 4: Historia de Usuario 3 - Parámetros legales y vigencias (Prioridad: P1)

**Objetivo**: Registrar parámetros legales versionados por fecha de vigencia para calcular la remuneración con reglas actualizadas.

**Prueba Independiente**: Un cambio de ley se registra como una nueva versión de parámetro sin romper la vigencia histórica anterior.

### Implementación para US3

- [ ] T030 [P] [US3] [Persona 3] Diseñar y persistir los parámetros legales y sus vigencias en `src/storage.js`
- [ ] T031 [US3] [Persona 3] Crear la interfaz de configuración de parámetros legales en `src/components/legal-params-form.js`
- [ ] T032 [US3] [Persona 3] Integrar la validación por vigencia y su uso en el cálculo de planilla en `src/app.js`

**Punto de control**: La configuración legal queda separada del cálculo y puede cambiar en el tiempo sin romper registros anteriores.

---

## Fase 5: Historia de Usuario 4 - Período de remuneraciones y novedades (Prioridad: P1)

**Objetivo**: Abrir períodos, registrar novedades y mantener el proceso de aprobación para la liquidación.

**Prueba Independiente**: El sistema abre un período, acepta novedades por trabajador y puede diferenciar lo aprobado de lo pendiente.

### Implementación para US4

- [ ] T040 [P] [US4] [Persona 4] Definir la entidad de período y novedades en `src/storage.js`
- [ ] T041 [P] [US4] [Persona 4] Crear el formulario de novedades y el flujo de aprobación en `src/components/payroll-form.js`
- [ ] T042 [US4] [Persona 4] Conectar el ciclo de vida del período y la validación de novedades en `src/app.js`

**Punto de control**: El flujo de novedades queda funcional y disponible para la parte de cálculo.

---

## Fase 6: Historia de Usuario 5 - Liquidaciones y cálculo de remuneración (Prioridad: P1)

**Objetivo**: Generar liquidaciones con cálculos explicables y totales por período.

**Prueba Independiente**: El sistema calcula una liquidación con bases, descuentos e impuestos desde los parámetros vigentes del período.

### Implementación para US5

- [ ] T050 [P] [US5] [Persona 5] Definir la estructura de liquidación y líneas de cálculo en `src/storage.js`
- [ ] T051 [US5] [Persona 5] Implementar el motor de cálculo de remuneración en `src/app.js` o en un módulo dedicado `src/payroll-calculator.js`
- [ ] T052 [US5] [Persona 5] Crear la vista de detalle de liquidación y estados en `src/components/payroll-summary.js`

---

## Fase 7: Historia de Usuario 6 - Panel principal, auditoría y reportes (Prioridad: P2)

**Objetivo**: Entregar una vista operativa con alertas globales, auditoría y resúmenes del módulo.

**Prueba Independiente**: Desde el panel principal, el usuario identifica contratos por vencer, liquidaciones pendientes y cambios con trazabilidad.

### Implementación para US6

- [ ] T060 [P] [US6] [Persona 6] Diseñar el panel principal y tarjetas de resumen en `src/components/dashboard.js`
- [ ] T061 [US6] [Persona 6] Integrar auditoría y trazabilidad de cambios en `src/app.js` y `src/storage.js`
- [ ] T062 [US6] [Persona 6] Validar reportes y estado general del módulo en `src/components/report-panel.js`

---

## Fase 8: Polish y validación final del equipo

**Propósito**: Revisión cruzada, corrección de inconsistencias y preparación de entrega.

- [ ] T100 [P] [CROSS] [Equipo] Revisar coherencia entre trabajadores, contratos, parámetros y liquidaciones
- [ ] T101 [P] [CROSS] [Equipo] Validar pruebas unitarias e integración de las historias principales
- [ ] T102 [CROSS] [Equipo] Revisar UX, mensajes visibles y estados de error del módulo
- [ ] T103 [CROSS] [Equipo] Preparar entrega final y checklist de cierre para el proyecto grupal

---

## Dependencias y orden lógico

- **Fase 1**: no depende de ninguna historia.
- **US1**: puede arrancar en paralelo con la base compartida.
- **US2**: depende de la base y puede avanzar en paralelo con US1.
- **US3 / US4 / US5**: dependen de la base y del flujo principal del módulo, pero cada una puede entregarse en paralelo si el equipo está distribuido.
- **US6**: depende de que existan datos reales en la aplicación.
- **Fase 8**: depende de que todas las historias principales estén integradas.

## Recomendación para trabajo grupal

- Asignar una historia principal por persona.
- Mantener cada historia como un entregable independiente.
- Usar esta estructura para reuniones de equipo, revisión de PR y control de avance.
- No se debe “editar el archivo completo” salvo para integrar una historia terminada o cambiar la coordinación general del proyecto.

## MVP recomendado

Si el equipo quiere una entrega mínima con riesgo controlado, el orden sugerido es:
1. US1 — Ficha del trabajador
2. US2 — Contratos y alertas de plazo
3. US3 — Parámetros legales
4. US4 — Períodos y novedades
5. US5 — Liquidaciones

Este orden mantiene la funcionalidad central del módulo y deja al panel y auditoría como cierre de la fase final.

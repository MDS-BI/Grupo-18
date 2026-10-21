# Implementation Plan: Módulo de Recursos Humanos (RR. HH.)

**Branch**: `001-erp-base-module` | **Date**: 2026-10-20 | **Spec**: [spec.md](../../specs/001-erp-base-module/spec.md)

**Input**: Feature specification from `/specs/001-erp-base-module/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Construir una aplicación web ligera con Vite que funcione como módulo de Recursos Humanos sobre la base ERP existente. Los empleados se gestionan mediante **dos módulos de información que comparten el RUT como identificador único**:

- **Módulo de Datos Personales**: nombre, RUT, dirección, fecha de nacimiento, correo electrónico y contacto de emergencia.
- **Módulo de Datos Laborales**: identificado por el mismo RUT; contiene sueldo base (subinformación: total de haberes, descuentos con su origen — AFP, sistema de salud, seguro de cesantía y otros, con motivo —, total de descuentos y sueldo líquido), estado laboral (`Activo` / `Inactivo`) y contrato (subinformación: inicio de contrato, fin de contrato y tipo de contrato).

Ciclo de vida del empleado: **alta** desde un formulario en blanco (con validación completa antes de crear el par de registros), **edición** en cualquier momento, **cambio de estado** entre Activo e Inactivo (el registro inactivo se conserva íntegro y sigue visible en listas y búsquedas, solo cambia su estado) y **eliminación definitiva** sujeta a requisitos, con borrado en cascada de todos los datos asociados para no dejar registros huérfanos.

Enfoque técnico: se conserva la base ERP (marco de espacio de trabajo con barra superior + barra lateral, panel de inicio con acciones rápidas y estadísticas, CRUD con HTML/CSS/JavaScript vanilla y persistencia en localStorage). El par entidad/documento del módulo base se interpreta como el par **entidad = Datos Personales** y **documento = Datos Laborales**, de modo que el código central de CRUD, búsqueda e integridad referencial funcione sin cambios; el RUT cumple el papel de identidad pública compartida. Toda la adaptación al dominio vive en `src/module-config.js`.

### Modelo de información

| Módulo | Campos |
|---|---|
| Datos Personales (identificador: RUT) | `nombre` (string, obligatorio), `rut` (string, obligatorio y único), `direccion` (string), `fechaNacimiento` (string, YYYY-MM-DD), `correoElectronico` (string, formato válido), `contactoEmergencia` (string) |
| Datos Laborales (identificador compartido: RUT) | `rut` (debe corresponder a un RUT de Datos Personales), `sueldoBase` (objeto: `totalHaberes` number ≥ 0, `descuentos` objeto: `afp` porcentaje 0–100, `salud` porcentaje 0–100, `cesantia` porcentaje 0–100, `otros` objeto: `monto` number ≥ 0 y `motivo` string, `totalDescuentos` number ≥ 0 derivado, `sueldoLiquido` number ≥ 0 derivado), `estadoLaboral` (enum `activo` | `inactivo`, obligatorio, por defecto `activo`), `contrato` (objeto: `inicio` YYYY-MM-DD, `fin` YYYY-MM-DD ≥ inicio, `tipo` string) |

Reglas clave: los bloques `sueldoBase` y `contrato` se persisten como objetos anidados y se validan por subcampo (mensajes con la ruta exacta, p. ej. `sueldoBase.descuentos.afp`); la integridad RUT es bidireccional (no existe registro laboral sin personal ni viceversa, y eliminar uno elimina el otro); las búsquedas cubren nombre, RUT, correo, estado laboral y tipo de contrato.

### Cálculo automático del sueldo líquido

El sueldo líquido nunca se ingresa a mano: se deriva de los descuentos al editar cualquier campo de `sueldoBase` y se recalcula antes de persistir y al renderizar el formulario (actualización en vivo mientras se tipea):

1. Base imponible = `totalHaberes`.
2. Descuento por origen = imponible × porcentaje / 100, aplicado a cada tramo (`descuentos.afp`, `descuentos.salud`, `descuentos.cesantia`).
3. `descuentos.otros` no usa porcentaje: se descuenta su `monto` directamente y `motivo` (obligatorio cuando `monto` > 0) documenta el origen (préstamo, días no trabajados, ausencias, etc.).
4. `totalDescuentos` = suma de los tres tramos porcentuales + `otros.monto`; `sueldoLiquido` = `totalHaberes` − `totalDescuentos`.
5. Si `totalDescuentos` supera `totalHaberes`, `sueldoLiquido` se fija en 0 y la interfaz muestra una advertencia (no un error de validación), para no bloquear el ingreso de datos.
6. Porcentajes opcionales: un tramo en 0 o vacío no descuenta nada y `motivo` solo es obligatorio cuando `otros.monto` > 0. `totalDescuentos` y `sueldoLiquido` se guardan calculados para que búsquedas y listas no tengan que recalcular.

### Ciclo de vida: alta, estado y eliminación en cascada

**Alta de empleados**

- Acción "Nuevo empleado" desde el panel de inicio y desde la lista; abre el formulario de Datos Personales en blanco y, tras guardar, encadena el de Datos Laborales (par de registros creado de forma atómica: o se crean ambos o ninguno).
- Validación completa antes de crear (obligatorios, formato RUT/correo/fechas); el RUT nuevo no puede existir ya en ninguno de los dos módulos.

**Estado Activo / Inactivo**

- `estadoLaboral` es un selector de dos opciones (`activo` | `inactivo`) con valor inicial `activo`; se cambia desde la lista o desde el formulario de Datos Laborales sin requerir edición de otros campos.
- El empleado **Inactivo conserva todos sus datos** (personales, laborales, descuentos y contrato): se distingue en la lista mediante un distintivo visual, entra en las estadísticas del panel como inactivo y sigue siendo consultable por búsqueda; no se borra nada ni quedan campos vacíos, porque el estado es un dato más del registro.

**Eliminación definitiva (con requisitos)**

1. El empleado debe estar **Inactivo**; si está Activo, la acción "Eliminar" se informa bloqueada con el mensaje "primero cambie el estado a Inactivo" (requisito que evita bajas accidentales).
2. **Confirmación explícita** en un diálogo que muestra nombre y RUT, requiriendo un paso adicional de confirmación antes de proceder.
3. **Borrado en cascada**: se eliminan en la misma operación Datos Personales, Datos Laborales (incluidos `sueldoBase.descuentos` y `contrato`), las referencias por RUT en índices de búsqueda y las estadísticas del panel. Verificación post-eliminación: ningún registro en localStorage referencia un RUT inexistente → **cero datos huérfanos**.
4. No hay desactivación parcial: si el segundo paso del par fallara, la operación completa se revierte (rollback sobre el snapshot previo) para no dejar un registro sin su contraparte.

## Technical Context

**Language/Version**: JavaScript (ES2022), HTML, CSS

**Primary Dependencies**: Vite, sin framework de interfaz pesado

**Storage**: localStorage del navegador (instancia única del módulo)

**Testing**: Vitest con jsdom para pruebas unitarias y de interacción

**Target Platform**: Navegadores modernos de escritorio y móviles

**Project Type**: web application

**Performance Goals**: Interacciones responsivas para listas de hasta 500 registros; búsqueda y actualizaciones de interfaz instantáneas

**Constraints**: Huella mínima de librerías, despliegue simple, sin backend requerido; los campos base y sus nombres deben mantenerse intactos para no romper almacenamiento ni pruebas existentes

**Scale/Scope**: Módulo de RR. HH. con CRUD completo de empleados (alta, edición, estado Activo/Inactivo y eliminación en cascada con requisitos) sobre dos módulos de información (personales + laborales), campos anidados, cálculo automático de sueldo líquido, búsqueda y navegación

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Calidad**: Estructura JavaScript pequeña y modular, con límites de función claros y nomenclatura consistente; almacenamiento, identidad por RUT e integridad referencial separados de la lógica específica de RR. HH.
- **Pruebas**: Flujos de crear, editar, eliminar y buscar cubiertos por pruebas automatizadas, incluyendo validación de bloques anidados, el vínculo RUT entre módulos, el cálculo de `totalDescuentos`/`sueldoLiquido` a partir de los porcentajes (AFP, salud, cesantía) y de `otros.monto` con su `motivo`, el alta atómica del par de registros, el cambio Activo/Inactivo y los requisitos de eliminación con verificación de que no queda ningún dato huérfano.
- **Experiencia de Usuario**: Mensajes de validación claros (con la ruta del campo anidado), estados vacíos y comportamiento de formulario consistente dentro del marco de espacio de trabajo (barra superior + barra lateral) idéntico en todas las pantallas; el sueldo líquido se muestra recalculado en vivo y con la advertencia cuando los descuentos exceden los haberes; la eliminación informa sus requisitos (estado Inactivo y confirmación con nombre y RUT).
- **Rendimiento**: Búsqueda y renderizado de listas optimizados para hasta 500 registros con actualizaciones ligeras del DOM.

**Resultado**: PASS — sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/001-erp-base-module/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main.js
├── styles.css
├── storage.js
├── app.js
├── module-config.js      # Terminología RR. HH., campos de Datos Personales y Datos Laborales (incluidos anidados), ciclo de vida, acento
└── components/
    ├── shell.js          # Marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, módulo activo
    ├── dashboard.js      # Vista de inicio: acciones rápidas (incluida "Nuevo empleado") + tarjetas de estadísticas en vivo (activos / inactivos)
    ├── entity-form.js    # Formulario de Datos Personales (alta en blanco o edición): nombre, RUT, dirección, fecha de nacimiento, correo, contacto de emergencia
    ├── document-form.js  # Formulario de Datos Laborales: haberes, descuentos por origen (AFP, salud, cesantía, otros con motivo) con cálculo en vivo de total y líquido, estado laboral Activo/Inactivo, contrato anidado, ligado por RUT
    └── entity-list.js    # Lista y búsqueda de empleados: distintivo Activo/Inactivo, cambiar estado, editar y eliminar con requisitos (inactivo + confirmación, cascada)

tests/
├── unit/
├── integration/
└── setup/
```

**Structure Decision**: Aplicación Vite de un solo proyecto (opción por defecto) con un único punto de entrada HTML, módulos JavaScript pequeños y CSS en un archivo separado, persistiendo en localStorage. Se aprovecha el par entidad/documento existente para alojar los dos módulos de RR. HH. (entidad = Datos Personales, documento = Datos Laborales), de modo que `storage.js`, `app.js` y las pruebas de CRUD/búsqueda se reutilizan sin cambios de código central; `module-config.js` centraliza la adaptación al dominio y `styles.css` controla el acento mediante propiedades personalizadas de CSS.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(ninguna)* | — | — |

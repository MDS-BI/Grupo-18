# Inicio Rápido: Módulo de Recursos Humanos y Planilla

## Configuración

1. Instale las dependencias con `npm install`.
2. Inicie el servidor de desarrollo con `npm run dev`.
3. Abra la URL local de Vite en un navegador.

## Flujo de RR.HH. y Planilla

1. Inicie sesión con **rol y clave demo** (ej. administrador/admin123). Use el botón **Cerrar sesión** en el encabezado para salir. Para usar otro rol, cierre sesión e ingrese de nuevo.
2. Si ingresa como **Jefatura** o **Trabajador**, seleccione el **Trabajador representado** cuando el sistema lo solicite (jefatura: equipo permitido; Trabajador: propio, activo o desvinculado según reglas).
3. Con rol Administrador, cargue un conjunto completo de parámetros legales (UF, UTM, IMM, tasas, topes y tramos) para un mes y año. El conjunto se bloquea desde su primer uso.
4. Cree fichas/contratos según permisos; registre novedades y siga el flujo de aprobación/cálculo/cierre como antes (ver secciones siguientes de este documento).
3. Cree o abra la ficha de un Trabajador y registre su contrato con sueldo base, jornada, tipo y vigencia. Si cambia el sueldo, registre un nuevo contrato o anexo sin sobrescribir el anterior.
4. Abra el período mensual en `Planilla` y registre las novedades del mes (horas extra, licencias médicas o ausencias). Las licencias solo guardan tipo y días, sin diagnósticos.
5. Con rol Jefatura, apruebe o rechace las novedades pendientes. Con rol Analista no se permite aprobar; una novedad rechazada puede corregirse y reenviarse.
6. Ejecute el cálculo del período. El sistema valida contratos vigentes, novedades aprobadas y parámetros legales vigentes, y genera una liquidación por trabajador con líneas explicables.
7. Verifique el caso de referencia: sueldo base $1.200.000, 42 h, 5 horas extra, FONASA, AFP 11,27 %, IMM $553.553 y UTM $71.649 deben producir $1.272.908 líquidos y $1.659.456 de costo empleador.
8. Abra la vista de liquidación, seleccione una línea para ver base, tasa o fórmula y parámetro legal con el mes/año del conjunto aplicado, y use Imprimir / Guardar en PDF.
9. Cierre el período con rol Jefatura. El cierre congela UF, UTM, IMM y parámetros, y bloquea la edición o recálculo de liquidaciones y novedades.
10. Consulte la auditoría (solo rol administrador/a de RR.HH.) para ver consultas/cambios de datos sensibles, accesos denegados, cambios de rol y operaciones de respaldo, además de cálculo, aprobación, pago y anulación.

### Validación de RR.HH.

- Una liquidación no se genera para un trabajador sin contrato vigente en el período.
- Solo las novedades aprobadas se incluyen en el cálculo; las pendientes o rechazadas se excluyen con aviso.
- Un período cerrado no permite registrar, editar, aprobar, rechazar ni recalcular.
- Un conjunto de parámetros legales cargado para otro mes/año afecta solo a los períodos posteriores; el conjunto ya usado permanece bloqueado.
- Un trabajador con liquidaciones aprobadas o pagadas no se elimina; solo se da de baja lógica.
- Visibilidad por rol: la jefatura ve datos básicos y gestiona novedades de su equipo (incluidas licencias médicas sin diagnóstico clínico), pero tiene ocultos/bloqueados contratos, sueldos base y liquidaciones; el Trabajador (activo o desvinculado) solo ve sus propias liquidaciones de períodos cerrados. Cada consulta sensible, acceso denegado y cambio de rol queda auditado.

### Validación de respaldo y restauración

- Exporte el respaldo JSON y verifique que incluye `schemaVersion`, `exportedAt` y las tablas del espacio de trabajo (base y RR.HH., incluida auditoría). La exportación queda registrada en la bitácora.
- Importe un respaldo válido y confirme que los datos operativos se restauran, que la importación queda registrada en la bitácora y que **no se sobrescriben ni eliminan** los registros previos de auditoría (solo inserción preservada).
- Intente importar un JSON inválido y verifique que se rechaza sin alterar los datos existentes ni la bitácora.
- Cancele la confirmación de restauración y verifique que no se escribe nada.

### Registro de verificación

Fecha: 2026-11-23.

- `npm run test:run`: 43 archivos y 339 pruebas aprobadas, incluyendo la suite
  de integración de US5 sin cambios en su contrato DOM/CSS.
- US5: desglose por línea, panel explicativo, snapshot legal congelado, líneas
  manuales, modo de impresión limpia, cancelación de impresión y estados sin
  impresión verificados por las pruebas de integración de liquidación.
- US3: registro con privacidad, licencia médica sin datos clínicos, aprobación
  y rechazo con motivo, reenvío, bloqueo por período cerrado, alcance de
  Jefatura, cierre de período y cascada de baja verificados.
- US4: caso de referencia con líquido `$1.272.908` y costo empleador
  `$1.659.456`, redondeo por línea, parámetros versionados, cierre con snapshot
  congelado, ciclo de vida y cálculo de 200 trabajadores en menos de un segundo
  verificados.
- US6: matriz de roles, datos sensibles, bitácora de solo inserción, auditoría
  automática de consultas y cambios, y denegaciones auditadas verificadas.
- La bitácora rechaza edición y eliminación; registra valores anteriores y nuevos
  de campos no sensibles, y para montos, cuentas bancarias, cuotas sindicales y
  demás datos sensibles guarda el campo cambiado y `[REDACTADO]` en lugar del contenido.
- Clarificaciones 2026-11-08: sesión simulada, parámetros manuales, retención de
  auditoría de 6 años y respaldo/restauración JSON reflejados en plan, research,
  modelo de datos, contratos y este inicio rápido.

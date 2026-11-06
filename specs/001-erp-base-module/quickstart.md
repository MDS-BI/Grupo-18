# Inicio Rápido: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Configuración

1. Instale las dependencias con `npm install`.
2. Inicie el servidor de desarrollo con `npm run dev`.
3. Abra la URL local de Vite en un navegador.

## Flujo de Usuario Principal

1. Aterrice en el panel ERP y use un botón de acción rápida (nueva entidad, nuevo documento, gestión de entidades o buscar registros).
2. Cree una entidad usando el formulario.
3. Busque una entidad usando la pantalla de búsqueda.
4. Edite o elimine una entidad desde el área de gestión.
5. Cambie entre módulos usando la barra lateral; actualice la página para confirmar que las entidades persisten en el almacenamiento local y que el marco con marca (logotipo, nombre del módulo) permanece consistente.

## Validación

- Verifique que los campos obligatorios muestran errores de validación.
- Verifique que un documento exige folio entero positivo y que el descuento no puede superar el subtotal.
- Verifique que un correo electrónico con formato inválido se rechaza con una explicación.
- Verifique que los resultados de búsqueda se actualizan a medida que el usuario escribe.
- Verifique que la lista permanece consistente tras las acciones de edición y eliminación.
- Verifique que las estadísticas del panel coinciden con el número de registros almacenados.

## Extender el Módulo Base

Los módulos ERP personalizados adaptan la base mediante un único archivo de configuración (`src/module-config.js`) en lugar de editar el código central:

1. Establezca el nombre del módulo y los mapeos de términos (p. ej., Entidad → Cliente, Documento → Pedido de Venta); cada pantalla se reetiqueta, incluida la barra lateral y el logotipo.
2. Declare campos personalizados por tipo de registro (texto, número, fecha, selección) — aparecen automáticamente en formularios, listas, validación y búsqueda.
3. Defina el ciclo de vida de estados de documentos y las transiciones permitidas (p. ej., cotización → pedido → facturado).
4. Opcionalmente establezca `theme.accentColor` para remarcar los resaltados y controles principales de todo el espacio de trabajo.
5. Añada reglas de validación específicas del módulo junto a las reglas base donde sea necesario.

La generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, eliminación en cascada, navegación y búsqueda siguen siendo gestionadas por el módulo base. Sin archivo de configuración, la aplicación se ejecuta con el comportamiento predeterminado Entidad/Documento. Consulte `specs/001-erp-base-module/` para la especificación completa.

## Flujo de RR.HH. y Planilla

1. Cree o abra un trabajador (Entidad) y registre su contrato con sueldo base, jornada, tipo y vigencia. Si cambia el sueldo, registre un nuevo contrato o anexo sin sobrescribir el anterior.
2. Abra el período mensual en `Planilla` y registre las novedades del mes (horas extra, licencias médicas o ausencias). Las licencias solo guardan tipo y días, sin diagnósticos.
3. Con rol Jefatura, apruebe o rechace las novedades pendientes. Con rol Analista no se permite aprobar; una novedad rechazada puede corregirse y reenviarse.
4. Ejecute el cálculo del período. El sistema valida contratos vigentes, novedades aprobadas y parámetros legales vigentes, y genera una liquidación por trabajador con líneas explicables.
5. Verifique el caso de referencia: sueldo base $1.200.000, 42 h, 5 horas extra, FONASA, AFP 11,27 %, IMM $553.553 y UTM $71.649 deben producir $1.272.908 líquidos y $1.659.456 de costo empleador.
6. Abra la vista de liquidación, seleccione una línea para ver base, tasa o fórmula y parámetro legal con vigencia, y use Imprimir / Guardar en PDF.
7. Cierre el período con rol Jefatura. El cierre congela UF, UTM, IMM y parámetros, y bloquea la edición o recálculo de liquidaciones y novedades.
8. Consulte la auditoría para ver cálculo, aprobación, pago, anulación y consultas de datos sensibles.

### Validación de RR.HH.

- Una liquidación no se genera para un trabajador sin contrato vigente en el período.
- Solo las novedades aprobadas se incluyen en el cálculo; las pendientes o rechazadas se excluyen con aviso.
- Un período cerrado no permite registrar, editar, aprobar, rechazar ni recalcular.
- Un cambio de parámetro legal con nueva vigencia afecta solo a los períodos posteriores.
- Un trabajador con liquidaciones aprobadas o pagadas no se elimina; solo se da de baja lógica.
- Los roles Jefatura no ven sueldos, datos bancarios ni conceptos sensibles; cada consulta sensible queda auditada.

### Registro de verificación

Fecha: 2026-11-06.

- `npm run test:run`: 39 archivos y 298 pruebas aprobadas, incluyendo la suite
  de integración de HU5 sin cambios en su contrato DOM/CSS.
- HU5: desglose por línea, panel explicativo, snapshot legal congelado, líneas
  manuales, modo de impresión limpia, cancelación de impresión y estados sin
  impresión verificados por las pruebas de integración de liquidación.
- HU14: registro con privacidad, licencia médica sin datos clínicos, aprobación
  y rechazo con motivo, reenvío, bloqueo por período cerrado, alcance de
  Jefatura, cierre de período y cascada de baja verificados.
- HU15: caso de referencia con líquido `$1.272.908` y costo empleador
  `$1.659.456`, redondeo por línea, parámetros versionados, cierre con snapshot
  congelado, ciclo de vida y cálculo de 200 trabajadores en menos de un segundo
  verificados.
- HU6: matriz de roles, datos sensibles, bitácora de solo inserción, auditoría
  automática de consultas y cambios, y denegaciones auditadas verificadas.
- La bitácora rechaza edición y eliminación; no almacena montos, cuentas
  bancarias ni cuotas sindicales, solo la acción, el actor y el registro afectado.

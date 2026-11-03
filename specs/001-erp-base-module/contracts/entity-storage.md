# Contrato de Almacenamiento de Entidades

## Propósito

La aplicación almacena los registros de entidad localmente en el navegador usando `localStorage`.

## Forma de los Datos

Cada registro de entidad debe incluir:

- `id`: cadena única
- `entity_id`: cadena única, generada automáticamente, usada para vincular documentos
- `name`: cadena no vacía
- `code`: cadena no vacía
- `taxId`: cadena opcional (identificación fiscal)
- `email`: cadena opcional con formato de correo válido cuando está presente
- `phone`: cadena opcional
- `address`: cadena opcional
- `category`: cadena opcional
- `description`: cadena opcional
- `targetDate`: cadena de fecha opcional (YYYY-MM-DD) válida cuando está presente
- `creditLimit`: número opcional no negativo
- `paymentTerms`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

## Operaciones

- `loadEntities()`: devuelve todas las entidades almacenadas.
- `saveEntities(entities)`: persiste la lista completa.
- `addEntity(entity)`: añade una nueva entidad.
- `updateEntity(id, updates)`: actualiza una entidad existente.
- `deleteEntity(id)`: elimina una entidad por id.

## Almacenamiento de Documentos

Cada registro de documento debe incluir:

- `id`: cadena única
- `entity_id`: el entity_id autogenerado de la entidad vinculada
- `series`: cadena opcional que agrupa folios consecutivos
- `folio`: entero positivo obligatorio; junto con la serie forma el número oficial del documento
- `startDate`: cadena de fecha de calendario válida
- `endDate`: cadena de fecha de calendario válida, igual o posterior a startDate
- `quantity`: entero positivo opcional
- `subtotal`: número no negativo opcional
- `discount`: número no negativo opcional; no puede superar el subtotal
- `taxAmount`: número no negativo opcional
- `totalAmount`: número no negativo opcional
- `currency`: cadena opcional
- `paymentTerms`: cadena opcional
- `notes`: cadena opcional
- `status`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

Operaciones:

- `loadDocuments()`: devuelve todos los documentos almacenados.
- `saveDocuments(documents)`: persiste la lista completa.
- `addDocument(document)`: añade un nuevo documento.
- `updateDocument(id, updates)`: actualiza un documento existente.
- `deleteDocument(id)`: elimina un documento por id.
- `deleteDocumentsForEntity(entityId)`: elimina todos los documentos vinculados a una entidad eliminada.

## Expectativas de Validación

- Un `name` o `code` faltante debe rechazarse antes de la persistencia.
- Un `email` presente debe tener formato de correo válido y un `creditLimit` presente debe ser un número no negativo.
- Un documento sin `folio` entero positivo debe rechazarse; un `discount` mayor que el `subtotal` debe rechazarse.
- Un entity_id debe generarse automáticamente y debe ser único.
- Un documento sin un `entity_id` que coincida con una entidad existente debe rechazarse.
- Eliminar una entidad también debe eliminar todos los documentos vinculados a su entity_id.
- Las operaciones de almacenamiento deben preservar el orden actual de la lista y actualizar las marcas de tiempo.

## Expectativas de Extensibilidad

- Los campos adicionales añadidos por módulos personalizados deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento.
- Las operaciones base anteriores permanecen estables para que los módulos personalizados puedan construir sobre ellas sin modificación.

## Contrato de Almacenamiento RR.HH. y Planilla

La extensión de Recursos Humanos usa las mismas garantías de identidad, marcas de tiempo e integridad referencial de la base, con tablas propias bajo el prefijo `erp_rrhh:*`. El detalle del MER está en `specs/002-rrhh-planilla/data-model.md`.

### Claves y operaciones

- `erp_rrhh:contratos`: `loadContratos()`, `saveContratos()`, `addContrato()`, `updateContrato()`, `deleteContrato()`, `getContratoVigente(entityId, fecha)`.
- `erp_rrhh:periodos`: `loadPeriodos()`, `savePeriodos()`, `addPeriodo()`, `updatePeriodo()`, `cerrarPeriodo(periodoId, usuario)`, `getPeriodo(anio, mes)`.
- `erp_rrhh:novedades`: `loadNovedades()`, `saveNovedades()`, `addNovedad()`, `updateNovedad()`, `deleteNovedad()`, `listNovedadesPorPeriodo(periodoId)`, `listNovedadesAprobadas(periodoId)`.
- `erp_rrhh:conceptos`: `loadConceptos()`, `saveConceptos()`, `addConcepto()`, `updateConcepto()`.
- `erp_rrhh:parametros` y `erp_rrhh:tramos-impuesto`: `loadParametros()`, `getParametroVigente(codigo, fecha)`, `getTramoImpuesto(baseUtm, fecha)`.
- `erp_rrhh:liquidaciones` y `erp_rrhh:lineas-liquidacion`: `loadLiquidaciones()`, `saveLiquidaciones()`, `addLiquidacion()`, `updateLiquidacion()`, `getLiquidacion(entityId, periodoId)`, `saveLineas()`, `listLineas(liquidacionId)`.
- `erp_rrhh:auditoria`: `appendAuditoria(registro)` de solo inserción; no se actualiza ni elimina.

### Invariantes

- Toda novedad, contrato y liquidación debe referenciar un `entity_id` existente.
- Una liquidación pertenece a exactamente un trabajador y un período; no puede haber duplicados para el mismo par.
- Solo novedades aprobadas se incluyen en el cálculo; las pendientes o rechazadas se excluyen y se informan.
- Un período cerrado es de solo lectura: no se recalculan liquidaciones ni se modifican novedades.
- Cada línea conserva el snapshot del parámetro legal usado (código, valor aplicado, vigencia y fuente).
- Al calcular se persiste primero la liquidación y luego sus líneas; si falla una escritura, no debe quedar una liquidación sin líneas.
- La eliminación de un trabajador sin liquidaciones cerradas elimina en cascada contratos, novedades y liquidaciones; con liquidaciones aprobadas o pagadas solo se permite baja lógica.
- La auditoría registra cálculo, aprobación, pago, anulación y consultas de datos sensibles, sin almacenar los valores sensibles.

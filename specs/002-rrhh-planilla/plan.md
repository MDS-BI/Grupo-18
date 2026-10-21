# Plan de Trabajo: Módulo de Recursos Humanos y Planilla (Remuneraciones)

**Grupo**: 18 | **Rama**: `002-rrhh-planilla` | **Fecha**: 2026-10-20
**Estructura base**: [`specs/001-erp-base-module`](../001-erp-base-module/plan.md)
**Modelo de datos**: [data-model.md](data-model.md) · **MER**: [mer.png](mer.png) / [mer-resumen.png](mer-resumen.png)
**Siguiente artefacto Speckit**: `spec.md` (a generar con `/speckit.specify` a partir de este plan)

---

## 1. Resumen

Construiremos, sobre el módulo base del ERP, un módulo de **Recursos Humanos y Planilla** que permita a una PyME chilena llevar la ficha de su personal, sus contratos y las novedades del mes (horas extra, licencias, vacaciones, bonos, anticipos), y **calcular, aprobar y emitir las liquidaciones de sueldo mensuales** con las reglas legales chilenas: cotizaciones de AFP, salud y seguro de cesantía, gratificación legal, impuesto único y aportes del empleador.

El módulo reutiliza la base sin modificar su código central: la **Entidad** pasa a ser el **Trabajador** y el **Documento** pasa a ser la **Liquidación de Sueldo**. Se agregan tablas de extensión (contratos, períodos, novedades, conceptos, líneas de liquidación y parámetros legales) en su propio espacio de `localStorage`. Los valores legales se guardan como **parámetros con fecha de vigencia**, de modo que un cambio de ley (por ejemplo, el alza del aporte del empleador de la reforma de pensiones) se resuelve agregando un registro, no reprogramando.

Además del cálculo, el diseño incluye **gobierno de datos**: clasificación de cada campo (interno, confidencial, sensible), permisos por rol, bitácora de auditoría y reportes de equidad salarial que protegen el anonimato. El objetivo es que el sistema no reproduzca sesgos (por ejemplo, de género o por licencias médicas) en las decisiones sobre las personas.

## 2. Problema y propuesta de valor

**Problema.** En muchas Pymes o Empresas las remuneraciones se calculan en planillas Excel: fórmulas copiadas mes a mes, parámetros legales escritos a mano (que cambian varias veces al año), sin historial de quién modificó qué, y con datos personales y de salud guardados sin control de acceso. Los errores de cálculo generan multas, reclamos de trabajadores y diferencias con la contabilidad.

**Propuesta.** Un módulo que:

1. Centraliza la ficha del trabajador y su contrato vigente.
2. Recoge las novedades del mes con un flujo de aprobación (jefatura → RR.HH.).
3. Calcula las liquidaciones de todo un período con un clic, mostrando cada línea y su fórmula (cálculo explicable).
4. Congela el período al cerrarlo (UF, UTM, ingreso mínimo y parámetros quedan fijos) para que una liquidación pagada no cambie después.
5. Entrega a otros módulos del ERP el costo de la planilla por centro de costo y la nómina de pago.
6. Protege los datos sensibles por diseño (Ley 21.719 de Protección de Datos Personales, vigente desde el 1 de diciembre de 2026).

## 3. Cliente y usuarios

**Cliente objetivo**: Pyme chilena de 20 a 200 trabajadores (por ejemplo, una empresa de servicios o comercio en el Gran Concepción) que hoy calcula sueldos en Excel o terceriza todo en un contador externo.

| Usuario | Necesidad principal | Qué hace en el módulo |
|---|---|---|
| **Administrador/a de RR.HH.** (usuario principal) | Mantener los datos del personal al día y pagar a tiempo y sin errores | Fichas, contratos, catálogos, parámetros legales, apertura y cierre del período |
| **Analista de remuneraciones** | Calcular la planilla rápido y poder explicar cada monto | Registra novedades, calcula y revisa liquidaciones, corrige líneas manuales con motivo |
| **Jefatura de área** | Que las horas extra y ausencias de su equipo se paguen bien | Ingresa o aprueba las novedades de su equipo (no ve sueldos) |
| **Gerencia / Finanzas** | Controlar el costo de personal | Revisa los totales por centro de costo y aprueba el cierre |
| **Contador/a externo** | Hacer el asiento contable y las declaraciones | Exporta el resumen contable y el libro de remuneraciones |
| **Trabajador/a** (fase futura) | Ver su liquidación y sus datos | Portal de autoservicio de solo lectura |

## 4. Alcance del MVP

### 4.1 Incluido (Prioridad P1)

| # | Funcionalidad | Tablas del MER |
|---|---|---|
| F1 | Ficha del trabajador: crear, editar, buscar, dar de baja (baja lógica) | TRABAJADOR |
| F2 | Contratos con historial y alerta de vencimiento de plazo fijo | CONTRATO, CARGO |
| F3 | Catálogos: departamentos/centros de costo, cargos con banda salarial, instituciones previsionales, conceptos de remuneración | DEPARTAMENTO, CARGO, INSTITUCION_PREVISIONAL, CONCEPTO_REMUNERACION |
| F4 | Parámetros legales versionados por fecha de vigencia, con datos iniciales precargados | PARAMETRO_LEGAL, TRAMO_IMPUESTO |
| F5 | Período de remuneraciones: abrir → calcular → cerrar (congela UF, UTM e ingreso mínimo) | PERIODO_REMUNERACION |
| F6 | Novedades del mes con aprobación | NOVEDAD |
| F7 | **Motor de cálculo** de liquidaciones (sección 6) y vista detallada línea por línea | LIQUIDACION, LINEA_LIQUIDACION |
| F8 | Ciclo de vida de la liquidación: borrador → calculada → aprobada → pagada / anulada | LIQUIDACION.status |
| F9 | Liquidación imprimible (vista lista para imprimir o guardar como PDF desde el navegador) | LIQUIDACION, LINEA_LIQUIDACION |
| F10 | Panel principal de RR.HH. (sección 5.1) | Todas |
| F11 | Bitácora de auditoría y selector de rol simulado | REGISTRO_AUDITORIA |

### 4.2 Fase 2 (P2, si el tiempo alcanza antes de la entrega final)

- Cargas familiares y asignación familiar por tramos (CARGA_FAMILIAR, TRAMO_ASIGNACION_FAMILIAR).
- Registro de consentimientos por finalidad (CONSENTIMIENTO_DATOS).
- Reporte de brecha salarial de género por cargo, con ocultamiento de grupos pequeños.
- Exportación CSV del resumen contable y de la nómina de pago.

### 4.3 Fuera de alcance (desarrollo futuro)

Backend y autenticación real · archivo Previred y declaraciones al SII · finiquitos con cálculo de indemnizaciones · reclutamiento, evaluación de desempeño y capacitación · control de asistencia con marcaje (reloj control) · portal del trabajador.

## 5. Pantallas, menús y herramientas

El formato exigido (página principal, acciones/menús/herramientas, documentación, análisis de escalabilidad) se cubre así:

### 5.1 Página principal (Panel de RR.HH.)

- **Tarjetas**: dotación activa · costo de la planilla del último período cerrado · horas extra del mes · contratos por vencer en 30 días · liquidaciones pendientes de aprobar.
- **Acciones rápidas**: Nuevo trabajador · Registrar novedad · Calcular período · Ver liquidaciones · Buscar trabajador.
- **Alertas**: período abierto con novedades sin aprobar · trabajadores sin contrato vigente · sueldo base fuera de la banda del cargo · parámetro legal sin vigencia para el período.

### 5.2 Menú lateral

`Panel` · `Trabajadores` · `Contratos` · `Novedades` · `Planilla` (períodos y liquidaciones) · `Reportes` · `Configuración` (catálogos y parámetros legales) · `Auditoría`.

### 5.3 Herramientas clave

| Herramienta | Descripción |
|---|---|
| Asistente de cálculo del período | Valida requisitos (contratos vigentes, novedades aprobadas, parámetros vigentes), calcula todas las liquidaciones y muestra un resumen antes de confirmar |
| Vista "¿de dónde sale este monto?" | Cada línea de la liquidación muestra su base, su tasa o fórmula y el parámetro legal usado |
| Simulador de sueldo | Calcula líquido ↔ bruto para una oferta laboral sin guardar datos |
| Validador de RUT | Comprueba el dígito verificador al ingresar el RUT |
| Selector de rol | Cambia entre roles para mostrar qué datos ve cada uno (MVP simulado) |

## 6. Método de cálculo (motor de planilla)

Para cada trabajador con contrato vigente en el período (mes comercial de 30 días):

| Paso | Cálculo | Parámetro / tabla |
|---|---|---|
| 1 | Sueldo proporcional = sueldoBase × díasTrabajados / 30 | CONTRATO, NOVEDAD (licencias y ausencias restan días) |
| 2 | Valor hora extra = sueldoBase / 30 × 7 / jornadaSemanal × 1,5 | JORNADA, RECARGO_HORA_EXTRA |
| 3 | Gratificación (art. 50) = mín(25 % × haberes imponibles; 4,75 × IMM / 12) | TOPE_GRATIF_ANUAL_IMM, IMM |
| 4 | Total imponible = sueldo + horas extra + gratificación + bonos imponibles | CONCEPTO.imponible |
| 5 | Base de cotización = mín(imponible; 90 UF) — seguro de cesantía: mín(imponible; 135,2 UF) | TOPE_IMPONIBLE_*, valorUF del período |
| 6 | AFP = base × (10 % + comisión de la AFP) | INSTITUCION_PREVISIONAL |
| 7 | Salud = base × 7 % (FONASA) o el mayor entre 7 % y el plan Isapre en UF | TASA_SALUD_LEGAL, planIsapreUF |
| 8 | Seguro de cesantía del trabajador = 0,6 % (indefinido) o 0 % (plazo fijo) | TASA_AFC_* |
| 9 | Base tributable = imponible − AFP − salud (tope 7 %) − cesantía | — |
| 10 | Impuesto único = base × factor − rebaja, según el tramo en UTM | TRAMO_IMPUESTO, valorUTM |
| 11 | Descuentos voluntarios (anticipos, cuota sindical, etc.), con tope del 15 % de la remuneración | TOPE_DESC_VOLUNTARIOS |
| 12 | **Líquido** = haberes − descuentos − impuesto | — |
| 13 | Aportes del empleador = cesantía (2,4 % / 3,0 %) + aporte previsional de la reforma (3,5 % desde agosto 2026) + mutual | APORTE_EMP_*, MUTUAL |
| 14 | Costo empleador = haberes + aportes | — |

**Caso de prueba de referencia** (se convertirá en prueba automatizada). Contrato indefinido, sueldo base $1.200.000, jornada de 42 h, 5 horas extra, colación $50.000, movilización $40.000, AFP con comisión de 1,27 % (ejemplo), FONASA, IMM $553.553, UTM $71.649:

| Concepto | Monto |
|---|---|
| Sueldo base | 1.200.000 |
| Horas extra (5 × 10.000) | 50.000 |
| Gratificación (tope 4,75 IMM / 12) | 219.115 |
| **Total imponible** | **1.469.115** |
| Colación + movilización (no imponibles) | 90.000 |
| **Total haberes** (`subtotal`) | **1.559.115** |
| AFP 11,27 % | −165.569 |
| Salud 7 % | −102.838 |
| Seguro de cesantía 0,6 % | −8.815 |
| **Total descuentos** (`discount`) | **−277.222** |
| Base tributable (16,64 UTM → tramo 4 %) | 1.191.893 |
| Impuesto único (`taxAmount`) | −8.985 |
| **Líquido a pagar** (`totalAmount`) | **1.272.908** |
| Aportes del empleador (2,4 % + 3,5 % + 0,93 %) | 100.341 |
| **Costo empleador** | **1.659.456** |

Reglas de redondeo: cada línea se redondea al peso, y los totales se obtienen sumando las líneas ya redondeadas, para que lo impreso siempre cuadre.

## 7. Contexto técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS — igual que la base
**Dependencias principales**: Vite; sin frameworks adicionales
**Almacenamiento**: `localStorage`. Las tablas base usan `erp_base_module:*` y las de extensión `erp_rrhh:*`
**Pruebas**: Vitest + jsdom (unitarias para el motor de cálculo; de integración para los flujos)
**Plataforma**: navegadores modernos de escritorio (uso de oficina); responsivo para consultar desde el celular
**Tipo de proyecto**: aplicación web de una sola página (solo frontend)
**Rendimiento**: calcular un período de 200 trabajadores en menos de 1 segundo; listas de hasta 500 registros fluidas
**Restricciones**: no modificar el código central de la base; toda la adaptación pasa por `module-config.js` y por la carpeta `src/rrhh/`
**Escala**: 1 empresa, hasta 200 trabajadores y 24 períodos de historia en el MVP

## 8. Verificación de la constitución

| Principio | Cómo lo cumple el módulo |
|---|---|
| I. Calidad y mantenibilidad | Motor de cálculo en funciones puras (`calcularLiquidacion(trabajador, contrato, novedades, parametros)`) separado de la interfaz; parámetros legales en datos, no en código |
| II. Pruebas primero | Casos de cálculo de referencia (sección 6) escritos como pruebas antes del motor; pruebas de cada regla de integridad del MER |
| III. Experiencia consistente | Se reutiliza el shell, los formularios y los mensajes de la base; mismos patrones de validación y estados vacíos en español |
| IV. Rendimiento | Cálculo en memoria por período; se escribe a `localStorage` una vez por tabla al confirmar |

**Diferencia justificada**: la eliminación en cascada de la base se reemplaza por una baja lógica para trabajadores con liquidaciones cerradas, por la obligación legal de conservar los registros de remuneraciones (ver data-model.md §2.1).

## 9. Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/002-rrhh-planilla/
├── plan.md            ← este archivo
├── data-model.md      ← MER y diccionario de datos
├── mer.mmd / mer.png / mer.svg
├── mer-resumen.mmd / mer-resumen.png / mer-resumen.svg
├── spec.md            (siguiente: /speckit.specify)
├── research.md        (siguiente: decisiones y fuentes legales)
├── contracts/
│   ├── rrhh-storage.md        (operaciones de las tablas erp_rrhh:*)
│   └── integracion-modulos.md (datos que se entregan a otros módulos)
├── quickstart.md
└── tasks.md           (siguiente: /speckit.tasks)
```

### Código fuente

```text
src/
├── module-config.js          ← userConfig de RR.HH. (etiquetas, campos, ciclo de vida)
├── (archivos base sin cambios: main.js, app.js, storage.js, styles.css, components/)
└── rrhh/
    ├── storage-rrhh.js       (CRUD genérico de las tablas erp_rrhh:* con ids y marcas de tiempo)
    ├── seed.js               (parámetros legales, conceptos, instituciones y datos ficticios de demo)
    ├── calculo/
    │   ├── motor.js          (pasos 1–14, funciones puras)
    │   ├── parametros.js     (busca el valor vigente en una fecha)
    │   └── rut.js            (validación del RUT)
    ├── views/
    │   ├── panel-rrhh.js
    │   ├── contratos.js
    │   ├── novedades.js
    │   ├── planilla.js       (períodos, asistente de cálculo, lista de liquidaciones)
    │   ├── liquidacion.js    (detalle e impresión)
    │   ├── reportes.js
    │   ├── configuracion.js
    │   └── auditoria.js
    └── seguridad/
        ├── roles.js          (matriz rol × clasificación de datos)
        └── auditoria.js      (registro de solo inserción)

tests/
├── unit/rrhh/      (motor, parámetros, RUT, roles)
└── integration/rrhh/ (calcular período, aprobar novedad, cerrar período, baja lógica)
```

## 10. Integración con otros módulos del ERP

| Módulo | Qué entrega RR.HH. | Llave compartida |
|---|---|---|
| Contabilidad | Asiento de remuneraciones del período: Σ montos por `cuentaContable` × `centroCosto` | `DEPARTAMENTO.centroCosto`, `CONCEPTO.cuentaContable` |
| Finanzas / Tesorería | Nómina de pago: trabajador, banco, cuenta, líquido, fecha de pago | `entity_id`, `PERIODO.fechaPago` |
| Proyectos / Control de gestión | Costo empleador por centro de costo y por período | `centroCosto` |

El formato exacto se definirá en `contracts/integracion-modulos.md` y se coordinará con los grupos de esos módulos.

## 11. Riesgos de datos y sesgos

### 11.1 Datos sensibles (Ley 21.719)

| Riesgo | Medida en el diseño |
|---|---|
| Datos de salud (licencias médicas) | Solo se guardan tipo y días; **está prohibido registrar diagnósticos** (validación en el formulario y en la observación) |
| Afiliación sindical revelada por el descuento de cuota sindical | `CONCEPTO.esSensible = true` → solo RR.HH. ve esa línea y cada consulta queda en la auditoría |
| Datos bancarios y RUT | Clasificados como confidenciales; ocultos para jefaturas y gerencia |
| Información en `localStorage` sin cifrar | El MVP usa **solo datos ficticios** (seed). Para producción se documenta la necesidad de servidor, cifrado y autenticación |
| Uso de un dato para otra finalidad | Consentimiento por finalidad (Fase 2); `genero` se usa solo para reportes agregados de equidad |
| Exceso de datos | Minimización: no se piden estado civil, religión, foto ni otros datos que no sirven para remunerar |
| Cambios no autorizados | Bitácora de solo inserción que guarda qué campos cambiaron (no sus valores), quién y por qué |

### 11.2 Sesgos

| Sesgo posible | Medida |
|---|---|
| Brecha salarial de género escondida en los promedios | Reporte por cargo (no global), con medianas; se oculta si un grupo tiene menos de 5 personas para no identificar a nadie |
| Bandas salariales que copian desigualdades históricas | Las bandas se definen explícitamente por cargo y no se calculan a partir de los sueldos actuales |
| Indicador de ausentismo que castiga maternidad o enfermedad | El ausentismo cuenta solo ausencias injustificadas; licencias y permisos legales se muestran aparte y nunca en rankings |
| Decisiones automáticas sobre personas | El módulo **no** puntúa ni recomienda despidos ni aumentos; solo calcula lo que la ley y el contrato determinan, y cada monto es explicable |
| Formularios que excluyen identidades | Género con "No binario" y "Prefiere no informar"; nombre social visible en pantalla (Ley 21.120) |
| Edad o nacionalidad usadas para discriminar | Se usan solo para validaciones legales (edad mínima, art. 19 CT) y no aparecen en filtros de reportes |

### 11.3 Riesgos del proyecto

| Riesgo | Mitigación |
|---|---|
| Errores de cálculo legal | Casos de prueba de referencia validados contra un simulador público de sueldo líquido; parámetros con fuente citada |
| Parámetros que cambian durante el semestre (IMM en enero 2027, aporte del empleador) | Tabla versionada por vigencia; pantalla para agregar un valor nuevo sin tocar código |
| Alcance demasiado grande | P1 cerrado antes del 20-nov; P2 solo si P1 está probado |
| Choques con la base al actualizar el template | No se edita el código central; todo lo propio vive en `src/rrhh/` y `module-config.js` |

## 12. Cronograma

| Fase | Fechas | Entregable |
|---|---|---|
| 0. Diseño | hasta jue 22-oct, 15:00 | **MER (data-model.md + imagen) y plan.md** — revisión intermedia |
| 1. Especificación | 23-oct → 2-nov | `spec.md` con historias de usuario y criterios de aceptación (`/speckit.specify`, `/speckit.clarify`), `research.md`, `contracts/` |
| 2. Tareas y base de datos | 3-nov → 9-nov | `tasks.md` (`/speckit.tasks`), `module-config.js`, `storage-rrhh.js`, datos iniciales |
| 3. Planilla | 10-nov → 20-nov | Motor de cálculo con pruebas, períodos, novedades, liquidaciones e impresión |
| 4. Panel, reportes y gobierno de datos | 21-nov → 26-nov | Panel, reportes, roles, auditoría, P2 si alcanza |
| 5. Cierre | 27-nov → semana del 30-nov | README con instrucciones, MER final, demo con datos ficticios, ensayo de la presentación de 5 minutos (todos deben poder presentarla) |

## 13. Organización del grupo

| Línea de trabajo | Responsable |
|---|---|
| Fichas, contratos y catálogos (F1–F3) | Rodrigo y Benjamín |
| Parámetros legales y motor de cálculo (F4, F7) | Vicente |
| Períodos, novedades, liquidaciones e impresión (F5, F6, F8, F9) | Constanza y Yelena |
| Panel, reportes, roles y auditoría (F10, F11, P2) | Karla |

Las decisiones se registran como *issues* de GitHub (una por decisión de diseño) y cada línea de trabajo usa su propia rama y *pull request* hacia `main`.

## 14. Criterios de aceptación del MVP

1. Se puede crear un trabajador con contrato y calcular su liquidación de un período con el resultado del caso de referencia (sección 6), cuadrado al peso.
2. Un período cerrado no permite editar liquidaciones ni novedades.
3. Cambiar un parámetro legal con una nueva vigencia afecta solo a los períodos posteriores.
4. Un trabajador con liquidaciones pagadas no se puede eliminar, solo dar de baja.
5. Con el rol "Jefatura" no se ven sueldos, datos bancarios ni conceptos sensibles.
6. Toda edición, anulación o consulta de datos sensibles queda en la auditoría.
7. `npm test` pasa con las pruebas del motor y de los flujos principales.

## 15. Seguimiento de complejidad

| Elemento agregado | Por qué es necesario | Alternativa más simple descartada |
|---|---|---|
| Tablas de extensión fuera de Entity/Document | Una liquidación necesita detalle por concepto, y el cálculo necesita contratos, novedades y parámetros | Guardar todo como campos personalizados: impide tener historial de contratos y varias líneas por liquidación |
| Parámetros versionados por fecha | La ley cambia durante el año y las liquidaciones pasadas no deben recalcularse con valores nuevos | Constantes en el código: obliga a reprogramar y altera el historial |
| Baja lógica en vez de cascada | Obligación de conservar los registros de remuneraciones | Cascada de la base: borraría liquidaciones pagadas |

---

**Fuentes de los parámetros legales**: Ley 21.830 (ingreso mínimo), Superintendencia de Pensiones (tope imponible, reforma Ley 21.735), Ley 21.561 (jornada de 40 horas), Ley 21.719 (protección de datos personales), Código del Trabajo (arts. 19, 31, 32, 47, 50, 58, 159–161), SII (tramos del impuesto único). Los valores se volverán a verificar en Previred y el SII antes de la demo.

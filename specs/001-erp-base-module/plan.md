# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-erp-base-module` | **Fecha**: 2026-07-08 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

## Resumen

Construir una aplicación web ligera con Vite que sirva como módulo base de software de planificación de recursos empresariales (ERP). El módulo proporciona la base común que todo módulo ERP personalizado necesita: gestión de datos maestros (Entidades), documentos transaccionales vinculados (Documentos), flujos de crear/editar/eliminar/buscar, validación y persistencia local — construida principalmente con HTML, CSS y JavaScript vanilla. La aplicación se presenta como un espacio de trabajo ERP coherente: una barra superior con marca (logotipo derivado + nombre del módulo) y una barra lateral persistente de botones de módulo envuelven cada pantalla, y la pantalla de entrada es un panel estilo ERP que ofrece botones de acción rápida para las tareas clave (nueva entidad, nuevo documento, abrir áreas de gestión, buscar registros) además de estadísticas de registros en vivo. La adaptación a un módulo específico (p. ej., Ventas) se realiza mediante un único archivo de configuración (`src/module-config.js`) que cubre terminología, campos personalizados, ciclo de vida de documentos y color de acento, de modo que el código central permanece intacto.

### Módulo de Recursos Humanos y Planilla (fuente: `specs/002-rrhh-planilla/plan.md`)

El módulo base se extiende con el módulo de **Recursos Humanos y Planilla** descrito en `specs/002-rrhh-planilla/plan.md`, cuyo modelo de datos detallado está en `specs/002-rrhh-planilla/data-model.md`. La extensión reutiliza la **Entidad** como **Trabajador** y el **Documento** como **Liquidación de Sueldo**, sin modificar el código central; todo lo específico vive en `src/rrhh/` y en `src/module-config.js`, y las tablas propias usan el prefijo `erp_rrhh:*`.

El alcance P1 incluye: ficha del trabajador; contratos con historial, jornada y alertas de vencimiento; catálogos de departamentos, cargos, instituciones previsionales y conceptos; parámetros legales versionados por fecha de vigencia; períodos de remuneración con apertura, cálculo y cierre; novedades del mes con aprobación; motor de cálculo de liquidaciones; ciclo de vida borrador → calculada → aprobada → pagada / anulada; liquidación explicable e imprimible; panel de RR.HH.; roles simulados y bitácora de auditoría. La fase 2 añade cargas familiares, consentimientos, reporte de brecha salarial y exportaciones CSV; quedan fuera backend/autenticación real, Previred/SII, finiquitos, reclutamiento, control de asistencia y portal del trabajador.

El motor de cálculo es parte del alcance: para cada trabajador con contrato vigente calcula sueldo proporcional, horas extra, gratificación legal, cotizaciones AFP/salud/seguro de cesantía, impuesto único, descuentos voluntarios, líquido, aportes del empleador y costo empleador, usando parámetros vigentes y topes legales. Cada línea conserva base, tasa o fórmula y el snapshot del parámetro legal aplicado; los totales se obtienen de líneas redondeadas al peso. El caso de referencia del plan 002 (sueldo base $1.200.000, 42 h, 5 horas extra, FONASA, AFP 11,27 %, IMM $553.553 y UTM $71.649) debe cuadrar en $1.272.908 líquidos y $1.659.456 de costo empleador.

El período se abre, calcula y cierra; al cerrarlo se congelan UF, UTM, ingreso mínimo y parámetros, y no se permite recalcular ni editar liquidaciones ni novedades. Los parámetros legales se versionan por vigencia, de modo que un cambio de ley solo afecta períodos posteriores. La extensión también incorpora gobierno de datos: clasificación interno/confidencial/sensible, permisos por rol, auditoría de solo inserción y reportes de equidad con anonimato para grupos pequeños.

**Verificación**: pruebas Vitest + jsdom para el motor de cálculo (incluido el caso de referencia), parámetros, RUT, roles y flujos de período, novedades, liquidación, cierre y baja lógica. La extensión no modifica el código central; la adaptación pasa por `module-config.js` y `src/rrhh/`.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Interacciones responsivas para listas de hasta 500 registros; el cálculo de un período de hasta 200 trabajadores debe completarse en menos de 1 segundo; la búsqueda y las actualizaciones de la interfaz deben sentirse instantáneas  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y navegación; extensión de RR.HH. y Planilla para 1 empresa, hasta 200 trabajadores y 24 períodos de historia en el MVP

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- Calidad: La implementación usará una estructura JavaScript pequeña y modular con límites de función claros y nomenclatura consistente, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas antes de completar.
- Experiencia de Usuario: La interfaz proporcionará mensajes de validación claros, estados vacíos y comportamiento de formulario consistente, presentados dentro de un marco de espacio de trabajo ERP con marca (barra superior + barra lateral) que se ve y se comporta idénticamente en todas las pantallas.
- Rendimiento: La búsqueda y el renderizado de listas se optimizarán para colecciones de hasta 500 registros usando actualizaciones ligeras del DOM.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-erp-base-module/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
src/
├── main.js
├── styles.css
├── storage.js
├── app.js
├── module-config.js
├── components/
│   ├── shell.js        (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, estado de módulo activo)
│   ├── dashboard.js    (vista de inicio: cuadrícula de acciones rápidas + tarjetas de estadísticas en vivo)
│   ├── entity-form.js  (formulario de creación/edición de entidades con campos personalizados)
│   └── document-form.js (formulario de creación/edición de documentos con campos personalizados y ciclo de vida de estados)
└── rrhh/               (extensión de Recursos Humanos y Planilla; no modifica el código central)
    ├── calculo/        (funciones puras del motor, parámetros por vigencia, RUT y redondeo)
    ├── components/     (formularios y resúmenes de trabajadores, novedades, períodos y cálculo)
    ├── seguridad/      (roles simulados, sesión y auditoría de solo inserción)
    ├── utils/          (servicios de contratos, conceptos, novedades, períodos, liquidaciones y costo empleador)
    └── views/          (planilla, novedades, períodos, liquidaciones e impresión)

tests/
├── unit/               (incluye rrhh-calculo*.test.js, rrhh-rut.test.js, rrhh-liquidacion-estados.test.js)
├── integration/        (incluye rrhh-calculo-periodo.test.js, rrhh-cierre-periodo.test.js, rrhh-parametros-vigencia.test.js)
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente. La extensión `src/rrhh/` agrupa el motor de cálculo, los servicios de negocio, las vistas y la auditoría; reutiliza `Entity` como Trabajador y `Document` como Liquidación, y se conecta al espacio de trabajo mediante `module-config.js`.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución.

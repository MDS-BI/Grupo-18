# Tareas: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio), research.md, data-model.md, contracts/entity-storage.md, quickstart.md
**Pruebas**: Incluidas porque la constitución del proyecto exige pruebas automatizadas y el plan confirma cobertura de los flujos centrales.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1, US2, ...)
- Cada tarea incluye una ruta de archivo exacta.

## Convenciones de Ruta

- Aplicación de un solo proyecto: `src/`, `tests/` en la raíz del repositorio.
- Vistas en `index.html`; lógica de aplicación en `src/app.js`; entrada en `src/main.js`.
- Persistencia y reglas base en `src/storage.js`, `src/validation.js`, `src/search.js`, `src/utils.js`.
- Componentes de interfaz en `src/components/`; estilos globales en `src/styles.css`.

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar el proyecto Vite, las dependencias y las herramientas de prueba.

- [ ] T001 Crear la estructura de aplicación Vite de una sola página con `index.html`, `src/`, `src/components/`, `tests/unit/`, `tests/integration/` y `tests/setup/` según `plan.md`
- [ ] T002 Inicializar `package.json` con los scripts `dev`, `build`, `preview` y `test`, e instalar Vite, Vitest y jsdom en `package.json`
- [ ] T003 [P] Configurar linting y formateo de JavaScript en `eslint.config.js` y `.prettierrc`
- [ ] T004 [P] Configurar Vitest con entorno jsdom y ayudantes de montaje en `vitest.config.mjs` y `tests/setup/dom.js`

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear la capa de almacenamiento, validación, búsqueda, sanitización, navegación y estilos de los que dependen todas las historias.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [ ] T005 [P] Implementar la capa de almacenamiento en `src/storage.js`: `loadEntities`, `saveEntities`, `addEntity`, `updateEntity`, `deleteEntity`, `loadDocuments`, `saveDocuments`, `addDocument`, `updateDocument`, `deleteDocument` y `deleteDocumentsForEntity`; generar `id` y `entity_id` únicos automáticamente, asignar `createdAt`/`updatedAt` en ISO, preservar el orden de la lista y eliminar en cascada los documentos al borrar una entidad
- [ ] T006 [P] Implementar ayudantes de validación en `src/validation.js` con las restricciones de `data-model.md`: `name` obligatorio y no vacío; `code` obligatorio, no vacío y único comparado sin distinguir mayúsculas ni espacios extremos; `taxId`, `phone`, `address`, `category`, `description` y `paymentTerms` opcionales recortados; `email` opcional con formato válido; `targetDate` opcional con fecha de calendario válida `YYYY-MM-DD`; `creditLimit` opcional numérico no negativo; documento con `entity_id` existente, `folio` entero positivo obligatorio, `startDate`/`endDate` válidas con fin igual o posterior al inicio, `quantity` entero positivo opcional, `subtotal`/`discount`/`taxAmount`/`totalAmount` no negativos y `discount` no mayor que `subtotal`
- [ ] T007 [P] Implementar la normalización y el filtrado de búsqueda en `src/search.js`: coincidencia parcial (substring), sin distinguir mayúsculas ni acentos, sobre `name`, `code`, `taxId`, `email`, `phone`, `address`, `category`, `description`, `targetDate` y valores de campos personalizados declarados
- [ ] T008 [P] Implementar ayudantes de escape de HTML y atributos para todo contenido introducido por el usuario en `src/utils.js`
- [ ] T009 Crear el esqueleto de la aplicación y el punto de montaje con las vistas Panel, Entidades, Documentos y Buscar en `index.html`, `src/main.js` y `src/app.js`
- [ ] T010 Implementar el enrutador de vistas en `src/router.js` que sincroniza la URL (`#/dashboard`, `#/entities`, `#/documents`, `#/search`) con la pantalla actual y maneja recarga, enlaces profundos y atrás/adelante sin perder datos almacenados
- [ ] T011 [P] Construir los tokens de diseño, el diseño base, formularios, listas y estados vacíos/error en `src/styles.css`
- [ ] T012 [P] Crear datos de prueba reutilizables para entidades, documentos y configuración en `tests/setup/domFixture.js`

**Punto de control**: La base está lista; las historias pueden implementarse y probarse de forma independiente.

---

## Fase 3: Historia de Usuario 1 - Crear y organizar entidades (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir crear entidades con nombre y código obligatorios, código único, y verlas en la lista.

**Prueba Independiente**: Un usuario abre la aplicación, crea una entidad y la ve aparecer en la lista; dejar nombre o código en blanco, o repetir un código, impide guardar con una explicación clara.

### Pruebas para la Historia de Usuario 1

- [ ] T013 [P] [US1] Añadir pruebas unitarias de validación de entidad (nombre/código obligatorios, código único recortado y sin distinguir mayúsculas, email, `creditLimit`, `targetDate`) en `tests/unit/validation.test.js`
- [ ] T014 [P] [US1] Añadir pruebas de integración para crear una entidad, verla en la lista y mostrar errores por campos obligatorios y código duplicado en `tests/integration/us1-create-entity.test.js`

### Implementación para la Historia de Usuario 1

- [ ] T015 [P] [US1] Crear el componente de formulario de entidad con los campos base (`name`, `code`, `taxId`, `email`, `phone`, `address`, `category`, `description`, `targetDate`, `creditLimit`, `paymentTerms`) en `src/components/entity-form.js`
- [ ] T016 [P] [US1] Crear el componente de lista de entidades que muestre nombre, código y campos base en `src/components/entity-list.js`
- [ ] T017 [US1] Conectar el envío del formulario con `addEntity`, refrescar la lista y limpiar el formulario en `src/app.js`
- [ ] T018 [US1] Mostrar retroalimentación de validación para campos obligatorios, código duplicado, email inválido, número negativo y fecha inválida en `src/components/entity-form.js` y `src/app.js`
- [ ] T019 [US1] Renderizar la lista de entidades en la vista de búsqueda como listado base sin filtro y mostrar un estado vacío claro en `src/app.js` y `src/components/entity-list.js`
- [ ] T020 [US1] Añadir estilos del formulario y la lista de entidades en `src/styles.css`

**Punto de control**: La Historia de Usuario 1 es completamente funcional y comprobable de forma independiente (MVP).

---

## Fase 4: Historia de Usuario 2 - Editar y eliminar entidades (Prioridad: P1)

**Objetivo**: Actualizar o eliminar entidades existentes, con confirmación de borrado, código único en edición y eliminación en cascada de documentos.

**Prueba Independiente**: Un usuario edita una entidad y ve el cambio; al eliminar, se solicita confirmación, la entidad desaparece y sus documentos también se eliminan; editar hacia un código duplicado se rechaza.

### Pruebas para la Historia de Usuario 2

- [ ] T021 [P] [US2] Añadir pruebas unitarias para actualizar y eliminar entidades, rechazar código duplicado en edición y eliminar documentos en cascada en `tests/unit/storage.test.js`
- [ ] T022 [P] [US2] Añadir pruebas de integración para editar, confirmar/cancelar eliminación y refrescar la lista en `tests/integration/us2-edit-delete-entity.test.js`

### Implementación para la Historia de Usuario 2

- [ ] T023 [P] [US2] Añadir el selector de entidad con acciones de cargar y eliminar a la vista de gestión en `index.html`
- [ ] T024 [US2] Poblar el formulario al seleccionar una entidad y persistir cambios con `updateEntity` en `src/app.js`
- [ ] T025 [US2] Implementar un diálogo de confirmación explícita antes de eliminar una entidad y ejecutar la eliminación en cascada en `src/app.js` y `src/storage.js`
- [ ] T026 [US2] Rechazar códigos duplicados durante la edición y mostrar una explicación clara en `src/validation.js` y `src/app.js`
- [ ] T027 [US2] Añadir estilos para selectores, acciones de edición/eliminación y diálogo de confirmación en `src/styles.css`

**Punto de control**: Las Historias de Usuario 1 y 2 funcionan de forma independiente.

---

## Fase 5: Historia de Usuario 3 - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

**Objetivo**: Reemplazar la vista de bienvenida por un panel ERP con al menos cuatro acciones rápidas y estadísticas de registros en vivo.

**Prueba Independiente**: La aplicación abre en un panel con acciones para nueva entidad, nuevo documento, abrir gestión de entidades y buscar registros; cada acción lleva al lugar correcto y las tarjetas de estadísticas coinciden con los registros almacenados.

### Pruebas para la Historia de Usuario 3

- [ ] T028 [P] [US3] Añadir pruebas de integración para las acciones rápidas del panel y las estadísticas en vivo en `tests/integration/us3-dashboard.test.js`

### Implementación para la Historia de Usuario 3

- [ ] T029 [P] [US3] Crear el componente del panel con encabezado, cuatro acciones rápidas y tarjetas de estadísticas en `src/components/dashboard.js`
- [ ] T030 [US3] Establecer el panel como vista inicial y añadir su marcado en `index.html` y `src/app.js`
- [ ] T031 [US3] Conectar las acciones rápidas: nueva entidad/nuevo documento abren la gestión correspondiente con formulario vacío, gestión de entidades abre la vista de entidades y buscar abre la búsqueda con el campo enfocado en `src/app.js`
- [ ] T032 [US3] Renderizar y refrescar los recuentos de entidades y documentos cada vez que se muestra el panel en `src/components/dashboard.js` y `src/app.js`
- [ ] T033 [US3] Añadir estilos del panel, acciones rápidas y tarjetas de estadísticas en `src/styles.css`

**Punto de control**: La aplicación abre en un panel funcional y cada tarea ERP clave está a un clic.

---

## Fase 6: Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Proporcionar una pantalla de gestión enfocada con formularios de entidades y documentos, sin mostrar la lista de entidades.

**Prueba Independiente**: El usuario navega a la gestión, alterna entre entidades y documentos, crea/edita/elimina registros, no ve la lista de entidades y vuelve al panel.

### Pruebas para la Historia de Usuario 4

- [ ] T034 [P] [US4] Añadir pruebas de integración para la navegación de gestión, formularios, ausencia de la lista de entidades y retorno al panel en `tests/integration/us4-management.test.js`

### Implementación para la Historia de Usuario 4

- [ ] T035 [P] [US4] Construir las vistas de gestión de entidades y documentos sin incluir la lista de entidades en `index.html`
- [ ] T036 [US4] Implementar la navegación por barra lateral para Panel, Entidades y Documentos con resaltado del módulo activo en `src/app.js`
- [ ] T037 [US4] Conectar las acciones de crear, editar y eliminar entidades y documentos desde la pantalla de gestión en `src/app.js`
- [ ] T038 [US4] Añadir estilos del diseño de gestión y del estado activo de la barra lateral en `src/styles.css`

**Punto de control**: La gestión central de datos maestros y documentos funciona sin mostrar la lista de entidades.

---

## Fase 7: Historia de Usuario 5 - Definir un perfil de configuración del módulo (Prioridad: P1)

**Objetivo**: Introducir `src/module-config.js` para adaptar identidad, terminología, campos personalizados, ciclo de vida y color de acento sin editar código central.

**Prueba Independiente**: Un desarrollador proporciona una configuración de Ventas y la aplicación se presenta como tal; al quitarla se restauran los valores predeterminados; una configuración inválida se informa con claridad.

### Pruebas para la Historia de Usuario 5

- [ ] T039 [P] [US5] Añadir pruebas unitarias para carga de configuración, valores predeterminados, validación de `moduleName`, `labels`, `customFields`, `statusLifecycle` y `theme.accentColor`, e informes de configuración inválida en `tests/unit/module-config.test.js`

### Implementación para la Historia de Usuario 5

- [ ] T040 [US5] Crear el cargador de configuración con valores predeterminados y validación en `src/module-config.js`: `moduleName` obligatorio no vacío; `labels` opcional con retroceso a Entidad/Documento; `customFields` opcional con `target` `entity|document`, `key`, `label`, `type` `text|number|date|select`, `required` y `options` opcional, sin colisión con campos base; `statusLifecycle` opcional con estados y transiciones; `theme.accentColor` opcional válido con retroceso seguro
- [ ] T041 [US5] Cargar la configuración al arrancar y pasarla a todas las vistas en `src/main.js` y `src/app.js`
- [ ] T042 [US5] Mostrar un aviso claro de configuración inválida o conflictiva en lugar de fallar silenciosamente en `src/app.js`

**Punto de control**: La configuración carga de forma fiable y valida limpiamente, con retroceso seguro.

---

## Fase 8: Historia de Usuario 6 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Derivar todas las etiquetas visibles de la configuración para que el módulo adaptado use su terminología en todo momento.

**Prueba Independiente**: Con Entidad→Cliente y Documento→Pedido de Venta, cada pestaña, botón, etiqueta de formulario, encabezado y estado vacío usa los términos configurados sin cambiar la navegación.

### Pruebas para la Historia de Usuario 6

- [ ] T043 [P] [US6] Añadir pruebas de integración que verifiquen las etiquetas configuradas en panel, gestión y búsqueda en `tests/integration/us6-labels.test.js`

### Implementación para la Historia de Usuario 6

- [ ] T044 [US6] Sustituir las etiquetas codificadas por etiquetas derivadas de la configuración en `index.html`, `src/app.js` y `src/components/`
- [ ] T045 [US6] Garantizar que la navegación y el comportamiento no cambian al remapear etiquetas en `src/app.js`
- [ ] T046 [US6] Aplicar los términos predeterminados Entidad/Documento cuando no se proporcionan mapeos en `src/module-config.js`

**Punto de control**: Un módulo configurado se presenta completamente bajo su propia terminología.

---

## Fase 9: Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Hacer que los campos personalizados fluyan automáticamente por formularios, validación, persistencia, listas y búsqueda, y conservar valores huérfanos sin mostrarlos.

**Prueba Independiente**: Un campo numérico obligatorio declarado aparece como entrada numérica, bloquea guardados en blanco, se muestra en listas y coincide en búsquedas; al quitar la declaración el valor se oculta pero se conserva, y al volver a declararla reaparece.

### Pruebas para la Historia de Usuario 7

- [ ] T047 [P] [US7] Añadir pruebas unitarias para validación y persistencia de campos personalizados, y para ocultar/conservar/restaurar valores huérfanos en `tests/unit/custom-fields.test.js`
- [ ] T048 [P] [US7] Añadir pruebas de integración para campos personalizados en formularios, listas y búsqueda, incluida la retirada y redeclaración de configuración en `tests/integration/us7-custom-fields.test.js`

### Implementación para la Historia de Usuario 7

- [ ] T049 [P] [US7] Renderizar dinámicamente los campos personalizados declarados según su tipo (`text`, `number`, `date`, `select`) en `src/components/entity-form.js` y `src/components/document-form.js`
- [ ] T050 [US7] Incluir los campos personalizados en la validación (obligatoriedad y tipo) y en la persistencia sin cambios de esquema en `src/validation.js` y `src/storage.js`
- [ ] T051 [US7] Incluir los campos personalizados en el renderizado de listas y en la búsqueda en `src/components/entity-list.js`, `src/components/document-list.js` y `src/search.js`
- [ ] T052 [US7] Implementar el manejo de valores huérfanos: ocultar de formularios, listas y búsqueda los campos no declarados o con tipo cambiado, conservar sus valores y restaurarlos si el campo se vuelve a declarar en `src/app.js` y `src/storage.js`
- [ ] T053 [US7] Añadir estilos para campos personalizados y controles de selección en `src/styles.css`

**Punto de control**: Los datos específicos del módulo requieren cero cambios de código de interfaz y los valores huérfanos no se pierden.

---

## Fase 10: Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco persistente con barra superior con logotipo derivado y nombre del módulo, barra lateral con Panel/Entidades/Documentos/Buscar, resaltado activo, color de acento y contracción responsiva.

**Prueba Independiente**: En cada pantalla se ven la barra superior y la barra lateral, el módulo activo está resaltado, la navegación preserva los datos y la barra lateral se contrae a iconos en ventanas estrechas.

### Pruebas para la Historia de Usuario 13

- [ ] T054 [P] [US13] Añadir pruebas unitarias para validación y retroceso del color de acento en `tests/unit/module-config.test.js`
- [ ] T055 [P] [US13] Añadir pruebas de integración que afirmen el marco con marca en todas las pantallas, el resaltado activo, la preservación de datos y la contracción responsiva en `tests/integration/us13-shell.test.js`

### Implementación para la Historia de Usuario 13

- [ ] T056 [P] [US13] Crear el componente de marco que renderiza la barra superior, el logotipo monograma SVG derivado del nombre del módulo, los botones de la barra lateral y el resaltado del módulo activo en `src/components/shell.js`
- [ ] T057 [US13] Integrar el marco en todas las vistas y reemplazar la navegación básica en `index.html` y `src/app.js`
- [ ] T058 [US13] Aplicar `theme.accentColor` como propiedad personalizada de CSS con retroceso seguro en `src/app.js` y `src/styles.css`
- [ ] T059 [US13] Contraer la barra lateral a una columna de iconos con etiquetas accesibles en ventanas estrechas en `src/styles.css` y `src/components/shell.js`
- [ ] T060 [US13] Garantizar que la navegación entre módulos conserva todas las entidades y documentos almacenados en `src/app.js`

**Punto de control**: Todas las pantallas se renderizan dentro del marco con marca y la navegación por barra lateral preserva los datos.

---

## Fase 11: Historia de Usuario 8 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Buscar entidades por detalles clave con coincidencia parcial insensible a mayúsculas y acentos, con estado vacío y buen rendimiento para 500 registros.

**Prueba Independiente**: El usuario introduce un término y ve solo las entidades coincidentes; una búsqueda sin coincidencias muestra un estado vacío claro y permite reintentar.

### Pruebas para la Historia de Usuario 8

- [ ] T061 [P] [US8] Añadir pruebas unitarias para normalización y coincidencia de búsqueda (substring, mayúsculas y acentos) en `tests/unit/search.test.js`
- [ ] T062 [P] [US8] Añadir pruebas de integración para resultados de búsqueda y estado vacío en `tests/integration/us8-search.test.js`

### Implementación para la Historia de Usuario 8

- [ ] T063 [P] [US8] Crear el componente de barra de búsqueda en `src/components/search-bar.js`
- [ ] T064 [US8] Conectar la entrada de búsqueda con `searchEntities` y renderizar los resultados en `src/app.js`
- [ ] T065 [US8] Mantener los resultados sincronizados tras crear, editar o eliminar registros en `src/app.js`
- [ ] T066 [US8] Optimizar el filtrado y el renderizado de listas para al menos 500 entidades en `src/search.js` y `src/components/entity-list.js`

**Punto de control**: La búsqueda es rápida, predecible y consistente con los cambios de datos.

---

## Fase 12: Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Adjuntar una fecha objetivo opcional a una entidad y mostrarla en la lista.

**Prueba Independiente**: El usuario fija una fecha y la ve en la lista; dejar la fecha en blanco guarda la entidad sin fecha.

### Pruebas para la Historia de Usuario 9

- [ ] T067 [P] [US9] Añadir pruebas unitarias para validación y persistencia de `targetDate` en `tests/unit/validation.test.js`

### Implementación para la Historia de Usuario 9

- [ ] T068 [P] [US9] Añadir la entrada de fecha objetivo al formulario de entidad en `src/components/entity-form.js`
- [ ] T069 [US9] Incluir `targetDate` en creación, actualización, búsqueda y visualización de la lista en `src/app.js` y `src/components/entity-list.js`

**Punto de control**: La fecha objetivo es opcional, válida y visible.

---

## Fase 13: Historia de Usuario 10 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Añadir, editar y eliminar documentos vinculados a una entidad, con validación de campos obligatorios, confirmación de borrado y eliminación en cascada.

**Prueba Independiente**: El usuario añade un documento a una entidad, lo edita y lo elimina con confirmación; al eliminar la entidad sus documentos también se eliminan; dejar campos obligatorios en blanco impide guardar.

### Pruebas para la Historia de Usuario 10

- [ ] T070 [P] [US10] Añadir pruebas unitarias para validación de documentos (`folio`, fechas, importes), vínculo por `entity_id`, eliminación en cascada y confirmación en `tests/unit/document-validation.test.js`
- [ ] T071 [P] [US10] Añadir pruebas de integración para crear, editar y eliminar documentos y para la cascada al eliminar la entidad en `tests/integration/us10-documents.test.js`

### Implementación para la Historia de Usuario 10

- [ ] T072 [P] [US10] Crear el formulario de documento con selector de entidad y campos base (`series`, `folio`, `startDate`, `endDate`, `quantity`, `subtotal`, `discount`, `taxAmount`, `totalAmount`, `currency`, `paymentTerms`, `notes`, `status`) en `src/components/document-form.js`
- [ ] T073 [P] [US10] Crear el componente de lista de documentos en `src/components/document-list.js`
- [ ] T074 [US10] Conectar crear, editar y eliminar documentos con el almacenamiento y la asociación por `entity_id` en `src/app.js`
- [ ] T075 [US10] Solicitar confirmación explícita antes de eliminar un documento en `src/app.js`
- [ ] T076 [US10] Eliminar en cascada los documentos cuando se elimina una entidad y reflejarlo en la interfaz en `src/storage.js` y `src/app.js`

**Punto de control**: Los datos maestros y los documentos transaccionales están completamente vinculados y protegidos.

---

## Fase 14: Historia de Usuario 11 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Proporcionar una pantalla de búsqueda dedicada accesible desde la barra lateral y la acción rápida, sin formularios de edición.

**Prueba Independiente**: El usuario abre la búsqueda desde la barra lateral o el panel, introduce un término, ve resultados o un estado vacío, y vuelve al panel.

### Pruebas para la Historia de Usuario 11

- [ ] T077 [P] [US11] Añadir pruebas de integración para navegación a la búsqueda, foco inicial, resultados, estado vacío y retorno al panel en `tests/integration/us11-search-view.test.js`

### Implementación para la Historia de Usuario 11

- [ ] T078 [US11] Construir la vista de búsqueda dedicada con entrada, resultados y estado vacío en `index.html` y `src/components/search-bar.js`
- [ ] T079 [US11] Conectar la barra lateral y la acción rápida del panel con la vista de búsqueda y enfocar el campo al entrar en `src/app.js`
- [ ] T080 [US11] Asegurar que la vista de búsqueda no muestra formularios de edición en `index.html`

**Punto de control**: La búsqueda dedicada está enfocada y es accesible desde los dos puntos de entrada.

---

## Fase 15: Historia de Usuario 12 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Aplicar los estados y transiciones configurados en documentos, rechazando transiciones inválidas y manteniendo texto libre cuando no hay configuración.

**Prueba Independiente**: Con cotización→pedido→facturado configurado, solo se ofrecen los estados siguientes válidos, las transiciones inválidas se rechazan con explicación y el estado es visible en listas; sin configuración, el estado sigue siendo texto libre.

### Pruebas para la Historia de Usuario 12

- [ ] T081 [P] [US12] Añadir pruebas unitarias para transiciones válidas/inválidas y retroceso a texto libre sin configuración en `tests/unit/status-lifecycle.test.js`
- [ ] T082 [P] [US12] Añadir pruebas de integración para opciones de estado, rechazo de transiciones y visualización del estado en `tests/integration/us12-lifecycle.test.js`

### Implementación para la Historia de Usuario 12

- [ ] T083 [US12] Implementar la validación del ciclo de vida y transiciones permitidas en `src/validation.js`
- [ ] T084 [US12] Renderizar un selector con solo los estados siguientes válidos y una entrada de texto libre cuando no hay ciclo de vida en `src/components/document-form.js`
- [ ] T085 [US12] Aplicar las transiciones configuradas al guardar por cualquier vía en `src/app.js`
- [ ] T086 [US12] Mostrar el estado actual de forma identificable en listas y detalles de documentos en `src/components/document-list.js`

**Punto de control**: El ciclo de vida configurado se aplica de extremo a extremo y el modo de texto libre sigue funcionando.

---

## Fase 16: Pulido y Preocupaciones Transversales

**Propósito**: Mejorar accesibilidad, seguridad, rendimiento, documentación y verificación final.

- [ ] T087 [P] Añadir refinamientos de accesibilidad (etiquetas, foco de teclado, estructura semántica, `aria-current`) en `index.html` y `src/components/shell.js`
- [ ] T088 [P] Reforzar la seguridad escapando todo contenido de usuario antes de renderizarlo en el DOM en `src/utils.js` y `src/components/`
- [ ] T089 [P] Verificar y ajustar el diseño responsivo y la contracción de la barra lateral en ventanas estrechas en `src/styles.css`
- [ ] T090 Añadir una prueba de rendimiento con 500 entidades para listado y búsqueda en `tests/integration/performance.test.js`
- [ ] T091 [P] Actualizar `README.md` y `quickstart.md` con configuración, tematización, navegación y las reglas clarificadas (código único, búsqueda sin acentos, confirmación de borrado, valores huérfanos, URL)
- [ ] T092 Ejecutar la suite completa de pruebas y la compilación de producción; corregir cualquier regresión en `package.json`
- [ ] T093 Validar manualmente los flujos de `quickstart.md` en el navegador y registrar los resultados en `specs/001-erp-base-module/quickstart.md`

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- **Configuración (Fase 1)**: Sin dependencias.
- **Fundacional (Fase 2)**: Depende de completar Configuración; bloquea todas las historias.
- **US1 (Fase 3)**: Depende de Fundacional; es el MVP.
- **US2 (Fase 4)**: Depende de US1 (formulario, almacenamiento y lista de entidades).
- **US3 (Fase 5)**: Depende de Fundacional y de US1; la acción "nuevo documento" alcanza su forma completa cuando US10 está implementada.
- **US4 (Fase 6)**: Depende de US1 y US2 para los formularios de gestión; su vista no muestra la lista de entidades.
- **US5 (Fase 7)**: Depende de Fundacional; desbloquea US6, US7, US12 y US13.
- **US6 (Fase 8)**: Depende de US5.
- **US7 (Fase 9)**: Depende de US5 y de US1/US10 para los formularios de ambos tipos de registro.
- **US13 (Fase 10)**: Depende de US5 (nombre, etiquetas y color) y de US4 (navegación base).
- **US8 (Fase 11)**: Depende de US1 y Fundacional; comparte la utilidad de búsqueda con US11.
- **US9 (Fase 12)**: Depende de US1.
- **US10 (Fase 13)**: Depende de US1 (entidad y `entity_id`).
- **US11 (Fase 14)**: Depende de US8 (lógica de búsqueda) y US13 (barra lateral).
- **US12 (Fase 15)**: Depende de US5 (configuración) y US10 (documentos).
- **Pulido (Fase 16)**: Depende de todas las historias deseadas.

### Dependencias entre Historias de Usuario

- **US1**: Puede empezar tras Fundacional; sin dependencias de otras historias.
- **US2**: Requiere US1.
- **US3**: Requiere US1; para la prueba completa de "nuevo documento" requiere US10.
- **US4**: Requiere US1 y US2.
- **US5**: Requiere Fundacional.
- **US6**: Requiere US5.
- **US7**: Requiere US5; los formularios de entidad y documento provienen de US1 y US10.
- **US13**: Requiere US5 y US4.
- **US8**: Requiere US1.
- **US9**: Requiere US1.
- **US10**: Requiere US1.
- **US11**: Requiere US8 y US13.
- **US12**: Requiere US5 y US10.

### Dentro de Cada Historia

- Las pruebas (si se incluyen) se escriben primero y deben fallar antes de implementar.
- Modelos/almacenamiento antes de servicios; servicios antes de la interfaz.
- La implementación central antes de la integración.
- Cada historia debe completarse y validarse antes de pasar a la siguiente prioridad.

---

## Oportunidades Paralelas

- T003 y T004 pueden ejecutarse en paralelo tras T001/T002.
- T005, T006, T007, T008 y T011 pueden ejecutarse en paralelo dentro de la Fase 2; T009/T010 integran el esqueleto y el enrutador.
- En US1, T013/T014 (pruebas), T015/T016 (componentes) pueden ejecutarse en paralelo; T017-T019 integran.
- En US2, T021/T022 (pruebas) y T023 (marcado) pueden ejecutarse en paralelo; T024-T026 integran.
- En US3, T028/T029 pueden ejecutarse en paralelo con T030; T031/T032 integran.
- En US4, T034/T035 pueden ejecutarse en paralelo con T036; T037 integra.
- En US5, T039 y T040 pueden ejecutarse en paralelo; T041/T042 integran.
- En US6, T043 puede ejecutarse en paralelo con T044/T046.
- En US7, T047/T048 (pruebas), T049 (formularios) y T051 (listas/búsqueda) pueden ejecutarse en paralelo; T050/T052 integran.
- En US13, T054/T055 (pruebas) y T056 pueden ejecutarse en paralelo; T057-T060 integran.
- En US8, T061/T062 (pruebas) y T063 pueden ejecutarse en paralelo; T064-T066 integran.
- En US9, T067 y T068 pueden ejecutarse en paralelo; T069 integra.
- En US10, T070/T071 (pruebas), T072 y T073 pueden ejecutarse en paralelo; T074-T076 integran.
- En US11, T077 y T078 pueden ejecutarse en paralelo; T079/T080 integran.
- En US12, T081/T082 (pruebas) y T083 pueden ejecutarse en paralelo; T084-T086 integran.
- En la Fase 16, T087, T088, T089 y T091 pueden ejecutarse en paralelo; T090, T092 y T093 son verificaciones finales.

### Ejemplo Paralelo: Historia de Usuario 1

```bash
# Lanzar las pruebas de US1 juntas:
Task: "Añadir pruebas unitarias de validación de entidad en tests/unit/validation.test.js"
Task: "Añadir pruebas de integración para crear una entidad en tests/integration/us1-create-entity.test.js"

# Lanzar los componentes de US1 juntos:
Task: "Crear el componente de formulario de entidad en src/components/entity-form.js"
Task: "Crear el componente de lista de entidades en src/components/entity-list.js"
```

### Ejemplo Paralelo: Historia de Usuario 7

```bash
Task: "Añadir pruebas unitarias de campos personalizados en tests/unit/custom-fields.test.js"
Task: "Añadir pruebas de integración de campos personalizados en tests/integration/us7-custom-fields.test.js"
Task: "Renderizar campos personalizados en formularios en src/components/entity-form.js y src/components/document-form.js"
Task: "Incluir campos personalizados en listas y búsqueda en src/components/entity-list.js y src/search.js"
```

---

## Estrategia de Implementación

### MVP Primero (Solo Historia de Usuario 1)

1. Completar Fase 1: Configuración.
2. Completar Fase 2: Fundacional (CRÍTICO, bloquea todas las historias).
3. Completar Fase 3: US1.
4. **DETENERSE Y VALIDAR**: Probar US1 de forma independiente (crear entidad, verla en la lista, validar nombre/código obligatorios y código único).
5. Desplegar o demostrar si está listo.

### Entrega Incremental

1. Configuración + Fundacional → base lista.
2. US1 → validar → desplegar/demostrar (MVP).
3. US2 → validar → desplegar/demostrar.
4. US3 y US4 → validar el panel y la gestión.
5. US5 → validar la configuración; después US6, US7 y US13.
6. US8 y US9 → validar búsqueda y fecha objetivo.
7. US10, US11 y US12 → validar documentos, búsqueda dedicada y ciclo de vida.
8. Fase 16 → pulido, rendimiento y verificación final.

### Estrategia de Equipo Paralelo

Con varios desarrolladores:

1. El equipo completa Configuración + Fundacional en conjunto.
2. Tras el Fundacional:
   - Desarrollador A: US1 → US2 → US9.
   - Desarrollador B: US5 → US6 → US7 → US13.
   - Desarrollador C: US3 → US4 → US8 → US11.
   - Desarrollador D: US10 → US12.
3. Las historias se integran y validan de forma independiente; US3/US4 y US8/US11 coordinan sus puntos de entrada compartidos.

---

## Notas

- `[P]` indica tareas sobre archivos distintos y sin dependencias pendientes.
- `[USx]` mapea cada tarea a su historia para trazabilidad.
- Cada historia debe poder completarse y probarse de forma independiente.
- Verificar que las pruebas fallen antes de implementar.
- Confirmar después de cada tarea o grupo lógico.
- Evitar tareas vagas, conflictos sobre el mismo archivo y dependencias entre historias que rompan la independencia.
- Las reglas clarificadas se reflejan en: FR-040 (valores huérfanos, T052), FR-041 (búsqueda sin acentos, T007/T061), FR-042 (código único, T006/T013/T026), FR-043 (confirmación de borrado, T025/T075) y FR-044 (URL/atrás/recarga, T010).

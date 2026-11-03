# Tareas: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/
**Actualizado**: 2026-11-03 — incorporado el plan 002-rrhh-planilla al resumen del plan y al alcance: se añade la Historia de Usuario 15 (motor de cálculo, parámetros versionados, ciclo de vida de liquidaciones y cierre de período), se ajustan las aclaraciones de la Historia de Usuario 14 (registro y aprobación con motor de cálculo, roles Analista/Jefatura, período Abierto/Cerrado, vínculo con Entidad trabajador y eliminación en cascada) y se conserva la Historia de Usuario 5 (vista explicativa e impresión de liquidaciones, P2)

## Formato: `[ID] [P?] [Historia] Descripción con ruta de archivo`

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar la estructura del proyecto Vite y las herramientas compartidas.

- [X] T001 Crear la estructura de la aplicación Vite con src/, tests/, y archivos de configuración
- [X] T002 Instalar las dependencias Vite y Vitest y registrar los scripts de desarrollo, prueba y compilación en package.json
- [X] T003 [P] Configurar el linting y formateo para la aplicación JavaScript ligera en package.json y .eslintrc.json

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear la capa de almacenamiento y el esqueleto de la aplicación de los que dependen todas las historias.

- [X] T004 Crear el modelo de datos de entidad y los ayudantes de validación en src/storage.js
- [X] T005 Implementar la persistencia en localStorage del navegador para registros de entidad en src/storage.js
- [X] T006 Crear el esqueleto principal de la aplicación y renderizar el estado vacío inicial en src/app.js
- [X] T007 [P] Construir una base de hoja de estilos compartida para diseño, formularios y estados de retroalimentación en src/styles.css

---

## Fase 3: Historia de Usuario 1 - Crear y organizar entidades (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir a los usuarios añadir entidades y verlas en la lista.

**Prueba Independiente**: Un usuario puede abrir la aplicación, enviar un formulario de entidad y ver la nueva entidad aparecer.

### Pruebas para la Historia de Usuario 1

- [X] T008 [P] [US1] Añadir pruebas unitarias para la validación de entidades en tests/unit/storage.test.js
- [X] T009 [P] [US1] Añadir pruebas de integración para crear una entidad en tests/integration/create-entity.test.js

### Implementación de la Historia de Usuario 1

- [X] T010 [P] [US1] Crear la interfaz del formulario de entidad en src/components/entity-form.js
- [X] T011 [US1] Conectar el envío del formulario para crear y persistir una nueva entidad en src/app.js
- [X] T012 [US1] Renderizar la lista de entidades y mostrar retroalimentación de validación en src/components/entity-list.js

**Punto de control**: La Historia de Usuario 1 debe estar completamente funcional y ser comprobable de forma independiente.

---

## Fase 4: Historia de Usuario 2 - Editar y eliminar entidades (Prioridad: P1)

**Objetivo**: Permitir a los usuarios actualizar o eliminar entidades almacenadas, manteniendo la capacidad de respuesta con conjuntos de datos grandes.

**Prueba Independiente**: Un usuario puede editar una entidad existente o eliminarla, y la lista se actualiza correctamente.

### Pruebas para la Historia de Usuario 2

- [X] T013 [P] [US2] Añadir pruebas unitarias para actualizar y eliminar entidades en tests/unit/storage.test.js
- [X] T014 [P] [US2] Añadir pruebas de integración para editar y eliminar una entidad en tests/integration/edit-delete-entity.test.js

### Implementación de la Historia de Usuario 2

- [X] T015 [P] [US2] Añadir controles de edición y eliminación a la interfaz de la lista de entidades en src/components/entity-list.js
- [X] T016 [US2] Conectar las acciones de edición para poblar el formulario y actualizar los datos persistidos en src/app.js
- [X] T017 [US2] Gestionar las acciones de eliminación y quitar registros del almacenamiento y la interfaz en src/app.js

**Punto de control**: Las Historias de Usuario 1 y 2 deben funcionar de forma independiente.

---

## Fase 5: Historia de Usuario 3 (original) - Pantalla de bienvenida con navegación (Prioridad: P1)

**Objetivo**: Proporcionar la pantalla de punto de entrada con dos botones claramente etiquetados que llevan a gestión y búsqueda. *(Sustituida por el rediseño del panel de la Fase 17; se conserva como historial del trabajo entregado.)*

**Prueba Independiente**: Un usuario abre la aplicación, ve la pantalla de bienvenida y llega a ambas pantallas desde sus botones.

### Implementación de la Historia de Usuario 3

- [x] T018 [P] [US3] [SUPERSEDIDA por Fase 17] Añadir una vista de pantalla de bienvenida con dos botones de navegación claramente etiquetados en index.html
- [x] T019 [P] [US3] [SUPERSEDIDA por Fase 17] Añadir lógica de cambio de vista para las pantallas de bienvenida, gestión y búsqueda en src/app.js

**Punto de control**: La Historia de Usuario 3 debe estar completamente funcional y ser comprobable de forma independiente.

---

## Fase 6: Historia de Usuario 4 (pestañas originales) - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

**Objetivo**: Proporcionar la pantalla de gestión con la pestaña de navegación horizontal Entidades/Documentos/Inicio y formularios de gestión completos, sin mostrar la lista de entidades. *(La navegación por pestañas fue sustituida por el marco de barra lateral de la Fase 16; los flujos de gestión siguen vigentes.)*

**Prueba Independiente**: Desde la pantalla de bienvenida, un usuario llega a la pantalla de gestión, cambia de pestaña y añade, edita y elimina una entidad y un documento.

### Implementación de la Historia de Usuario 4

- [x] T020 [P] [US4] [SUPERSEDIDA por Fase 16] Añadir una pestaña de navegación horizontal con botones Entidades, Documentos e Inicio a la vista de gestión en index.html
- [x] T021 [P] [US4] [SUPERSEDIDA por Fase 16] Organizar la vista de gestión en paneles de entidades y documentos y eliminar la lista de entidades en index.html
- [x] T022 [US4] [SUPERSEDIDA por Fase 16] Añadir lógica de cambio de pestaña y navegación a Inicio desde la pantalla de gestión en src/app.js
- [x] T023 [US4] [SUPERSEDIDA por Fase 16] Añadir edición y eliminación mediante selectores para entidades y documentos en src/app.js
- [x] T024 [P] [US4] [SUPERSEDIDA por Fase 16] Añadir pruebas de integración para la pestaña de navegación de gestión en tests/integration/manage-tabs.test.js
- [x] T025 [P] [US4] [SUPERSEDIDA por Fase 16] Añadir estilos para la pestaña de navegación horizontal en src/styles.css

**Punto de control**: Las Historias de Usuario 1-4 deben estar completamente funcionales y ser comprobables de forma independiente.

---

## Fase 7: Habilitadores de Configuración del Módulo (Transversal)

**Objetivo**: Introducir `src/module-config.js` para que los desarrolladores puedan adaptar la identidad del módulo sin editar el código central, con valores predeterminados seguros e informes de error claros.

**Prueba Independiente**: Un desarrollador suministra una configuración de Ventas; la aplicación carga mostrándola. Al quitar el archivo se restauran los valores predeterminados Entidad/Documento sin errores.

> **Nota**: Esta fase no corresponde a una historia de usuario propia. Provee el perfil de configuración que consumen las Historias de Usuario 6, 7, 12 y 13.

### Pruebas de los Habilitadores de Configuración

- [X] T026 [P] Añadir pruebas unitarias para carga de configuración, retroceso a predeterminados e informes de configuración inválida en tests/unit/module-config.test.js

### Implementación de los Habilitadores de Configuración

- [X] T027 Crear el cargador de configuración con valores predeterminados, validación e informes de error claros en src/module-config.js
- [X] T028 Cargar la configuración al arrancar y pasarla a todas las vistas en src/main.js y src/app.js

**Punto de control**: La configuración aún no impulsa nada visible, pero carga de forma fiable y valida limpiamente.

---

## Fase 8: Historia de Usuario 6 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

**Objetivo**: Derivar todas las etiquetas visibles para el usuario de la configuración para que los módulos adaptados hablen su idioma de dominio en todo momento.

**Prueba Independiente**: Con mapeos Entidad→Cliente y Documento→Pedido de Venta, cada pestaña, botón, etiqueta de formulario, encabezado y mensaje muestra los términos mapeados en las tres pantallas; el comportamiento no cambia.

### Pruebas para la Historia de Usuario 6

- [X] T029 [P] [US6] Añadir pruebas de integración que verifiquen las etiquetas configuradas en las pantallas de bienvenida, gestión y búsqueda en tests/integration/relabeling.test.js

### Implementación de la Historia de Usuario 6

- [X] T030 [US6] Derivar todas las etiquetas visibles para el usuario de la configuración en lugar de texto codificado en index.html, src/app.js y los archivos de componentes

**Punto de control**: Un módulo configurado se presenta completamente bajo su propia terminología.

---

## Fase 9: Historia de Usuario 7 - Declarar campos personalizados para los registros (Prioridad: P1)

**Objetivo**: Permitir que los campos personalizados declarados fluyan automáticamente por formularios, validación, persistencia, listas y búsqueda.

**Prueba Independiente**: Declarar un campo numérico obligatorio en las entidades renderiza una entrada numérica que bloquea guardados en blanco, muestra valores en listas y coincide en búsquedas; sin declaraciones la aplicación se comporta como la base sin modificar.

### Pruebas para la Historia de Usuario 7

- [X] T031 [P] [US7] Añadir pruebas unitarias para validación y persistencia de campos personalizados en tests/unit/storage.test.js
- [X] T032 [P] [US7] Añadir pruebas de integración para el renderizado de campos personalizados en formularios, listas y búsqueda en tests/integration/custom-fields.test.js

### Implementación de la Historia de Usuario 7

- [X] T033 [P] [US7] Renderizar dinámicamente los campos personalizados declarados en los formularios de entidad y documento en src/components/entity-form.js y src/components/document-form.js
- [X] T034 [US7] Incluir los campos personalizados en validación, persistencia, listas y búsqueda en src/storage.js y src/app.js

**Punto de control**: Los datos específicos del módulo requieren cero cambios de código de interfaz.

---

## Fase 10: Historia de Usuario 8 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

**Objetivo**: Permitir a los usuarios buscar y filtrar entidades rápidamente, manteniendo la capacidad de respuesta con conjuntos de datos grandes.

**Prueba Independiente**: Un usuario puede introducir un término de búsqueda y ver solo las entidades coincidentes.

### Pruebas para la Historia de Usuario 8

- [X] T035 [P] [US8] Añadir pruebas unitarias para la lógica de filtrado de búsqueda en tests/unit/storage.test.js
- [X] T036 [P] [US8] Añadir pruebas de integración para el comportamiento de búsqueda en tests/integration/search-entities.test.js

### Implementación de la Historia de Usuario 8

- [X] T037 [P] [US8] Crear la interfaz de la barra de búsqueda en src/components/search-bar.js
- [X] T038 [US8] Conectar la entrada de búsqueda al filtrado y al comportamiento de estado vacío en src/app.js
- [X] T039 [US8] Asegurar que los resultados de búsqueda permanecen sincronizados con las acciones de crear, editar y eliminar en src/app.js

**Punto de control**: Las historias centrales de datos y la búsqueda deben estar ahora funcionalmente independientes.

---

## Fase 11: Historia de Usuario 9 - Registrar una fecha objetivo (Prioridad: P2)

**Objetivo**: Permitir a los usuarios adjuntar una fecha objetivo opcional a una entidad.

**Prueba Independiente**: Un usuario puede fijar una fecha en una entidad y verla mostrada en la lista.

### Pruebas para la Historia de Usuario 9

- [X] T040 [P] [US9] Añadir pruebas unitarias para validación y persistencia de la fecha objetivo en tests/unit/storage.test.js

### Implementación de la Historia de Usuario 9

- [X] T041 [P] [US9] Añadir la entrada de fecha objetivo al formulario de entidad en index.html
- [X] T042 [US9] Incluir targetDate en la lógica de validación, creación, actualización y búsqueda en src/storage.js
- [X] T043 [US9] Conectar targetDate al envío del formulario, poblado de edición y visualización de errores en src/app.js
- [X] T044 [US9] Mostrar la fecha objetivo en la lista de entidades en src/app.js

**Punto de control**: La Historia de Usuario 9 debe estar completamente funcional y ser comprobable de forma independiente.

---

## Fase 12: Historia de Usuario 10 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

**Objetivo**: Permitir a los usuarios registrar detalles de documentos para una entidad y verlos juntos, con la eliminación en cascada protegiendo la integridad referencial.

**Prueba Independiente**: Un usuario puede añadir un documento a una entidad y ver los detalles mostrados con esa entidad; eliminar la entidad elimina sus documentos.

### Pruebas para la Historia de Usuario 10

- [X] T045 [P] [US10] Añadir pruebas unitarias para generación de entity_id y validación de documentos en tests/unit/storage.test.js
- [X] T046 [P] [US10] Añadir pruebas de integración para añadir un documento a una entidad en tests/integration/add-document.test.js
- [X] T047 [P] [US10] Añadir pruebas de integración para edición, eliminación y eliminación en cascada de documentos en tests/integration/manage-document.test.js

### Implementación de la Historia de Usuario 10

- [X] T048 [P] [US10] Crear la interfaz del formulario de documento en src/components/document-form.js
- [X] T049 [P] [US10] Crear la interfaz de la lista de documentos en src/components/document-list.js
- [X] T050 [US10] Conectar las acciones de crear, editar y eliminar documentos para persistirlos en src/app.js
- [X] T051 [US10] Añadir entity_id a la creación de entidades y mostrar los documentos con su entidad en src/app.js
- [X] T052 [US10] Eliminar en cascada los documentos cuando se elimina una entidad en src/storage.js

**Punto de control**: Los datos maestros y los documentos transaccionales deben estar completamente vinculados.

---

## Fase 13: Historia de Usuario 11 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Proporcionar la pantalla de búsqueda dedicada accesible desde la pantalla de bienvenida, manteniendo la edición en la pantalla de gestión.

**Prueba Independiente**: Un usuario navega desde la pantalla de bienvenida a la pantalla de búsqueda, busca, ve resultados o un estado vacío, y vuelve a Inicio.

### Implementación de la Historia de Usuario 11

- [x] T053 [P] [US11] Añadir la entrada de búsqueda y la lista de resultados a la vista de búsqueda dedicada en index.html
- [x] T054 [US11] Conectar la entrada de búsqueda al filtrado de resultados y mostrar un estado vacío en la pantalla de búsqueda en src/app.js
- [x] T055 [US11] Añadir navegación al Panel desde la pantalla de búsqueda en index.html

**Punto de control**: Todas las historias del usuario de negocio deben estar completamente funcionales y ser comprobables de forma independiente.

---

## Fase 14: Historia de Usuario 12 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

**Objetivo**: Aplicar los estados y transiciones configurados en los documentos manteniendo el estado de texto libre cuando no hay configuración.

**Prueba Independiente**: Con cotización→pedido→facturado configurado, solo se ofrecen los estados siguientes válidos, los inválidos se rechazan con explicaciones, y el estado es visible de un vistazo; sin configuración, el estado permanece como texto libre.

### Pruebas para la Historia de Usuario 12

- [X] T056 [P] [US12] Añadir pruebas unitarias para la aplicación de transiciones de estado en tests/unit/storage.test.js

### Implementación de la Historia de Usuario 12

- [X] T057 [US12] Restringir las opciones de estado de documento a las transiciones permitidas y aplicarlas al guardar en src/components/document-form.js y src/storage.js

**Punto de control**: La cadena de personalización (habilitadores de configuración → HU6/HU7/HU12) está completa de extremo a extremo.

---

## Fase 15: Pulido y Preocupaciones Transversales

**Propósito**: Mejorar la calidad, accesibilidad, fiabilidad y el comportamiento con conjuntos de datos grandes en todas las historias.

- [X] T058 [P] Añadir refinamientos de accesibilidad para etiquetas, foco de teclado y estructura semántica en src/styles.css y src/components/
- [X] T059 [P] Añadir pulido final de UX para estados vacíos, mensajes de validación y diseño responsivo en src/styles.css y src/components/
- [X] T060 Verificar que el renderizado de listas y la búsqueda permanecen responsivos y correctos con 500 registros mediante pruebas de rendimiento en tests/integration/performance-500.test.js (FR-032, SC-004)
- [X] T061 Ejecutar la suite completa de pruebas y probar manualmente los flujos principales de usuario con los scripts de package.json
- [X] T062 [P] Añadir estilos para la pantalla de bienvenida y la navegación de vistas en src/styles.css
- [X] T063 Ejecutar la suite completa de pruebas y la compilación de producción con los scripts de package.json para verificar que no hay regresiones

---

## Fase 16: Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco ERP persistente: una barra superior con logotipo derivado y nombre del módulo, más una barra lateral de botones de módulo con resaltado de módulo activo y contracción responsiva.

**Prueba Independiente**: En cada pantalla la barra superior y la barra lateral son visibles, el módulo activo está resaltado, la navegación entre módulos preserva los datos, y la barra lateral se contrae a una columna de iconos en ventanas gráficas estrechas.

### Pruebas para la Historia de Usuario 13

- [X] T064 [P] [US13] Añadir pruebas unitarias para validación del color de acento en tests/unit/module-config.test.js
- [X] T065 [P] [US13] Añadir pruebas de integración que afirmen que el marco (logotipo, nombre del módulo, botones de barra lateral, resaltado activo) aparece en todas las pantallas en tests/integration/workspace-shell.test.js

### Implementación de la Historia de Usuario 13

- [X] T066 [P] [US13] Añadir el marcado del marco del espacio de trabajo (barra superior, montaje de logotipo SVG en línea, botones de módulo en barra lateral, región de contenido principal) a index.html
- [X] T067 [P] [US13] Crear src/components/shell.js para renderizar el logotipo monograma SVG a partir del nombre del módulo, aplicar las etiquetas configuradas a los botones de módulo, gestionar el resaltado de módulo activo y exponer eventos de navegación
- [X] T068 [US13] Reemplazar las pestañas horizontales de gestión y la navegación independiente hacia atrás por enrutamiento de módulos mediante la barra lateral en src/app.js
- [X] T069 [P] [US13] Construir la hoja de estilos de tokens de diseño ERP (variables de color, escala de espaciado, tipografía) más estilos de barra superior, barra lateral y tarjetas en src/styles.css
- [X] T070 [US13] Soportar un theme.accentColor opcional en la validación de src/module-config.js y aplicarlo como propiedad personalizada de CSS en src/app.js
- [X] T071 [US13] Contraer la barra lateral a una columna de iconos en ventanas gráficas estrechas en src/styles.css
- [X] T072 [P] [US13] Actualizar las pruebas de integración existentes en tests/integration/manage-tabs.test.js y tests/integration/relabeling.test.js para apuntar al marco de barra lateral en lugar de los botones de pestañas/bienvenida

**Punto de control**: Todas las pantallas se renderizan dentro del marco con marca con navegación por barra lateral funcional y sin pérdida de datos.

---

## Fase 17: Historia de Usuario 3 (revisada) - Panel de inicio con acciones rápidas y estadísticas (Prioridad: P1)

**Objetivo**: Reemplazar la vista de bienvenida de dos botones por un panel ERP que ofrece múltiples botones de acción rápida y estadísticas de registros en vivo.

**Prueba Independiente**: La aplicación abre en un panel con acciones rápidas para nueva entidad, nuevo documento, gestión de entidades y buscar registros; activarlas aterriza en el lugar correcto listo para introducir datos, y las tarjetas de estadísticas coinciden con los registros almacenados.

### Pruebas para la Historia de Usuario 3

- [X] T073 [P] [US3] Añadir pruebas de integración para las acciones rápidas del panel y las estadísticas en vivo en tests/integration/dashboard.test.js

### Implementación de la Historia de Usuario 3

- [X] T074 [P] [US3] Añadir el marcado del panel (encabezado, cuadrícula de acciones rápidas, tarjetas de estadísticas) a index.html reemplazando la vista de bienvenida de dos botones
- [X] T075 [US3] Conectar los botones de acción rápida para abrir la gestión de entidades, la gestión de documentos (formularios limpiados) y la búsqueda (entrada enfocada) en src/app.js
- [X] T076 [US3] Renderizar y refrescar los recuentos de entidades/documentos desde el almacenamiento cada vez que se muestra el panel en src/components/dashboard.js
- [X] T077 [P] [US3] Dar estilo al encabezado del panel, las tarjetas de acción rápida y los mosaicos de estadísticas en src/styles.css

**Punto de control**: La aplicación abre en un panel funcional; cada tarea ERP clave está a un clic.

---

## Fase 18: Pulido y Regresión (Aspecto ERP)

**Propósito**: Unificar el estilo visual en toda la aplicación rediseñada y protegerse contra regresiones.

- [X] T078 [P] Rediseñar formularios, listas, insignias, mensajes de error y estados vacíos según el sistema de tokens de diseño en src/styles.css
- [X] T079 [P] Verificar el orden de foco del teclado y aria-current en los botones de módulo de la barra lateral en src/components/shell.js y src/styles.css (pase de accesibilidad del nuevo marco)
- [X] T080 Actualizar README.md con las secciones del marco del espacio de trabajo, panel y tematización
- [X] T081 Ejecutar la suite completa de pruebas y la compilación de producción con los scripts de package.json para verificar que no hay regresiones (FR-032, SC-004)

---

## Fase 19: Historia de Usuario 5 - Vista Explicativa e Impresión de Liquidaciones (Prioridad: P2)

**Objetivo**: Mostrar cada liquidación línea por línea con su base de cálculo, tasa o factor, fórmula y parámetro legal vigente, y ofrecer una vista limpia lista para imprimir o guardar en PDF.

**Prueba Independiente**: Al seleccionar una línea de haber, descuento o impuesto se despliega su desglose (base, tasa, fórmula y parámetro legal con vigencia) y el monto coincide con el de la línea; al pulsar imprimir se obtiene un comprobante sin barras laterales, menús ni botones, apto para papel o PDF.

### Pruebas para la Historia de Usuario 5

- [ ] T082 [P] [US5] Añadir pruebas unitarias para derivación y formato de la explicación (base, tasa o factor, fórmula, parámetro legal con fecha de vigencia y motivo de líneas manuales) en tests/unit/rrhh-liquidacion.test.js
- [ ] T083 [P] [US5] Añadir pruebas de integración para la vista src/rrhh/views/liquidacion.js (renderizado línea por línea, panel explicativo al seleccionar, totales) en tests/integration/rrhh-liquidacion-view.test.js
- [ ] T084 [P] [US5] Añadir pruebas de integración para el modo de impresión limpia, las reglas @media print, los eventos beforeprint/afterprint y la restauración del estado tras cancelar o finalizar la impresión en tests/integration/rrhh-liquidacion-print.test.js
- [ ] T085 [P] [US5] Añadir pruebas de integración para casos límite (línea manual sin fórmula, parámetro no vigente, liquidación en borrador o cerrada, uso obligatorio del snapshot congelado frente a parámetros vigentes actuales, datos faltantes del emisor, cancelación de impresión con restauración correcta) en tests/integration/rrhh-liquidacion-edge-cases.test.js

### Implementación de la Historia de Usuario 5

#### Estructura y datos

- [ ] T086 [P] [US5] Crear la estructura de carpetas src/rrhh/, src/rrhh/views/, src/rrhh/components/ y src/rrhh/utils/ si no existen
- [ ] T087 [US5] Definir y validar el modelo de lectura de LIQUIDACION y LINEA_LIQUIDACION en src/rrhh/utils/liquidacion-data.js (encabezado: trabajador, período, fecha de emisión, emisor/empresa; líneas: concepto, tipo, monto, base, tasa, fórmula y snapshot inmutable del parámetro legal: codigo, descripcion, fechaVigencia, valorAplicado, fuente, congeladoEnPeriodo; marcar líneas manuales con motivo)
- [ ] T087a [US5] Generar y persistir el snapshot inmutable de parámetros legales al momento de calcular la liquidación en src/rrhh/utils/liquidacion-calculo.js o src/rrhh/utils/liquidacion-service.js. La vista NUNCA debe leer parámetros vigentes actuales; las líneas deben conservar base, tasa/factor, fórmula o motivo y el snapshot congelado por período.
- [ ] T088 [US5] Implementar el servicio de carga de la cabecera y las líneas por identificador de liquidación, con datos de demostración cuando no existan, en src/rrhh/utils/liquidacion-service.js

#### Vista explicativa

- [ ] T089 [P] [US5] Crear la vista src/rrhh/views/liquidacion.js con encabezado (trabajador, período, fecha de emisión), listado de haberes y descuentos, totales y panel de "Vista Explicativa"
- [ ] T090 [US5] Renderizar cada línea con concepto, tipo (haber, descuento o impuesto), monto y estado seleccionable por clic y teclado (aria-selected) en src/rrhh/views/liquidacion.js
- [ ] T091 [US5] Mostrar al seleccionar una línea la base de cálculo, la tasa o factor aplicado, la fórmula con valores formateados y el monto resultante en src/rrhh/views/liquidacion.js
- [ ] T092 [US5] Identificar en el desglose el parámetro legal aplicado, su fecha de vigencia y fuente usando ÚNICAMENTE el snapshot congelado de la línea (guardado al calcular). Mostrar advertencia si falta el snapshot (caso legacy), no resolver con parámetros vigentes actuales. Usar los valores congelados del período en src/rrhh/utils/liquidacion-data.js y src/rrhh/views/liquidacion.js
- [ ] T093 [US5] Mostrar el motivo registrado en las líneas manuales en lugar de una fórmula, y un mensaje claro cuando no exista fórmula o parámetro legal, sin omitir la línea en src/rrhh/views/liquidacion.js

#### Impresión y PDF

- [ ] T094 [P] [US5] Añadir la acción "Imprimir / Guardar en PDF" que active el modo de impresión limpia usando window.print() (el navegador permite "Guardar como PDF"). Garantizar que solo se muestre en vista de liquidación calculada en src/rrhh/views/liquidacion.js
- [ ] T095 [US5] Implementar el modo de impresión: aplicar la clase print-clean, ocultar barra superior, barra lateral, navegación y botones. Gestionar con eventos beforeprint/afterprint (y fallback window.matchMedia("print")) para asegurar restauración incluso si el usuario cancela el diálogo. Limpiar estilos/flags al recibir afterprint en src/rrhh/views/liquidacion.js
- [ ] T096 [US5] Añadir estilos @media print en src/styles.css para .rrhh-liquidacion y .print-clean: ocultar .topbar, .sidebar, .app-nav y controles, una sola columna, colores legibles, tamaño carta/A4 vertical y page-break-inside: avoid en encabezado, filas y totales
- [ ] T097 [US5] Incluir en el comprobante imprimible la identificación del emisor (razón social/nombre, identificador fiscal/RUT) obtenida desde configuración, del trabajador y del período, el detalle de haberes, descuentos e impuestos, los totales, el líquido a pagar y la fecha de emisión, garantizando que los montos impresos coincidan con la liquidación en src/rrhh/views/liquidacion.js
- [ ] T097a [US5] Centralizar datos del emisor en src/module-config.js con valores por defecto y crear helper src/rrhh/utils/empresa.js (o src/rrhh/config/empresa.js) para obtenerlos de forma reutilizable.

#### Integración, permisos y accesibilidad

- [ ] T098 [US5] Integrar la vista en la navegación de RRHH/Planilla dentro del marco ERP existente en src/app.js y src/module-config.js
- [ ] T099 [US5] Respetar los permisos de acceso vigentes: ocultar las líneas y explicaciones no autorizadas tanto en pantalla como en el comprobante, usando la matriz de roles de src/rrhh/seguridad/roles.js y el contexto de sesión de src/rrhh/seguridad/session.js (crear la verificación mínima si el módulo aún no la expone)
- [ ] T100 [US5] Garantizar accesibilidad: foco visible en la línea seleccionada, aria-selected, etiquetas descriptivas del panel explicativo y botón de impresión accesible en src/rrhh/views/liquidacion.js

#### Verificación

- [ ] T101 [US5] Ejecutar las pruebas unitarias y de integración de la vista explicativa e impresión en tests/unit/rrhh-liquidacion.test.js y tests/integration/rrhh-liquidacion-*.test.js, y corregir los fallos
- [ ] T102 [US5] Verificar manualmente los escenarios de aceptación y casos límite (desglose, parámetro legal, línea manual, período cerrado, borrador, cancelación de impresión) en src/rrhh/views/liquidacion.js siguiendo spec.md y registrar el resultado
- [ ] T103 [US5] Comprobar los criterios de éxito SC-011 a SC-016 en src/rrhh/views/liquidacion.js y src/styles.css: tiempo de despliegue del desglose, tiempo para obtener el comprobante, comprensión de los montos, coincidencia de montos impresos y ausencia de controles de edición en la vista imprimible

**Punto de control**: La vista explicativa de liquidaciones muestra base, tasa, fórmula y parámetro legal línea por línea, y permite obtener un comprobante imprimible o PDF limpio y consistente con los montos calculados.

---

## Fase 20: Historia de Usuario 14 - Registro y Aprobación de Novedades del Mes (Prioridad: P1)

**Objetivo**: Permitir que los analistas de remuneraciones registren las novedades del período (horas extra, licencias médicas y ausencias) y que las jefaturas las aprueben o rechacen, con un período Abierto/Cerrado que bloquee cambios y sin almacenar diagnósticos ni datos clínicos; las novedades aprobadas alimentan el motor de cálculo de la Historia de Usuario 15.

**Prueba Independiente**: Un analista registra horas extra, una licencia médica y una ausencia para una Entidad trabajador; la licencia solo conserva tipo y días (sin diagnóstico); las novedades quedan pendientes y solo las aprobadas por la Jefatura quedan elegibles para cualquier procesamiento posterior; un analista no puede aprobar; en un período cerrado no se permite registrar, editar, corregir, reenviar, aprobar ni rechazar.

### Pruebas para la Historia de Usuario 14

- [ ] T104 [P] [US14] Añadir pruebas unitarias para la validación del modelo de novedad, los campos obligatorios por tipo (horas extra, licencia médica y ausencia), la cantidad/días positivos, las fechas coherentes, la referencia a una Entidad trabajador existente mediante entity_id y la prohibición de campos de diagnóstico en src/rrhh/utils/novedades-data.js en tests/unit/rrhh-novedades.test.js
- [ ] T105 [P] [US14] Añadir pruebas unitarias para la máquina de estados (pendiente, aprobada, rechazada y reenvío de rechazada a pendiente), los permisos por rol (Analista registra/edita, Jefatura aprueba/rechaza), el bloqueo por período cerrado y el rechazo con motivo en tests/unit/rrhh-novedades-aprobacion.test.js
- [ ] T106 [P] [US14] Añadir pruebas de integración para el registro de novedades desde el formulario, la retroalimentación de validación y la garantía de que una licencia médica solo persiste tipo y días sin diagnósticos ni texto clínico en tests/integration/rrhh-novedades-registro.test.js
- [ ] T107 [P] [US14] Añadir pruebas de integración para la aprobación y el rechazo individuales, la actualización visible del estado, el bloqueo de la elegibilidad para procesamiento posterior mientras existan novedades pendientes o rechazadas y la exposición exclusiva de novedades aprobadas en tests/integration/rrhh-novedades-aprobacion.test.js
- [ ] T108 [P] [US14] Añadir pruebas de integración para casos límite: período cerrado, rol sin permiso de aprobación, rechazo con motivo y reenvío, novedad duplicada, fechas fuera del período, ausencia sin justificación clínica, eliminación en cascada de la Entidad trabajador y restauración del estado tras errores en tests/integration/rrhh-novedades-edge-cases.test.js
- [ ] T109 [P] [US14] Añadir pruebas de integración para la navegación al módulo Novedades, las etiquetas configuradas y el resumen de pendientes por período en el marco ERP en tests/integration/rrhh-novedades-view.test.js

### Implementación de la Historia de Usuario 14

#### Estructura, modelo y persistencia

- [ ] T110 [P] [US14] Crear la estructura de carpetas src/rrhh/utils/, src/rrhh/components/, src/rrhh/views/ y src/rrhh/seguridad/ si no existen
- [ ] T111 [US14] Definir el modelo y la validación de NOVEDAD en src/rrhh/utils/novedades-data.js con id, trabajadorEntityId (entity_id de una Entidad existente que representa al trabajador), período (YYYY-MM), tipo (horas_extra, licencia_medica o ausencia), cantidad de horas o días, fechaInicio, fechaFin, observación no clínica, estado, registradoPor, aprobadoPor, fechaAprobacion, motivoRechazo, createdAt y updatedAt
- [ ] T112 [US14] Implementar la lista blanca de campos persistidos y el guardia de privacidad de la Ley 21.719 en src/rrhh/utils/novedades-privacidad.js para rechazar o descartar diagnósticos, códigos CIE, detalles clínicos y texto libre sensible, conservando solo tipo y días en licencias médicas
- [ ] T113 [US14] Implementar la persistencia y el CRUD de novedades en localStorage en src/rrhh/utils/novedades-service.js, incluyendo identificadores únicos, marcas de tiempo, filtros por período y trabajador, y actualización de una novedad existente
- [ ] T114 [US14] Consumir la verificación de período abierto o cerrado desde src/rrhh/utils/periodos.js (depende de T129) y aplicarla en src/rrhh/utils/novedades-service.js para impedir registrar, editar, corregir, reenviar, rechazar o aprobar novedades cuando el período no esté abierto
- [ ] T115 [US14] Implementar la máquina de estados y las reglas de aprobación en src/rrhh/utils/novedades-aprobacion.js (depende de T128): transiciones pendiente→aprobada, pendiente→rechazada y rechazada→pendiente (reenvío tras corrección), motivo de rechazo obligatorio y verificación de permisos con src/rrhh/seguridad/roles.js y src/rrhh/seguridad/session.js
- [ ] T116 [US14] Implementar el selector de novedades aprobadas por período y trabajador, el resumen de totales (horas extra, días de licencia y días de ausencia) y el guardián de elegibilidad que impide exponer novedades pendientes o rechazadas a cualquier procesamiento posterior en src/rrhh/utils/novedades-service.js
- [ ] T117 [US14] Exponer y documentar el contrato de elegibilidad que consumirá el motor de cálculo de la Historia de Usuario 15 (solo novedades aprobadas, con advertencia de pendientes/rechazadas), en src/rrhh/utils/novedades-service.js

#### Formulario, listado y aprobación

- [ ] T118 [P] [US14] Crear el formulario de registro de novedades en src/rrhh/components/novedad-form.js con campos específicos por tipo, validación en línea, aviso de privacidad y ausencia total de campos de diagnóstico o detalle clínico
- [ ] T119 [P] [US14] Crear el listado y panel de aprobación de novedades en src/rrhh/components/novedad-list.js con período, trabajador, tipo, cantidad, estado, pendientes por período, acciones de aprobar/rechazar para roles autorizados, acción de corregir y reenviar para novedades rechazadas y controles deshabilitados en períodos cerrados
- [ ] T120 [US14] Crear la vista de novedades en src/rrhh/views/novedades.js que orqueste el filtro por período, el formulario, el listado, la aprobación y el rechazo individuales, la corrección y el reenvío, el estado vacío y el mensaje de bloqueo de elegibilidad antes del procesamiento posterior
- [ ] T121 [US14] Integrar la vista de novedades en la navegación de RRHH/Planilla y en las etiquetas de tipos y estados en src/app.js y src/module-config.js
- [ ] T122 [P] [US14] Añadir estilos para el formulario, el listado, las insignias de estado, el aviso de privacidad y las acciones de aprobación, rechazo y reenvío, con comportamiento responsivo, en src/styles.css
- [ ] T123 [US14] Garantizar accesibilidad en la vista de novedades: etiquetas descriptivas, foco visible, navegación por teclado en acciones de aprobación, rechazo y reenvío, aria-live para resultados y mensajes de error claros en src/rrhh/views/novedades.js

#### Aclaraciones 2026-11-03: roles, períodos y vínculo con entidades

- [ ] T124 [P] [US14] Añadir pruebas unitarias para el modelo de roles y los guardias de permisos (Analista registra/edita, Jefatura aprueba/rechaza, Jefatura cierra períodos) en tests/unit/rrhh-seguridad.test.js
- [ ] T125 [P] [US14] Añadir pruebas unitarias para el modelo de PERIODO, las transiciones Abierto→Cerrado, el cierre exclusivo por Jefatura y el bloqueo de operaciones en períodos cerrados en tests/unit/rrhh-periodos.test.js
- [ ] T126 [P] [US14] Añadir pruebas de integración para la vista de gestión de períodos y el comportamiento de solo lectura del período cerrado en tests/integration/rrhh-periodos.test.js
- [ ] T127 [P] [US14] Añadir pruebas de integración para la validación del vínculo con la Entidad trabajador, la eliminación en cascada de novedades sin liquidaciones cerradas y la baja lógica con liquidaciones aprobadas o pagadas en tests/integration/rrhh-novedades-cascade.test.js
- [ ] T128 [US14] Implementar el contexto local de usuario/rol (Analista/Jefatura) con un selector en el marco y persistencia en localStorage en src/rrhh/seguridad/roles.js, src/rrhh/seguridad/session.js y src/components/shell.js
- [ ] T129 [US14] Definir el modelo y la validación de PERIODO en src/rrhh/utils/periodos.js con id, año, mes, estado Abierto/Cerrado, cerradoPor, fechaCierre, createdAt y updatedAt
- [ ] T130 [US14] Implementar la persistencia y el servicio de apertura/cierre de períodos con cierre exclusivo por Jefatura en src/rrhh/utils/periodos-service.js
- [ ] T131 [P] [US14] Crear la vista de gestión de períodos con listado, apertura y cierre en src/rrhh/components/periodo-list.js y src/rrhh/views/periodos.js
- [ ] T132 [US14] Integrar la gestión de períodos y el módulo Novedades en la navegación de RRHH/Planilla y en las etiquetas configuradas en src/app.js y src/module-config.js
- [ ] T133 [US14] Validar que trabajadorEntityId referencia una Entidad existente y eliminar en cascada las novedades asociadas al eliminar una Entidad trabajador sin liquidaciones aprobadas ni pagadas; con liquidaciones aprobadas o pagadas, aplicar baja lógica en src/rrhh/utils/novedades-service.js y src/storage.js
- [ ] T134 [US14] Añadir la acción de corregir y reenviar una novedad rechazada en src/rrhh/components/novedad-list.js y src/rrhh/views/novedades.js
- [ ] T135 [US14] Conectar los guardias de rol y de período a los flujos de registro, edición, aprobación, rechazo y reenvío de novedades en src/rrhh/views/novedades.js
- [ ] T136 [P] [US14] Añadir estilos para la gestión de períodos, el selector de rol y los controles de reenvío en src/styles.css
- [X] T137 [US14] Actualizar specs/001-erp-base-module/quickstart.md con los flujos de novedades, períodos, roles y cálculo de planilla

#### Verificación

- [ ] T138 [US14] Ejecutar las pruebas unitarias y de integración de novedades, aprobación, roles, períodos, privacidad y cascada en tests/unit/rrhh-*.test.js y tests/integration/rrhh-*.test.js, y corregir los fallos
- [ ] T139 [US14] Verificar manualmente los escenarios de aceptación de HU14 (licencia médica sin diagnóstico, aprobación obligatoria antes del procesamiento posterior, roles Analista/Jefatura y período cerrado) siguiendo specs/001-erp-base-module/quickstart.md y registrar el resultado
- [ ] T140 [US14] Comprobar que solo las novedades aprobadas se exponen a cualquier procesamiento posterior, que un período cerrado es de solo lectura y que no se persiste ningún dato clínico ni diagnóstico en src/rrhh/utils/novedades-service.js y src/rrhh/utils/periodos-service.js

**Punto de control**: Las novedades del mes se registran con validación por tipo y privacidad garantizada, requieren aprobación de la Jefatura antes de quedar elegibles para el motor de cálculo de la Historia de Usuario 15, solo las aprobadas se exponen a dicho procesamiento y los períodos cerrados permanecen inmutables.

---

## Fase 21: Historia de Usuario 15 - Cálculo de Planilla y Ciclo de Vida de Liquidaciones (Prioridad: P1)

**Objetivo**: Calcular las liquidaciones del período con contratos vigentes, novedades aprobadas y parámetros legales versionados; persistir líneas explicables con snapshot; aplicar el ciclo de vida borrador → calculada → aprobada → pagada/anulada; y congelar el período al cerrarlo.

**Prueba Independiente**: Con un trabajador y contrato vigente, una novedad aprobada y parámetros vigentes, el cálculo genera una liquidación con líneas explicables que cuadra con el caso de referencia ($1.272.908 líquidos y $1.659.456 de costo empleador); un período cerrado bloquea recálculo y edición.

### Pruebas para la Historia de Usuario 15

- [ ] T141 [P] [US15] Añadir pruebas unitarias para la selección de parámetros legales por fecha de vigencia, topes y tramos de impuesto en tests/unit/rrhh-calculo-parametros.test.js
- [ ] T142 [P] [US15] Añadir pruebas unitarias del motor para sueldo proporcional, horas extra, gratificación, haberes no imponibles, cotizaciones AFP/salud/AFC, impuesto único, descuentos con tope del 15 %, líquido, aportes y costo empleador en tests/unit/rrhh-calculo.test.js
- [ ] T143 [P] [US15] Añadir pruebas unitarias de redondeo por línea y del caso de referencia del plan 002 ($1.272.908 líquidos y $1.659.456 de costo empleador) en tests/unit/rrhh-calculo-referencia.test.js
- [ ] T144 [P] [US15] Añadir pruebas unitarias del ciclo de vida de la liquidación (borrador, calculada, aprobada, pagada, anulada), transiciones inválidas y bloqueo por período cerrado en tests/unit/rrhh-liquidacion-estados.test.js
- [ ] T145 [P] [US15] Añadir pruebas de integración del cálculo de un período: una liquidación por trabajador/período, solo novedades aprobadas, advertencia de pendientes/rechazadas y trabajadores sin contrato excluidos en tests/integration/rrhh-calculo-periodo.test.js
- [ ] T146 [P] [US15] Añadir pruebas de integración del cierre de período: congelamiento de UF, UTM, IMM y parámetros, y bloqueo de recálculo/edición en tests/integration/rrhh-cierre-periodo.test.js
- [ ] T147 [P] [US15] Añadir pruebas de integración de parámetros versionados: un cambio de vigencia afecta solo a períodos posteriores y no altera liquidaciones anteriores en tests/integration/rrhh-parametros-vigencia.test.js
- [ ] T148 [P] [US15] Añadir pruebas de integración del ciclo aprobación/pago/anulación, la trazabilidad de usuario y fecha y los registros de auditoría en tests/integration/rrhh-liquidacion-ciclo.test.js
- [ ] T149 [P] [US15] Añadir pruebas unitarias de validación de RUT con dígito verificador en tests/unit/rrhh-rut.test.js

### Implementación de la Historia de Usuario 15

#### Estructura y motor de cálculo

- [ ] T150 [P] [US15] Crear la estructura src/rrhh/calculo/ y src/rrhh/utils/ si no existen, y documentar las funciones puras del motor en src/rrhh/calculo/README.md
- [ ] T151 [US15] Implementar src/rrhh/calculo/parametros.js para resolver parámetros legales por código y fecha de vigencia, topes imponibles y tramos de impuesto
- [ ] T152 [US15] Implementar src/rrhh/calculo/rut.js con validación de RUT y dígito verificador, e integrarla en el guardado de la ficha del trabajador y en el cálculo de la liquidación
- [ ] T153 [US15] Implementar src/rrhh/calculo/motor.js con las funciones puras de los pasos 1-14: sueldo proporcional, horas extra, gratificación, haberes no imponibles, cotizaciones, impuesto, descuentos, líquido, aportes y costo empleador
- [ ] T154 [US15] Implementar el redondeo por línea al peso y el cálculo de totales desde líneas redondeadas en src/rrhh/calculo/motor.js
- [ ] T155 [US15] Implementar la selección de novedades aprobadas y la exclusión con advertencia de pendientes/rechazadas en src/rrhh/calculo/motor.js y src/rrhh/utils/novedades-service.js

#### Servicios, persistencia y ciclo de vida

- [ ] T156 [US15] Implementar src/rrhh/utils/parametros-service.js con la carga inicial de parámetros legales, vigencias y tramos de impuesto
- [ ] T157 [US15] Implementar src/rrhh/utils/conceptos-service.js con el catálogo de conceptos y su clasificación imponible, no imponible, previsional y contable
- [ ] T158 [US15] Implementar src/rrhh/utils/liquidacion-service.js para orquestar el cálculo: cargar contratos vigentes, novedades aprobadas y parámetros, generar cabecera y líneas, y persistir el snapshot legal
- [ ] T159 [US15] Implementar src/rrhh/utils/liquidacion-estados.js con el ciclo de vida borrador → calculada → aprobada → pagada / anulada, guardias de transición y permisos por rol
- [ ] T160 [US15] Integrar el cálculo y cierre en src/rrhh/utils/periodos-service.js: congelar UF, UTM, IMM y parámetros, impedir recálculo/edición y conservar el historial
- [ ] T161 [US15] Implementar el resumen de costo empleador y por centro de costo en src/rrhh/utils/costo-empleador.js para integración con Contabilidad, Finanzas y Control de Gestión
- [ ] T162 [US15] Implementar el registro de auditoría de cálculo, aprobación, pago, anulación y consultas sensibles en src/rrhh/seguridad/auditoria.js
- [ ] T163 [US15] Actualizar src/rrhh/utils/liquidacion-data.js para consumir el snapshot persistido por el motor y mantener la compatibilidad con la vista explicativa de HU5

#### Vistas e integración

- [ ] T164 [P] [US15] Crear src/rrhh/components/calculo-resumen.js con el resumen previo a confirmar (trabajadores, novedades aprobadas, pendientes y totales)
- [ ] T165 [P] [US15] Crear src/rrhh/views/planilla.js con listado de períodos, acción de calcular, resumen de resultados y advertencia de novedades no elegibles
- [ ] T166 [US15] Crear src/rrhh/views/liquidaciones.js con el listado de liquidaciones del período y las acciones de aprobar, pagar y anular según rol
- [ ] T167 [US15] Integrar las vistas de planilla y liquidaciones en la navegación y etiquetas de RR.HH. en src/app.js y src/module-config.js
- [ ] T168 [P] [US15] Añadir estilos para planilla, resumen de cálculo, insignias de estado y acciones del ciclo de vida en src/styles.css
- [ ] T169 [US15] Garantizar accesibilidad en planilla y liquidaciones: etiquetas descriptivas, foco visible, navegación por teclado y aria-live para resultados y advertencias en src/rrhh/views/planilla.js y src/rrhh/views/liquidaciones.js

#### Verificación

- [ ] T170 [US15] Ejecutar las pruebas unitarias y de integración de cálculo, parámetros, RUT, estados, cierre y auditoría en tests/unit/rrhh-*.test.js y tests/integration/rrhh-*.test.js, y corregir los fallos
- [ ] T171 [US15] Verificar manualmente los escenarios de aceptación de HU15 y el caso de referencia del plan 002 siguiendo specs/001-erp-base-module/quickstart.md y registrar el resultado
- [ ] T172 [US15] Comprobar SC-017 a SC-022: cálculo de 200 trabajadores en menos de 1 segundo, caso de referencia al peso, parámetros congelados, transiciones inválidas rechazadas, novedades no aprobadas excluidas y cero modificaciones al código central en tests/unit/rrhh-*.test.js, tests/integration/rrhh-*.test.js y specs/001-erp-base-module/quickstart.md

**Punto de control**: El período se calcula con contratos, novedades aprobadas y parámetros vigentes; cada liquidación conserva líneas explicables y snapshot; el ciclo de vida y el cierre del período son inmutables; el caso de referencia cuadra al peso.

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- Configuración (Fase 1): Sin dependencias
- Fundacional (Fase 2): Depende de completar Configuración
- Historia de Usuario 1 (Fase 3): Depende de completar Fundacional
- Historia de Usuario 2 (Fase 4): Depende de completar la implementación de la Historia de Usuario 1
- Historia de Usuario 3 (Fase 5): Depende de completar Fundacional
- Historia de Usuario 4 (Fase 6): Depende de completar la Historia de Usuario 3 y se beneficia de que los formularios de las Historias de Usuario 1-2 estén disponibles
- Habilitadores de configuración (Fase 7): Depende de completar Fundacional; desbloquea HU6, HU7, HU12 y HU13
- Historia de Usuario 6 (Fase 8): Depende de completar los habilitadores de configuración (Fase 7)
- Historia de Usuario 7 (Fase 9): Depende de completar los habilitadores de configuración (Fase 7)
- Historia de Usuario 8 (Fase 10): Depende de completar Fundacional y puede proceder después de la Historia de Usuario 1
- Historia de Usuario 9 (Fase 11): Depende de completar Fundacional y puede proceder después de la Historia de Usuario 1
- Historia de Usuario 10 (Fase 12): Depende de completar la implementación de la Historia de Usuario 1 y del campo entity_id
- Historia de Usuario 11 (Fase 13): Depende de la Historia de Usuario 8 (lógica de búsqueda) y la Historia de Usuario 3 (navegación)
- Historia de Usuario 12 (Fase 14): Depende de los habilitadores de configuración (Fase 7) y la Historia de Usuario 10 (documentos)
- Pulido (Fase 15): Depende de que todas las historias de usuario deseadas estén completas
- Historia de Usuario 13 (Fase 16): Depende de que las Fases 1-15 estén completas; reestructura la navegación entregada por HU3/HU4 dentro del marco
- Historia de Usuario 3 revisada (Fase 17): Depende de la Fase 16 (el enrutamiento por barra lateral debe existir antes de que las acciones del panel lo usen)
- Pulido Aspecto ERP (Fase 18): Depende de que las Fases 16 y 17 estén completas
- Historia de Usuario 5 (Fase 19): Depende del marco ERP (Fase 16) y de que existan liquidaciones y líneas calculadas; al ser P2 se aborda después de las historias P1
- Historia de Usuario 14 (Fase 20): Depende del marco ERP (Fase 16) y de la estructura base de RRHH/Planilla (Fase 19, tareas T086-T088) para compartir navegación y estilos; expone las novedades aprobadas al motor de cálculo de HU15. Los roles (T124, T128), períodos (T125-T126, T129-T132), vínculo/cascada (T127, T133) y aprobación (T104-T123) pueden avanzar en paralelo con HU5; la verificación T138-T140 requiere que todas las tareas de HU14 estén completas
- Historia de Usuario 15 (Fase 21): Depende de la estructura RR.HH. (Fase 19, T086-T088), de las novedades aprobadas y períodos (Fase 20, T104-T140) y de los parámetros legales (T151, T156). El motor (T151-T155) puede avanzar en paralelo con las vistas (T164-T169); el cierre (T160) requiere el ciclo de vida (T159); la verificación T170-T172 requiere que todas las tareas de HU15 estén completas

### Oportunidades Paralelas

- T003 puede ejecutarse en paralelo con las tareas de configuración
- T007 puede completarse junto al trabajo de almacenamiento y esqueleto de la aplicación
- Las pruebas de cada historia pueden crearse en paralelo con las tareas de implementación de la misma historia
- Después de la Fase 7 (perfil de configuración), HU6 (Fase 8) y HU7 (Fase 9) pueden proceder en paralelo
- HU8 (Fase 10) y HU9 (Fase 11) son independientes y pueden proceder en paralelo después de la Historia de Usuario 1
- En la Fase 15, T058-T060 pueden ejecutarse en paralelo antes de las tareas finales de verificación T061-T063
- En la Fase 16, T064-T067 y T069 pueden ejecutarse en paralelo; T072 aterriza junto al cambio de enrutamiento T068
- En la Fase 17, T073/T074/T077 pueden ejecutarse en paralelo con T075/T076
- En la Fase 18, T078 y T079 pueden ejecutarse en paralelo antes de la verificación final T080-T081
- En la Fase 19, las pruebas T082-T085 son paralelas entre sí; T086/T087 y T089/T094 pueden iniciarse en paralelo; T091-T093 comparten archivo y avanzan en secuencia
- En la Fase 20, las pruebas T104-T109 y T124-T127 son paralelas entre sí; T110, T118, T119, T122, T131 y T136 pueden iniciarse en paralelo; T111-T117 y T128-T135 comparten la capa de datos/servicio y avanzan en secuencia; T120 depende de T118-T119 y T121 depende de T120; T138-T140 son la verificación final
- En la Fase 21, las pruebas T141-T149 son paralelas entre sí; T150-T155 (motor) pueden avanzar en paralelo con T164-T169 (vistas); T156-T163 comparten la capa de servicios y avanzan en secuencia; T160 depende de T159; T170-T172 son la verificación final

### Ejemplo Paralelo: Historia de Usuario 5

```text
# Lanzar en paralelo las pruebas de la Historia de Usuario 5:
Tarea: "Pruebas unitarias de la explicación (base, tasa, fórmula, parámetro legal) en tests/unit/rrhh-liquidacion.test.js"
Tarea: "Pruebas de integración de la vista en tests/integration/rrhh-liquidacion-view.test.js"
Tarea: "Pruebas de integración de impresión limpia en tests/integration/rrhh-liquidacion-print.test.js"
Tarea: "Pruebas de integración de casos límite en tests/integration/rrhh-liquidacion-edge-cases.test.js"

# Iniciar en paralelo la base de datos y la estructura de la vista:
Tarea: "Crear carpetas src/rrhh/ y src/rrhh/views/"
Tarea: "Definir el modelo de lectura de LIQUIDACION y LINEA_LIQUIDACION en src/rrhh/utils/liquidacion-data.js"
Tarea: "Crear el layout de la vista en src/rrhh/views/liquidacion.js"
Tarea: "Añadir la acción Imprimir / Guardar en PDF en src/rrhh/views/liquidacion.js"
```

### Ejemplo Paralelo: Historia de Usuario 14

```text
# Lanzar en paralelo las pruebas de la Historia de Usuario 14:
Tarea: "Pruebas unitarias del modelo, validación y privacidad en tests/unit/rrhh-novedades.test.js"
Tarea: "Pruebas unitarias de aprobación, roles y período en tests/unit/rrhh-novedades-aprobacion.test.js"
Tarea: "Pruebas de integración del registro de novedades en tests/integration/rrhh-novedades-registro.test.js"
Tarea: "Pruebas de integración de aprobación y bloqueo de elegibilidad en tests/integration/rrhh-novedades-aprobacion.test.js"
Tarea: "Pruebas de integración de casos límite en tests/integration/rrhh-novedades-edge-cases.test.js"
Tarea: "Pruebas de integración de navegación y etiquetas en tests/integration/rrhh-novedades-view.test.js"
Tarea: "Pruebas de roles y permisos en tests/unit/rrhh-seguridad.test.js"
Tarea: "Pruebas de períodos en tests/unit/rrhh-periodos.test.js y tests/integration/rrhh-periodos.test.js"
Tarea: "Pruebas de vínculo y cascada de la Entidad trabajador en tests/integration/rrhh-novedades-cascade.test.js"

# Iniciar en paralelo la estructura y los componentes visuales:
Tarea: "Crear las carpetas src/rrhh/utils/, src/rrhh/components/, src/rrhh/views/ y src/rrhh/seguridad/"
Tarea: "Crear el contexto de roles en src/rrhh/seguridad/roles.js y src/rrhh/seguridad/session.js"
Tarea: "Crear el modelo y servicio de períodos en src/rrhh/utils/periodos.js y src/rrhh/utils/periodos-service.js"
Tarea: "Crear la vista de períodos en src/rrhh/components/periodo-list.js y src/rrhh/views/periodos.js"
Tarea: "Crear el formulario de novedades en src/rrhh/components/novedad-form.js"
Tarea: "Crear el listado y panel de aprobación en src/rrhh/components/novedad-list.js"
Tarea: "Añadir estilos de novedades, períodos y roles en src/styles.css"
```

### Ejemplo Paralelo: Historia de Usuario 15

```text
# Lanzar en paralelo las pruebas de la Historia de Usuario 15:
Tarea: "Pruebas unitarias de parámetros, vigencias y tramos en tests/unit/rrhh-calculo-parametros.test.js"
Tarea: "Pruebas unitarias del motor y del caso de referencia en tests/unit/rrhh-calculo.test.js y tests/unit/rrhh-calculo-referencia.test.js"
Tarea: "Pruebas unitarias de estados y RUT en tests/unit/rrhh-liquidacion-estados.test.js y tests/unit/rrhh-rut.test.js"
Tarea: "Pruebas de integración de cálculo, cierre, vigencias y ciclo de vida en tests/integration/rrhh-*.test.js"

# Iniciar en paralelo el motor y las vistas:
Tarea: "Crear src/rrhh/calculo/ y documentar las funciones puras en src/rrhh/calculo/README.md"
Tarea: "Implementar src/rrhh/calculo/parametros.js y src/rrhh/calculo/rut.js"
Tarea: "Implementar src/rrhh/calculo/motor.js con los pasos 1-14 y redondeo"
Tarea: "Crear src/rrhh/components/calculo-resumen.js y src/rrhh/views/planilla.js"
Tarea: "Crear src/rrhh/views/liquidaciones.js y estilos en src/styles.css"

# Integrar y verificar en secuencia:
Tarea: "Implementar servicios de liquidación, estados, período y auditoría"
Tarea: "Integrar navegación y etiquetas en src/app.js y src/module-config.js"
Tarea: "Ejecutar T170-T172 y validar el caso de referencia"
```

---

## Estrategia de Implementación

### Primero el MVP (solo Historia de Usuario 1)

1. Completar la Fase 1: Configuración
2. Completar la Fase 2: Fundacional (CRÍTICO: bloquea todas las historias)
3. Completar la Fase 3: Historia de Usuario 1
4. **DETENERSE Y VALIDAR**: probar la Historia de Usuario 1 de forma independiente
5. Desplegar o demostrar si está lista

### Entrega Incremental

1. Completar Configuración + Fundacional → base lista
2. Añadir Historia de Usuario 1 → probar y demostrar (MVP)
3. Añadir el resto de historias P1 (HU2, HU3, HU4, HU6, HU7, HU13, HU14, HU15) en orden de dependencias
4. Añadir las historias P2 (HU8, HU9, HU10, HU11, HU12) y finalmente HU5 (Fase 19), que consume las liquidaciones calculadas por HU15
5. Cada historia añade valor sin romper las anteriores

### Estrategia de Equipo en Paralelo

1. El equipo completa Configuración + Fundacional en conjunto
2. Con la base lista, repartir historias independientes por desarrollador
3. Las historias se completan e integran de forma independiente; HU14 registra y aprueba novedades y expone solo las aprobadas; HU15 implementa el motor de cálculo, el ciclo de vida y el cierre; HU5 se integra al final porque consume las liquidaciones ya calculadas

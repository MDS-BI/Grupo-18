# Especificación de la Funcionalidad: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama de la funcionalidad**: 001-erp-base-module  
**Creada**: 2026-07-08  
**Actualizada**: 2026-11-03  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Construir un módulo base de software de planificación de recursos empresariales (ERP) que pueda extenderse en módulos ERP personalizados. Debe proporcionar gestión de datos maestros (entidades) y documentos transaccionales vinculados con capacidades de crear/editar/eliminar/buscar."  
**Última incorporación**: Historia de Usuario 6 — Seguridad, Roles y Gobierno de Datos (P2); las historias posteriores se renumeraron en consecuencia.

## Propósito

Este proyecto sirve como módulo base reutilizable para construir módulos ERP personalizados. Establece los patrones comunes que todo módulo ERP necesita: gestionar registros de datos maestros (**Entidades**) y sus **Documentos** transaccionales asociados, con navegación, validación, persistencia y búsqueda ya implementadas, de modo que los módulos personalizados solo necesiten definir sus campos y reglas específicos del dominio.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Gestión de Fichas de Trabajadores y Catálogos Base (Prioridad: P1)
Como usuario de negocio, quiero crear entradas de entidad con detalles claros para poder construir y mantener los datos maestros del módulo.

**Por qué esta prioridad**: Este es el valor central del producto porque, sin crear entidades, el resto de la experiencia no puede aportar valor.

**Prueba Independiente**: Un usuario puede abrir el módulo, añadir una nueva entidad y verla aparecer en la lista.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está viendo la lista de entidades, **cuando** crea una nueva entidad con un nombre y un código, **entonces** la nueva entidad se guarda y aparece en la lista.
2. **Dado** que un usuario está creando una entidad, **cuando** deja la información obligatoria en blanco, **entonces** el sistema impide guardar y explica qué se necesita.

---

### Historia de Usuario 2 - Editar y eliminar entidades (Prioridad: P1)
Como usuario de negocio, quiero actualizar o eliminar entidades cuando cambien los datos maestros para que los registros se mantengan precisos.

**Por qué esta prioridad**: Mantener los registros actualizados es esencial para la confianza en la herramienta y para soportar las operaciones comerciales diarias.

**Prueba Independiente**: Un usuario puede seleccionar una entidad existente, cambiar su información o eliminarla, y la lista refleja el cambio.

**Escenarios de Aceptación**:

1. **Dada** una entidad que ya existe en la lista, **cuando** el usuario edita sus detalles, **entonces** la información actualizada se guarda y se muestra en la lista.
2. **Dada** una entidad que ya no es relevante, **cuando** el usuario la elimina, **entonces** desaparece de la lista y deja de aparecer en los resultados de búsqueda.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario edita o elimina una, **entonces** la lista se actualiza correctamente y sigue siendo ágil.

---

### Historia de Usuario 3 - Panel de inicio con acciones rápidas y estadísticas de registros (Prioridad: P1)

Como usuario de negocio, quiero aterrizar en un panel estilo ERP con botones de acción rápida claramente etiquetados para las tareas clave y totales de registros de un vistazo al abrir la aplicación, para poder empezar a trabajar de inmediato.

**Por qué esta prioridad**: El panel es el punto de entrada de la aplicación. Nada más puede alcanzarse sin él, y las acciones rápidas son la ruta más rápida hacia cada flujo de trabajo central.

**Prueba Independiente**: Un usuario abre la aplicación, ve un panel con múltiples botones de acción rápida y estadísticas de registros, inicia una nueva entidad o documento con un solo clic y ve estadísticas que reflejan los datos almacenados.

**Escenarios de Aceptación**:

1. **Dado** que el usuario abre la aplicación, **cuando** la aplicación carga, **entonces** se muestra el panel de inicio con al menos cuatro botones de acción rápida claramente etiquetados que cubren las tareas ERP clave: crear una nueva entidad, crear un nuevo documento, abrir la gestión de entidades y buscar registros.
2. **Dado** que se muestra el panel, **cuando** el usuario activa la acción de nueva entidad, **entonces** la aplicación abre el área de gestión de entidades con un formulario vacío listo para introducir datos.
3. **Dado** que se muestra el panel, **cuando** el usuario activa la acción de nuevo documento, **entonces** la aplicación abre el área de gestión de documentos con un formulario vacío listo para introducir datos.
4. **Dado** que se muestra el panel, **cuando** el usuario activa la acción de buscar registros, **entonces** la aplicación abre la pantalla de búsqueda con el campo de búsqueda enfocado.
5. **Dadas** entidades y documentos almacenados, **cuando** el usuario ve el panel, **entonces** las tarjetas de estadísticas muestran el recuento actual de entidades y documentos.
6. **Dado** que el usuario crea o elimina registros en otra parte de la aplicación, **cuando** vuelve al panel, **entonces** las estadísticas reflejan el cambio.

---

### Historia de Usuario 4 - Gestionar entidades y documentos en una pantalla dedicada (Prioridad: P1)

Como analista de remuneraciones, quiero ejecutar el motor de cálculo masivo para generar todas las liquidaciones del mes aplicando la ley chilena (imponibles, AFP, salud, seguro de cesantía e impuesto único) y cerrar el período para congelar los valores, para poder pagar sueldos correctos sin depender de planillas Excel propensas a errores.

**Por qué esta prioridad**: El motor de cálculo es el núcleo del valor del módulo. Automatiza el proceso más complejo y propenso a errores de la gestión de remuneraciones, y sin él las historias de carga de contratos y novedades no generan ningún resultado utilizable.

**Prueba Independiente**: Un analista ejecuta el cálculo sobre un período con datos de prueba, obtiene liquidaciones idénticas al caso de referencia oficial (cuadradas al peso), cierra el período y verifica que la UF y la UTM quedan congeladas y que ninguna liquidación o novedad puede modificarse.

**Escenarios de Aceptación**:

1. **Dado** un período abierto con contratos vigentes y novedades aprobadas, **cuando** el usuario ejecuta el cálculo, **entonces** el sistema genera una liquidación por cada trabajador detallando haberes imponibles y no imponibles, descuentos legales (AFP, salud, seguro de cesantía), impuesto único, líquido a pagar y aportes del empleador en menos de 1 segundo.
2. **Dado** un trabajador cuya remuneración supera el tope imponible vigente, **cuando** se ejecuta el cálculo, **entonces** las cotizaciones de AFP y salud se calculan sobre el tope de 90 UF y el seguro de cesantía sobre el tope de 135,2 UF, usando la UF del período.
3. **Dado** un trabajador con base tributable dentro de un tramo del impuesto único, **cuando** se ejecuta el cálculo, **entonces** el impuesto se determina restando las cotizaciones obligatorias de la renta tributable y aplicando la tabla mensual en UTM vigente para el período.
4. **Dado** el caso de referencia oficial cargado como datos de prueba, **cuando** se ejecuta el cálculo, **entonces** cada línea de cada liquidación coincide al peso con el valor esperado.
5. **Dado** un período ya calculado, **cuando** el usuario corrige una novedad y vuelve a ejecutar el cálculo, **entonces** el sistema reemplaza las liquidaciones en borrador sin duplicarlas y refleja la corrección.
6. **Dado** un período calculado sin errores ni novedades pendientes, **cuando** el usuario cierra el período, **entonces** el sistema congela la UF, la UTM y las tasas utilizadas, registra quién y cuándo lo cerró, y cambia el estado del período a cerrado.
7. **Dado** un período con trabajadores sin calcular o con novedades pendientes de aprobación, **cuando** el usuario intenta cerrarlo, **entonces** el sistema rechaza el cierre e indica qué registros lo impiden.
8. **Dado** un período cerrado, **cuando** cualquier usuario o proceso intenta modificar una liquidación o novedad de ese período, **entonces** el sistema bloquea la operación y muestra un mensaje indicando que el período está cerrado, garantizando la inmutabilidad de los pagos.
9. **Dado** un período cerrado, **cuando** se actualizan los indicadores (UF, UTM o tasas) para un período posterior, **entonces** las liquidaciones del período cerrado conservan exactamente los valores con que fueron calculadas.

---

### Historia de Usuario 5 - Vista Explicativa e Impresión de Liquidaciones (Prioridad: P2)

Como trabajador o analista, quiero visualizar la liquidación línea por línea con su fórmula explicativa y contar con una vista lista para imprimir o guardar en PDF, para asegurar absoluta transparencia en los montos pagados.

**Por qué esta prioridad**: La explicabilidad de los cálculos genera confianza y reduce drásticamente las consultas y reclamos internos. Aporta valor una vez que las liquidaciones ya se calculan, por lo que mejora la experiencia sin bloquear el flujo principal de gestión.

**Prueba Independiente**: Al hacer clic en cualquier línea de la liquidación, el sistema despliega el desglose matemático y el parámetro legal utilizado; al imprimir, se obtiene un comprobante limpio y legible.

**Escenarios de Aceptación**:

1. **Dado** una liquidación calculada, **cuando** el usuario selecciona una línea (p. ej., gratificación o impuesto), **entonces** se muestra la base de cálculo, la tasa o factor aplicado y la fórmula utilizada.
2. **Dado** que se requiere entregar el comprobante, **cuando** el usuario presiona imprimir, **entonces** se presenta un formato limpio adaptado para papel o PDF, sin menús, botones de edición ni controles de navegación.
3. **Dado** un desglose desplegado, **cuando** el usuario lo revisa, **entonces** identifica el parámetro legal utilizado con su fecha de vigencia y el monto explicado coincide con el de la línea.
4. **Dado** un período cerrado o una liquidación pagada, **cuando** el usuario consulta una línea, **entonces** la explicación muestra los valores congelados del período y no los parámetros vigentes actuales.
5. **Dado** que el usuario cancela el diálogo de impresión, **cuando** vuelve a la liquidación, **entonces** la vista y los datos permanecen sin cambios.

---

### Historia de Usuario 6 - Seguridad, Roles y Gobierno de Datos (Prioridad: P2)

Como administrador, quiero restringir el acceso a datos sensibles (sueldos, cuentas bancarias, cuotas sindicales) según el rol del usuario y registrar una bitácora de auditoría, para cumplir estrictamente con la normativa de protección de datos (Ley 21.719).

**Por qué esta prioridad**: Protege la privacidad de la información personal y asegura la trazabilidad de cualquier modificación.

**Prueba Independiente**: Al simular el rol de "Jefatura", la interfaz oculta automáticamente los sueldos y los datos financieros confidenciales.

**Escenarios de Aceptación**:

1. **Dado** un usuario con rol de jefatura, **cuando** consulta el sistema, **entonces** visualiza las novedades de su equipo pero no tiene acceso a las liquidaciones ni a los sueldos base.
2. **Dado** cualquier cambio o consulta de información sensible, **entonces** el sistema genera un registro automático de auditoría de solo inserción.

---

### Historia de Usuario 7 - Reetiquetar pantallas desde la configuración (Prioridad: P1)

Como desarrollador de módulos, quiero que todas las etiquetas visibles para el usuario deriven de la configuración, para que un módulo adaptado hable su idioma de dominio de forma consistente en todo momento.

**Por qué esta prioridad**: Los usuarios confían en un módulo que dice consistentemente "Cliente" y "Pedido de Venta" en lugar de dejar filtrarse una "Entidad" genérica por media interfaz; la terminología inconsistente hace que los módulos adaptados parezcan rotos. Esta historia depende del perfil de configuración del módulo.

**Prueba Independiente**: Un desarrollador mapea Entidad→Cliente y Documento→Pedido de Venta en la configuración, y cada pestaña, botón, etiqueta de formulario, encabezado y mensaje en las tres pantallas usa los términos mapeados.

**Escenarios de Aceptación**:

1. **Dados** mapeos de términos definidos en la configuración, **cuando** cualquier pantalla carga, **entonces** pestañas, botones, etiquetas de formulario, encabezados y mensajes de estado vacío muestran los términos configurados.
2. **Dado** que las etiquetas han sido remapeadas, **cuando** el usuario navega entre pantallas, **entonces** el comportamiento de navegación no cambia.
3. **Dado** que no se proporcionan mapeos, **cuando** cualquier pantalla carga, **entonces** se muestran los términos predeterminados Entidad/Documento.

---

### Historia de Usuario 8 - Declarar campos personalizados para los registros (Prioridad: P1)

Como desarrollador de módulos, quiero declarar campos adicionales para entidades y documentos en la configuración, para que aparezcan automáticamente en formularios, listas, validación y búsqueda sin escribir código de interfaz.

**Por qué esta prioridad** : Los módulos personalizados existen porque sus registros contienen datos específicos del dominio (el límite de crédito de un cliente, la fecha de vencimiento de una factura). Si agregar campos requiere editar formularios y validación a mano, la adaptación es propensa a errores y no escala. Esta historia depende del perfil de configuración del módulo.

**Prueba Independiente** : Un desarrollador declara un campo numérico obligatorio personalizado en las entidades; se muestra como entrada numérica en el formulario, bloquea el guardado cuando está en blanco, muestra los valores guardados en las listas y coinciden en las búsquedas.

**Escenarios de Aceptación** : 
1. **Dado** un campo personalizado de entidad de tipo número declarado como obligatorio, **cuando** el usuario crea o edita una entidad, **entonces** el campo se muestra como entrada numérica y un valor en blanco impide guardar con una explicación clara.
2. **Dado** un campo personalizado con un valor guardado, **cuando** el usuario ve la lista o la vista de detalle, **entonces** el valor se muestra.
3. **Dados** campos personalizados declarados, **cuando** el usuario busca usando un término que coincida con un valor de campo personalizado, **entonces** se devuelven los registros coincidentes.
Dado que no hay campos personalizados declarados, cuando se ejecuta la aplicación, entonces el comportamiento es idéntico al del módulo base sin modificar.

---

### Historia de Usuario 9 - Buscar y encontrar entidades rápidamente (Prioridad: P2)

Como de negocio, quiero buscar mis entidades por detalles clave de usuario para encontrar rápidamente el registro que necesito.

**Por qué esta prioridad** : La recuperación rápida mejora la utilidad cuando el conjunto de datos crece más allá de un pequeño número de entradas.

**Prueba Independiente** : Un usuario puede introducir un término de búsqueda y ver solo las entidades coincidentes.

**Escenarios de Aceptación** :

1. **Dadas** múltiples entidades almacenadas, **cuando** el usuario busca con un término coincidente, **entonces** solo se muestran las entidades coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** el sistema muestra un estado vacío claro y permite volver a intentarlo.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario busca, **entonces** los resultados coinciden aparecen con prontitud sin retraso perceptible.

---

### Historia de Usuario 10 - Registrar una fecha objetivo (Prioridad: P2)

Como de negocio, quiero adjuntar una fecha objetivo opcional a una entidad de usuario para planificar y ordenar los registros según cuándo vence algo.

**Por qué esta prioridad** : La planificación consciente de fechas mejora el valor central cuando el conjunto de datos crece, pero no es necesario para la gestión básica.

**Prueba Independiente** : Un usuario puede fijar una fecha en una entidad y verla mostrada en la lista.

**Escenarios de Aceptación** :

1- **Dado** que un usuario está creando o editando una entidad, **cuando** introduce una fecha objetivo, **entonces** la fecha se guarda y se muestra en la lista.
2. **Dada** una entidad con fecha fijada, **cuando** el usuario ve la lista, **entonces** las entidades con fechas pueden identificarse de un vistazo.
3. **Dado** que un usuario deja la fecha en blanco, **cuando** guarda la entidad, **entonces** la entidad igualmente se guarda sin fecha (campo opcional).

---

### Historia de Usuario 11 - Registrar los detalles de documentos de una entidad (Prioridad: P2)

Como de negocio, quiero registrar detalles de documentos para una entidad usuario, para mantener la actividad transaccional organizada junto a cada registro de datos maestros.

**Por qué esta prioridad** : Los documentos aportan valor operativo práctico una vez que las entidades están gestionadas, pero no son necesarios para la gestión central.

**Prueba Independiente** : Un usuario puede agregar un documento a una entidad y ver los detalles del documento mostrados junto a esa entidad.

**Escenarios de Aceptación** :

1. **Dada** una entidad en la lista, cuando el usuario agrega un documento con detalles, entonces el documento se guarda y queda asociado a esa entidad.
2. **Dado** un documento existente para una entidad, **cuando** el usuario selecciona esa entidad en la pantalla de gestión, **entonces** los detalles del documento se muestran en la vista de gestión de documentos.
3. **Dada** una entidad eliminada, **cuando** se confirma la eliminación, **entonces** sus documentos asociados también se eliminan.
4. **Dado** que un usuario está creando un documento, **cuando** deja la información obligatoria del documento en blanco, **entonces** el sistema impide guardar y explicar qué se necesita.

---

### Historia de Usuario 12 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

Como usuario de negocio, quiero una pantalla de búsqueda dedicada para encontrar rápidamente entidades sin que los formularios de edición saturen la vista.

**Por qué esta prioridad** : La recuperación rápida es valiosa cuando el conjunto de datos crece, y una pantalla separada mantiene enfocada la experiencia de gestión, pero la búsqueda no es necesaria para la gestión básica.

**Prueba Independiente** : Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un término de búsqueda y ver solo las entidades coincidentes.

**Escenarios de Aceptación** :

1. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** introduce un término coincidente, entonces solo se muestran las entidades coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** se muestra un estado vacío claro y puede volver a intentarlo.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario busca desde la pantalla de búsqueda, **entonces** los resultados aparecen con prontitud sin retraso perceptible.
4. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** activa el botón Panel en la barra lateral, vuelve al panel de inicio.

---

### Historia de Usuario 13 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

Como desarrollador de módulos, quiero definir los estados permitidos de los documentos y las transiciones permitidas, para que los documentos sigan el ciclo de vida del dominio en lugar de aceptar texto de estado arbitrario.

**Por qué esta prioridad** : Los módulos reales necesitan ciclos de vida controlados (p. ej., cotización → pedido → facturado), pero el estado de texto libre sigue siendo aceptable para extensiones simples, así que esto mejora la base sin ser necesario para la adaptación básica. Esta historia depende del perfil de configuración del módulo.

**Prueba Independiente** : Un desarrollador configura un ciclo de vida cotización→pedido→facturado; el siguiente control de estado ofrece solo estados válidos, las transiciones inválidas se rechazan con una explicación, y el estado es visible de un vistazo en las listas.

**Escenarios de Aceptación** :

1. **Dado** un ciclo de vida configurado, **cuando** el usuario edita el estado de un documento, **entonces** solo se ofrecen los estados alcanzables mediante transiciones permitidas.
2. **Dado** que se intenta una transición inválida por cualquier vía, **cuando** se envía, **entonces** el sistema la rechaza con una explicación clara.
3. **Dado** un ciclo de vida configurado, **cuando** el usuario ve listas o detalles de documentos, **entonces** el estado actual es identificable de un vistazo.
4. **Dado** que no hay ciclo de vida configurado, **cuando** se editan documentos, **entonces** el estado permanece como texto libre igual que en el módulo base sin modificar.

---

### Historia de Usuario 14 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

Como usuario de negocio, quiero un espacio de trabajo estilo ERP consistente, con una barra superior con marca y una barra lateral de módulos presentes en cada pantalla, para que la aplicación se sienta como un sistema empresarial coherente en lugar de páginas sueltas.

**Por qué esta prioridad** : El marco aporta la marca y la navegación de todas las demás pantallas; construirlo como envoltorio evita tocar cada historia por separado y da al módulo su identidad ERP. Depende del perfil de configuración del módulo para el nombre del módulo y la terminología, y reestructura la navegación antes proporcionada por los botones de bienvenida y las pestañas de gestión (Historias de Usuario 3 y 4).

**Prueba Independiente** : En cada pantalla, una barra superior muestra un logotipo derivado del nombre del módulo junto al nombre del módulo, una barra lateral ofrece botones de módulo para Panel, Entidades, Documentos y Buscar con el módulo activo resaltado visualmente, y navegar entre módulos nunca pierde datos.

**Escenarios de Aceptación** :

1. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la página, **entonces** es visible una barra superior que contiene un logotipo SVG en línea derivado del nombre del módulo y el nombre del módulo configurado.
2. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la barra lateral, **entonces** se muestran botones de módulo para Panel, Entidades, Documentos y Buscar usando la terminología configurada.
3. **Dado** que el usuario está en cualquier pantalla, **cuando** mira la barra lateral, **entonces** el botón del módulo activo está resaltado visualmente.
4. **Dado** que la ventana gráfica es estrecha, **cuando** se usa la aplicación en una pantalla pequeña, **entonces** la barra lateral se contrae a una columna de iconos manteniéndose utilizable y etiquetada de forma accesible.
5. **Dada** una configuración que define un color de acento, **cuando** cualquier pantalla carga, **entonces** el marco lo usa consistentemente para resaltados y controles principales; sin valor configurado o con un valor inválido, se utilizan los valores predeterminados integrados sin errores.
6. **Dado** que el usuario navega entre módulos mediante la barra lateral, **cuando** inspecciona sus datos después, **entonces** todas las entidades y documentos almacenados permanecen intactos.

---

### Historia de Usuario 15 - Registro y Aprobación de Novedades del Mes (Prioridad: P1)

Como analista de remuneraciones o jefatura, quiero registrar y aprobar las novedades del período (horas extra, licencias médicas y ausencias) para que el motor de cálculo procese únicamente montos validados.

**Por qué esta prioridad**: Las variables mensuales modifican el sueldo proporcional y son críticas para evitar pagos incorrectos.

**Prueba Independiente**: Una jefatura registra novedades para su equipo y el sistema exige su aprobación antes de procesar la planilla.

**Escenarios de Aceptación**:

1. **Dado** el registro de una licencia médica, **cuando** se ingresa, **entonces** el sistema registra el tipo y los días sin permitir almacenar diagnósticos por privacidad (Ley 21.719).
2. **Dado** que existen novedades ingresadas, **cuando** el período está abierto, **entonces** deben ser aprobadas antes de proceder al cálculo masivo.

---

### Casos Límite

- ¿Qué ocurre cuando un usuario intenta guardar una entidad sin nombre o código obligatorio?
- ¿Cómo gestiona el sistema una búsqueda que no devuelve coincidencias?
- ¿Qué ocurre si un usuario intenta editar o eliminar una entidad que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha objetivo que no es una fecha de calendario válida?
- ¿Qué ocurre con los documentos de una entidad cuando esta se elimina?
- ¿Qué ocurre cuando un usuario introduce una fecha final anterior a la fecha inicial en un documento?
- ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base?
- ¿Qué ocurre cuando la configuración referencia un tipo de campo desconocido o una definición de transición de ciclo de vida inválida?
- ¿Qué ocurre cuando los registros almacenados contienen valores de campos personalizados que ya no están declarados en la configuración?
- ¿Qué ocurre cuando un usuario abre la aplicación directamente en la pantalla de gestión o búsqueda (p. ej., vía enlace profundo o recarga del navegador) sin pasar por el panel de inicio?
- ¿Qué ocurre cuando un usuario pulsa el botón atrás del navegador estando en la pantalla de gestión o búsqueda?
- ¿Qué ocurre si un usuario navega fuera de la pantalla de gestión mientras un formulario aún tiene cambios sin guardar?
- ¿Permanecen intactas las entidades y los documentos al navegar entre el panel, la gestión y la búsqueda?
- ¿Qué ocurre cuando el panel se abre con cero entidades o cero documentos (valores estadísticos)?
- ¿Qué ocurre cuando el color de acento configurado no es un valor de color válido?
- ¿Cómo mantiene la barra lateral contraída las etiquetas de módulo accesibles en ventanas gráficas estrechas?
- ¿Qué ocurre cuando el usuario selecciona una línea de liquidación registrada manualmente que no tiene fórmula asociada?
- ¿Qué ocurre cuando la línea seleccionada referencia un parámetro legal que no está vigente para el período liquidado?
- ¿Qué ocurre cuando la liquidación aún está en borrador o no ha sido calculada y el usuario intenta ver el desglose o imprimirla?
- ¿Qué ocurre si faltan datos de identificación del trabajador o de la empresa emisora al generar el comprobante?
- ¿Qué ocurre cuando los valores mostrados en el desglose son redondeados y la suma de las líneas debe seguir cuadrando con el total?
- ¿Qué ocurre cuando la liquidación tiene tantas líneas que el comprobante supera una página?
- ¿Qué ocurre si el usuario cancela el diálogo de impresión o guarda el comprobante como PDF?
- ¿Qué ocurre cuando un usuario no tiene rol asignado o su rol no es reconocido?
- ¿Qué ocurre cuando un usuario intenta acceder directamente a un dato sensible mediante un enlace directo o una petición no autorizada?
- ¿Qué ocurre cuando un usuario cambia de rol mientras mantiene una sesión activa?
- ¿Qué ocurre cuando la bitácora de auditoría no puede escribirse por un fallo del sistema?
- ¿Qué ocurre cuando alguien intenta editar o eliminar un registro de auditoría?
- ¿Qué ocurre cuando un usuario autorizado consulta datos sensibles de un trabajador que no pertenece a su equipo?
- ¿Qué ocurre cuando el rol de jefatura intenta imprimir o exportar una liquidación?
- ¿Se registran en la auditoría también los accesos denegados o fallidos?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de entidad con al menos un nombre y un código.
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un registro de entidad existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un registro de entidad existente.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar registros de entidad por nombre, código, categoría u otras palabras clave descriptivas.
- **FR-005**: El sistema DEBE mostrar una lista clara de entidades e indicar cuándo ningún resultado coincide con una búsqueda.
- **FR-006**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria o no se puede completar una acción.
- **FR-007**: El sistema DEBE mantener los datos de entidad consistentes tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir a los usuarios añadir, editar y eliminar detalles de documentos de una entidad.
- **FR-009**: El sistema DEBE asociar cada documento exactamente a una entidad y eliminar los documentos asociados cuando la entidad se elimina.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial, con botones de acción rápida claramente etiquetados para las tareas ERP clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Entidades, Documentos y Buscar, etiquetados desde la configuración del módulo.
- **FR-013**: El botón de módulo Entidades DEBE mostrar el contenido de gestión de entidades.
- **FR-014**: El botón de módulo Documentos DEBE mostrar el contenido de gestión de documentos en la pantalla de gestión.
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión NO DEBE mostrar la lista de entidades.
- **FR-017**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar entidades.
- **FR-018**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar documentos.
- **FR-019**: El sistema DEBE navegar a una pantalla de búsqueda dedicada cuando se selecciona el botón Buscar en la barra lateral.
- **FR-020**: La pantalla de búsqueda DEBE permitir buscar entidades por nombre, código, categoría, descripción o fecha objetivo.
- **FR-021**: La pantalla de búsqueda DEBE ser accesible tanto desde la barra lateral como desde la acción rápida de buscar registros del panel.
- **FR-022**: El sistema DEBE mantener los datos de entidades y documentos intactos y consistentes durante la navegación entre pantallas.
- **FR-023**: El sistema DEBE cargar la configuración del módulo al arrancar y aplicarla en todas las pantallas.
- **FR-024**: El sistema DEBE retroceder a los valores predeterminados integrados (terminología Entidad/Documento, sin campos personalizados, sin ciclo de vida) cuando no se proporciona configuración.
- **FR-025**: El sistema DEBE informar claramente de una configuración inválida o conflictiva en lugar de fallar silenciosamente.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada que coincidan con sus tipos declarados.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar, usando la misma experiencia de retroalimentación que la validación base.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en los resultados de búsqueda y mostrarlos en listas y vistas de detalle.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario de la configuración del módulo en lugar de texto fijo en el código.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas en los documentos independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener el estado del documento como texto libre cuando no hay ciclo de vida configurado.
- **FR-032**: El sistema DEBE mantener el renderizado de listas y la búsqueda ágiles y correctos para conjuntos de datos de al menos 500 registros de entidad.
- **FR-033**: El panel DEBE ofrecer al menos cuatro botones de acción rápida: nueva entidad, nuevo documento, abrir gestión de entidades y buscar registros.
- **FR-034**: Activar la acción rápida de nueva entidad o nuevo documento DEBE abrir el área de gestión correspondiente con un formulario vacío listo para introducir datos.
- **FR-035**: El panel DEBE mostrar tarjetas de estadísticas con el número de entidades y documentos almacenados, actualizadas cada vez que se muestra el panel.
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral DEBE resaltar visualmente el módulo activo en cada pantalla.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente en todo el marco y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas gráficas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable.
- **FR-040**: El sistema DEBE presentar cada liquidación como una lista de líneas con su concepto y monto, indicando que cada línea puede expandirse para ver su explicación.
- **FR-041**: Al seleccionar una línea, el sistema DEBE mostrar la base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el monto resultante.
- **FR-042**: La explicación DEBE identificar el parámetro legal aplicado y su fecha de vigencia.
- **FR-043**: Las líneas registradas manualmente DEBEN mostrar el motivo ingresado por el usuario en lugar de una fórmula.
- **FR-044**: La explicación DEBE conservar los valores del período calculado aunque los parámetros legales cambien con posterioridad.
- **FR-045**: El sistema DEBE ofrecer una acción de imprimir que genere una vista limpia del comprobante, sin menús, botones de edición ni controles de navegación.
- **FR-046**: La vista imprimible DEBE incluir la identificación del trabajador y del período, el detalle de haberes, descuentos e impuestos, el líquido a pagar, los totales y la fecha de emisión.
- **FR-047**: Los montos de la vista imprimible DEBEN coincidir exactamente con los montos mostrados en la liquidación.
- **FR-048**: La vista imprimible DEBE adaptarse a una hoja tamaño carta o A4 en orientación vertical y DEBE poder guardarse como PDF.
- **FR-049**: La explicación y el comprobante DEBEN respetar los permisos de acceso vigentes del usuario.
- **FR-050**: El sistema DEBE indicar claramente cuándo una línea no dispone de fórmula o parámetro legal asociado, sin omitir la línea del comprobante.
- **FR-051**: El sistema DEBE basar el acceso a la información sensible en el rol del usuario autenticado.
- **FR-052**: El sistema DEBE restringir la visualización y consulta de sueldos, liquidaciones, cuentas bancarias y cuotas sindicales a los roles expresamente autorizados.
- **FR-053**: El rol Jefatura DEBE poder ver únicamente las novedades de su equipo y NO DEBE acceder a liquidaciones ni a sueldos base.
- **FR-054**: El sistema DEBE ocultar o enmascarar los datos sensibles no autorizados en listados, detalles, búsquedas y vistas imprimibles.
- **FR-055**: El sistema DEBE registrar automáticamente en la bitácora de auditoría toda consulta, creación, modificación o eliminación de información sensible, indicando al menos usuario, rol, fecha y hora, acción y registro afectado.
- **FR-056**: La bitácora de auditoría DEBE ser de solo inserción y NO DEBE permitir la edición ni la eliminación de sus registros por ningún rol.
- **FR-057**: Las restricciones de acceso DEBEN aplicarse tanto en la interfaz como en la capa de acceso a los datos, impidiendo la consulta no autorizada por enlaces directos u otras vías.
- **FR-058**: El sistema DEBE conservar la bitácora de auditoría durante el período exigido por la normativa de protección de datos aplicable (Ley 21.719).
- **FR-059**: El sistema DEBE informar de forma clara al usuario cuando una acción o consulta es denegada por falta de permisos, sin revelar el contenido protegido.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Entidad**: Un registro de datos maestros gestionado por el módulo, que incluye su nombre, código de negocio, detalles descriptivos, categoría de clasificación, una fecha objetivo opcional y un entity_id autogenerado. Los módulos personalizados definen qué representa una Entidad en el mundo real (p. ej., cliente, producto, activo).
- **Documento**: Detalles transaccionales adjuntos a una entidad, vinculados a ella por el entity_id de la entidad. Los módulos personalizados definen qué representa un Documento (p. ej., pedido, factura, contrato).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados y el ciclo de vida de estados de documentos. Consulte data-model.md para su forma completa.
- **Liquidación**: Documento que resume la remuneración de un trabajador en un período, con el detalle de haberes, descuentos, impuestos, totales y líquido a pagar, junto con el estado del cálculo y la fecha de emisión del comprobante.
- **Línea de Liquidación**: Cada concepto que compone una liquidación (haber, descuento o impuesto), con su monto, la base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal que la respalda; las líneas manuales registran un motivo en lugar de una fórmula.
- **Parámetro Legal**: Valor normativo vigente en una fecha determinada (tasa, tope, tramo o monto fijo) que sustenta el cálculo de una línea y que se conserva congelado para los períodos ya calculados.
- **Rol**: Perfil asignado a un usuario que determina las funciones y los datos a los que puede acceder (p. ej., Administrador, Jefatura, Analista).
- **Permiso de Acceso**: Regla que asocia un rol con la capacidad de consultar o modificar un tipo de información sensible.
- **Dato Sensible**: Información personal o financiera protegida (sueldos, cuentas bancarias, cuotas sindicales) cuyo acceso está restringido según el rol.
- **Registro de Auditoría**: Entrada inmutable que documenta quién consultó o modificó información sensible, cuándo, con qué rol y sobre qué registro.
- **Bitácora de Auditoría**: Colección de solo inserción de registros de auditoría, conservada para efectos de trazabilidad y cumplimiento normativo.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear una nueva entidad y verla en la lista en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar una entidad existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de crear, editar, eliminar y buscar sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 registros de entidad sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar las pantallas de gestión y búsqueda desde el panel o la barra lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad existente de gestión de entidades y documentos sigue operativa tras el rediseño del marco ERP y el panel (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión y búsqueda sin perder ninguna entidad ni documento almacenado.
- **SC-008**: Un desarrollador puede producir un módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas de registros mostradas en el panel siempre coinciden con el número de entidades y documentos almacenados.
- **SC-011**: El 100% de las líneas de una liquidación calculada muestra base, tasa o factor y fórmula al seleccionarlas, en menos de 1 segundo.
- **SC-012**: Un usuario puede abrir una liquidación y obtener su comprobante impreso o en PDF en menos de 30 segundos.
- **SC-013**: Al menos el 90% de los usuarios de prueba comprende de dónde proviene cada monto sin ayuda adicional.
- **SC-014**: Las consultas internas sobre montos pagados se reducen al menos un 40% tras la adopción de la vista explicativa.
- **SC-015**: El 100% de los comprobantes impresos coincide con los totales de la liquidación y se ajusta a un máximo de dos páginas.
- **SC-016**: La vista imprimible no muestra controles de edición ni de navegación en ningún caso.
- **SC-017**: El 100% de las pantallas, listados e impresiones muestra los datos sensibles solo a los roles autorizados; el rol Jefatura nunca ve sueldos base ni liquidaciones.
- **SC-018**: El 100% de las consultas y cambios sobre información sensible queda registrado en la bitácora de auditoría.
- **SC-019**: Un intento de editar o eliminar un registro de auditoría es rechazado en el 100% de los casos.
- **SC-020**: La bitácora permite reconstruir la trazabilidad completa de accesos y modificaciones a datos sensibles de un usuario o período en menos de 5 minutos.
- **SC-021**: Al menos el 95% de las pruebas de acceso con distintos roles confirma que los datos ocultos no pueden recuperarse desde la interfaz ni mediante enlaces directos.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos, además de la vista explicativa e impresión de liquidaciones de la Historia de Usuario 5, en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre áreas ocurre mediante una barra lateral persistente; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.
- Las liquidaciones y sus líneas existen como resultado de un cálculo previo; esta historia no cubre las reglas de cálculo ni la generación de la planilla.
- Cada línea conserva, desde el momento del cálculo, la base, la tasa o fórmula y el parámetro legal aplicado, de modo que la explicación no depende de parámetros posteriores.
- La impresión se realiza mediante la función de impresión del navegador, que incluye la opción de guardar como PDF; no se requiere un generador de PDF dedicado.
- Los datos de identificación de la empresa emisora están disponibles en la configuración del módulo.
- Los montos se presentan en pesos chilenos con separador de miles.
- El acceso a la explicación y al comprobante respeta los permisos vigentes del usuario.
- Existen roles predefinidos (al menos Administrador, Jefatura y Analista/Trabajador), y el administrador gestiona su asignación.
- La identidad y el rol del usuario se determinan al iniciar sesión.
- Los datos sensibles (sueldos, cuentas bancarias, cuotas sindicales) están clasificados explícitamente en el modelo de datos.
- Las restricciones de acceso se aplican tanto en la interfaz como en la capa de datos, por lo que no pueden eludirse mediante enlaces directos.
- La bitácora de auditoría se conserva durante el período exigido por la Ley 21.719.
- La auditoría registra tanto los accesos autorizados como los denegados.


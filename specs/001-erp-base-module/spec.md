# Especificación de la Funcionalidad: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama de la funcionalidad**: 001-erp-base-module  
**Creada**: 2026-07-08  
**Actualizada**: 2026-11-16  
**Estado**: Borrador   
**Entrada**: Descripción del usuario: "Construir un módulo base de software de planificación de recursos empresariales (ERP) que pueda extenderse en módulos ERP personalizados. Debe proporcionar gestión de datos maestros (entidades) y documentos transaccionales vinculados con capacidades de crear/editar/eliminar/buscar."  
**Última incorporación**: Historias de Usuario 1 a 6 (US1–US4 y US6 con prioridad P1; US5 con prioridad P2), con FR-001–FR-087 y las reglas transversales de seguridad, auditoría y respaldo.

## Propósito

Este proyecto sirve como módulo base reutilizable para construir módulos ERP personalizados. Establece los patrones comunes que todo módulo ERP necesita: gestionar registros de datos maestros (**Entidades**) y sus **Documentos** transaccionales asociados, con navegación, validación, persistencia y búsqueda ya implementadas, de modo que los módulos personalizados solo necesiten definir sus campos y reglas específicos del dominio. Sobre esta base se construye el módulo de **Recursos Humanos y Planilla** (Historias de Usuario 1 a 6), que reutiliza la Entidad como **Trabajador** y el Documento como **Liquidación**, y añade contratos, novedades, períodos, cálculo legal, explicación e impresión de liquidaciones y gobierno de datos.

## Clarifications

### Session 2026-11-08

- Q: ¿Dónde deben definirse las entidades de Recursos Humanos que usan las Historias de Usuario 1–4 (Trabajador, Contrato, Novedad y Período de remuneración)? → A: Opción A — definir Trabajador, Contrato, Novedad y Período en las Entidades Clave de 001, remitiendo el detalle al data-model de 002.
- Q: ¿La identidad y el rol del usuario deben provenir de una autenticación real o de una sesión simulada con selector de rol? → A: Opción A — sesión simulada con selector de rol, sin credenciales ni backend.
- Q: ¿Cómo se cargan y actualizan los parámetros legales (UF, UTM, tasas y tramos) para cada período? → A: Opción A — carga manual versionada por un administrador mediante formulario o archivo de configuración, sin integración con servicios externos.
- Q: ¿Durante cuánto tiempo debe conservarse la bitácora de auditoría exigida por la Ley 21.719? → A: Opción A — mientras dure la relación laboral y 6 años después del término (validar con asesoría legal).
- Q: ¿La versión inicial debe incluir exportación e importación de datos para respaldo y restauración? → A: Opción A — exportación e importación completa en JSON para respaldo y restauración.

### Session 2026-11-16

- Q: ¿La pantalla de Entidades genéricas debe excluir a los Trabajadores (y la de Documentos a las Liquidaciones), o debe mostrar todos los registros y solo bloquear su eliminación? → A: Opción A — excluir a Trabajadores y Liquidaciones de las pantallas genéricas y gestionarlos solo en las vistas de RR.HH.

### Session 2026-11-17

- Q: ¿Sobre qué base de días se calcula proporcionalmente el sueldo de un Trabajador cuyo contrato no cubre todo el período? → A: Opción A — días naturales del mes: se prorratea por los días de vigencia sobre los días reales del mes (p. ej., 17/31).
- Q: ¿Qué nivel de accesibilidad debe cumplir la interfaz para que una pantalla se considere terminada? → A: Opción A — WCAG 2.2 nivel AA, verificado con pruebas automatizadas y manuales de navegación por teclado, contraste y lectores de pantalla.
- Q: ¿Debe el respaldo JSON incluir los registros de la bitácora de auditoría junto con los datos de negocio? → A: Opción A — sí, incluir la bitácora y fusionarla al importar sin borrar ni duplicar registros, usando su identificador.
- Q: ¿Cómo se divide la cantidad de una novedad cuyo rango de fechas cruza meses entre los períodos resultantes? → A: Opción A — prorratear según los días del rango que caen en cada mes (p. ej., 10 días: 6 en enero y 4 en febrero).
- Q: ¿Qué feedback visual debe mostrar la interfaz mientras se ejecuta el cálculo masivo de un período? → A: Opción A — indicador de progreso con porcentaje o número de Trabajadores procesados.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Gestión de Fichas de Trabajadores y Catálogos Base (Prioridad: P1)

**Como** administrador/a de RR.HH. o analista de remuneraciones,  
**quiero** registrar, buscar, actualizar y desactivar la ficha de cada trabajador (nombre, código, RUT, datos de contacto, fecha de ingreso, cargo, departamento, centro de costo y jefatura directa opcional) y mantener los catálogos base,  
**para** que las contrataciones y liquidaciones posteriores se calculen sobre datos completos, válidos y sin duplicados.

**Por qué esta prioridad**: Es el valor central del producto y el prerrequisito de datos de las Historias de Usuario 2 a 4: sin fichas válidas no hay a quién asignar un contrato, una novedad o una liquidación.

**Alcance**: incluye la ficha del trabajador y los catálogos de cargos, departamentos y centros de costo. No incluye contratos (US2), novedades (US3) ni liquidaciones (US4).

**Reglas de negocio**:

- El administrador/a de RR.HH. y el analista de remuneraciones pueden crear, editar y desactivar fichas de trabajadores y catálogos base.
- El nombre y el código son obligatorios; el RUT es obligatorio y se valida con módulo 11.
- La fecha de ingreso, si se informa, debe ser una fecha de calendario válida.
- La jefatura directa, si se informa, debe corresponder a un Trabajador existente y activo; el equipo de una jefatura son los Trabajadores que la tienen como jefatura directa.
- Si la jefatura directa de un equipo es desvinculada, ese equipo pasa a tratarse como "sin jefatura directa" hasta que se asigne otra.
- El RUT identifica a una persona: dos fichas no pueden compartir el mismo RUT, comparado sin puntos, guiones ni espacios y sin distinguir mayúsculas.
- El código del trabajador es único: no pueden existir dos fichas con el mismo código, comparado sin distinguir mayúsculas ni acentos e ignorando espacios al inicio y al final.
- Cada ficha conserva un identificador interno que no cambia al actualizarla, de modo que contratos, novedades y liquidaciones sigan apuntando a la misma persona.
- Desactivar una ficha no la elimina ni borra su historia: se pide la fecha de desvinculación, la ficha pasa a estado laboral "Desvinculado" y conserva sus datos y sus referencias para liquidaciones anteriores.
- La desactivación se bloquea si el Trabajador tiene novedades en estado "Pendiente"; esas novedades deben aprobarse, rechazarse o anularse antes de desvincularlo. Si el Trabajador es jefatura directa, su equipo pasa a tratarse como "sin jefatura directa" y las novedades pendientes de ese equipo quedan a cargo del administrador/a de RR.HH. Al desvincular, el contrato vigente o vencido del Trabajador se termina automáticamente con la fecha de desvinculación (regla de la US2).
- Un Trabajador desactivado no se reactiva en esta versión; su ficha permanece disponible para consulta histórica.
- Un catálogo tiene tipo (cargo, departamento o centro de costo), código y nombre; el código es único dentro de su tipo.
- Desactivar un catálogo no borra historia: deja de ofrecerse en fichas nuevas pero se sigue mostrando en las fichas que ya lo usaban.

**Prueba Independiente**: Con catálogos precargados como datos semilla, un usuario crea un trabajador, lo encuentra buscando por nombre, código y RUT, lo actualiza, lo desactiva y comprueba que conserva su historia; además crea, edita y desactiva un catálogo. No requiere recorrer las pantallas de contratos, novedades ni liquidaciones.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está creando una ficha de trabajador, **cuando** ingresa nombre, código y un RUT con dígito verificador válido, y opcionalmente selecciona cargo, departamento y centro de costo, **entonces** la ficha se guarda y aparece en el listado con las etiquetas de los catálogos seleccionados.
2. **Dado** que un usuario está creando o editando una ficha, **cuando** deja el nombre, el código o el RUT en blanco, o ingresa un RUT con dígito verificador inválido, un correo mal formado o una fecha de ingreso que no es una fecha de calendario, **entonces** el sistema impide guardar y señala el campo específico que debe corregirse.
3. **Dado** que ya existe una ficha con un RUT registrado, **cuando** un usuario intenta crear u actualizar otra ficha con ese mismo RUT, **entonces** el sistema rechaza la operación e indica que el RUT ya está asociado a otro trabajador.
4. **Dado** que ya existe una ficha con un código registrado, **cuando** un usuario intenta crear u actualizar otra ficha con ese mismo código, **entonces** el sistema rechaza la operación e indica que el código ya está asociado a otro trabajador.
5. **Dado** que existen fichas registradas, **cuando** el usuario busca por nombre, código o RUT (con o sin puntos y guion), **entonces** obtiene las fichas que coinciden; **y cuando** la búsqueda no arroja coincidencias, **entonces** el listado muestra un estado vacío explicativo en lugar de una tabla en blanco.
6. **Dado** un trabajador existente, **cuando** el usuario actualiza sus datos o su cargo, departamento o centro de costo, **entonces** los cambios se guardan sobre la misma ficha y se reflejan de inmediato en el listado y en la búsqueda.
7. **Dado** un trabajador activo, **cuando** el usuario desactiva su ficha indicando la fecha de desvinculación, **entonces** la ficha queda con estado laboral "Desvinculado" con esa fecha y conserva sus datos e historia, sin eliminarse del sistema.
8. **Dado** que un usuario gestiona catálogos base, **cuando** crea un cargo, departamento o centro de costo con código y nombre, **entonces** queda disponible para asignarlo a fichas.
9. **Dado** que ya existe un catálogo activo con un código, **cuando** el usuario intenta crear o editar otro catálogo del mismo tipo con ese código, **entonces** el sistema lo rechaza e indica que el código ya está en uso.
10. **Dado** un catálogo en uso por fichas existentes, **cuando** el usuario lo desactiva, **entonces** deja de ofrecerse para fichas nuevas pero se sigue mostrando en las fichas que ya lo usaban.
11. **Dado** un trabajador activo, **cuando** el usuario intenta desactivar su ficha sin indicar la fecha de desvinculación o con una fecha anterior a la fecha de ingreso, **entonces** el sistema rechaza la operación y señala el campo que debe corregirse.
12. **Dado** una ficha de trabajador, **cuando** el usuario indica como jefatura directa a un Trabajador que no existe, que no está activo o al mismo Trabajador de la ficha, **entonces** el sistema rechaza la operación y señala el campo que debe corregirse.
13. **Dado** un Trabajador que es jefatura directa de otros Trabajadores, **cuando** el usuario lo desvincula, **entonces** su equipo (los Trabajadores que la tenían como jefatura directa) pasa a tratarse como "sin jefatura directa", y las novedades pendientes de ese equipo pasan a ser aprobadas o rechazadas por el administrador/a de RR.HH.
14. **Dado** que un usuario con sesión identificada crea, actualiza o desactiva una ficha de trabajador o un catálogo, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada, el registro afectado y los campos modificados, en una entrada de solo inserción (regla transversal provista por la US6).

---

### Historia de Usuario 2 - Gestión de Contratos y Alertas de Plazo (Prioridad: P1)

**Como** analista de remuneraciones o administrador/a de RR.HH.,
**quiero** registrar los contratos de trabajo de cada trabajador (tipo de contrato, fecha de inicio, fecha de término si es a plazo fijo, sueldo base y jornada), registrar cambios de condiciones y renovaciones sobre ese contrato, y ver alertas de vencimiento,
**para** controlar las condiciones vigentes del personal y evitar contratos vencidos sin regularizar.

**Por qué esta prioridad**: El contrato define los parámetros fundamentales del cálculo de sueldos y previene riesgos laborales por contratos vencidos.

**Alcance**: incluye contratos, cambios de condiciones y renovaciones, expresados como contratos con su propia vigencia que conservan el historial del Trabajador, además de alertas de vencimiento. No incluye fichas de trabajadores (US1), novedades (US3) ni liquidaciones (US4).

**Reglas de negocio**:

- El administrador/a de RR.HH. y el analista de remuneraciones pueden registrar contratos, registrar cambios de condiciones y terminar contratos (fin anticipado).
- Un contrato está vigente desde su fecha de inicio hasta su fecha de término (o sin fecha de término si es indefinido), mientras no haya sido terminado; un contrato a plazo fijo con fecha de término pasada ya no está vigente y se muestra como "vencido" hasta que se renueve o se termine.
- Terminar un contrato registra su fecha de término efectiva, que no puede ser anterior a la fecha de inicio, lo deja en estado "terminado", deja de generar alertas y se conserva en el historial. Puede terminarse un contrato vigente o vencido, incluido uno indefinido. Un cambio de condiciones deja el contrato anterior en estado "terminado" el día previo a la nueva vigencia.
- En esta versión no existe la cancelación de contratos: los únicos estados son "vigente", "vencido" y "terminado". El estado "cancelado" no se admite; la terminación anticipada se registra como "terminado".
- Al desvincular a un Trabajador, el sistema termina automáticamente el contrato vigente o vencido con esa fecha de desvinculación.
- Solo se puede registrar un contrato para un Trabajador existente y no desvinculado.
- El tipo de contrato, la fecha de inicio, el sueldo base y la jornada son obligatorios; la fecha de término es obligatoria en contratos a plazo fijo y no aplica a los indefinidos.
- Un contrato indefinido no lleva fecha de término y el sistema no la admite.
- La fecha de término no puede ser anterior a la de inicio.
- El sueldo base debe ser mayor que cero y no inferior al mínimo legal vigente del período, tomado de los parámetros legales versionados.
- La jornada semanal no puede superar el máximo legal vigente del período, tomado de los parámetros legales versionados.
- Un Trabajador tiene como máximo un contrato vigente a la vez y las vigencias de todos sus contratos no pueden superponerse, incluidos los vencidos o terminados: el sistema rechaza un contrato nuevo cuyas fechas se superpongan con cualquier otro contrato del mismo Trabajador.
- Un cambio de condiciones se registra como un contrato nuevo: el sistema deja el contrato anterior en estado "terminado" el día previo a la fecha de vigencia y conserva ambos en el historial. No existe una entidad separada de anexo.
- Una renovación se registra como un contrato nuevo que continúa desde el día siguiente al término del contrato anterior; el sistema deja el contrato anterior en estado "terminado", lo conserva en el historial y su alerta deja de mostrarse. No existe una entidad separada de renovación.
- Un cambio de condiciones con nuevo sueldo base tiene fecha de vigencia: los Períodos anteriores conservan el sueldo anterior y los posteriores usan el nuevo.
- Un contrato a plazo fijo se considera "por vencer" cuando faltan 30 días o menos para su fecha de término, y "vencido" cuando esa fecha ya pasó.
- La alerta de un contrato a plazo fijo aparece desde 30 días antes de su fecha de término y se mantiene mientras el contrato no sea renovado ni terminado.
- Los contratos reemplazados o terminados no se borran: quedan en el historial del Trabajador.

**Prueba Independiente**: Con fichas de trabajadores precargadas como datos semilla, el usuario registra un contrato a plazo fijo para un Trabajador y comprueba que aparece en su historial y que el panel principal lo muestra como "por vencer" cuando faltan 30 días o menos para su término. No requiere recorrer novedades ni liquidaciones.

**Escenarios de Aceptación**:

1. **Dado** un Trabajador activo sin contrato vigente, **cuando** el usuario registra un contrato con todos los campos obligatorios, **entonces** el contrato queda asociado al Trabajador con estado "vigente" y aparece en su historial.
2. **Dado** un formulario de contrato, **cuando** falta un campo obligatorio, la fecha de término es anterior a la de inicio, el sueldo base es cero o menor al mínimo legal vigente, o la jornada semanal supera el máximo legal vigente, **entonces** el sistema rechaza el registro y señala el campo que debe corregirse.
3. **Dado** un contrato a plazo fijo sin fecha de término, **cuando** el usuario intenta guardarlo, **entonces** el sistema lo rechaza e indica que la fecha de término es obligatoria.
4. **Dado** un contrato indefinido con fecha de término, **cuando** el usuario intenta guardarlo, **entonces** el sistema lo rechaza e indica que un contrato indefinido no lleva fecha de término.
5. **Dado** un Trabajador que ya tiene un contrato cuya vigencia se superpone, **cuando** el usuario intenta registrar otro contrato con fechas superpuestas, **entonces** el sistema lo rechaza e indica que debe registrar un cambio de condiciones o una renovación.
6. **Dado** un contrato a plazo fijo, **cuando** faltan 30 días o menos para su fecha de término, **entonces** el panel principal muestra una alerta con el nombre del Trabajador, la fecha de término y los días restantes.
7. **Dado** un contrato a plazo fijo cuya fecha de término ya pasó, **cuando** el usuario abre el panel principal, **entonces** el contrato se muestra con una etiqueta visible "vencido", diferenciado de los "por vencer".
8. **Dado** un contrato indefinido, **cuando** el usuario abre el panel principal, **entonces** no se genera ninguna alerta de vencimiento.
9. **Dado** un contrato con alerta activa, **cuando** el usuario registra una renovación como un contrato nuevo que continúa desde el día siguiente al término del contrato anterior, **entonces** la alerta desaparece y el contrato anterior queda en el historial en estado "terminado".
10. **Dado** un contrato vigente, **cuando** se registra un cambio de condiciones con nuevo sueldo base y fecha de vigencia, **entonces** el sistema deja el contrato anterior en estado "terminado" el día previo a la nueva vigencia y crea un contrato nuevo; los Períodos anteriores a esa fecha conservan el sueldo anterior y los posteriores usan el nuevo.
11. **Dado** un contrato vigente o vencido, **cuando** el usuario lo termina con una fecha de término efectiva no anterior a la fecha de inicio, **entonces** el contrato queda en estado "terminado", su alerta desaparece y se conserva en el historial.
12. **Dado** un contrato vigente o vencido, **cuando** el usuario intenta terminarlo con una fecha de término efectiva anterior a la fecha de inicio, **entonces** el sistema rechaza la operación y señala el campo que debe corregirse.
13. **Dado** un Trabajador con un contrato vigente o vencido, **cuando** el usuario lo desvincula, **entonces** el sistema termina automáticamente el contrato vigente o vencido con esa fecha de desvinculación y lo conserva en el historial.
14. **Dado** un Trabajador desvinculado, **cuando** el usuario intenta registrarle un contrato nuevo, **entonces** el sistema lo rechaza; y sus contratos anteriores siguen visibles en su historial.
15. **Dado** que un usuario con sesión identificada registra o termina un contrato, registra un cambio de condiciones, o el sistema termina un contrato por una desvinculación, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada, el registro afectado y los campos modificados (regla transversal provista por la US6).

---

### Historia de Usuario 3 - Registro y Aprobación de Novedades del Mes (Prioridad: P1)

**Como** analista de remuneraciones o jefatura,
**quiero** registrar y aprobar las novedades del período (horas extra, licencias médicas y ausencias) de cada Trabajador,
**para que** el motor de cálculo procese únicamente novedades validadas.

**Por qué esta prioridad**: Las variables mensuales modifican el sueldo proporcional y son críticas para evitar pagos incorrectos o reprocesos en las liquidaciones finales.

**Alcance**: incluye el registro, la aprobación o rechazo y la consulta de novedades por período. No incluye fichas de trabajadores (US1), contratos (US2) ni el cálculo y cierre del período (US4); esta historia solo determina qué novedades están en condiciones de ser calculadas.

**Reglas de negocio**:

- Las novedades son de tres tipos: horas extra, licencias médicas y ausencias.
- El analista de remuneraciones puede registrar novedades de cualquier Trabajador y verlas, pero no puede aprobarlas ni rechazarlas. La jefatura puede registrar novedades de Trabajadores de su equipo, y aprobar o rechazar las novedades de su equipo que no haya registrado ella misma. El administrador/a de RR.HH. aprueba o rechaza las novedades de Trabajadores sin jefatura directa y las registradas por la jefatura de ese equipo. Ningún rol puede aprobar ni rechazar una novedad que haya registrado.
- Solo se puede registrar una novedad para un Trabajador existente, no desvinculado y con un contrato cuya vigencia incluya la fecha de la novedad, aunque el contrato haya sido terminado después.
- La novedad se asocia al período de su fecha; si no existe un período activo para esa fecha, el sistema la rechaza e indica que primero debe crearse el período.
- Toda novedad tiene Trabajador, tipo, fecha o rango de fechas dentro de un período y una cantidad (horas o días) mayor que cero.
- Una novedad debe quedar dentro de un solo período; un rango de fechas que cruza meses se registra como una novedad por cada mes, prorrateando la cantidad según los días del rango que caen en cada mes (p. ej., 10 días: 6 en enero y 4 en febrero). Si alguno de los meses no tiene un período activo, no se registra ninguna de las partes y el sistema indica qué período falta.
- Toda novedad nueva queda en estado "Pendiente" y pasa a "Aprobada" o "Rechazada"; un rechazo requiere un motivo.
- Solo una novedad "Pendiente" puede editarse o anularse; las "Aprobadas" y "Rechazadas" no se modifican, y una corrección se registra como una novedad nueva. Las novedades anuladas no se borran.
- Una licencia médica registra únicamente el tipo de licencia y los días de reposo con sus fechas; el sistema no captura ni almacena diagnóstico ni ningún otro dato clínico, tampoco al importar un respaldo (Ley 21.719).
- Las licencias y ausencias de un mismo Trabajador no pueden superponerse en fechas.
- El máximo de horas extra por día se toma de los parámetros legales versionados; superarlo exige una justificación escrita para guardar la novedad como "Pendiente".
- Solo las novedades "Aprobadas" las considera el cálculo; las "Rechazadas" y las anuladas no. El cálculo del período no puede iniciarse mientras existan novedades "Pendientes" en ese período.
- En un período cerrado no se puede crear, editar, anular ni cambiar de estado ninguna novedad; el sistema rechaza el cambio y muestra las novedades en solo lectura.

**Prueba Independiente**: Con Trabajadores y contratos precargados como datos semilla, un analista registra novedades, una jefatura las aprueba o rechaza, y el sistema bloquea o permite iniciar el cálculo según existan o no novedades pendientes; el cálculo en sí corresponde a la US4. Un período marcado como cerrado en los datos semilla impide cualquier cambio. No requiere ejecutar el cálculo.

**Escenarios de Aceptación**:

1. **Dado** un Trabajador activo con un contrato cuya vigencia incluye la fecha de la novedad, **cuando** el usuario registra una novedad con todos los campos obligatorios, **entonces** queda en estado "Pendiente" y aparece en el listado del período.
2. **Dado** un formulario de novedad, **cuando** falta un campo obligatorio, la cantidad es cero o menor, o la fecha queda fuera del período, **entonces** el sistema rechaza el registro y señala el campo que debe corregirse.
3. **Dado** un Trabajador desvinculado o sin un contrato cuya vigencia incluya la fecha de la novedad, **cuando** el usuario intenta registrarle una novedad, **entonces** el sistema la rechaza e indica el motivo.
4. **Dado** el formulario de licencias médicas, **cuando** el usuario ingresa un registro, **entonces** el sistema solo captura tipo de licencia, días de reposo y fechas, y no admite ningún campo de diagnóstico clínico.
5. **Dado** un Trabajador con una licencia o ausencia registrada, **cuando** el usuario registra otra que se superpone en fechas, **entonces** el sistema la rechaza e indica la novedad con la que se superpone.
6. **Dado** el registro de horas extra, **cuando** la cantidad diaria supera el máximo legal vigente, **entonces** el sistema exige una justificación escrita y no guarda la novedad sin ella.
7. **Dado** una novedad "Pendiente", **cuando** la aprueba o rechaza (con motivo) la jefatura del equipo o, según corresponda, el administrador/a de RR.HH., **entonces** la novedad pasa a "Aprobada" o "Rechazada" y se muestra en el listado con su nuevo estado.
8. **Dado** una novedad "Pendiente", **cuando** intenta aprobarla o rechazarla el mismo usuario que la registró, un analista, o una jefatura de otro equipo, **entonces** el sistema lo impide e indica que no tiene autorización.
9. **Dado** un Trabajador que no pertenece al equipo de una jefatura, **cuando** esa jefatura intenta registrar, aprobar o rechazar una novedad para dicho Trabajador, **entonces** el sistema lo impide e indica que no tiene autorización.
10. **Dado** una novedad "Aprobada" o "Rechazada", **cuando** el usuario intenta editarla o anularla, **entonces** el sistema lo impide e indica que debe registrar una novedad nueva.
11. **Dado** que existen novedades "Pendientes" en un período activo, **cuando** el analista o el administrador/a de RR.HH. intenta iniciar el cálculo del período, **entonces** el sistema lo bloquea y muestra la lista de novedades pendientes.
12. **Dado** un período activo sin novedades "Pendientes", **cuando** el analista o el administrador/a de RR.HH. inicia el cálculo, **entonces** el sistema lo permite y considera solo las novedades "Aprobadas".
13. **Dado** un período cerrado, **cuando** un usuario intenta crear, editar, anular o cambiar el estado de una novedad de ese período, **entonces** el sistema rechaza el cambio y muestra las novedades en solo lectura.
14. **Dado** una novedad "Pendiente", **cuando** quien corresponde intenta rechazarla sin indicar un motivo, **entonces** el sistema impide el rechazo y señala que el motivo es obligatorio.
15. **Dado** que no existe un período activo para la fecha de la novedad, **cuando** el usuario intenta registrarla, **entonces** el sistema la rechaza e indica que primero debe crearse el período.
16. **Dado** un rango de fechas que cruza meses, **cuando** el usuario registra la novedad, **entonces** el sistema la registra como una novedad por cada mes, cada una dentro de su período correspondiente.
17. **Dado** un rango de fechas que cruza meses y alguno de esos meses no tiene un período activo, **cuando** el usuario intenta registrar la novedad, **entonces** el sistema no registra ninguna de las partes e indica qué período falta.
18. **Dado** que un usuario con sesión identificada registra, edita, anula, aprueba o rechaza una novedad, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada, el registro afectado y los campos modificados (regla transversal provista por la US6).

---

### Historia de Usuario 4 - Cálculo de Planilla y Ciclo de Vida de Liquidaciones (Prioridad: P1)

**Como** analista de remuneraciones o administrador/a de RR.HH.,
**quiero** ejecutar el motor de cálculo masivo para generar todas las liquidaciones del mes aplicando la ley chilena (imponibles, AFP, salud, seguro de cesantía e impuesto único) y cerrar el período para congelar los valores,
**para** poder pagar sueldos correctos sin depender de planillas Excel propensas a errores.

**Por qué esta prioridad**: El motor de cálculo es el núcleo del valor del módulo. Automatiza el proceso más complejo y propenso a errores de la gestión de remuneraciones, y sin él las historias de carga de contratos y novedades no generan ningún resultado utilizable.

**Alcance**: incluye la creación del período, el cálculo masivo del período, el ciclo de vida de las liquidaciones y el cierre del período. No incluye fichas (US1), contratos (US2), el registro y aprobación de novedades (US3), el control de acceso a los datos sensibles (US6), que esta historia solo aplica, ni la corrección de un período cerrado, que queda fuera del alcance de esta versión.

**Reglas de negocio**:

- El administrador/a de RR.HH. y el analista de remuneraciones crean un período mensual; solo puede existir un período por mes, se crea en estado "abierto" y requiere que existan los parámetros legales de ese mes.
- El analista de remuneraciones y el administrador/a de RR.HH. pueden ejecutar el cálculo; solo el administrador/a de RR.HH. puede cerrar el período. La jefatura no accede a liquidaciones.
- Un período tiene los estados "abierto", "calculado" y "cerrado"; las liquidaciones de un período abierto o calculado están en estado "borrador" y las de un período cerrado quedan "cerradas". Un período "activo" (término usado en la US3) es un período en estado "abierto" o "calculado".
- El cálculo incluye a los Trabajadores con un contrato cuya vigencia incluya algún día del período, calculado por los días de vigencia dentro del período sobre los días naturales del mes (p. ej., 17/31); un Trabajador sin contrato en el período no genera liquidación y se informa en el resultado del cálculo.
- Al terminar el cálculo, el sistema entrega un resumen con las liquidaciones generadas y los Trabajadores excluidos por no tener contrato en el período, indicando el motivo.
- El cálculo considera únicamente las novedades "Aprobadas" del período (US3): las horas extra se valoran con el recargo legal, y las ausencias y licencias descuentan días, según los parámetros legales versionados.
- El cálculo no puede iniciarse mientras existan novedades "Pendientes" en el período (US3).
- La UF, la UTM, las tasas, los topes imponibles y los tramos del impuesto único se toman de los parámetros legales versionados del período; si falta alguno, el sistema no ejecuta el cálculo e indica cuáles faltan.
- Las cotizaciones de AFP y salud, y el seguro de cesantía, se calculan sobre la remuneración imponible con los topes vigentes del período, expresados en UF; el impuesto único se determina restando las cotizaciones obligatorias de la renta tributable y aplicando la tabla mensual en UTM del período.
- Recalcular un período no cerrado reemplaza las liquidaciones en borrador sin duplicarlas.
- Cada línea de la liquidación se redondea al peso entero y los totales se obtienen sumando las líneas ya redondeadas, de modo que el comprobante cuadre.
- Cerrar un período congela la UF, la UTM y las tasas utilizadas, registra quién y cuándo lo cerró, y cambia el estado a "cerrado"; no se permite cerrar con novedades "Pendientes" ni con Trabajadores sin calcular. Se consideran "Trabajadores sin calcular" los Trabajadores con contrato en el período que no tienen liquidación, o cuya liquidación quedó desactualizada por una novedad aprobada o un cambio de contrato posterior al último cálculo; un Trabajador sin contrato en el período no impide el cierre.
- Un período cerrado no se reabre: sus liquidaciones no pueden modificarse, y la corrección de un período cerrado queda fuera del alcance de esta versión.
- La consulta, la impresión y el guardado en PDF de liquidaciones se limitan a los roles autorizados por la US6.

**Prueba Independiente**: Un analista ejecuta el cálculo sobre un período con datos de prueba, obtiene liquidaciones idénticas al caso de referencia oficial (cuadradas al peso), el administrador/a cierra el período y verifica que la UF y la UTM quedan congeladas y que ninguna liquidación puede modificarse.

**Escenarios de Aceptación**:

1. **Dado** que no existe un período para el mes seleccionado, **cuando** el administrador/a de RR.HH. o el analista de remuneraciones lo crea con los parámetros legales del mes disponibles, **entonces** el período queda en estado "abierto".
2. **Dado** que ya existe un período para el mes seleccionado, **cuando** un usuario intenta crear el período, **entonces** el sistema lo rechaza e indica que el período ya existe.
3. **Dado** que faltan parámetros legales del mes, **cuando** un usuario intenta crear el período, **entonces** el sistema lo rechaza e indica qué parámetros faltan.
4. **Dado** un período abierto con contratos cuya vigencia toca el período y novedades aprobadas, **cuando** el usuario ejecuta el cálculo, **entonces** el sistema genera una liquidación por cada Trabajador con contrato cuya vigencia toque el período detallando haberes imponibles y no imponibles, descuentos legales (AFP, salud, seguro de cesantía), impuesto único, líquido a pagar y aportes del empleador.
5. **Dado** un Trabajador cuya remuneración supera el tope imponible vigente, **cuando** se ejecuta el cálculo, **entonces** las cotizaciones se calculan sobre los topes vigentes del período, usando la UF del período.
6. **Dado** un Trabajador con base tributable dentro de un tramo del impuesto único, **cuando** se ejecuta el cálculo, **entonces** el impuesto se determina restando las cotizaciones obligatorias de la renta tributable y aplicando la tabla mensual en UTM vigente para el período.
7. **Dado** el caso de referencia oficial cargado como datos de prueba, **cuando** se ejecuta el cálculo, **entonces** cada línea de cada liquidación coincide al peso con el valor esperado y los totales cuadran con la suma de las líneas redondeadas al peso.
8. **Dado** un Trabajador con novedades aprobadas de horas extra, ausencias o licencias, **cuando** se ejecuta el cálculo, **entonces** la liquidación refleja el recargo de las horas extra y el descuento proporcional de las ausencias y licencias, y no considera las novedades "Rechazadas" ni anuladas.
9. **Dado** un Trabajador con un contrato que comienza o termina dentro del período, **cuando** se ejecuta el cálculo, **entonces** su liquidación se calcula por los días de vigencia dentro del período.
10. **Dado** un Trabajador sin contrato cuya vigencia toque el período, **cuando** se ejecuta el cálculo, **entonces** no se genera su liquidación y el resumen del cálculo lo incluye entre los Trabajadores excluidos, indicando el motivo.
11. **Dado** un período al que le faltan la UF, la UTM, las tasas o los tramos, **cuando** el usuario ejecuta el cálculo, **entonces** el sistema lo bloquea e indica qué parámetros faltan.
12. **Dado** un período ya calculado, **cuando** se aprueba una novedad nueva o cambia un contrato y el usuario vuelve a ejecutar el cálculo, **entonces** el sistema reemplaza las liquidaciones en borrador sin duplicarlas y refleja el cambio.
13. **Dado** un período calculado sin errores ni novedades pendientes, **cuando** el administrador/a de RR.HH. cierra el período, **entonces** el sistema congela la UF, la UTM y las tasas utilizadas, registra quién y cuándo lo cerró, y cambia el estado del período a "cerrado".
14. **Dado** un período con novedades pendientes de aprobación, **cuando** el usuario intenta cerrarlo, **entonces** el sistema rechaza el cierre e indica qué novedades pendientes lo impiden.
15. **Dado** un período sin novedades pendientes y con Trabajadores sin calcular (con contrato en el período y sin liquidación, o con liquidación desactualizada por una novedad aprobada o un cambio de contrato posterior al último cálculo), **cuando** el usuario intenta cerrarlo, **entonces** el sistema rechaza el cierre e indica qué Trabajadores lo impiden; un Trabajador sin contrato en el período no impide el cierre.
16. **Dado** un período cerrado, **cuando** cualquier usuario o proceso intenta modificar o recalcular una liquidación de ese período, **entonces** el sistema bloquea la operación e indica que el período está cerrado.
17. **Dado** un período cerrado, **cuando** se actualizan los indicadores (UF, UTM o tasas) para un período posterior, **entonces** las liquidaciones del período cerrado conservan exactamente los valores con que fueron calculadas.
18. **Dado** un usuario sin autorización (por ejemplo, un analista que intenta cerrar, o una jefatura que intenta consultar liquidaciones), **cuando** realiza esa operación, **entonces** el sistema la impide e indica que no tiene autorización.
19. **Dado** que un usuario con sesión identificada crea un período, ejecuta el cálculo, cierra un período o consulta una liquidación, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada y el registro afectado (regla transversal provista por la US6).

---

### Historia de Usuario 5 - Vista Explicativa e Impresión de Liquidaciones (Prioridad: P2)

**Como** Trabajador, analista de remuneraciones o administrador/a de RR.HH.,
**quiero** visualizar la liquidación línea por línea con su fórmula explicativa y contar con una vista lista para imprimir o guardar en PDF,
**para** asegurar absoluta transparencia en los montos pagados.

**Por qué esta prioridad**: La explicabilidad de los cálculos genera confianza y reduce drásticamente las consultas y reclamos internos. Aporta valor una vez que las liquidaciones ya se calculan, por lo que mejora la experiencia sin bloquear el flujo principal de gestión.

**Alcance**: incluye la vista explicativa por línea y la vista imprimible o en PDF de una liquidación. No incluye el cálculo ni el cierre del período (US4), y aplica, sin redefinirlo, el control de acceso a datos sensibles de la US6.

**Reglas de negocio**:

- El analista de remuneraciones y el administrador/a de RR.HH. pueden ver las liquidaciones de cualquier Trabajador; el Trabajador solo puede ver las suyas y solo las de períodos cerrados; la jefatura no accede a liquidaciones.
- Cada línea de la liquidación muestra su base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal con su fecha de vigencia; el monto explicado coincide con el de la línea.
- Si una línea no dispone de fórmula o parámetro legal asociado, se muestra igualmente e indica claramente esa carencia.
- La liquidación de un período cerrado se explica con los valores congelados del período; la de un período abierto o calculado se explica con los parámetros del período y se marca visiblemente como "borrador", también en la vista imprimible.
- La vista imprimible no incluye menús, botones de edición ni controles de navegación, y muestra los datos sensibles solo a los roles autorizados. El comprobante imprimible incluye la identificación del Trabajador, el período, las líneas con sus montos, los totales, el líquido a pagar y la marca de "borrador" cuando corresponda.
- Consultar, explicar o imprimir una liquidación no modifica su contenido.

**Prueba Independiente**: Con liquidaciones calculadas como datos semilla, al seleccionar cualquier línea el sistema despliega el desglose y el parámetro legal utilizado; al imprimir se obtiene un comprobante limpio y legible, y un Trabajador solo accede a sus propias liquidaciones de períodos cerrados.

**Escenarios de Aceptación**:

1. **Dado** una liquidación (en borrador o cerrada), **cuando** el usuario selecciona una línea (p. ej., gratificación o impuesto), **entonces** se muestra la base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal con su fecha de vigencia, y el monto explicado coincide con el de la línea.
2. **Dado** una línea sin fórmula o parámetro legal asociado, **cuando** el usuario la consulta, **entonces** la línea se muestra e indica claramente que no dispone de fórmula o parámetro.
3. **Dado** una liquidación de un período cerrado, **cuando** el usuario consulta una línea, **entonces** la explicación muestra los valores congelados del período y no los parámetros vigentes actuales.
4. **Dado** una liquidación en borrador, **cuando** el usuario la consulta o la imprime, **entonces** se marca visiblemente como "borrador".
5. **Dado** que se requiere entregar el comprobante, **cuando** el usuario presiona imprimir, **entonces** se presenta un formato limpio adaptado para papel o PDF, sin menús, botones de edición ni controles de navegación, que incluye la identificación del Trabajador, el período, las líneas con sus montos, los totales, el líquido a pagar y la marca de "borrador" cuando corresponda.
6. **Dado** un Trabajador, **cuando** intenta ver una liquidación que no es suya o la de un período que no está cerrado, **entonces** el sistema lo impide e indica que no tiene autorización.
7. **Dado** una jefatura, **cuando** intenta acceder a una liquidación, **entonces** el sistema lo impide e indica que no tiene autorización.
8. **Dado** que un usuario con sesión identificada consulta, explica o imprime una liquidación, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada y el registro afectado (regla transversal provista por la US6).

---

### Historia de Usuario 6 - Seguridad, Roles y Gobierno de Datos (Prioridad: P1)

**Como** administrador/a de RR.HH.,
**quiero** restringir el acceso a los datos sensibles (sueldos, liquidaciones y licencias médicas) según el rol de la sesión y registrar una bitácora de auditoría,
**para** cumplir estrictamente con la normativa de protección de datos (Ley 21.719).

**Por qué esta prioridad**: Protege la privacidad de la información personal y asegura la trazabilidad de cualquier modificación.

**Alcance**: incluye los roles de la sesión simulada, los permisos por rol, la protección de datos sensibles y la bitácora de auditoría. No incluye autenticación real, credenciales ni gestión de usuarios. Las demás historias aplican estas reglas sin redefinirlas.

**Reglas de negocio**:

- La identidad y el rol se determinan al iniciar una sesión simulada mediante un selector; los roles son administrador/a de RR.HH., analista de remuneraciones, jefatura y Trabajador. Sin rol seleccionado, o con un rol no reconocido, el sistema no muestra ni permite operar ningún dato.
- Al seleccionar el rol Jefatura, el selector pide además el Trabajador activo que representa, y su equipo son los Trabajadores que lo tienen como jefatura directa; si no se selecciona un Trabajador, el sistema no muestra ni permite operar novedades.
- Al seleccionar el rol Trabajador, el selector pide además el Trabajador (activo o desvinculado) que representa; si no selecciona uno, el sistema no muestra liquidaciones. Un Trabajador desvinculado puede consultar sus propias liquidaciones de períodos cerrados, sin operar otras funciones.
- Son datos sensibles en esta versión el sueldo base y las condiciones salariales de los contratos, las liquidaciones y las licencias médicas.
- Permisos y visibilidad por rol: el administrador/a de RR.HH. accede a todas las funciones de las Historias 1 a 5, cierra períodos, consulta la bitácora de auditoría, exporta e importa el respaldo y carga los parámetros legales; el analista de remuneraciones gestiona fichas, catálogos y contratos, registra novedades, crea períodos, ejecuta el cálculo y consulta liquidaciones, pero no cierra períodos, no aprueba novedades y no accede a la bitácora ni al respaldo. La jefatura ve de su equipo únicamente los datos básicos (nombre, código, cargo, departamento, centro de costo y estado laboral) y gestiona las novedades de su equipo (incluidas licencias médicas sin diagnóstico clínico), pudiendo aprobar o rechazar las que no haya registrado ella misma; en listados, detalles, búsquedas y vistas imprimibles tiene ocultos o bloqueados los contratos, los sueldos base y las liquidaciones de su equipo, y no puede operar sobre Trabajadores ajenos a su equipo. El Trabajador solo ve sus propias liquidaciones de períodos cerrados; el resto de la información sensible permanece oculta o inaccesible para él.
- Cambiar de rol durante la sesión aplica de inmediato los permisos del nuevo rol, vuelve a pedir el Trabajador que se representa cuando el rol es jefatura o Trabajador, y queda registrado en la bitácora.
- Las restricciones se aplican en la interfaz y en la capa de datos, por lo que un enlace directo no permite eludirlas; cuando se deniega una acción, el sistema lo informa sin revelar el contenido protegido.
- La bitácora de auditoría registra toda consulta, creación, modificación o desactivación de información sensible, los cambios de rol, los accesos denegados y las operaciones de exportación e importación de respaldo, con al menos usuario, rol, fecha y hora, acción y registro afectado, y los campos modificados cuando corresponda; es de solo inserción y se conserva mientras dure la relación laboral y 6 años después. Al importar un respaldo, nunca se sobrescriben ni se eliminan los registros previos de la bitácora.
- Si la bitácora no puede escribirse, la operación no se completa.

**Prueba Independiente**: Al simular cada rol, la interfaz muestra y permite solo lo que corresponde; con el rol Jefatura se ocultan los sueldos, y cada consulta o cambio sensible, junto con cada acceso denegado, aparece en la bitácora.

**Escenarios de Aceptación**:

1. **Dado** un usuario con rol de jefatura, **cuando** consulta el sistema, **entonces** ve y registra las novedades de su equipo, y aprueba o rechaza las de su equipo que no haya registrado ella misma, sin acceso a las liquidaciones ni a los sueldos base.
2. **Dado** que el usuario selecciona el rol Jefatura, **cuando** no selecciona el Trabajador activo que representa, **entonces** el sistema no muestra ni permite operar novedades.
3. **Dado** que el usuario selecciona el rol Trabajador, **cuando** no selecciona el Trabajador (activo o desvinculado) que representa, **entonces** el sistema no muestra liquidaciones. Al seleccionar un Trabajador activo o desvinculado que representa, puede consultar sus propias liquidaciones históricas de períodos cerrados.
4. **Dado** un Trabajador desvinculado representado en la sesión, **cuando** utiliza el sistema, **entonces** solo puede consultar sus propias liquidaciones de períodos cerrados y no puede operar otras funciones.
5. **Dado** un usuario sin rol seleccionado o con un rol no reconocido, **cuando** intenta usar el sistema, **entonces** no se muestra ni se permite operar ningún dato.
6. **Dado** un analista de remuneraciones, **cuando** intenta consultar la bitácora, exportar o importar un respaldo o aprobar una novedad, **entonces** el sistema lo impide e indica que no tiene autorización.
7. **Dado** un usuario sin autorización sobre una liquidación, **cuando** intenta acceder a ella mediante un enlace directo, **entonces** el sistema lo impide sin revelar su contenido.
8. **Dado** una sesión activa, **cuando** el usuario cambia de rol, **entonces** se aplican de inmediato los permisos del nuevo rol, se vuelve a pedir el Trabajador que representa si corresponde y el cambio queda en la bitácora.
9. **Dado** el administrador/a de RR.HH., **cuando** consulta la bitácora, **entonces** puede ver los registros con usuario, rol, fecha y hora, acción y registro afectado, y puede reconstruir los accesos y modificaciones de un usuario o período.
10. **Dado** cualquier rol, **cuando** intenta editar o eliminar un registro de auditoría, **entonces** el sistema lo rechaza y el intento queda registrado.
11. **Dado** una operación sobre información sensible, **cuando** la bitácora no puede escribirse, **entonces** la operación no se completa.
12. **Dado** un acceso denegado por falta de permisos, **cuando** el sistema lo rechaza, **entonces** el intento queda registrado en la bitácora.
13. **Dado** cualquier cambio o consulta de información sensible, **cuando** la operación se completa, **entonces** el sistema genera un registro automático de auditoría de solo inserción.

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
- ¿Qué ocurre cuando se selecciona el rol Jefatura o el rol Trabajador sin elegir el Trabajador que representa?
- ¿Qué ocurre cuando se intenta registrar una novedad cuyo rango cruza meses y uno de los períodos no está activo?
- ¿Qué ocurre al intentar crear un período de remuneración sin parámetros legales obligatorios?
- ¿Qué ocurre al importar un respaldo JSON respecto a la bitácora de auditoría existente?
- ¿Qué ocurre cuando la bitácora de auditoría no puede escribirse por un fallo del sistema?
- ¿Qué ocurre cuando alguien intenta editar o eliminar un registro de auditoría?
- ¿Qué ocurre cuando un usuario autorizado consulta datos sensibles de un trabajador que no pertenece a su equipo?
- ¿Qué ocurre cuando el rol de jefatura intenta imprimir o exportar una liquidación?
- ¿Se registran en la auditoría también los accesos denegados o fallidos?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de entidad con al menos un nombre y un código.
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un registro de entidad existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un registro de entidad existente. Esta eliminación aplica a la Entidad genérica; los Trabajadores no se eliminan, se desactivan según la Historia de Usuario 1. Las pantallas de Entidades y Documentos genéricas NO DEBEN listar Trabajadores ni Liquidaciones; estos registros se gestionan exclusivamente en las vistas de RR.HH.
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
- **FR-040**: El sistema DEBE presentar cada liquidación (en borrador o cerrada) como una lista de líneas con su concepto y monto, permitiendo seleccionar cada línea para ver su explicación (Historia de Usuario 5).
- **FR-041**: Al seleccionar una línea, el sistema DEBE mostrar la base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal con su fecha de vigencia, y el monto explicado DEBE coincidir con el de la línea (Historia de Usuario 5).
- **FR-042**: Si una línea no dispone de fórmula o parámetro legal asociado, el sistema DEBE mostrarla igualmente e indicar claramente esa carencia (Historia de Usuario 5).
- **FR-043**: La explicación de una liquidación de un período cerrado DEBE mostrar los valores congelados del período, y la de un período abierto o calculado DEBE mostrar los parámetros del período y marcarse visiblemente como "borrador", también en la vista imprimible (Historia de Usuario 5).
- **FR-044**: El sistema DEBE ofrecer una acción de imprimir que genere una vista limpia del comprobante, sin menús, botones de edición ni controles de navegación, y consultar, explicar o imprimir una liquidación NO DEBE modificar su contenido (Historia de Usuario 5).
- **FR-045**: El comprobante imprimible DEBE incluir la identificación del Trabajador, el período, las líneas con sus montos, los totales, el líquido a pagar y la marca de "borrador" cuando corresponda (Historia de Usuario 5).
- **FR-046**: Los montos de la vista imprimible DEBEN coincidir exactamente con los montos mostrados en la liquidación (Historia de Usuario 5).
- **FR-047**: La vista imprimible DEBE adaptarse a una hoja tamaño carta o A4 en orientación vertical y DEBE poder guardarse como PDF (Historia de Usuario 5).
- **FR-048**: La consulta, la explicación, la impresión y el guardado en PDF de liquidaciones DEBEN respetar los permisos de acceso vigentes: el analista de remuneraciones y el administrador/a de RR.HH. pueden ver las liquidaciones de cualquier Trabajador; el Trabajador solo las suyas y solo las de períodos cerrados; la jefatura no accede a liquidaciones (Historias de Usuario 5 y 6).
- **FR-049**: El sistema DEBE impedir que un Trabajador vea una liquidación que no sea suya o que pertenezca a un período no cerrado, y DEBE impedir que una jefatura acceda a liquidaciones, informando la denegación sin revelar el contenido protegido (Historias de Usuario 5 y 6).
- **FR-050**: La consulta, explicación, impresión o guardado en PDF de una liquidación por un usuario con sesión identificada DEBE registrarse en la bitácora de auditoría con al menos usuario, rol, fecha y hora, acción y registro afectado (Historias de Usuario 5 y 6).
- **FR-051**: El sistema DEBE basar el acceso a la información sensible en el rol de la sesión identificada (simulada, mediante selector de rol); sin rol seleccionado no hay acceso.
- **FR-052**: El sistema DEBE restringir la visualización y consulta de sueldos, liquidaciones y licencias médicas a los roles expresamente autorizados. La jefatura puede ver de su equipo únicamente los datos básicos (nombre, código, cargo, departamento, centro de costo y estado laboral) y gestionar las novedades de su equipo (incluidas licencias médicas sin diagnóstico clínico), pero tiene ocultos o bloqueados los contratos, los sueldos base y las liquidaciones, y no puede operar sobre Trabajadores ajenos a su equipo; el Trabajador solo puede ver sus propias liquidaciones de períodos cerrados. Esta es la regla canónica de visibilidad; FR-054 especifica las superficies y FR-085 las capacidades por rol.
- **FR-053**: El rol Jefatura DEBE operar las novedades de su equipo según las reglas de la Historia de Usuario 3 y NO DEBE acceder a liquidaciones ni a sueldos base.
- **FR-054**: El sistema DEBE aplicar la regla de visibilidad de FR-052 en listados, detalles, búsquedas y vistas imprimibles, para todos los roles definidos en FR-085.
- **FR-055**: El sistema DEBE registrar automáticamente en la bitácora de auditoría toda consulta, creación, modificación o eliminación, desactivación o anulación de información sensible según corresponda, los cambios de rol, los accesos denegados y las operaciones de exportación e importación de respaldo, indicando al menos usuario, rol, fecha y hora, acción y registro afectado; si la bitácora no puede escribirse, la operación no se completa.
- **FR-056**: La bitácora de auditoría DEBE ser de solo inserción y NO DEBE permitir la edición ni la eliminación de sus registros por ningún rol.
- **FR-057**: Las restricciones de acceso DEBEN aplicarse tanto en la interfaz como en la capa de acceso a los datos, impidiendo la consulta no autorizada por enlaces directos u otras vías.
- **FR-058**: El sistema DEBE conservar la bitácora de auditoría mientras dure la relación laboral y durante 6 años posteriores al término de esta, conforme a la Ley 21.719.
- **FR-059**: El sistema DEBE informar de forma clara a la sesión identificada (simulada) cuando una acción o consulta es denegada por falta de permisos, sin revelar el contenido protegido.
- **FR-060**: El sistema DEBE permitir exportar e importar un respaldo completo de los datos en formato JSON para respaldo y restauración, incluyendo también los registros de la bitácora de auditoría. Estas operaciones DEBEN quedar registradas en la bitácora de auditoría y, al importar un respaldo, el sistema DEBE fusionar los registros importados de la bitácora con los existentes usando su identificador, sin sobrescribirlos, eliminarlos ni duplicarlos (la bitácora se mantiene de solo inserción).
- **FR-061**: El sistema DEBE impedir que dos fichas de trabajador compartan el mismo RUT, comparándolo normalizado (sin puntos, guiones ni espacios) y sin distinguir mayúsculas.
- **FR-062**: El sistema DEBE impedir que dos fichas de trabajador compartan el mismo código, comparándolo sin distinguir mayúsculas ni acentos e ignorando espacios al inicio y al final.
- **FR-063**: El sistema DEBE permitir crear, consultar y actualizar fichas de Trabajador con nombre, código y RUT obligatorios, validando el dígito verificador del RUT y los formatos de correo y fecha de ingreso cuando se informen (Historia de Usuario 1).
- **FR-064**: El sistema DEBE gestionar los catálogos de cargo, departamento y centro de costo, permitiendo crear, editar, ocultar y reactivar opciones (sin eliminarlas), impidiendo asignar opciones desactivadas a nuevas fichas y mostrando la etiqueta "desactivado" en fichas existentes (Historia de Usuario 1).
- **FR-065**: El sistema DEBE permitir desactivar un Trabajador activo solo con confirmación explícita, bloqueando la operación si tiene novedades en estado "Pendiente"; al desvincular DEBE terminar automáticamente su contrato vigente o vencido con la fecha de desvinculación, mantener el estado activo/inactivo, registrar la fecha de desvinculación, conservar la ficha para consulta histórica sin eliminarla ni reactivarla en esta versión, y si el Trabajador era jefatura directa, dejar a su equipo como "sin jefatura directa" con sus novedades pendientes a cargo del administrador/a de RR.HH. (Historias de Usuario 1 y 2).
- **FR-066**: El sistema DEBE permitir asignar una jefatura directa opcional a cada Trabajador, restringida a Trabajadores activos, impidiendo la autoasignación y ocultando Trabajadores inactivos del selector de jefatura (Historia de Usuario 1).
- **FR-067**: El sistema DEBE registrar en la bitácora de auditoría la creación, actualización y desactivación de fichas de Trabajador y de catálogos base, con usuario, rol, fecha y hora, y valores anteriores y nuevos de los campos modificados (Historia de Usuario 1).
- **FR-068**: El sistema DEBE gestionar contratos por Trabajador con sueldo base, jornada, tipo de contrato y vigencia, manteniendo sus estados (vigente, vencido, terminado) y el historial de vigencias (Historia de Usuario 2).
- **FR-069**: El sistema DEBE garantizar que cada Trabajador tenga como máximo un contrato vigente a la vez y que las vigencias de sus contratos no se superpongan; un Trabajador puede no tener contratos (Historia de Usuario 2).
- **FR-070**: El sistema DEBE aplicar las transiciones de estado de contratos: marcar como vencido al superar la fecha de fin sin terminación, permitir terminar un contrato vigente o vencido (incluido el indefinido) y no permitir eliminar contratos lógica ni físicamente; el estado "cancelado" no se admite en esta versión (Historia de Usuario 2).
- **FR-071**: El sistema DEBE impedir la edición directa de los campos de vigencia de un contrato existente; los cambios de vigencia DEBEN materializarse creando un nuevo registro y el sistema ajusta la fecha de fin del anterior sin superposición (Historia de Usuario 2).
- **FR-072**: El sistema DEBE generar alertas de contratos próximos a vencer (30 días o menos) y vencidos, y exigir que el Trabajador cuente con un contrato cuya vigencia incluya la fecha de la novedad para registrarla, o al menos un día del período para ser incluido en el cálculo de remuneraciones (Historia de Usuario 2).
- **FR-073**: El sistema DEBE registrar en la bitácora de auditoría la creación, actualización y cambios de estado de contratos con usuario, fecha y hora, y valores anteriores y nuevos de los campos modificados (Historia de Usuario 2).
- **FR-074**: El sistema DEBE permitir registrar novedades de horas extra, licencia médica y ausencia asociadas a un Trabajador y al período de su fecha, exigiendo que el período se encuentre activo; las licencias médicas no DEBEN registrar diagnóstico clínico (Historia de Usuario 3).
- **FR-075**: Cuando el rango de una novedad cruza meses, el sistema DEBE dividirla automáticamente por mes calendario, prorrateando la cantidad según los días del rango que caen en cada mes (p. ej., 10 días: 6 en enero y 4 en febrero); si alguno de los períodos no está activo, la operación completa DEBE rechazarse sin crear registros parciales (Historia de Usuario 3).
- **FR-076**: El sistema DEBE gestionar los estados de las novedades (pendiente, aprobada, rechazada, anulada), impidiendo registrar o modificar novedades de períodos cerrados y excluyendo del cálculo las novedades cuyo período no esté activo (Historia de Usuario 3).
- **FR-077**: El sistema DEBE aplicar la segregación de funciones en novedades: la jefatura puede registrar, aprobar o rechazar las de su equipo, pero no las que ella misma registró; el administrador/a de RR.HH. puede aprobar o rechazar las de Trabajadores sin jefatura directa y las registradas por la jefatura de ese equipo; el analista de remuneraciones puede registrar y ver novedades, pero no aprobarlas ni rechazarlas; ningún rol puede aprobar o rechazar una novedad que haya registrado. Solo una novedad "Pendiente" puede editarse o anularse; las "Aprobadas" y "Rechazadas" no se modifican y una corrección se registra como una novedad nueva (Historia de Usuario 3).
- **FR-078**: El sistema DEBE registrar en la bitácora de auditoría la creación, actualización, aprobación, rechazo y anulación de novedades con usuario, fecha y hora, y valores anteriores y nuevos de los campos modificados (Historia de Usuario 3).
- **FR-079**: El sistema DEBE permitir crear períodos de remuneración por mes y año con parámetros legales obligatorios y estado inicial "abierto", impidiendo períodos duplicados o con mes calendario inválido (Historia de Usuario 4).
- **FR-080**: El sistema DEBE ejecutar el cálculo de remuneraciones de un período considerando únicamente los contratos cuya vigencia comprenda al menos un día del período (incluidos los terminados o vencidos con vigencia dentro del período) y las novedades aprobadas del período, calculando de forma proporcional por los días de vigencia dentro del período sobre los días naturales del mes (p. ej., 17/31 para un contrato que cubre 17 de 31 días), dejando el período en estado "calculado" y permitiendo recalcular mientras esté abierto o calculado (Historia de Usuario 4).
- **FR-081**: El sistema DEBE marcar como desactualizada la liquidación de un Trabajador cuando, tras el último cálculo, se apruebe una novedad o cambie su contrato, obligando a recalcular antes del cierre (Historia de Usuario 4).
- **FR-082**: El sistema DEBE impedir cerrar un período con novedades pendientes o con Trabajadores sin calcular (según la definición de la Historia de Usuario 4); al cerrar DEBE congelar UF, UTM y tasas, registrar quién y cuándo lo cerró y pasar el período a "cerrado" sin posibilidad de reapertura (Historia de Usuario 4).
- **FR-083**: Cada línea de liquidación DEBE redondearse al peso entero y los totales DEBEN obtenerse sumando las líneas ya redondeadas; las liquidaciones de períodos cerrados no DEBEN poder modificarse y su corrección queda fuera del alcance de esta versión (Historia de Usuario 4).
- **FR-084**: El sistema DEBE registrar en la bitácora de auditoría la creación, cálculo, recálculo y cierre de períodos de remuneración con usuario, fecha y hora, y los datos relevantes de la operación (Historia de Usuario 4).
- **FR-085**: El sistema DEBE aplicar los permisos detallados por rol de la sesión identificada (simulada), en complemento a FR-051–FR-054 (Historia de Usuario 6): el administrador/a de RR.HH. accede a todas las funciones de las Historias 1 a 5 y es el único rol que cierra períodos, consulta la bitácora de auditoría, exporta/importa el respaldo y carga los parámetros legales; el analista de remuneraciones gestiona fichas, catálogos y contratos, registra novedades, crea períodos, ejecuta el cálculo y consulta liquidaciones, pero no cierra períodos, no aprueba novedades y no accede a la bitácora ni al respaldo; jefatura y Trabajador según las restricciones de visibilidad de FR-052/FR-054, con segregación de FR-053/FR-077.
- **FR-086**: Al cambiar de rol durante una sesión activa, el sistema DEBE aplicar de inmediato los permisos del nuevo rol, volver a solicitar el Trabajador que se representa cuando el rol sea jefatura o Trabajador, y registrar el cambio en la bitácora de auditoría (Historia de Usuario 6).
- **FR-087**: La consulta de la bitácora de auditoría DEBE estar disponible exclusivamente para el rol administrador/a de RR.HH., quien puede visualizar y reconstruir los accesos y modificaciones registrados (Historia de Usuario 6).
- **FR-088**: Durante la ejecución del cálculo masivo de un período, el sistema DEBE mostrar un indicador de progreso con el porcentaje o el número de Trabajadores procesados hasta que la operación finalice (Historia de Usuario 4).

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
- **Catálogo**: Opción maestra de cargo, departamento o centro de costo, con tipo, código único dentro de su tipo, nombre y estado activo/inactivo; se desactiva sin eliminarse y se conserva en las fichas que ya la usaban.
- **Liquidación**: Documento que resume la remuneración de un trabajador en un período, con el detalle de haberes, descuentos, impuestos, totales y líquido a pagar, junto con el estado del cálculo y la fecha de emisión del comprobante.
- **Línea de Liquidación**: Cada concepto que compone una liquidación (haber, descuento o impuesto), con su monto, la base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal que la respalda; las líneas manuales registran un motivo en lugar de una fórmula.
- **Parámetro Legal**: Valor normativo vigente en una fecha determinada (tasa, tope, tramo o monto fijo) que sustenta el cálculo de una línea y que se conserva congelado para los períodos ya calculados.
- **Rol**: Perfil que determina las funciones y los datos a los que puede acceder un usuario en la sesión simulada; los roles son administrador/a de RR.HH., analista de remuneraciones, jefatura y Trabajador.
- **Permiso de Acceso**: Regla que asocia un rol con la capacidad de consultar o modificar un tipo de información sensible.
- **Dato Sensible**: Información personal o financiera protegida (sueldos, liquidaciones y licencias médicas) cuyo acceso está restringido según el rol.
- **Registro de Auditoría**: Entrada inmutable que documenta quién consultó o modificó información sensible, cuándo, con qué rol y sobre qué registro.
- **Bitácora de Auditoría**: Colección de solo inserción de registros de auditoría, conservada para efectos de trazabilidad y cumplimiento normativo.
- **Trabajador**: Entidad que representa a una persona empleada; reutiliza la Entidad (nombre, código y RUT como identificación fiscal), se vincula a su perfil de RR.HH. por entity_id y puede tener una jefatura directa opcional.
- **Contrato**: Condiciones laborales de un Trabajador (sueldo base, jornada y tipo de contrato) con historial por vigencia y alertas de vencimiento; pertenece a un Trabajador.
- **Novedad**: Evento de un período (horas extra, licencia médica o ausencia) asociado a un Trabajador y a un Período de Remuneración, con estado Pendiente/Aprobada/Rechazada/anulada y sin diagnóstico clínico.
- **Período de Remuneración**: Mes y año de liquidación con estado Abierto/Calculado/Cerrado; al cerrarse congela UF, UTM, ingreso mínimo y parámetros legales, y agrupa Novedades y Liquidaciones.

> El detalle de atributos, claves de almacenamiento y relaciones de las entidades de Recursos Humanos se documenta en `specs/001-erp-base-module/data-model.md`.

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
- **SC-011**: Al seleccionar cada línea de una liquidación calculada (evento de foco o clic), el 100% de las líneas muestra base, tasa o factor y fórmula en menos de 1 segundo, medido desde el evento de selección hasta que el desglose queda visible en la interfaz.
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
- **SC-022**: Un usuario puede exportar un respaldo completo y restaurarlo sin pérdida de entidades, documentos, novedades, períodos ni liquidaciones en menos de 5 minutos.
- **SC-023**: El cálculo masivo de un período con hasta 500 Trabajadores y sus novedades aprobadas genera todas las liquidaciones en 10 segundos o menos en el entorno de uso previsto.
- **SC-024**: El 100% de las pantallas, formularios, listados y vistas imprimibles cumple con WCAG 2.2 nivel AA, verificado mediante pruebas automatizadas y manuales de navegación por teclado, contraste y lectores de pantalla.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial incluye la gestión de fichas de trabajadores y catálogos base (US1), la gestión de contratos y alertas de plazo (US2), el registro y aprobación de novedades (US3), el cálculo y cierre de períodos de remuneración (US4), la vista explicativa e impresión de liquidaciones (US5) y la seguridad, roles y gobierno de datos (US6). Quedan fuera capacidades ERP avanzadas como contabilidad general, informes financieros y planificación presupuestaria.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre áreas ocurre mediante una barra lateral persistente; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se deriva del nombre del módulo como un monograma; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos persisten localmente en el navegador y no se ven afectados por la navegación entre pantallas.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El contenido introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de mostrarse para prevenir ataques de inyección de scripts (XSS).
- Las liquidaciones y sus líneas existen como resultado del motor de cálculo de la Historia de Usuario 4; la Historia de Usuario 5 cubre únicamente su explicación e impresión, no las reglas de cálculo ni la generación de la planilla.
- Cada línea conserva, desde el momento del cálculo, la base, la tasa o fórmula y el parámetro legal aplicado, de modo que la explicación no depende de parámetros posteriores.
- La impresión se realiza mediante la función de impresión del navegador, que incluye la opción de guardar como PDF; no se requiere un generador de PDF dedicado.
- Los datos de identificación de la empresa emisora están disponibles en la configuración del módulo.
- Los parámetros legales (UF, UTM, tasas y tramos) se cargan y versionan manualmente por un administrador mediante formulario o archivo de configuración; no se integran servicios externos de indicadores previsionales.
- Los montos se presentan en pesos chilenos con separador de miles.
- El acceso a la explicación y al comprobante respeta los permisos vigentes del usuario.
- Los roles de la sesión simulada son administrador/a de RR.HH., analista de remuneraciones, jefatura y Trabajador, sin gestión de asignación.
- La identidad y el rol del usuario se determinan al iniciar una sesión simulada mediante un selector de rol; no se implementa autenticación real ni manejo de credenciales.
- Los datos sensibles (sueldos, liquidaciones y licencias médicas) están clasificados explícitamente en el modelo de datos.
- Las restricciones de acceso se aplican tanto en la interfaz como en la capa de datos, por lo que no pueden eludirse mediante enlaces directos.
- La bitácora de auditoría se conserva mientras dure la relación laboral y 6 años después del término, conforme a la Ley 21.719.
- La auditoría registra tanto los accesos autorizados como los denegados.
- La versión inicial incluye exportación e importación completa en JSON para respaldo y restauración de los datos almacenados localmente.


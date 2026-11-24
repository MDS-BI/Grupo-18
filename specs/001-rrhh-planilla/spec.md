# Especificación de la Funcionalidad: Módulo de Recursos Humanos y Planilla para un Software de Planificación de Recursos Empresariales (ERP)

> **Funcionalidad descrita**: módulo de **Recursos Humanos y Planilla (RR.HH.)**. Todas las historias de usuario, requisitos y criterios de aceptación de este documento corresponden a este módulo.

**Rama de la funcionalidad**: 001-rrhh-planilla  
**Creada**: 2026-07-08  
**Actualizada**: 2026-11-19  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Construir el módulo de Recursos Humanos y Planilla de un ERP que gestione las fichas de los trabajadores, sus contratos y las novedades del mes, calcule las remuneraciones según la legislación chilena y emita liquidaciones explicables, con control de acceso por rol y bitácora de auditoría."  
**Última incorporación**: Historias de Usuario 1 a 12 (US1–US4, US6 y US12 con prioridad P1; US5, US7, US8, US10 y US11 con prioridad P2; US9 con prioridad P3), con FR-040–FR-116, SC-011–SC-031 y las reglas transversales de seguridad, auditoría y respaldo. Esta actualización agrega el control de visibilidad de contraseña (FR-113), los avisos del panel principal por rol (FR-114), las dos pestañas superiores del Trabajador, "Resumen" y "Liquidaciones" (FR-114), el despliegue de la liquidación bajo la fila en la pantalla de cálculo y, en la pestaña "Liquidaciones", al pulsar "Ver liquidación" (FR-115), y el panel lateral de formularios de alta y edición (FR-116), además del renombrado de la pestaña superior "Novedades" a "Asistencia" (US3). Esta revisión precisa que el listado de Trabajadores ocupa todo el ancho disponible, con el botón principal arriba a la derecha a la misma altura del título (US1, FR-110), y que la pestaña "Liquidaciones" no muestra ningún detalle calculado ni acciones de ciclo de vida hasta pulsar "Ver liquidación", limpiándolos al cambiar de período (US5, FR-115), y que el PDF obtenido desde "Imprimir / Guardar en PDF" reproduce exactamente lo mismo que se ve en "Ver liquidación", extrayendo el detalle de la fila seleccionada hacia la hoja de impresión y comenzando en la primera página sin hojas en blanco previas (US5, FR-046). También se precisa que la pantalla de selección del Trabajador representado se muestra extendida y centrada en el área principal (US6, FR-110), y que el conjunto de datos de demostración incluye liquidaciones pagadas en el período cerrado `2026-08` para que la pestaña "Liquidaciones" del Trabajador no aparezca vacía (US5, US6). Esta revisión también embellece la pestaña "Resumen" del Trabajador como una tarjeta con títulos en negrita, estado destacado y tabla compacta de etiquetas (US6, FR-110), y asegura que el cargo aparezca una sola vez en el comprobante, sin repetirse como departamento en liquidaciones nuevas ni en datos ya guardados (US5, FR-046). Las Historias 7 a 12 agregan vacaciones (FR-088–FR-091), cargas familiares y asignación familiar (FR-092–FR-094), simulador de sueldo (FR-095–FR-096), reportes de gestión y equidad salarial (FR-097–FR-100), exportaciones contables y de pago (FR-101–FR-104) y parámetros legales versionados (FR-105–FR-107). Los identificadores FR-001–FR-039, SC-001–SC-010 y XR-001–XR-005 pertenecían al módulo base genérico (entidades y documentos), que se retiró del alcance por no corresponder a Recursos Humanos y Planilla; esos números no se reutilizan.

## Propósito

Este proyecto especifica el módulo de **Recursos Humanos y Planilla** de un ERP (Historias de Usuario 1 a 12). Permite gestionar las fichas de los Trabajadores y los catálogos de cargos, departamentos y centros de costo, sus contratos, las novedades del mes, el cálculo de remuneraciones según la legislación chilena y el ciclo de vida de las liquidaciones, junto con su explicación e impresión, el gobierno de los datos sensibles, las vacaciones, las cargas familiares y la asignación familiar, el simulador de sueldo, los reportes de gestión y equidad salarial, las exportaciones contables y de pago, y los parámetros legales versionados.

## Clarifications

### Session 2026-11-08

- Q: ¿Dónde deben definirse las entidades de Recursos Humanos que usan las Historias de Usuario 1–4 (Trabajador, Contrato, Novedad y Período de remuneración)? → A: Opción A — definir Trabajador, Contrato, Novedad y Período en las Entidades Clave de 001, remitiendo el detalle al data-model de `001-rrhh-planilla`.
- Q: ¿La identidad y el rol del usuario deben provenir de una autenticación real o de una sesión simulada con selector de rol? → A: Opción A (original) — sesión simulada con selector de rol, sin credenciales ni backend.
- Q: ¿Cómo se cargan y actualizan los parámetros legales (UF, UTM, tasas y tramos) para cada período? → A: Opción A — carga manual versionada por un administrador mediante formulario o archivo de configuración, sin integración con servicios externos.
- Q: ¿Durante cuánto tiempo debe conservarse la bitácora de auditoría exigida por la Ley 21.719? → A: Opción A — mientras dure la relación laboral y 6 años después del término (validar con asesoría legal).
- Q: ¿La versión inicial debe incluir exportación e importación de datos para respaldo y restauración? → A: Opción A — exportación e importación completa en JSON para respaldo y restauración.

### Session 2026-06-19

- Q: ¿Cómo se accede a la aplicación? → A: Ingreso con **rol y clave demo** (autenticación simulada local). El rol se elige/valida en el acceso; no existe autenticación real ni backend. Credenciales demo por defecto (documentadas): `administrador`/`admin123`, `analista`/`analista123`, `jefatura`/`jefatura123`, `trabajador`/`trabajador123`. La sesión autenticada vive en el navegador (p. ej. almacenamiento de sesión) y al refrescar puede requerirse reingreso según implementación.
- Q: ¿Se permite cambiar de rol sin cerrar sesión? → A: No en el flujo simplificado: para cambiar de rol se debe **cerrar sesión** e ingresar de nuevo con otra cuenta demo (o misma clave según diseño), evitando cambios implícitos de permisos en caliente salvo que se especifique lo contrario.
- Q: ¿Qué comportamiento tienen los roles Jefatura y Trabajador al ingresar? → A: Tras autenticarse con rol **Jefatura** o **Trabajador**, el sistema debe permitir **elegir a qué persona (Trabajador representado) corresponde la sesión** cuando aplique (para visibilidad de equipo/liquidaciones personales), con validaciones coherentes con las reglas existentes (jefatura solo equipo asignado; trabajador solo sus datos). Debe existir un **botón "Cerrar sesión"** visible en el encabezado.

### Session 2026-11-17

- Q: ¿Sobre qué base de días se calcula proporcionalmente el sueldo de un Trabajador cuyo contrato no cubre todo el período? → A: Opción A — días naturales del mes: se prorratea por los días de vigencia sobre los días reales del mes (p. ej., 17/31).
- Q: ¿Qué nivel de accesibilidad debe cumplir la interfaz para que una pantalla se considere terminada? → A: Opción A — WCAG 2.2 nivel AA, verificado con pruebas automatizadas y manuales de navegación por teclado, contraste y lectores de pantalla.
- Q: ¿Debe el respaldo JSON incluir los registros de la bitácora de auditoría junto con los datos de negocio? → A: Opción A — sí, incluir la bitácora y fusionarla al importar sin borrar ni duplicar registros, usando su identificador.
- Q: ¿Cómo se divide la cantidad de una novedad cuyo rango de fechas cruza meses entre los períodos resultantes? → A: Opción A — prorratear según los días del rango que caen en cada mes (p. ej., 10 días: 6 en enero y 4 en febrero).
- Q: ¿Qué feedback visual debe mostrar la interfaz mientras se ejecuta el cálculo masivo de un período? → A: Opción A — indicador de progreso con porcentaje o número de Trabajadores procesados.
- Q: ¿Cómo deben organizarse las versiones de los parámetros legales —UF, UTM, tasas, topes y tramos— para que cada período use los valores correctos? → A: Opción A — un conjunto completo por mes y año, cargado por el administrador y aplicado íntegramente a ese período.
- Q: ¿Qué formato y contenido deben tener las exportaciones contables y de pago de un período cerrado? → A: Opción A — dos CSV: resumen contable por cuenta/centro de costo y nómina de pago por Trabajador.
- Q: ¿Qué historias de usuario forman parte de la versión inicial que debe planificarse e implementarse? → A: Opción A — todas las historias US1–US12.
- Q: ¿Qué debe ocurrir con los días y el saldo de una solicitud de vacaciones ya aprobada cuando se agrega al calendario un feriado dentro de su rango? → A: Opción A — recalcular automáticamente los días hábiles y ajustar el saldo descontado, registrando el cambio en bitácora.
- Q: ¿Qué debe ocurrir con el saldo de vacaciones de un Trabajador desvinculado? → A: Opción A — congelar el saldo solo para consulta histórica, sin pago ni ejercicio en esta versión.
- Q: ¿Qué debe ocurrir cuando un administrador modifica un conjunto de parámetros legales que ya fue usado por un período abierto o calculado? → A: Opción A — bloquear toda modificación desde que el conjunto se usa por primera vez; las correcciones requieren otro conjunto para un mes distinto.
- Q: ¿Cómo debe obtener el sistema la cuenta contable y el centro de costo para el resumen CSV de exportaciones? → A: Opción A — mapear cuentas por concepto de liquidación en la configuración del módulo y usar el centro de costo de la ficha del Trabajador.
- Q: ¿De dónde deben salir el banco, la cuenta y la fecha de pago incluidos en la nómina CSV? → A: Opción A — añadir banco y cuenta a la ficha del Trabajador, exigirlos al exportar y usar una fecha de pago registrada en el período cerrado.
- Q: ¿Deben completarse los requisitos y criterios declarados pero ausentes en la spec (FR-088–FR-100, FR-102–FR-104, FR-106–FR-107 y SC-024–SC-029) antes de continuar? → A: Opción A — completarlos con reglas verificables derivadas de las historias US7–US12 antes de continuar.
- Q: ¿Qué formato técnico deben tener los dos CSV de exportación? → A: Opción A — UTF-8 con BOM, separador punto y coma, encabezados sin acentos y nombres `resumen_contable_YYYYMM.csv` y `nomina_pago_YYYYMM.csv`.

### Session 2026-11-18

- Q: ¿Cómo se debe comprobar que cada escenario de aceptación de las historias de usuario funciona? → A: Opción A — cada escenario Dado/cuando/entonces tiene una prueba automatizada en Vitest, y cada pantalla de RR.HH. se revisa además con una lista de chequeo visual manual.
- Q: ¿En qué tamaños de pantalla debe verse bien la página para considerarla terminada? → A: Opción A — escritorio y tablet, de 768 px a 1920 px de ancho, sin desplazamiento horizontal.
- Q: ¿Cómo deben mostrarse los listados largos (por ejemplo, 500 Trabajadores o todas las liquidaciones de un período)? → A: Opción A — paginación de 25 filas con anterior/siguiente y total de registros, conservando búsqueda y filtros, ordenados alfabéticamente por nombre.
- Q: ¿Cómo debe avisar la página el resultado de una acción (guardar, aprobar, rechazar, calcular) y los errores de validación? → A: Opción A — un aviso visible arriba del formulario o listado (éxito o error) anunciado a lectores de pantalla, y los errores de validación junto a cada campo.
- Q: ¿Qué debe revisar la lista de chequeo visual que se aplica a cada pantalla antes de dar por terminada su historia? → A: Opción A — una guía de estilo común: mismos colores, tipografía y espaciados de `src/styles.css`, título y acciones principales en la misma ubicación, tablas con encabezado, textos sin cortes ni desbordes y contraste AA.
- Q: ¿Cuándo se registra la fecha de pago que exige la nómina de pago (US11)? → A: Opción A — es un dato obligatorio al cerrar el período (US4) y queda congelada con él.
- Q: ¿Cómo carga el administrador/a el conjunto de parámetros legales de un mes en la página (US12)? → A: Opción A — un formulario en pantalla con todos los valores y una acción "Copiar mes anterior" que lo rellena para modificar solo lo que cambió, indicando los campos faltantes.
- Q: ¿Cómo deben presentarse los reportes de gestión en pantalla (US10)? → A: Opción A — cada reporte muestra una tabla con las cifras y un gráfico de barras simple, sin librerías externas, con título y descripción accesibles.
- Q: ¿Se pueden pedir vacaciones por medio día o solo por días completos (US7)? → A: Opción A — solo días hábiles completos; el saldo se muestra con dos decimales y solo se puede solicitar su parte entera.
- Q: ¿Dónde se gestionan las vacaciones y las cargas familiares de un Trabajador dentro de la página (US7 y US8)? → A: Las vacaciones se gestionan en su propia pantalla en la barra lateral, y la ficha del Trabajador muestra un resumen con un enlace a esa pantalla filtrada por la persona. Las cargas familiares se gestionan directamente en la ficha del Trabajador (donde aparece el trabajador), sin un apartado separado; la ficha muestra el resumen y permite registrar/consultar sus cargas según permisos.
- Q: Si la remuneración imponible queda exactamente en el límite entre dos tramos de asignación familiar, ¿a qué tramo corresponde (US8)? → A: Opción A — al tramo inferior: el tope de cada tramo es inclusivo.
- Q: En el reporte de brecha salarial de género, ¿qué se hace con quienes eligieron "No binario" o "Prefiere no informar", o no registraron género (US10)? → A: Opción A — la brecha se calcula entre Femenino y Masculino; las demás opciones se muestran solo como un conteo agregado por cargo, oculto si es menor a 5.
- Q: Al validar si una solicitud de vacaciones cabe en el saldo, ¿se cuentan los días que se devengarán entre hoy y la fecha de inicio (US7)? → A: Opción A — sí, el saldo se proyecta a la fecha de inicio; la pantalla muestra el saldo de hoy y el proyectado.
- Q: Si el equipo de una jefatura es pequeño, ¿se aplica también el mínimo de 5 personas a sus reportes de horas extra y ausentismo (US10)? → A: Opción A — sí, si el equipo o departamento del reporte tiene menos de 5 personas, las cifras se ocultan con una explicación.
- Q: ¿La tabla de tramos de asignación familiar es un dato obligatorio del conjunto de parámetros legales de cada mes (US8 y US12)? → A: Opción A — sí; sin ella no se puede crear ni calcular el período.

**Notas UI RR.HH. (sesión 2026-11-19, ajustes de privacidad/representación):** en `Contratos` (vista RRHH), si el rol es **Jefatura** o **Trabajador**, se limita el alcance a su ámbito (Jefatura: equipo asignado; Trabajador: solo su persona representada) y se **oculta la columna “Sueldo base”**. En el encabezado/badge se muestra el **nombre y código** del trabajador representado cuando aplica (en vez de solo el UUID). En la pantalla de selección de representado, el texto aclara: **Jefatura** elige su propia ficha de jefe/a para cargar su equipo; **Trabajador** elige su ficha personal. El selector de representado se muestra extendido y centrado en el área principal, ocupando todo el ancho disponible sin quedar reducido a un recuadro estrecho en una esquina (FR-110). La pestaña "Resumen" del Trabajador se presenta como una tarjeta con título en negrita, distintivo de estado y una tabla compacta de etiquetas también en negrita, sin exponer sueldo base ni datos ajenos (US6).

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
- La ficha DEBE permitir registrar el banco y la cuenta de pago del Trabajador; ambos son obligatorios para exportar la nómina de pago, pero no para crear la ficha.
- El código del trabajador es único: no pueden existir dos fichas con el mismo código, comparado sin distinguir mayúsculas ni acentos e ignorando espacios al inicio y al final.
- Cada ficha conserva un identificador interno que no cambia al actualizarla, de modo que contratos, novedades y liquidaciones sigan apuntando a la misma persona.
- Desactivar una ficha no la elimina ni borra su historia: se pide la fecha de desvinculación, la ficha pasa a estado laboral "Desvinculado" y conserva sus datos y sus referencias para liquidaciones anteriores.
- La desactivación se bloquea si el Trabajador tiene novedades en estado "Pendiente"; esas novedades deben aprobarse, rechazarse o anularse antes de desvincularlo. Si el Trabajador es jefatura directa, su equipo pasa a tratarse como "sin jefatura directa" y las novedades pendientes de ese equipo quedan a cargo del administrador/a de RR.HH. Al desvincular, el contrato vigente o vencido del Trabajador se termina automáticamente con la fecha de desvinculación (regla de la US2).
- Un Trabajador desactivado no se reactiva en esta versión; su ficha permanece disponible para consulta histórica.
- Un catálogo tiene tipo (cargo, departamento o centro de costo), código y nombre; el código es único dentro de su tipo.
- Desactivar un catálogo no borra historia: deja de ofrecerse en fichas nuevas pero se sigue mostrando en las fichas que ya lo usaban.
- Las pantallas de fichas y catálogos no muestran el formulario de forma permanente: un botón en la esquina superior derecha (“Registrar trabajador” o “Nuevo registro de catálogo”) abre el formulario en un panel lateral derecho con las acciones Guardar y Cancelar; editar un registro existente usa el mismo panel. Cerrar el panel con cambios sin guardar pide confirmación y, en pantallas estrechas, el panel ocupa todo el ancho (regla transversal detallada en FR-116). El listado de fichas resultante ocupa todo el ancho disponible del área de contenido, centrado, sin quedar reducido a una columna estrecha cuando el formulario está cerrado; el botón "Registrar trabajador" comparte fila con el título, alineado a la derecha (FR-110).

**Prueba Independiente**: Con catálogos precargados como datos semilla, un usuario crea un trabajador, lo encuentra con el selector **Buscar por:** (nombre, código, RUT o cargo), lo actualiza, lo desactiva y comprueba que conserva su historia; además crea, edita y desactiva un catálogo. No requiere recorrer las pantallas de contratos, novedades ni liquidaciones.

**Escenarios de Aceptación**:

1. **Dado** que un usuario está creando una ficha de trabajador, **cuando** ingresa nombre, código y un RUT con dígito verificador válido, y opcionalmente selecciona cargo, departamento y centro de costo, **entonces** la ficha se guarda y aparece en el listado con las etiquetas de los catálogos seleccionados.
2. **Dado** que un usuario está creando o editando una ficha, **cuando** deja el nombre, el código o el RUT en blanco, o ingresa un RUT con dígito verificador inválido, un correo mal formado o una fecha de ingreso que no es una fecha de calendario, **entonces** el sistema impide guardar y señala el campo específico que debe corregirse.
3. **Dado** que ya existe una ficha con un RUT registrado, **cuando** un usuario intenta crear u actualizar otra ficha con ese mismo RUT, **entonces** el sistema rechaza la operación e indica que el RUT ya está asociado a otro trabajador.
4. **Dado** que ya existe una ficha con un código registrado, **cuando** un usuario intenta crear u actualizar otra ficha con ese mismo código, **entonces** el sistema rechaza la operación e indica que el código ya está asociado a otro trabajador.
5. **Dado** que existen fichas registradas, **cuando** el usuario elige un criterio en **Buscar por:** (Nombre, RUT, Código o Cargo) y ajusta su control —prefijo desde el primer carácter para nombre, RUT y código; desplegable de cargos activos para cargo—, **entonces** obtiene solo las fichas que coinciden con ese criterio (el RUT admite puntos y guion); **y cuando** la búsqueda no arroja coincidencias, **entonces** el listado muestra un estado vacío explicativo en lugar de una tabla en blanco.
6. **Dado** un trabajador existente, **cuando** el usuario actualiza sus datos o su cargo, departamento o centro de costo, **entonces** los cambios se guardan sobre la misma ficha y se reflejan de inmediato en el listado y en la búsqueda.
7. **Dado** un trabajador activo, **cuando** el usuario desactiva su ficha indicando la fecha de desvinculación, **entonces** la ficha queda con estado laboral "Desvinculado" con esa fecha y conserva sus datos e historia, sin eliminarse del sistema.
8. **Dado** que un usuario gestiona catálogos base, **cuando** crea un cargo, departamento o centro de costo con código y nombre, **entonces** queda disponible para asignarlo a fichas.
9. **Dado** que ya existe un catálogo activo con un código, **cuando** el usuario intenta crear o editar otro catálogo del mismo tipo con ese código, **entonces** el sistema lo rechaza e indica que el código ya está en uso.
10. **Dado** un catálogo en uso por fichas existentes, **cuando** el usuario lo desactiva, **entonces** deja de ofrecerse para fichas nuevas pero se sigue mostrando en las fichas que ya lo usaban.
11. **Dado** un trabajador activo, **cuando** el usuario intenta desactivar su ficha sin indicar la fecha de desvinculación o con una fecha anterior a la fecha de ingreso, **entonces** el sistema rechaza la operación y señala el campo que debe corregirse.
12. **Dado** una ficha de trabajador, **cuando** el usuario indica como jefatura directa a un Trabajador que no existe, que no está activo o al mismo Trabajador de la ficha, **entonces** el sistema rechaza la operación y señala el campo que debe corregirse.
13. **Dado** un Trabajador que es jefatura directa de otros Trabajadores, **cuando** el usuario lo desvincula, **entonces** su equipo (los Trabajadores que la tenían como jefatura directa) pasa a tratarse como "sin jefatura directa", y las novedades pendientes de ese equipo pasan a ser aprobadas o rechazadas por el administrador/a de RR.HH.
14. **Dado** el listado de fichas de trabajadores, **cuando** el usuario no ha abierto ningún formulario, **entonces** no se muestra el formulario de alta de forma permanente y el botón "Registrar trabajador" está visible arriba a la derecha; **cuando** lo presiona, **entonces** el formulario se abre en un panel lateral derecho con Guardar y Cancelar; **y cuando** edita una ficha existente, **entonces** se usa el mismo panel.
15. **Dado** el panel lateral de una ficha o de un catálogo con cambios sin guardar, **cuando** el usuario lo cierra, **entonces** el sistema pide confirmación antes de descartarlos; **y dado** un catálogo, **cuando** el usuario presiona "Nuevo registro de catálogo", **entonces** el formulario se abre en ese mismo panel lateral derecho, que ocupa todo el ancho en pantallas estrechas.
16. **Dado** el listado de fichas de trabajadores, **cuando** el usuario entra a la pantalla sin abrir ningún formulario, **entonces** la tabla ocupa todo el ancho disponible del área de contenido, centrada, con el encabezado y las filas legibles sin quedar reducida a una columna estrecha; **y dado** el encabezado de la sección, **cuando** se muestra el botón "Registrar trabajador", **entonces** este está alineado arriba a la derecha, a la misma altura del título, sin desplazar el listado (FR-110).
17. **Dado** que un usuario con sesión identificada crea, actualiza o desactiva una ficha de trabajador o un catálogo, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada, el registro afectado y los campos modificados, en una entrada de solo inserción (regla transversal provista por la US6).

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
- El panel principal muestra a cada rol solo los avisos y alertas de datos a los que tiene acceso: el administrador/a de RR.HH. y el analista de remuneraciones ven las alertas de contratos de todos los Trabajadores; la jefatura no ve alertas de contratos; el Trabajador ve únicamente el resumen de su propio contrato (tipo, fecha de inicio, fecha de término si es a plazo fijo, días restantes y estado, sin sueldo base), y si es indefinido también lo ve sin alerta de vencimiento. Un Trabajador sin contrato no ve resumen ni alerta; un Trabajador desvinculado conserva solo la consulta histórica de su último contrato, sin alertas.
- Los contratos reemplazados o terminados no se borran: quedan en el historial del Trabajador.
- La pantalla de contratos no muestra el formulario de forma permanente: el botón "Registrar contrato", ubicado arriba a la derecha, abre el formulario en un panel lateral derecho con Guardar y Cancelar; editar un contrato existente usa el mismo panel. Cerrar el panel con cambios sin guardar pide confirmación y, en pantallas estrechas, el panel ocupa todo el ancho (regla transversal detallada en FR-116).

**Prueba Independiente**: Con fichas de trabajadores precargadas como datos semilla, el usuario registra un contrato a plazo fijo para un Trabajador y comprueba que aparece en su historial y que, con sesión de administrador/a o analista, el panel principal lo muestra como "por vencer" cuando faltan 30 días o menos para su término. No requiere recorrer novedades ni liquidaciones.

**Escenarios de Aceptación**:

1. **Dado** un Trabajador activo sin contrato vigente, **cuando** el usuario registra un contrato con todos los campos obligatorios, **entonces** el contrato queda asociado al Trabajador con estado "vigente" y aparece en su historial.
2. **Dado** un formulario de contrato, **cuando** falta un campo obligatorio, la fecha de término es anterior a la de inicio, el sueldo base es cero o menor al mínimo legal vigente, o la jornada semanal supera el máximo legal vigente, **entonces** el sistema rechaza el registro y señala el campo que debe corregirse.
3. **Dado** un contrato a plazo fijo sin fecha de término, **cuando** el usuario intenta guardarlo, **entonces** el sistema lo rechaza e indica que la fecha de término es obligatoria.
4. **Dado** un contrato indefinido con fecha de término, **cuando** el usuario intenta guardarlo, **entonces** el sistema lo rechaza e indica que un contrato indefinido no lleva fecha de término.
5. **Dado** un Trabajador que ya tiene un contrato cuya vigencia se superpone, **cuando** el usuario intenta registrar otro contrato con fechas superpuestas, **entonces** el sistema lo rechaza e indica que debe registrar un cambio de condiciones o una renovación.
6. **Dado** un contrato a plazo fijo, **cuando** faltan 30 días o menos para su fecha de término y un administrador/a o un analista abre el panel principal, **entonces** ve una alerta con el nombre del Trabajador, la fecha de término y los días restantes.
7. **Dado** un contrato a plazo fijo cuya fecha de término ya pasó, **cuando** un administrador/a o un analista abre el panel principal, **entonces** el contrato se muestra con una etiqueta visible "vencido", diferenciado de los "por vencer".
8. **Dado** un contrato indefinido, **cuando** el usuario abre el panel principal, **entonces** no se genera ninguna alerta de vencimiento.
9. **Dado** un contrato con alerta activa, **cuando** el usuario registra una renovación como un contrato nuevo que continúa desde el día siguiente al término del contrato anterior, **entonces** la alerta desaparece y el contrato anterior queda en el historial en estado "terminado".
10. **Dado** un contrato vigente, **cuando** se registra un cambio de condiciones con nuevo sueldo base y fecha de vigencia, **entonces** el sistema deja el contrato anterior en estado "terminado" el día previo a la nueva vigencia y crea un contrato nuevo; los Períodos anteriores a esa fecha conservan el sueldo anterior y los posteriores usan el nuevo.
11. **Dado** un contrato vigente o vencido, **cuando** el usuario lo termina con una fecha de término efectiva no anterior a la fecha de inicio, **entonces** el contrato queda en estado "terminado", su alerta desaparece y se conserva en el historial.
12. **Dado** un contrato vigente o vencido, **cuando** el usuario intenta terminarlo con una fecha de término efectiva anterior a la fecha de inicio, **entonces** el sistema rechaza la operación y señala el campo que debe corregirse.
13. **Dado** un Trabajador con un contrato vigente o vencido, **cuando** el usuario lo desvincula, **entonces** el sistema termina automáticamente el contrato vigente o vencido con esa fecha de desvinculación y lo conserva en el historial.
14. **Dado** un Trabajador desvinculado, **cuando** el usuario intenta registrarle un contrato nuevo, **entonces** el sistema lo rechaza; y sus contratos anteriores siguen visibles en su historial.
15. **Dado** un Trabajador con contrato a plazo fijo próximo a vencer, **cuando** inicia sesión representándose a sí mismo y abre el panel principal, **entonces** ve el resumen de su propio contrato con tipo, fecha de inicio, fecha de término, días restantes y estado, sin sueldo base ni alertas de otros Trabajadores.
16. **Dado** un Trabajador con contrato indefinido, **cuando** abre el panel principal, **entonces** ve el resumen de su contrato con su estado y sin alerta de vencimiento.
17. **Dado** un Trabajador sin contrato, **cuando** abre el panel principal, **entonces** no ve resumen ni alerta de contratos.
18. **Dado** un Trabajador desvinculado, **cuando** abre el panel principal, **entonces** solo puede consultar históricamente el resumen de su último contrato, sin alertas ni datos de otros Trabajadores.
19. **Dado** contratos de otros Trabajadores con alerta activa, **cuando** una jefatura o un Trabajador abre el panel principal, **entonces** no ve esas alertas ajenas; **y cuando** lo hace un administrador/a o un analista, **entonces** ve las alertas de todos los contratos.
20. **Dado** la pantalla de contratos, **cuando** no se ha abierto ningún formulario, **entonces** el formulario de alta no se muestra de forma permanente y el botón "Registrar contrato" aparece arriba a la derecha; **cuando** se presiona, **entonces** el formulario se abre en un panel lateral derecho con Guardar y Cancelar; **y cuando** se edita un contrato existente, **entonces** se usa el mismo panel, que pide confirmación al cerrarse con cambios sin guardar y ocupa todo el ancho en pantallas estrechas.
21. **Dado** que un usuario con sesión identificada registra o termina un contrato, registra un cambio de condiciones, o el sistema termina un contrato por una desvinculación, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada, el registro afectado y los campos modificados (regla transversal provista por la US6).

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
- La pestaña de la barra superior correspondiente a esta historia se denomina "Asistencia" en lugar de "Novedades"; los registros del dominio siguen llamándose "novedades" en el resto del spec.

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
18. **Dado** un usuario con acceso a esta pantalla, **cuando** abre la barra superior, **entonces** la pestaña se muestra como "Asistencia" y no como "Novedades"; **y cuando** la selecciona, **entonces** accede al registro y aprobación de novedades del período.
19. **Dado** que un usuario con sesión identificada registra, edita, anula, aprueba o rechaza una novedad, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada, el registro afectado y los campos modificados (regla transversal provista por la US6).

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
- Cerrar un período exige ingresar la fecha de pago de las remuneraciones, congela la UF, la UTM, las tasas utilizadas y la fecha de pago, registra quién y cuándo lo cerró, y cambia el estado a "cerrado"; no se permite cerrar con novedades "Pendientes" ni con Trabajadores sin calcular. Se consideran "Trabajadores sin calcular" los Trabajadores con contrato en el período que no tienen liquidación, o cuya liquidación quedó desactualizada por una novedad aprobada o un cambio de contrato posterior al último cálculo; un Trabajador sin contrato en el período no impide el cierre.
- Un período cerrado no se reabre: sus liquidaciones no pueden modificarse, y la corrección de un período cerrado queda fuera del alcance de esta versión.
- La consulta, la impresión y el guardado en PDF de liquidaciones se limitan a los roles autorizados por la US6.
- En la pantalla de cálculo, al seleccionar un Trabajador de la lista, su liquidación se despliega justo debajo de su fila; al seleccionar otro Trabajador, la liquidación anterior se contrae, de modo que solo permanece desplegada la del Trabajador seleccionado (la explicación por línea se rige por la US5).

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
13. **Dado** un período calculado sin errores ni novedades pendientes, **cuando** el administrador/a de RR.HH. cierra el período indicando la fecha de pago, **entonces** el sistema congela la UF, la UTM, las tasas utilizadas y la fecha de pago, registra quién y cuándo lo cerró, y cambia el estado del período a "cerrado".
14. **Dado** un período con novedades pendientes de aprobación, **cuando** el usuario intenta cerrarlo, **entonces** el sistema rechaza el cierre e indica qué novedades pendientes lo impiden.
15. **Dado** un período sin novedades pendientes y con Trabajadores sin calcular (con contrato en el período y sin liquidación, o con liquidación desactualizada por una novedad aprobada o un cambio de contrato posterior al último cálculo), **cuando** el usuario intenta cerrarlo, **entonces** el sistema rechaza el cierre e indica qué Trabajadores lo impiden; un Trabajador sin contrato en el período no impide el cierre.
16. **Dado** un período cerrado, **cuando** cualquier usuario o proceso intenta modificar o recalcular una liquidación de ese período, **entonces** el sistema bloquea la operación e indica que el período está cerrado.
17. **Dado** un período cerrado, **cuando** se actualizan los indicadores (UF, UTM o tasas) para un período posterior, **entonces** las liquidaciones del período cerrado conservan exactamente los valores con que fueron calculadas.
18. **Dado** un usuario sin autorización (por ejemplo, un analista que intenta cerrar, o una jefatura que intenta consultar liquidaciones), **cuando** realiza esa operación, **entonces** el sistema la impide e indica que no tiene autorización.
19. **Dado** un período calculado con varios Trabajadores en la lista de la pantalla de cálculo, **cuando** el usuario selecciona un Trabajador, **entonces** su liquidación se despliega justo debajo de su fila; **y cuando** selecciona otro Trabajador, **entonces** la liquidación anterior se contrae y solo permanece desplegada la del Trabajador seleccionado.
20. **Dado** que un usuario con sesión identificada crea un período, ejecuta el cálculo, cierra un período o consulta una liquidación, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada y el registro afectado (regla transversal provista por la US6).

---

### Historia de Usuario 5 - Vista Explicativa e Impresión de Liquidaciones (Prioridad: P2)

**Como** Trabajador, analista de remuneraciones o administrador/a de RR.HH.,
**quiero** visualizar la liquidación línea por línea con su fórmula explicativa y contar con una vista lista para imprimir o guardar en PDF,
**para** asegurar absoluta transparencia en los montos pagados.

**Por qué esta prioridad**: La explicabilidad de los cálculos genera confianza y reduce drásticamente las consultas y reclamos internos. Aporta valor una vez que las liquidaciones ya se calculan, por lo que mejora la experiencia sin bloquear el flujo principal de gestión.

**Alcance**: incluye la vista explicativa por línea y la vista imprimible o en PDF de una liquidación. No incluye el cálculo ni el cierre del período (US4), y aplica, sin redefinirlo, el control de acceso a datos sensibles de la US6.

**Reglas de negocio**:

- El analista de remuneraciones y el administrador/a de RR.HH. pueden ver las liquidaciones de cualquier Trabajador; el Trabajador solo puede ver las suyas y solo las de períodos cerrados; la jefatura no accede a liquidaciones.
- Cada línea de la liquidación muestra su base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal con el mes/año del conjunto aplicado; el monto explicado coincide con el de la línea.
- Si una línea no dispone de fórmula o parámetro legal asociado, se muestra igualmente e indica claramente esa carencia.
- La liquidación de un período cerrado se explica con los valores congelados del período; la de un período abierto o calculado se explica con los parámetros del período y se marca visiblemente como "borrador", también en la vista imprimible.
- La vista imprimible no incluye menús, botones de edición ni controles de navegación, y muestra los datos sensibles solo a los roles autorizados. El comprobante imprimible incluye la identificación del Trabajador, el período, las líneas con sus montos, los totales, el líquido a pagar y la marca de "borrador" cuando corresponda. El cargo del Trabajador DEBE aparecer una sola vez; el departamento y el centro de costo solo se muestran cuando tienen un valor propio y distinto del cargo, sin repetirlo por defecto. El botón "Imprimir / Guardar en PDF" DEBE permitir guardar el comprobante como PDF y el documento resultante DEBE reproducir exactamente la misma información que la vista "Ver liquidación": cada línea con su base de cálculo, tasa o factor, fórmula y parámetro legal con mes/año, además de montos, totales, líquido a pagar y explicaciones. No DEBE añadir ni omitir contenido respecto de "Ver liquidación"; la única diferencia permitida es la ausencia de menús, botones y controles de navegación y el ajuste de maquetación al papel (FR-046).
- Consultar, explicar o imprimir una liquidación no modifica su contenido.
- En la pantalla de cálculo de la US4, la liquidación de un Trabajador se despliega con sus líneas y explicaciones justo debajo de la fila del Trabajador seleccionado; al seleccionar otro Trabajador se contrae la anterior, sin que ello modifique ninguna liquidación. En la barra superior del Trabajador solo se muestran las pestañas "Resumen" y "Liquidaciones": en "Resumen" aparecen únicamente los datos de su propio contrato; en "Liquidaciones" el Trabajador elige un período cerrado y ve su liquidación, y solo al pulsar "Ver liquidación" se le despliega justo debajo con todo el detalle de líneas y explicaciones. Esta regla aplica a todos los roles autorizados: al entrar a la pestaña "Liquidaciones" o al cambiar el período seleccionado no se muestra ningún detalle calculado ni ninguna acción de ciclo de vida; el detalle y sus acciones aparecen solo tras pulsar "Ver liquidación" en la fila elegida, se contraen al seleccionar otra liquidación y se limpian al cambiar de período (FR-115).

**Prueba Independiente**: Con liquidaciones calculadas como datos semilla, al seleccionar cualquier línea el sistema despliega el desglose y el parámetro legal utilizado; al imprimir se obtiene un comprobante limpio y legible, y un Trabajador solo accede a sus propias liquidaciones de períodos cerrados.

**Escenarios de Aceptación**:

1. **Dado** una liquidación (en borrador o cerrada), **cuando** el usuario selecciona una línea (p. ej., gratificación o impuesto), **entonces** se muestra la base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal con el mes/año del conjunto aplicado, y el monto explicado coincide con el de la línea.
2. **Dado** una línea sin fórmula o parámetro legal asociado, **cuando** el usuario la consulta, **entonces** la línea se muestra e indica claramente que no dispone de fórmula o parámetro.
3. **Dado** una liquidación de un período cerrado, **cuando** el usuario consulta una línea, **entonces** la explicación muestra los valores congelados del período y no los parámetros vigentes actuales.
4. **Dado** una liquidación en borrador, **cuando** el usuario la consulta o la imprime, **entonces** se marca visiblemente como "borrador".
5. **Dado** que se requiere entregar el comprobante, **cuando** el usuario presiona "Imprimir / Guardar en PDF", **entonces** se presenta un formato limpio adaptado para papel o PDF, sin menús, botones de edición ni controles de navegación, que reproduce exactamente la información de la vista "Ver liquidación" —identificación del Trabajador, período, líneas con base, tasa o factor, fórmula y parámetro legal con mes/año, montos, totales, líquido a pagar, explicaciones y marca de "borrador" cuando corresponda—, sin añadir ni omitir contenido.
6. **Dado** un Trabajador, **cuando** intenta ver una liquidación que no es suya o la de un período que no está cerrado, **entonces** el sistema lo impide e indica que no tiene autorización.
7. **Dado** una jefatura, **cuando** intenta acceder a una liquidación, **entonces** el sistema lo impide e indica que no tiene autorización.
8. **Dado** un período calculado con liquidaciones en la lista de la pantalla de cálculo, **cuando** el usuario selecciona un Trabajador, **entonces** su liquidación se despliega justo debajo de su fila con las líneas y sus explicaciones; **y cuando** selecciona otro Trabajador, **entonces** la liquidación anterior se contrae y solo se muestra la del Trabajador seleccionado, sin modificar su contenido.
9. **Dado** un Trabajador autenticado que solo ve las pestañas "Resumen" y "Liquidaciones" en la barra superior, **cuando** abre "Resumen", **entonces** aparecen únicamente los datos de su propio contrato; **cuando** abre "Liquidaciones" y selecciona un período cerrado, **entonces** ve su propia liquidación sin desplegar el detalle; **y cuando** pulsa "Ver liquidación", **entonces** ese detalle con líneas y explicaciones se despliega justo debajo, sin datos de otros Trabajadores ni de períodos abiertos o calculados.
10. **Dado** un administrador/a o analista autenticado, **cuando** consulta las liquidaciones de un período con varios Trabajadores, **entonces** ve las liquidaciones de todos los Trabajadores; **cuando** pulsa "Ver liquidación" en uno, **entonces** el detalle con líneas y explicaciones se despliega justo debajo de la fila de ese Trabajador y no al final del listado; **y cuando** selecciona otro Trabajador y pulsa "Ver liquidación", **entonces** se contrae el detalle anterior y se despliega bajo el nuevo Trabajador seleccionado, sin modificar ninguna liquidación.
11. **Dado** un usuario autorizado que entra a la pestaña "Liquidaciones" o cambia el período seleccionado, **cuando** aún no ha pulsado "Ver liquidación", **entonces** no se muestra ningún detalle calculado de liquidación, ni líneas, ni totales, ni botones de aprobación, pago o anulación; **y cuando** pulsa "Ver liquidación" en una fila, **entonces** ese detalle y sus acciones aparecen justo debajo de esa persona, y **cuando** cambia de período, **entonces** el detalle vuelve a ocultarse (FR-115).
12. **Dado** un usuario autorizado que tiene abierta una liquidación con "Ver liquidación", **cuando** pulsa "Imprimir / Guardar en PDF" y guarda el archivo, **entonces** el PDF contiene exactamente lo mismo que la vista "Ver liquidación" —mismas líneas, bases, tasas o factores, fórmulas, parámetros legales con mes/año, montos, totales, líquido, explicaciones y marca de "borrador" si aplica—, sin información adicional ni omitida, sin menús ni botones, y sin modificar la liquidación (FR-046 y FR-050). El detalle se extrae temporalmente de la fila seleccionada hacia una hoja de impresión, de modo que no quede oculto por el listado, y vuelve a su posición original al cerrar el diálogo; la impresión comienza en la primera página con el comprobante, sin hojas en blanco previas, y el cargo del Trabajador aparece una sola vez, sin repetirse como departamento.
13. **Dado** que un usuario con sesión identificada consulta, explica o imprime una liquidación, **cuando** la operación se completa, **entonces** la bitácora de auditoría registra al menos el usuario y su rol, la fecha y hora, la acción realizada y el registro afectado (regla transversal provista por la US6).

---

### Historia de Usuario 6 - Seguridad, Roles y Gobierno de Datos (Prioridad: P1)

**Como** administrador/a de RR.HH.,
**quiero** restringir el acceso a los datos sensibles (sueldos, liquidaciones y licencias médicas) según el rol de la sesión autenticada demo y registrar una bitácora de auditoría,
**para** cumplir estrictamente con la normativa de protección de datos (Ley 21.719).

**Por qué esta prioridad**: Protege la privacidad de la información personal y asegura la trazabilidad de cualquier modificación.

**Alcance**: incluye roles, permisos por rol, protección de datos sensibles y bitácora. La autenticación es **simulada** (ingreso por rol y clave demo, sin backend). Las demás historias aplican estas reglas sin redefinirlas.

**Reglas de negocio**:

- El acceso requiere **inicio de sesión con rol y clave demo** (FR-051). Sin sesión autenticada no se muestran ni operan datos. Roles válidos: administrador/a de RR.HH., analista de remuneraciones, jefatura y Trabajador. Si las credenciales no son válidas, el acceso se rechaza con mensaje genérico (sin revelar detalles).
- El campo de contraseña del inicio de sesión incluye un control con ícono de ojo para mostrar u ocultar lo escrito. Por defecto la contraseña está oculta; el control no altera el valor, es operable con teclado y tiene etiqueta accesible "Mostrar contraseña" / "Ocultar contraseña". Con el control activado se puede seguir escribiendo en el campo y cada carácter nuevo queda visible de inmediato, conservando el foco y la posición del cursor; al desactivarlo la contraseña vuelve a ocultarse sin alterar el valor. El campo también vuelve a ocultarse al cerrar sesión o tras un intento rechazado. La contraseña nunca se registra ni se muestra fuera de ese campo, ni siquiera en la bitácora de auditoría (FR-113).
- Tras autenticarse como **jefatura**, el sistema debe permitir elegir el **Trabajador representado** (activo, del equipo según reglas del sistema) cuando sea necesario para operar novedades/equipo; si no se selecciona uno válido, no se permiten operaciones que dependan de ese alcance. Tras autenticarse como **Trabajador**, debe permitir elegir/confirmar el **Trabajador representado** (activo o desvinculado) para acceder solo a sus liquidaciones de períodos cerrados; si no se selecciona uno, no se muestran liquidaciones. La pantalla donde se elige al Trabajador representado DEBE presentarse extendida y centrada en el área principal, con el selector a todo el ancho disponible y la acción "Continuar" alineada a la derecha, sin limitarla a un recuadro estrecho (FR-110).
- Datos sensibles: sueldo base y condiciones salariales de contratos, liquidaciones y licencias médicas (sin diagnóstico).
- **Ocultamiento proactivo (UI):** en navegación, listados, detalles, búsquedas y comprobantes imprimibles se ocultan o deshabilitan las secciones/acciones no permitidas al rol. Ante **accesos directos o acciones prohibidas**, el sistema informa denegación **sin revelar contenido protegido** y el intento se audita cuando aplique.
- Permisos: administrador/a accede a US1–US5,7–12 según matriz, cierra períodos, consulta bitácora, exporta/importa respaldo y carga parámetros; analista gestiona fichas, catálogos, contratos, registra novedades, crea períodos, ejecuta cálculo y consulta liquidaciones, pero no cierra, no aprueba/rechaza novedades, no bitácora ni respaldo; jefatura ve solo datos básicos de su equipo y gestiona novedades de su equipo (aprueba/rechaza las que no registró), sin contratos, sueldos base ni liquidaciones de otros; Trabajador solo sus liquidaciones de períodos cerrados (históricas incluidas).
- El panel principal muestra a cada rol solo avisos y alertas de datos a los que tiene acceso: administrador/a y analista ven las alertas de contratos de todos los Trabajadores; la jefatura no ve alertas de contratos; el Trabajador ve solo el resumen de su propio contrato (tipo, fecha de inicio, fecha de término si es a plazo fijo, días restantes y estado, sin sueldo base), también si es indefinido pero sin alerta de vencimiento. Ningún rol ve avisos derivados de datos sensibles a los que no tiene acceso (FR-114).
- **Cambio de rol:** en esta versión se realiza **cerrando sesión e iniciando sesión** con otra credencial demo (no cambio en caliente). Debe existir **botón "Cerrar sesión"** visible en el encabezado.
- Bitácora append-only: registra consultas/cambios sensibles, denegaciones relevantes, exportación/importación de respaldo y eventos de sesión autenticada cuando se definan; retención según política vigente. Si no puede escribirse, la operación sensible no se completa. Importación de respaldo no elimina/sobrescribe registros previos de bitácora.
- En caso de credenciales inválidas o sesión inválida, el sistema no expone datos.

**Prueba Independiente**: Login demo por rol, selección de representado para jefatura/trabajador, verificación de ocultamiento en UI y denegación en accesos directos, y registros en bitácora.

**Escenarios de Aceptación**:

1. **Dado** credenciales demo válidas de jefatura, **cuando** el usuario inicia sesión y selecciona un Trabajador representado de su equipo, **entonces** ve datos básicos y gestiona novedades de ese ámbito sin ver contratos/sueldos/liquidaciones ajenas al permiso.
2. **Dado** login como jefatura sin seleccionar representado válido cuando se requiere, **entonces** no se permiten operaciones de novedades/equipo hasta completar la selección.
3. **Dado** login como Trabajador sin seleccionar representado, **entonces** no se muestran liquidaciones.
4. **Dado** un Trabajador desvinculado representado, **cuando** accede, **entonces** solo consulta sus liquidaciones de períodos cerrados.
5. **Dado** acceso sin sesión autenticada, **cuando** intenta usar el sistema, **entonces** se muestra pantalla/login y no se exponen datos.
6. **Dado** un analista, **cuando** intenta aprobar novedad, consultar bitácora o exportar respaldo, **entonces** se deniega (oculto o acción bloqueada según UI) sin revelar contenido protegido.
7. **Dado** un usuario sin autorización sobre una liquidación, **cuando** accede por URL/ruta directa, **entonces** se deniega sin mostrar contenido.
8. **Dado** el usuario autenticado, **cuando** pulsa "Cerrar sesión", **entonces** la sesión se limpia y se requiere nuevo ingreso.
9. **Dado** administrador/a, **cuando** consulta bitácora, **entonces** ve registros con usuario/rol/fecha/acción/registro y no puede editarlos ni eliminarlos.
10. **Dado** una operación sensible sin posibilidad de escribir bitácora, **entonces** la operación no se completa.
11. **Dado** un acceso denegado, **cuando** ocurre, **entonces** queda registrado en bitácora si corresponde al flujo definido.
12. **Dado** el formulario de inicio de sesión, **cuando** se muestra, **entonces** la contraseña aparece oculta y el control con ícono de ojo tiene la etiqueta accesible "Mostrar contraseña"; **cuando** se activa con el teclado, **entonces** la contraseña se muestra, la etiqueta cambia a "Ocultar contraseña" y el valor escrito no se modifica; **y cuando** se sigue escribiendo con el control activado, **entonces** el campo conserva el foco y la posición del cursor y cada carácter nuevo se ve de inmediato; **y cuando** se activa de nuevo, **entonces** vuelve a ocultarse sin alterar el valor.
13. **Dado** una contraseña visible en el campo de inicio de sesión, **cuando** el usuario cierra sesión o un intento de ingreso es rechazado, **entonces** el campo vuelve a mostrarse oculto por defecto.
14. **Dado** un usuario que escribe una contraseña, **cuando** inicia sesión, consulta la bitácora o se exporta un respaldo, **entonces** la contraseña no aparece en ningún listado, mensaje, comprobante ni registro de auditoría fuera del propio campo.
15. **Dado** contratos próximos a vencer, **cuando** un administrador/a o un analista abre el panel principal, **entonces** ve todas las alertas de contratos; **y cuando** lo hace una jefatura, **entonces** no ve ninguna alerta de contratos.
16. **Dado** un Trabajador con contrato vigente, **cuando** abre el panel principal, **entonces** ve solo dos pestañas en la barra superior, "Resumen" y "Liquidaciones"; en "Resumen" aparecen únicamente los datos de su propio contrato con tipo, fechas, días restantes y estado, sin sueldo base ni alertas de otros Trabajadores; esos datos se presentan en una tarjeta atractiva con el título en negrita, el estado destacado como distintivo y la información organizada en una tabla compacta de etiquetas en negrita; si su contrato es indefinido, ve el resumen sin alerta de vencimiento; y en "Liquidaciones" solo puede ver sus propias liquidaciones de períodos cerrados.
17. **Dado** un usuario que ingresa como Trabajador y debe elegir a qué Trabajador representado corresponde la sesión, **cuando** se muestra la pantalla de selección, **entonces** el selector y la acción "Continuar" aparecen extendidos y centrados en el área principal, ocupando todo el ancho disponible, sin quedar reducidos a un recuadro estrecho en una esquina (FR-110).
18. **Dado** el conjunto de datos de demostración, **cuando** un Trabajador selecciona su propia ficha y abre "Liquidaciones", **entonces** ve al menos una liquidación pagada correspondiente al período cerrado `2026-08`, sin necesidad de cálculos ni cierres manuales previos; las instalaciones previas reciben este dato de forma automática al iniciar la aplicación (US5, US6).
19. **Dado** cambios/consultas sensibles completadas, **entonces** se genera registro automático en bitácora (según reglas existentes).

---

### Historia de Usuario 7 - Vacaciones: Solicitud, Aprobación y Saldo (Prioridad: P2)

**Como** Trabajador, jefatura o administrador/a de RR.HH.,
**quiero** solicitar días de vacaciones, aprobarlos o rechazarlos y consultar el saldo disponible de cada Trabajador,
**para** planificar los descansos del equipo y cumplir el feriado legal sin llevar el control en planillas aparte.

**Por qué esta prioridad**: El feriado anual es un derecho que la empresa debe controlar y que genera reclamos cuando no se lleva bien. No bloquea el cálculo de sueldos, porque las vacaciones no descuentan remuneración, por lo que puede construirse después del flujo principal.

**Alcance**: incluye el saldo de vacaciones por Trabajador, las solicitudes, su aprobación o rechazo y el calendario de feriados. No incluye las novedades de horas extra, licencias y ausencias (US3), ni el pago de vacaciones proporcionales al término de la relación laboral, y aplica, sin redefinirlas, las reglas transversales de roles, datos sensibles y bitácora de la US6.

**Reglas de negocio**:

- Cada Trabajador acumula 15 días hábiles de feriado por cada año de servicio, devengados de forma proporcional: 1,25 días hábiles por cada mes completo trabajado desde su fecha de ingreso (art. 67 del Código del Trabajo).
- Los días de vacaciones se cuentan en días hábiles: de lunes a viernes, sin contar los feriados registrados en el calendario de feriados (art. 69 del Código del Trabajo).
- El saldo disponible es igual a los días devengados menos los días de solicitudes aprobadas. Para validar una solicitud se usa el saldo proyectado a su fecha de inicio: el saldo de hoy más lo que se devengará por cada mes completo hasta esa fecha, sin superar el máximo de 30 días hábiles. La pantalla muestra el saldo de hoy y, al elegir una fecha de inicio, el saldo proyectado a esa fecha.
- Las solicitudes se expresan en días hábiles completos; no se admiten medios días. El saldo se muestra con dos decimales (p. ej., 3,75) y solo puede solicitarse su parte entera (3 días).
- El saldo acumulado no puede superar dos períodos anuales (30 días hábiles) (art. 70 del Código del Trabajo); al alcanzar ese máximo, el sistema muestra una alerta en el panel principal.
- El Trabajador solicita sus propias vacaciones; la jefatura y el administrador/a de RR.HH. pueden registrar una solicitud en nombre de un Trabajador de su ámbito. Toda solicitud nueva queda en estado "Pendiente".
- Aprueba o rechaza la jefatura directa del Trabajador; si no tiene jefatura directa, lo hace el administrador/a de RR.HH. Nadie puede aprobar ni rechazar una solicitud que haya registrado. Un rechazo requiere un motivo.
- Una solicitud "Pendiente" puede editarse o anularse; una "Aprobada" solo puede anularse antes de su fecha de inicio, y entonces los días vuelven al saldo.
- Las vacaciones no pueden superponerse con otra solicitud de vacaciones aprobada o pendiente ni con licencias o ausencias registradas (US3) del mismo Trabajador.
- Solo un Trabajador activo con contrato vigente en las fechas solicitadas puede tener vacaciones. Al desvincular a un Trabajador, su saldo de vacaciones queda congelado para consulta histórica, sin pago ni ejercicio en esta versión.
- Las vacaciones aprobadas no descuentan días en la liquidación: el Trabajador recibe su remuneración íntegra (art. 71 del Código del Trabajo).
- El administrador/a de RR.HH. mantiene el calendario de feriados (fecha y nombre); un feriado no puede repetirse en la misma fecha. Si se agrega un feriado dentro del rango de una solicitud aprobada, el sistema recalcula sus días hábiles, ajusta el saldo descontado en consecuencia y registra el cambio en la bitácora.
- Las vacaciones se gestionan en su propia pantalla de la barra lateral, con el listado de solicitudes, las pendientes de aprobación y el calendario de feriados; la ficha del Trabajador muestra un resumen (saldo disponible y próxima solicitud) con un enlace a esa pantalla filtrada por la persona.

**Prueba Independiente**: Con Trabajadores, contratos y feriados precargados como datos semilla, un Trabajador ve su saldo, solicita días, su jefatura los aprueba y el saldo se descuenta; una solicitud que supera el saldo o que se superpone con una licencia es rechazada. No requiere ejecutar el cálculo de planilla.

**Escenarios de Aceptación**:

1. **Dado** un Trabajador que ingresó hace 8 meses completos, **cuando** consulta su saldo, **entonces** ve 10 días hábiles devengados, los días aprobados y el saldo disponible.
2. **Dado** un Trabajador con saldo suficiente, **cuando** solicita vacaciones indicando fecha de inicio y de término, **entonces** el sistema calcula los días hábiles excluyendo sábados, domingos y feriados del calendario, y registra la solicitud en estado "Pendiente".
3. **Dado** una solicitud cuyos días hábiles superan el saldo disponible, **cuando** el Trabajador intenta registrarla, **entonces** el sistema la rechaza e indica el saldo disponible.
4. **Dado** un Trabajador con una licencia médica registrada, **cuando** solicita vacaciones que se superponen con esas fechas, **entonces** el sistema la rechaza e indica la novedad con la que se superpone.
5. **Dado** una solicitud "Pendiente", **cuando** la jefatura directa la aprueba, **entonces** pasa a "Aprobada" y los días se descuentan del saldo.
6. **Dado** una solicitud "Pendiente", **cuando** la jefatura intenta rechazarla sin motivo, **entonces** el sistema impide el rechazo y señala que el motivo es obligatorio.
7. **Dado** una solicitud registrada por una jefatura, **cuando** esa misma jefatura intenta aprobarla, **entonces** el sistema lo impide e indica que no tiene autorización.
8. **Dado** una solicitud "Aprobada" cuya fecha de inicio aún no llega, **cuando** el Trabajador o el administrador/a la anula, **entonces** pasa a "anulada" y los días vuelven al saldo; **y dado** que la fecha de inicio ya pasó, **entonces** el sistema impide anularla.
9. **Dado** un Trabajador con 30 días hábiles de saldo acumulado, **cuando** el administrador/a abre el panel principal, **entonces** ve una alerta de feriado acumulado al máximo para ese Trabajador.
10. **Dado** un período con vacaciones aprobadas, **cuando** se ejecuta el cálculo de planilla (US4), **entonces** la liquidación no descuenta días por esas vacaciones.
11. **Dado** que se crea, aprueba, rechaza o anula una solicitud, o se modifica el calendario de feriados, **cuando** la operación se completa, **entonces** la bitácora de auditoría la registra (regla transversal provista por la US6).
12. **Dado** un Trabajador con un saldo disponible de 3,75 días hábiles, **cuando** solicita 4 días hábiles, **entonces** el sistema la rechaza e indica que puede solicitar como máximo 3 días completos.
13. **Dado** un Trabajador con 2 días hábiles de saldo hoy, **cuando** solicita 4 días hábiles que comienzan dentro de 2 meses completos, **entonces** el sistema acepta la solicitud porque su saldo proyectado a esa fecha es de 4,5 días.

---
### Historia de Usuario 8 - Cargas Familiares y Asignación Familiar (Prioridad: P2)

**Como** analista de remuneraciones o administrador/a de RR.HH.,
**quiero** registrar las cargas familiares reconocidas de cada Trabajador y que la planilla pague automáticamente la asignación familiar según su tramo de ingreso,
**para** cumplir con un beneficio legal que hoy se calcula a mano y suele olvidarse.

**Por qué esta prioridad**: La asignación familiar es un haber legal que reciben muchos trabajadores de menores ingresos; omitirla genera pagos incorrectos. Depende de que el cálculo de la US4 ya funcione.

**Alcance**: incluye el registro de cargas familiares, la tabla de tramos de asignación familiar y la línea de asignación familiar en la liquidación. No incluye el resto del motor de cálculo (US4), ni los trámites ante la caja de compensación o el IPS.

**Reglas de negocio**:

- Una carga familiar tiene: Trabajador, nombre, RUT válido (módulo 11), parentesco (hijo/a, cónyuge o conviviente civil, madre/padre, otro), fecha de nacimiento, tipo de carga (simple, maternal o de invalidez), número y fecha de la resolución de reconocimiento, y fecha de inicio y de término de vigencia.
- El número y la fecha de la resolución de reconocimiento son obligatorios: sin ellos la carga no se paga.
- Un mismo RUT de carga no puede estar vigente para dos Trabajadores de la empresa al mismo tiempo, ni repetirse vigente para el mismo Trabajador.
- Un hijo/a deja de ser carga a los 18 años, o a los 24 si se registra como estudiante; el sistema avisa 30 días antes de que una carga cumpla la edad límite. La carga de invalidez no tiene límite de edad.
- El tramo de asignación familiar del Trabajador (A, B, C o D) se determina comparando su remuneración imponible del período con la tabla de tramos del conjunto de parámetros legales del mes, que es obligatoria (US12); el tope de cada tramo es inclusivo, de modo que una remuneración igual al tope de un tramo queda en ese tramo, y el tramo D no recibe monto. (Simplificación de esta versión: la ley usa el ingreso promedio del semestre anterior.)
- El monto mensual es igual al monto por carga del tramo multiplicado por el número de cargas vigentes en el período; una carga de invalidez cuenta doble.
- La asignación familiar se agrega a la liquidación como haber no imponible y no tributable, con la línea `ASIG_FAMILIAR`, mostrando el tramo, el número de cargas y el monto por carga en su explicación (US5).
- Las cargas son datos personales de terceros: solo el administrador/a de RR.HH. y el analista de remuneraciones pueden verlas; la jefatura no accede a ellas, y el Trabajador ve solo las suyas.
- Las cargas no se eliminan: se terminan con una fecha de término de vigencia y se conservan en el historial.
- Las cargas familiares se gestionan directamente en la ficha del Trabajador (donde aparece el trabajador), sin un apartado separado; la ficha muestra, solo a los roles autorizados a ver cargas, un resumen (número de cargas vigentes y próximo aviso de edad límite) y permite registrar/consultar las cargas según permisos.

**Prueba Independiente**: Con un Trabajador de tramo A y otro de tramo D precargados, el analista registra dos cargas al primero (una de invalidez) y una al segundo; al calcular el período, solo el primero recibe la asignación familiar por 3 cargas y el segundo no recibe monto.

**Escenarios de Aceptación**:

1. **Dado** un Trabajador activo, **cuando** el analista registra una carga con todos los datos obligatorios y un RUT válido, **entonces** la carga queda vigente y aparece en la ficha de cargas del Trabajador.
2. **Dado** una carga sin número o sin fecha de resolución de reconocimiento, **cuando** el analista intenta guardarla, **entonces** el sistema la rechaza y señala el campo que falta.
3. **Dado** una carga vigente para un Trabajador, **cuando** se intenta registrar el mismo RUT como carga vigente de otro Trabajador, **entonces** el sistema lo rechaza e indica que la carga ya está reconocida.
4. **Dado** un Trabajador cuya remuneración imponible queda en el tramo A y tiene dos cargas simples vigentes, **cuando** se ejecuta el cálculo, **entonces** su liquidación incluye la línea de asignación familiar por 2 veces el monto del tramo A, como haber no imponible y no tributable.
5. **Dado** un Trabajador con una carga de invalidez, **cuando** se ejecuta el cálculo, **entonces** esa carga cuenta doble en el monto de la asignación.
6. **Dado** un Trabajador cuya remuneración imponible queda en el tramo D, **cuando** se ejecuta el cálculo, **entonces** su liquidación no incluye monto de asignación familiar aunque tenga cargas vigentes.
7. **Dado** un hijo/a registrado como carga que cumplirá 18 años en menos de 30 días y no está marcado como estudiante, **cuando** el analista abre el panel principal, **entonces** ve un aviso con el nombre del Trabajador y la fecha en que la carga deja de estar vigente.
8. **Dado** la línea de asignación familiar de una liquidación, **cuando** el usuario consulta su explicación (US5), **entonces** ve el tramo aplicado, el número de cargas, el monto por carga y la vigencia del parámetro usado.
9. **Dado** una jefatura, **cuando** intenta ver las cargas de un Trabajador de su equipo, **entonces** el sistema lo impide e indica que no tiene autorización.
10. **Dado** que se registra, modifica o termina una carga, **cuando** la operación se completa, **entonces** la bitácora de auditoría la registra (regla transversal de la US6).
11. **Dado** un Trabajador cuya remuneración imponible es exactamente igual al tope del tramo A, **cuando** se ejecuta el cálculo, **entonces** se le aplica el monto por carga del tramo A.

---

### Historia de Usuario 9 - Simulador de Sueldo Líquido y Bruto (Prioridad: P3)

**Como** administrador/a de RR.HH., analista de remuneraciones o Trabajador,
**quiero** simular cuánto sueldo líquido resulta de un sueldo bruto, o qué sueldo base se necesita para pagar un líquido determinado,
**para** preparar ofertas laborales y responder consultas sin crear fichas, contratos ni liquidaciones de prueba.

**Por qué esta prioridad**: Es una herramienta de apoyo muy útil en la práctica (ofertas laborales, negociaciones, consultas de trabajadores), pero no es necesaria para pagar los sueldos del mes.

**Alcance**: incluye el cálculo de líquido a partir del bruto y de bruto a partir del líquido, con su desglose. No guarda datos, no crea registros y no reemplaza el cálculo oficial de la US4.

**Reglas de negocio**:

- El simulador pide: mes de referencia, sueldo base (o líquido deseado), tipo de contrato, jornada semanal, modalidad de gratificación, AFP, sistema de salud (FONASA o Isapre con valor del plan en UF) y, de forma opcional, horas extra, bonos imponibles, colación y movilización.
- Usa los parámetros legales versionados vigentes en el mes de referencia y las mismas reglas de cálculo y redondeo de la US4, de modo que, para los mismos datos, el resultado coincide al peso con una liquidación calculada.
- El cálculo de bruto a partir del líquido busca el menor sueldo base cuyo líquido iguala o supera el líquido deseado, con una diferencia máxima de 1 peso.
- Si el sueldo base necesario es menor que el ingreso mínimo vigente, o si la jornada supera el máximo legal, el simulador lo informa y no entrega resultado.
- El resultado muestra el desglose completo: haberes imponibles y no imponibles, AFP, salud, seguro de cesantía, impuesto único, líquido a pagar, aportes del empleador y costo empleador.
- Si faltan parámetros legales del mes de referencia, el simulador indica cuáles faltan y no calcula.
- Toda simulación se marca visiblemente como "Simulación referencial: no constituye una liquidación".
- La simulación no lee ni guarda datos de Trabajadores, por lo que no se registra en la bitácora. Está disponible para el administrador/a de RR.HH., el analista de remuneraciones y el Trabajador; la jefatura no accede.
- El usuario puede copiar el desglose como texto para pegarlo en una oferta o un correo.

**Prueba Independiente**: Con los parámetros semilla, el usuario ingresa los datos del caso de referencia de la US4 y obtiene el mismo líquido al peso; luego ingresa ese líquido en el modo inverso y obtiene el mismo sueldo base, con diferencia máxima de 1 peso. No requiere fichas, contratos ni períodos.

**Escenarios de Aceptación**:

1. **Dado** los datos del caso de referencia de la US4, **cuando** el usuario simula de bruto a líquido, **entonces** cada línea y el líquido a pagar coinciden al peso con la liquidación de referencia.
2. **Dado** un líquido deseado, **cuando** el usuario simula de líquido a bruto, **entonces** el sistema entrega el sueldo base necesario y el desglose cuyo líquido difiere del deseado en 1 peso o menos.
3. **Dado** un líquido deseado que requiere un sueldo base inferior al ingreso mínimo vigente, **cuando** el usuario simula, **entonces** el sistema informa que el resultado sería inferior al ingreso mínimo y no entrega desglose.
4. **Dado** un mes de referencia sin parámetros legales cargados, **cuando** el usuario simula, **entonces** el sistema indica qué parámetros faltan y no calcula.
5. **Dado** un afiliado a Isapre con un plan de valor mayor al 7 % de su imponible, **cuando** simula, **entonces** el descuento de salud corresponde al valor del plan convertido con la UF del mes de referencia.
6. **Dado** una simulación terminada, **cuando** el usuario presiona "Copiar desglose", **entonces** el desglose queda en el portapapeles como texto con la marca de simulación referencial.
7. **Dado** que el usuario realiza varias simulaciones, **cuando** revisa los listados de Trabajadores, contratos y liquidaciones, **entonces** no se creó ni modificó ningún registro.
8. **Dado** una jefatura, **cuando** intenta abrir el simulador, **entonces** el sistema lo impide e indica que no tiene autorización.

---

### Historia de Usuario 10 - Reportes de Gestión y Equidad Salarial (Prioridad: P2)

**Como** administrador/a de RR.HH. o analista de remuneraciones,
**quiero** ver reportes del personal y de la planilla (dotación, costo por centro de costo, horas extra, ausentismo y brecha salarial de género por cargo),
**para** tomar decisiones con datos y detectar sesgos sin exponer información individual.

**Por qué esta prioridad**: Convierte los datos que el módulo ya registra en información útil para la gestión y para detectar desigualdades. Es de solo lectura, por lo que no arriesga los datos de las demás historias.

**Alcance**: incluye los reportes, sus filtros, los gráficos y un campo opcional de género en la ficha, usado solo en reportes agregados. No incluye exportar archivos (US11) ni modificar datos de ninguna otra historia.

**Reglas de negocio**:

- Los reportes se calculan sobre los períodos cerrados (US4); los períodos abiertos o calculados no se incluyen, para que las cifras no cambien después.
- **Dotación**: Trabajadores activos al último día del período, altas (ingresos) y bajas (desvinculaciones) del período, por departamento.
- **Costo de la planilla**: suma del costo empleador por centro de costo y por período, con la variación porcentual respecto del período anterior.
- **Horas extra**: total de horas extra aprobadas por departamento y período.
- **Ausentismo**: días de ausencia divididos por los días hábiles del período, por departamento. Las licencias médicas, las vacaciones y los permisos legales no se cuentan como ausentismo y se muestran por separado, para no castigar enfermedad ni maternidad.
- **Brecha salarial de género por cargo**: diferencia porcentual entre la mediana del sueldo base de cada género dentro de un mismo cargo. Si algún grupo del cargo tiene menos de 5 personas, el sistema oculta el resultado de ese cargo e indica que hay muy pocas personas para mostrarlo sin identificar a nadie.
- En el reporte de brecha, la comparación se calcula entre los grupos Femenino y Masculino; las personas con "No binario", "Prefiere no informar" o sin género registrado no entran en la comparación y se muestran solo como un conteo agregado por cargo, que se oculta si es menor a 5.
- El género es un campo opcional de la ficha (Femenino, Masculino, No binario, Prefiere no informar), clasificado como dato sensible; solo se usa en el reporte de brecha y nunca aparece en listados, búsquedas ni filtros de Trabajadores.
- Los reportes muestran solo totales y nunca datos de una persona identificable: cuando el equipo o departamento de una fila del reporte tiene menos de 5 personas, sus cifras se ocultan con un mensaje que explica que hay muy pocas personas para mostrarlas, para cualquier rol.
- El administrador/a de RR.HH. ve todos los reportes; el analista ve todos menos la brecha de género; la jefatura ve solo horas extra y ausentismo de su equipo, sin montos; el Trabajador no accede a reportes.
- Cada reporte puede filtrarse por rango de períodos y por departamento, y muestra un estado vacío explicativo cuando no hay períodos cerrados.
- Cada reporte se presenta como una tabla con las cifras y un gráfico de barras simple con los mismos datos; el gráfico tiene título y una descripción accesible, y la tabla permite leer los datos aunque el gráfico no se vea.

**Prueba Independiente**: Con datos semilla de tres períodos cerrados y Trabajadores de distintos cargos y géneros, el administrador/a ve la dotación, el costo por centro de costo y la brecha por cargo; un cargo con menos de 5 personas en algún grupo aparece oculto. No modifica ningún dato.

**Escenarios de Aceptación**:

1. **Dado** tres períodos cerrados, **cuando** el administrador/a abre el reporte de costo, **entonces** ve el costo empleador por centro de costo de cada período y la variación porcentual respecto del anterior.
2. **Dado** un período con altas y bajas, **cuando** el usuario abre el reporte de dotación, **entonces** ve los Trabajadores activos al cierre, las altas y las bajas por departamento.
3. **Dado** un período con licencias médicas y ausencias injustificadas, **cuando** el usuario abre el reporte de ausentismo, **entonces** el indicador considera solo las ausencias, y las licencias y vacaciones aparecen por separado.
4. **Dado** un cargo con 6 mujeres y 7 hombres con sueldo base registrado, **cuando** el administrador/a abre el reporte de brecha, **entonces** ve la mediana de cada grupo y la diferencia porcentual del cargo.
5. **Dado** un cargo con 3 mujeres y 10 hombres, **cuando** el administrador/a abre el reporte de brecha, **entonces** el resultado de ese cargo aparece oculto con el mensaje de que hay muy pocas personas para mostrarlo.
6. **Dado** un período abierto o calculado, **cuando** el usuario abre cualquier reporte, **entonces** ese período no se incluye en las cifras.
7. **Dado** una jefatura, **cuando** abre los reportes, **entonces** ve solo las horas extra y el ausentismo de su equipo, sin montos de dinero; **y cuando** intenta abrir el reporte de costo o de brecha, **entonces** el sistema lo impide.
8. **Dado** un analista de remuneraciones, **cuando** intenta abrir el reporte de brecha de género, **entonces** el sistema lo impide e indica que no tiene autorización.
9. **Dado** que no existen períodos cerrados, **cuando** el usuario abre los reportes, **entonces** ve un estado vacío que explica que los reportes se calculan sobre períodos cerrados.
10. **Dado** que el administrador/a consulta el reporte de brecha de género, **cuando** la consulta se completa, **entonces** la bitácora de auditoría registra la consulta de un dato sensible (regla transversal de la US6).
11. **Dado** un cargo con 6 mujeres, 7 hombres y 2 personas con "Prefiere no informar", **cuando** el administrador/a abre el reporte de brecha, **entonces** la brecha se calcula solo con las 13 personas de los grupos Femenino y Masculino, y el conteo de las otras 2 aparece oculto por ser menor a 5.
12. **Dado** una jefatura cuyo equipo tiene 3 personas, **cuando** abre el reporte de horas extra o de ausentismo, **entonces** las cifras de su equipo aparecen ocultas con el mensaje de que hay muy pocas personas para mostrarlas.

---

### Historia de Usuario 11 - Exportaciones Contables y de Pago (Prioridad: P2)

**Como** administrador/a de RR.HH.,
**quiero** exportar desde un período cerrado un resumen contable y una nómina de pago en CSV,
**para** entregar la información de remuneraciones a Contabilidad y Tesorería sin copiar datos manualmente.

**Por qué esta prioridad**: Cierra el ciclo de la planilla con los entregables que otros módulos del ERP necesitan, sin introducir integraciones externas ni cálculos nuevos.

**Alcance**: incluye los dos archivos CSV, su formato, las validaciones de datos de ficha y período, los permisos y el registro en bitácora. No incluye contabilización automática, envío por correo ni generación de archivos bancarios.

**Reglas de negocio**:

- Solo se exporta desde períodos cerrados; los estados Abierto y Calculado bloquean la acción.
- El resumen contable agrega montos por `cuentaContable` y centro de costo; la cuenta se obtiene del mapeo configurable por concepto de liquidación y el centro de costo de la ficha del Trabajador. Sus totales deben cuadrar con las liquidaciones del período.
- La nómina de pago incluye Trabajador, banco, cuenta, líquido a pagar y `fechaPago`. Banco y cuenta se toman de la ficha y se exigen antes de exportar; `fechaPago` es la fecha de pago ingresada obligatoriamente al cerrar el período (US4).
- Ambos CSV usan UTF-8 con BOM, separador `;`, encabezados sin acentos y nombres `resumen_contable_YYYYMM.csv` y `nomina_pago_YYYYMM.csv`.
- Solo el rol administrador/a de RR.HH. puede exportar; cada exportación queda registrada en la bitácora de auditoría.

**Prueba Independiente**: Con un período cerrado y datos semilla completos, el administrador/a descarga ambos CSV, verifica totales cuadrados y campos obligatorios, y confirma el registro en bitácora. Con un Trabajador sin banco o cuenta, la exportación se bloquea y no se genera ningún archivo.

**Escenarios de Aceptación**:

1. **Dado** un período cerrado con cuentas y centros de costo configurados, **cuando** el administrador/a exporta el resumen contable, **entonces** obtiene `resumen_contable_YYYYMM.csv` con totales que cuadran con las liquidaciones.
2. **Dado** un período cerrado con banco, cuenta y fecha de pago completos, **cuando** el administrador/a exporta la nómina, **entonces** obtiene `nomina_pago_YYYYMM.csv` con Trabajador, banco, cuenta, líquido y fecha de pago.
3. **Dado** un Trabajador sin banco o cuenta, **cuando** se intenta exportar la nómina, **entonces** el sistema bloquea la exportación, indica el dato faltante y no descarga archivos.
4. **Dado** un período Abierto o Calculado, **cuando** cualquier usuario intenta exportar, **entonces** el sistema lo impide.
5. **Dado** un analista, una jefatura o un Trabajador, **cuando** intenta exportar CSV, **entonces** el sistema lo impide sin revelar contenido.
6. **Dado** una exportación correcta, **cuando** se consulta la bitácora, **entonces** aparece la acción de exportación con el rol administrador/a y la marca de tiempo.

---

### Historia de Usuario 12 - Parámetros Legales (Prioridad: P1)

**Como** administrador/a de RR.HH.,
**quiero** cargar y bloquear conjuntos completos de parámetros legales por mes y año,
**para** que cada período use reglas oficiales trazables y no cambien después de haberse aplicado.

**Por qué esta prioridad**: Evita que cambios posteriores de UF, UTM, IMM, tasas o tramos alteren liquidaciones ya calculadas o cerradas.

**Alcance**: incluye la carga manual del conjunto completo, la validación de campos obligatorios, el bloqueo desde el primer uso y el congelamiento en liquidaciones. No incluye sincronización externa ni corrección de conjuntos ya usados.

**Reglas de negocio**:

- Los parámetros legales (UF, UTM, ingreso mínimo, jornada máxima, tasas, topes, tramos del impuesto único y tramos de asignación familiar) se versionan como un conjunto completo por mes y año; el administrador/a de RR.HH. los carga manualmente y el sistema exige todos los valores obligatorios antes de permitir crear un período o ejecutar un cálculo para ese mes.
- La carga se realiza en un formulario en pantalla con todos los valores del conjunto; la acción "Copiar mes anterior" lo rellena con el último conjunto cargado para modificar solo lo que cambió, y el formulario señala los campos obligatorios que faltan. Lo copiado no se guarda ni se usa hasta que el administrador/a confirma el conjunto.
- Cada período aplica íntegramente el conjunto de parámetros de su mes y año; al cerrarlo, esos valores quedan congelados en las liquidaciones y no se ven afectados por versiones posteriores.
- Un conjunto queda bloqueado para edición desde que un Período lo usa por primera vez, aunque el Período esté abierto o calculado; una corrección requiere cargar otro conjunto completo para un mes distinto.

**Prueba Independiente**: Se carga un conjunto completo, se crea un período y se intenta editar el conjunto; la edición se rechaza. Luego se cierra el período, se carga otro conjunto para otro mes y la liquidación cerrada conserva los valores originales.

**Escenarios de Aceptación**:

1. **Dado** un conjunto completo para un mes, **cuando** se crea un período, **entonces** el período queda asociado a ese conjunto.
2. **Dado** un conjunto incompleto, **cuando** se intenta crear o calcular un período, **entonces** el sistema indica qué parámetros faltan y no continúa.
3. **Dado** un conjunto ya usado por un Período Abierto o Calculado, **cuando** se intenta editarlo, **entonces** el sistema lo impide.
4. **Dado** un Período Cerrado, **cuando** se carga una versión posterior de parámetros, **entonces** sus liquidaciones conservan el snapshot original.
5. **Dado** un error detectado en un conjunto usado, **cuando** se carga la corrección, **entonces** debe hacerse como otro conjunto completo para un mes distinto y el conjunto original permanece intacto.
6. **Dado** un conjunto cargado para el mes anterior, **cuando** el administrador/a usa "Copiar mes anterior" en el formulario de un mes nuevo, cambia la UF y la UTM y confirma, **entonces** se guarda un conjunto completo para el mes nuevo con esos cambios y el conjunto anterior permanece intacto.

---

### Casos Límite

- Si se abre una pantalla mediante enlace profundo o recarga, el router restaura la vista y aplica los permisos vigentes.
- Si se usa el botón atrás del navegador, la vista mostrada es coherente con la ruta y los datos permanecen intactos.
- Si se navega fuera de un formulario con cambios sin guardar, el sistema solicita confirmación antes de descartarlos.
- Si la ventana es estrecha, la barra lateral se contrae a iconos con etiquetas accesibles.
- Si una línea manual no tiene fórmula, el sistema la muestra indicando “sin fórmula” y el motivo registrado.
- Si una línea referencia un parámetro que no estaba vigente en el período, el sistema muestra una advertencia y no lo presenta como valor vigente.
- Si una liquidación está en borrador o no calculada, el desglose se marca visiblemente como borrador y no se presenta como definitivo.
- Si faltan datos de identificación del Trabajador o de la empresa emisora, el sistema bloquea la impresión e indica los datos ausentes.
- Si los valores del desglose están redondeados, los totales se obtienen de las líneas redondeadas y cuadran con la liquidación.
- Si una liquidación supera el espacio de una página, el comprobante se adapta a un máximo de dos páginas o bloquea la impresión con un mensaje.
- Si se cancela el diálogo de impresión o se guarda como PDF, el contenido de la liquidación no se modifica.
- Si no hay rol asignado o el rol no es reconocido, el sistema no concede acceso a datos protegidos.
- Si se intenta acceder a un dato sensible mediante enlace directo o vía no autorizada, el sistema deniega el acceso sin revelar contenido.
- Si cambia el rol durante una sesión activa, los permisos se aplican de inmediato y el cambio queda auditado.
- Si se selecciona Jefatura o Trabajador sin elegir el representado, el sistema no muestra datos ajenos y solicita la selección.
- Si una novedad cruza meses y alguno de los períodos no está activo, la operación completa se rechaza sin registros parciales.
- Si se crea un período sin parámetros legales obligatorios, el sistema rechaza la creación e indica los parámetros faltantes.
- Si se importa un respaldo JSON, la bitácora existente se fusiona por identificador sin sobrescribirla ni duplicarla.
- Si la bitácora no puede escribirse, la operación sensible no se completa.
- Si se intenta editar o eliminar un registro de auditoría, el sistema lo rechaza.
- Si un usuario autorizado consulta datos sensibles fuera de su equipo, el sistema lo deniega y registra el intento.
- Si la jefatura intenta imprimir o exportar una liquidación, el sistema lo deniega sin revelar montos.
- Si un acceso es denegado o fallido, el sistema lo registra en la bitácora de auditoría.
- Si una solicitud de vacaciones aprobada incluye un feriado agregado al calendario después de aprobarla, el sistema recalcula sus días hábiles, ajusta el saldo descontado y registra el cambio en la bitácora.
- El saldo de vacaciones de un Trabajador desvinculado queda congelado para consulta histórica, sin pago ni ejercicio en esta versión.
- Un conjunto de parámetros legales usado por un Período no se modifica; las correcciones se cargan como otro conjunto completo para un mes distinto.
- El resumen contable usa el centro de costo de la ficha del Trabajador y cuentas configuradas por concepto de liquidación.
- Si faltan el banco o la cuenta de algún Trabajador, la exportación de nómina se bloquea e indica los datos faltantes; la fecha de pago no puede faltar porque es obligatoria al cerrar el período.
- Si la remuneración imponible de un Trabajador es exactamente igual al tope de un tramo de asignación familiar, se le aplica ese tramo (tope inclusivo).

## Requisitos *(obligatorio)*

### Requisitos Funcionales

> La numeración comienza en FR-040: FR-001–FR-039 correspondían al módulo base genérico, retirado del alcance.

- **FR-040**: El sistema DEBE presentar cada liquidación (en borrador o cerrada) como una lista de líneas con su concepto y monto, permitiendo seleccionar cada línea para ver su explicación (Historia de Usuario 5).
- **FR-041**: Al seleccionar una línea, el sistema DEBE mostrar la base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal con el mes/año del conjunto aplicado, y el monto explicado DEBE coincidir con el de la línea (Historia de Usuario 5).
- **FR-042**: Si una línea no dispone de fórmula o parámetro legal asociado, el sistema DEBE mostrarla igualmente e indicar claramente esa carencia (Historia de Usuario 5).
- **FR-043**: La explicación de una liquidación de un período cerrado DEBE mostrar los valores congelados del período, y la de un período abierto o calculado DEBE mostrar los parámetros del período y marcarse visiblemente como "borrador", también en la vista imprimible (Historia de Usuario 5).
- **FR-044**: El sistema DEBE ofrecer la acción "Imprimir / Guardar en PDF" que genere una vista limpia del comprobante, sin menús, botones de edición ni controles de navegación, y permitir guardarlo como PDF; consultar, explicar, imprimir o guardar en PDF una liquidación NO DEBE modificar su contenido (Historia de Usuario 5).
- **FR-045**: El comprobante imprimible DEBE incluir la identificación del Trabajador, el período, las líneas con sus montos, los totales, el líquido a pagar y la marca de "borrador" cuando corresponda (Historia de Usuario 5).
- **FR-046**: La vista imprimible y el PDF generado desde "Imprimir / Guardar en PDF" DEBEN reproducir exactamente la misma información que la vista "Ver liquidación": identificación del Trabajador, período, cada línea con su base de cálculo, tasa o factor, fórmula y parámetro legal con mes/año, montos, totales, líquido a pagar, explicaciones y marca de "borrador" cuando corresponda. NO DEBEN añadir ni omitir contenido respecto de "Ver liquidación"; la única diferencia permitida es la ausencia de menús, botones y controles de navegación y el ajuste de maquetación al papel. Los montos DEBEN coincidir exactamente con los mostrados en la liquidación (Historia de Usuario 5).
- **FR-047**: La vista imprimible DEBE adaptarse a una hoja tamaño carta o A4 en orientación vertical y DEBE poder guardarse como PDF (Historia de Usuario 5).
- **FR-048**: La consulta, la explicación, la impresión y el guardado en PDF de liquidaciones DEBEN respetar los permisos de acceso vigentes: el analista de remuneraciones y el administrador/a de RR.HH. pueden ver las liquidaciones de cualquier Trabajador; el Trabajador solo las suyas y solo las de períodos cerrados; la jefatura no accede a liquidaciones (Historias de Usuario 5 y 6).
- **FR-049**: El sistema DEBE impedir que un Trabajador vea una liquidación que no sea suya o que pertenezca a un período no cerrado, y DEBE impedir que una jefatura acceda a liquidaciones, informando la denegación sin revelar el contenido protegido (Historias de Usuario 5 y 6).
- **FR-050**: La consulta, explicación, impresión o guardado en PDF de una liquidación por un usuario con sesión identificada DEBE registrarse en la bitácora de auditoría con al menos usuario, rol, fecha y hora, acción y registro afectado (Historias de Usuario 5 y 6).
- **FR-051**: El sistema DEBE basar el acceso a la información sensible en el rol de la sesión identificada (simulada, mediante selector de rol); sin rol seleccionado no hay acceso. El campo de contraseña DEBE mostrar su valor oculto por defecto y ofrecer un control con ícono de ojo, operable con teclado y con etiqueta accesible "Mostrar contraseña"/"Ocultar contraseña", para mostrar u ocultar lo escrito sin alterar el valor; con el control activado DEBE permitirse seguir escribiendo en el campo, con cada carácter visible de inmediato y conservando el foco y la posición del cursor; DEBE volver a ocultarse al cerrar sesión o tras un intento rechazado, y la contraseña NO DEBE registrarse ni mostrarse fuera del campo (detalle en FR-113).
- **FR-052**: El sistema DEBE restringir la visualización y consulta de sueldos, liquidaciones y licencias médicas a los roles expresamente autorizados. La jefatura puede ver de su equipo únicamente los datos básicos (nombre, código, cargo, departamento, centro de costo y estado laboral) y gestionar las novedades de su equipo (incluidas licencias médicas sin diagnóstico clínico), pero tiene ocultos o bloqueados los contratos, los sueldos base y las liquidaciones, y no puede operar sobre Trabajadores ajenos a su equipo; el Trabajador solo puede ver sus propias liquidaciones de períodos cerrados. El panel principal DEBE mostrar solo avisos y alertas derivados de datos accesibles al rol: administrador/a y analista ven las alertas de contratos de todos; la jefatura no ve alertas de contratos; el Trabajador ve únicamente el resumen de su propio contrato (tipo, fechas, días restantes y estado, sin sueldo base), sin alerta si es indefinido (FR-114). Esta es la regla canónica de visibilidad; FR-054 especifica las superficies y FR-085 las capacidades por rol.
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
- **FR-063**: El sistema DEBE permitir crear, consultar y actualizar fichas de Trabajador con nombre, código y RUT obligatorios, validando el dígito verificador del RUT y los formatos de correo y fecha de ingreso cuando se informen; la ficha DEBE permitir registrar banco y cuenta de pago, exigidos al exportar la nómina (Historias de Usuario 1 y 11).
- **FR-064**: El sistema DEBE gestionar los catálogos de cargo, departamento y centro de costo, permitiendo crear, editar, ocultar y reactivar opciones (sin eliminarlas), impidiendo asignar opciones desactivadas a nuevas fichas y mostrando la etiqueta "desactivado" en fichas existentes (Historia de Usuario 1).
- **FR-065**: El sistema DEBE permitir desactivar un Trabajador activo solo con confirmación explícita, bloqueando la operación si tiene novedades en estado "Pendiente"; al desvincular DEBE terminar automáticamente su contrato vigente o vencido con la fecha de desvinculación, mantener el estado laboral Activo/Desvinculado, registrar la fecha de desvinculación, conservar la ficha para consulta histórica sin eliminarla ni reactivarla en esta versión, y si el Trabajador era jefatura directa, dejar a su equipo como "sin jefatura directa" con sus novedades pendientes a cargo del administrador/a de RR.HH. (Historias de Usuario 1 y 2).
- **FR-066**: El sistema DEBE permitir asignar una jefatura directa opcional a cada Trabajador, restringida a Trabajadores activos, impidiendo la autoasignación y ocultando Trabajadores Desvinculados del selector de jefatura (Historia de Usuario 1).
- **FR-067**: El sistema DEBE registrar en la bitácora de auditoría la creación, actualización y desactivación de fichas de Trabajador y de catálogos base, con usuario, rol, fecha y hora, y valores anteriores y nuevos de los campos modificados, salvo datos sensibles, cuyos valores se registran como `[REDACTADO]` (Historia de Usuario 1).
- **FR-068**: El sistema DEBE gestionar contratos por Trabajador con sueldo base, jornada, tipo de contrato y vigencia, manteniendo sus estados (vigente, vencido, terminado) y el historial de vigencias (Historia de Usuario 2).
- **FR-069**: El sistema DEBE garantizar que cada Trabajador tenga como máximo un contrato vigente a la vez y que las vigencias de sus contratos no se superpongan; un Trabajador puede no tener contratos (Historia de Usuario 2).
- **FR-070**: El sistema DEBE aplicar las transiciones de estado de contratos: marcar como vencido al superar la fecha de fin sin terminación, permitir terminar un contrato vigente o vencido (incluido el indefinido) y no permitir eliminar contratos lógica ni físicamente; el estado "cancelado" no se admite en esta versión (Historia de Usuario 2).
- **FR-071**: El sistema DEBE impedir la edición directa de los campos de vigencia de un contrato existente; los cambios de vigencia DEBEN materializarse creando un nuevo registro y el sistema ajusta la fecha de fin del anterior sin superposición (Historia de Usuario 2).
- **FR-072**: El sistema DEBE generar alertas de contratos próximos a vencer (30 días o menos) y vencidos, y exigir que el Trabajador cuente con un contrato cuya vigencia incluya la fecha de la novedad para registrarla, o al menos un día del período para ser incluido en el cálculo de remuneraciones. Las alertas y avisos del panel principal DEBEN respetar la visibilidad por rol de FR-052 y FR-114, sin exponer contratos ni sueldos ajenos (Historia de Usuario 2).
- **FR-073**: El sistema DEBE registrar en la bitácora de auditoría la creación, actualización y cambios de estado de contratos con usuario, fecha y hora, y valores anteriores y nuevos de los campos modificados, salvo datos sensibles, cuyos valores se registran como `[REDACTADO]` (Historia de Usuario 2).
- **FR-074**: El sistema DEBE permitir registrar novedades de horas extra, licencia médica y ausencia asociadas a un Trabajador y al período de su fecha, exigiendo que el período se encuentre activo; las licencias médicas no DEBEN registrar diagnóstico clínico (Historia de Usuario 3).
- **FR-075**: Cuando el rango de una novedad cruza meses, el sistema DEBE dividirla automáticamente por mes calendario, prorrateando la cantidad según los días del rango que caen en cada mes (p. ej., 10 días: 6 en enero y 4 en febrero); si alguno de los períodos no está activo, la operación completa DEBE rechazarse sin crear registros parciales (Historia de Usuario 3).
- **FR-076**: El sistema DEBE gestionar los estados de las novedades (pendiente, aprobada, rechazada, anulada), impidiendo registrar o modificar novedades de períodos cerrados y excluyendo del cálculo las novedades cuyo período no esté activo (Historia de Usuario 3).
- **FR-077**: El sistema DEBE aplicar la segregación de funciones en novedades: la jefatura puede registrar, aprobar o rechazar las de su equipo, pero no las que ella misma registró; el administrador/a de RR.HH. puede aprobar o rechazar las de Trabajadores sin jefatura directa y las registradas por la jefatura de ese equipo; el analista de remuneraciones puede registrar y ver novedades, pero no aprobarlas ni rechazarlas; ningún rol puede aprobar o rechazar una novedad que haya registrado. Solo una novedad "Pendiente" puede editarse o anularse; las "Aprobadas" y "Rechazadas" no se modifican y una corrección se registra como una novedad nueva (Historia de Usuario 3).
- **FR-078**: El sistema DEBE registrar en la bitácora de auditoría la creación, actualización, aprobación, rechazo y anulación de novedades con usuario, fecha y hora, y valores anteriores y nuevos de los campos modificados, salvo datos sensibles, cuyos valores se registran como `[REDACTADO]` (Historia de Usuario 3).
- **FR-079**: El sistema DEBE permitir crear períodos de remuneración por mes y año con parámetros legales obligatorios y estado inicial "abierto", impidiendo períodos duplicados o con mes calendario inválido (Historia de Usuario 4).
- **FR-080**: El sistema DEBE ejecutar el cálculo de remuneraciones de un período considerando únicamente los contratos cuya vigencia comprenda al menos un día del período (incluidos los terminados o vencidos con vigencia dentro del período) y las novedades aprobadas del período, calculando de forma proporcional por los días de vigencia dentro del período sobre los días naturales del mes (p. ej., 17/31 para un contrato que cubre 17 de 31 días), dejando el período en estado "calculado" y permitiendo recalcular mientras esté abierto o calculado (Historia de Usuario 4).
- **FR-081**: El sistema DEBE marcar como desactualizada la liquidación de un Trabajador cuando, tras el último cálculo, se apruebe una novedad o cambie su contrato, obligando a recalcular antes del cierre (Historia de Usuario 4).
- **FR-082**: El sistema DEBE impedir cerrar un período con novedades pendientes o con Trabajadores sin calcular (según la definición de la Historia de Usuario 4); al cerrar DEBE exigir la fecha de pago, congelar UF, UTM, tasas y fecha de pago, registrar quién y cuándo lo cerró y pasar el período a "cerrado" sin posibilidad de reapertura (Historia de Usuario 4).
- **FR-083**: Cada línea de liquidación DEBE redondearse al peso entero y los totales DEBEN obtenerse sumando las líneas ya redondeadas; las liquidaciones de períodos cerrados no DEBEN poder modificarse y su corrección queda fuera del alcance de esta versión (Historia de Usuario 4).
- **FR-084**: El sistema DEBE registrar en la bitácora de auditoría la creación, cálculo, recálculo y cierre de períodos de remuneración con usuario, fecha y hora, y los datos relevantes de la operación (Historia de Usuario 4).
- **FR-085**: El sistema DEBE aplicar los permisos detallados por rol de la sesión identificada (simulada), en complemento a FR-051–FR-054 (Historia de Usuario 6): el administrador/a de RR.HH. accede a todas las funciones de las Historias 1 a 5 y 7 a 12 y es el único rol que cierra períodos, consulta la bitácora de auditoría, exporta/importa el respaldo y carga los parámetros legales; el analista de remuneraciones gestiona fichas, catálogos y contratos, registra novedades, crea períodos, ejecuta el cálculo y consulta liquidaciones, pero no cierra períodos, no aprueba novedades y no accede a la bitácora ni al respaldo; administrador/a y analista ven en el panel principal las alertas de contratos de todos; jefatura y Trabajador según las restricciones de visibilidad de FR-052/FR-054, con segregación de FR-053/FR-077: la jefatura no ve alertas de contratos y el Trabajador ve solo el resumen de su propio contrato (tipo, fechas, días restantes y estado, sin sueldo base), sin alerta si es indefinido (FR-114).
- **FR-086**: Al cambiar de rol durante una sesión activa, el sistema DEBE aplicar de inmediato los permisos del nuevo rol, volver a solicitar el Trabajador que se representa cuando el rol sea jefatura o Trabajador, y registrar el cambio en la bitácora de auditoría (Historia de Usuario 6).
- **FR-087**: La consulta de la bitácora de auditoría DEBE estar disponible exclusivamente para el rol administrador/a de RR.HH., quien puede visualizar y reconstruir los accesos y modificaciones registrados (Historia de Usuario 6).
- **FR-088**: El sistema DEBE devengar 1,25 días hábiles de vacaciones por cada mes completo trabajado, validar cada solicitud contra el saldo proyectado a su fecha de inicio, limitar el saldo acumulado a 30 días hábiles y mostrar una alerta cuando se alcance ese máximo (Historia de Usuario 7).
- **FR-089**: El sistema DEBE contar los días de vacaciones como días hábiles de lunes a viernes excluyendo feriados, recalcular las solicitudes aprobadas cuando se agregue un feriado en su rango, ajustar el saldo descontado y registrar el cambio en la bitácora (Historia de Usuario 7).
- **FR-090**: El sistema DEBE gestionar solicitudes de vacaciones en estados Pendiente, Aprobada, Rechazada o anulada, exigir motivo de rechazo, impedir aprobaciones del mismo usuario que registró la solicitud, permitir anular solo antes de la fecha de inicio y bloquear superposiciones con vacaciones, licencias o ausencias (Historia de Usuario 7).
- **FR-091**: El sistema DEBE congelar el saldo de vacaciones de un Trabajador desvinculado para consulta histórica, sin pago ni ejercicio en esta versión (Historia de Usuario 7).
- **FR-092**: El sistema DEBE registrar cargas familiares con Trabajador, nombre, RUT válido, parentesco, fecha de nacimiento, tipo de carga, resolución de reconocimiento y vigencia, avisar 30 días antes de la edad límite y exceptuar de ella a las cargas de invalidez (Historia de Usuario 8).
- **FR-093**: El sistema DEBE impedir que un mismo RUT de carga esté vigente para dos Trabajadores o repetido vigente para uno mismo, y DEBE terminar las cargas con fecha de término sin eliminarlas (Historia de Usuario 8).
- **FR-094**: El sistema DEBE calcular la asignación familiar con la tabla de tramos vigente, contar doble una carga de invalidez y agregar la línea `ASIG_FAMILIAR` como haber no imponible y no tributable con su explicación (Historia de Usuario 8).
- **FR-095**: El sistema DEBE simular bruto a líquido usando los parámetros del mes de referencia y las mismas reglas y redondeo de la US4, sin crear ni modificar registros ni generar auditoría, y permitir copiar el desglose como texto con la marca de simulación referencial (Historia de Usuario 9).
- **FR-096**: El sistema DEBE simular líquido a bruto buscando el menor sueldo base cuyo líquido iguale o supere el deseado con diferencia máxima de 1 peso, respetando ingreso mínimo y jornada máxima, marcar el resultado como simulación referencial y permitir copiar el desglose como texto con esa marca (Historia de Usuario 9).
- **FR-097**: El sistema DEBE generar reportes de dotación, costo por centro de costo, horas extra y ausentismo únicamente sobre períodos cerrados, excluyendo licencias, vacaciones y permisos legales del ausentismo (Historia de Usuario 10).
- **FR-098**: El sistema DEBE calcular la brecha salarial de género por cargo mediante la mediana del sueldo base de los grupos Femenino y Masculino, ocultar el resultado de cualquier cargo con menos de 5 personas en alguno de esos grupos y mostrar a las demás personas solo como un conteo agregado por cargo, oculto si es menor a 5 (Historia de Usuario 10).
- **FR-099**: El sistema DEBE tratar el género como dato sensible opcional usado solo en el reporte de brecha, sin mostrarlo en listados, búsquedas ni filtros de Trabajadores (Historia de Usuario 10).
- **FR-100**: El sistema DEBE aplicar permisos por rol a los reportes, mostrar un estado vacío cuando no haya períodos cerrados, ocultar las cifras de cualquier equipo o departamento con menos de 5 personas, para todos los roles, y registrar en la bitácora la consulta de brecha de género (Historia de Usuario 10).
- **FR-101**: El sistema DEBE permitir exportar, solo desde períodos cerrados, dos archivos CSV —`resumen_contable_YYYYMM.csv` y `nomina_pago_YYYYMM.csv`— con UTF-8 con BOM, separador `;` y encabezados sin acentos (Historia de Usuario 11).
- **FR-102**: El sistema DEBE restringir la exportación de archivos CSV al rol administrador/a de RR.HH. y registrar cada exportación en la bitácora de auditoría (Historia de Usuario 11).
- **FR-103**: El resumen contable DEBE agregar los montos por cuenta contable y centro de costo, obtener la cuenta de un mapeo configurable por concepto de liquidación y el centro de costo de la ficha del Trabajador, y sus totales DEBEN cuadrar con las liquidaciones del período cerrado (Historia de Usuario 11).
- **FR-104**: La nómina de pago DEBE incluir Trabajador, banco, cuenta, líquido a pagar y fecha de pago, tomar banco y cuenta de la ficha, exigirlos antes de exportar, usar la fecha de pago ingresada al cerrar el período y bloquearse si falta el banco o la cuenta de algún Trabajador (Historia de Usuario 11).
- **FR-105**: El sistema DEBE versionar los parámetros legales como un conjunto completo por mes y año, cargado manualmente por el administrador/a de RR.HH. en un formulario en pantalla que permite copiar el conjunto del mes anterior; un conjunto usado por un Período NO DEBE modificarse y las correcciones DEBEN cargarse como otro conjunto completo para un mes distinto (Historia de Usuario 12).
- **FR-106**: El sistema DEBE impedir crear o calcular un Período cuando el conjunto de parámetros del mes esté incompleto (incluida la tabla de tramos de asignación familiar) e indicar qué parámetros faltan (Historia de Usuario 12).
- **FR-107**: Al cerrar un Período, el sistema DEBE conservar en las liquidaciones los valores del conjunto usado, sin que versiones posteriores puedan alterarlos (Historia de Usuario 12).
- **FR-108**: Los listados de RR.HH. que muestran Trabajadores o sus registros (fichas, contratos, novedades, liquidaciones, solicitudes de vacaciones y cargas familiares) DEBEN paginarse en 25 filas, ordenadas alfabéticamente por nombre del Trabajador, con controles de página anterior y siguiente y el total de registros, conservando la búsqueda y los filtros activos al cambiar de página.
- **FR-109**: Toda pantalla de RR.HH. DEBE informar el resultado de cada acción (guardar, aprobar, rechazar, anular, calcular, cerrar o exportar) con un aviso visible sobre el formulario o listado, diferenciado como éxito o error y anunciado a los lectores de pantalla, y DEBE mostrar cada error de validación junto al campo que lo causa.
- **FR-110**: Todas las pantallas de RR.HH. DEBEN seguir una guía de estilo común: usar únicamente los colores, la tipografía y los espaciados definidos en la hoja de estilos común del módulo; ubicar el título y las acciones principales en la misma posición; mostrar las tablas con fila de encabezado; no presentar textos cortados ni desbordados; y cumplir contraste WCAG 2.2 AA. En pantallas con alta, la acción principal DEBE presentarse como un botón en la esquina superior derecha con el nombre de la acción ("Registrar trabajador", "Registrar contrato", "Nuevo registro de catálogo" y análogos), sin mostrar el formulario de forma permanente (detalle en FR-116). En la pantalla de Trabajadores el listado DEBE ocupar todo el ancho disponible del área de contenido, centrado, sin quedar reducido a una columna estrecha cuando el formulario está cerrado; el botón "Registrar trabajador" DEBE estar arriba a la derecha, a la misma altura del título, sin desplazar la tabla (Historia de Usuario 1). La pantalla de selección del Trabajador representado DEBE mostrar el selector y la acción "Continuar" extendidos y centrados en el área principal, ocupando todo el ancho disponible, sin reducirlos a un recuadro estrecho (Historia de Usuario 6). Estos puntos conforman la lista de chequeo de revisión visual de SC-030.
- **FR-111**: Cada reporte de gestión DEBE mostrarse como una tabla con sus cifras acompañada de un gráfico de barras simple con los mismos datos, con título y descripción accesibles (Historia de Usuario 10).
- **FR-112**: Las vacaciones DEBEN gestionarse en su propia pantalla de la barra lateral, y la ficha del Trabajador DEBE mostrar un resumen con un enlace a esa pantalla filtrada por esa persona. Las cargas familiares DEBEN gestionarse directamente en la ficha del Trabajador (sin apartado separado), mostrando un resumen y permitiendo su registro/consulta según permisos, respetando los permisos de visualización de cada rol (Historias de Usuario 7 y 8).
- **FR-113**: El campo de contraseña del inicio de sesión DEBE ocultar lo escrito por defecto y ofrecer un control con ícono de ojo, operable con teclado y con etiqueta accesible "Mostrar contraseña"/"Ocultar contraseña", que permite mostrar u ocultar el valor sin alterarlo; con el control activado DEBE ser posible seguir escribiendo en el campo, viendo cada carácter nuevo en el momento y conservando el foco y la posición del cursor; el campo DEBE volver a ocultarse al cerrar sesión o tras un intento rechazado, y la contraseña NO DEBE registrarse ni mostrarse fuera del campo, ni en la bitácora de auditoría (Historia de Usuario 6).
- **FR-114**: El panel principal DEBE mostrar a cada rol solo los avisos y alertas derivados de datos a los que tiene acceso: administrador/a y analista ven las alertas de contratos de todos los Trabajadores; la jefatura no ve alertas de contratos; el Trabajador ve solo el resumen de su propio contrato (tipo, fecha de inicio, fecha de término si es a plazo fijo, días restantes y estado, sin sueldo base), también si es indefinido pero sin alerta de vencimiento, y no ve resumen ni alerta si no tiene contrato; un Trabajador desvinculado conserva solo la consulta histórica de su último contrato, sin alertas. La barra superior del Trabajador DEBE mostrar solo dos pestañas, "Resumen" y "Liquidaciones": "Resumen" DEBE contener únicamente los datos de su propio contrato, y "Liquidaciones" DEBE permitir elegir un período cerrado y mostrar solo sus propias liquidaciones (Historias de Usuario 2, 5 y 6).
- **FR-115**: En la pantalla de cálculo, al seleccionar un Trabajador de la lista, el sistema DEBE desplegar su liquidación justo debajo de su fila y contraer la anterior al seleccionar otro, de modo que solo permanezca desplegada la del Trabajador seleccionado, sin modificar ninguna liquidación. En la pestaña "Liquidaciones", para cualquier rol autorizado, la lista NO DEBE mostrar ningún detalle calculado ni ninguna acción de ciclo de vida al entrar ni al cambiar el período seleccionado; el detalle DEBE desplegarse justo debajo de la fila elegida solo cuando el usuario pulse "Ver liquidación", contraerse al seleccionar otra liquidación y limpiarse al cambiar de período (Historias de Usuario 4 y 5).
- **FR-116**: Las pantallas de RR.HH. con alta NO DEBEN mostrar el formulario de forma permanente; DEBEN ofrecer un botón en la esquina superior derecha con el nombre de la acción ("Registrar trabajador", "Registrar contrato", "Nuevo registro de catálogo" y análogos para novedades, vacaciones, cargas, períodos y parámetros) que abre el formulario en un panel lateral derecho con las acciones Guardar y Cancelar. Editar un registro existente DEBE usar el mismo panel; cerrarlo con cambios sin guardar DEBE pedir confirmación antes de descartarlos; en pantallas estrechas el panel DEBE ocupar todo el ancho (Historias de Usuario 1 y 2, regla transversal para las pantallas con alta).

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Catálogo**: Opción maestra de cargo, departamento o centro de costo, con tipo, código único dentro de su tipo, nombre y estado Activo/Inactivo del catálogo; se desactiva sin eliminarse y se conserva en las fichas que ya la usaban.
- **Liquidación**: Comprobante que resume la remuneración de un trabajador en un período, con el detalle de haberes, descuentos, impuestos, totales y líquido a pagar, junto con el estado del cálculo y la fecha de emisión del comprobante.
- **Línea de Liquidación**: Cada concepto que compone una liquidación (haber, descuento o impuesto), con su monto, la base de cálculo, la tasa o factor aplicado, la fórmula utilizada y el parámetro legal que la respalda; las líneas manuales registran un motivo en lugar de una fórmula.
- **Parámetro Legal**: Valor normativo incluido en un `CONJUNTO_PARAMETROS_LEGALES` completo por mes y año (tasa, tope, tramo o monto fijo) que sustenta el cálculo de una línea; el conjunto se bloquea desde su primer uso y el valor queda conservado en las liquidaciones de los períodos cerrados.
- **Rol**: Perfil que determina las funciones y los datos a los que puede acceder un usuario en la sesión simulada; los roles son administrador/a de RR.HH., analista de remuneraciones, jefatura y Trabajador.
- **Permiso de Acceso**: Regla que asocia un rol con la capacidad de consultar o modificar un tipo de información sensible.
- **Dato Sensible**: Información personal o financiera protegida (sueldos, liquidaciones y licencias médicas) cuyo acceso está restringido según el rol.
- **Registro de Auditoría**: Entrada inmutable que documenta quién consultó o modificó información sensible, cuándo, con qué rol y sobre qué registro.
- **Bitácora de Auditoría**: Colección de solo inserción de registros de auditoría, conservada para efectos de trazabilidad y cumplimiento normativo.
- **Trabajador**: Persona empleada, identificada por nombre, código y RUT como identificación fiscal, con su perfil de RR.HH. (cargo, departamento, centro de costo y estado laboral); puede tener una jefatura directa opcional y registra banco y cuenta de pago para la exportación de nómina.
- **Contrato**: Condiciones laborales de un Trabajador (sueldo base, jornada y tipo de contrato) con historial por vigencia y alertas de vencimiento; pertenece a un Trabajador.
- **Novedad**: Evento de un período (horas extra, licencia médica o ausencia) asociado a un Trabajador y a un Período de Remuneración, con estado Pendiente/Aprobada/Rechazada/anulada y sin diagnóstico clínico.
- **Período de Remuneración**: Mes y año de liquidación con estado Abierto/Calculado/Cerrado; al cerrarse congela UF, UTM, ingreso mínimo y parámetros legales, y agrupa Novedades y Liquidaciones.
- **Solicitud de Vacaciones**: Período de descanso pedido para un Trabajador, con fechas, días hábiles, estado (Pendiente, Aprobada, Rechazada o anulada), quién la registró y quién la resolvió.
- **Feriado**: Fecha no hábil del calendario (fecha y nombre), usada para contar los días hábiles de vacaciones.

> El detalle de atributos, claves de almacenamiento y relaciones de las entidades de Recursos Humanos se documenta en `specs/001-rrhh-planilla/data-model.md`.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

> La numeración comienza en SC-011: SC-001–SC-010 correspondían al módulo base genérico, retirado del alcance.

- **SC-011**: Al seleccionar cada línea de una liquidación calculada (evento de foco o clic), el 100% de las líneas muestra base, tasa o factor y fórmula en menos de 1 segundo, medido desde el evento de selección hasta que el desglose queda visible en la interfaz.
- **SC-012**: Un usuario puede abrir una liquidación y obtener su comprobante impreso o en PDF en menos de 30 segundos.
- **SC-013**: Al menos el 90% de los usuarios de prueba comprende de dónde proviene cada monto sin ayuda adicional.
- **SC-014**: Las consultas internas sobre montos pagados se reducen al menos un 40% tras la adopción de la vista explicativa.
- **SC-015**: El 100% de los comprobantes impresos o guardados como PDF coincide con los totales de la liquidación, reproduce exactamente la información mostrada en "Ver liquidación" y se ajusta a un máximo de dos páginas.
- **SC-016**: La vista imprimible no muestra controles de edición ni de navegación en ningún caso.
- **SC-017**: El 100% de las pantallas, listados e impresiones muestra los datos sensibles solo a los roles autorizados; el rol Jefatura nunca ve sueldos base ni liquidaciones.
- **SC-018**: El 100% de las consultas y cambios sobre información sensible queda registrado en la bitácora de auditoría.
- **SC-019**: Un intento de editar o eliminar un registro de auditoría es rechazado en el 100% de los casos.
- **SC-020**: La bitácora permite reconstruir la trazabilidad completa de accesos y modificaciones a datos sensibles de un usuario o período en menos de 5 minutos.
- **SC-021**: Al menos el 95% de las pruebas de acceso con distintos roles confirma que los datos ocultos no pueden recuperarse desde la interfaz ni mediante enlaces directos.
- **SC-022**: Un usuario puede exportar un respaldo completo y restaurarlo sin pérdida de Trabajadores, catálogos, contratos, novedades, períodos ni liquidaciones en menos de 5 minutos.
- **SC-023**: El cálculo masivo de un período con hasta 500 Trabajadores y sus novedades aprobadas genera todas las liquidaciones en 10 segundos o menos en el entorno de uso previsto.
- **SC-024**: El 100% de las solicitudes de vacaciones aprobadas recalcula sus días hábiles y su saldo descontado cuando se agrega un feriado en su rango, con registro en bitácora.
- **SC-025**: El 100% de las cargas familiares con RUT duplicado vigente es rechazado y el 100% de las cargas que alcanzan la edad límite genera aviso con 30 días de anticipación.
- **SC-026**: El simulador coincide al peso con la liquidación de referencia en el 100% de los casos probados y no crea ni modifica registros.
- **SC-027**: El 100% de los reportes excluye períodos abiertos o calculados y oculta resultados de grupos con menos de 5 personas.
- **SC-028**: El 100% de las exportaciones desde períodos cerrados genera los dos CSV con totales cuadrados y deja registro en bitácora.
- **SC-029**: El 100% de los conjuntos de parámetros usados por un Período permanece bloqueado contra modificación y las liquidaciones cerradas conservan sus valores originales.
- **SC-030**: El 100% de los escenarios de aceptación de las Historias de Usuario 1 a 12 tiene una prueba automatizada que pasa, y cada pantalla de RR.HH. aprueba la lista de chequeo de revisión visual antes de considerar terminada su historia.
- **SC-031**: El 100% de las pantallas de RR.HH. se muestra completa y operable entre 768 px y 1920 px de ancho, sin desplazamiento horizontal de la página; solo las tablas anchas pueden desplazarse dentro de su propio contenedor.

## Suposiciones

- El módulo gestiona los datos de una única empresa en un único espacio de trabajo, sin una base de datos multiinquilino compartida.
- La versión inicial incluye todas las historias de usuario US1–US12: fichas y catálogos base (US1), contratos y alertas de plazo (US2), registro y aprobación de novedades (US3), cálculo y cierre de períodos (US4), explicación e impresión de liquidaciones (US5), seguridad y gobierno de datos (US6), vacaciones (US7), cargas familiares y asignación familiar (US8), simulador de sueldo (US9), reportes de gestión y equidad salarial (US10), exportaciones contables y de pago (US11) y parámetros legales versionados (US12). Quedan fuera capacidades ERP avanzadas como contabilidad general, informes financieros y planificación presupuestaria.
- La aplicación opera en modo **RR.HH.-only**: no se muestran pantallas base genéricas del ERP antiguo en el flujo principal; el espacio de trabajo corresponde al módulo de RR.HH. y Planilla con **pestañas superiores** (sin barra lateral).
- La navegación entre pestañas/pantallas de RR.HH. se maneja dentro de la aplicación, y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos persisten localmente en el navegador y no se ven afectados por la navegación entre pantallas.
- El contenido introducido por el usuario (nombres, observaciones, motivos de rechazo y otros textos libres) DEBE sanitizarse antes de mostrarse para prevenir ataques de inyección de scripts (XSS).
- Las liquidaciones y sus líneas existen como resultado del motor de cálculo de la Historia de Usuario 4; la Historia de Usuario 5 cubre únicamente su explicación e impresión, no las reglas de cálculo ni la generación de la planilla.
- Cada línea conserva, desde el momento del cálculo, la base, la tasa o fórmula y el parámetro legal aplicado, de modo que la explicación no depende de parámetros posteriores.
- La impresión se realiza mediante la función de impresión del navegador (`window.print()`), que incluye la opción de guardar como PDF; el comprobante debe ocupar el ancho disponible de la hoja sin recortar montos en pesos.
- Los datos de identificación de la empresa emisora están disponibles en la configuración del módulo (`module-config.js`).
- Los parámetros legales (UF, UTM, tasas y tramos) se cargan y versionan manualmente por un administrador mediante un formulario en pantalla; no se integran servicios externos.
- Los montos se presentan en pesos chilenos con separador de miles.
- El acceso a la explicación y al comprobante respeta los permisos vigentes del usuario.
- El acceso requiere **ingreso con rol y clave demo** (ver FR-051 y Session 2026-06-19). No hay autenticación real ni gestión de usuarios productiva.
- Tras login como **jefatura** o **Trabajador**, se selecciona el **Trabajador representado** según reglas de visibilidad (equipo o propio histórico cerrado).
- Los datos sensibles (sueldos, liquidaciones y licencias médicas) están clasificados explícitamente en el modelo de datos.
- Las restricciones de acceso se aplican en interfaz (ocultamiento proactivo) y en lógica de datos; los accesos directos denegados no revelan contenido protegido.
- La bitácora de auditoría se conserva mientras dure la relación laboral y 6 años después del término, conforme a la Ley 21.719; los accesos denegados se registran cuando corresponda.
- La versión inicial incluye exportación e importación completa en JSON para respaldo y restauración de los datos almacenados localmente (la importación no sobrescribe ni elimina registros previos de auditoría).


# Investigación: Módulo de Recursos Humanos y Planilla

## Decisión: Usar Vite con HTML, CSS y JavaScript vanilla

**Justificación**: La solicitud enfatiza un enfoque de mínimas librerías y una implementación ligera. Vite proporciona una experiencia de desarrollo rápida y un pipeline de construcción simple sin requerir un framework más pesado. JavaScript vanilla mantiene la aplicación fácil de entender, fácil de probar y fácil de mantener para una pequeña aplicación de página única.

## Alternativas consideradas

- React o Vue: Ecosistema de componentes más sólido, pero añade más abstracción y sobrecarga de dependencias de las necesarias para este alcance.
- HTML estático plano sin Vite: Más simple, pero Vite ofrece un mejor flujo de trabajo de desarrollo local y paso de construcción para crecimiento futuro.
- Persistencia en backend con base de datos: No es necesaria para un módulo de una sola empresa y añadiría complejidad innecesaria; el contrato de almacenamiento está aislado, por lo que un backend puede introducirse más tarde sin cambiar la lógica del módulo.

## Decisiones adicionales

- Se usará localStorage del navegador para la persistencia porque el módulo atiende a una sola empresa y no necesita almacenamiento del lado servidor.
- La interfaz será una experiencia de página única con un panel principal de alertas y una barra lateral con las pantallas de RR.HH.
- La aplicación favorecerá la mejora progresiva y los controles de formulario nativos accesibles sobre widgets personalizados complejos.
- Cada Trabajador tiene un identificador público autogenerado (`entity_id`) que vincula sus contratos, novedades, liquidaciones y demás registros del módulo.
- La generación de identidad, las marcas de tiempo y la integridad referencial residen en la capa de almacenamiento (`src/storage.js` y `src/rrhh/storage-rrhh.js`).

## Decisiones de clarificación (2026-11-08)

### Sesión simulada con selector de rol

**Decisión**: La identidad se simula con un selector de rol en la interfaz (Administrador, Jefatura, Analista/Trabajador) y una sesión en memoria; no hay credenciales ni backend de autenticación.

**Justificación**: Permite demostrar permisos y auditoría sin introducir seguridad de servidor fuera del alcance del MVP.

**Alternativas rechazadas**: Login local con contraseñas (falsa seguridad y costo de mantenimiento); autenticación real con backend (fuera de alcance).

**Consecuencias**: La auditoría registra el rol/selector activo, no una identidad verificada; debe documentarse como simulación.

### Parámetros legales cargados manualmente

**Decisión**: Los parámetros (UF, UTM, IMM, tasas, topes y tramos) se cargan manualmente por un administrador como conjuntos completos por mes y año, mediante formulario o archivo de configuración, con fuente. Cada conjunto se bloquea desde su primer uso.

**Justificación**: Evita dependencias externas y mantiene el cálculo reproducible y auditable; el cierre congela los valores aplicados.

**Alternativas rechazadas**: Consumo automático de indicadores (requiere red, credenciales y manejo de fallos); parámetros fijos en código (impiden cambios legales).

**Consecuencias**: La exactitud depende de la carga oportuna; la interfaz debe alertar parámetros faltantes o vencidos.

### Retención de auditoría de 6 años

**Decisión**: La bitácora de solo inserción se conserva durante la relación laboral y 6 años después del término, conforme a la Ley 21.719, sujeta a validación legal.

**Justificación**: Cumple expectativas de trazabilidad y conservación documental sin almacenar datos sensibles innecesarios.

**Alternativas rechazadas**: Retención indefinida (mayor exposición de datos); purga inmediata al término (pierde trazabilidad exigible).

**Consecuencias**: La exportación JSON incluye la auditoría; no se ofrece borrado manual de registros de auditoría desde la interfaz. Las operaciones de exportación e importación de respaldo se registran en la bitácora y, al importar, nunca se sobrescriben ni eliminan los registros previos de auditoría (solo inserción preservada).

### Respaldo y restauración completa en JSON

**Decisión**: La versión inicial exporta e importa todo el espacio de trabajo (`erp:*` y `erp_rrhh:*`) en un único JSON versionado, validado antes de reemplazar datos.

**Justificación**: Mitiga la pérdida de datos de localStorage y facilita mover la instancia entre navegadores.

**Alternativas rechazadas**: Solo exportaciones CSV por entidad (no restaurables de forma completa); sincronización en la nube (fuera de alcance).

**Consecuencias**: La restauración es destructiva y requiere confirmación; el esquema incluye versión para migraciones futuras. La exportación e importación se registran en la bitácora y la importación no sobrescribe ni elimina los registros previos de auditoría.

### Entidades RR.HH. definidas en el feature 001

**Decisión**: Trabajador, Contrato, Novedad y Período de Remuneración se documentan como parte del modelo de 001, remitiendo el detalle de atributos a `specs/001-rrhh-planilla/data-model.md`.

**Justificación**: Evita que el plan 001 dependa de un `spec.md` inexistente en 002 y mantiene una única fuente de verdad para el MER.

**Alternativas rechazadas**: Duplicar el MER en 001 (riesgo de divergencia); crear un `spec.md` nuevo en 002 (fuera del alcance de esta corrección).

**Consecuencias**: Los cambios futuros al MER deben reflejarse en ambos documentos.

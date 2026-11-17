## Fase 5: Historia de Usuario 3 - Registro y Aprobación de Novedades del Mes (Prioridad: P1)

**Objetivo**: Permitir registrar novedades mensuales (horas extra, licencias médicas sin diagnóstico por Ley 21.719, vacaciones, ausencias, bonos y anticipos) y gestionar su flujo de aprobación (pendiente → aprobada / rechazada) mientras el período esté abierto.

**Prueba Independiente**: Una jefatura o analista registra una novedad (comprobando que en licencias médicas se prohíba guardar diagnósticos), la aprueba en un período abierto y verifica que un período cerrado bloquee nuevas ediciones.

### Pruebas para la Historia de Usuario 3

- [ ] T301 [P] [US3] Añadir pruebas unitarias para validación de novedades y prohibición de diagnósticos médicos (Ley 21.719) en tests/unit/rrhh/novedades.test.js
- [ ] T302 [P] [US3] Añadir pruebas de integración para el flujo de registro y aprobación de novedades (pendiente → aprobada) en un período abierto en tests/integration/rrhh/aprobar-novedad.test.js

### Implementación de la Historia de Usuario 3

- [ ] T303 [P] [US3] Implementar operaciones CRUD y validaciones de integridad para la tabla erp_rrhh:novedades en src/rrhh/storage-rrhh.js
- [ ] T304 [US3] Construir el formulario de registro de novedades con validación que impida ingresar diagnósticos médicos en licencias en src/rrhh/views/novedades.js
- [ ] T305 [US3] Implementar la tabla de listado de novedades con filtros por período/trabajador y controles de aprobación (jefatura → RR.HH.) en src/rrhh/views/novedades.js
- [ ] T306 [US3] Bloquear la creación, edición o cambio de estado de novedades cuando el período asociado esté cerrado en src/rrhh/views/novedades.js

**Punto de control**: La Historia de Usuario 3 debe estar completamente funcional y ser comprobable de forma independiente.

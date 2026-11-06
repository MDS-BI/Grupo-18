# Motor de cálculo de planilla

Este directorio contiene las funciones puras del motor de remuneraciones. Ninguna
de ellas lee `localStorage`, el DOM ni la sesión: reciben datos y parámetros ya
resueltos y devuelven un resultado nuevo.

## Contratos principales

- `parametros.js`
  - `resolverParametro(codigo, fecha, filas)` selecciona la versión vigente a la
    fecha indicada. Devuelve `null` si no existe una versión aplicable.
  - `resolverTramoImpuesto(baseUTM, tramos)` devuelve el tramo tributario que
    corresponde a la base expresada en UTM.
  - `mapaParametrosVigentes(fecha, filas)` construye el mapa de parámetros
    aplicables a un período.
  - `congelarParametros(fecha, filas)` genera el snapshot inmutable que se
    persiste en el período al cerrarlo.
- `rut.js`
  - `validarRut(valor)` valida formato, cuerpo y dígito verificador.
  - `formatearRut(valor)` normaliza el RUT para presentación.
- `motor.js`
  - `calcularLiquidacionTrabajador(entrada)` ejecuta los pasos 1 a 14: sueldo
    proporcional, horas extra, gratificación, haberes no imponibles,
    cotizaciones, impuesto, descuentos, líquido, aportes del empleador y costo
    total.
  - `calcularSueldoProporcional`, `calcularValorHoraExtra`, `calcularGratificacion`,
    `calcularImpuestoUnico` y `resolverParametroDeCalculo` exponen los pasos
    intermedios para pruebas y reutilización.
  - `resolverParametroDeCalculo` adapta el snapshot legal a las líneas de la
    liquidación.

## Reglas de cálculo

1. Cada línea se redondea al peso antes de sumar los totales. Los totales se
   calculan desde las líneas ya redondeadas, nunca desde valores intermedios.
2. La gratificación legal se limita a `4,75 IMM / 12`.
3. Las cotizaciones y el impuesto usan los topes y tramos vigentes al último día
   del período calculado.
4. Los aportes del empleador se suman a los haberes para obtener el costo
   empleador. No descuentan el líquido del trabajador.
5. Solo se consumen novedades aprobadas. Las pendientes o rechazadas generan
   advertencias y bloquean la elegibilidad del período, pero nunca se suman.
6. Si el período está cerrado, el cálculo usa el snapshot congelado y no vuelve
   a resolver parámetros vigentes.

## Caso de referencia

Con sueldo base `$1.200.000`, 42 horas semanales, 5 horas extra, FONASA,
AFP 11,27 %, IMM `$553.553`, UTM `$71.649` y los parámetros iniciales:

- Líquido: `$1.272.908`
- Costo empleador: `$1.659.456`

La prueba `tests/unit/rrhh-calculo-referencia.test.js` fija estos valores al peso.

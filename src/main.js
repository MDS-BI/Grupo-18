import { boot } from './app.js';

boot({ exclusive: true }).catch((error) => {
  console.error('No se pudo iniciar el módulo base ERP.', error);
});

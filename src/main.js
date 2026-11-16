import { boot } from './app.js';

boot().catch((error) => {
  console.error('No se pudo iniciar el módulo base ERP.', error);
});

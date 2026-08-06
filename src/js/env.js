/**
 * VILLA VICARIO - GESTOR DE VARIABLES DE ENTORNO
 * -------------------------------------------------------------------
 * Provee compatibilidad universal de variables de entorno para el formulario:
 * 1. Entorno de empaquetadores modernos (Vite / ESModules -> import.meta.env)
 * 2. Entorno Node / React / Next / Webpack -> process.env
 * 3. Ejecución directa en navegador estático (Vanilla JS -> Valores por defecto editables aquí o inyectados en despliegue)
 */

window.ENV = {
  API_URL: (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_API_URL || import.meta.env.API_URL) : null)
        || (typeof process !== 'undefined' && process.env ? (process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || process.env.VITE_API_URL) : null)
        || 'http://localhost:3000/qualification/submit',
        
  GHL_LOCATION_ID: (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GHL_LOCATION_ID || import.meta.env.GHL_LOCATION_ID) : null)
        || (typeof process !== 'undefined' && process.env ? (process.env.GHL_LOCATION_ID || process.env.VITE_GHL_LOCATION_ID || process.env.NEXT_PUBLIC_GHL_LOCATION_ID) : null)
        || 'VILLA_VICARIO_GHL_LOC_01'
};

/**
 * VILLA VICARIO - LEAD QUALIFICATION & GHL ROUTING ENGINE
 * Dynamic multi-step lead filtering for Buyers, Brokers, and Suppliers.
 * Integrated with Backend API (/qualification/submit)
 */

// Configuración de Entorno (Leída desde .env / window.ENV)
const API_URL = (window.ENV && window.ENV.API_URL) || 'http://localhost:3000/qualification/submit';
const GHL_LOCATION_ID = (window.ENV && window.ENV.GHL_LOCATION_ID) || 'VILLA_VICARIO_GHL_LOC_01';

// Diccionario para visualización amigable en tablas y confirmaciones de la interfaz local
const ENUM_DISPLAY_NAMES = {
  comprador: "Comprador Personal",
  familiar: "Familiar de Comprador",
  inversionista: "Inversionista / Renta",
  broker: "Broker / Asesor",
  proveedor: "Proveedor Comercial",
  vivir: "Para vivir yo / mi familia todo el año",
  temporada: "Casa de temporada / segunda residencia",
  renta: "Inversión para renta",
  ahora: "Estoy listo para cerrar ahora 🔥",
  "1_3_meses": "En los próximos 1-3 meses",
  explorando: "Explorando (más de 3 meses)",
  contado: "Contado 💎",
  credito: "Crédito hipotecario",
  sin_definir: "Aún por definir",
  menos_5m: "Menos de $5,000,000 MXN",
  "5m_6_5m": "$5,000,000 - $6,500,000 MXN",
  "6_5m_8m": "$6,500,000 - $8,000,000 MXN",
  mas_8m: "Más de $8,000,000 MXN 🔥"
};

function getDisplayName(val) {
  return ENUM_DISPLAY_NAMES[val] || val || 'N/A';
}

// Application State
const appState = {
  currentStep: 'A1',
  role: null, // 'comprador', 'broker', 'proveedor'
  formData: {
    roleOption: '',
    roleCategory: '',
    
    // Comprador fields (Block B)
    intencionUso: '',
    horizonteCompra: '',
    formaPago: '',
    presupuesto: '',
    nombreComprador: '',
    whatsappComprador: '',
    emailComprador: '',
    canalContacto: '',

    // Broker fields (Block C)
    nombreBroker: '',
    emailBroker: '',
    tipoInmobiliaria: '',
    perfilCliente: '',
    whatsappBroker: '',

    // Proveedor fields (Block D)
    empresaProveedor: '',
    contactoProveedor: '',
    telefonoProveedor: '',
    servicioProveedor: '',
    emailProveedor: ''
  },
  leads: []
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadSavedLeads();
  initOptionCards();
  initFormButtons();
  initModalHandlers();
});

// Load leads from LocalStorage or seed default sample data
function loadSavedLeads() {
  const stored = localStorage.getItem('vv_leads');
  if (stored) {
    try {
      appState.leads = JSON.parse(stored);
    } catch (e) {
      appState.leads = [];
    }
  } else {
    // Seed initial demo data for immediate testing
    appState.leads = [
      {
        id: 'VV-1001',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        nombre: 'Carlos Mendoza',
        whatsapp: '+52 55 1234 5678',
        email: 'carlos.mendoza@example.com',
        arquetipo: 'Comprador Caliente',
        tag: 'hot',
        presupuesto: '$5,000,000 - $6,500,000 MXN',
        horizonte: 'Estoy listo para cerrar ahora',
        formaPago: 'Contado',
        accionGHL: 'Tag "hot" -> SMS instantáneo a Sheyla -> Ficha comercial enviada',
        sla: '< 2 horas'
      },
      {
        id: 'VV-1002',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        nombre: 'Lic. Roberto Gómez',
        whatsapp: '+52 998 876 5432',
        email: 'roberto@gomezrealestate.com',
        arquetipo: 'Broker / Asesor',
        tag: 'broker',
        presupuesto: 'N/A',
        horizonte: 'En los próximos 1-3 meses',
        formaPago: 'Crédito hipotecario',
        accionGHL: 'Tag "broker" -> Flujo de comisiones -> Enviar esquema',
        sla: '< 24 horas'
      },
      {
        id: 'VV-1003',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        nombre: 'Servicios de Iluminación MX',
        whatsapp: '+52 55 9999 8888',
        email: 'ventas@iluminacionmx.com',
        arquetipo: 'Proveedor',
        tag: 'proveedor',
        presupuesto: 'N/A',
        horizonte: 'N/A',
        formaPago: 'N/A',
        accionGHL: 'Tag "proveedor" -> Mensaje cortés -> Sin notificación a ventas',
        sla: 'Sin plazo'
      }
    ];
    saveLeadsToStorage();
  }
}

function saveLeadsToStorage() {
  localStorage.setItem('vv_leads', JSON.stringify(appState.leads));
}

// Option Card Click Handlers
function initOptionCards() {
  document.querySelectorAll('.options-grid').forEach(grid => {
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.option-card');
      if (!card) return;

      // Unselect siblings
      grid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const field = card.dataset.field;
      const value = card.dataset.value;

      if (field) {
        appState.formData[field] = value;
      }

      // Handle Master Role Selection (A1)
      if (field === 'roleOption') {
        const cat = card.dataset.category;
        appState.formData.roleCategory = cat;
        appState.role = cat;
      }
    });
  });
}

// Form Action Buttons Navigation
function initFormButtons() {
  // Step A1 -> Next Step
  document.getElementById('btn-next-A1').addEventListener('click', () => {
    if (!appState.formData.roleOption) {
      alert('Por favor selecciona una opción para continuar.');
      return;
    }
    
    // Route based on role
    if (appState.role === 'comprador') {
      goToStep('B1');
    } else if (appState.role === 'broker') {
      goToStep('C1');
    } else if (appState.role === 'proveedor') {
      goToStep('D1');
    }
  });

  // Comprador Steps
  document.getElementById('btn-next-B1').addEventListener('click', () => {
    if (!appState.formData.intencionUso) {
      alert('Selecciona una opción de intención de uso.');
      return;
    }
    goToStep('B2');
  });

  document.getElementById('btn-back-B1').addEventListener('click', () => goToStep('A1'));

  document.getElementById('btn-next-B2').addEventListener('click', () => {
    if (!appState.formData.horizonteCompra) {
      alert('Selecciona tu horizonte de compra.');
      return;
    }
    goToStep('B3');
  });

  document.getElementById('btn-back-B2').addEventListener('click', () => goToStep('B1'));

  document.getElementById('btn-next-B3').addEventListener('click', () => {
    if (!appState.formData.formaPago) {
      alert('Selecciona tu forma de pago.');
      return;
    }
    goToStep('B4');
  });

  document.getElementById('btn-back-B3').addEventListener('click', () => goToStep('B2'));

  document.getElementById('btn-next-B4').addEventListener('click', () => {
    if (!appState.formData.presupuesto) {
      alert('Selecciona un rango de presupuesto.');
      return;
    }
    goToStep('B5');
  });

  document.getElementById('btn-back-B4').addEventListener('click', () => goToStep('B3'));

  document.getElementById('btn-submit-comprador').addEventListener('click', () => {
    hideErrorBanner('B5');
    const nombre = document.getElementById('comprador-nombre').value.trim();
    const whatsapp = document.getElementById('comprador-whatsapp').value.trim();
    const email = document.getElementById('comprador-email').value.trim();
    const canal = document.getElementById('comprador-canal').value;

    if (!nombre || !whatsapp) {
      showErrorBanner('B5', 'Por favor ingresa tu Nombre completo y Teléfono WhatsApp.');
      return;
    }

    appState.formData.nombreComprador = nombre;
    appState.formData.whatsappComprador = whatsapp;
    appState.formData.emailComprador = email;
    appState.formData.canalContacto = canal;

    processFormSubmission('B5', 'btn-submit-comprador');
  });

  document.getElementById('btn-back-B5').addEventListener('click', () => {
    hideErrorBanner('B5');
    goToStep('B4');
  });

  // Broker Steps
  document.getElementById('btn-next-C1').addEventListener('click', () => {
    const nombre = document.getElementById('broker-nombre').value.trim();
    const email = document.getElementById('broker-email').value.trim();

    if (!nombre || !email) {
      alert('Por favor ingresa tu Nombre y Correo electrónico.');
      return;
    }

    appState.formData.nombreBroker = nombre;
    appState.formData.emailBroker = email;
    goToStep('C2');
  });

  document.getElementById('btn-back-C1').addEventListener('click', () => goToStep('A1'));

  document.getElementById('btn-submit-broker').addEventListener('click', () => {
    hideErrorBanner('C2');
    const inmobiliaria = document.getElementById('broker-inmobiliaria').value.trim();
    const perfil = document.getElementById('broker-perfil').value.trim();
    const whatsapp = document.getElementById('broker-whatsapp').value.trim();

    if (!whatsapp) {
      showErrorBanner('C2', 'Por favor ingresa tu WhatsApp de contacto directo.');
      return;
    }

    appState.formData.tipoInmobiliaria = inmobiliaria || 'Independiente';
    appState.formData.perfilCliente = perfil || 'Cliente interesado en reventa';
    appState.formData.whatsappBroker = whatsapp;

    processFormSubmission('C2', 'btn-submit-broker');
  });

  document.getElementById('btn-back-C2').addEventListener('click', () => {
    hideErrorBanner('C2');
    goToStep('C1');
  });

  // Proveedor Steps
  document.getElementById('btn-submit-proveedor').addEventListener('click', () => {
    hideErrorBanner('D1');
    const empresa = document.getElementById('proveedor-empresa').value.trim();
    const contacto = document.getElementById('proveedor-contacto').value.trim();
    const telefono = document.getElementById('proveedor-telefono').value.trim();
    const email = document.getElementById('proveedor-email').value.trim();
    const servicio = document.getElementById('proveedor-servicio').value.trim();

    if ((!contacto && !empresa) || !telefono) {
      showErrorBanner('D1', 'Por favor ingresa el Nombre del representante y tu Teléfono de contacto.');
      return;
    }

    appState.formData.empresaProveedor = empresa;
    appState.formData.contactoProveedor = contacto || empresa;
    appState.formData.telefonoProveedor = telefono;
    appState.formData.emailProveedor = email;
    appState.formData.servicioProveedor = servicio;

    processFormSubmission('D1', 'btn-submit-proveedor');
  });

  document.getElementById('btn-back-D1').addEventListener('click', () => {
    hideErrorBanner('D1');
    goToStep('A1');
  });

  // Restart Form
  const btnRestart = document.getElementById('btn-restart-form');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      resetForm();
      goToStep('A1');
    });
  }
}

// Navigation Helper
function goToStep(stepId) {
  appState.currentStep = stepId;

  document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`step-${stepId}`);
  if (target) {
    target.classList.add('active');
  }

  updateProgressBar(stepId);
}

// Progress Bar Calculation
function updateProgressBar(stepId) {
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('step-counter-text');

  const stepWeights = {
    'A1': { percent: '15%', label: 'Paso 1 de 5 - Arquetipo Maestro' },
    'B1': { percent: '35%', label: 'Paso 2 de 5 - Intención de Uso' },
    'B2': { percent: '55%', label: 'Paso 3 de 5 - Horizonte de Compra' },
    'B3': { percent: '70%', label: 'Paso 4 de 5 - Forma de Pago' },
    'B4': { percent: '85%', label: 'Paso 5 de 5 - Presupuesto Estimado' },
    'B5': { percent: '95%', label: 'Paso Final - Datos de Contacto' },
    'C1': { percent: '50%', label: 'Perfil de Broker - Datos de Asesor' },
    'C2': { percent: '90%', label: 'Perfil de Broker - Perfil del Cliente' },
    'D1': { percent: '90%', label: 'Registro de Proveedor' },
    'CONFIRMATION': { percent: '100%', label: 'Calificación Completada' }
  };

  const config = stepWeights[stepId] || { percent: '50%', label: 'Paso' };
  fill.style.width = config.percent;
  label.textContent = config.label;
}

// Funciones auxiliares para mostrar/ocultar banners de error en la interfaz
function showErrorBanner(stepId, message) {
  const banner = document.getElementById(`error-banner-${stepId}`);
  if (banner) {
    banner.textContent = message;
    banner.style.display = 'block';
  } else {
    alert(message);
  }
}

function hideErrorBanner(stepId) {
  const banner = document.getElementById(`error-banner-${stepId}`);
  if (banner) {
    banner.style.display = 'none';
    banner.textContent = '';
  }
}

// Construir el payload estrictamente de acuerdo con el DTO del backend
function buildBackendPayload() {
  const d = appState.formData;
  
  const payload = {
    nombre: (d.nombreComprador || d.nombreBroker || d.contactoProveedor || d.empresaProveedor || 'Contacto Villa Vicario').trim(),
    telefono: (d.whatsappComprador || d.whatsappBroker || d.telefonoProveedor || '').trim(),
    rol: d.roleOption || 'comprador', // "comprador" | "familiar" | "inversionista" | "broker" | "proveedor"
    origen: 'web' // Inyección automática de origen "web"
  };

  const email = (d.emailComprador || d.emailBroker || d.emailProveedor || '').trim();
  if (email) {
    payload.email = email;
  }

  if (d.roleCategory === 'comprador') {
    if (d.intencionUso) payload.intencionUso = d.intencionUso;
    if (d.horizonteCompra) payload.horizonteCompra = d.horizonteCompra;
    if (d.formaPago) payload.formaPago = d.formaPago;
    if (d.presupuesto) payload.presupuesto = d.presupuesto;
  }

  if (d.roleCategory === 'broker') {
    if (d.tipoInmobiliaria) payload.inmobiliaria = d.tipoInmobiliaria;
    if (d.perfilCliente) payload.perfilCliente = d.perfilCliente;
  }

  return payload;
}

// GHL Qualification & Routing Algorithm (Cálculo local e integración con respuesta del servidor)
function calculateRoutingResult() {
  const d = appState.formData;
  
  if (d.roleCategory === 'comprador') {
    const isBudgetOk = d.presupuesto !== 'menos_5m';
    const isHorizonHot = d.horizonteCompra === 'ahora' || d.horizonteCompra === '1_3_meses';

    if (!isBudgetOk) {
      return {
        arquetipo: 'Sin Presupuesto',
        tag: 'cold',
        badgeTitle: 'Lead en Lista Fría (Descarte Automático)',
        mensaje: 'Tu perfil ha sido registrado en nuestra base informativa general. Te enviaremos actualizaciones sobre próximas fases o proyectos acordes a tu presupuesto.',
        accionGHL: 'Tag "cold" -> Lista fría -> Sin atención humana directa',
        sla: 'Sin plazo (Automatizado)',
        notificarVentas: false
      };
    } else if (isHorizonHot) {
      return {
        arquetipo: 'Comprador Caliente',
        tag: 'hot',
        badgeTitle: '¡Lead Prioritario Calificado!',
        mensaje: '¡Excelente! Villa Vicario cuenta con unidades activas listas para escrituración. Tu asesor VIP asignado (Sheyla) revisará tu perfil e iniciará contacto directo.',
        accionGHL: 'Tag "hot" -> SMS/Alerta instantánea a Sheyla -> Envío inmediato de Ficha Comercial de Reventa',
        sla: '< 2 Horas',
        notificarVentas: true
      };
    } else {
      return {
        arquetipo: 'Comprador Diferido',
        tag: 'nurture',
        badgeTitle: 'Lead en Nutrición (Nurturing)',
        mensaje: 'Gracias por evaluar Villa Vicario. Estás en fase de exploración y te acompañaremos enviándote reportes de plusvalía y disponibilidad.',
        accionGHL: 'Tag "nurture" -> Secuencia de contenido automatizada + Invitación a activaciones privadas',
        sla: 'Seguimiento Mensual',
        notificarVentas: false
      };
    }
  } else if (d.roleCategory === 'broker') {
    return {
      arquetipo: 'Broker / Asesor Inmobiliario',
      tag: 'broker',
      badgeTitle: 'Solicitud de Broker Aliado Registrada',
      mensaje: 'Hemos capturado tus datos como asesor comercial. Recibirás en tu correo la ficha técnica de las 3 unidades de reventa y la tabla de comisiones.',
      accionGHL: 'Tag "broker" -> Flujo automático de comisiones -> Validación por Sheyla',
      sla: '< 24 Horas',
      notificarVentas: true
    };
  } else if (d.roleCategory === 'proveedor') {
    return {
      arquetipo: 'Proveedor Comercial',
      tag: 'proveedor',
      badgeTitle: 'Canal Oficial de Proveedores',
      mensaje: 'Gracias por tu interés en Villa Vicario. Para propuestas comerciales y portafolios de servicios, por favor envíanos un correo a proveedores@villavicario.com con tu presentación ejecutiva.',
      accionGHL: 'Tag "proveedor" -> Mensaje cortés de cierre -> Sin notificación a ventas',
      sla: 'Sin plazo',
      notificarVentas: false
    };
  }

  return {
    arquetipo: 'Audiencia / General',
    tag: 'audience',
    badgeTitle: 'Registro Recibido',
    mensaje: 'Gracias por contactar a Villa Vicario.',
    accionGHL: 'Tag "audience"',
    sla: 'N/A',
    notificarVentas: false
  };
}

// Process Form Submission con conexión a API Backend y manejo de estados
async function processFormSubmission(stepId = 'B5', btnId = 'btn-submit-comprador') {
  const btn = document.getElementById(btnId);
  const originalText = btn ? btn.innerHTML : 'Enviar Formulario ✨';

  // Bloquear botón de envío temporalmente (prevención de envíos dobles)
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.style.cursor = 'not-allowed';
    btn.innerHTML = 'Enviando al Servidor... ⏳';
  }

  const payload = buildBackendPayload();
  const result = calculateRoutingResult();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 201 || response.ok) {
      let resData = {};
      try {
        resData = await response.json();
      } catch (e) {
        resData = {};
      }

      // Si el objeto devuelto incluye una propiedad mensaje (habitual cuando rol es "proveedor" o reglas del servidor)
      if (resData.mensaje && typeof resData.mensaje === 'string') {
        result.mensaje = resData.mensaje;
      }

      // Si el backend dictamina el tag del lead, sincronizarlo
      if (resData.tag && typeof resData.tag === 'string') {
        result.tag = resData.tag;
      }

      const leadId = resData.lead && resData.lead.id ? resData.lead.id : `VV-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create Lead Object para log local y vista del inspector
      const newLead = {
        id: leadId,
        timestamp: new Date().toISOString(),
        nombre: payload.nombre,
        whatsapp: payload.telefono,
        email: payload.email || 'Sin correo',
        arquetipo: result.arquetipo,
        tag: result.tag,
        presupuesto: getDisplayName(appState.formData.presupuesto),
        horizonte: getDisplayName(appState.formData.horizonteCompra),
        formaPago: getDisplayName(appState.formData.formaPago),
        accionGHL: result.accionGHL,
        sla: result.sla,
        payloadSent: payload,
        rawDetails: { ...appState.formData }
      };

      appState.leads.unshift(newLead);
      saveLeadsToStorage();

      renderConfirmationScreen(result, newLead);
      goToStep('CONFIRMATION');
    } else if (response.status === 409) {
      // Teléfono duplicado
      showErrorBanner(stepId, 'Este número de teléfono ya se encuentra registrado. Por favor, verifica tus datos o comunícate con un asesor.');
    } else if (response.status === 400) {
      // Errores de validación del servidor
      showErrorBanner(stepId, 'Hubo un error de validación en los datos ingresados. Por favor revisa que el formato del correo y teléfono sean correctos o reintenta más tarde.');
    } else {
      // Otros fallos del servidor (500 / Disconexión)
      showErrorBanner(stepId, `Ocurrió un problema en el servidor (HTTP ${response.status}). Por favor revisa la información ingresada o reintenta más tarde.`);
    }
  } catch (error) {
    // Fallos de red (Servidor desconectado / CORS / Sin internet)
    console.error('Error de red al conectar con el backend:', error);
    showErrorBanner(stepId, 'No fue posible conectar con el servidor. Verifica tu conexión a internet o reintenta más tarde.');
  } finally {
    // Desbloquear botón y restaurar estado
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.innerHTML = originalText;
    }
  }
}

function renderConfirmationScreen(res, lead) {
  const container = document.getElementById('confirmation-box');

  let iconClass = res.tag;
  let iconSymbol = '✓';
  if (res.tag === 'hot') iconSymbol = '🔥';
  if (res.tag === 'broker') iconSymbol = '🤝';
  if (res.tag === 'proveedor') iconSymbol = '💼';

  container.innerHTML = `
    <div class="confirmation-container">
      <div class="confirmation-icon ${iconClass}">${iconSymbol}</div>
      <span class="archetype-tag ${res.tag}">Tag GHL: ${res.tag.toUpperCase()}</span>
      <h2 class="step-title">${res.badgeTitle}</h2>
      <p class="step-subtitle" style="max-width: 600px; margin: 0 auto 1.5rem;">${res.mensaje}</p>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.2); padding: 1.25rem; border-radius: 12px; max-width: 550px; margin: 0 auto 1.5rem; text-align: left; font-size: 0.875rem;">
        <div style="color: var(--accent-gold); font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em;">
          ⚙️ Enrutamiento Automatizado GHL
        </div>
        <div style="margin-bottom: 0.3rem;"><strong>ID Lead:</strong> ${lead.id}</div>
        <div style="margin-bottom: 0.3rem;"><strong>Acción en GHL:</strong> ${res.accionGHL}</div>
        <div><strong>Tiempo de Respuesta (SLA):</strong> <span style="color: var(--accent-gold); font-weight: 600;">${res.sla}</span></div>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button id="btn-restart-inner" class="btn-secondary">Llenar otro formulario</button>
        <button id="btn-view-payload" class="btn-primary">Ver Payload Webhook GHL ⚡</button>
      </div>
    </div>
  `;

  document.getElementById('btn-restart-inner').addEventListener('click', () => {
    resetForm();
    goToStep('A1');
  });

  document.getElementById('btn-view-payload').addEventListener('click', () => {
    showGHLPayloadModal(lead, res);
  });
}

function resetForm() {
  appState.role = null;
  appState.formData = {
    roleOption: '',
    roleCategory: '',
    intencionUso: '',
    horizonteCompra: '',
    formaPago: '',
    presupuesto: '',
    nombreComprador: '',
    whatsappComprador: '',
    emailComprador: '',
    canalContacto: '',
    nombreBroker: '',
    emailBroker: '',
    tipoInmobiliaria: '',
    perfilCliente: '',
    whatsappBroker: '',
    empresaProveedor: '',
    contactoProveedor: '',
    telefonoProveedor: '',
    servicioProveedor: '',
    emailProveedor: ''
  };

  hideErrorBanner('B5');
  hideErrorBanner('C2');
  hideErrorBanner('D1');

  document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(i => i.value = '');
}

// Modal Handlers (Admin Dashboard & GHL Inspector)
function initModalHandlers() {
  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('modal-close-btn');

  closeBtn.addEventListener('click', () => backdrop.classList.remove('open'));
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.classList.remove('open');
  });

  // Admin Dashboard Button
  document.getElementById('nav-admin-btn').addEventListener('click', () => {
    openAdminDashboard();
  });

  // View GHL Spec Button
  document.getElementById('nav-spec-btn').addEventListener('click', () => {
    openGHLSpecModal();
  });
}

function showGHLPayloadModal(lead, res) {
  const backdrop = document.getElementById('modal-backdrop');
  const title = document.getElementById('modal-title-text');
  const body = document.getElementById('modal-body-container');

  title.innerHTML = `⚡ Payloads del Backend & Webhook GHL`;

  const backendPayload = lead.payloadSent || {
    nombre: lead.nombre,
    telefono: lead.whatsapp,
    email: lead.email !== 'Sin correo' ? lead.email : undefined,
    rol: lead.rawDetails?.roleOption || 'comprador',
    origen: "web",
    intencionUso: lead.rawDetails?.intencionUso,
    horizonteCompra: lead.rawDetails?.horizonteCompra,
    formaPago: lead.rawDetails?.formaPago,
    presupuesto: lead.rawDetails?.presupuesto
  };

  const ghlWebhookData = {
    event: "contact_created_or_updated",
    locationId: GHL_LOCATION_ID,
    timestamp: lead.timestamp,
    contact: {
      id: lead.id,
      name: lead.nombre,
      phone: lead.whatsapp,
      email: lead.email,
      tags: [lead.tag, "origen_web", "villa_vicario_reventa"],
      customFields: {
        arquetipo: lead.arquetipo,
        intencion_uso: getDisplayName(lead.rawDetails?.intencionUso),
        horizonte_compra: getDisplayName(lead.rawDetails?.horizonteCompra),
        forma_pago: getDisplayName(lead.rawDetails?.formaPago),
        presupuesto_aprox: getDisplayName(lead.rawDetails?.presupuesto),
        canal_preferido: lead.rawDetails?.canalContacto || "WhatsApp",
        perfil_broker: lead.rawDetails?.perfilCliente || "N/A",
        empresa_proveedor: lead.rawDetails?.empresaProveedor || "N/A"
      }
    },
    routingEngine: {
      tagAsignado: lead.tag,
      notificarAgente: res.notificarVentas,
      agenteAsignado: res.notificarVentas ? "Sheyla (Ventas VIP Villa Vicario)" : "Ninguno (Automatizado)",
      accionGHL: res.accionGHL,
      slaObjetivo: res.sla
    }
  };

  body.innerHTML = `
    <h4 style="color: var(--accent-gold); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
      1. Payload HTTP POST Transmitido al Backend (/qualification/submit)
    </h4>
    <pre class="json-code" style="margin-bottom: 1.5rem;">${JSON.stringify(backendPayload, null, 2)}</pre>

    <h4 style="color: var(--accent-gold); font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">
      2. Evento Webhook hacia GoHighLevel (GHL)
    </h4>
    <pre class="json-code">${JSON.stringify(ghlWebhookData, null, 2)}</pre>
  `;

  backdrop.classList.add('open');
}

function openAdminDashboard() {
  const backdrop = document.getElementById('modal-backdrop');
  const title = document.getElementById('modal-title-text');
  const body = document.getElementById('modal-body-container');

  title.innerHTML = `📊 Panel de Control de Leads Registrados (GHL Log)`;

  const total = appState.leads.length;
  const hotCount = appState.leads.filter(l => l.tag === 'hot').length;
  const nurtureCount = appState.leads.filter(l => l.tag === 'nurture').length;
  const brokerCount = appState.leads.filter(l => l.tag === 'broker').length;
  const coldCount = appState.leads.filter(l => l.tag === 'cold').length;
  const provCount = appState.leads.filter(l => l.tag === 'proveedor').length;

  let tableRows = appState.leads.map(l => `
    <tr>
      <td><strong>${l.id}</strong></td>
      <td>${l.nombre}</td>
      <td><span class="archetype-tag ${l.tag}">${l.tag.toUpperCase()}</span></td>
      <td>${l.presupuesto}</td>
      <td>${l.horizonte}</td>
      <td>${l.whatsapp}</td>
      <td>${l.sla}</td>
    </tr>
  `).join('');

  body.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Total Leads</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#f87171">${hotCount}</div><div class="stat-lbl">Hot Leads</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#60a5fa">${nurtureCount}</div><div class="stat-lbl">Nurture</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#c084fc">${brokerCount}</div><div class="stat-lbl">Brokers</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#94a3b8">${coldCount}</div><div class="stat-lbl">Cold / Fríos</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#facc15">${provCount}</div><div class="stat-lbl">Proveedores</div></div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h4 style="color: var(--accent-gold-light); font-size: 0.95rem;">Registro de Capturas Recientes</h4>
      <div style="display: flex; gap: 0.5rem;">
        <button id="btn-export-csv" class="btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">📥 Exportar CSV</button>
        <button id="btn-clear-leads" class="btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.8rem; border-color: rgba(239,68,68,0.4); color: #f87171;">🗑️ Limpiar Log</button>
      </div>
    </div>

    <div class="table-container">
      <table class="leads-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tag GHL</th>
            <th>Presupuesto</th>
            <th>Horizonte</th>
            <th>WhatsApp</th>
            <th>SLA</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.length ? tableRows : '<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No hay leads registrados aún.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-export-csv').addEventListener('click', exportLeadsCSV);
  document.getElementById('btn-clear-leads').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas borrar los leads registrados localmente?')) {
      appState.leads = [];
      saveLeadsToStorage();
      openAdminDashboard();
    }
  });

  backdrop.classList.add('open');
}

function openGHLSpecModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const title = document.getElementById('modal-title-text');
  const body = document.getElementById('modal-body-container');

  title.innerHTML = `📜 Reglas de Enrutamiento & Arquitectura Villa Vicario`;

  body.innerHTML = `
    <div style="color: var(--text-primary); line-height: 1.7; font-size: 0.9rem;">
      <h3 style="color: var(--accent-gold); margin-bottom: 0.5rem;">Contexto del Proyecto</h3>
      <p style="margin-bottom: 1rem;">
        Villa Vicario cuenta con <strong>3 unidades disponibles de reventa</strong> (2 reventas + 1 de la hermana), con un <strong>piso de precio de $5,000,000 MXN</strong>.
        El formulario pre-filtra el 60-70% del ruido de IG/FB antes de requerir atención humana.
      </p>

      <h3 style="color: var(--accent-gold); margin-bottom: 0.5rem;">Matriz de Tags y Acciones en GoHighLevel</h3>
      <table class="leads-table" style="margin-bottom: 1.5rem;">
        <thead>
          <tr>
            <th>Arquetipo</th>
            <th>Detección (Regla)</th>
            <th>Acción GHL</th>
            <th>SLA / Responsable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color: #f87171;">Comprador Caliente</strong></td>
            <td>Rol 1-3 + Horizonte Ahora/1-3m + Presupuesto &ge; $5M</td>
            <td>Tag "hot" &rarr; SMS instantáneo a Sheyla &rarr; Enviar Ficha</td>
            <td>&lt; 2 Horas (Sheyla)</td>
          </tr>
          <tr>
            <td><strong style="color: #60a5fa;">Comprador Diferido</strong></td>
            <td>Presupuesto OK (&ge; $5M) pero Horizonte "Explorando"</td>
            <td>Tag "nurture" &rarr; Secuencia de contenido mensual</td>
            <td>Automatizado</td>
          </tr>
          <tr>
            <td><strong style="color: #c084fc;">Broker / Asesor</strong></td>
            <td>Rol 4 ("Soy asesor / broker")</td>
            <td>Tag "broker" &rarr; Flujo de comisiones + Ficha comercial</td>
            <td>&lt; 24 Horas (Sheyla)</td>
          </tr>
          <tr>
            <td><strong style="color: #94a3b8;">Sin Presupuesto</strong></td>
            <td>Presupuesto &lt; $5,000,000 MXN</td>
            <td>Tag "cold" &rarr; Lista fría sin atención humana</td>
            <td>Sin plazo</td>
          </tr>
          <tr>
            <td><strong style="color: #facc15;">Proveedor</strong></td>
            <td>Rol 5 ("Ofrezco producto/servicio")</td>
            <td>Tag "proveedor" &rarr; Mensaje cortés de descarte</td>
            <td>Sin plazo</td>
          </tr>
        </tbody>
      </table>

      <h3 style="color: var(--accent-gold); margin-bottom: 0.5rem;">Principios de Diseño Aplicados</h3>
      <ul style="padding-left: 1.25rem; margin-bottom: 1rem; color: var(--text-secondary);">
        <li><strong>Orden por fricción ascendente:</strong> La pregunta maestro A1 va primero para hacer el 50% del triaje. Presupuesto y contacto al final.</li>
        <li><strong>Ramificación real:</strong> El proveedor y broker nunca ven las preguntas exclusivas de comprador. Cada rol solo ve su rama.</li>
        <li><strong>Descarte elegante:</strong> La opción "Menos de $5M" se mantiene a propósito para evitar que los leads sin presupuesto mientan en el formulario.</li>
      </ul>
    </div>
  `;

  backdrop.classList.add('open');
}

function exportLeadsCSV() {
  if (!appState.leads.length) {
    alert('No hay leads para exportar.');
    return;
  }

  const headers = ['ID', 'Timestamp', 'Nombre', 'WhatsApp', 'Email', 'Arquetipo', 'Tag_GHL', 'Presupuesto', 'Horizonte', 'FormaPago', 'AccionGHL', 'SLA'];
  const rows = appState.leads.map(l => [
    l.id,
    l.timestamp,
    `"${l.nombre}"`,
    `"${l.whatsapp}"`,
    `"${l.email}"`,
    `"${l.arquetipo}"`,
    l.tag,
    `"${l.presupuesto}"`,
    `"${l.horizonte}"`,
    `"${l.formaPago}"`,
    `"${l.accionGHL}"`,
    `"${l.sla}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `leads_villa_vicario_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

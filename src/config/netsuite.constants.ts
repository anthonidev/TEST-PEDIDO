// src/config/netsuite.constants.ts

export const NETSUITE_CONSTANTS = {
  // Configuraciones de Moneda
  CURRENCY: {
    DEFAULT_ID: '1', // Soles
  },

  // Modos de pago
  PAYMENT: {
    NS_MED_PAGO_PE_ID: '22', // Otros medios de pago
  },

  // Tipos de pedido
  ORDER_TYPE: {
    TIPO_DE_PEDIDO_ID: '1', // R. REGULAR
  },

  // Formularios
  FORMS: {
    CUSTOM_FORM_ID: '157', // PE Orden de venta
  },

  // Departamentos
  DEPARTMENTS: {
    VENTA_DIRECTA_ID: '2', // Venta Directa : Directora
  },

  // Modos de manejo
  HANDLING: {
    SAVE_ONLY_ID: 'SAVE_ONLY', // Guardar solamente
  },

  // Entidades
  ENTITIES: {
    CUSTOMER_ID: '316', // D000000001
  },

  // Items y compromisos
  INVENTORY: {
    COMMIT_INVENTORY_ID: '1', // Cantidad disponible
  },

  // Segmentos personalizados
  CUSTOM_SEGMENTS: {
    CSEG1_ID_1: '1', // 1
    CSEG1_ID_2: '2', // 2
    CSEG2_ID_7: '7', // 7
    CSEG2_ID_4: '4', // 4
    CSEG3_ID_1: '1', // 1
    CSEG4_ID_3: '3', // 3
    CSEG4_ID_4: '4', // 4
    CSEG5_ID_403: '403', // 403
    CSEG5_ID_411: '411', // 411
  },

  // Impuestos
  TAX: {
    NS_AFEC_IGV_ID: '1', // Gravado - Operacion Onerosa
    NS_TAXCODE_ID: '6',
  },

  // Items
  ITEMS: {
    ITEM_TYPE_INVTPART: 'InvtPart', // InvtPart
  },

  // Ubicaciones
  LOCATIONS: {
    CENTRO_LOGISTICO_ID: '112', // Centro Logistico Carapongo : Almacen de Disponible
  },

  // Subsidiarias
  SUBSIDIARIES: {
    SOKSO_ID: '2', // SOKSO
  },

  // Términos
  TERMS: {
    CREDITO_120_DIAS_ID: '24', // Crédito a 120 días
  },

  // Unidades
  UNITS: {
    STOCK_UNIT: {
      PAR: '6',
      UNIT: '4',
    },
    UNIT_MEASURE_CODE: {
      PAR: 'PR',
      UNIT: 'NIU',
    },
  }
};
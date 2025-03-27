import { NETSUITE_CONSTANTS } from "@/config/netsuite.constants";
import { SalesOrderInput } from "./dto/sales-order.netsuite.dto";

export function createSalesOrderStructure(input: SalesOrderInput) {
  return {
    // billAddress: input.billAddress.address,
    billAddressList: {
      id: input.billAddress.addressListId,
    },
    canBeUnapproved: true,
    canHaveStackable: false,
    createdDate: new Date().toISOString(),
    currency: {
      id: NETSUITE_CONSTANTS.CURRENCY.DEFAULT_ID,
    },
    custbody_15699_exclude_from_ep_process: false,
    custbody_ns_med_pago_pe: {
      id: NETSUITE_CONSTANTS.PAYMENT.NS_MED_PAGO_PE_ID,
    },
    custbody_wmsse_codflag: false,
    custbody_sii_article_61d: false,
    custbody_sii_article_72_73: false,
    custbody_sii_is_third_party: false,
    custbody_sii_not_reported_in_time: false,
    // custbodycierre_pedido: '2025-01-27',
    custbodytipodepedido: {
      id: NETSUITE_CONSTANTS.ORDER_TYPE.TIPO_DE_PEDIDO_ID,
    },
    customForm: {
      id: NETSUITE_CONSTANTS.FORMS.CUSTOM_FORM_ID,
    },
    department: {
      id: NETSUITE_CONSTANTS.DEPARTMENTS.VENTA_DIRECTA_ID,
    },
    discountTotal: 0,
    email: input.email,
    entity: {
      id: NETSUITE_CONSTANTS.ENTITIES.CUSTOMER_ID,
    },
    exchangeRate: 1,
    handlingMode: {
      id: NETSUITE_CONSTANTS.HANDLING.SAVE_ONLY_ID,
    },
    item: {
      count: input.items.length,
      hasMore: false,
      items: input.items.map((item, index) => ({
        amount: item.amount,
        commitInventory: {
          id: NETSUITE_CONSTANTS.INVENTORY.COMMIT_INVENTORY_ID,
        },
        commitmentFirm: false,
        cseg1: {
          id: item.cseg1Id
        },
        cseg2: {
          id: item.cseg1Id
        },
        cseg3: {
          id: item.cseg1Id
        },
        cseg4: {
          id: item.cseg1Id
        },
        cseg5: {
          id: item.cseg1Id
        },
        custcol_2663_isperson: false,
        custcol_5892_eutriangulation: false,
        custcol_estrella: item.custcol_estrella,
        // custcol_id_detalle: item.custcol_id_detalle,
        custcol_ns_afec_igv: {
          id: NETSUITE_CONSTANTS.TAX.NS_AFEC_IGV_ID,
        },
        custcol_ns_es_icbp: false,
        custcol_ns_ispretax: false,
        custcol_ns_ln_percep: false,
        custcol_ns_ln_recargo_consumo: false,
        custcol_ns_pe_anticipo: false,
        custcol_ns_pe_um: item.isPair
          ? NETSUITE_CONSTANTS.UNITS.UNIT_MEASURE_CODE.PAR
          : NETSUITE_CONSTANTS.UNITS.UNIT_MEASURE_CODE.UNIT,
        custcol_ns_taxcode_id: NETSUITE_CONSTANTS.TAX.NS_TAXCODE_ID,
        custcol_pvs: item.custcol_pvs,
        custcol_statistical_value_base_curr: 0,
        custcolprecio_estrella: item.custcolprecio_estrella,
        description: item.description,
        excludeFromPredictiveRisk: false,
        excludeFromRateRequest: false,
        isClosed: false,
        isOpen: true,
        item: {
          id: item.itemId,
        },
        itemType: {
          id: NETSUITE_CONSTANTS.ITEMS.ITEM_TYPE_INVTPART,
        },
        // line: index + 1,
        linked: false,
        marginal: false,
        price: {
          id: item.priceId,
        },
        printItems: false,
        quantity: item.quantity,
        quantityAvailable: 0,
        quantityBackOrdered: item.quantity,
        quantityBilled: 0,
        quantityCommitted: 0,
        quantityFulfilled: 0,
        rate: item.rate,
        // rateSchedule: item.rateSchedule,
        units: item.isPair
          ? NETSUITE_CONSTANTS.UNITS.STOCK_UNIT.PAR
          : NETSUITE_CONSTANTS.UNITS.STOCK_UNIT.UNIT,
      })),
      offset: 0,
      totalResults: input.items.length,
    },
    location: {
      id: NETSUITE_CONSTANTS.LOCATIONS.CENTRO_LOGISTICO_ID,
    },
    needsPick: true,
    // nextBill: '2025-01-27',
    // prevDate: '2025-01-27',
    // prevRep: 22,
    // salesEffectiveDate: '2025-01-27',
    salesRep: {
      id: input.salesRepId,
    },
    // shipAddress: input.shipAddress.address,
    shipAddressList: {
      id: input.shipAddress.addressListId,
    },
    shipComplete: false,
    // shipDate: '2025-01-27',
    shipIsResidential: false,
    shipOverride: false,
    // shippingAddress_text: input.shipAddress.address,
    subsidiary: {
      id: NETSUITE_CONSTANTS.SUBSIDIARIES.SOKSO_ID,
    },
    subtotal: input.subtotal,
    terms: {
      id: NETSUITE_CONSTANTS.TERMS.CREDITO_120_DIAS_ID,
    },
    toBeEmailed: false,
    toBeFaxed: false,
    toBePrinted: false,
    total: input.total,
    // tranDate: new Date().toISOString(),
    // tranId: '11c',
    webStore: 'F',
  };
}
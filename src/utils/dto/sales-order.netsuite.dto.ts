// src/dto/sales-order.dto.ts

export interface AddressInfo {
  address?: string;
  addressListId: string;
}

export interface ItemDetail {
  itemId: string;
  description: string;
  quantity: number;
  rate: number;
  // units: string;
  priceId: string;
  cseg1Id: string;
  cseg2Id: string;
  cseg3Id: string;
  cseg4Id: string;
  cseg5Id: string;
  custcolprecio_estrella: number;
  custcol_pvs: number;
  isPair: boolean;
  // custcol_ns_pe_um: string;
  // custcol_ns_json_um: string;
  custcol_estrella: string;
  // custcol_id_detalle: number;
  amount: number;
}

export interface SalesOrderInput {
  email: string;
  billAddress: AddressInfo;
  shipAddress: AddressInfo;
  subtotal: number;
  total: number;
  salesRepId: string;
  items: ItemDetail[];
}
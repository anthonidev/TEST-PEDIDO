// npx ts-node -r tsconfig-paths/register src/utils/sales-order.example.netsuite.ts

import { SalesOrderInput } from './dto/sales-order.netsuite.dto';
import { createSalesOrderStructure } from './sales-order.netsuite';

// Example input for createSalesOrderStructure
const sampleInput: SalesOrderInput = {
  email: 'grisell.ayacucho.sokso@gmail.com',
  billAddress: {
    addressListId: '302', // Jr bellido 184
  },
  shipAddress: {
    addressListId: '302', // Jr bellido 184
  },
  subtotal: 167,
  total: 197.06,
  salesRepId: '22',
  items: [
    {
      itemId: '277', // TIM-094 : TIM-094AZUL37 TIM-094
      description: 'SANDALIAS PL TIJERA SOKSO TIM-094',
      quantity: 2,
      rate: 49,
      // rateSchedule: '0\u000549.00',
      priceId: '7', // REGDAM2025SK01_CF
      cseg1Id: '1',
      cseg2Id: '1',
      cseg3Id: '1',
      cseg4Id: '1',
      cseg5Id: '1',
      custcolprecio_estrella: 55,
      custcol_pvs: 99,
      isPair: true,
      // custcol_ns_json_um: 'Par',
      custcol_estrella: 'E000000111',
      // custcol_id_detalle: 1001,
      amount: 98,
    },
    {
      itemId: '325', // QTE-126 : QTE-126NEGRO42 QTE-126,
      description: 'ZAPATILLAS PR URBAN CREEDS QTE-126',
      quantity: 1,
      rate: 69,
      // rateSchedule: '0\u000569.00',
      priceId: '9', // REGCAB2025VR01-CF
      cseg1Id: '1',
      cseg2Id: '1',
      cseg3Id: '1',
      cseg4Id: '1',
      cseg5Id: '1',
      custcolprecio_estrella: 79,
      custcol_pvs: 109,
      isPair: true,
      // custcol_ns_json_um: 'Par',
      custcol_estrella: 'E000000111',
      // custcol_id_detalle: 1002,
      amount: 69,
    },
  ],
};

// Create the sales order structure using the input

console.log(sampleInput);
const salesOrderData = createSalesOrderStructure(sampleInput);
console.dir(salesOrderData, { depth: null });

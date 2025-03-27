export interface PedidoEstrellaResponse {
    sNumeroPedido: string;
    dFechaApertura: Date | null;
    nTotalCompra: number;
    nSumaPrecioSugerido: number;
    nTotalPaquetes: number;
    nTotalDespachados: number;
    nGanancia: number;
}

export interface IDetalleArticulo {
    nIdArticulo: number;
    sSkuHijo: string;
    sSkuPadre: string;
    sNetsuiteId: string;
    sDescripcion: string;
    sModelo: string;
    sColor: string;
    sTalla: string;
    pricesConfig: {
        nPvs: number;
        nPrecioDirector: number;
        nPrecioPromotor: number;
        nPrecioColaborador: number;
    };
    stock: {
        stockDisponible: number;
        stockReservado: number;
        stockConfirmado: number;
        stockReal: number;
    };
    catalogoPadre: {
        codigo: string;
        descripcion: string;
        nombreComercial: string;
        tipo: string;
    };
}

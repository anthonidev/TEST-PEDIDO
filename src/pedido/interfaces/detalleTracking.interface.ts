export interface ProductoDetalle {
    sSkuProducto: string;
    sArticuloId: number;
    sNivelPrecioId: string;
    sDepartamentoId: string;
    sUbicacionId: string;
    sClaseId: string;
    sCodigoUm: string;
    detalles: any;
}

export interface EstadoProducto {
    nCantidadComprometida: number;
    nCantidadDespachada: number;
    sAccionDirectora: string | null;
    dtFechaAccionDirectora: string | null;
    bEsBonificacion: boolean;
}

export interface DetalleTrackingResponse {
    nCantidad: number;
    nPrecioEstrella: number;
    nPrecioSugerido: number;
    dtFechaPedidoDetalle: Date | null;
    dtFechaConfirmacion: Date | null;
    producto: ProductoDetalle;
    estado: EstadoProducto;
}

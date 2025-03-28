export interface PedidoDetalleAgrupado {
    id: string;
    linea: number;
    cantidad: number;
    precio: number;
    fecha: Date;
    hora: string;
    datosItem: ProductoExtendido;
    datosEstrella: DatosEstrellaExtendida;
    sAccionDirectora?: string; // Estado de confirmación/rechazo
    fechaAccion?: string; // Fecha de la acción
}

export interface ProductoExtendido {
    descripcion: string;
    modelo: string;
    urlEcommerce: string;
    imagen: string | null;
    idModelo: number;
    color: string;
    talla: string;
    sku?: string;
    categoria?: string;
    tipoCatalogo?: string;
    stockDisponible?: number;
    stockReservado?: number;
    precioSugerido?: number;
}

export interface DatosEstrellaExtendida {
    nIdCliente: number;
    sNombre: string;
    sApellidos: string;
    sNumeroCelular: string;
    email?: string;
    direccion?: string;
    nivel?: string;
    zona?: string;
    fechaRegistro?: Date;
}

export interface DatosProducto {
    sDescripcion: string;
    sModelo: string;
    sColor: string;
    sTalla: string;
    sSkuHijo?: string;
    tipoCatalogo?: string;
    sUrlEcommerce?: string;
    nIdModelo?: number;
    categoria?: string;
    imagenes?: {
        nIdImagen: number;
        sNombreArchivo: string;
    }[];
    stock?: {
        stockDisponible: number;
        stockReservado: number;
        stockConfirmado: number;
        stockReal: number;
    };
    pricesConfig?: {
        nPvs: number;
        nPrecioDirector: number;
        nPrecioPromotor: number;
        nPrecioColaborador: number;
    };
}

export interface DatosEstrella {
    nIdCliente: number;
    sNombre: string;
    sApellidos: string;
    sNumeroCelular: string;
    email?: string;
    direccion?: string;
    nivel?: string;
    zona?: string;
    fechaRegistro?: Date;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    metadata?: {
        estados: string[];
        tiposCatalogo: string[];
        filtrosAplicados: {
            estado: string | null;
            tipoCatalogo: string | null;
        };
    };
}

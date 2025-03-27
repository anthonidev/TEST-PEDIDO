export interface PedidoDetalleAgrupado {
    id: string;
    linea: number;
    cantidad: number;
    precio: number;
    fecha: Date;
    hora: string;
    datosItem: {};
    datosEstrella: {};
}

export interface DatosProducto {
    sDescripcion: string;
    sModelo: string;
    sColor: string;
    sTalla: string;
}

export interface DatosEstrella {
    nIdCliente: number;
    sNombre: string;
    sApellidos: string;
    sNumeroCelular: string;
}

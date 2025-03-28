export enum EstadoPedido {
    CONFIRMADO = 'CONFIRMADO',
    RECHAZADO = 'RECHAZADO',
    POR_CONFIRMAR = 'POR_CONFIRMAR', // Pedidos pendientes de confirmación
}

export function getEstadosPosibles(): string[] {
    return Object.values(EstadoPedido);
}

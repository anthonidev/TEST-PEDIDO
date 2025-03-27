import { Controller, Get, Param, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AccionesDirectoraService } from './accionesDirectora.service';

@Controller()
export class AccionesDirectoraController {
    constructor(
        private readonly gestionPedidosService: AccionesDirectoraService,
    ) {}

    // Confirmar/Rechazar un pedido por ID
    @MessagePattern({ cmd: 'pedido.accion.PorId' })
    async confirmarRechazarPedido(
        @Payload()
        data: {
            pedidoId: string;
            action: 'CONFIRMADO' | 'RECHAZADO';
            directoraId: number;
        },
    ) {
        return this.gestionPedidosService.approveOrRejectOrder(
            data.pedidoId,
            data.action,
            data.directoraId,
        );
    }

    // Confirmar/Rechazar todos los pedidos de una estrella
    @MessagePattern({ cmd: 'pedido.accion.PorEstrella' })
    async confirmarRechazarPorEstrella(
        @Payload()
        data: {
            estrellaId: number;
            action: 'CONFIRMADO' | 'RECHAZADO';
            directoraId: number;
        },
    ) {
        return this.gestionPedidosService.approveOrRejectOrdersByStar(
            data.estrellaId,
            data.action,
            data.directoraId,
        );
    }

    // Confirmar todos los pedidos de un tipo de operación (REGULAR, PREVENTA, CYBER)
    @MessagePattern({ cmd: 'pedido.accion.PorTipoOperacion' })
    async confirmarPorTipoOperacion(
        @Payload() data: { tipoOperacion: string; directoraId: number },
    ) {
        return this.gestionPedidosService.approveOrdersByOperationType(
            data.tipoOperacion,
            data.directoraId,
        );
    }
}

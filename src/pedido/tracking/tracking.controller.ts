import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { PedidoService } from '@/pedido/pedido.service';
import { TrackingService } from './trackingServices.service';

@Controller()
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) {}

    @MessagePattern({ cmd: 'pedidos.tracking.registrar' })
    async registrarTracking(@Payload() payload: { data: any }) {
        return this.trackingService.registrarTracking(
            payload.data['N° PEDIDO'],
            payload.data['CD'],
            payload.data['STATUS'],
        );
    }

    @MessagePattern({ cmd: 'pedidos.tracking.registrarMasivo' })
    async registrarTrackingMasivo(@Payload() payload: { data: any[] }) {
        return this.trackingService.registrarTrackingMasivo(payload.data);
    }

    @MessagePattern({ cmd: 'pedidos.tracking.porPedidoCabecera' })
    async obtenerTrackingPorPedido(data: { sNumeroPedido: string }) {
        return this.trackingService.obtenerTrackingPorPedido(
            data.sNumeroPedido,
        );
    }
}

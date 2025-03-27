import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GestionPedidosService } from './gestionPedidos.service';
import { PedidoDetalleAgrupado } from './interface/gestionPedidos.response.interface';

@Controller()
export class GestionarPedidosController {
    constructor(private readonly gestonPedidos: GestionPedidosService) {}

    // Definir el patrón de mensaje para recibir las solicitudes de la directora
    @MessagePattern('pedidos.gestion.PedidosDirectora')
    async getPedidosPorDirectora(@Payload() directoraId: number) {
        return this.gestonPedidos.getPedidosPorDirectora(directoraId);
    }
}

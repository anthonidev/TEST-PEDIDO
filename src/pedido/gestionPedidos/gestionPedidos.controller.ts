import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GestionPedidosService } from './gestionPedidos.service';
import { PedidoDetalleAgrupado } from './interface/gestionPedidos.response.interface';
interface PedidosDirectoraParams {
    directoraId: number;
    estado?: string;
    tipoCatalogo?: string;
    page?: number;
    limit?: number;
}
@Controller()
export class GestionarPedidosController {
    constructor(private readonly gestonPedidos: GestionPedidosService) {}

    // Definir el patrón de mensaje para recibir las solicitudes de la directora
    @MessagePattern('pedidos.gestion.PedidosDirectora')
    async getPedidosPorDirectora(@Payload() params: PedidosDirectoraParams) {
        return this.gestonPedidos.getPedidosPorDirectora(
            params.directoraId,
            params.estado,
            params.tipoCatalogo,
            params.page,
            params.limit,
        );
    }
}

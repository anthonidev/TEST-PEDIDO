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
import { ConfiguracionCierreService } from './configCortesPedidos.service';
import { AccionesDirectoraService } from './accionesDirectora/accionesDirectora.service';

@Controller()
export class PedidoController {
    constructor(
        private readonly pedidoService: PedidoService,
        private readonly configu: ConfiguracionCierreService,
        private readonly gestionPedidosService: AccionesDirectoraService,
    ) {}

    @MessagePattern({ cmd: 'pedidos.pedido.obtenerArticulo' })
    async obtenerPorId(@Payload() payload: { nIdArticulo: number }) {
        return this.pedidoService.listarProductosPorId(payload.nIdArticulo);
    }

    @MessagePattern({ cmd: 'pedidos.pedido.crear' })
    async crearPedido(@Payload() payload: { pedidoData: any }) {
        return this.pedidoService.crearPedido(payload.pedidoData);
    }

    @MessagePattern({ cmd: 'pedidos.pedido.listar' })
    async listarPedidos() {
        return this.pedidoService.obtenerPedidosConDetalles();
    }

    @MessagePattern({ cmd: 'pedidos.pedido.filtro' })
    async listarPedidosFiltro(
        @Payload()
        payload: {
            fechaDesde?: string;
            fechaHasta?: string;
            sDirectoraId?: string;
        },
    ) {
        return this.pedidoService.listarPedidosConFiltros(
            payload.fechaDesde,
            payload.fechaHasta,
            payload.sDirectoraId,
        );
    }

    @MessagePattern({ cmd: 'pedidos.pedido.pedidoMasivo' })
    async crearPedidoMasivo(@Payload() payload: { data: any }) {
        return this.pedidoService.cargarPedidosMasivos(payload.data);
    }
    @MessagePattern({ cmd: 'pedidos.pedido.cierreBolsas' })
    async cortesManuales(@Payload() payload: { data: any }) {
        return this.configu.actualizarConfiguracionesCierre();
    }

    @MessagePattern({ cmd: 'pedidos.pedidos.listarCortes' })
    async listarDirectorasCortes() {
        return this.pedidoService.listarCortes();
    }

    @MessagePattern({ cmd: 'pedidos.pedidos.porEstrellasId' })
    async obtenerPedidosPorEstrella(data: {
        sEstrellaId: string;
        nAnio?: number;
        nMes?: number;
        sCodigoProducto?: string;
    }) {
        return this.pedidoService.obtenerPedidosPorEstrella(
            data.sEstrellaId,
            data.nAnio,
            data.nMes,
            data.sCodigoProducto,
        );
    }

    @MessagePattern({ cmd: 'pedidos.pedido.cerrarBolsaPorPedido' })
    async cerrarBolsaPorPedidoId(data: { sNumeroPedido: string }) {
        return this.pedidoService.cerrarBolsaPorPedido(data.sNumeroPedido);
    }

    @MessagePattern({ cmd: 'pedidos.pedidos.detalleTracking' })
    async obtenerDetallesPedidoPorEstrella(data: {
        sNumeroPedido: string;
        sEstrellaId: number;
    }) {
        return this.pedidoService.obtenerDetallesPorPedidoEstrella(
            data.sNumeroPedido,
            data.sEstrellaId,
        );
    }
}

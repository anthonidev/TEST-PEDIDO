import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PedidoController } from '@/pedido/pedido.controller';
import { PedidoService } from '@/pedido/pedido.service';
import { PedidoCabecera } from '@/entities/pedidoCabecera.entity';
import { PedidoDetalle } from '@/entities/Pedidodetalle.entity';
import { PedidoAuditoria } from '@/entities/auditoria.entity';
import { ConceptoDetraccion } from '@/entities/conceptoDetraccion.entity';
import { FormaPago } from '@/entities/formaPago.entity';
import { HistorialEstado } from '@/entities/historialEstado.entity';
import { SerieNs } from '@/entities/serieNs.entity';
import { Termino } from '@/entities/termino.entity';
import { TipoOperacion } from '@/entities/tipoOperacion.entity';
import { CondicionPago } from '@/entities/condicionPago.entity';
import { MetodoPagoDetraccion } from '@/entities/metodoPagoDetraccion.entity';
import { NatsModule } from '@/transports/nats.module';
import { CronService } from './cortes.service';
import { ConfiguracionCierre } from '@/entities/configuracionCierre.entity';
import { ConfiguracionCierreService } from './configCortesPedidos.service';
import { Tracking } from '@/entities/tracking.entity';
import { TrackingService } from './tracking/trackingServices.service';
import { TrackingController } from './tracking/tracking.controller';
import { TrackingNetSuite } from '@/entities/trackingNetSuite.entity';
import { AccionesDirectoraService } from './accionesDirectora/accionesDirectora.service';
import { AccionesDirectoraController } from './accionesDirectora/accionesDirectora.controller';
import { GestionarPedidosController } from './gestionPedidos/gestionPedidos.controller';
import { GestionPedidosService } from './gestionPedidos/gestionPedidos.service';
import { StockService } from './stocks/stock.service';
import { StockController } from './stocks/stock.controller';
import { StockPedidos } from '@/entities/stockPedidos.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PedidoCabecera,
            PedidoDetalle,
            PedidoAuditoria,
            ConceptoDetraccion,
            FormaPago,
            HistorialEstado,
            SerieNs,
            Termino,
            TipoOperacion,
            CondicionPago,
            MetodoPagoDetraccion,
            ConfiguracionCierre,
            Tracking,
            TrackingNetSuite,
            StockPedidos,
        ]),
        NatsModule,
    ],
    controllers: [
        PedidoController,
        TrackingController,
        AccionesDirectoraController,
        GestionarPedidosController,
        StockController,
    ],
    providers: [
        PedidoService,
        CronService,
        ConfiguracionCierreService,
        TrackingService,
        AccionesDirectoraService,
        GestionPedidosService,
        StockService,
    ],
    exports: [TypeOrmModule],
})
export class PedidoModule {}

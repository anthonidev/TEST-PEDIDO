import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PedidoCabecera } from '@/entities/pedidoCabecera.entity';
import { Tracking } from '@/entities/tracking.entity';
import { CustomResponse } from '@/helpers/CustomResponse';
import { CustomException } from '@/helpers/CustomException';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class TrackingService {
    constructor(
        @InjectRepository(Tracking) private trackingRepo: Repository<Tracking>,
        @InjectRepository(PedidoCabecera)
        private pedidoRepo: Repository<PedidoCabecera>,
    ) {}

    async registrarTracking(
        sNumeroPedido: string,
        sDirectora: number,
        sStatus: string,
    ) {
        try {
            const pedido = await this.pedidoRepo.findOne({
                where: { sNumeroPedido },
                relations: ['trackings'],
            });

            if (!pedido) {
                throw CustomException.execute({
                    status: HttpStatus.NOT_FOUND,
                    message: `Pedido ${sNumeroPedido} no encontrado`,
                });
            }

            let tracking = await this.trackingRepo.findOne({
                where: { pedidoCabecera: pedido },
            });

            if (!tracking) {
                tracking = this.trackingRepo.create({
                    pedidoCabecera: pedido,
                    sDirectora: sDirectora,
                    sStatus: sStatus,
                    dFechaCambio: new Date(),
                });
            }

            switch (sStatus) {
                case 'DESPACHADO':
                    tracking.dFechaDespacho = new Date();
                    break;
                case 'EN TRANSITO':
                    tracking.dFechaEnTransito = new Date();
                    break;
                case 'EN ZONA':
                    tracking.dFechaEnZona = new Date();
                    break;
                case 'EN DISTRIBUCION':
                    tracking.dFechaEnDistribucion = new Date();
                    break;
                case 'ENTREGADO':
                    tracking.dFechaEntregaEfectiva = new Date();
                    break;
            }

            tracking.sStatus = sStatus;
            tracking.dFechaCambio = new Date();
            pedido.sEstadoTracking = sStatus;

            await this.pedidoRepo.save(pedido);
            await this.trackingRepo.save(tracking);

            return CustomResponse.execute({
                status: HttpStatus.CREATED,
                message: 'Tracking registrado exitosamente',
                data: tracking,
            });
        } catch (error) {
            throw CustomException.execute({
                status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message || 'Error al registrar tracking',
                error: error,
            });
        }
    }

    async registrarTrackingMasivo(data: any[]) {
        try {
            const resultados = [];

            for (const item of data) {
                const {
                    'N° PEDIDO': sNumeroPedido,
                    CD: sDirectora,
                    STATUS: sStatus,
                } = item;

                try {
                    const tracking = await this.registrarTracking(
                        sNumeroPedido,
                        sDirectora,
                        sStatus,
                    );
                    resultados.push({
                        pedido: sNumeroPedido,
                        status: 'OK',
                        tracking: tracking.data,
                    });
                } catch (error) {
                    resultados.push({
                        pedido: sNumeroPedido,
                        status: 'ERROR',
                        error: error.message,
                    });
                }
            }

            return CustomResponse.execute({
                status: HttpStatus.CREATED,
                message: 'Tracking masivo procesado',
                data: resultados,
            });
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Error al procesar tracking masivo',
                error: error,
            });
        }
    }

    async obtenerTrackingPorPedido(sNumeroPedido: string) {
        try {
            const pedido = await this.pedidoRepo.findOne({
                where: { sNumeroPedido },
                relations: ['trackings', 'trackings.trackingNetSuite'],
            });

            if (!pedido) {
                throw CustomException.execute({
                    status: HttpStatus.NOT_FOUND,
                    message: `Pedido ${sNumeroPedido} no encontrado`,
                });
            }

            const tracking = await this.trackingRepo.find({
                where: { pedidoCabecera: pedido },
                relations: ['trackingNetSuite'],
                order: { dFechaCambio: 'ASC' },
            });

            if (!tracking.length) {
                throw CustomException.execute({
                    status: HttpStatus.NOT_FOUND,
                    message: `No se encontraron registros de tracking para el pedido ${sNumeroPedido}`,
                });
            }

            const data = tracking.map((t) => ({
                id: t.id,
                sDirectora: t.sDirectora,
                sStatus: t.sStatus,
                dFechaCambio: t.dFechaCambio,
                trackingNetSuite: t.trackingNetSuite
                    ? {
                          id: t.trackingNetSuite.id,
                          sStatusNetSuite: t.trackingNetSuite.sStatusNetSuite,
                          dFechaCambio: t.trackingNetSuite.dFechaCambio,
                          dFechaAprobacionPendiente:
                              t.trackingNetSuite.dFechaAprobacionPendiente ||
                              null,
                          dFechaPreparandoPedido:
                              t.trackingNetSuite.dFechaPreparandoPedido || null,
                          dFechaFacturacionPendiente:
                              t.trackingNetSuite.dFechaFacturacionPendiente ||
                              null,
                          dFechaFacturacion:
                              t.trackingNetSuite.dFechaFacturacion || null,
                          dFechaDespachado:
                              t.trackingNetSuite.dFechaDespachado || null,
                          dFechaEnTransito:
                              t.trackingNetSuite.dFechaEnTransito || null,
                      }
                    : null,
            }));

            return CustomResponse.execute({
                status: HttpStatus.OK,
                message: 'Tracking obtenido exitosamente',
                data: data,
            });
        } catch (error) {
            throw CustomException.execute({
                status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message || 'Error al obtener tracking',
                error: error,
            });
        }
    }
}

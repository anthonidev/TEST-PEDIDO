import { PedidoDetalle } from '@/entities/Pedidodetalle.entity';
import {
    BadRequestException,
    forwardRef,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockService } from '../stocks/stock.service';
import { StockPedidos } from '@/entities/stockPedidos.entity';
import { CustomException } from '@/helpers/CustomException';
import { NATS_SERVICE } from '@/config/services';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SalesOrderInput } from '@/utils/dto/sales-order.netsuite.dto';

@Injectable()
export class AccionesDirectoraService {
    constructor(
        @InjectRepository(PedidoDetalle)
        private readonly pedidoDetalleRepository: Repository<PedidoDetalle>,
        @Inject(NATS_SERVICE) private readonly client: ClientProxy,
        @Inject(forwardRef(() => StockService))
        private readonly stockService: StockService,
        private readonly dataSource: DataSource,
    ) { }

    async createSalesOrderNetsuite(payload: SalesOrderInput) {
        try {
            const { id } = await firstValueFrom(
                this.client.send(
                    { cmd: 'integraciones.netsuite.record_create' },
                    {
                        recordType: 'customer',
                        payload,
                    },
                ),
            );
            return id;
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Error al crear pedidos en NetSuite: ${error.message}`,
            });
        }
    }

    async getSalesOrderNetsuite(recordId: string) {
        try {
            const customerSubfield = await firstValueFrom(
                this.client.send(
                    { cmd: 'integraciones.netsuite.record_get_subfield' },
                    {
                        recordType: 'salesOrder',
                        recordId,
                    },
                ),
            );
            return customerSubfield;
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Error al obtener pedido en NetSuite: ${error.message}`,
            });
        }
    }

    async updateSalesOrderNetsuite(recordId: string, payload) {
        try {
            await this.client.send(
                { cmd: 'integraciones.netsuite.record_update' },
                {
                    recordId,
                    recordType: 'salesOrder',
                    payload,
                },
            );
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Error al obtener pedido en NetSuite: ${error.message}`,
            });
        }
    }

    async approveOrRejectOrder(
        orderId: string,
        action: 'CONFIRMADO' | 'RECHAZADO',
        directoraId: number,
    ): Promise<PedidoDetalle> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const pedidoDetalle = await this.pedidoDetalleRepository.findOne({
                where: { sIdPedidoDetalle: orderId },
                relations: ['pedidoCabecera'],
            });

            if (!pedidoDetalle) {
                throw new NotFoundException(
                    `Order with ID ${orderId} not found`,
                );
            }

            if (pedidoDetalle.pedidoCabecera.sDirectoraId !== directoraId) {
                throw new BadRequestException(
                    'You can only manage your own orders',
                );
            }

            const estadoAnterior = pedidoDetalle.sAccionDirectora;

            if (action === 'CONFIRMADO') {
                // Validar stock antes de confirmar
                const stockExistente = await queryRunner.manager.findOne(
                    StockPedidos,
                    {
                        where: {
                            skuHijo: pedidoDetalle.sSkuProducto,
                            nivelPrecio: pedidoDetalle.sNivelPrecioId,
                        },
                    },
                );

                if (
                    !stockExistente ||
                    stockExistente.stockDisponible < pedidoDetalle.nCantidad
                ) {
                    throw new BadRequestException(
                        `Stock insuficiente para SKU ${pedidoDetalle.sSkuProducto}. Disponible: ${stockExistente?.stockDisponible || 0}, requerido: ${pedidoDetalle.nCantidad}`,
                    );
                }

                await this.stockService.actualizarStockPedidoConfirmado(
                    queryRunner,
                    pedidoDetalle.sSkuProducto,
                    pedidoDetalle.sNivelPrecioId,
                    pedidoDetalle.nCantidad,
                );

                // TODO: Crear en netsuite
                const sampleInput: SalesOrderInput = {
                    email: 'grisell.ayacucho.sokso@gmail.com',
                    billAddress: {
                        addressListId: '302', // Jr bellido 184
                    },
                    shipAddress: {
                        addressListId: '302', // Jr bellido 184
                    },
                    subtotal: 167,
                    total: 197.06,
                    salesRepId: '22',
                    items: [
                        {
                            itemId: '277', // TIM-094 : TIM-094AZUL37 TIM-094
                            description: 'SANDALIAS PL TIJERA SOKSO TIM-094',
                            quantity: 2,
                            rate: 49,
                            // rateSchedule: '0\u000549.00',
                            priceId: '7', // REGDAM2025SK01_CF
                            cseg1Id: '1',
                            cseg2Id: '1',
                            cseg3Id: '1',
                            cseg4Id: '1',
                            cseg5Id: '1',
                            custcolprecio_estrella: 55,
                            custcol_pvs: 99,
                            isPair: true,
                            // custcol_ns_json_um: 'Par',
                            custcol_estrella: 'E000000111',
                            // custcol_id_detalle: 1001,
                            amount: 98,
                        },
                        {
                            itemId: '325', // QTE-126 : QTE-126NEGRO42 QTE-126,
                            description: 'ZAPATILLAS PR URBAN CREEDS QTE-126',
                            quantity: 1,
                            rate: 69,
                            // rateSchedule: '0\u000569.00',
                            priceId: '9', // REGCAB2025VR01-CF
                            cseg1Id: '1',
                            cseg2Id: '1',
                            cseg3Id: '1',
                            cseg4Id: '1',
                            cseg5Id: '1',
                            custcolprecio_estrella: 79,
                            custcol_pvs: 109,
                            isPair: true,
                            // custcol_ns_json_um: 'Par',
                            custcol_estrella: 'E000000111',
                            // custcol_id_detalle: 1002,
                            amount: 69,
                        },
                    ],
                };
                const sPedidosNetsuiteId =
                    await this.createSalesOrderNetsuite(sampleInput);
                console.log(sPedidosNetsuiteId);
                // TODO: setear estado inicial
                /*
                    "orderStatus": {
                        "id": "B",
                        "refName": "B"
                    },
                    "status": {
                        "id": "B",
                        "refName": "Ejecución de la orden pendiente"
                    },
                    */
            } else if (action === 'RECHAZADO') {
                if (estadoAnterior === 'CONFIRMADO') {
                    await this.stockService.revertirStockPedidoConfirmado(
                        queryRunner,
                        pedidoDetalle.sSkuProducto,
                        pedidoDetalle.sNivelPrecioId,
                        pedidoDetalle.nCantidad,
                    );
                    // TODO: Actualizo el estado en netsuite
                    // OBTENGO EL ID NETSUITE GUARDADO EN SMART
                    const sPedidosNetsuiteId = '12';
                    const { status, orderStatus } =
                        await this.getSalesOrderNetsuite(sPedidosNetsuiteId);
                    console.log(status, orderStatus);

                    /*
                    "orderStatus": {
                        "id": "B",
                        "refName": "B"
                    },
                    "status": {
                        "id": "B",
                        "refName": "Ejecución de la orden pendiente"
                    },
                    */
                    // ACTUALIZO EN NETSUITE con el id netsuite para rechazado?
                    await this.updateSalesOrderNetsuite(sPedidosNetsuiteId, {
                        status: {
                            // nuevo id netsuite para el nuevo estado
                            id: 'B',
                        },
                        orderStatus: {
                            // nuevo id netsuite para el nuevo estado
                            id: 'B',
                        },
                    });

                    // TODO: Tambien actualizar en smart
                } else {
                    await this.stockService.actualizarStockPedidoRechazado(
                        queryRunner,
                        pedidoDetalle.sSkuProducto,
                        pedidoDetalle.sNivelPrecioId,
                        pedidoDetalle.nCantidad,
                    );
                }
            }

            pedidoDetalle.sAccionDirectora = action;
            pedidoDetalle.dtFechaAccionDirectora = new Date().toISOString();
            await this.pedidoDetalleRepository.save(pedidoDetalle);

            await queryRunner.commitTransaction();
            return pedidoDetalle;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Pedido no creado para el ID ${error}`,
            });
        } finally {
            await queryRunner.release();
        }
    }

    async approveOrRejectOrdersByStar(
        starId: number,
        action: 'CONFIRMADO' | 'RECHAZADO',
        directoraId: number,
    ): Promise<PedidoDetalle[]> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const pedidosDetalle = await this.pedidoDetalleRepository.find({
                where: { sEstrellaId: starId },
                relations: ['pedidoCabecera'],
            });

            if (!pedidosDetalle.length) {
                throw new NotFoundException(
                    `No orders found for star ID ${starId}`,
                );
            }

            const directorOrders = pedidosDetalle.filter(
                (detalle) =>
                    detalle.pedidoCabecera.sDirectoraId === directoraId,
            );

            if (!directorOrders.length) {
                throw new BadRequestException(
                    `No orders for this star belong to you`,
                );
            }

            for (const pedido of directorOrders) {
                const estadoAnterior = pedido.sAccionDirectora;

                if (action === 'CONFIRMADO') {
                    await this.stockService.actualizarStockPedidoConfirmado(
                        queryRunner,
                        pedido.sSkuProducto,
                        pedido.sNivelPrecioId,
                        pedido.nCantidad,
                    );
                } else if (action === 'RECHAZADO') {
                    if (estadoAnterior === 'CONFIRMADO') {
                        await this.stockService.revertirStockPedidoConfirmado(
                            queryRunner,
                            pedido.sSkuProducto,
                            pedido.sNivelPrecioId,
                            pedido.nCantidad,
                        );
                    } else {
                        await this.stockService.actualizarStockPedidoRechazado(
                            queryRunner,
                            pedido.sSkuProducto,
                            pedido.sNivelPrecioId,
                            pedido.nCantidad,
                        );
                    }
                }

                pedido.sAccionDirectora = action;
                pedido.dtFechaAccionDirectora = new Date().toISOString();
            }

            await this.pedidoDetalleRepository.save(directorOrders);
            await queryRunner.commitTransaction();
            return directorOrders;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `No orders found for star ID ${starId}`,
            });
        } finally {
            await queryRunner.release();
        }
    }

    async approveOrdersByOperationType(
        operationType: string,
        directoraId: number,
    ): Promise<PedidoDetalle[]> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const pedidosDetalle = await this.pedidoDetalleRepository
                .createQueryBuilder('detalle')
                .leftJoinAndSelect('detalle.pedidoCabecera', 'cabecera')
                .leftJoinAndSelect('detalle.sIdTipoOperacion', 'tipoOperacion')
                .where('cabecera.sDirectoraId = :directoraId', { directoraId })
                .andWhere('tipoOperacion.sNombre = :operationType', {
                    operationType,
                })
                .getMany();

            if (!pedidosDetalle.length) {
                throw new NotFoundException(
                    `No orders found for type ${operationType}`,
                );
            }

            for (const pedido of pedidosDetalle) {
                await this.stockService.actualizarStockPedidoConfirmado(
                    queryRunner,
                    pedido.sSkuProducto,
                    pedido.sNivelPrecioId,
                    pedido.nCantidad,
                );
                pedido.sAccionDirectora = 'CONFIRMADO';
                pedido.dtFechaAccionDirectora = new Date().toISOString();
            }

            await this.pedidoDetalleRepository.save(pedidosDetalle);
            await queryRunner.commitTransaction();
            return pedidosDetalle;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Pedido no creado para el ID ${error}`,
            });
        } finally {
            await queryRunner.release();
        }
    }
}

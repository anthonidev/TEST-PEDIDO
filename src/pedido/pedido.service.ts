import { NATS_SERVICE } from '@/config/services';
import { PedidoAuditoria } from '@/entities/auditoria.entity';
import { PedidoCabecera } from '@/entities/pedidoCabecera.entity';
import { PedidoDetalle } from '@/entities/Pedidodetalle.entity';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Between, DataSource, QueryRunner, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { TipoOperacion } from '@/entities/tipoOperacion.entity';
import { CustomException } from '@/helpers/CustomException';
import { CustomResponse } from '@/helpers/CustomResponse';
import { ConfiguracionCierre } from '@/entities/configuracionCierre.entity';
import { TrackingNetSuite } from '@/entities/trackingNetSuite.entity';
import { Tracking } from '@/entities/tracking.entity';
import { GetArticlePedidoDto } from './dto/buscarProductoSku.dto';
import { IDetalleArticulo } from './interfaces/detalleArticulo.interface';
import { CustomClient } from '@/helpers/CustomClients';
import { StockService } from './stocks/stock.service';
import { StockPedidos } from '@/entities/stockPedidos.entity';

@Injectable()
export class PedidoService {
    private customClient: CustomClient;
    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy,

        @InjectRepository(PedidoCabecera)
        private readonly pedidoCabeceraRepository: Repository<PedidoCabecera>,

        @InjectRepository(PedidoDetalle)
        private readonly pedidoDetalleRepository: Repository<PedidoDetalle>,

        @InjectRepository(PedidoAuditoria)
        private readonly pedidoAuditoriaRepository: Repository<PedidoAuditoria>, // Inyección de auditoría

        @InjectRepository(TipoOperacion)
        private readonly pedidosTipoOperacionRepository: Repository<TipoOperacion>, // Inyección de tipo de operación

        @InjectRepository(ConfiguracionCierre)
        private readonly configuracionCierreRepository: Repository<ConfiguracionCierre>, // Inyección de tipo de operación

        @InjectRepository(TrackingNetSuite)
        private readonly trackingNetSuiteRepository: Repository<TrackingNetSuite>, // Inyección de tipo de operación

        @InjectRepository(Tracking)
        private readonly trackingRepository: Repository<Tracking>, // Inyección de tipo de operación

        private readonly dataSource: DataSource, // Para manejar transacciones
        private readonly stockService: StockService, // Para manejar transacciones
    ) {
        this.customClient = new CustomClient(client);
    }

    async listarProductosPorId(id: number) {
        try {
            const articulo = await firstValueFrom(
                this.client.send(
                    { cmd: 'articulos.articulo.obtenerPorId' },
                    { nIdArticulo: id },
                ),
            );
            return articulo;
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Error al obtener el artículo: ${error.message}`,
            });
        }
    }

    async listarProductosPorNivelPrecio(
        nIdArticulo: number,
        sDescripcionProducto: string,
        sNivelPrecio: string,
    ) {
        try {
            const articulo = await firstValueFrom(
                this.client.send(
                    { cmd: 'articulos.articulo.obtenerArticuloParaPedido' },
                    {
                        nIdArticulo,
                        sDescripcionProducto,
                        sNivelPrecio,
                    },
                ),
            );
            return articulo;
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Error al obtener el artículo para pedido: ${error.message}`,
            });
        }
    }

    async listarDirectorasPorId(id: number) {
        try {
            const directora = await firstValueFrom(
                this.client.send(
                    { cmd: 'clientes.cliente.editar_datos_directora' },
                    { id },
                ),
            );

            return directora;
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Error al obtener la información de la directora: ${error.message}`,
            });
        }
    }

    async listarEstrellasPorId(nIdCliente: number) {
        try {
            const estrella = await firstValueFrom(
                this.client.send(
                    { cmd: 'clientes.cliente.datosEstrella' },
                    { nIdCliente },
                ),
            );
            console.log('Estrella##:', estrella);

            return estrella;
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Error al obtener la información de la Estrella: ${error.message}`,
            });
        }
    }

    async listarProductoPorSku(payload: GetArticlePedidoDto) {
        try {
            const articuloBySku = await this.customClient.send<{
                message: string;
                status: number;
                data: IDetalleArticulo;
            }>({
                messagePattern:
                    'articulos.orchestrator.pedidos-obtener_articulo',
                payload,
            });

            if (!articuloBySku) {
                throw new Error('No se encontró el artículo');
            }

            return articuloBySku;
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Error al obtener el artículo por SKU: ${error.message}`,
            });
        }
    }

    async crearPedido(pedidoData: any) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            // Validación inicial de datos
            this.validarDatosPedido(pedidoData);

            // Obtener datos de la directora
            const directoraData = await this.listarDirectorasPorId(
                pedidoData.clienteId,
            );
            const sDirectoraId = directoraData.cliente.directora.nIdDirectora;

            // Buscar pedido abierto existente
            let pedidoCabecera = await this.buscarPedidoAbierto(
                queryRunner,
                sDirectoraId,
            );

            // Si no existe pedido abierto, crear uno nuevo
            if (!pedidoCabecera) {
                pedidoCabecera = await this.crearNuevoPedidoCabecera(
                    queryRunner,
                    sDirectoraId,
                    directoraData,
                    pedidoData.sUsuarioCreacionId,
                );
            }

            // Procesar detalles del pedido
            const { detallesPedido, totales } =
                await this.procesarDetallesPedido(
                    queryRunner,
                    pedidoCabecera,
                    pedidoData.detalles,
                );

            // Actualizar montos del pedido
            pedidoCabecera = await this.actualizarMontoPedido(
                queryRunner,
                pedidoCabecera,
                totales,
                pedidoData.detalles.length,
            );

            await queryRunner.commitTransaction();

            return CustomResponse.execute({
                status: HttpStatus.CREATED,
                message: 'Pedido creado exitosamente',
                data: { pedidoCabecera, detalles: detallesPedido },
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Error al crear el pedido: ${error.message}`,
            });
        } finally {
            await queryRunner.release();
        }
    }

    private validarDatosPedido(pedidoData: any) {
        if (!pedidoData?.clienteId || !pedidoData?.detalles?.length) {
            throw CustomException.execute({
                status: HttpStatus.BAD_REQUEST,
                message: 'Datos de pedido inválidos o incompletos',
            });
        }
    }

    private async buscarPedidoAbierto(
        queryRunner: QueryRunner,
        sDirectoraId: number,
    ) {
        return await queryRunner.manager.findOne(PedidoCabecera, {
            where: {
                sDirectoraId,
                sEstadoCierre: 'ABIERTO',
            },
        });
    }

    private async crearNuevoPedidoCabecera(
        queryRunner: QueryRunner,
        sDirectoraId: number,
        directoraData: any,
        sUsuarioCreacionId?: string,
    ) {
        // Generar números únicos
        const todayFormatted = new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, '');
        const timestamp = new Date().getTime().toString();
        const sufijoTimestamp = timestamp.substring(timestamp.length - 6);

        const numeroPedido = `PED-${todayFormatted}-${sufijoTimestamp}`;
        const numeroOrdenCompra = `OC-${todayFormatted}-${sufijoTimestamp}`;
        const numeroExterno = `EXT-${todayFormatted}-${sufijoTimestamp}`;
        const numeroGuia = `GUIA-${todayFormatted}-${sufijoTimestamp}`;

        // Crear auditoría
        const auditoriaCabecera = this.pedidoAuditoriaRepository.create({
            sIdPedidoAuditoria: uuidv4(),
            sTablaReferencia: 'pedidos_cabecera',
            dtFechaCreacion: new Date(),
            sIdReferencia: null,
            sUsuarioCreacionId: sUsuarioCreacionId || 'USUARIO_INDIVIDUAL',
        });

        const savedAuditoriaCabecera = await queryRunner.manager.save(
            PedidoAuditoria,
            auditoriaCabecera,
        );

        // Crear cabecera de pedido
        const pedidoCabecera = this.pedidoCabeceraRepository.create({
            sIdPedidoCabecera: uuidv4(),
            sIdExterno: numeroExterno,
            sNumeroPedido: numeroPedido,
            sNumeroOrdenCompra: numeroOrdenCompra,
            sDirectoraId,
            sNombreDirectora: `${directoraData.cliente.infoCliente.sNombre} ${directoraData.cliente.infoCliente.sApellidos}`,
            sNota: 'Pedido generado desde EC',
            dtFechaPedido: new Date(),
            nTotalPaquetes: 0,
            nSubtotal: 0,
            nTotal: 0,
            sAuditoriaId: savedAuditoriaCabecera.sIdPedidoAuditoria,
            sCondicionPagoId: '23b9d4cb-df20-40c9-aeea-35461add446d',
            sTipoDocumentoId: 'DOC001',
            sSerieNsId: 'c9e3e566-2aea-48c4-b04b-6e15856910bd',
            sEstadoAprobacion: 'PENDIENTE',
            sEstadoCierre: 'ABIERTO',
            sEstadoAprobacionSokso: 'PENDIENTE',
            sNumeroFactura: `FAC-${numeroPedido}`,
            sNumeroGuia: numeroGuia,
        });

        const savedPedidoCabecera = await queryRunner.manager.save(
            PedidoCabecera,
            pedidoCabecera,
        );

        // Crear tracking inicial asegurando que el pedido existe
        const trackingPedido = this.trackingRepository.create({
            pedidoCabecera: savedPedidoCabecera, // Asegurar que se pasa el objeto completo
            sDirectora: sDirectoraId,
            sStatus: 'ABIERTO',
            dFechaCambio: new Date(),
        });

        await queryRunner.manager.save(Tracking, trackingPedido);

        // Crear tracking NetSuite
        const trackingNs = this.trackingNetSuiteRepository.create({
            tracking: trackingPedido, // Ensure 'trackingPedido' is used as it is already created and saved
            sStatusNetSuite: 'Aprobación Pendiente',
            dFechaCambio: new Date(),
            dFechaAprobacionPendiente: new Date(),
        });

        await queryRunner.manager.save(TrackingNetSuite, trackingNs);

        return await queryRunner.manager.save(PedidoCabecera, pedidoCabecera);
    }

    private async procesarDetallesPedido(
        queryRunner: QueryRunner,
        pedidoCabecera: PedidoCabecera,
        detalles: any[],
    ) {
        const contadorEstrellas: Record<string, number> = {};
        const detallesPedido = [];
        let subtotalPedido = 0;
        let totalPedido = 0;
        let totalImpuesto = 0;

        for (let i = 0; i < detalles.length; i++) {
            const item = detalles[i];

            const estrellaData = await this.listarEstrellasPorId(
                item.sPromotoraId,
            );
            console.log(
                'Estrella data:',
                estrellaData,
                'id :',
                item.sPromotoraId,
            );
            // Obtener artículo por SKU
            const articulo = await this.listarProductoPorSku({
                sSkuItem: item.sSkuHijo, // Assuming 'sSkuHijo' is a property of 'item'
                sPriceLevel: item.sNivelPrecio,
            });

            await this.stockService.actualizarStockPedido(
                queryRunner,
                item.sSkuHijo,
                item.sNivelPrecio,
                item.nCantidad,
                articulo.data.stock.stockReal, // Pasar el stock real obtenido en la primera consulta
            );

            if (!articulo?.data) {
                throw new Error(
                    `Artículo no encontrado para el ID ${item.item}`,
                );
            }

            // Obtener último número de línea
            const ultimoNumeroLinea = await queryRunner.manager
                .createQueryBuilder(PedidoDetalle, 'detalle')
                .select('MAX(detalle.nNumeroLinea)', 'maxLinea')
                .where('detalle.sEstrellaId = :estrellaId', {
                    estrellaId: item.sPromotoraId,
                })
                .andWhere('detalle.sPedidoId = :pedidoId', {
                    pedidoId: pedidoCabecera.sIdPedidoCabecera,
                })
                .getRawOne();

            const numeroLineaBase = ultimoNumeroLinea?.maxLinea || 0;

            // Incrementar contador de estrellas
            contadorEstrellas[item.sPromotoraId] =
                (contadorEstrellas[item.sPromotoraId] || numeroLineaBase) + 1;

            const nNumeroLinea = contadorEstrellas[item.sPromotoraId];

            // Obtener tipo de operación
            const tipoOperacion = await queryRunner.manager.findOne(
                TipoOperacion,
                {
                    where: { sCodigo: item.sTipoOperacionId },
                },
            );

            // Calcular montos
            const precioUnitario = Number(
                articulo.data.pricesConfig.nPrecioPromotor ||
                    articulo.data.pricesConfig.nPrecioDirector,
            );
            const subtotal = Number(
                (precioUnitario * item.nCantidad).toFixed(2),
            );
            const impuesto = Number((subtotal * 0.18).toFixed(2));
            const total = Number((subtotal + impuesto).toFixed(2));

            // Obtener stock disponible desde la tabla local
            const stockLocal = await queryRunner.manager.findOne(StockPedidos, {
                where: {
                    skuHijo: item.sSkuHijo,
                    nivelPrecio: item.sNivelPrecio,
                },
            });

            const stockDisponible = stockLocal ? stockLocal.stockDisponible : 0;

            if (item.nCantidad > stockDisponible) {
                throw CustomException.execute({
                    status: HttpStatus.BAD_REQUEST,
                    message: `Stock insuficiente para SKU: ${item.sSkuHijo} (Nivel de Precio: ${item.sNivelPrecio}). Disponible: ${stockDisponible}, Solicitado: ${item.nCantidad}`,
                });
            }

            // Acumular totales
            subtotalPedido += subtotal;
            totalPedido += total;
            totalImpuesto += impuesto;

            // Crear detalle de pedido
            const pedidoDetalle = this.pedidoDetalleRepository.create({
                sIdPedidoDetalle: uuidv4(),
                sPedidoId: pedidoCabecera.sIdPedidoCabecera,
                sPedidoItemId: `ITEM-${i + 1}`,
                sArticuloId: articulo.data.nIdArticulo,
                nCantidad: item.nCantidad,
                sNivelPrecioId: item.sNivelPrecio,
                nNumeroLinea: nNumeroLinea,
                sSkuProducto: item.sSkuHijo,
                sDatosEstrella: JSON.stringify(estrellaData),
                sDatosProducto: JSON.stringify(articulo.data),
                sDepartamentoId: item.sDepartamentoId,
                sUbicacionId: item.sUbicacionId,
                sCodigoImpuestoId: 'IGV001',
                sNsAfectaIgv: 'SI',
                sIdTipoOperacion: tipoOperacion,
                sNsCodigoImpuesto: '18%',
                nMontoImpuesto: impuesto,
                dtFechaPedido: new Date(),
                bEsBonificacion: false,
                sCodigoUm: 'UNIDAD',
                sClaseId: 'CLASEA',
                nPrecioSugerido: articulo.data.pricesConfig.nPvs,
                nPrecioUnitario: precioUnitario,
                nSubtotal: subtotal,
                nTotal: total,
                sEstrellaId: item.sPromotoraId,
            });

            detallesPedido.push(pedidoDetalle);
        }

        // Guardar detalles
        await queryRunner.manager.save(PedidoDetalle, detallesPedido);

        return {
            detallesPedido,
            totales: { subtotalPedido, totalPedido, totalImpuesto },
        };
    }

    private async actualizarMontoPedido(
        queryRunner: QueryRunner,
        pedidoCabecera: PedidoCabecera,
        totales: {
            subtotalPedido: number;
            totalPedido: number;
            totalImpuesto: number;
        },
        numeroPaquetes: number,
    ) {
        pedidoCabecera.nSubtotal = Number(totales.subtotalPedido.toFixed(2));
        pedidoCabecera.nTotal = Number(totales.totalPedido.toFixed(2));
        pedidoCabecera.nTotalImpuesto = Number(
            totales.totalImpuesto.toFixed(2),
        );
        pedidoCabecera.nTotalPaquetes += numeroPaquetes;

        return await queryRunner.manager.save(PedidoCabecera, pedidoCabecera);
    }

    async obtenerPedidosConDetalles() {
        try {
            const pedidosCabecera = await this.pedidoCabeceraRepository.find();

            const pedidosConDetalles = await Promise.all(
                pedidosCabecera.map(async (pedido) => {
                    const detalles = await this.pedidoDetalleRepository.find({
                        where: { sPedidoId: pedido.sIdPedidoCabecera },
                    });
                    return { ...pedido, detalles };
                }),
            );

            return pedidosConDetalles;
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Error al obtener los pedidos: ${error.message}`,
            });
        }
    }

    async listarPedidosConFiltros(
        fechaDesde?: string,
        fechaHasta?: string,
        sDirectoraId?: string,
    ) {
        try {
            const fechaHoy = moment().format('YYYY-MM-DD');
            let whereConditions: any = {};

            // Verificar si se proporcionaron fechas en el filtro
            const hayFiltrosDeFecha = fechaDesde || fechaHasta;

            if (hayFiltrosDeFecha) {
                whereConditions.dtFechaPedido = Between(
                    new Date(fechaDesde || fechaHoy),
                    moment(fechaHasta || fechaHoy)
                        .endOf('day')
                        .toDate(),
                );
            } else {
                // Si no hay filtros de fecha, usar solo la fecha actual
                whereConditions.dtFechaPedido = Between(
                    moment(fechaHoy).startOf('day').toDate(),
                    moment(fechaHoy).endOf('day').toDate(),
                );
            }

            // Agregar filtro de directora si se proporciona
            if (sDirectoraId) {
                whereConditions.sDirectoraId = sDirectoraId;
            }

            const pedidosCabecera = await this.pedidoCabeceraRepository.find({
                where: whereConditions,
                order: {
                    dtFechaPedido: 'DESC',
                },
                relations: ['detallesPedido'],
            });
            return CustomResponse.execute({
                status: HttpStatus.OK,
                message: 'Pedidos encontrados',
                data: pedidosCabecera.map((pedido) => ({
                    ...pedido,
                    detalles: pedido.detallesPedido,
                })),
            });
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Error al obtener los pedidos con filtros: ${error.message}`,
            });
        }
    }
    async getNextCorrelativo(prefix: string): Promise<string> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const today = new Date()
                .toISOString()
                .slice(0, 10)
                .replace(/-/g, '');

            const result = await queryRunner.manager.query(
                `SELECT "sNumeroPedido" FROM "pedidos_cabecera"
                 WHERE "sNumeroPedido" LIKE '${prefix}-${today}-%'
                 ORDER BY CAST(SPLIT_PART("sNumeroPedido", '-', 3) AS INTEGER) DESC
                 LIMIT 1
                 FOR UPDATE;`,
            );

            let nextNumber = 1;
            if (result.length > 0) {
                const lastPedido = result[0].sNumeroPedido;
                const lastNumber = parseInt(
                    lastPedido.split('-').pop() || '0',
                    10,
                );
                nextNumber = lastNumber + 1;
            }

            const newPedido = `${prefix}-${today}-${String(nextNumber).padStart(3, '0')}`;

            await queryRunner.commitTransaction();
            return newPedido;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Error al obtener el siguiente correlativo: ${error.message}`,
            });
        } finally {
            await queryRunner.release();
        }
    }

    async cargarPedidosMasivos(data: any) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            // Validación de datos de entrada
            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error(
                    'Los datos de entrada están vacíos o no son válidos.',
                );
            }

            console.log(
                'Validación de datos completada. Iniciando proceso de carga masiva...',
            );

            // Agrupar pedidos por "ID CLIENTE"
            const pedidosPorCliente = data.reduce(
                (acc, pedido) => {
                    const clienteId = pedido['ID CLIENTE'];
                    if (!acc[clienteId]) {
                        acc[clienteId] = [];
                    }
                    acc[clienteId].push(pedido);
                    return acc;
                },
                {} as Record<string, any[]>,
            );

            const resultados = [];

            // Generar un timestamp único para todos los correlativos de esta ejecución
            const timestamp = new Date().getTime().toString();

            // Contador para los pedidos
            let pedidoCounter = 1;

            // Procesar cada cliente
            for (const clienteId of Object.keys(pedidosPorCliente)) {
                const pedidosCliente = pedidosPorCliente[clienteId];

                console.log(`Procesando pedidos para CLIENTE: ${clienteId}`);

                // Obtener el tipo de operación
                const tipoOperacion =
                    await this.pedidosTipoOperacionRepository.findOne({
                        where: { sCodigo: pedidosCliente[0]['TIPO DE PEDIDO'] },
                    });

                if (!tipoOperacion) {
                    throw CustomException.execute({
                        status: HttpStatus.NOT_FOUND,
                        message: `Tipo de operación no encontrado para cliente ${clienteId}`,
                    });
                }

                // Obtener detalle del primer producto
                const detalleProductos =
                    await this.listarProductosPorNivelPrecio(
                        pedidosCliente[0]['ITEM'],
                        pedidosCliente[0]['PRODUCTO'],
                        pedidosCliente[0]['NIVEL DE PRECIO'],
                    );
                const detalleArticuloData = detalleProductos.data;

                if (!detalleArticuloData) {
                    throw CustomException.execute({
                        status: HttpStatus.NOT_FOUND,
                        message: `Detalles de productos no encontrados para cliente ${clienteId}`,
                    });
                }

                // Auditoría de la cabecera
                const auditoriaCabecera = this.pedidoAuditoriaRepository.create(
                    {
                        sIdPedidoAuditoria: uuidv4(),
                        sTablaReferencia: 'pedidos_cabecera',
                        sIdReferencia: '',
                        dtFechaCreacion: new Date(),
                        sUsuarioCreacionId: 'USUARIO_MASIVO',
                        dtFechaModificacion: null,
                        sUsuarioModificacionId: null,
                    },
                );

                const savedAuditoriaCabecera = await queryRunner.manager.save(
                    PedidoAuditoria,
                    auditoriaCabecera,
                );

                // Generar correlativos únicos con el timestamp y un contador
                const todayFormatted = new Date()
                    .toISOString()
                    .slice(0, 10)
                    .replace(/-/g, '');
                const numeroPedido = `PED-${todayFormatted}-${String(pedidoCounter).padStart(3, '0')}-${clienteId.substring(0, 3)}`;
                const numeroOrdenCompra = `OC-${todayFormatted}-${String(pedidoCounter).padStart(3, '0')}-${clienteId.substring(0, 3)}`;
                const numeroExterno = `EXT-${todayFormatted}-${String(pedidoCounter).padStart(3, '0')}-${clienteId.substring(0, 3)}`;
                const numeroGuia = `GUIA-${todayFormatted}-${String(pedidoCounter).padStart(3, '0')}-${clienteId.substring(0, 3)}`;

                // Incrementar el contador para el siguiente pedido
                pedidoCounter++;

                let totalPedido = 0;
                let totalImpuesto = 0;
                let subtotalPedido = 0;

                // Crear cabecera para el cliente
                const pedidoCabecera = this.pedidoCabeceraRepository.create({
                    sIdPedidoCabecera: uuidv4(),
                    sIdExterno: numeroExterno,
                    sNumeroPedido: numeroPedido,
                    sNumeroOrdenCompra: numeroOrdenCompra,
                    sDirectoraId: 0,
                    sNombreDirectora: pedidosCliente[0]['CLIENTE'],
                    sNota: 'Pedido generado automáticamente',
                    dtFechaPedido: new Date(),
                    nTotalPaquetes: pedidosCliente.length,
                    nSubtotal: 0, // Inicializar en 0
                    nTotal: 0, // Inicializar en 0
                    sAuditoriaId: savedAuditoriaCabecera.sIdPedidoAuditoria,
                    sCondicionPagoId: '23b9d4cb-df20-40c9-aeea-35461add446d',
                    sTipoDocumentoId: 'DOC001',
                    sSerieNsId: 'c9e3e566-2aea-48c4-b04b-6e15856910bd',
                    bOperacionGratuita: false,
                    sFormaPagoId: '3e171d36-327c-47fe-be9a-3a969811a72c',
                    sConceptoDetraccionId:
                        '73073b17-c639-46de-8229-e0856c970772',
                    sMetodoPagoDetraccionId:
                        '8ed6cd24-565b-40f3-89dc-2b17f7ca395a',
                    sEstadoAprobacion: 'PENDIENTE',
                    sEstadoCierre: 'ABIERTO',
                    sEstadoAprobacionSokso: 'PENDIENTE',
                    sTerminoId: 'ba9940a2-6dd9-4dba-97ab-b2ef5fed33a3',
                    sNumeroFactura: `FAC-${numeroPedido}`,
                    sNumeroGuia: numeroGuia,
                });

                // Verificar si ya existe un pedido con este número
                const existingPedido = await queryRunner.manager.findOne(
                    PedidoCabecera,
                    {
                        where: { sNumeroPedido: numeroPedido },
                    },
                );

                if (existingPedido) {
                    console.log(
                        `Pedido con número ${numeroPedido} ya existe. Generando nuevo número...`,
                    );
                    pedidoCabecera.sNumeroPedido = `PED-${todayFormatted}-${timestamp.substring(timestamp.length - 6)}-${pedidoCounter}`;
                    pedidoCabecera.sNumeroOrdenCompra = `OC-${todayFormatted}-${timestamp.substring(timestamp.length - 6)}-${pedidoCounter}`;
                    pedidoCabecera.sIdExterno = `EXT-${todayFormatted}-${timestamp.substring(timestamp.length - 6)}-${pedidoCounter}`;
                    pedidoCabecera.sNumeroGuia = `GUIA-${todayFormatted}-${timestamp.substring(timestamp.length - 6)}-${pedidoCounter}`;
                    pedidoCabecera.sNumeroFactura = `FAC-${pedidoCabecera.sNumeroPedido}`;
                }

                // Guardar la cabecera del pedido
                const savedPedidoCabecera = await queryRunner.manager.save(
                    PedidoCabecera,
                    pedidoCabecera,
                );
                console.log(
                    `Pedido cabecera creada para CLIENTE ${clienteId}:`,
                    savedPedidoCabecera,
                );

                const detallesPedido = [];

                // Procesar cada item del pedido
                for (let i = 0; i < pedidosCliente.length; i++) {
                    const item = pedidosCliente[i];
                    console.log('Procesando ITEM:', item);

                    // Obtener precio del artículo
                    const articulo = detalleArticuloData;
                    const precioUnitario =
                        articulo.nPrecioPromotor || articulo.nPrecioDirector;

                    if (!precioUnitario) {
                        throw new Error(
                            `Precio unitario no encontrado para el artículo ${item['ITEM']}`,
                        );
                    }

                    const subtotal = precioUnitario * item['CANTIDAD'];
                    const impuesto = subtotal * 0.18;
                    const total = subtotal + impuesto;

                    subtotalPedido += subtotal;
                    totalPedido += total;
                    totalImpuesto += impuesto;

                    console.log(
                        `Precio unitario: ${precioUnitario}, Cantidad: ${item['CANTIDAD']}, Subtotal: ${subtotal}, Impuesto: ${impuesto}, Total: ${total}`,
                    );

                    // Crear detalle de pedido
                    const pedidoDetalle = this.pedidoDetalleRepository.create({
                        sIdPedidoDetalle: uuidv4(),
                        sPedidoId: savedPedidoCabecera.sIdPedidoCabecera,
                        sPedidoItemId: `ITEM-${i + 1}`,
                        sArticuloId: item['ITEM'],
                        nCantidad: item['CANTIDAD'],
                        nCantidadComprometida: 0,
                        nCantidadDespachada: 0,
                        sNivelPrecioId: item['NIVEL DE PRECIO'],
                        nNumeroLinea: i + 1,
                        sDepartamentoId: item['DEPARTAMENTO'],
                        sUbicacionId: item['LOCALIZACION'],
                        sCodigoImpuestoId: 'IGV001',
                        sNsAfectaIgv: 'SI',
                        sIdTipoOperacion: tipoOperacion,
                        sNsCodigoImpuesto: '18%',
                        nMontoImpuesto: impuesto,
                        bEsBonificacion: false,
                        sCodigoUm: 'UNIDAD',
                        sClaseId: 'CLASEA',
                        sAuditoriaId: savedAuditoriaCabecera.sIdPedidoAuditoria,
                        nPrecioUnitario: precioUnitario,
                        nSubtotal: subtotal,
                        nTotal: total,
                    });
                    detallesPedido.push(pedidoDetalle);
                }

                // Guardar los detalles del pedido
                const savedDetalles = await queryRunner.manager.save(
                    PedidoDetalle,
                    detallesPedido,
                );
                console.log(
                    `Detalles de pedido guardados para CLIENTE ${clienteId}:`,
                    savedDetalles,
                );

                // Actualizar el subtotal, total y el impuesto en la cabecera
                savedPedidoCabecera.nSubtotal = subtotalPedido;
                savedPedidoCabecera.nTotal = totalPedido;
                savedPedidoCabecera.nTotalImpuesto = totalImpuesto;
                await queryRunner.manager.save(
                    PedidoCabecera,
                    savedPedidoCabecera,
                );

                resultados.push({
                    pedidoCabecera: savedPedidoCabecera,
                    detalles: savedDetalles,
                });
            }

            // Confirmar la transacción
            await queryRunner.commitTransaction();
            return resultados;
        } catch (error) {
            // Revertir la transacción en caso de error
            await queryRunner.rollbackTransaction();
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Pedido no creado para el ID ${error}`,
            });
        } finally {
            // Liberar el queryRunner
            await queryRunner.release();
        }
    }

    async listarCortes() {
        try {
            // Obtener el día actual
            const diaActual = this.obtenerDiaActual();

            // Realizar la llamada a través de NATS
            const cortes = await firstValueFrom(
                this.client.send(
                    { cmd: 'clientes.cliente.list-filter-directoras-cortes' }, // Patrón del mensaje
                    {}, // Payload vacío (si no necesitas enviar datos)
                ),
            );

            // Filtrar los cortes que coincidan con el día actual
            const cortesHoy = cortes.data.filter((corte) =>
                corte.centroModa.horario.sDiasCierre.includes(diaActual),
            );

            console.log('cortesHoy', cortesHoy); // Opcional: Para depuración
            return cortesHoy; // Devuelve solo los cortes para el día actual
        } catch (error) {
            console.error('Error al listar cortes:', error);
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Pedido no creado para el ID ${error}`,
            });
        }
    }

    // Método para obtener el día actual
    private obtenerDiaActual(): string {
        const dias = [
            'Domingo',
            'Lunes',
            'Martes',
            'Miércoles',
            'Jueves',
            'Viernes',
            'Sábado',
        ];
        const fecha = new Date();
        return dias[fecha.getDay()]; // Devuelve el día actual (ejemplo: "Martes")
    }

    async cerrarPedidos(nIdDirectora: number): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            console.log(
                `Buscando pedidos abiertos para la directora ${nIdDirectora}...`,
            );

            // Buscar pedidos abiertos de la directora
            const pedidosAbiertos = await queryRunner.manager.find(
                PedidoCabecera,
                {
                    where: {
                        sDirectoraId: nIdDirectora,
                        sEstadoCierre: 'ABIERTO',
                    },
                    relations: ['trackings'], // Para traer los trackings relacionados
                },
            );

            if (pedidosAbiertos.length === 0) {
                console.log(
                    `No hay pedidos abiertos para la directora ${nIdDirectora}.`,
                );
                await queryRunner.rollbackTransaction();
                return;
            }

            console.log(
                `Se encontraron ${pedidosAbiertos.length} pedidos abiertos. Procediendo a cerrar...`,
            );

            for (const pedido of pedidosAbiertos) {
                pedido.sEstadoCierre = 'CERRADO';
                pedido.dtFechaCorte = new Date(); // Fecha de cierre del pedido
                await queryRunner.manager.save(PedidoCabecera, pedido);
                console.log(`Pedido ${pedido.sNumeroPedido} cerrado.`);

                // ✅ Agregar un nuevo estado en la tabla de tracking
                const nuevoTracking = queryRunner.manager.create(Tracking, {
                    pedidoCabecera: pedido,
                    sEstado: 'PREPARANDO PEDIDO',
                    dFechaCambio: new Date(),
                });

                await queryRunner.manager.save(Tracking, nuevoTracking);
                console.log(
                    `Estado actualizado a "NS PREPARANDO PEDIDO" para el pedido ${pedido.sNumeroPedido}.`,
                );
            }

            await queryRunner.commitTransaction();
            console.log(
                `Todos los pedidos abiertos de la directora ${nIdDirectora} han sido cerrados y actualizados.`,
            );
        } catch (error) {
            console.error('Error al cerrar pedidos:', error);
            await queryRunner.rollbackTransaction();
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Pedido no creado para el ID ${error}`,
            });
        } finally {
            await queryRunner.release();
        }
    }

    async obtenerPedidosPorEstrella(
        sEstrellaId: string,
        nAnio?: number,
        nMes?: number,
        sCodigoProducto?: string,
    ): Promise<any> {
        try {
            // Obtener año y mes actual si no se proporcionan
            const fechaActual = new Date();
            const anioBusqueda = nAnio || fechaActual.getFullYear();
            const mesBusqueda = nMes || fechaActual.getMonth() + 1;

            // Rango de fechas para el filtro de año y mes
            const fechaInicio = new Date(anioBusqueda, mesBusqueda - 1, 1);
            const fechaFin = new Date(anioBusqueda, mesBusqueda, 0, 23, 59, 59);

            // Construcción dinámica de filtros
            const filtros: any = { sEstrellaId };

            // Filtrar por código de producto si existe
            if (sCodigoProducto) {
                filtros.sCodigoProducto = sCodigoProducto;
            }

            // Obtener detalles de pedidos con la relación a la cabecera
            const detalles = await this.pedidoDetalleRepository.find({
                where: filtros,
                relations: ['pedidoCabecera'],
            });

            const pedidosMap = new Map();

            detalles.forEach((detalle) => {
                const pedidoCabecera = detalle.pedidoCabecera;

                // Filtrar por fecha en la cabecera
                if (
                    nAnio &&
                    nMes &&
                    (!pedidoCabecera.dtFechaPedido ||
                        pedidoCabecera.dtFechaPedido < fechaInicio ||
                        pedidoCabecera.dtFechaPedido > fechaFin)
                ) {
                    return; // Si no está dentro del rango, lo excluye
                }

                const numeroPedido = pedidoCabecera.sNumeroPedido;

                if (!pedidosMap.has(numeroPedido)) {
                    pedidosMap.set(numeroPedido, {
                        sNumeroPedido: numeroPedido,
                        nTotalCompra: 0,
                        nSumaPrecioSugerido: 0,
                        nTotalPaquetes: pedidoCabecera.nTotalPaquetes || 0,
                        nGanancia: 0,
                    });
                }

                const pedidoAgrupado = pedidosMap.get(numeroPedido);

                // Acumular valores numéricos correctamente
                pedidoAgrupado.nTotalCompra += Number(detalle.nTotal) || 0;
                pedidoAgrupado.nSumaPrecioSugerido +=
                    Number(detalle.nPrecioSugerido) || 0;

                // Calcular ganancia
                pedidoAgrupado.nGanancia =
                    pedidoAgrupado.nTotalCompra -
                    pedidoAgrupado.nSumaPrecioSugerido;
            });

            // Convertir a dos decimales antes de retornar
            return Array.from(pedidosMap.values()).map((pedido) => ({
                sNumeroPedido: pedido.sNumeroPedido,
                nTotalCompra: Number(pedido.nTotalCompra.toFixed(2)),
                nSumaPrecioSugerido: Number(
                    pedido.nSumaPrecioSugerido.toFixed(2),
                ),
                nTotalPaquetes: pedido.nTotalPaquetes,
                nGanancia: Number(pedido.nGanancia.toFixed(2)),
            }));
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Pedido no creado para el ID ${error}`,
            });
        }
    }

    async cerrarBolsaPorPedido(sNumeroPedido: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            console.log(`Buscando pedido con número ${sNumeroPedido}...`);

            // Buscar el pedido con sus relaciones a tracking y trackingNetSuite
            const pedido = await queryRunner.manager.findOne(PedidoCabecera, {
                where: { sNumeroPedido, sEstadoCierre: 'ABIERTO' },
                relations: ['trackings', 'trackings.trackingNetSuite'], // Asegurar que traemos trackings y trackingNS
            });

            if (!pedido) {
                console.log(
                    `No se encontró un pedido abierto con el número ${sNumeroPedido}.`,
                );
                await queryRunner.rollbackTransaction();
                return;
            }

            console.log(
                `Pedido ${sNumeroPedido} encontrado. Procediendo a cerrar...`,
            );

            // Cerrar el pedido
            pedido.sEstadoCierre = 'CERRADO';
            pedido.dtFechaCorte = new Date(); // Fecha de cierre del pedido
            await queryRunner.manager.save(PedidoCabecera, pedido);
            console.log(`Pedido ${sNumeroPedido} cerrado correctamente.`);

            // ✅ Buscar el tracking correspondiente
            const tracking = pedido.trackings?.[0]; // Se asume que hay un solo tracking por pedido

            if (!tracking) {
                console.error(
                    `No se encontró un tracking para el pedido ${sNumeroPedido}.`,
                );
                await queryRunner.rollbackTransaction();
                return;
            }

            // ✅ Actualizar o crear trackingNetSuite con el nuevo estado y fecha
            if (tracking.trackingNetSuite) {
                tracking.trackingNetSuite.sStatusNetSuite =
                    'NS PREPARANDO PEDIDO';
                tracking.trackingNetSuite.dFechaCambio = new Date();
                tracking.trackingNetSuite.dFechaPreparandoPedido = new Date(); // Nueva columna con la fecha de cambio a "PREPARANDO PEDIDO"
                await queryRunner.manager.save(
                    TrackingNetSuite,
                    tracking.trackingNetSuite,
                );
                console.log(
                    `TrackingNetSuite actualizado a "NS PREPARANDO PEDIDO" con fecha asignada para el pedido ${sNumeroPedido}.`,
                );
            } else {
                console.warn(
                    `No se encontró trackingNetSuite para el pedido ${sNumeroPedido}, creando uno nuevo.`,
                );
                const nuevoTrackingNS = queryRunner.manager.create(
                    TrackingNetSuite,
                    {
                        tracking: tracking,
                        sStatusNetSuite: 'NS PREPARANDO PEDIDO',
                        dFechaCambio: new Date(),
                        dFechaPreparandoPedido: new Date(), // Nueva columna con la fecha de estado "PREPARANDO PEDIDO"
                    },
                );

                await queryRunner.manager.save(
                    TrackingNetSuite,
                    nuevoTrackingNS,
                );
                console.log(
                    `Nuevo trackingNetSuite creado con estado "NS PREPARANDO PEDIDO" para el pedido ${sNumeroPedido}.`,
                );
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            console.error('Error al cerrar el pedido:', error);
            await queryRunner.rollbackTransaction();
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Pedido no creado para el ID ${error}`,
            });
        } finally {
            await queryRunner.release();
        }
    }

    async obtenerDetallesPorPedidoEstrella(
        sNumeroPedido: string,
        sEstrellaId: number,
    ): Promise<any> {
        try {
            // Obtener los detalles del pedido con la relación a la cabecera
            const detalles = await this.pedidoDetalleRepository.find({
                where: { sEstrellaId },
                relations: ['pedidoCabecera'],
            });

            // Filtrar por número de pedido
            const detallesFiltrados = detalles.filter(
                (detalle) =>
                    detalle.pedidoCabecera.sNumeroPedido === sNumeroPedido,
            );

            // Si no hay detalles, retornar un array vacío
            if (detallesFiltrados.length === 0) {
                return [];
            }

            // Mapear los detalles con la información relevante
            return detallesFiltrados.map((detalle) => ({
                nCantidad: detalle.nCantidad,
                nPrecioEstrella: Number(detalle.nPrecioUnitario) || 0,
                nPrecioSugerido: Number(detalle.nPrecioSugerido) || 0,
                dtFechaPedidoDetalle:
                    detalle.pedidoCabecera.dtFechaPedido || null,
                dtFechaConfirmacion:
                    detalle.pedidoCabecera.dtFechaCorte || null,
            }));
        } catch (error) {
            console.error('Error al obtener detalles del pedido:', error);
            throw CustomException.execute({
                status: HttpStatus.NOT_FOUND,
                message: `Pedido no creado para el ID ${error}`,
            });
        }
    }
}

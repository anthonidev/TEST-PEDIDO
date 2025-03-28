import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PedidoCabecera } from '../../entities/pedidoCabecera.entity';
import { PedidoDetalle } from '../../entities/Pedidodetalle.entity';
import { TipoOperacion } from '@/entities/tipoOperacion.entity';
import {
    DatosEstrella,
    DatosEstrellaExtendida,
    DatosProducto,
    PaginatedResponse,
    PedidoDetalleAgrupado,
    ProductoExtendido,
} from './interface/gestionPedidos.response.interface';
import { CustomResponse } from '@/helpers/CustomResponse';
import { CustomException } from '@/helpers/CustomException';
import { StockPedidos } from '@/entities/stockPedidos.entity';
import { getEstadosPosibles } from './enum/estados.enum';

@Injectable()
export class GestionPedidosService {
    constructor(
        @InjectRepository(PedidoDetalle)
        private readonly pedidoDetalleRepository: Repository<PedidoDetalle>,
        @InjectRepository(TipoOperacion)
        private readonly tipoOperacionRepository: Repository<TipoOperacion>,
        @InjectRepository(StockPedidos)
        private readonly stockPedidosRepository: Repository<StockPedidos>,
    ) {}
    private async getTiposCatalogoByDirectora(
        directoraId: number,
    ): Promise<string[]> {
        try {
            // Consulta para obtener todos los tipos de operación asociados a pedidos de esta directora
            const query = this.pedidoDetalleRepository
                .createQueryBuilder('detalle')
                .leftJoinAndSelect('detalle.pedidoCabecera', 'pedidoCabecera')
                .leftJoinAndSelect('detalle.sIdTipoOperacion', 'tipoOperacion')
                .where('pedidoCabecera.sDirectoraId = :directoraId', {
                    directoraId,
                })
                .select('DISTINCT tipoOperacion.sCodigo', 'codigo');

            const result = await query.getRawMany();

            // Extraer y ordenar los códigos
            return result
                .map((item) => item.codigo)
                .filter(Boolean)
                .sort();
        } catch (error) {
            console.error(
                'Error al obtener tipos de catálogo para la directora:',
                error,
            );
            return [];
        }
    }
    async getPedidosPorDirectora(
        directoraId: number,
        estado?: string,
        tipoCatalogo?: string,
        page: number = 1,
        limit: number = 10,
    ) {
        try {
            // Primero, obtengamos los tipos de catálogo específicos para esta directora
            // (independiente de otros filtros para asegurar que siempre devolvemos todos los disponibles)
            const tiposCatalogoDirectora =
                await this.getTiposCatalogoByDirectora(directoraId);

            // Base query
            const queryBuilder = this.pedidoDetalleRepository
                .createQueryBuilder('detalle')
                .leftJoinAndSelect('detalle.pedidoCabecera', 'pedidoCabecera')
                .leftJoinAndSelect('detalle.sIdTipoOperacion', 'tipoOperacion')
                .where('pedidoCabecera.sDirectoraId = :directoraId', {
                    directoraId,
                });

            // Aplicar filtro por estado de confirmación/rechazo si se proporciona
            if (estado) {
                if (estado === 'POR_CONFIRMAR') {
                    // Filtrar pedidos que no tienen acción (pendientes de confirmación)
                    queryBuilder.andWhere(
                        "(detalle.sAccionDirectora IS NULL OR detalle.sAccionDirectora = '')",
                    );
                } else {
                    // Filtrar por el estado específico (CONFIRMADO, RECHAZADO, etc.)
                    queryBuilder.andWhere(
                        'detalle.sAccionDirectora = :estado',
                        { estado },
                    );
                }
            }

            // Realizar la consulta para obtener el total de registros
            const total = await queryBuilder.getCount();

            // Calcular paginación
            const skip = (page - 1) * limit;
            const totalPages = Math.ceil(total / limit);

            // Aplicar paginación
            queryBuilder.skip(skip).take(limit);

            // Obtener los pedidos paginados
            const detallesPedido = await queryBuilder.getMany();

            if (!detallesPedido.length) {
                return CustomResponse.execute({
                    status: HttpStatus.OK,
                    message: 'No se encontraron pedidos para esta directora',
                    data: {
                        items: [],
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                    },
                });
            }

            // Obtener IDs de tipos de operación y crear un mapa
            const tipoOperacionIds = [
                ...new Set(
                    detallesPedido.map(
                        (detalle) => detalle.sIdTipoOperacion?.sIdTipoOperacion,
                    ),
                ),
            ].filter(Boolean);

            const tiposOperacion =
                await this.tipoOperacionRepository.findByIds(tipoOperacionIds);

            // Crear el mapa para buscar rápido por ID y colectar los códigos de tipo de operación
            const tipoOperacionMap = tiposOperacion.reduce(
                (acc, tipo) => {
                    acc[tipo.sIdTipoOperacion] = tipo.sCodigo;
                    return acc;
                },
                {} as Record<string, string>,
            );

            // Coleccionar los tipos de catálogo disponibles (códigos de tipo de operación)
            const tiposCatalogo = [
                ...new Set(Object.values(tipoOperacionMap)),
            ].filter(Boolean);

            // Obtener SKUs para conseguir información de stock
            const skus = detallesPedido
                .map((detalle) => detalle.sSkuProducto)
                .filter(Boolean);

            // Consultar información de stock
            const stockInfo = await this.stockPedidosRepository.find({
                where: {
                    skuHijo: In(detallesPedido.map((d) => d.sSkuProducto)),
                },
            });

            // Crear mapa de stock por SKU
            const stockMap = stockInfo.reduce((acc, stock) => {
                acc[stock.skuHijo] = stock;
                return acc;
            }, {});

            // Estructura para agrupar los pedidos
            const pedidosAgrupados: Record<
                string,
                {
                    cantidadTotal: number;
                    pedidos: {
                        datosEstrella: DatosEstrellaExtendida;
                        pedidos: PedidoDetalleAgrupado[];
                    }[];
                }
            > = {};

            // Procesar cada detalle de pedido
            detallesPedido.forEach((detalle) => {
                const tipoOperacion =
                    tipoOperacionMap[
                        detalle.sIdTipoOperacion?.sIdTipoOperacion
                    ] || 'SIN_TIPO';

                // Filtrar por tipo de catálogo si se especifica
                if (tipoCatalogo) {
                    try {
                        const datosProducto = JSON.parse(
                            detalle.sDatosProducto,
                        ) as DatosProducto;
                        // Si no coincide con el filtro de catálogo, omitir este detalle
                        if (
                            datosProducto.tipoCatalogo &&
                            datosProducto.tipoCatalogo !== tipoCatalogo
                        ) {
                            return;
                        }
                    } catch (error) {
                        // Si no se puede parsear, incluir el detalle para evitar perder datos
                        console.error('Error parseando sDatosProducto:', error);
                    }
                }

                // Inicializar la estructura para el tipo de operación si no existe
                if (!pedidosAgrupados[tipoOperacion]) {
                    pedidosAgrupados[tipoOperacion] = {
                        cantidadTotal: 0,
                        pedidos: [],
                    };
                }

                // Parsear datos del producto y estrella con manejo de errores
                let datosProducto: DatosProducto = {
                    sDescripcion: '',
                    sModelo: '',
                    sColor: '',
                    sTalla: '',
                };

                let datosEstrella: DatosEstrella = {
                    nIdCliente: 0,
                    sNombre: '',
                    sApellidos: '',
                    sNumeroCelular: '',
                };

                try {
                    datosProducto = JSON.parse(
                        detalle.sDatosProducto,
                    ) as DatosProducto;
                } catch (error) {
                    console.error('Error parseando sDatosProducto:', error);
                }

                try {
                    datosEstrella = JSON.parse(
                        detalle.sDatosEstrella,
                    ) as DatosEstrella;
                } catch (error) {
                    console.error('Error parseando sDatosEstrella:', error);
                }

                // Verificar si la estrella ya está en la lista del tipo de operación actual
                let estrellaExistente = pedidosAgrupados[
                    tipoOperacion
                ].pedidos.find(
                    (p) =>
                        p.datosEstrella.nIdCliente === datosEstrella.nIdCliente,
                );

                // Si no existe, crear una nueva entrada para esta estrella
                if (!estrellaExistente) {
                    estrellaExistente = {
                        datosEstrella: {
                            nIdCliente: datosEstrella.nIdCliente,
                            sNombre: datosEstrella.sNombre,
                            sApellidos: datosEstrella.sApellidos,
                            sNumeroCelular: datosEstrella.sNumeroCelular,
                            email: datosEstrella.email,
                            direccion: datosEstrella.direccion,
                            nivel: datosEstrella.nivel,
                            zona: datosEstrella.zona,
                            fechaRegistro: datosEstrella.fechaRegistro,
                        },
                        pedidos: [],
                    };
                    pedidosAgrupados[tipoOperacion].pedidos.push(
                        estrellaExistente,
                    );
                }

                // Obtener información de stock para este SKU
                const stockItem = stockMap[detalle.sSkuProducto] || null;

                // Agregar el detalle del pedido a la lista de pedidos de esta estrella
                estrellaExistente.pedidos.push({
                    id: detalle.sIdPedidoDetalle,
                    linea: detalle.nNumeroLinea,
                    cantidad: detalle.nCantidad,
                    precio: detalle.nPrecioUnitario,
                    fecha: detalle.dtFechaPedido,
                    hora: detalle.dtFechaPedido?.toLocaleTimeString(),
                    sAccionDirectora: detalle.sAccionDirectora,
                    fechaAccion: detalle.dtFechaAccionDirectora,
                    datosItem: {
                        descripcion: datosProducto.sDescripcion,
                        modelo: datosProducto.sModelo,
                        idModelo: datosProducto.nIdModelo,
                        urlEcommerce: datosProducto.sUrlEcommerce,
                        imagen:
                            datosProducto.imagenes?.[0]?.sNombreArchivo || null,
                        color: datosProducto.sColor,
                        talla: datosProducto.sTalla,
                        sku: datosProducto.sSkuHijo || detalle.sSkuProducto,
                        categoria: datosProducto.categoria,
                        tipoCatalogo: datosProducto.tipoCatalogo,
                        stockDisponible: stockItem?.stockDisponible,
                        stockReservado: stockItem?.stockReservado,
                        precioSugerido:
                            datosProducto.pricesConfig?.nPvs ||
                            detalle.nPrecioSugerido,
                    },
                    datosEstrella: {
                        nIdCliente: datosEstrella.nIdCliente,
                        sNombre: datosEstrella.sNombre,
                        sApellidos: datosEstrella.sApellidos,
                        sNumeroCelular: datosEstrella.sNumeroCelular,
                        email: datosEstrella.email,
                        direccion: datosEstrella.direccion,
                        nivel: datosEstrella.nivel,
                        zona: datosEstrella.zona,
                        fechaRegistro: datosEstrella.fechaRegistro,
                    },
                });

                // Incrementar el contador total para este tipo de operación
                pedidosAgrupados[tipoOperacion].cantidadTotal++;
            });

            // Estados posibles para filtrado desde el enum
            const estadosPosibles = getEstadosPosibles();

            // Crear la respuesta paginada con metadatos
            const paginatedResponse: PaginatedResponse<
                typeof pedidosAgrupados
            > = {
                items: Object.entries(pedidosAgrupados).map(([key, value]) => ({
                    [key]: value,
                })),
                total,
                page,
                limit,
                totalPages,
                // Metadatos para ayudar al frontend
                metadata: {
                    estados: estadosPosibles,
                    tiposCatalogo: tiposCatalogo.sort(),
                    filtrosAplicados: {
                        estado: estado || null,
                        tipoCatalogo: tipoCatalogo || null,
                    },
                },
            };

            return CustomResponse.execute({
                status: HttpStatus.OK,
                message: 'Pedidos obtenidos exitosamente',
                data: paginatedResponse,
            });
        } catch (error) {
            throw CustomException.execute({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Error al obtener los pedidos',
                error: error.message,
            });
        }
    }
}

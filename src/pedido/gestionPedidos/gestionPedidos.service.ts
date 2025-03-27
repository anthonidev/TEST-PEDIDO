import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PedidoCabecera } from '../../entities/pedidoCabecera.entity';
import { PedidoDetalle } from '../../entities/Pedidodetalle.entity';
import { TipoOperacion } from '@/entities/tipoOperacion.entity';
import {
    DatosEstrella,
    DatosProducto,
    PedidoDetalleAgrupado,
} from './interface/gestionPedidos.response.interface';
import { CustomResponse } from '@/helpers/CustomResponse';
import { CustomException } from '@/helpers/CustomException';

@Injectable()
export class GestionPedidosService {
    constructor(
        @InjectRepository(PedidoDetalle)
        private readonly pedidoDetalleRepository: Repository<PedidoDetalle>,
        @InjectRepository(TipoOperacion)
        private readonly tipoOperacionRepository: Repository<TipoOperacion>,
    ) {}

    async getPedidosPorDirectora(directoraId: number) {
        try {
            const detallesPedido = await this.pedidoDetalleRepository.find({
                where: { pedidoCabecera: { sDirectoraId: directoraId } },
                relations: ['pedidoCabecera', 'sIdTipoOperacion'],
            });

            if (!detallesPedido.length) {
                return CustomResponse.execute({
                    status: HttpStatus.OK,
                    message: 'No se encontraron pedidos para esta directora',
                    data: null,
                });
            }

            const tipoOperacionIds = [
                ...new Set(
                    detallesPedido.map(
                        (detalle) => detalle.sIdTipoOperacion?.sIdTipoOperacion,
                    ),
                ),
            ].filter(Boolean);

            const tiposOperacion =
                await this.tipoOperacionRepository.findByIds(tipoOperacionIds);

            const tipoOperacionMap = tiposOperacion.reduce(
                (acc, tipo) => {
                    acc[tipo.sIdTipoOperacion] = tipo.sCodigo;
                    return acc;
                },
                {} as Record<string, string>,
            );

            const pedidosAgrupados: Record<
                string,
                {
                    cantidadTotal: number;
                    pedidos: {
                        datosEstrella: DatosEstrella;
                        pedidos: PedidoDetalleAgrupado[];
                    }[];
                }
            > = {};

            detallesPedido.forEach((detalle) => {
                const tipoOperacion =
                    tipoOperacionMap[
                        detalle.sIdTipoOperacion?.sIdTipoOperacion
                    ] || 'SIN_TIPO';

                if (!pedidosAgrupados[tipoOperacion]) {
                    pedidosAgrupados[tipoOperacion] = {
                        cantidadTotal: 0,
                        pedidos: [],
                    };
                }

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

                // Verificar si la estrella ya está en la lista
                let estrellaExistente = pedidosAgrupados[
                    tipoOperacion
                ].pedidos.find(
                    (p) =>
                        p.datosEstrella.nIdCliente === datosEstrella.nIdCliente,
                );

                if (!estrellaExistente) {
                    estrellaExistente = {
                        datosEstrella: datosEstrella,
                        pedidos: [],
                    };
                    pedidosAgrupados[tipoOperacion].pedidos.push(
                        estrellaExistente,
                    );
                }

                estrellaExistente.pedidos.push({
                    id: detalle.sIdPedidoDetalle,
                    datosItem: {
                        descripcion: datosProducto.sDescripcion,
                        modelo: datosProducto.sModelo,
                        color: datosProducto.sColor,
                        talla: datosProducto.sTalla,
                    },
                    linea: detalle.nNumeroLinea,
                    cantidad: detalle.nCantidad,
                    precio: detalle.nPrecioUnitario,
                    fecha: detalle.dtFechaPedido,
                    hora: detalle.dtFechaPedido?.toLocaleTimeString(),
                    datosEstrella: datosEstrella,
                });

                pedidosAgrupados[tipoOperacion].cantidadTotal++;
            });

            return CustomResponse.execute({
                status: HttpStatus.OK,
                message: 'Pedidos obtenidos exitosamente',
                data: pedidosAgrupados,
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

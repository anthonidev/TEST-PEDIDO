import { NATS_SERVICE } from '@/config/services';
import { StockPedidos } from '@/entities/stockPedidos.entity';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { QueryRunner } from 'typeorm';
import { PedidoService } from '../pedido.service';

@Injectable()
export class StockService {
    constructor(
        @Inject(NATS_SERVICE) private readonly client: ClientProxy,
        @Inject(forwardRef(() => PedidoService))
        private readonly pedidoService: PedidoService,
    ) {}

    public async actualizarStockPedido(
        queryRunner: QueryRunner,
        skuHijo: string,
        nivelPrecio: string,
        cantidad: number,
        stockReal?: number, // Parámetro opcional para evitar consulta extra
    ) {
        let stockRealLocal = stockReal;

        if (!stockRealLocal) {
            // Solo consultar si no se pasó como parámetro
            const stockData = await this.pedidoService.listarProductoPorSku({
                sSkuItem: skuHijo,
                sPriceLevel: nivelPrecio,
            });

            if (!stockData?.data) {
                throw new Error(`No se encontró el stock para SKU ${skuHijo}`);
            }

            stockRealLocal = stockData.data.stock.stockReal;
        }

        const stockExistente = await queryRunner.manager.findOne(StockPedidos, {
            where: { skuHijo, nivelPrecio },
        });

        if (!stockExistente) {
            // Al crear un nuevo registro, el stockDisponible se mantiene igual al stockReal
            const nuevoStock = queryRunner.manager.create(StockPedidos, {
                skuHijo,
                nivelPrecio,
                stockReal: stockRealLocal,
                stockDisponible: stockRealLocal, // No se modifica aquí
                stockReservado: cantidad, // Solo se actualiza el reservado
                stockConfirmado: 0,
            });

            await queryRunner.manager.save(StockPedidos, nuevoStock);
        } else {
            // Solo actualizamos el stockReservado, sin tocar stockDisponible aún
            stockExistente.stockReservado += cantidad;

            await queryRunner.manager.save(StockPedidos, stockExistente);
        }
    }

    public async actualizarStockPedidoConfirmado(
        queryRunner: QueryRunner,
        skuHijo: string,
        nivelPrecio: string,
        cantidadConfirmada: number,
    ) {
        const stockExistente = await queryRunner.manager.findOne(StockPedidos, {
            where: { skuHijo, nivelPrecio },
        });

        if (!stockExistente) {
            throw new Error(
                `No se encontró stock para SKU ${skuHijo} y nivel de precio ${nivelPrecio}`,
            );
        }

        // Se mantiene el stockReservado y se mueve a stockConfirmado
        stockExistente.stockConfirmado += cantidadConfirmada;
        stockExistente.stockDisponible -= cantidadConfirmada;

        await queryRunner.manager.save(StockPedidos, stockExistente);
    }

    public async actualizarStockPedidoRechazado(
        queryRunner: QueryRunner,
        skuHijo: string,
        nivelPrecio: string,
        cantidadRechazada: number,
    ) {
        const stockExistente = await queryRunner.manager.findOne(StockPedidos, {
            where: { skuHijo, nivelPrecio },
        });

        if (!stockExistente) {
            throw new Error(
                `No se encontró stock para SKU ${skuHijo} y nivel de precio ${nivelPrecio}`,
            );
        }

        // Se resta del stock reservado
        stockExistente.stockReservado -= cantidadRechazada;

        await queryRunner.manager.save(StockPedidos, stockExistente);
    }

    public async actualizarStockPedidoEliminado(
        queryRunner: QueryRunner,
        skuHijo: string,
        nivelPrecio: string,
        cantidadEliminada: number,
    ) {
        const stockExistente = await queryRunner.manager.findOne(StockPedidos, {
            where: { skuHijo, nivelPrecio },
        });

        if (!stockExistente) {
            throw new Error(
                `No se encontró stock para SKU ${skuHijo} y nivel de precio ${nivelPrecio}`,
            );
        }

        // Revertir la confirmación y liberar stock
        stockExistente.stockConfirmado -= cantidadEliminada;
        stockExistente.stockReservado -= cantidadEliminada;
        stockExistente.stockDisponible += cantidadEliminada;

        await queryRunner.manager.save(StockPedidos, stockExistente);
    }

    public async revertirStockPedidoConfirmado(
        queryRunner: QueryRunner,
        skuHijo: string,
        nivelPrecio: string,
        cantidad: number,
    ) {
        const stockExistente = await queryRunner.manager.findOne(StockPedidos, {
            where: { skuHijo, nivelPrecio },
        });

        if (!stockExistente) {
            throw new Error(
                `No se encontró stock para SKU ${skuHijo} y nivel de precio ${nivelPrecio}`,
            );
        }

        // Se resta del stock confirmado y del stock reservado
        stockExistente.stockConfirmado -= cantidad;
        stockExistente.stockReservado -= cantidad;
        stockExistente.stockDisponible += cantidad;

        await queryRunner.manager.save(StockPedidos, stockExistente);
    }
}

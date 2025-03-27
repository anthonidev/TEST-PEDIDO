import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfiguracionCierreService } from './configCortesPedidos.service';
import * as cron from 'node-cron';
import { PedidoService } from './pedido.service';

@Injectable()
export class CronService implements OnApplicationBootstrap {
    private readonly logger = new Logger(CronService.name);

    constructor(
        private readonly configuracionCierreService: ConfiguracionCierreService,
        private readonly pedidoService: PedidoService,
    ) { }

    onApplicationBootstrap() {
        this.logger.log('🚀 Iniciando tareas programadas...');

        // Tarea programada: actualiza las configuraciones a las 4 AM todos los días
        cron.schedule('0 5 * * *', async () => {
            this.logger.log('🔄 Actualizando configuraciones de cierre...');
            await this.configuracionCierreService.actualizarConfiguracionesCierre();
        });

        // Tarea programada: verifica el cierre de bolsa cada minuto
        cron.schedule('0 * * * *', async () => {
            this.logger.log('🔎 Ejecutando cierre de bolsa...');
            const configuraciones =
                await this.configuracionCierreService.obtenerConfiguracionesParaHoy();
            this.logger.log(`📌 Configuraciones para hoy: ${configuraciones}`);

            const horaActual = new Intl.DateTimeFormat('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'America/Lima', // Ajusta según tu zona horaria
            }).format(new Date());

            this.logger.log(`🕐 Hora actual: ${horaActual}`);

            for (const config of configuraciones) {
                const horaCierre = config.sHoraCierre.substring(0, 8); // Asegurar formato HH:mm:ss
                this.logger.log(`⌛ Comparando con hora de cierre: ${horaCierre}`);

                if (horaActual === horaCierre) {
                    this.logger.log(
                        `✅ Ejecutando cierre de pedidos para la directora ${config.nIdDirectora}...`,
                    );
                    await this.pedidoService.cerrarPedidos(config.nIdDirectora);
                }
            }
        });
    }
}

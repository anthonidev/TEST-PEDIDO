import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionCierre } from '../entities/configuracionCierre.entity';
import { PedidoService } from './pedido.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConfiguracionCierreService {
    constructor(
        @InjectRepository(ConfiguracionCierre)
        private readonly configuracionCierreRepository: Repository<ConfiguracionCierre>,
        private readonly pedidoService: PedidoService, // Inyectar el servicio de pedidos
    ) {}

    // Método para limpiar la tabla
    private async limpiarConfiguracionesCierre() {
        await this.configuracionCierreRepository.clear(); // Elimina todos los registros de la tabla
    }

    // Método para llenar la tabla con los datos del JSON
    private async llenarConfiguracionesCierre() {
        console.log('Llenando la tabla configuracion_cierre...');
        const directoras = await this.pedidoService.listarCortes();
        console.log('Datos obtenidos:', directoras);

        // Obtener el día actual
        const diaActual = this.obtenerDiaActual();
        console.log('Día actual:', diaActual);

        for (const directora of directoras) {
            console.log('directora', directora);
            // Verificar si el día actual está en los días de cierre del usuario
            if (directora.centroModa.horario.sDiasCierre.includes(diaActual)) {
                const configuracion = this.configuracionCierreRepository.create(
                    {
                        sIdConfiguracionCierre: uuidv4(),
                        nIdDirectora: directora.nIdDirectora,
                        sCentroModaId: directora.nIdCliente.toString(),
                        sDiasCierre: diaActual, // Guardar solo el día actual
                        sHoraCierre: directora.centroModa.horario.sHoraCierre,
                        sHorarioAtencionInicio:
                            directora.centroModa.horario
                                .sHorarioAtencionInicoLV,
                        sHorarioAtencionFin:
                            directora.centroModa.horario.sHorarioAtencionFinLV,
                        nPlazoCambio: directora.centroModa.horario.nPlazoCambio,
                    },
                );
                await this.configuracionCierreRepository.save(configuracion);
                console.log(
                    `Configuración guardada para el cliente ${directora.nIdCliente} en el día ${diaActual}.`,
                );
            } else {
                console.log(
                    `El cliente ${directora.nIdCliente} no tiene cierre programado para el día ${diaActual}.`,
                );
            }
        }
        console.log('Tabla configuracion_cierre llenada correctamente.');
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

    async obtenerConfiguracionesParaHoy(): Promise<ConfiguracionCierre[]> {
        const diaActual = this.obtenerDiaActual(); // Obtener el día actual
        const configuraciones = await this.configuracionCierreRepository.find(); // Obtener todas las configuraciones

        // Filtrar las configuraciones que incluyan el día actual
        return configuraciones.filter((configuracion) =>
            configuracion.sDiasCierre.includes(diaActual),
        );
    }

    async actualizarConfiguracionesCierre() {
        try {
            console.log('Limpiando configuraciones de cierre...');
            await this.limpiarConfiguracionesCierre();
            console.log('Llenando configuraciones de cierre...');
            await this.llenarConfiguracionesCierre();
            console.log(
                'Configuraciones de cierre actualizadas correctamente.',
            );
        } catch (error) {
            console.error(
                'Error al actualizar configuraciones de cierre:',
                error,
            );
        }
    }

    async cerrarPedidosProgramados() {
        const configuraciones = await this.obtenerConfiguracionesParaHoy();
        const horaActual = new Date().toTimeString().slice(0, 5); // Formato HH:mm

        for (const config of configuraciones) {
            if (config.sHoraCierre === horaActual) {
                console.log(
                    `Ejecutando cierre de pedidos para la directora ${config.nIdDirectora}...`,
                );
                await this.pedidoService.cerrarPedidos(config.nIdDirectora);
            }
        }
    }
}

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { PedidoDetalle } from './Pedidodetalle.entity';
import { PedidoAuditoria } from './auditoria.entity';
import { HistorialEstado } from './historialEstado.entity';
import { TipoOperacion } from './tipoOperacion.entity';
import { FormaPago } from './formaPago.entity';
import { ConceptoDetraccion } from './conceptoDetraccion.entity';
import { MetodoPagoDetraccion } from './metodoPagoDetraccion.entity';
import { Termino } from './termino.entity';
import { SerieNs } from './serieNs.entity';
import { CondicionPago } from './condicionPago.entity';
import { Tracking } from './tracking.entity';

@Entity({ name: 'pedidos_cabecera' })
export class PedidoCabecera {
    @PrimaryGeneratedColumn('uuid')
    sIdPedidoCabecera: string;

    @Column({ unique: false, nullable: true }) // Ahora puede ser nulo
    sIdExterno: string;

    @Column({ unique: true, nullable: true }) // Ahora puede ser nulo
    sNumeroPedido: string;

    @Column({ nullable: true })
    sNumeroOrdenCompra: string;

    @Column('timestamp', { nullable: true }) // Ahora puede ser nulo
    dtFechaPedido: Date;

    @Column({ nullable: true })
    sNota: string;

    @Column({ nullable: true }) // Ahora puede ser nulo
    sDirectoraId: number;

    @Column({ nullable: true }) // Ahora puede ser nulo
    sNombreDirectora: string;

    @ManyToOne(() => CondicionPago, (condicionPago) => condicionPago.pedidos, {
        nullable: true,
    })
    @JoinColumn({ name: 'sCondicionPagoId' })
    condicionPago: CondicionPago;

    @Column({ nullable: true })
    sCondicionPagoId: string;

    @Column({ nullable: true }) // Ahora puede ser nulo
    sTipoDocumentoId: string;

    @Column({ nullable: true })
    sSerieNsId: string;

    @ManyToOne(() => SerieNs, (serieNs) => serieNs.pedidos, { nullable: true })
    @JoinColumn({ name: 'sSerieNsId' })
    serieNs: SerieNs;

    @Column({ default: false, nullable: true }) // Ahora puede ser nulo
    bOperacionGratuita: boolean;

    @Column({ nullable: true })
    sFormaPagoId: string;

    @ManyToOne(() => FormaPago, (formaPago) => formaPago.pedidos, {
        nullable: true,
    })
    @JoinColumn({ name: 'sFormaPagoId' })
    formaPago: FormaPago;

    @Column({ nullable: true })
    sConceptoDetraccionId: string;

    @ManyToOne(
        () => ConceptoDetraccion,
        (conceptoDetraccion) => conceptoDetraccion.pedidos,
        { nullable: true },
    )
    @JoinColumn({ name: 'sConceptoDetraccionId' })
    conceptoDetraccion: ConceptoDetraccion;

    @Column({ nullable: true })
    sMetodoPagoDetraccionId: string;

    @ManyToOne(
        () => MetodoPagoDetraccion,
        (metodoPagoDetraccion) => metodoPagoDetraccion.pedidos,
        { nullable: true },
    )
    @JoinColumn({ name: 'sMetodoPagoDetraccionId' })
    metodoPagoDetraccion: MetodoPagoDetraccion;

    @Column({ default: 'PENDIENTE', nullable: true })
    sEstadoAprobacion: string;

    @Column('timestamp', { nullable: true }) // Ahora puede ser nulo
    dtFechaCorte: Date;

    @Column({ default: 'ABIERTO', nullable: true })
    sEstadoCierre: string;

    @Column({ default: 'PENDIENTE', nullable: true })
    sEstadoAprobacionSokso: string;

    @ManyToOne(() => Termino, (termino) => termino.pedidos, { nullable: true })
    @JoinColumn({ name: 'sTerminoId' })
    termino: Termino;

    @Column({ nullable: true })
    sTerminoId: string;

    @Column({ nullable: true })
    nTotalPaquetes: number;

    @Column({ nullable: true })
    nCantidadDespachada: number;

    @Column({ nullable: true })
    sNumeroFactura: string;

    @Column({ nullable: true })
    sNumeroGuia: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    nSubtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    nTotalImpuesto: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    nTotal: number;

    @Column({ nullable: true })
    sAuditoriaId: string;

    @ManyToOne(() => PedidoAuditoria, (auditoria) => auditoria.pedidoCabecera, {
        nullable: true,
    })
    @JoinColumn({ name: 'sAuditoriaId' })
    auditoria: PedidoAuditoria;

    @OneToMany(
        () => PedidoDetalle,
        (detallePedido) => detallePedido.pedidoCabecera,
        { nullable: true },
    )
    detallesPedido: PedidoDetalle[];

    @OneToMany(
        () => HistorialEstado,
        (historialEstado) => historialEstado.pedidoCabecera,
        { nullable: true },
    )
    historialEstado: HistorialEstado[];

    @Column({ default: 'PENDIENTE', nullable: true })
    sEstadoTracking: string; // Estado del tracking actual

    @OneToMany(() => Tracking, (tracking) => tracking.pedidoCabecera)
    trackings: Tracking[];
}

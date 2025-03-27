import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { PedidoCabecera } from './pedidoCabecera.entity';
import { PedidoAuditoria } from './auditoria.entity';
import { TipoOperacion } from './tipoOperacion.entity';

@Entity({ name: 'pedidos_detalle' })
export class PedidoDetalle {
    @PrimaryGeneratedColumn('uuid')
    sIdPedidoDetalle: string;

    // Relación con PedidoCabecera
    @ManyToOne(
        () => PedidoCabecera,
        (pedidoCabecera) => pedidoCabecera.detallesPedido,
        { nullable: false },
    )
    @JoinColumn({ name: 'sPedidoId' })
    pedidoCabecera: PedidoCabecera;

    @Column({ nullable: false })
    sPedidoId: string;

    // Información del pedido
    @Column({ type: 'integer', nullable: false })
    nNumeroLinea: number;

    @Column('timestamp', { nullable: true })
    dtFechaPedido: Date;

    // Tipo de Operación
    @ManyToOne(
        () => TipoOperacion,
        (tipoOperacion) => tipoOperacion.pedidosDetalle,
        {
            nullable: true,
        },
    )
    @JoinColumn({ name: 'sTipoOperacionId' })
    sIdTipoOperacion: TipoOperacion;

    // Estrella del pedido

    @Column({ nullable: true })
    sDatosEstrella: string;

    @Column({ nullable: true })
    sEstrellaId: number;

    // Confirmación de la Directora
    @Column({ nullable: true })
    sAccionDirectora: string;

    @Column('timestamp', { nullable: true })
    dtFechaAccionDirectora: string;

    // Información del producto

    @Column({ nullable: true })
    sDatosProducto: string;

    @Column({ nullable: true })
    sSkuProducto: string;

    @Column({ nullable: false })
    sPedidoItemId: string;

    @Column({ nullable: false })
    sArticuloId: number;

    @Column({ nullable: true })
    sNivelPrecioId: string;

    @Column({ nullable: true })
    sCodigoUm: string;

    // Cantidades y precios
    @Column({ type: 'integer', nullable: false })
    nCantidad: number;

    @Column({ type: 'integer', nullable: true })
    nCantidadComprometida: number;

    @Column({ type: 'integer', nullable: true })
    nCantidadDespachada: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    nPrecioSugerido: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    nPrecioUnitario: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    nSubtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    nMontoImpuesto: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    nTotal: number;

    @Column({ default: false, nullable: true })
    bEsBonificacion: boolean;

    // Impuestos
    @Column({ nullable: false })
    sCodigoImpuestoId: string;

    @Column({ nullable: true })
    sNsAfectaIgv: string;

    @Column({ nullable: true })
    sNsCodigoImpuesto: string;

    // Auditoría
    @Column({ nullable: true })
    sAuditoriaId: string;

    @ManyToOne(() => PedidoAuditoria, (auditoria) => auditoria.pedidoDetalle, {
        nullable: true,
    })
    @JoinColumn({ name: 'sAuditoriaId' })
    auditoria: PedidoAuditoria;

    // Ubicación y clasificación
    @Column({ nullable: true })
    sDepartamentoId: string;

    @Column({ nullable: true })
    sUbicacionId: string;

    @Column({ nullable: true })
    sClaseId: string;
}

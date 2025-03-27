import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { PedidoCabecera } from './pedidoCabecera.entity';
import { TrackingNetSuite } from './trackingNetSuite.entity';

@Entity({ name: 'pedidos_tracking' })
export class Tracking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => PedidoCabecera, (pedido) => pedido.trackings, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'sPedidoId' })
    pedidoCabecera: PedidoCabecera;

    @Column()
    sDirectora: number;

    @Column()
    sStatus: string;

    @CreateDateColumn({ type: 'timestamp' })
    dFechaCambio: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaDespacho: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaEnTransito: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaEnZona: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaEnDistribucion: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaCompromisoEntrega: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaEntregaEfectiva: Date;

    @OneToOne(() => TrackingNetSuite, (trackingNs) => trackingNs.tracking, {
        nullable: true,
        cascade: true,
    })
    @JoinColumn({ name: 'trackingNetSuiteId' })
    trackingNetSuite?: TrackingNetSuite;
}

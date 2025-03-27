import {
    Column,
    CreateDateColumn,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Tracking } from './tracking.entity';

@Entity({ name: 'pedidos_tracking_netsuite' })
export class TrackingNetSuite {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Tracking, (tracking) => tracking.trackingNetSuite)
    tracking: Tracking;

    @Column()
    sStatusNetSuite: string; // Estado en NetSuite

    @CreateDateColumn({ type: 'timestamp' })
    dFechaCambio: Date; // Fecha en que cambió a este estado en NetSuite

    @Column({ type: 'timestamp', nullable: true })
    dFechaAprobacionPendiente: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaPreparandoPedido: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaFacturacionPendiente: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaFacturacion: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaDespachado: Date;

    @Column({ type: 'timestamp', nullable: true })
    dFechaEnTransito: Date;
}

import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PedidoCabecera } from './pedidoCabecera.entity';
import { PedidoDetalle } from './Pedidodetalle.entity';

@Entity({ name: 'pedidos_auditoria' })
export class PedidoAuditoria {
    @PrimaryGeneratedColumn('uuid')
    sIdPedidoAuditoria: string;

    @Column()
    sTablaReferencia: string;

    @Column({ nullable: true })
    sIdReferencia: string;

    @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
    dtFechaCreacion: Date;

    @Column({ nullable: true })
    sUsuarioCreacionId: string;

    @Column('timestamp', { nullable: true })
    dtFechaModificacion: Date;

    @Column({ nullable: true })
    sUsuarioModificacionId: string;

    @ManyToOne(
        () => PedidoCabecera,
        (pedidoCabecera) => pedidoCabecera.auditoria,
    )
    pedidoCabecera: PedidoCabecera;

    @ManyToOne(() => PedidoDetalle, (pedidoDetalle) => pedidoDetalle.auditoria)
    pedidoDetalle: PedidoDetalle;
}

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PedidoCabecera } from './pedidoCabecera.entity';
import { PedidoDetalle } from './Pedidodetalle.entity';

@Entity({ name: 'pedidos_tipo_operacion' })
export class TipoOperacion {
    @PrimaryGeneratedColumn('uuid')
    sIdTipoOperacion: string;

    @Column({ unique: true })
    sCodigo: string;

    @Column()
    sNombre: string;

    @OneToMany(
        () => PedidoDetalle,
        (pedidoDetalle) => pedidoDetalle.sIdTipoOperacion,
    )
    pedidosDetalle: PedidoDetalle[];
}

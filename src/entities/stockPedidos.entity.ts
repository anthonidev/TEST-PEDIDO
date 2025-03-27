import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pedidos_stock' })
export class StockPedidos {
    @PrimaryGeneratedColumn()
    sIdStock: number;

    @Column()
    skuHijo: string;

    @Column()
    nivelPrecio: string;

    @Column()
    stockReal: number;

    @Column()
    stockDisponible: number;

    @Column()
    stockReservado: number;

    @Column()
    stockConfirmado: number;
}

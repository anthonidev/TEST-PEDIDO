import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PedidoCabecera } from "./pedidoCabecera.entity";

@Entity({ name: "pedidos_historial_estado" })
export class HistorialEstado {
  @PrimaryGeneratedColumn("uuid")
  sIdHistorialEstado: string;

  @Column()
  sPedidoId: string;

  @ManyToOne(() => PedidoCabecera, (pedidoCabecera) => pedidoCabecera.historialEstado)
  @JoinColumn({ name: "sPedidoId" })
  pedidoCabecera: PedidoCabecera;

  @Column()
  sEstado: string;

  @Column("timestamp", { default: () => "CURRENT_TIMESTAMP" })
  dtFechaCambio: Date;

  @Column({ nullable: true })
  sObservacion: string;
}
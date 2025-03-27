import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PedidoCabecera } from "./pedidoCabecera.entity";

@Entity({ name: "pedidos_condiciones_pago" })
export class CondicionPago {
  @PrimaryGeneratedColumn("uuid")
  sIdCondicionPago: string;

  @Column({ unique: true })
  sCodigo: string;

  @Column()
  sNombre: string;

  @Column({ nullable: true })
  sDescripcion: string;

  @OneToMany(() => PedidoCabecera, (pedidoCabecera) => pedidoCabecera.condicionPago)
  pedidos: PedidoCabecera[];
}
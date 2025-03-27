
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PedidoCabecera } from "./pedidoCabecera.entity";

@Entity({ name: "pedidos_forma_pago" })
export class FormaPago {
  @PrimaryGeneratedColumn("uuid")
  sIdFormaPago: string;

  @Column({ unique: true })
  sCodigo: string;

  @Column()
  sNombre: string;

  @OneToMany(() => PedidoCabecera, (pedidoCabecera) => pedidoCabecera.formaPago)
  pedidos: PedidoCabecera[];
}
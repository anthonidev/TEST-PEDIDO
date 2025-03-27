import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PedidoCabecera } from "./pedidoCabecera.entity";

@Entity({ name: "pedidos_termino" })
export class Termino {
  @PrimaryGeneratedColumn("uuid")
  sIdTermino: string;

  @Column({ unique: true })
  sCodigo: string;

  @Column()
  sNombre: string;

  @OneToMany(() => PedidoCabecera, (pedidoCabecera) => pedidoCabecera.termino)
  pedidos: PedidoCabecera[];
}
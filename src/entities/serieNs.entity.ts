import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PedidoCabecera } from "./pedidoCabecera.entity";

@Entity({ name: "pedidos_serie_ns" })
export class SerieNs {
  @PrimaryGeneratedColumn("uuid")
  sIdSerieNs: string;

  @Column({ unique: true })
  sCodigo: string;

  @Column()
  sNombre: string;

  @OneToMany(() => PedidoCabecera, (pedidoCabecera) => pedidoCabecera.serieNs)
  pedidos: PedidoCabecera[];
}
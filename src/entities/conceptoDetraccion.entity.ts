import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PedidoCabecera } from "./pedidoCabecera.entity";


@Entity({ name: "pedidos_concepto_detraccion" })
export class ConceptoDetraccion {
  @PrimaryGeneratedColumn("uuid")
  sIdConceptoDetraccion: string;

  @Column({ unique: true })
  sCodigo: string;

  @Column()
  sNombre: string;

  @Column({ default: 0 })
  nTasa: number;

  @OneToMany(() => PedidoCabecera, (pedidoCabecera) => pedidoCabecera.conceptoDetraccion)
  pedidos: PedidoCabecera[];
}
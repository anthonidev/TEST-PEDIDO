  import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
  import { PedidoCabecera } from "./pedidoCabecera.entity";

  @Entity({ name: "pedidos_metodo_pago_detraccion" })
  export class MetodoPagoDetraccion {
      @PrimaryGeneratedColumn("uuid")
      sIdMetodoPagoDetraccion: string;
    
      @Column({ unique: true })
      sCodigo: string;
    
      @Column()
      sNombre: string;
    
      @OneToMany(() => PedidoCabecera, (pedidoCabecera) => pedidoCabecera.metodoPagoDetraccion)
      pedidos: PedidoCabecera[];
    }
    
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'configuraciones_cierre' })
export class ConfiguracionCierre {
    @PrimaryGeneratedColumn('uuid')
    sIdConfiguracionCierre: string;

    @Column({ nullable: false })
    nIdDirectora: number; // ID del cliente

    @Column({ nullable: false })
    sCentroModaId: string; // ID del centro de moda

    @Column({ nullable: false })
    sDiasCierre: string; // Días de cierre (ejemplo: "Lunes,Martes")

    @Column({ nullable: false })
    sHoraCierre: string; // Hora de cierre (ejemplo: "20:00:00")

    @Column({ nullable: false })
    sHorarioAtencionInicio: string; // Hora de inicio de atención (ejemplo: "08:00:00")

    @Column({ nullable: false })
    sHorarioAtencionFin: string; // Hora de fin de atención (ejemplo: "20:00:00")

    @Column({ nullable: true })
    nPlazoCambio: number; // Plazo de cambio (ejemplo: 7 días)
}

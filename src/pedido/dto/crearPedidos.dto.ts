import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';

// DTOs para validar la entrada
export class PedidoDetalleDTO {
    @IsInt()
    @Min(1)
    item: number;

    @IsString()
    sDescripcionProducto: string;

    @IsInt()
    @Min(1)
    nCantidad: number;

    @IsString()
    sNivelPrecio: string;

    @IsString()
    sPromotoraId: string;

    @IsString()
    sDepartamentoId: string;

    @IsString()
    sTipoOperacionId: string;

    @IsString()
    sUbicacionId: string;
}

export class CrearPedidoDTO {
    @IsInt()
    @Min(1)
    clienteId: number;

    @IsString()
    sUsuarioCreacionId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PedidoDetalleDTO)
    detalles: PedidoDetalleDTO[];
}

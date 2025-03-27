import { IsNotEmpty, IsString } from 'class-validator';

export class GetArticlePedidoDto {
    @IsString()
    @IsNotEmpty({
        message: 'El SKU del articulo es requerido',
    })
    sSkuItem: string;

    @IsString()
    @IsNotEmpty({
        message: 'El nivel de precio es requerido',
    })
    sPriceLevel: string;
}

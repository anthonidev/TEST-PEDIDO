import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PedidoModule } from '@/pedido/pedido.module';
import { CommonModule } from '@/common/common.module';
import { envs } from '@/config/envs';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: () => ({
                type: 'postgres',
                url: envs.dbUri,
                autoLoadEntities: true,
                synchronize: true, // Consider disabling in production
            }),
        }),
        PedidoModule,
        CommonModule,
    ],
})
export class AppModule {}

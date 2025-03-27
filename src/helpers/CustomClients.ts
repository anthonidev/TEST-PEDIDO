import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

interface ICustomClient {
    messagePattern: string;
    payload: unknown;
}

export class CustomClient {
    constructor(private readonly client: ClientProxy) {}

    async send<T>({ messagePattern, payload }: ICustomClient): Promise<T> {
        const result = await lastValueFrom(
            this.client.send<T>({ cmd: messagePattern }, payload),
        );

        return result;
    }
}

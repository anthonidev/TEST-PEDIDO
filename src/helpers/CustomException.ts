import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

interface ICustomException {
    status: number;
    message: string;
    [key: string]: unknown;
}

export class CustomException extends RpcException {
    constructor(props: ICustomException) {
        super(props);
        Object.assign(this, props);
    }

    static execute(props: ICustomException) {
        return new CustomException(props);
    }
}

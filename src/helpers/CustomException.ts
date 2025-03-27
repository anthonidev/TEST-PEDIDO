import { RpcException } from '@nestjs/microservices';

interface ICustomException {
  status: number;
  message: string;
  [key: string]: unknown;
}

export class CustomException {
  static execute(props: ICustomException) {
    return new RpcException({
      ...props,
    });
  }
}
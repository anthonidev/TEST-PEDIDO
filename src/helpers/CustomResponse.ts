interface ICustomResponse {
    status: number;
    message: string;
    data?: unknown;
    [key: string]: unknown;
  }
  
  export class CustomResponse {
    static execute(props: ICustomResponse) {
      return {
        ...props,
        status: props.status || 500,
        message: props.message || 'Internal server error',
        data: props.data,
      };
    }
  }
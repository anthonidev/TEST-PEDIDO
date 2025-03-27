import { DeepPartial, Repository } from 'typeorm';

import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

export class BaseService<T> {
  private readonly logger = new Logger(BaseService.name);

  constructor(protected readonly repository: Repository<T>) {}

  async create(dto: DeepPartial<T>): Promise<T> {
    try {
      const newItem = this.repository.create(dto);
      await this.repository.save(newItem);
      return newItem;
    } catch (err) {
      this.handleDBExceptions(err);
    }
  }

  async findOne(whereCondition: Record<string, any>): Promise<T> {
    try {
      const res = await this.repository.findOne({ where: whereCondition });
      if (!res)
        throw new BadRequestException(
          'No se encontraron resultados ' + JSON.stringify(whereCondition),
        );
      return res;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async findAll<K extends keyof T>(
    whereCondition: Record<string, any>,
    selectFields: K[],
  ): Promise<Pick<T, K>[]> {
    try {
      return await this.repository.find({
        where: whereCondition,
        select: selectFields,
      });
    } catch (err) {
      this.handleDBExceptions(err);
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await this.repository.createQueryBuilder().delete().where({}).execute();
    } catch (err) {
      this.handleDBExceptions(err);
    }
  }

  private handleDBExceptions(err: any): void {
    if (err.code === '23505') throw new BadRequestException(err.detail);
    console.log(err);
    this.logger.error(err.code);
    this.logger.error(err.message);
    throw new InternalServerErrorException('Ocurrió un error inesperadoq');
  }
}

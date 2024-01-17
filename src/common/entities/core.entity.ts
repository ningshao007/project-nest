import { Field, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
export class CoreEntity {
  @PrimaryGeneratedColumn()
  // NOTE: 这个@Field装饰器是用来将id字段映射到GraphQL中去的,在GraphQL查询中使用,如果去掉了,就不能在GraphQL查询中使用了
  @Field(() => Number)
  @IsNumber()
  id: number;

  @CreateDateColumn()
  @Field(() => Date)
  createAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updateAt: Date;
}

import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payment/entities/payment.entity';

export enum UserRole {
  CLIENT = 'CLIENT',
  OWNER = 'OWNER',
  DELIVERY = 'DELIVERY',
}

registerEnumType(UserRole, { name: 'UserRole' });

// NOTE: @InputType装饰器用来定义一个GraphQL输入类型,表示这个类型可以在GraphQL查询中作为输入参数使用,isAbstract:true表示这个输入类型是一个抽象类型,抽象类型是 GraphQL 中的一种特殊类型，它不能被直接查询到，但是它可以被继承，其他类型可以扩展它。抽象类型通常用来定义一些共用字段，这些字段可以被多个具体类型继承使用。
@InputType('UserInputType', { isAbstract: true })
// NOTE: @ObjectType装饰器用来定义一个GraphQL对象类型,表示这个类型可以在GraphQL查询中被查询到
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsEmail()
  email: string;

  @Column()
  @Field(() => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(() => Boolean)
  @IsBoolean()
  verified: boolean;

  @Field(() => [Restaurant])
  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  restaurants: Restaurant[];

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.driver)
  rides: Order[];

  @Field(() => [Payment])
  @OneToMany(() => Payment, (payment) => payment.user, { eager: true })
  payments: Payment[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (e) {
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      const isCorrect = await bcrypt.compare(aPassword, this.password);

      return isCorrect;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

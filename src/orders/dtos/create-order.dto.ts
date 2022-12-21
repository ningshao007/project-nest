import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { OrderItemOption } from '../entities/order-item.entity';

@InputType()
export class CreateOrderInput {
  @Field(() => Int)
  @IsNumber()
  restaurantId: number;

  @Field(() => [CreateOrderItemInput])
  items: CreateOrderItemInput[];
}

@InputType()
export class CreateOrderItemInput {
  @Field(() => Int)
  @IsNumber()
  dishId: number;

  @Field(() => [OrderItemOption], { nullable: true })
  options?: OrderItemOption[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}

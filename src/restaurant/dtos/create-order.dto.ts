import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from 'src/orders/entities/order.entity';

@InputType()
export class CreateOrderInput extends PickType(Order, ['dishes']) {
  @Field(() => Int)
  // @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}

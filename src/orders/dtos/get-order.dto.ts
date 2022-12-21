import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class GetOrderInput {
  @Field(() => Int)
  @IsNumber()
  id: number;
}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
  @Field(() => Order, { nullable: true })
  order?: Order;
}

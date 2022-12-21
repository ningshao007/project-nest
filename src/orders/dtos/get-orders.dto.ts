import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order, OrderStatus } from '../entities/order.entity';

@InputType()
export class GetOrdersInput {
  @Field(() => OrderStatus, { defaultValue: OrderStatus.PENDING })
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

@ObjectType()
export class GetOrdersOutput extends CoreOutput {
  @Field(() => [Order], { nullable: true })
  orders?: Order[];
}

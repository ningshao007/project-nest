import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class RestaurantInput {
  @Field(() => Int)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class RestaurantOutput extends CoreOutput {
  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}

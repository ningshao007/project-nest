import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CreateRestaurantInput } from './create-restaurant.dto';

@InputType()
class UpdateRestaurantInputType extends PartialType(CreateRestaurantInput) {}

@InputType()
export class UpdateRestaurantDto {
  @Field(() => Number)
  @IsNumber()
  id: number;

  @Field(() => UpdateRestaurantInputType)
  data: UpdateRestaurantInputType;
}

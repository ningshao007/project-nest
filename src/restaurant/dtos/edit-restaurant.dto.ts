import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CreateRestaurantInput } from './create-restaurant.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
  @Field(() => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}

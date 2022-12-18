import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class CreateRestaurantInput extends OmitType(Restaurant, [
  'id',
  'category',
  'owner',
]) {
  @Field(() => String)
  @IsString()
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}

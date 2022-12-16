import { ArgsType, Field, InputType, OmitType } from '@nestjs/graphql';
import { Restaurant } from './restaurant.entity';

@InputType()
export class CreateRestaurantDto extends OmitType(Restaurant, ['id']) {}

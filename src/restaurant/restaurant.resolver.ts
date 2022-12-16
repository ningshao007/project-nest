import { Query, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';

@Resolver()
export class RestaurantResolver {
  @Query(() => Restaurant)
  myRestaurant() {
    return true;
  }
}

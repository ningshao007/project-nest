import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class RestaurantResolver {
  @Query(() => Boolean)
  isGood(): boolean {
    return true;
  }
}

import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/user/entities/user.entity';
import { AllCategoriesOutput } from './dtos/all-categories.dot';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dot';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dot';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';

@Resolver(() => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query(() => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }

  @Query(() => [Restaurant])
  myRestaurant(@Args('veganOnly') veganOnly: boolean): Restaurant[] {
    return [];
  }

  @Mutation(() => CreateRestaurantOutput)
  @Role(['OWNER'])
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ) {
    return this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation(() => Boolean)
  async updateRestaurant(
    @Args('input') updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return this.restaurantService.updateRestaurant(updateRestaurantDto);
  }

  @Mutation(() => EditRestaurantOutput)
  @Role(['OWNER'])
  editRestaurant(
    @AuthUser() authUser: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ) {
    return this.restaurantService.editRestaurant(authUser, editRestaurantInput);
  }

  @Mutation(() => DeleteRestaurantOutput)
  @Role(['OWNER'])
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ) {
    return this.restaurantService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }
}

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ResolveField(() => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.countRestaurants(category);
  }

  @Query(() => AllCategoriesOutput)
  allCategories() {
    return this.restaurantService.allCategories();
  }

  @Query(() => CategoryOutput)
  category(@Args('input') categoryInput: CategoryInput) {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }

  @Query(() => RestaurantsOutput)
  restaurants(@Args('input') restaurantsInput: RestaurantsInput) {
    return this.restaurantService.allRestaurants(restaurantsInput);
  }

  @Query(() => RestaurantOutput)
  restaurant(@Args('input') restaurantInput: RestaurantInput) {
    return this.restaurantService.findRestaurantById(restaurantInput);
  }
}

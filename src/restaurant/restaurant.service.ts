import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import {
  FindManyOptions,
  FindOptionsWhere,
  Like,
  Raw,
  Repository,
} from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dot';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dot';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dot';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { MyRestaurantInput, MyRestaurantOutput } from './dtos/my-restaurant';
import { MyRestaurantsOutput } from './dtos/my-restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dot';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
  ) {}

  async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
    try {
      const restaurants = await this.restaurants.find({
        where: { ownerId: owner.id },
      });

      return {
        restaurants,
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find restaurants.',
      };
    }
  }

  async myRestaurant(
    owner: User,
    { id }: MyRestaurantInput,
  ): Promise<MyRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id },
        relations: ['menu', 'orders'],
      });

      return {
        restaurant,
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'could not find restaurant',
      };
    }
  }

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = await this.restaurants.create(
        createRestaurantInput,
      );
      newRestaurant.owner = owner;
      const categoryName = createRestaurantInput.categoryName
        .trim()
        .toLowerCase();
      const categorySlug = categoryName.replace(/ /g, '-');
      let category = await this.categories.findOne({
        where: { slug: categorySlug },
      });

      if (!category) {
        category = await this.categories.save(
          this.categories.create({
            slug: categorySlug,
            name: categoryName,
          }),
        );
      }
      newRestaurant.category = category;

      await this.restaurants.save(newRestaurant);

      return { error: '', ok: true, restaurantId: newRestaurant.id };
    } catch (error) {
      return { error, ok: false };
    }
  }

  async updateRestaurant({ id, data }: UpdateRestaurantDto): Promise<boolean> {
    try {
      await this.restaurants.update(id, data);

      return true;
    } catch (error) {
      return false;
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: editRestaurantInput.restaurantId },
      });

      console.log('-----restaurant----', restaurant);

      if (!restaurant) {
        return {
          ok: false,
          error: '不存在此餐厅',
        };
      }

      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '你没有编辑修改的权限',
        };
      }

      let category;

      if (editRestaurantInput.categoryName) {
        const categoryName = editRestaurantInput.categoryName
          .trim()
          .toLowerCase();
        const categorySlug = categoryName.replace(/ /g, '-');
        category = await this.categories.findOne({
          where: { slug: categorySlug },
        });

        if (!category) {
          category = await this.categories.save(
            this.categories.create({
              slug: categorySlug,
              name: categoryName,
            }),
          );
        }
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          // NOTE: 注意这里的妙用,过滤掉空值
          ...(category && { category }),
        },
      ]);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '这不是你的restaurant,你有个鸡儿权限',
        };
      }

      await this.restaurants.delete(restaurantId);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();

      return {
        ok: true,
        categories,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async countRestaurants(category: Category) {
    return await this.restaurants.count({
      category,
    } as FindManyOptions<Restaurant>);
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug },
        // NOTE: 注意这里关联的查询用法
        // relations: ['restaurants', 'restaurants.owner'],
        relations: ['restaurants'],
      });

      console.log('----------category---------', category);
      if (!category) {
        return {
          ok: false,
          error: 'category not found',
        };
      }

      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }

      // FIXED: 这里查询不知哪里报错了,回过头再细细看
      const restaurants = await this.restaurants.find({
        where: { category } as FindOptionsWhere<Category>,
        // take: 2,
        // skip: (page - 1) * 2,
      });
      console.log('================', restaurants);
      category.restaurants = restaurants;

      const totalResults = await this.countRestaurants(category);

      return {
        ok: true,
        category,
        restaurants,
        totalPages: Math.ceil(totalResults / 2),
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async allRestaurants({
    page,
    take,
  }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * take,
        take,
      });

      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / take),
        totalResults,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
        relations: ['menu'],
      });

      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }

      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: Raw((name) => `${name} ILIKE '%${query}%'`),
        },
        skip: (page - 1) * 1,
        take: 20,
      });

      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 10),
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: {
          id: createDishInput.restaurantId,
        },
      });

      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }

      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '你没有权限',
        };
      }

      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: dishId },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        };
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: '你没有权限',
        };
      }

      await this.dishes.delete(dishId);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: {
          id: editDishInput.dishId,
        },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: 'dish not found',
        };
      }

      if (dish.restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: '你没有权限',
        };
      }

      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: true,
        error,
      };
    }
  }
}

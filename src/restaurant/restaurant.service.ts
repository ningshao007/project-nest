import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

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

      return { error: '', ok: true };
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
}

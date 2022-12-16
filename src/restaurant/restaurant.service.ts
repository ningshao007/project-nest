import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<{ error: string; ok: boolean }> {
    try {
      await this.restaurants.save(createRestaurantDto);

      return { error: '', ok: true };
    } catch (error) {
      return { error, ok: false };
    }
  }
}

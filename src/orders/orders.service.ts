import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/constants';
import {
  CreateOrderInput,
  CreateOrderOutput,
} from 'src/orders/dtos/create-order.dto';
import { Dish } from 'src/restaurant/entities/dish.entity';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { User, UserRole } from 'src/user/entities/user.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
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

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];

      for (const item of items) {
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });
        if (!dish) {
          return {
            ok: false,
            error: 'dish not found',
          };
        }

        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice = dishFinalPrice + dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );

              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice = dishFinalPrice + dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice = orderFinalPrice + dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }

      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );

      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });

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

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.CLIENT) {
        orders = await this.orders.find({
          where: {
            customer: user.id as FindOptionsWhere<User>,
            ...(status && { status }),
          },
          relations: ['restaurant', 'customer'],
        });
      } else if (user.role === UserRole.DELIVERY) {
        orders = await this.orders.find({
          where: {
            driverId: user.id,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.OWNER) {
        const restaurants = await this.restaurants.find({
          where: {
            ownerId: user.id,
          },
          relations: ['orders'],
        });
        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      }
      return {
        ok: true,
        orders,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: {
          id: orderId,
        },
        relations: ['restaurant'],
      });
      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        };
      }

      let canSee = true;

      if (user.role === UserRole.CLIENT && order.customerId !== user.id) {
        canSee = false;
      }
      if (user.role === UserRole.DELIVERY && order.driverId !== user.id) {
        canSee = false;
      }
      if (
        user.role === UserRole.OWNER &&
        order.restaurant.ownerId !== user.id
      ) {
        canSee = false;
      }

      if (!canSee) {
        return {
          ok: false,
          error: 'You cant see that',
        };
      }

      return {
        ok: true,
        order,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  canSeeOrder(user: User, order: Order): boolean {
    let canSee = true;

    if (user.role === UserRole.CLIENT && order.customerId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.DELIVERY && order.driverId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.OWNER && order.restaurant.ownerId !== user.id) {
      canSee = false;
    }

    return canSee;
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: {
          id: orderId,
        },
        // relations: ['restaurant'],
      });
      if (!order) {
        return {
          ok: false,
          error: 'order not found',
        };
      }
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: '你没有权限',
        };
      }

      let canEdit = true;

      if (user.role === UserRole.CLIENT) {
        canEdit = false;
      }
      if (user.role === UserRole.OWNER) {
        if (status !== OrderStatus.COOKING && status !== OrderStatus.COOKED) {
          canEdit = false;
        }
      }
      if (user.role === UserRole.DELIVERY) {
        if (
          status !== OrderStatus.PICKED_UP &&
          status !== OrderStatus.DELIVERED
        ) {
          canEdit = false;
        }
      }

      if (!canEdit) {
        return {
          ok: false,
          error: '你没有权限!!!',
        };
      }

      await this.orders.save([
        {
          id: orderId,
          status,
        },
      ]);

      if (user.role === UserRole.OWNER && status === OrderStatus.COOKED) {
        await this.pubSub.publish(NEW_COOKED_ORDER, {
          cookedOrders: { ...order, status },
        });
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

  async takeOrder(
    driver: User,
    { id: orderId }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: { id: orderId },
      });
      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        };
      }
      if (order.driver) {
        return {
          ok: false,
          error: 'This order already has a driver',
        };
      }
      await this.orders.save({
        id: orderId,
        driver,
      });
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });
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

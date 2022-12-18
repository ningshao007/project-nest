import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType() // NOTE: 将一个普通的类标记为Graphql对象类型
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(() => Number)
  id: number;

  @CreateDateColumn()
  @Field(() => Date)
  createAt: Date;

  @UpdateDateColumn()
  @Field(() => Date)
  updateAt: Date;

  // NOTE: 在这边做参数校验,然后dto那边只用mapped-types
  @Field(() => String)
  @Column()
  @IsString()
  @Length(1, 10)
  name: string;

  @Field(() => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field(() => String, { defaultValue: '广东省法制市民主区自由街道' })
  @Column()
  @IsString()
  address: string;

  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.restaurants)
  // NOTE: 用于指定外键字段的名称;其实@ManyToOne会自动生成名称
  @JoinColumn({ name: 'category_id' })
  category: Category;
}

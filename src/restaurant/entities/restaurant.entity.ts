import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@InputType({ isAbstract: true })
@ObjectType() // NOTE: 将一个普通的类标记为Graphql对象类型
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(() => Number)
  id: number;

  // NOTE: 在这边做参数校验,然后dto那边只用mapped-types
  @Field(() => String)
  @Column()
  @IsString()
  @Length(1, 10)
  name: string;

  // NOTE: 注意这里的这些默认值用法
  @Field(() => Boolean, { nullable: true, defaultValue: true })
  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;

  @Field(() => String, { defaultValue: '广东省法制市民主区自由街道' })
  @Column()
  @IsString()
  address: string;

  @Field(() => String)
  @Column()
  @IsString()
  ownerName: string;

  @Field(() => String)
  @Column()
  @IsString()
  categoryName: string;
}

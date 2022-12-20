import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class DeleteDishInput {
  @Field(() => Int)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}

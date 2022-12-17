import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { v4 as uuid } from 'uuid';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { IsUUID } from 'class-validator';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsUUID()
  code: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  createCode(): void {
    this.code = uuid();
  }
}

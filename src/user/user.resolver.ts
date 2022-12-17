import { Query, Resolver } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => Boolean)
  hi() {
    return true;
  }
}

import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { Role } from 'src/auth/role.decorator';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => Boolean)
  hi() {
    return true;
  }

  @Mutation(() => CreateAccountOutput)
  createAccount(@Args('input') createAccountInput: CreateAccountInput) {
    return this.userService.createAccount(createAccountInput);
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput) {
    return this.userService.login(loginInput);
  }

  // me(@Context() context) {
  // console.log('------@Context-------', context);
  //   if (!context.user) {
  //     return [];
  //   } else {
  //     return context.user;
  //   }
  // }
  @Query(() => User)
  @Role(['ANY'])
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  @Query(() => UserProfileOutput)
  @UseGuards(AuthGuard)
  async userProfile(@Args() userProfileInput: UserProfileInput) {
    return this.userService.findById(userProfileInput.userId);
  }

  @Mutation(() => EditProfileOutput)
  @UseGuards(AuthGuard)
  async editProfile(
    @AuthUser() authUser,
    @Args('input') editProfile: EditProfileInput,
  ) {
    return this.userService.editProfile(authUser.id, editProfile);
  }

  @Mutation(() => VerifyEmailOutput)
  verifyEmail(@Args('input') { code }: VerifyEmailInput) {
    return this.userService.verifyEmail(code);
  }
}

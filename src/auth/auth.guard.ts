import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { UserService } from 'src/user/user.service';
import { AllowRole } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowRole>('roles', context.getHandler());

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;

    if (token) {
      const decoded = this.jwtService.verify(token.toString());

      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user } = await this.userService.findById(decoded['id']);

        if (user) {
          gqlContext['user'] = user;

          if (!roles) {
            return true;
          }

          if (roles.includes('ANY')) {
            return true;
          }

          return roles.includes(user.role);
        }
      }
    }

    if (!roles) {
      return true;
    }

    return false;
  }
}

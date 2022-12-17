import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Verification])],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}

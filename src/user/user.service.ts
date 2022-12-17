import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ where: { email } });

      if (exists) {
        return { ok: false, error: '当前邮箱已经被使用' };
      }

      // NOTE: 单独用insert() 和 save() 方法不会触发@BeforeInsert()和@BeforeUpdate()方法
      await this.users.save(this.users.create({ email, password, role }));

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error };
    }
  }

  async login(loginInput: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({
        where: { email: loginInput.email },
      });

      if (!user) {
        return {
          ok: false,
          error: '该邮箱不存在',
        };
      }

      const isPasswordCorrect = await user.checkPassword(loginInput.password);

      if (!isPasswordCorrect) {
        return {
          ok: false,
          error: '密码不正确',
        };
      }

      const token = jwt.sign({ id: user.id }, this.config.get('PRIVATE_KEY'));

      return {
        ok: true,
        token: token,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}

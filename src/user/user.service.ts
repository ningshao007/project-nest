import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

      return {
        ok: true,
        token: '',
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}

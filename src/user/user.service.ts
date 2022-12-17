import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import * as jwt from 'jsonwebtoken';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-email.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
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
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );

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

      // const token = jwt.sign({ id: user.id }, this.config.get('PRIVATE_KEY'));
      const token = this.jwtService.sign(user.id);

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

  async findById(id: number): Promise<User> {
    return this.users.findOneBy({ id });
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<User> {
    // NOTE: 这样保存password字段不会触发@BeforeInsert()和@BeforeUpdate()方法,密码还是会明文保存
    // return this.users.update(userId, { ...editProfileInput });
    const user = await this.users.findOne({ where: { id: userId } });

    if (email) {
      user.email = email;
      user.verified = false;
      await this.verifications.delete({ user: { id: user.id } });
      await this.verifications.save(this.verifications.create({ user }));
    }
    if (password) {
      user.password = password;
    }

    return this.users.save(user);
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne({
        where: { code },
        relations: ['user'],
      });

      if (verification) {
        verification.user.verified = true;
        this.users.save(verification.user);

        return {
          ok: true,
        };
      }

      return {
        ok: false,
        error: '当前code不存在',
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}

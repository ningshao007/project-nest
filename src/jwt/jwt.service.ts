import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from 'src/common/constants';
import { JwtModuleOptions } from './jwt.interface';

@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
  ) {}

  sign(userId: number): string {
    return jwt.sign({ id: userId }, this.options.privateKey);
  }
}

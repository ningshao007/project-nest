import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/entities/user.entity';

export type AllowRole = keyof typeof UserRole | 'ANY';

export const Role = (roles: AllowRole[]) => SetMetadata('roles', roles);

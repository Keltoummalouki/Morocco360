import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: Request) {
    return this.usersService.getProfile((req.user as any).id);
  }

  @Patch('me')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile((req.user as any).id, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword((req.user as any).id, dto);
  }
}

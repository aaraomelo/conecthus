import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { UsersService } from './users.service.js';
import { SafeUser } from '../common/sanitize-user.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile (cached in Redis)' })
  @ApiResponse({ status: 200, description: 'Profile returned from cache or database' })
  getProfile(@CurrentUser() user: AuthenticatedUser): Promise<SafeUser> {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated and cache refreshed' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<SafeUser> {
    return this.usersService.updateProfile(user.userId, dto);
  }
}
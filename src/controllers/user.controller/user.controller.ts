import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/Decorations/user.decoration';
import { User } from 'src/entities';
import { TokenSecurityGuard } from 'src/guards/access-token-security.guard';
import { UserService } from 'src/services/user.service/user.service';

@ApiTags('Users')
@Controller('user')
@ApiBearerAuth()
@UseGuards(TokenSecurityGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile data' })
  @Get('/me')
  getUser(@CurrentUser() user: User) {
    return this.userService.findUserById(user.id);
  }
}

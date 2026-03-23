import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/Decorations/user.decoration';
import { GetUSerResponseDto } from 'src/dto/user.dto';
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
  @ApiResponse({ status: 200, description: 'Return user profile data', type: GetUSerResponseDto })
  @Get('/me')
  getMe(@CurrentUser() user: User): GetUSerResponseDto {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}

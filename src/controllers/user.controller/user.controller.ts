import { BadRequestException, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/Decorations/user.decoration';
import { OnlyOkResponseDto } from 'src/dto/common.dto';
import { GetUserResponseDto } from 'src/dto/user.dto';
import { User } from 'src/entities';
import { TokenSecurityGuard } from 'src/guards/access-token-security.guard';
import { UserService } from 'src/services/user.service/user.service';
import { USER_STATUS } from 'src/types/global';

@ApiTags('Users')
@Controller('user')
@ApiBearerAuth()
@UseGuards(TokenSecurityGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile data', type: GetUserResponseDto })
  @Get('/me')
  getMe(@CurrentUser() user: User): GetUserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  @ApiOperation({ summary: 'Send verified email if email is inactive' })
  @ApiResponse({ status: 200, description: '', type: OnlyOkResponseDto })
  @Post('/send-verify-email')
  sendVerifyEmail(@CurrentUser() user: User) {
    if (user.status == USER_STATUS.EMAIL_INACTIVE) {
      return this.userService.sendVerifyEmail(user);
    } else if (user.status == USER_STATUS.INACTIVE)
      throw new BadRequestException('Account is inactive');
    else throw new BadRequestException('Account has been already active');
  }
}

import { Injectable } from '@nestjs/common';
import { OnlyOkResponseDto } from 'src/dto/common.dto';
import { FindUserQueryDto } from 'src/dto/user.dto';
import { User } from 'src/entities';
import { UserRepository } from 'src/repository/user.repository';
import { SEND_EMAIL_TYPE, TOKEN_TYPE, USER_ROLE, USER_STATUS } from 'src/types/global';
import { getPaginationData } from 'src/utils/common.utils';
import { generateToken } from 'src/utils/jwt';
import { FindOptionsWhere, ILike, In } from 'typeorm';
import { MailService } from '../mail.service/mail.service';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async sendVerifyEmail(user: User): Promise<OnlyOkResponseDto> {
    const verificationToken = generateToken(TOKEN_TYPE.EMAIL_VERIFY_TOKEN, {
      verifyEmailUserId: user.id,
    });
    await this.mailService.sendEmail(SEND_EMAIL_TYPE.VERIFY, {
      name: user.name || user.email,
      to: user.email,
      token: verificationToken,
    });
    return { isOk: true };
  }

  async findUsers(query: FindUserQueryDto) {
    const { page = 1, limit = 10, searchText } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User>[] | FindOptionsWhere<User> = {
      role: USER_ROLE.USER,
      status: In([USER_STATUS.ACTIVE, USER_STATUS.EMAIL_INACTIVE]),
    };
    if (searchText) where.name = ILike(`%${searchText}%`);

    const [users, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC', id: 'DESC' },
      where,
    });
    return { data: users, metadata: getPaginationData(limit, users.length, total, page) };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AppConfigs } from 'src/configs/app.config';

@Injectable()
export class GoogleOAuthService {
  private readonly clientId = AppConfigs.GOOGLE_CLIENT_ID;
  private readonly client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(this.clientId);
  }

  async verifyToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });

      const data = ticket.getPayload();
      if (!data) throw new UnauthorizedException('Invalid token');

      const res = { id: data?.sub, email: data?.email, name: data?.name, avatarUrl: data?.picture };

      return res;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Google login failure!');
    }
  }
}

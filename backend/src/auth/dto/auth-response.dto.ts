import { ApiProperty } from '@nestjs/swagger';

export class PublicUser {
  @ApiProperty() id: number;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() createdAt: Date;
}

export class AuthResponse {
  @ApiProperty() accessToken: string;
  @ApiProperty() user: PublicUser;
}
import { IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  description: string;
}
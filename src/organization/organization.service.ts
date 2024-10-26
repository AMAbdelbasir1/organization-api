import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization } from './schema/organization.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserDocument } from 'src/auth/schemas/user.schema';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    @InjectModel('User')
    private userModel: Model<UserDocument>,
  ) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
    user: any,
  ): Promise<Organization> {
    const newOrg = new this.organizationModel({
      ...createOrganizationDto,
      organization_members: [
        {
          name: user.name,
          email: user.email,
          access_level: 'admin',
        },
      ],
    });
    return newOrg.save();
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationModel.findById(id).exec();

    if (!organization) throw new NotFoundException('Organization not found');
    return organization;
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationModel.find().exec();
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    user: any,
  ): Promise<Organization> {
    const updatedOrg = await this.organizationModel.findById(id).exec();
    if (!updatedOrg) throw new NotFoundException('Organization not found');

    const existingUser = updatedOrg.organization_members.find(
      (member) => member.email === user.email,
    );

    if (!existingUser && existingUser?.access_level !== 'admin') {
      throw new UnauthorizedException('Access denied');
    }

    updatedOrg.name = updateOrganizationDto.name;
    updatedOrg.description = updateOrganizationDto.description;
    await updatedOrg.save();
    return updatedOrg;
  }

  async delete(id: string, user: any): Promise<{ message: string }> {
    const result = await this.organizationModel.findById(id).exec();
    if (!result) throw new NotFoundException('Organization not found');

    const existingUser = result.organization_members.find(
      (member) => member.email === user.email,
    );
    if (!existingUser && existingUser?.access_level !== 'admin') {
      throw new UnauthorizedException('Access denied');
    }

    await this.organizationModel.deleteOne({ _id: id }).exec();
    return { message: 'Organization deleted successfully' };
  }

  async inviteUser(
    id: string,
    inviteUserDto: InviteUserDto,
  ): Promise<{ message: string }> {
    const organization = await this.organizationModel.findById(id).exec();

    if (!organization) throw new NotFoundException('Organization not found');
    const User = await this.userModel.findOne({
      email: inviteUserDto.user_email,
    });
    if (!User) throw new NotFoundException('User not found');
    const existingUser = organization.organization_members.find(
      (member) => member.email === inviteUserDto.user_email,
    );
    if (existingUser) {
      throw new ConflictException('User already invited');
    }
    organization.organization_members.push({
      name: User.name,
      email: inviteUserDto.user_email,
      access_level: 'read-only',
    });

    await organization.save();
    return { message: 'User invited successfully' };
  }
}

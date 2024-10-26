// src/organization/organization.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { AuthGuard } from '../auth/guard/auth.guard';

@Controller('organization')
@UseGuards(AuthGuard) // Ensure all routes are protected
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Req() req,
  ) {
    const organization = await this.organizationService.create(
      createOrganizationDto,
      req.user,
    );
    return { organization_id: organization._id };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const organization = await this.organizationService.findOne(id);
    return {
      organization_id: organization._id,
      name: organization.name,
      description: organization.description,
      organization_members: organization.organization_members,
    };
  }

  @Get()
  async findAll() {
    const organizations = await this.organizationService.findAll();
    return organizations.map((organization) => ({
      organization_id: organization._id,
      name: organization.name,
      description: organization.description,
      organization_members: organization.organization_members,
    }));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Req() req,
  ) {
    const organization = await this.organizationService.update(
      id,
      updateOrganizationDto,
      req.user,
    );
    return {
      organization_id: organization._id,
      name: organization.name,
      description: organization.description,
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    return this.organizationService.delete(id, req.user);
  }

  @Post(':id/invite')
  async inviteUser(
    @Param('id') id: string,
    @Body() inviteUserDto: InviteUserDto,
  ) {
    return this.organizationService.inviteUser(id, inviteUserDto);
  }
}

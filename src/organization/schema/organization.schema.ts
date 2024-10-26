// src/organization/schemas/organization.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Organization extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop([
    {
      name: String,
      email: String,
      access_level: String, // e.g., 'read-only', 'admin'
    },
  ])
  organization_members: { name: string; email: string; access_level: string }[];
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

import mongoose, { Schema, SchemaTypes, Types,Document } from "mongoose";

const EmailInboundSchema = new Schema({
  vendorEmail: SchemaTypes.String,
  subject: SchemaTypes.String,
  body: SchemaTypes.String,
  attachments: [SchemaTypes.String], // file paths

  rfpId: { type: SchemaTypes.ObjectId, ref: "RFP" },
  vendorId: { type: SchemaTypes.ObjectId, ref: "Vendor" },

  parsed: SchemaTypes.Mixed,  // AI extraction full JSON
  processed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});


export {  EmailInboundSchema };

export interface IEmailInbound extends Document {
  vendorEmail: string;
  subject: string;
  body: string;
  attachments: string[];

  rfpId: Types.ObjectId;
  vendorId: Types.ObjectId;

  parsed: Record<string, any>; // AI parsed data

  processed: boolean;

  createdAt: Date;
}
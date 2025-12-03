import mongoose, { Document, Schema, SchemaTypes, Types } from "mongoose";

const EmailOutboundSchema = new Schema({
  rfpId: { type: SchemaTypes.ObjectId, ref: "RFP" },
  vendorId: { type: SchemaTypes.ObjectId, ref: "Vendor" },

  to: String,
  subject: String,
  body: String,
  status: { type: String, enum: ["sent", "failed"], default: "sent" },

  createdAt: { type: Date, default: Date.now }
});



export {  EmailOutboundSchema };


export interface IEmailOutbound extends Document {
  rfpId: Types.ObjectId;
  vendorId: Types.ObjectId;
  to: string;
  subject: string;
  body: string;
  status: "sent" | "failed";
  createdAt: Date;
}
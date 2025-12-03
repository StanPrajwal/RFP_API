import mongoose, { Schema, SchemaTypes ,Document} from "mongoose";

const VendorSchema = new Schema({
  name: { type: SchemaTypes.String, required: true },
  email: { type: SchemaTypes.String, required: true },
  phone: SchemaTypes.String,
  address: SchemaTypes.String,

  // Metadata
  createdAt: { type: Date, default: Date.now }
});



export { VendorSchema };

export interface IVendor extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

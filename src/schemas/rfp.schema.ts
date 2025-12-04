import { Document, Schema, SchemaTypes, Types } from 'mongoose';
import { MONGO_MODEL_NAMES } from '.';

const ItemSchema = new Schema({
  item: { type: SchemaTypes.String, required: true },
  quantity: { type: SchemaTypes.Number, required: true },
  specs: { type: SchemaTypes.Mixed },
});

const RFPSchema = new Schema({
  title: { type: SchemaTypes.String, required: true },

  // Natural language input from the user
  descriptionRaw: { type: SchemaTypes.String, required: true },

  // AI-parsed and structured representation
  descriptionStructured: {
    budget: SchemaTypes.Number,
    currency: SchemaTypes.String,
    currencySymbol: SchemaTypes.String,
    deliveryTimeline: SchemaTypes.String,
    paymentTerms: SchemaTypes.String,
    warranty: SchemaTypes.String,
    items: [ItemSchema],
  },
  vendorsInvited: [
    { type: SchemaTypes.ObjectId, ref: MONGO_MODEL_NAMES.VENDOR },
  ],
  status: {
    type: SchemaTypes.String,
    enum: ['draft', 'sent', 'responding', 'completed'],
    default: 'draft',
  },

  createdAt: { type: Date, default: Date.now },
});

export { RFPSchema };

export interface RFPModel extends Document {
  title: string;
  descriptionRaw: string;

  descriptionStructured: {
    budget?: number;
    currency?: string;
    currencySymbol?: string;
    deliveryTimeline?: string;
    paymentTerms?: string;
    warranty?: string;
    items?: {
      item: string;
      quantity: number;
      specs?: Record<string, any>;
    }[];
  };

  vendorsInvited: Types.ObjectId[];

  status: 'draft' | 'sent' | 'responding' | 'completed';

  createdAt: Date;
}

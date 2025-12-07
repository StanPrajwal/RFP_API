import { Document, Schema, SchemaTypes, Types } from 'mongoose';

const ItemSchema = new Schema({
  item: { type: SchemaTypes.String, required: true },
  quantity: { type: SchemaTypes.Number },
  unitPrice: { type: SchemaTypes.Number },
  totalPrice: { type: SchemaTypes.Number },
});

const VendorProposalSchema = new Schema({
  rfpId: { type: SchemaTypes.ObjectId, ref: 'RFP', required: true },
  vendorId: { type: SchemaTypes.ObjectId, ref: 'Vendor', required: true },

  // Email message ID to prevent duplicate processing
  emailMessageId: { type: SchemaTypes.String, unique: true, sparse: true },

  // Raw email text from vendor
  rawResponse: { type: SchemaTypes.Mixed, required: true },

  // AI extracted fields
  parsed: {
    totalPrice: SchemaTypes.Number,
    currency: SchemaTypes.String,
    paymentTerms: SchemaTypes.String,
    deliveryTimeline: SchemaTypes.String,
    warranty: SchemaTypes.String,
    items: [ItemSchema],
    additionalNotes: SchemaTypes.String,
  },

  // AI scoring for comparison
  scoring: {
    priceScore: SchemaTypes.Number,
    termsScore: SchemaTypes.Number,
    deliveryScore: SchemaTypes.Number,
    overallScore: SchemaTypes.Number,
    aiRecommendation: SchemaTypes.String,
    warrantyScore: SchemaTypes.Number,
    paymentScore: SchemaTypes.Number,
    completenessScore: SchemaTypes.Number,
    total: SchemaTypes.Number,
  },

  createdAt: { type: SchemaTypes.Date, default: Date.now },
});

// Add unique compound index to prevent duplicate proposals
VendorProposalSchema.index({ rfpId: 1, vendorId: 1 }, { unique: true });

export { VendorProposalSchema };

interface ProposalItem {
  item: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface ProposalParsed {
  totalPrice?: number;
  currency?: string;
  paymentTerms?: string;
  deliveryTimeline?: string;
  warranty?: string;
  items?: ProposalItem[];
  additionalNotes?: string;
}

interface ProposalScoring {
  priceScore?: number;
  termsScore?: number;
  deliveryScore?: number;
  overallScore?: number;
  aiRecommendation?: string;
}

interface ProposalModel extends Document {
  rfpId: Types.ObjectId;
  vendorId: Types.ObjectId;
  emailMessageId?: string;

  rawResponse: string;

  parsed: ProposalParsed;

  scoring?: ProposalScoring;

  createdAt: Date;
}

export type { ProposalItem, ProposalModel, ProposalParsed, ProposalScoring };

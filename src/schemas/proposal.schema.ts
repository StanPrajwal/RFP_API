import mongoose, { Schema, SchemaTypes, Types,Document } from "mongoose";


const ItemSchema = new Schema({
  item: { type: SchemaTypes.String, required: true },
  quantity: { type: SchemaTypes.Number, required: true },
  unitPrice: { type: SchemaTypes.Number },
  totalPrice: { type: SchemaTypes.Number }
});

const VendorProposalSchema = new Schema({
  rfpId: { type: SchemaTypes.ObjectId, ref: "RFP", required: true },
  vendorId: { type: SchemaTypes.ObjectId, ref: "Vendor", required: true },

  // Raw email text from vendor
  rawResponse: { type: SchemaTypes.String, required: true },

  // AI extracted fields
  parsed: {
    totalPrice: SchemaTypes.Number,
    currency: SchemaTypes.String,
    paymentTerms: SchemaTypes.String,
    deliveryTimeline: SchemaTypes.String,
    warranty: SchemaTypes.String,
    items: [
      ItemSchema
    ],
    additionalNotes: SchemaTypes.String
  },

  // AI scoring for comparison
  scoring: {
    priceScore: SchemaTypes.Number,
    termsScore: SchemaTypes.Number,
    deliveryScore: SchemaTypes.Number,
    overallScore: SchemaTypes.Number,
    aiRecommendation: String
  },

  createdAt: { type: SchemaTypes.Date, default: Date.now }
});


const VendorProposalModel = mongoose.model("VendorProposal", VendorProposalSchema);

export { VendorProposalModel, VendorProposalSchema };



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

interface IProposal extends Document {
  rfpId: Types.ObjectId;
  vendorId: Types.ObjectId;

  rawResponse: string;

  parsed: ProposalParsed;

  scoring?: ProposalScoring;

  createdAt: Date;
}

export type { IProposal, ProposalItem, ProposalParsed, ProposalScoring };
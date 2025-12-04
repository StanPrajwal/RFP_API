class GenerateRfpDto {
  description: string;
}
class CreateRfpDto {
  title: string;
  items: any[];
  budget: number;
  deliveryTimeline: string;
  paymentTerms: string;
  warranty?: string;
}
class AssignVendorsDto {
  vendorIds: string[];
}

export { GenerateRfpDto, CreateRfpDto, AssignVendorsDto };

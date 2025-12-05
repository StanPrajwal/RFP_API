class GenerateRfpDto {
  description: string;
}
class CreateRfpDto {
  title: string;
  descriptionRaw: string;
  descriptionStructured: {
    items: any[];
    currency: string;
    currencySymbol: string;
    budget: number;
    deliveryTimeline: string;
    paymentTerms: string;
    warranty?: string;
  };
}
class AssignVendorsDto {
  vendorIds: string[];
}

export { GenerateRfpDto, CreateRfpDto, AssignVendorsDto };

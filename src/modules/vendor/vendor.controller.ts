import { Body, Controller, Get, Post } from '@nestjs/common';
import { RegisterVendorDto } from './vendor.dto';
import { VendorService } from './vendor.service';

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('register-vendor')
  async registerVendor(@Body() vendor: RegisterVendorDto) {
    return await this.vendorService.registerVendor(vendor);
  }

  @Get('fetch-vendors')
  async fetchVendors() {
    return await this.vendorService.getAllVendors();
  }
}

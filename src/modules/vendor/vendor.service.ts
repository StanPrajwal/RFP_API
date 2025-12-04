import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MONGO_MODEL_NAMES } from 'src/schemas';
import { VendorModel } from 'src/schemas/vendor.schema';
import { RegisterVendorDto } from './vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(MONGO_MODEL_NAMES.VENDOR)
    private readonly vendorModel: Model<VendorModel>,
  ) {}

  // CREATE VENDOR
  async registerVendor(data: RegisterVendorDto) {
    try {
      const vendor = await this.vendorModel.create(data);

      return {
        code: 200,
        message: 'Vendor created successfully',
        data: vendor,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to create vendor',
      );
    }
  }

  // GET ALL VENDORS
  async getAllVendors() {
    try {
      const vendors = await this.vendorModel.find().sort({ createdAt: -1 });

      return {
        code: 200,
        message: 'Vendor list fetched successfully',
        data: vendors,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch vendors',
      );
    }
  }

  // GET SINGLE VENDOR
  async getVendorById(id: string) {
    try {
      const vendor = await this.vendorModel.findById(id);

      if (!vendor) {
        throw new BadRequestException('Vendor not found');
      }

      return {
        code: 200,
        message: 'Vendor fetched successfully',
        data: vendor,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch vendor',
      );
    }
  }

  // GET MULTIPLE VENDORS BY IDs
  async getVendorsByIds(ids: string[]) {
    try {
      if (!ids?.length) {
        return [];
      }

      const vendors = await this.vendorModel.find({
        _id: { $in: ids },
      });

      if (!vendors.length) {
        throw new BadRequestException('No vendors found for provided IDs');
      }

      return {
        code: 200,
        message: 'Vendors fetched successfully',
        data: vendors,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch vendors',
      );
    }
  }
}

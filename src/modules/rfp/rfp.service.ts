import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { MONGO_MODEL_NAMES } from 'src/schemas';
import { RFPModel } from 'src/schemas/rfp.schema';
import { OpenAiService } from '../openai/openai.service';
import { VendorService } from '../vendor/vendor.service';
import { CreateRfpDto } from './rfp.dto';

@Injectable()
export class RFPService {
  constructor(
    private readonly openaiService: OpenAiService,
    private readonly vendorService: VendorService,
    @InjectModel(MONGO_MODEL_NAMES.RFP) readonly _rfpModel: Model<RFPModel>,
  ) {}

  //#region Generate RFP
  async generateRFP(description: string) {
    try {
      if (!description.trim()) {
        throw new BadRequestException('Description is required');
      }
      // Calling AI model for RFP generation
      const structuredRfp = await this.openaiService.generateRFP(description);
      return {
        code: 200,
        message: 'RFP generated successfully',
        structuredRfp,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to generate RFP',
      );
    }
  }
  //#endregion

  //#region Save RFP
  async createRFP(generatedRfp: CreateRfpDto) {
    try {
      await this._rfpModel.create(generatedRfp);
      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'RFP created successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to generate RFP',
      );
    }
  }
  //#endregion

  //#region Get RFP By Id
  async getRfpById(id: string) {
    try {
      const rfp = await this._rfpModel.findById(id);

      if (!rfp) {
        throw new BadRequestException('RFP not found');
      }

      return {
        code: HttpStatus.OK,
        message: 'RFP fetched successfully',
        data: rfp,
      };
    } catch (error) {
      // If it's already an HTTP error, rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error.message || 'Failed to fetch RFP',
      );
    }
  }
  //#endregion

  //#region Get All RFP
  async getAllRFPs() {
    try {
      const rfpList = await this._rfpModel.find().sort({ createdAt: -1 });

      return {
        code: HttpStatus.OK,
        message: 'RFP list fetched successfully',
        data: rfpList,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch RFP list',
      );
    }
  }
  //#endregion

  //#region Assign Vendors
  async assignVendorsToRfp(rfpId: string, vendorIds: string[]) {
    try {
      const rfp = await this._rfpModel.findById(rfpId);

      if (!rfp) {
        throw new BadRequestException('RFP not found');
      }

      // Assign vendors

      rfp.vendorsInvited = vendorIds.map(
        (id) => new (Types.ObjectId as any)(id),
      );
      await rfp.save();

      return {
        code: HttpStatus.OK,
        message: 'Vendors assigned to RFP successfully',
        data: rfp,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message || 'Failed to assign vendors to RFP',
      );
    }
  }
  //#endregion

  async sendRfpEmails(rfpId: string, vendorIds: string[]) {
    try {
      const rfp = await this._rfpModel.findById(rfpId);

      if (!rfp) {
        throw new BadRequestException('RFP not found');
      }

      if (!rfp.vendorsInvited || rfp.vendorsInvited.length === 0) {
        throw new BadRequestException('No vendors assigned to this RFP');
      }

      const vendors: any = await this.vendorService.getVendorsByIds(vendorIds);
      if (vendors?.code !== HttpStatus.OK) {
        return vendors;
      }

      for (const vendor of vendors?.data) {
        // Email Service Call
      }

      // Update status
      rfp.status = 'sent';
      await rfp.save();

      return {
        code: HttpStatus.OK,
        message: 'RFP proposals sent to all selected vendors',
        data: { sentTo: vendors.map((v) => v.email) },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        error.message || 'Failed to send proposals',
      );
    }
  }
  getProposalsByRfp(id: string) {}
  compareProposals(id: string) {}
}

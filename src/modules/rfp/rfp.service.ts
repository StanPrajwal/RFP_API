import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { MONGO_MODEL_NAMES } from 'src/schemas';
import { RFPModel } from 'src/schemas/rfp.schema';
import { OpenAiService } from '../openai/openai.service';
import { VendorService } from '../vendor/vendor.service';
import { CreateRfpDto } from './rfp.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class RFPService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly openaiService: OpenAiService,
    private readonly vendorService: VendorService,
    private readonly mailService: MailService,
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
      const rfpList = await this._rfpModel.find();

      return {
        code: HttpStatus.OK,
        message: 'RFP list fetched successfully',
        data: rfpList,
      };
    } catch (error) {
      console.log(error);
      this.logger.error(`Email sending failed: ${error}`);
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

      if (!vendorIds || vendorIds.length === 0) {
        throw new BadRequestException('No vendors selected');
      }

      const vendors: any = await this.vendorService.getVendorsByIds(vendorIds);
      if (vendors?.code !== HttpStatus.OK) {
        return vendors;
      }

      // Loop through each vendor and send email
      for (const vendor of vendors?.data || []) {
        await this.mailService.sendRfpEmail(vendor?.email, {
          vendorName: vendor?.name,
          title: rfp.title,
          rfpId: rfpId,
          budget: rfp.descriptionStructured?.budget,
          currencySymbol: rfp.descriptionStructured?.currencySymbol,
          deliveryTimeline: rfp.descriptionStructured?.deliveryTimeline,
          paymentTerms: rfp.descriptionStructured?.paymentTerms,
          warranty: rfp.descriptionStructured?.warranty,
          items:
            rfp.descriptionStructured?.items?.map((i) => ({
              item: i.item,
              quantity: i.quantity,
              specs: i.specs,
            })) || [],
        });
      }

      // Update RFP status
      rfp.status = 'sent';
      await rfp.save();

      return {
        code: HttpStatus.OK,
        message: 'RFP proposals sent to all selected vendors',
        data: {
          // sentTo: vendors.data.map((v) => v.email),
          sendTo: vendorIds,
        },
      };
    } catch (error) {
      console.error(error);

      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        error.message || 'Failed to send proposals',
      );
    }
  }

  getProposalsByRfp(id: string) {}
  compareProposals(id: string) {}
}

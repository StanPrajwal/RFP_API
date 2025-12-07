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
import { ProposalModel } from 'src/schemas/proposal.schema';
import { IEmailOutbound } from 'src/schemas/email-outbound.schema';

@Injectable()
export class RFPService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly openaiService: OpenAiService,
    private readonly vendorService: VendorService,
    private readonly mailService: MailService,
    @InjectModel(MONGO_MODEL_NAMES.RFP) readonly _rfpModel: Model<RFPModel>,
    @InjectModel(MONGO_MODEL_NAMES.PROPOSAL)
    private readonly _proposalModel: Model<ProposalModel>,
    @InjectModel(MONGO_MODEL_NAMES.EmailOutbound)
    private readonly _emailOutboundModel: Model<IEmailOutbound>,
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

      // Check which vendors have already received emails for this RFP
      const existingEmails = await this._emailOutboundModel.find({
        rfpId: rfpId,
        vendorId: { $in: vendorIds.map((id) => new Types.ObjectId(id)) },
        status: 'sent',
      });

      const alreadySentVendorIds = new Set(
        existingEmails.map((email) => email.vendorId.toString()),
      );

      // Filter out vendors who have already received emails
      const vendorsToSend = (vendors?.data || []).filter(
        (vendor: any) => !alreadySentVendorIds.has(vendor._id.toString()),
      );

      const skippedVendors = (vendors?.data || []).filter((vendor: any) =>
        alreadySentVendorIds.has(vendor._id.toString()),
      );

      if (vendorsToSend.length === 0) {
        return {
          code: HttpStatus.OK,
          message: 'All selected vendors have already received this RFP',
          data: {
            sentTo: [],
            skipped: skippedVendors.map((v: any) => ({
              vendorId: v._id.toString(),
              vendorName: v.name,
              email: v.email,
            })),
          },
        };
      }

      const sentEmails: Array<{
        vendorId: string;
        vendorName: string;
        email: string;
      }> = [];
      const failedEmails: Array<{
        vendorId: string;
        vendorName: string;
        email: string;
        error: string;
      }> = [];

      // Loop through each vendor and send email
      for (const vendor of vendorsToSend) {
        try {
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

          // Track sent email in database
          await this._emailOutboundModel.create({
            rfpId: rfpId,
            vendorId: vendor._id,
            to: vendor.email,
            subject: `RFP Invitation - ${rfp.title} | RFP-ID: ${rfpId}`,
            body: 'RFP invitation email',
            status: 'sent',
          });

          sentEmails.push({
            vendorId: vendor._id.toString(),
            vendorName: vendor.name,
            email: vendor.email,
          });
        } catch (error) {
          this.logger.error(
            `Failed to send email to ${vendor.email}: ${error.message}`,
          );

          // Track failed email
          try {
            await this._emailOutboundModel.create({
              rfpId: rfpId,
              vendorId: vendor._id,
              to: vendor.email,
              subject: `RFP Invitation - ${rfp.title} | RFP-ID: ${rfpId}`,
              body: 'RFP invitation email',
              status: 'failed',
            });
          } catch (dbError) {
            this.logger.error(`Failed to track failed email: ${dbError.message}`);
          }

          failedEmails.push({
            vendorId: vendor._id.toString(),
            vendorName: vendor.name,
            email: vendor.email,
            error: error.message,
          });
        }
      }

      // Update RFP status if at least one email was sent
      if (sentEmails.length > 0) {
        rfp.status = 'sent';
        await rfp.save();
      }

      return {
        code: HttpStatus.OK,
        message: `RFP sent to ${sentEmails.length} vendor(s). ${skippedVendors.length} already received, ${failedEmails.length} failed.`,
        data: {
          sentTo: sentEmails,
          skipped: skippedVendors.map((v: any) => ({
            vendorId: v._id.toString(),
            vendorName: v.name,
            email: v.email,
            reason: 'Already received this RFP',
          })),
          failed: failedEmails,
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

  // Store Vender Proposal
  async saveVendorProposal({
    sender,
    subject,
    body,
    attachments,
    rfpId,
    vendorId,
    rawResponse,
  }: {
    sender: string;
    subject: string;
    body: string;
    attachments?: any;
    rfpId: string;
    vendorId: string | Types.ObjectId;
    rawResponse: any;
  }) {
    try {
      // Extract email message ID from rawResponse
      const emailMessageId =
        rawResponse?.parsed?.messageId ||
        rawResponse?.headers?.['message-id'] ||
        rawResponse?.messageId ||
        null;

      // Check if vendor already submitted proposal for same RFP
      const existing = await this._proposalModel.findOne({
        rfpId,
        vendorId: vendorId,
      });

      // Parse proposal with AI
      const aiStructured = await this.openaiService.parseVendorProposal({
        sender,
        subject,
        body,
      });

      const rfp = await this.getRfpById(rfpId);

      const aiScore = await this.openaiService.generateProposalScore({
        rfp,
        proposal: aiStructured,
      });

      // Prepare proposal data
      const proposalData = {
        rfpId,
        vendorId,
        emailMessageId: emailMessageId,
        rawResponse,
        parsed: aiStructured,
        scoring: aiScore,
      };

      let result;

      if (existing) {
        // Update existing proposal
        result = await this._proposalModel.findOneAndUpdate(
          { rfpId, vendorId: vendorId },
          proposalData,
          { new: true, runValidators: true },
        );

        this.logger.log(
          `✅ Proposal updated for vendor ${sender} under RFP ${rfpId}`,
        );
      } else {
        // Create new proposal
        result = await this._proposalModel.create(proposalData);

        this.logger.log(
          `✅ New proposal saved for vendor ${sender} under RFP ${rfpId}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error saving vendor proposal (RFP: ${rfpId}, Vendor: ${sender})`,
        error.stack || error.message,
      );
      throw error;
    }
  }

  //#region Get Proposals By RFP
  async getProposalsByRfp(id: string) {
    try {
      // Validate RFP exists
      const rfp = await this._rfpModel.findById(id);
      if (!rfp) {
        throw new BadRequestException('RFP not found');
      }

      // Get all proposals for this RFP with vendor information populated
      const proposals = await this._proposalModel
        .find({ rfpId: id })
        .populate('vendorId', 'name email phone address')
        .sort({ createdAt: -1 }) // Most recent first
        .exec();

      return {
        code: HttpStatus.OK,
        message: 'Proposals fetched successfully',
        data: {
          rfpId: id,
          rfpTitle: rfp.title,
          totalProposals: proposals.length,
          proposals: proposals.map((proposal) => ({
            id: proposal._id,
            vendorId: proposal.vendorId,
            parsed: proposal.parsed,
            scoring: proposal.scoring,
            createdAt: proposal.createdAt,
          })),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error fetching proposals for RFP ${id}:`,
        error.stack || error.message,
      );
      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch proposals',
      );
    }
  }
  //#endregion

  //#region Compare Proposals
  async compareProposals(id: string) {
    try {
      // Validate RFP exists
      const rfp = await this._rfpModel.findById(id);
      if (!rfp) {
        throw new BadRequestException('RFP not found');
      }

      // Get all proposals for this RFP with vendor information
      const proposals = await this._proposalModel
        .find({ rfpId: id })
        .populate('vendorId', 'name email phone address')
        .sort({ createdAt: -1 })
        .exec();

      if (!proposals || proposals.length === 0) {
        return {
          code: HttpStatus.OK,
          message: 'No proposals found for this RFP',
          data: {
            rfpId: id,
            rfpTitle: rfp.title,
            totalProposals: 0,
            comparison: null,
          },
        };
      }

      // Prepare RFP data for comparison
      const rfpData = {
        id: rfp._id.toString(),
        title: rfp.title,
        descriptionRaw: rfp.descriptionRaw,
        descriptionStructured: rfp.descriptionStructured,
        status: rfp.status,
      };

      // Prepare proposals data for comparison
      const proposalsData = proposals.map((proposal: any) => ({
        proposalId: proposal._id.toString(),
        vendorId: proposal.vendorId?._id?.toString() || proposal.vendorId?.toString(),
        vendorName: proposal.vendorId?.name || 'Unknown Vendor',
        vendorEmail: proposal.vendorId?.email || '',
        parsed: proposal.parsed,
        scoring: proposal.scoring,
        createdAt: proposal.createdAt,
      }));

      let comparison;

      // Handle single proposal case
      if (proposals.length === 1) {
        // For single proposal, evaluate it against RFP requirements
        const singleProposal = proposalsData[0];
        comparison = {
          summary: {
            totalProposals: 1,
            note: 'Only one proposal received. Evaluation against RFP requirements:',
            bestPrice: {
              vendorId: singleProposal.vendorId,
              vendorName: singleProposal.vendorName,
              price: singleProposal.parsed?.totalPrice || 0,
              currency: singleProposal.parsed?.currency || 'N/A',
            },
            bestDelivery: {
              vendorId: singleProposal.vendorId,
              vendorName: singleProposal.vendorName,
              timeline: singleProposal.parsed?.deliveryTimeline || 'N/A',
            },
            bestOverall: {
              vendorId: singleProposal.vendorId,
              vendorName: singleProposal.vendorName,
              score: singleProposal.scoring?.overallScore || singleProposal.scoring?.total || 0,
              reason: 'Only proposal received',
            },
          },
          comparisonTable: [
            {
              vendorId: singleProposal.vendorId,
              vendorName: singleProposal.vendorName,
              totalPrice: singleProposal.parsed?.totalPrice || 0,
              currency: singleProposal.parsed?.currency || 'N/A',
              deliveryTimeline: singleProposal.parsed?.deliveryTimeline || 'N/A',
              paymentTerms: singleProposal.parsed?.paymentTerms || 'N/A',
              warranty: singleProposal.parsed?.warranty || 'N/A',
              overallScore: singleProposal.scoring?.overallScore || singleProposal.scoring?.total || 0,
              priceScore: singleProposal.scoring?.priceScore || 0,
              deliveryScore: singleProposal.scoring?.deliveryScore || 0,
              warrantyScore: singleProposal.scoring?.warrantyScore || 0,
              completenessScore: singleProposal.scoring?.completenessScore || 0,
              aiRecommendation: singleProposal.scoring?.aiRecommendation || 'Pending evaluation',
              strengths: [],
              weaknesses: [],
            },
          ],
          recommendation: {
            recommendedVendorId: singleProposal.vendorId,
            recommendedVendorName: singleProposal.vendorName,
            reasoning:
              'This is the only proposal received. Consider waiting for more proposals before making a final decision, or proceed if this proposal meets all requirements.',
            keyFactors: ['Single proposal received'],
          },
        };

        // Optionally, still call OpenAI for detailed evaluation against RFP
        try {
          const aiEvaluation = await this.openaiService.compareProposals({
            rfp: rfpData,
            proposals: proposalsData,
          });
          // Merge AI insights if available
          if (aiEvaluation?.recommendation) {
            comparison.recommendation = aiEvaluation.recommendation;
          }
          if (aiEvaluation?.comparisonTable?.[0]) {
            const aiData = aiEvaluation.comparisonTable[0];
            comparison.comparisonTable[0].strengths = aiData.strengths || [];
            comparison.comparisonTable[0].weaknesses = aiData.weaknesses || [];
            comparison.comparisonTable[0].aiRecommendation =
              aiData.aiRecommendation || comparison.comparisonTable[0].aiRecommendation;
          }
        } catch (error) {
          this.logger.warn(
            `AI evaluation failed for single proposal, using basic comparison: ${error.message}`,
          );
          // Continue with basic comparison structure
        }
      } else {
        // Multiple proposals - use full comparison
        comparison = await this.openaiService.compareProposals({
          rfp: rfpData,
          proposals: proposalsData,
        });
      }

      return {
        code: HttpStatus.OK,
        message: 'Proposals compared successfully',
        data: {
          rfpId: id,
          rfpTitle: rfp.title,
          totalProposals: proposals.length,
          comparison,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error comparing proposals for RFP ${id}:`,
        error.stack || error.message,
      );
      throw new InternalServerErrorException(
        error?.message || 'Failed to compare proposals',
      );
    }
  }
  //#endregion
}

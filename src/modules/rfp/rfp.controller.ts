import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RFPService } from './rfp.service';
import { AssignVendorsDto, CreateRfpDto, GenerateRfpDto } from './rfp.dto';

@Controller('rfp')
class RFPController {
  constructor(private readonly rfpService: RFPService) {}

  //Send User Request to AI to Generate RFP
  @Post('generate-rfp')
  generateRFP(@Body() generateRfpDto: GenerateRfpDto) {
    return this.rfpService.generateRFP(generateRfpDto.description);
  }

  //Save Generated RFP to Database
  @Post('create')
  createRFP(@Body() createRfpDto: CreateRfpDto) {
    return this.rfpService.createRFP(createRfpDto);
  }

  //Get RFP by ID
  @Get('fetch-rfp/:id')
  getRfp(@Param('id') id: string) {
    return this.rfpService.getRfpById(id);
  }

  //List all  Saved RFPs
  @Get('fetch-all-rfp')
  async listRFPs() {
    console.log('List');
    return await this.rfpService.getAllRFPs();
  }

  //Assign vendors to RFP
  @Post(':id/vendors')
  assignVendors(@Param('id') id: string, @Body() body: AssignVendorsDto) {
    return this.rfpService.assignVendorsToRfp(id, body.vendorIds);
  }

  //Send RFP to vendors
  @Post(':id/send')
  sendRfp(@Param('id') id: string, @Body() body: { vendorIds: string[] }) {
    return this.rfpService.sendRfpEmails(id, body.vendorIds);
  }

  //Get proposals for an RFP
  @Get(':id/proposals')
  getProposals(@Param('id') id: string) {
    return this.rfpService.getProposalsByRfp(id);
  }

  //AI Compare proposals
  @Get(':id/compare')
  compare(@Param('id') id: string) {
    return this.rfpService.compareProposals(id);
  }
}
export { RFPController };

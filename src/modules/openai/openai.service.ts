import { Inject } from '@nestjs/common';
import { AzureOpenAI } from 'openai';

export class OpenAiService {
  constructor(@Inject('AZURE_OPENAI') private readonly openai: AzureOpenAI) {}

  async generateRFP(description: string): Promise<any> {
    try {
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

      const prompt = `
        You convert natural language procurement requirements into STRICT RAW JSON.

        IMPORTANT RULES:
        - DO NOT wrap response in \`\`\`json or any code block.
        - DO NOT add markdown.
        - DO NOT add explanations.
        - Output MUST be ONLY valid JSON.
        - Null missing fields.

        Schema:
        {
          "title": string,
          "descriptionRaw": string,
          "descriptionStructured": {
            "budget": number | null,
            "currency":string,
            "currencySymbol":string
            "deliveryTimeline": string | null,
            "paymentTerms": string | null,
            "warranty": string | null,
            "items": [
              {
                "item": string,
                "quantity": number,
                "specs": string | null
              }
            ]
          }
        }

        User description:
        "${description}"
        `;

      const response = await this.openai.responses.create({
        model: deployment,
        input: [
          {
            role: 'system',
            content:
              'You convert natural-language procurement text into a structured JSON RFP object following the provided schema.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      let output = response.output_text.trim();

      // Remove code fences if AI still includes them
      output = output.replace(/```json/i, '');
      output = output.replace(/```/g, '');
      output = output.trim();

      const structured = JSON.parse(output);

      return structured;
    } catch (error) {
      console.error('RFP Generation Error:', error);
      throw new Error('Failed to generate RFP');
    }
  }

  async parseVendorProposal(payload: {
    sender: string;
    subject: string;
    body: string;
  }): Promise<any> {
    try {
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

      const prompt = `
Extract proposal information from the vendor's email. 
Return STRICT RAW JSON with NO markdown or code blocks.

OUTPUT SCHEMA:
{
  "totalPrice": number | null,
  "currency": string | null,
  "paymentTerms": string | null,
  "deliveryTimeline": string | null,
  "warranty": string | null,
  "items": [
    {
      "item": string,
      "quantity": number | null,
      "unitPrice": number | null,
      "totalPrice": number | null
    }
  ],
  "additionalNotes": string | null
}

Email:
Sender: ${payload.sender}
Subject: ${payload.subject}
Body:
"""
${payload.body}
"""
`;

      const response = await this.openai.responses.create({
        model: deployment,
        input: [
          {
            role: 'system',
            content:
              'You extract structured procurement proposals from unstructured vendor emails. Output only clean JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      let output = response.output_text.trim();

      // Remove accidental markdown code fences
      output = output.replace(/```json/i, '');
      output = output.replace(/```/g, '');
      output = output.trim();

      return JSON.parse(output);
    } catch (error) {
      console.error('Vendor Parsing Error:', error);
      throw new Error('Failed to parse vendor proposal');
    }
  }
}

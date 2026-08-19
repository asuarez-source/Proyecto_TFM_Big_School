import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { CatalogDocumentRecord } from '../domain/canbus-catalog.types';
import { CanbusDocumentIssueModel } from './canbus-document-issue.model';
import { CanbusDocumentPartModel } from './canbus-document-part.model';
import { CanbusDocumentModel } from './canbus-document.model';
import { CanbusManufacturerModel } from './canbus-manufacturer.model';

@Injectable()
export class CanbusCatalogRepository {
  constructor(
    @InjectModel(CanbusManufacturerModel)
    private readonly manufacturerModel: typeof CanbusManufacturerModel,
    @InjectModel(CanbusDocumentModel)
    private readonly documentModel: typeof CanbusDocumentModel,
  ) {}

  async manufacturerExists(normalizedKey: string): Promise<boolean> {
    const count = await this.manufacturerModel.count({
      where: { normalizedKey },
    });
    return count > 0;
  }

  async findDocumentsByManufacturer(
    normalizedKey: string,
  ): Promise<CatalogDocumentRecord[]> {
    const manufacturer = await this.manufacturerModel.findOne({
      attributes: ['id'],
      where: { normalizedKey },
    });
    if (!manufacturer) {
      return [];
    }

    const documents = await this.documentModel.findAll({
      where: { manufacturerId: manufacturer.id },
      include: [
        { model: CanbusDocumentPartModel, required: false },
        { model: CanbusDocumentIssueModel, required: false },
      ],
      order: [
        ['startYear', 'DESC'],
        ['originalFilename', 'ASC'],
      ],
    });

    return documents.map((document) => ({
      id: String(document.id),
      originalFilename: document.originalFilename,
      vehicleDescriptorOriginal: document.vehicleDescriptorOriginal,
      vehicleDescriptorNormalized: document.vehicleDescriptorNormalized,
      startYear: document.startYear,
      parseStatus: document.parseStatus,
      qualifiers: [...(document.parts ?? [])]
        .sort((left, right) => left.tokenPosition - right.tokenPosition)
        .map((part) => ({
          semanticType: part.semanticType,
          originalValue: part.originalValue,
          normalizedValue: part.normalizedValue,
          canonicalValue: part.canonicalValue,
        })),
      issues: (document.issues ?? []).map((issue) => ({
        code: issue.issueCode,
        message: issue.issueMessage,
      })),
    }));
  }
}

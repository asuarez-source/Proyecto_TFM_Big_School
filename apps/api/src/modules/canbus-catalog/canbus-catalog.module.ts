import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FindCanbusCandidatesService } from './application/find-canbus-candidates.service';
import { CanbusCatalogRepository } from './infrastructure/canbus-catalog.repository';
import { CanbusDocumentIssueModel } from './infrastructure/canbus-document-issue.model';
import { CanbusDocumentPartModel } from './infrastructure/canbus-document-part.model';
import { CanbusDocumentModel } from './infrastructure/canbus-document.model';
import { CanbusManufacturerModel } from './infrastructure/canbus-manufacturer.model';
import { CanbusCatalogController } from './presentation/canbus-catalog.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CanbusManufacturerModel,
      CanbusDocumentModel,
      CanbusDocumentPartModel,
      CanbusDocumentIssueModel,
    ]),
  ],
  controllers: [CanbusCatalogController],
  providers: [CanbusCatalogRepository, FindCanbusCandidatesService],
  exports: [FindCanbusCandidatesService],
})
export class CanbusCatalogModule {}

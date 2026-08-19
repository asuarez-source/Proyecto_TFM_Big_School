import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CanbusDocumentIssueModel } from './canbus-document-issue.model';
import { CanbusDocumentPartModel } from './canbus-document-part.model';
import { CanbusManufacturerModel } from './canbus-manufacturer.model';

@Table({
  tableName: 'canbus_document',
  timestamps: false,
  indexes: [
    { name: 'fk_canbus_document_batch', fields: ['import_batch_id'] },
    {
      name: 'uq_canbus_document_original_filename',
      unique: true,
      fields: ['original_filename'],
    },
    {
      name: 'ix_canbus_document_lookup',
      fields: [
        'manufacturer_id',
        'vehicle_descriptor_normalized',
        'start_year',
      ],
    },
    { name: 'ix_canbus_document_status', fields: ['parse_status'] },
  ],
})
export class CanbusDocumentModel extends Model {
  @PrimaryKey
  @Column({ type: DataType.BIGINT.UNSIGNED, autoIncrement: true })
  declare id: string;

  @Column({
    field: 'import_batch_id',
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
  })
  declare importBatchId: string;

  @ForeignKey(() => CanbusManufacturerModel)
  @Column({
    field: 'manufacturer_id',
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
  })
  declare manufacturerId: string;

  // MySQL enforces utf8mb4_0900_as_cs; Sequelize v6 does not expose
  // per-column collation in typed model metadata when synchronization is off.
  @Column({
    field: 'original_filename',
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare originalFilename: string;

  @Column({
    field: 'vehicle_descriptor_original',
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare vehicleDescriptorOriginal: string;

  @Column({
    field: 'vehicle_descriptor_normalized',
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare vehicleDescriptorNormalized: string;

  @Column({
    field: 'start_year',
    type: DataType.SMALLINT.UNSIGNED,
    allowNull: true,
  })
  declare startYear: number | null;

  @Column({
    field: 'language_code',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare languageCode: string | null;

  @Column({
    field: 'file_extension',
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare fileExtension: string | null;

  @Column({
    field: 'parse_status',
    type: DataType.STRING(30),
    allowNull: false,
  })
  declare parseStatus: string;

  @Column({
    field: 'occurrence_count',
    type: DataType.SMALLINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
  })
  declare occurrenceCount: number;

  @Column({
    field: 'source_line_first',
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare sourceLineFirst: number;

  @Column({
    field: 'created_at',
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @BelongsTo(() => CanbusManufacturerModel)
  declare manufacturer?: CanbusManufacturerModel;

  @HasMany(() => CanbusDocumentPartModel)
  declare parts?: CanbusDocumentPartModel[];

  @HasMany(() => CanbusDocumentIssueModel)
  declare issues?: CanbusDocumentIssueModel[];
}

import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CanbusDocumentModel } from './canbus-document.model';

@Table({
  tableName: 'canbus_document_part',
  timestamps: false,
  indexes: [
    {
      name: 'uq_canbus_part_position',
      unique: true,
      fields: ['document_id', 'token_zone', 'token_position'],
    },
    {
      name: 'ix_canbus_part_semantic',
      fields: ['semantic_type', 'normalized_value'],
    },
  ],
})
export class CanbusDocumentPartModel extends Model {
  @PrimaryKey
  @Column({ type: DataType.BIGINT.UNSIGNED, autoIncrement: true })
  declare id: string;

  @ForeignKey(() => CanbusDocumentModel)
  @Column({
    field: 'document_id',
    type: DataType.BIGINT.UNSIGNED,
    allowNull: false,
  })
  declare documentId: string;

  @Column({ field: 'token_zone', type: DataType.STRING(20), allowNull: false })
  declare tokenZone: string;

  @Column({
    field: 'token_position',
    type: DataType.SMALLINT.UNSIGNED,
    allowNull: false,
  })
  declare tokenPosition: number;

  @Column({
    field: 'original_value',
    type: DataType.STRING(150),
    allowNull: false,
  })
  declare originalValue: string;

  @Column({
    field: 'normalized_value',
    type: DataType.STRING(150),
    allowNull: false,
  })
  declare normalizedValue: string;

  @Column({
    field: 'semantic_type',
    type: DataType.STRING(40),
    allowNull: true,
  })
  declare semanticType: string | null;

  @Column({
    field: 'canonical_value',
    type: DataType.STRING(150),
    allowNull: true,
  })
  declare canonicalValue: string | null;

  @BelongsTo(() => CanbusDocumentModel, { onDelete: 'CASCADE' })
  declare document?: CanbusDocumentModel;
}

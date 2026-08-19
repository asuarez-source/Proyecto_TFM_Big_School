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
  tableName: 'canbus_document_issue',
  timestamps: false,
  indexes: [
    { name: 'ix_canbus_issue_document', fields: ['document_id'] },
    { name: 'ix_canbus_issue_code', fields: ['issue_code'] },
  ],
})
export class CanbusDocumentIssueModel extends Model {
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

  @Column({
    field: 'issue_code',
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare issueCode: string;

  @Column({
    field: 'issue_message',
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare issueMessage: string;

  @BelongsTo(() => CanbusDocumentModel, { onDelete: 'CASCADE' })
  declare document?: CanbusDocumentModel;
}

import {
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CanbusDocumentModel } from './canbus-document.model';

@Table({
  tableName: 'canbus_manufacturer',
  timestamps: false,
  indexes: [
    {
      name: 'uq_canbus_manufacturer_normalized_key',
      unique: true,
      fields: ['normalized_key'],
    },
  ],
})
export class CanbusManufacturerModel extends Model {
  @PrimaryKey
  @Column({ type: DataType.BIGINT.UNSIGNED, autoIncrement: true })
  declare id: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  declare name: string;

  @Column({
    field: 'normalized_key',
    type: DataType.STRING(120),
    allowNull: false,
  })
  declare normalizedKey: string;

  @HasMany(() => CanbusDocumentModel)
  declare documents?: CanbusDocumentModel[];
}

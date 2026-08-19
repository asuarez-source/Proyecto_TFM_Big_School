import { Sequelize } from 'sequelize-typescript';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports the database as available after authenticating', async () => {
    const sequelize = { authenticate: jest.fn().mockResolvedValue(undefined) };
    const service = new HealthService(sequelize as unknown as Sequelize);

    const result = await service.check();

    expect(sequelize.authenticate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});

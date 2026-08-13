import { AuditLogService } from '../application/services/audit-log.service';
import { AuditAction, AuditLog } from '../domain/entities/audit-log.entity';

describe('AuditLogService Unit Tests', () => {
  let mockRepo: any;
  let service: AuditLogService;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn().mockImplementation((log: AuditLog) => Promise.resolve(log)),
      findById: jest.fn(),
      find: jest.fn(),
    };
    service = new AuditLogService(mockRepo);
  });

  it('should sanitize sensitive keys (passwords, tokens, cvv, secrets)', () => {
    const raw = {
      username: 'john_doe',
      password: 'SuperSecret123!',
      token: 'jwt.token.string',
      cvv: '123',
      nested: {
        razorpay_secret: 'rzp_secret_key',
        safeField: 'Hello World',
      },
    };

    const sanitized = service.sanitize(raw);

    expect(sanitized.username).toBe('john_doe');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.cvv).toBe('[REDACTED]');
    expect(sanitized.nested.razorpay_secret).toBe('[REDACTED]');
    expect(sanitized.nested.safeField).toBe('Hello World');
  });

  it('should record an audit entry with sanitized before and after payloads', async () => {
    const record = await service.record({
      actorId: 'usr_admin_01',
      actorRole: 'ADMIN',
      action: AuditAction.ORDER_CANCELLED,
      resourceType: 'ORDER',
      resourceId: 'ord_999',
      description: 'Order #YOX-100 cancelled',
      before: { status: 'CONFIRMED', password: '123' },
      after: { status: 'CANCELLED' },
    });

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(record).not.toBeNull();
    expect(record?.actorId).toBe('usr_admin_01');
    expect(record?.action).toBe('ORDER_CANCELLED');
    expect(record?.before?.['password']).toBe('[REDACTED]');
    expect(record?.before?.['status']).toBe('CONFIRMED');
    expect(record?.after?.['status']).toBe('CANCELLED');
  });

  it('should non-blockingly swallow errors if persistence fails', async () => {
    mockRepo.save.mockRejectedValueOnce(new Error('Database Connection Error'));

    const record = await service.record({
      action: AuditAction.AUTH_LOGIN,
      resourceType: 'AUTH',
      resourceId: 'usr_1',
      description: 'User login attempt',
    });

    expect(record).toBeNull();
  });
});

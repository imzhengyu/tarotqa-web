import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { formatTimestamp } from '../../utils/date';

describe('formatTimestamp', () => {
  const RealDate = Date;
  const fixedDate = new RealDate(2024, 5, 15, 9, 7, 3); // 2024-06-15 09:07:03

  beforeEach(() => {
    globalThis.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedDate);
          return;
        }
        super(...args);
      }
    };
  });

  afterEach(() => {
    globalThis.Date = RealDate;
  });

  it('should format current time as YYYYMMDD_HHMMSS', () => {
    expect(formatTimestamp()).toBe('20240615_090703');
  });

  it('should pad single digit month, day, hour, minute, second', () => {
    const marchDate = new RealDate(2024, 2, 5, 4, 3, 2); // 2024-03-05 04:03:02
    globalThis.Date = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(marchDate);
          return;
        }
        super(...args);
      }
    };
    expect(formatTimestamp()).toBe('20240305_040302');
  });

  it('should return a string', () => {
    expect(typeof formatTimestamp()).toBe('string');
  });

  it('should include underscore between date and time', () => {
    expect(formatTimestamp()).toMatch(/^\d{8}_\d{6}$/);
  });
});

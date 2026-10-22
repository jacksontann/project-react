import { pwnedCount } from 'lib/pwned';
import { strengthUserInputs, validateNewPassword } from './passwordPolicy';

jest.mock('lib/pwned', () => ({ pwnedCount: jest.fn() }));
const mockedPwnedCount = jest.mocked(pwnedCount);

describe('new-password policy', () => {
  // The real zxcvbn engine and dictionaries load once for this file.
  jest.setTimeout(20000);

  it('rejects easily guessed passwords before checking breaches', async () => {
    mockedPwnedCount.mockResolvedValue(0);
    await expect(validateNewPassword('password123', [])).resolves.toMatch(/too easy to guess/);
    expect(mockedPwnedCount).not.toHaveBeenCalled();
  });

  it("penalises passwords built from the resident's own details", async () => {
    mockedPwnedCount.mockResolvedValue(0);
    const inputs = strengthUserInputs('Arjun a/l Raman', 'arjun.raman@example.com');
    expect(inputs).toEqual(expect.arrayContaining(['arjun', 'raman', 'lumen']));
    await expect(validateNewPassword('ArjunRaman', inputs)).resolves.toMatch(/too easy to guess/);
  });

  it('accepts a strong passphrase that is not in any breach', async () => {
    mockedPwnedCount.mockResolvedValue(0);
    await expect(validateNewPassword('lantern orchid tramline 47', [])).resolves.toBeNull();
  });

  it('rejects a strong-looking password that appears in breaches', async () => {
    mockedPwnedCount.mockResolvedValue(1234);
    await expect(validateNewPassword('lantern orchid tramline 47', [])).resolves.toMatch(
      /appeared in 1,234 data breaches/,
    );
  });

  it('fails open when the breach service is unreachable', async () => {
    mockedPwnedCount.mockRejectedValue(new Error('offline'));
    await expect(validateNewPassword('lantern orchid tramline 47', [])).resolves.toBeNull();
  });
});

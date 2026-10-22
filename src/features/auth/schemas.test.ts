import { loginRequestSchema, registerFormSchema, registerRequestSchema } from './schemas';

const validRegistration = {
  name: 'Nur Aisyah binti Ahmad',
  email: '  Aisyah@Example.COM ',
  unit: '7-2',
  password: 'lantern orchid tramline',
  confirmPassword: 'lantern orchid tramline',
  terms: true,
};

describe('auth schemas', () => {
  it('normalises email (trim + lower case) and unit (FF-UU)', () => {
    const parsed = registerFormSchema.parse(validRegistration);
    expect(parsed.email).toBe('aisyah@example.com');
    expect(parsed.unit).toBe('07-02');
  });

  it('accepts real-world names without character restrictions', () => {
    for (const name of ['Arjun a/l Raman', "Siti Nur'aini", 'Lim Wei-Jie', 'Ng Ah Kow']) {
      expect(registerRequestSchema.shape.name.safeParse(name).success).toBe(true);
    }
    expect(registerRequestSchema.shape.name.safeParse(' A ').success).toBe(false);
  });

  it('requires 8+ characters but no composition rules (NIST SP 800-63B)', () => {
    expect(registerRequestSchema.shape.password.safeParse('short').success).toBe(false);
    expect(registerRequestSchema.shape.password.safeParse('alllowercaseletters').success).toBe(
      true,
    );
  });

  it('reports a mismatched confirmation on the confirm field', () => {
    const result = registerFormSchema.safeParse({ ...validRegistration, confirmPassword: 'nope' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('requires the house rules to be accepted', () => {
    const result = registerFormSchema.safeParse({ ...validRegistration, terms: false });
    expect(result.success).toBe(false);
  });

  it('rejects units outside the tower', () => {
    expect(registerFormSchema.safeParse({ ...validRegistration, unit: '25-01' }).success).toBe(
      false,
    );
  });

  it('login only needs a valid email and a non-empty password', () => {
    expect(
      loginRequestSchema.safeParse({ email: 'demo@lumen.my', password: 'x', remember: false })
        .success,
    ).toBe(true);
    expect(
      loginRequestSchema.safeParse({ email: 'demo@lumen.my', password: '', remember: false })
        .success,
    ).toBe(false);
  });
});

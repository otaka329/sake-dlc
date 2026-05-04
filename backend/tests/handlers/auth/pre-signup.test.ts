import { describe, it, expect } from 'vitest';

describe('Cognito Pre Sign-up Trigger — ブロックリスト照合', () => {
  // カスタム辞書チェックのロジックを直接テスト
  const CUSTOM_DICTIONARY = [
    'sdlc', 'sake', 'sakenowa', 'nihonshu', 'password', 'qwerty',
    'letmein', 'welcome', 'admin', 'login',
  ];

  function checkCustomDictionary(password: string): string | null {
    const lower = password.toLowerCase();
    for (const word of CUSTOM_DICTIONARY) {
      if (lower.includes(word)) {
        return `パスワードに「${word}」を含めることはできません`;
      }
    }
    return null;
  }

  function checkContextSpecific(password: string, email: string): string | null {
    const lower = password.toLowerCase();
    const [localPart, domain] = email.toLowerCase().split('@');
    if (localPart && localPart.length >= 3 && lower.includes(localPart)) {
      return 'パスワードにメールアドレスの一部を含めることはできません';
    }
    if (domain) {
      const domainName = domain.split('.')[0];
      if (domainName && domainName.length >= 3 && lower.includes(domainName)) {
        return 'パスワードにメールドメインの一部を含めることはできません';
      }
    }
    return null;
  }

  it('辞書語「password」を含むパスワードを拒否する', () => {
    expect(checkCustomDictionary('mypassword123456')).not.toBeNull();
  });

  it('辞書語「sake」を含むパスワードを拒否する', () => {
    expect(checkCustomDictionary('ilovesakedrinking')).not.toBeNull();
  });

  it('辞書語を含まないパスワードを許可する', () => {
    expect(checkCustomDictionary('correcthorsebatterystaple')).toBeNull();
  });

  it('メールのローカル部分を含むパスワードを拒否する', () => {
    expect(checkContextSpecific('mytanaka12345678', 'tanaka@example.com')).not.toBeNull();
  });

  it('メールドメインを含むパスワードを拒否する', () => {
    expect(checkContextSpecific('myexample1234567', 'user@example.com')).not.toBeNull();
  });

  it('メールと無関係なパスワードを許可する', () => {
    expect(checkContextSpecific('correcthorsebattery', 'user@example.com')).toBeNull();
  });
});

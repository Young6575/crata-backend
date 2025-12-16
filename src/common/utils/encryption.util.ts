import * as crypto from 'crypto';

/**
 * AES-256-GCM 암호화 유틸리티
 * 개인정보(이름, 생년월일, 전화번호 등) 암호화에 사용
 */

// 환경변수에서 암호화 키 가져오기 (32바이트 = 256비트)
const getEncryptionKey = (): Buffer | null => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // 개발 환경에서는 키 없이도 동작 (암호화 비활성화)
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }
    throw new Error('ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.');
  }
  // 키가 32바이트가 아니면 SHA-256으로 해시하여 32바이트로 만듦
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * 문자열 암호화
 * @param plainText 암호화할 평문
 * @returns 암호화된 문자열 (iv:authTag:encrypted 형식)
 */
export function encrypt(plainText: string | null | undefined): string | null {
  if (plainText === null || plainText === undefined || plainText === '') {
    return null;
  }

  try {
    const key = getEncryptionKey();
    
    // 키가 없으면 암호화 없이 원본 반환 (개발 환경)
    if (!key) {
      return plainText;
    }
    
    const iv = crypto.randomBytes(12); // GCM 권장 IV 길이: 12바이트
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // iv:authTag:encrypted 형식으로 저장
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('암호화 실패:', error);
    throw new Error('데이터 암호화에 실패했습니다.');
  }
}

/**
 * 문자열 복호화
 * @param encryptedText 암호화된 문자열 (iv:authTag:encrypted 형식)
 * @returns 복호화된 평문
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
  if (encryptedText === null || encryptedText === undefined || encryptedText === '') {
    return null;
  }

  // 암호화되지 않은 레거시 데이터 처리 (콜론이 없으면 평문으로 간주)
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    
    // 키가 없으면 원본 반환 (개발 환경)
    if (!key) {
      return encryptedText;
    }
    
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      // 형식이 맞지 않으면 평문으로 간주 (레거시 데이터)
      return encryptedText;
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('복호화 실패:', error);
    // 복호화 실패 시 원본 반환 (레거시 데이터일 수 있음)
    return encryptedText;
  }
}

/**
 * JSON 객체 내 특정 필드들 암호화
 * @param obj 암호화할 객체
 * @param fields 암호화할 필드명 배열
 * @returns 암호화된 객체
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  if (!obj) return obj;
  
  const result = { ...obj } as Record<string, any>;
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encrypt(String(result[field]));
    }
  }
  return result as T;
}

/**
 * JSON 객체 내 특정 필드들 복호화
 * @param obj 복호화할 객체
 * @param fields 복호화할 필드명 배열
 * @returns 복호화된 객체
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  if (!obj) return obj;
  
  const result = { ...obj } as Record<string, any>;
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = decrypt(String(result[field]));
    }
  }
  return result as T;
}

/**
 * JSON 문자열 암호화 (userMeta 등 JSONB 필드용)
 * @param jsonData JSON 객체
 * @param fieldsToEncrypt 암호화할 필드명 배열
 * @returns 특정 필드가 암호화된 JSON 객체
 */
export function encryptJsonFields(
  jsonData: Record<string, any> | null | undefined,
  fieldsToEncrypt: string[]
): Record<string, any> | null {
  if (!jsonData) return null;
  return encryptFields(jsonData, fieldsToEncrypt);
}

/**
 * JSON 문자열 복호화 (userMeta 등 JSONB 필드용)
 * @param jsonData JSON 객체
 * @param fieldsToDecrypt 복호화할 필드명 배열
 * @returns 특정 필드가 복호화된 JSON 객체
 */
export function decryptJsonFields(
  jsonData: Record<string, any> | null | undefined,
  fieldsToDecrypt: string[]
): Record<string, any> | null {
  if (!jsonData) return null;
  return decryptFields(jsonData, fieldsToDecrypt);
}

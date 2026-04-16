const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const normalizeExamAccessCode = (value = '') =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

export const formatExamAccessCode = (value = '') => {
  const normalized = normalizeExamAccessCode(value);
  return normalized.replace(/(.{4})/g, '$1 ').trim();
};

export const generateExamAccessCode = (length = 8) => {
  const cryptoObject = globalThis.crypto;
  const values = new Uint32Array(length);

  if (!cryptoObject?.getRandomValues) {
    throw new Error("Générateur cryptographique indisponible sur cet appareil.");
  }

  cryptoObject.getRandomValues(values);

  return Array.from(values, (value) => ACCESS_CODE_ALPHABET[value % ACCESS_CODE_ALPHABET.length]).join('');
};

export const hashExamAccessCode = async (value) => {
  const normalized = normalizeExamAccessCode(value);
  const cryptoObject = globalThis.crypto;

  if (!normalized) {
    return null;
  }

  if (!cryptoObject?.subtle) {
    throw new Error("Hash sécurisé indisponible sur cet appareil.");
  }

  const digest = await cryptoObject.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalized)
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

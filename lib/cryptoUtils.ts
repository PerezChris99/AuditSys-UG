export const calculateHash = async (
  id: string,
  timestamp: string,
  amount: number,
  associatedRecordId: string,
  previousHash: string
): Promise<string> => {
  const data = `${id}${timestamp}${amount}${associatedRecordId}${previousHash}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

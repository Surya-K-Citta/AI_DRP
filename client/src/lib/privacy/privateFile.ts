const FILE_REF_PREFIX = 'file:';

export function isPrivateFileRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(FILE_REF_PREFIX) && value.length > 5;
}

export function fileIdFromRef(value: string): string {
  return value.startsWith(FILE_REF_PREFIX) ? value.slice(FILE_REF_PREFIX.length) : value;
}

export function storedImageRef(data: { fileId?: string; imageUrl?: string }): string {
  if (data?.fileId) return `${FILE_REF_PREFIX}${data.fileId}`;
  if (isPrivateFileRef(data?.imageUrl)) return data.imageUrl as string;
  return data?.imageUrl || '';
}

type KycRef = {
  status?: string;
  fileId?: string;
  originalName?: string;
};

export function isKycUploaded(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'object') {
    const obj = value as KycRef;
    return obj.status === 'uploaded' || !!obj.fileId || !!obj.originalName;
  }
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

export function kycDisplayName(value: unknown): string {
  if (value && typeof value === 'object') {
    const obj = value as KycRef & { name?: string };
    return obj.originalName || obj.name || 'Uploaded';
  }
  if (typeof value === 'string') {
    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.includes('/uploads/')
    ) {
      return 'Uploaded';
    }
    return value;
  }
  return 'Uploaded';
}

export function kycUploadPayload(data: any, fallbackName: string) {
  if (data?.fileId || data?.status === 'uploaded') {
    return {
      status: 'uploaded' as const,
      fileId: data.fileId,
      originalName: data.originalName || fallbackName,
    };
  }
  return {
    status: 'uploaded' as const,
    originalName: fallbackName,
  };
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export type PendingProofUpload = {
  assignmentId: number;
  fileUri: string;
  createdAt: number;
};

const KEY = 'SG_PENDING_PROOF_UPLOADS_V1';

export const listPendingProofUploads = async (): Promise<PendingProofUpload[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PendingProofUpload[]) : [];
  } catch {
    return [];
  }
};

const save = async (items: PendingProofUpload[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    return;
  }
};

export const enqueuePendingProofUpload = async (item: PendingProofUpload): Promise<void> => {
  const items = await listPendingProofUploads();
  const next = [item, ...items.filter((x) => x.assignmentId !== item.assignmentId)].slice(0, 50);
  await save(next);
};

export const removePendingProofUpload = async (assignmentId: number): Promise<void> => {
  const items = await listPendingProofUploads();
  const next = items.filter((x) => x.assignmentId !== assignmentId);
  await save(next);
};


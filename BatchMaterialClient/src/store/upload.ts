import { QueueInfo } from '@/utils/constans';
import { defineStore } from 'pinia';

export const useUploadStore = defineStore('upload', () => {
  const queueInfos = ref<QueueInfo[]>([]);

  return { queueInfos };
});

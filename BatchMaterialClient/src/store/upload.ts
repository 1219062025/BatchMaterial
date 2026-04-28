import { QueueInfo } from '@/utils/constans';
import { defineStore } from 'pinia';

export const useUploadStore = defineStore('upload', () => {
  const queueInfos = ref<QueueInfo[]>([]);
  /** 连接id */
  const connectionId = ref('');
  /** 总共的队列数 */
  const queueCount = ref(0);

  return { queueInfos, connectionId, queueCount };
});

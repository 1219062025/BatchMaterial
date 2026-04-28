<template>
  <div id="my-container" class="w-[100vw] h-[100vh]">
    <el-affix :offset="0">
      <el-card shadow="never">
        <div class="flex-y-center justify-between px-[50px]">
          <span class="font-bold text-[20px]">批量处理素材</span>
          <el-button type="primary" @click="handleAllQueueUpload">
            上传处理全部队列
            <el-icon class="el-icon--right">
              <i-ep-upload />
            </el-icon>
          </el-button>
        </div>
      </el-card>
    </el-affix>

    <section id="main">

      <!-- 1x1上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_1x1" v-model:file-list="UploadFileListRatio1x1"
        @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>

      <el-divider />

      <!-- 4:5（硬切）上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_4x5_centercrop" v-model:file-list="UploadFileListCentercrop4x5"
        @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>

      <el-divider />

      <!-- 4:5（硬塞）上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_4x5_putcenter" v-model:file-list="UploadFileListPutcenter4x5"
        @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>

      <el-divider />

      <!-- 9x16上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_9x16" v-model:file-list="UploadFileListRatio9x16"
        @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>

      <el-divider />

      <!-- 16x9（填充图片背景）上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_16x9_picbak" v-model:file-list="UploadFileListPicbak16x9"
        v-model:filler-list="UploadFillerListPicbak16x9" @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>

      <el-divider />

      <!-- 16x9（填充视频背景）上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_16x9_videobak" v-model:file-list="UploadFileListVideoBak16x9"
        v-model:filler-list="UploadFillerListVideoBak16x9" @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>

      <el-divider />

      <!-- 音轨混流上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_ADD_AUDIO" v-model:file-list="UploadFileListAddAudio"
        v-model:audio-tracks="UploadAudioTrackList" @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { NotificationHandle, UploadUserFile } from 'element-plus';
import service from '@/utils/request';
import { CARD_TITLE, COVER_TYPE, WS_MESSAGE, WSMessage, AudioTrack } from '@/utils/constans';
import { useUploadStore } from '@/store/upload';
import Progress from '@/components/Progress.vue';


/** 1x1上传文件素材列表 */
const UploadFileListRatio1x1 = ref<UploadUserFile[]>([]);

/** 4x5（硬切）上传文件素材列表 */
const UploadFileListCentercrop4x5 = ref<UploadUserFile[]>([]);

/** 4x5（硬塞）上传文件素材列表 */
const UploadFileListPutcenter4x5 = ref<UploadUserFile[]>([]);

/** 9x16上传文件素材列表 */
const UploadFileListRatio9x16 = ref<UploadUserFile[]>([]);

/** 16x9（填充图片背景）填充背景列表 */
const UploadFillerListPicbak16x9 = ref<UploadUserFile[]>([]);
/** 16x9（填充图片背景）上传文件素材列表 */
const UploadFileListPicbak16x9 = ref<UploadUserFile[]>([]);

/** 16x9（填充视频背景）填充背景列表 */
const UploadFillerListVideoBak16x9 = ref<UploadUserFile[]>([]);
/** 16x9（填充视频背景）上传文件素材列表 */
const UploadFileListVideoBak16x9 = ref<UploadUserFile[]>([]);

/** 音轨混流上传文件素材列表 */
const UploadFileListAddAudio = ref<UploadUserFile[]>([]);
/** 音轨混流音轨列表 */
const UploadAudioTrackList = ref<AudioTrack[]>([]);


const store = useUploadStore()
const ws = ref<WebSocket>();
const Notification = ref<NotificationHandle>()
const wsMessage = ref<WSMessage>()

/** 仅上传指定队列 */
const handleSingleQueueUpload = async (coverType: COVER_TYPE) => {
  const result = await verify([coverType])
  if (result.success) {
    upload([coverType]);
    ElMessage.success(result.message);
  } else {
    ElMessage.error(result.message);
  }
}

/** 上传全部队列 */
const handleAllQueueUpload = async () => {
  ElMessageBox.confirm(
    `一次性上传处理所有队列？`,
    `Confirm`,
    {
      type: 'success',
      cancelButtonText: '取消',
      confirmButtonText: '确定'
    }
  ).then(async () => {
    const coverTypes: COVER_TYPE[] = []
    for (let i = 0; i < store.queueCount; i++) {
      coverTypes.push(i);
    }

    const result = await verify(coverTypes)
    if (result.success) {
      upload(coverTypes);
      ElMessage.success(result.message);
    } else {
      ElMessage.error(result.message);
    }
  }).catch(() => { })
}


const upload = async (types: COVER_TYPE[]) => {
  const formData = new FormData();

  const queues = store.queueInfos.filter((item, index) => {
    return item && types.includes(index);;
  })

  // 构成元数据
  const metaData = queues.map((item) => {
    return {
      coverType: item.coverType,
      fileCount: item.fileList.length,
      hasFiller: !!item.filler && item.useFiller !== false,
      width: item.width,
      height: item.height,
      startCut: item.startCut,
      endCut: item.endCut,
      useFiller: item.useFiller,
      keepDuration: item.keepDuration,
      audioTracks: item.audioTracks?.map(t => ({ startAt: t.startAt })) || []
    }
  })

  // 添加元数据
  formData.append('meta', JSON.stringify(metaData));

  // 添加ws连接id
  formData.append('connectionId', store.connectionId);

  queues.forEach((item, index) => {
    // 添加 fileList 中的文件
    item.fileList.forEach((file, fileIndex) => {
      if (file.raw) { // raw 是真实的 File 对象
        formData.append(`${index}.fileList.${fileIndex}`, file.raw);
      }
    });

    // 添加 filler 文件（如果存在）
    if (item.filler?.raw) {
      formData.append(`${index}.filler`, item.filler.raw);
    }

    // 添加 audioTrack 文件（如果存在）
    if (item.audioTracks) {
      item.audioTracks.forEach((track, audioIndex) => {
        if (track.file.raw) {
          formData.append(`${index}.audioTrack.${audioIndex}`, track.file.raw);
        }
      });
    }
  });

  const loadingInstance = ElLoading.service({ fullscreen: true, text: 'FFMPEG处理中...' });

  if (Notification.value) {
    Notification.value.close();
    Notification.value = undefined;
    wsMessage.value = undefined;
  }
  Notification.value = ElNotification({
    title: '处理进度',
    duration: 0,
    message: () =>
      h(Progress, {
        message: wsMessage.value
      })
    ,
  })

  const coverResult = await service.post('/cover', formData, {
    headers: { "Content-Type": 'multipart/form-data' }
  }
  ) as { success: boolean, message: string[] | string }

  loadingInstance.close();

  if (!coverResult.success) {
    ElMessage.error(`${coverResult.message}`)
    return;
  }

  const loadingInstance1 = ElLoading.service({ fullscreen: true, text: '生成压缩包中...' });

  const downloadRes = await service.post('/download-video', { fileIds: coverResult.message }, { responseType: 'blob' })

  //@ts-ignore
  const blob = new Blob([downloadRes as BlobPart], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'processed-videos.zip'; // 设置文件名
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  loadingInstance1.close();

  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/** 验证 */
const verify = async (coverTypes: COVER_TYPE[]): Promise<{ success: boolean, message: string }> => {
  let hasFile: boolean = false

  return new Promise(async (resolve) => {
    for (let i = 0; i < coverTypes.length; i++) {
      const coverType = coverTypes[i];
      const queueInfo = store.queueInfos[coverType];
      const { fileList, filler } = queueInfo
      if (fileList.length === 0) {
        continue;
      } else {
        hasFile = true;
      }

      if ([COVER_TYPE.COVER_16x9_picbak, COVER_TYPE.COVER_16x9_videobak].includes(coverType)) {
        // 只有在使用填充背景时才验证填充文件
        if (queueInfo.useFiller !== false) {
          if (!filler) {
            resolve({ success: false, message: `请先选择【${CARD_TITLE[coverType]}】队列的填充背景` })
          }

          if (coverType === COVER_TYPE.COVER_16x9_picbak && !filler?.raw?.type.startsWith('image/')) {
            resolve({ success: false, message: `【${CARD_TITLE[coverType]}】队列的填充背景只能是图片类型` })
          }

          if (coverType === COVER_TYPE.COVER_16x9_videobak && filler?.raw?.type !== 'video/mp4') {
            resolve({ success: false, message: `【${CARD_TITLE[coverType]}】队列的填充背景只能是MP4类型` })
          }
        }
      }

      if (coverType === COVER_TYPE.COVER_ADD_AUDIO) {
        if (!queueInfo.audioTracks || queueInfo.audioTracks.length === 0) {
          resolve({ success: false, message: `请先上传【${CARD_TITLE[coverType]}】队列的音轨文件` })
        }
      }
    }

    resolve({ success: hasFile, message: hasFile ? '开始上传处理' : '未检测到需要处理的文件' })
  })
}

onMounted(() => {
  // 与服务端建立WebSocket链接，实时获取任务处理进度
  if (!ws.value) {
    ws.value = new WebSocket('ws://localhost:3007');


    ws.value.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);

      switch (message.type) {
        case WS_MESSAGE.CONNECTION_SUCCESS:
          store.connectionId = message.connectionId;
          wsMessage.value = message
          break
        case WS_MESSAGE.UPDATE_PROGRESS:
          wsMessage.value = message
          break
      }
    };

    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };
  }
})

onUnmounted(() => {
  if (ws.value) ws.value.close();
});
</script>

<style scoped lang="scss">
#main {
  padding: 50px;
}

#my-container {
  overflow: auto;
  /* 必须 */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE/Edge */


  /* Chrome/Safari/Opera */
  #my-container::-webkit-scrollbar {
    display: none;
  }
}
</style>

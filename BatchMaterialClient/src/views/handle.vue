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

      <!-- 16x9（填充图片背景）上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_16x9_picbak" v-model:file-list="UploadFileListPicbak16x9"
        v-model:filler-list="UploadFillerListPicbak16x9" @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>

      <el-divider />

      <!-- 16x9（填充视频背景）上传队列 -->
      <UploadCard :cover-type="COVER_TYPE.COVER_16x9_videobak" v-model:file-list="UploadFileListVideoBak16x9"
        v-model:filler-list="UploadFillerListVideoBak16x9" @on-single-queue-upload="handleSingleQueueUpload">
      </UploadCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { genFileId, UploadFile, UploadProps, UploadRawFile, UploadUserFile } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue'
import service from '@/utils/request';
import { CARD_TITLE, COVER_TYPE, QueueInfo } from '@/utils/constans';
import { getAssetURL, imageToFile } from '@/utils';
import { useUploadStore } from '@/store/upload';


/** 1x1上传文件素材列表 */
const UploadFileListRatio1x1 = ref<UploadUserFile[]>([]);

/** 4x5（硬切）上传文件素材列表 */
const UploadFileListCentercrop4x5 = ref<UploadUserFile[]>([]);

/** 4x5（硬塞）上传文件素材列表 */
const UploadFileListPutcenter4x5 = ref<UploadUserFile[]>([]);

/** 16x9（填充图片背景）填充背景列表 */
const UploadFillerListPicbak16x9 = ref<UploadUserFile[]>([]);
/** 16x9（填充图片背景）上传文件素材列表 */
const UploadFileListPicbak16x9 = ref<UploadUserFile[]>([]);

/** 16x9（填充视频背景）填充背景列表 */
const UploadFillerListVideoBak16x9 = ref<UploadUserFile[]>([]);
/** 16x9（填充视频背景）上传文件素材列表 */
const UploadFileListVideoBak16x9 = ref<UploadUserFile[]>([]);

const store = useUploadStore()

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
    for (let i = 0; i < 5; i++) {
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

  const queues = store.queueInfos.filter((item, index) => index === types[index])


  // 构成元数据
  const metaData = queues.map((item) => {
    return {
      coverType: item.coverType,
      fileCount: item.fileList.length,
      hasFiller: !!item.filler,
      width: item.width,
      height: item.height
    }
  })

  // 添加元数据
  formData.append('meta', JSON.stringify(metaData));

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
  });

  const loadingInstance = ElLoading.service({ fullscreen: true, text: 'FFMPEG处理中...' });
  const fileIds = await service.post('/cover', formData, { headers: { "Content-Type": 'multipart/form-data' } })
  loadingInstance.close();

  const res = await service.post('/download-video', { fileIds }, { responseType: 'blob' })

  // @ts-ignore
  const blob = new Blob([res], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'processed-videos.zip'; // 设置文件名
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
}

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

    resolve({ success: hasFile, message: hasFile ? '开始上传处理' : '未检测到需要处理的文件' })
  })
}
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

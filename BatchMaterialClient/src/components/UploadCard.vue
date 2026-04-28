<template>
  <el-card>
    <template #header>
      <span class="font-bold">{{ CARD_TITLE[coverType] }}</span>
    </template>

    <template v-if="[COVER_TYPE.COVER_16x9_picbak, COVER_TYPE.COVER_16x9_videobak].includes(coverType)">

      <!-- 16:9图片背景队列：是否使用填充背景开关 -->
      <div v-if="isFillerPicBak" class="mb-4">
        <el-checkbox v-model="useFiller">使用填充背景</el-checkbox>
      </div>

      <el-upload v-show="useFiller || !isFillerPicBak" ref="fillerUpload" v-model:file-list="fillerList" action="#"
        :drag="true" :multiple="true" :accept="isFillerPicBak ? 'image/*' : '.mp4'" :auto-upload="false"
        :show-file-list="true" list-type="picture-card" @change="onFillerListChange">

        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="select-none el-upload__text">
          拖拽 或 <em>选择</em>
          <br>
          <text class="font-bold text-yellow-500 ">填充背景</text>
        </div>

        <template #file="{ file, index }">
          <div class="flex w-full">
            <div class="absolute z-[999] top-[3px] right-[5px]">
              <el-radio v-if="isFillerPicBak" v-model="fillerPicBakType" :value="index" size="small"
                @change="onChangeFillerPicBakType">
                {{ index === 5 ? `自定义` : `默认图片${index + 1}` }}
              </el-radio>
            </div>
            <div class="el-upload-list__item-thumbnail flex-x-center">

              <video v-if="file && file.raw?.type.startsWith('video/')" :src="file.url || ''">
              </video>

              <img v-else-if="file && file.raw?.type.startsWith('image/')" :src="file.url || ''"
                class="object-contain select-none">
              </img>

              <div class="w-[110%] h-[20px] flex-center absolute-x-center bottom-[-25px]">
                <el-tooltip class="box-item" effect="dark" :content="file.name" placement="bottom">
                  <div class="cursor-default line-clamp-1">{{ file.name
                  }}</div>
                </el-tooltip>
              </div>

              <div class="w-[110%] h-[20px] flex-center absolute-x-center bottom-[-45px]">
                <div class="font-bold cursor-default line-clamp-1">{{ formatFileSize(file.size || 0) }}</div>
              </div>

            </div>
            <span class="el-upload-list__item-actions">
              <span class="el-upload-list__item-preview" @click="handlePreview(file)">
                <el-icon>
                  <i-ep-ZoomIn />
                </el-icon>
              </span>
              <span v-if="!isFillerPicBak || (isFillerPicBak && index === 5)" class="el-upload-list__item-delete"
                @click="handleFillerRemove(file)">
                <el-icon>
                  <i-ep-DeleteFilled />
                </el-icon>
              </span>
            </span>
          </div>
        </template>
      </el-upload>

      <el-divider />
    </template>

    <!-- 音轨上传区域（仅音轨混流队列） -->
    <template v-if="isAddAudio">
      <el-upload ref="audioUpload" v-model:file-list="audioFileList" action="#" :drag="true" :multiple="true"
        :accept="'.mp3,.wav,.aac,.flac,.ogg,.m4a'" :auto-upload="false" :show-file-list="true" list-type="picture-card"
        @change="onAudioTrackListChange">

        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="select-none el-upload__text">
          拖拽 或 <em>选择</em>
          <br>
          <text class="font-bold text-blue-500">音轨文件</text>
        </div>

        <template #file="{ file, index }">
          <div class="flex w-full">
            <div class="el-upload-list__item-thumbnail flex-x-center flex-col items-center">
              <el-icon size="48" color="#409EFF"><i-ep-Headset /></el-icon>
              <div class="w-[110%] h-[20px] flex-center absolute-x-center bottom-[-25px]">
                <el-tooltip class="box-item" effect="dark" :content="file.name" placement="bottom">
                  <div class="cursor-default line-clamp-1">{{ file.name }}</div>
                </el-tooltip>
              </div>
              <div class="w-[110%] h-[20px] flex-center absolute-x-center bottom-[-45px]">
                <div class="font-bold cursor-default line-clamp-1">{{ formatFileSize(file.size || 0) }}</div>
              </div>
            </div>
            <span class="el-upload-list__item-actions">
              <span class="el-upload-list__item-delete" @click="handleAudioTrackRemove(file, index)">
                <el-icon>
                  <i-ep-DeleteFilled />
                </el-icon>
              </span>
            </span>
          </div>
        </template>
      </el-upload>

      <!-- 音轨列表：每条音轨的起始时间设置 -->
      <div v-if="audioTracks.length > 0" class="mt-4 mb-4">
        <div v-for="(track, idx) in audioTracks" :key="idx" class="flex items-center mb-2">
          <span class="mr-[10px] text-[14px] font-bold text-blue-500">音轨{{ idx + 1 }}：</span>
          <span class="mr-[10px] text-[13px] line-clamp-1 max-w-[200px]">{{ track.file.name }}</span>
          <span class="mr-[10px]">
            起始：
            <el-input-number v-model="track.startAt" controls-position="right" :min="0" :step="0.5">
              <template #suffix>
                <span>秒</span>
              </template>
            </el-input-number>
          </span>
        </div>
      </div>

      <el-divider />
    </template>

    <el-upload ref="fileUpload" v-model:file-list="fileList" action="#" :drag="true" :multiple="true" :accept="'.mp4'"
      :auto-upload="false" :show-file-list="true" list-type="picture-card" @change="onFileListChange">

      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="select-none el-upload__text">
        拖拽 或 <em>选择</em>
        <br>
        <text class="font-bold text-green-600">素材文件</text>
      </div>

      <template #file="{ file }">
        <div class="flex w-full">
          <div class="el-upload-list__item-thumbnail flex-x-center">

            <video v-if="file && file.raw?.type.startsWith('video/')" :src="file.url || ''">
            </video>

            <img v-else-if="file && file.raw?.type.startsWith('image/')" :src="file.url || ''"
              class="object-contain select-none">
            </img>

            <div class="w-[110%] h-[20px] flex-center absolute-x-center bottom-[-25px]">
              <el-tooltip class="box-item" effect="dark" :content="file.name" placement="bottom">
                <div class="cursor-default line-clamp-1">{{ file.name
                }}</div>
              </el-tooltip>
            </div>

            <div class="w-[110%] h-[20px] flex-center absolute-x-center bottom-[-45px]">
              <div class="font-bold cursor-default line-clamp-1">{{ formatFileSize(file.size || 0) }}</div>
            </div>

          </div>
          <span class="el-upload-list__item-actions">
            <span class="el-upload-list__item-preview" @click="handlePreview(file)">
              <el-icon>
                <i-ep-ZoomIn />
              </el-icon>
            </span>
            <span class="el-upload-list__item-delete" @click="handleFileRemove(file)">
              <el-icon>
                <i-ep-DeleteFilled />
              </el-icon>
            </span>
          </span>
        </div>
      </template>
    </el-upload>

    <template #footer>
      <div class="mb-[10px] flex items-center justify-between">
        <div class="flex" v-if="!isAddAudio">
          <span class="mr-[20px]">
            宽：
            <el-input-number v-model="width" @change="handleChangeWidth" controls-position="right">
              <template #suffix>
                <span>px</span>
              </template>
            </el-input-number>
          </span>
          <span class="mr-[20px]">
            高：
            <el-input-number v-model="height" @change="handleChangeHeight" controls-position="right">
              <template #suffix>
                <span>px</span>
              </template>
            </el-input-number>
          </span>
          <span class="mr-[20px]">
            裁剪：
            <el-input-number v-model="startCut" controls-position="right" :min="0" :disabled="keepDuration > 0">
              <template #prefix>
                <span>前</span>
              </template>
              <template #suffix>
                <span>秒</span>
              </template>
            </el-input-number>
            <el-input-number v-model="endCut" controls-position="right" :min="0" class="ml-[10px]"
              :disabled="keepDuration > 0">
              <template #prefix>
                <span>后</span>
              </template>
              <template #suffix>
                <span>秒</span>
              </template>
            </el-input-number>
          </span>
          <span class="mr-[20px]">
            保留：
            <el-input-number v-model="keepDuration" controls-position="right" :min="0"
              :disabled="startCut > 0 || endCut > 0">
              <template #prefix>
                <span>前</span>
              </template>
              <template #suffix>
                <span>秒</span>
              </template>
            </el-input-number>
          </span>
        </div>

        <div class="flex-y-center">
          <el-button type="primary" @click="handleSingleQueueUpload">
            仅上传该队列
            <el-icon class="el-icon--right">
              <i-ep-upload />
            </el-icon>
          </el-button>
          <el-button type="danger" @click="handleClearQueue">
            清空队列
            <el-icon class="el-icon--right">
              <i-ep-delete />
            </el-icon>
          </el-button>
        </div>
      </div>

      <div class="ml-[5px] flex items-center justify-between w-full">
        <div v-if="isAddAudio" class="text-red-600 text-[12px]">素材仅支持MP4视频，音轨支持 MP3/WAV/AAC/FLAC/OGG/M4A</div>
        <div v-else class="text-red-600 text-[12px]">素材仅支持MP4视频</div>
      </div>
    </template>

    <el-dialog v-model="previewVisible" @close="onClosePreview">

      <div class="max-h-[60vh] flex-center">
        <video v-if="previewObj && previewObj.raw?.type.startsWith('video/')" class="max-w-full max-h-[60vh]"
          ref="videoPreviewNode" :src="previewObj.url || ''" controls>
        </video>

        <img v-else-if="previewObj && previewObj.raw?.type.startsWith('image/')" :src="previewObj.url || ''"
          class="object-contain max-w-full max-h-full select-none">
        </img>
      </div>

    </el-dialog>
  </el-card>

</template>

<script setup lang='ts'>
import { UploadFile, UploadFiles, UploadInstance, UploadProps, UploadRawFile, UploadUserFile } from 'element-plus';
import { UploadFilled, Delete } from '@element-plus/icons-vue'
import { COVER_TYPE, CARD_TITLE, PIC_BAK_TYPE, QueueInfo, AudioTrack } from '@/utils/constans';
import { getAssetURL, imageToFile, formatFileSize } from '@/utils';
import { useUploadStore } from '@/store/upload';

/** 声明子组件的事件 */
const emit = defineEmits<{
  // <eventName>: <expected arguments>
  onSingleQueueUpload: [coverType: COVER_TYPE]
}>()
/** 声明子组件的Prop */
const props = defineProps<{
  /** 队列类型 */
  coverType: number
}>()

/** 是否是 16x9（填充图片背景）队列 */
const isFillerPicBak = computed(() => {
  return props.coverType === COVER_TYPE.COVER_16x9_picbak
})

/** 是否是音轨混流队列 */
const isAddAudio = computed(() => {
  return props.coverType === COVER_TYPE.COVER_ADD_AUDIO
})

/** 上传的文件列表 */
const fileList = defineModel<UploadUserFile[]>('fileList', { required: true, default: [] })
/** 填充的背景列表 */
const fillerList = defineModel<UploadUserFile[]>('fillerList', { required: false, default: [] })
/** 音轨列表（仅音轨混流队列） */
const audioTracks = defineModel<AudioTrack[]>('audioTracks', { required: false, default: [] })


/** 默认宽度 */
const width = ref(1080)
/** 默认高度 */
const height = ref(1080)
/** 裁剪前startCut秒 */
const startCut = ref(0)
/** 裁剪后endCut秒 */
const endCut = ref(0)
/** 是否使用填充背景（仅16:9图片背景队列有效） */
const useFiller = ref(true)
/** 保留前keepDuration秒（与裁剪功能互斥） */
const keepDuration = ref(0)
/** 文件上传组件实例 */
const fileUpload = ref<UploadInstance>()
/** 填充背景上传组件实例 */
const fillerUpload = ref<UploadInstance>()
/** 音轨上传组件实例 */
const audioUpload = ref<UploadInstance>()
/** 填充的背景 */
const filler = ref<UploadUserFile>()
/** 音轨文件列表（el-upload 绑定用） */
const audioFileList = ref<UploadUserFile[]>([])

/** 填充图片背景时使用默认图片还是自定义 0 = 默认图片1  1 = 默认图片2  2 = 自定义图片 */
const fillerPicBakType = ref<PIC_BAK_TYPE>(PIC_BAK_TYPE.DEFAULT_IMG1)

/** 预览的文件对象 */
const previewObj = ref<UploadFile>();
/** 是否显示文件预览窗口 */
const previewVisible = ref(false);
/** 视频文件预览窗口节点 */
const videoPreviewNode = ref<HTMLVideoElement>();

// 监听组件属性的变化，保存到store
const store = useUploadStore()
watchEffect(() => {
  const { coverType } = toRefs(props)

  const newInfo: QueueInfo = {
    coverType: coverType.value,
    fileList: [...fileList.value],
    filler: filler.value ? { ...filler.value } : undefined,
    width: width.value,
    height: height.value,
    startCut: startCut.value,
    endCut: endCut.value,
    useFiller: isFillerPicBak.value ? useFiller.value : undefined,
    keepDuration: keepDuration.value,
    audioTracks: isAddAudio.value ? [...audioTracks.value] : undefined
  }

  store.queueInfos[coverType.value] = newInfo
})

/** 上传队列 */
const handleSingleQueueUpload = () => {
  ElMessageBox.confirm(
    `仅上传该队列？`,
    `${CARD_TITLE[props.coverType]}`,
    {
      type: 'success',
      cancelButtonText: '取消',
      confirmButtonText: '确定'
    }
  ).then(async () => {
    emit('onSingleQueueUpload', props.coverType)
  }).catch(() => { })
}

/** 清空队列 */
const handleClearQueue = async () => {
  ElMessageBox.confirm(
    '清空该上传队列？',
    `${CARD_TITLE[props.coverType]}`,
    {
      type: 'error',
      icon: markRaw(Delete),
      cancelButtonText: '取消',
      confirmButtonText: '确定'
    }
  ).then(async () => {
    await fileUpload.value?.clearFiles();
    if (isAddAudio.value) {
      audioTracks.value = [];
      audioFileList.value = [];
    }
    ElMessage({
      type: 'success',
      message: `已清空队列【${CARD_TITLE[props.coverType]}】`,
    })
  }).catch(() => { })
}

/** 预览文件 */
const handlePreview = (file: UploadFile) => {
  previewObj.value = file
  previewVisible.value = true;
}

/** 移除文件 */
const handleFileRemove = async (file: UploadFile) => {
  await fileUpload.value?.handleRemove(file)
}

/** 移除填充背景 */
const handleFillerRemove = async (file: UploadFile) => {
  await fillerUpload.value?.handleRemove(file)

  if (fillerPicBakType.value === PIC_BAK_TYPE.CUSTOM) {
    fillerPicBakType.value = PIC_BAK_TYPE.DEFAULT_IMG1
  }
}

/** 文件列表改变 */
const onFileListChange: UploadProps['onChange'] = async (file: UploadFile) => {
  if (!(file.raw?.type === 'video/mp4')) {
    ElMessage.error('素材仅支持MP4视频');
    await fileUpload.value?.handleRemove(file)
    return false;
  }
}

/** 填充背景列表改变 */
const onFillerListChange: UploadProps['onChange'] = async (file: UploadFile, uploadFiles: UploadFiles) => {
  if (props.coverType === COVER_TYPE.COVER_16x9_videobak) {
    if (!(file.raw?.type === 'video/mp4')) {
      ElMessage.error('该队列仅支持填充MP4视频背景');
      await fillerUpload.value?.handleRemove(file)
      return
    }
  } else if (props.coverType === COVER_TYPE.COVER_16x9_picbak) {
    if (!(file.raw?.type.startsWith('image/'))) {
      ElMessage.error('该队列仅支持填充图片背景');
      await fillerUpload.value?.handleRemove(file)
      return
    }
  }

  // 超过限制数量
  const limit = isFillerPicBak.value ? 6 : 1;
  const index = isFillerPicBak.value ? 5 : 0;
  if (uploadFiles.length > limit) {
    uploadFiles.splice(index, 1);
  }
  if (!isFillerPicBak.value) {
    filler.value = uploadFiles[index];
  } else if (isFillerPicBak.value && fillerPicBakType.value === PIC_BAK_TYPE.CUSTOM) {
    filler.value = uploadFiles[index];
  }
}

/** 关闭预览窗口 */
const onClosePreview = () => {
  const fileType = previewObj.value?.raw?.type;

  if (fileType && fileType.startsWith('video/')) {
    videoPreviewNode.value?.pause();
  }
}

/** 音轨文件列表改变 */
const onAudioTrackListChange: UploadProps['onChange'] = async (file: UploadFile, uploadFiles: UploadFiles) => {
  const acceptTypes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/x-m4a', 'audio/mp4', 'audio/x-wav']
  // 通过扩展名兜底校验（部分浏览器 MIME 可能不一致）
  const ext = file.name?.split('.').pop()?.toLowerCase()
  const validExt = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a']
  if (!acceptTypes.includes(file.raw?.type || '') && !validExt.includes(ext || '')) {
    ElMessage.error('音轨仅支持 MP3/WAV/AAC/FLAC/OGG/M4A 格式');
    await audioUpload.value?.handleRemove(file)
    return
  }

  // 同步到 audioTracks
  audioTracks.value = uploadFiles.map(f => {
    const existing = audioTracks.value.find(t => t.file.uid === f.uid)
    return existing || { file: f, startAt: 0 }
  })
}

/** 移除音轨 */
const handleAudioTrackRemove = async (file: UploadFile, index: number) => {
  await audioUpload.value?.handleRemove(file)
  audioTracks.value.splice(index, 1)
}

const onChangeFillerPicBakType = (value: string | number | boolean | undefined) => {
  filler.value = fillerList.value[value as number]
}

/** 改变宽度 */
const handleChangeWidth = () => {
  if (props.coverType === COVER_TYPE.COVER_1x1) {
    height.value = width.value
  } else if (props.coverType === COVER_TYPE.COVER_4x5_centercrop || props.coverType === COVER_TYPE.COVER_4x5_putcenter) {
    height.value = (5 / 4) * width.value
  } else if (props.coverType === COVER_TYPE.COVER_9x16) {
    height.value = (16 / 9) * width.value
  }
  else if (props.coverType === COVER_TYPE.COVER_16x9_picbak || props.coverType === COVER_TYPE.COVER_16x9_videobak) {
    height.value = (9 / 16) * width.value
  }
}

/** 改变高度 */
const handleChangeHeight = () => {
  if (props.coverType === COVER_TYPE.COVER_1x1) {
    width.value = height.value
  } else if (props.coverType === COVER_TYPE.COVER_4x5_centercrop || props.coverType === COVER_TYPE.COVER_4x5_putcenter) {
    width.value = (4 / 5) * height.value
  } else if (props.coverType === COVER_TYPE.COVER_9x16) {
    width.value = (9 / 16) * height.value
  }
  else if (props.coverType === COVER_TYPE.COVER_16x9_picbak || props.coverType === COVER_TYPE.COVER_16x9_videobak) {
    width.value = (16 / 9) * height.value
  }
}

/** 组件初始化做的事情 */
const init = async () => {
  // 组件加载后默认执行一次
  handleChangeWidth()

  store.queueCount++;

  // 加载16x9（填充图片背景）的默认图片
  if (props.coverType === COVER_TYPE.COVER_16x9_picbak) {
    if (fillerList.value.length === 0) {
      const loadQueue: Promise<File>[] = []
      for (let i = 0; i < 5; i++) {
        const loadDefaultImgPromise = imageToFile(getAssetURL(`default_img${i}.png`), `'default_img${i}.png'`)
        loadQueue.push(loadDefaultImgPromise)
      }

      Promise.all(loadQueue).then(async (results) => {
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          await fillerUpload.value?.handleStart(result as UploadRawFile)
        }

        filler.value = fillerList.value[0]
      })
    }
  }
}

init();


</script>

<style scoped lang='scss'>
/* 使用::v-deep */
::v-deep(.el-upload-list .el-upload-dragger) {
  background-color: transparent;
  border: none;
  padding: 0;
}

::v-deep(.el-upload-list .el-upload) {
  display: flex !important;
}

::v-deep(.el-upload-list .el-upload-list__item) {
  overflow: visible !important;
  margin: 0 30px 60px 0;
}
</style>

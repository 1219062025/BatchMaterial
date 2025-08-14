<template>
  <el-card>
    <template #header>
      <span class="font-bold">{{ CARD_TITLE[coverType] }}</span>
    </template>

    <template v-if="[COVER_TYPE.COVER_16x9_picbak, COVER_TYPE.COVER_16x9_videobak].includes(coverType)">

      <el-upload ref="fillerUpload" v-model:file-list="fillerList" action="#" :drag="true" :multiple="true"
        :accept="isFillerPicBak ? 'image/*' : '.mp4'" :auto-upload="false" :show-file-list="true"
        list-type="picture-card" @change="onFillerListChange">

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
                {{ index === 2 ? `自定义` : `默认图片${index + 1}` }}
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
              <span v-if="!isFillerPicBak || (isFillerPicBak && index === 2)" class="el-upload-list__item-delete"
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
        <div class="flex">
          <span class="mr-[20px]">
            宽：
            <el-input-number v-model="width" @change="handleChangeWidth" controls-position="right">
              <template #suffix>
                <span>px</span>
              </template>
            </el-input-number>
          </span>
          <span>
            高：
            <el-input-number v-model="height" @change="handleChangeHeight" controls-position="right">
              <template #suffix>
                <span>px</span>
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
        <div class="text-red-600 text-[12px]">素材仅支持MP4视频</div>
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
import { COVER_TYPE, CARD_TITLE, PIC_BAK_TYPE, QueueInfo } from '@/utils/constans';
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

/** 上传的文件列表 */
const fileList = defineModel<UploadUserFile[]>('fileList', { required: true, default: [] })
/** 填充的背景列表 */
const fillerList = defineModel<UploadUserFile[]>('fillerList', { required: false, default: [] })


/** 默认宽度 */
const width = ref(1080)
/** 默认高度 */
const height = ref(1080)
/** 文件上传组件实例 */
const fileUpload = ref<UploadInstance>()
/** 填充背景上传组件实例 */
const fillerUpload = ref<UploadInstance>()
/** 填充的背景 */
const filler = ref<UploadUserFile>()

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
  const limit = isFillerPicBak.value ? 3 : 1;
  const index = isFillerPicBak.value ? 2 : 0;
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

const onChangeFillerPicBakType = (value: string | number | boolean | undefined) => {
  filler.value = fillerList.value[value as number]
}

/** 改变宽度 */
const handleChangeWidth = () => {
  if (props.coverType === COVER_TYPE.COVER_1x1) {
    height.value = width.value
  } else if (props.coverType === COVER_TYPE.COVER_4x5_centercrop || props.coverType === COVER_TYPE.COVER_4x5_putcenter) {
    height.value = (5 / 4) * width.value
  } else if (props.coverType === COVER_TYPE.COVER_16x9_picbak || props.coverType === COVER_TYPE.COVER_16x9_videobak) {
    height.value = (9 / 16) * width.value
  }
}

/** 改变高度 */
const handleChangeHeight = () => {
  if (props.coverType === COVER_TYPE.COVER_1x1) {
    width.value = height.value
  } else if (props.coverType === COVER_TYPE.COVER_4x5_centercrop || props.coverType === COVER_TYPE.COVER_4x5_putcenter) {
    width.value = (4 / 5) * height.value
  } else if (props.coverType === COVER_TYPE.COVER_16x9_picbak || props.coverType === COVER_TYPE.COVER_16x9_videobak) {
    width.value = (16 / 9) * height.value
  }
}

/** 组件初始化做的事情 */
const init = async () => {
  // 组件加载后默认执行一次
  handleChangeWidth()

  // 加载16x9（填充图片背景）的两张默认图片
  if (props.coverType === COVER_TYPE.COVER_16x9_picbak) {
    if (fillerList.value.length === 0) {
      const loadDefaultImg1Promise = imageToFile(getAssetURL('default_img1.png'), 'default_img1.png')

      const loadDefaultImg2Promise = imageToFile(getAssetURL('default_img2.png'), 'default_img2.png')

      Promise.all([loadDefaultImg1Promise, loadDefaultImg2Promise]).then(async ([result1, result2]) => {
        await fillerUpload.value?.handleStart(result1 as UploadRawFile)
        await fillerUpload.value?.handleStart(result2 as UploadRawFile)

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
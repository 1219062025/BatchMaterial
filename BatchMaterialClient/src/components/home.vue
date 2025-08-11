<template>
  <div class="w-[100vw] h-[100vh]">
    <section id="main">
      <el-card>
        <template #header>
          <div class="card-header">
            <span class="font-bold">填充背景</span>
          </div>
        </template>

        <el-upload :disabled="![3, 4].includes(coverType)" ref="fillUpload" v-model:file-list="fillList" action="#"
          :drag="true" :accept="[3].includes(coverType) ? 'image/*' : '.mp4'" :auto-upload="false"
          :show-file-list="true" list-type="picture-card" :limit="1" :on-exceed="handleExceedFill">
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽 或 <em>选择</em>
          </div>

          <template #file="{ file }">
            <div class="flex w-full">
              <video v-if="file.raw?.type.startsWith('video/')" class="el-upload-list__item-thumbnail flex-x-center"
                :src="file.url" />
              <img v-else-if="file.raw?.type.startsWith('image/')" class="el-upload-list__item-thumbnail flex-x-center"
                :src="file.url" />
              <span class="el-upload-list__item-actions">
                <span v-if="file.raw?.type.startsWith('video/')" class="el-upload-list__item-preview"
                  @click="handleVideoPreview(file)">
                  <el-icon>
                    <i-ep-ZoomIn />
                  </el-icon>
                </span>
                <span class="el-upload-list__item-delete" @click="handleFillRemove(file)">
                  <el-icon>
                    <i-ep-DeleteFilled />
                  </el-icon>
                </span>
              </span>
            </div>
          </template>
        </el-upload>

        <template #footer>
          <div class="flex items-center justify-between w-full">
            <div class="text-red-600 text-[12px]">16x9（填充图片背景）下只能填充图片类型的文件 / 16x9（填充视频背景）下只能填充MP4类型的文件</div>
          </div>
        </template>
      </el-card>
      <el-card class="mt-[40px]">
        <template #header>
          <div class="card-header">
            <span class="font-bold">待处理素材</span>
          </div>
        </template>

        <el-upload v-model:file-list="fileList" action="#" :drag="true" :multiple="true" :accept="'.mp4'"
          :auto-upload="false" :show-file-list="true" list-type="picture-card" :on-change="handleChange">
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽 或 <em>选择</em>
          </div>

          <template #file="{ file }">
            <div class="flex w-full">
              <video class="el-upload-list__item-thumbnail flex-x-center" :src="file.url" alt="" />
              <span class="el-upload-list__item-actions">
                <span class="el-upload-list__item-preview" @click="handleVideoPreview(file)">
                  <el-icon>
                    <i-ep-ZoomIn />
                  </el-icon>
                </span>
                <span class="el-upload-list__item-delete" @click="handleVideoRemove(file)">
                  <el-icon>
                    <i-ep-DeleteFilled />
                  </el-icon>
                </span>
              </span>
            </div>
          </template>
        </el-upload>

        <template #footer>
          <div class="mb-[20px] flex">
            <el-radio-group v-model="coverType" @change="handleChangeRadio">
              <el-radio-button label="1:1" :value="0" />
              <el-radio-button label="4:5（硬切）" :value="1" />
              <el-radio-button label="4:5（硬塞）" :value="2" />
              <el-radio-button label="16:9（填充图片背景）" :value="3" />
              <el-radio-button label="16:9（填充视频背景）" :value="4" />
            </el-radio-group>

            <div class="ml-[20px] flex">
              <span class="mr-[10px]">
                <el-input-number v-model="width" @change="handleChangeWidth" controls-position="right">
                  <template #suffix>
                    <span>px</span>
                  </template>
                </el-input-number>
              </span>
              <span>
                <el-input-number v-model="height" @change="handleChangeHeight" controls-position="right">
                  <template #suffix>
                    <span>px</span>
                  </template>
                </el-input-number>
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between w-full">
            <div class="text-red-600 text-[12px]">素材仅支持MP4视频</div>
            <el-button type="primary" @click="handleUpload">
              上传处理
              <el-icon class="el-icon--right">
                <i-ep-upload />
              </el-icon>
            </el-button>
          </div>
        </template>
      </el-card>

      <el-dialog v-model="dialogVisible" @close="handleCloseVideo">
        <video ref="dialogVideo" :src="dialogVideoUrl" controls></video>
      </el-dialog>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { UploadFilled } from '@element-plus/icons-vue'
import { genFileId, UploadFile, UploadProps, UploadRawFile, UploadUserFile } from 'element-plus';
import service from '@/utils/request';

/** 素材文件列表 */
const fileList = ref<UploadUserFile[]>([])
/** 填充背景 */
const fillList = ref<UploadUserFile[]>([])

const fillUpload = ref()

const dialogVideoUrl = ref('')
const dialogVisible = ref(false)
const dialogVideo = ref();

const coverType = ref(0)
const width = ref(1080)
const height = ref(1080)

const handleChangeRadio = () => {
  if (width.value) {
    handleChangeWidth()
  }
}
const handleChangeWidth = () => {
  if ([0].includes(coverType.value)) {
    height.value = width.value
  } else if ([1, 2].includes(coverType.value)) {
    height.value = (5 / 4) * width.value
  } else if ([3, 4].includes(coverType.value)) {
    height.value = (9 / 16) * width.value
  }
}
const handleChangeHeight = () => {
  if ([0].includes(coverType.value)) {
    width.value = height.value
  } else if ([1, 2].includes(coverType.value)) {
    width.value = (4 / 5) * height.value
  } else if ([3, 4].includes(coverType.value)) {
    width.value = (16 / 9) * height.value
  }
}

const handleVideoPreview = (file: UploadFile) => {
  dialogVideoUrl.value = file.url!
  dialogVisible.value = true
}

const handleFillRemove = (file: UploadFile) => {
  const index = fillList.value.findIndex(item => item.uid === file.uid);
  if (index !== -1) {
    fillList.value.splice(index, 1)
  }
  fillUpload.value!.clearFiles()
}

const handleVideoRemove = (file: UploadFile) => {
  const index = fileList.value.findIndex(item => item.uid === file.uid);
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

const handleExceedFill: UploadProps['onExceed'] = async (files) => {
  fillUpload.value!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  fillUpload.value!.handleStart(file)
};

const handleChange: UploadProps['onChange'] = async (file) => {
  const fileType = file.raw!.type;

  if (!(fileType === 'video/mp4')) {
    ElMessage.error('素材仅支持MP4视频');
    const index = fileList.value.findIndex(item => item.uid === file.uid);
    if (index !== -1) {
      fileList.value.splice(index, 1)
    }
    return false;
  }
};

const handleUpload = async () => {
  if (fileList.value.length === 0) {
    return ElMessage.warning('请先选择待处理素材')
  }

  const formData = new FormData();

  if ([3, 4].includes(coverType.value)) {
    const file = fillList.value[0];

    if (!file) {
      return ElMessage.warning('请先选择填充背景')
    }

    if (coverType.value === 3 && !file.raw?.type.startsWith('image/')) {
      return ElMessage.warning('16x9（填充图片背景）下只能填充图片类型的文件')
    }

    if (coverType.value === 4 && file.raw?.type !== 'video/mp4') {
      return ElMessage.warning('16x9（填充视频背景）下只能填充MP4类型的文件')
    }

    formData.append('fillFile', fillList.value[0].raw as File)
  }

  fileList.value.forEach(file => {
    formData.append('videos', file.raw as File);
  })

  formData.append('coverType', String(coverType.value))
  formData.append('width', String(width.value))
  formData.append('height', String(height.value))

  const loadingInstance = ElLoading.service({ fullscreen: true, text: 'FFMPEG处理中...' });
  const fileIds = await service.post('/ffmpeg-video', formData, { headers: { "Content-Type": 'multipart/form-data' } })
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

const handleCloseVideo = () => {
  (dialogVideo.value as HTMLVideoElement).pause();
}


</script>

<style>
/* .el-popper .el-popper__arrow {
  display: none;
} */
</style>

<style scoped lang="scss">
/* 使用::v-deep */
::v-deep(.el-upload-list .el-upload-dragger) {
  background-color: transparent;
  border: none;
  padding: 0;
}

::v-deep(.el-upload-list .el-upload) {
  display: flex !important;
}

#main {
  padding: 50px;
}

.preview-container {
  margin-top: 20px;
  border: 1px dashed #eee;
  padding: 10px;
  border-radius: 4px;
}

.preview {
  max-width: 100%;
  max-height: 400px;
  display: block;
  margin: 0 auto;
}
</style>

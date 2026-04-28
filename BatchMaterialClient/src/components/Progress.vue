<template>
  <div>
    <div v-if="message && message.data && message.data.jobs" v-for="(item) in message.data.jobs">
      <div class="font-bold line-clamp-1">{{ item.fileName
      }}</div>
      <el-progress :percentage="Number(item.progress.toFixed(0))" :show-text="false"
        :status="item.completed ? 'success' : ''" />
    </div>
    <div v-else>
      <span class="font-bold">等待服务端回调...</span>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { WSMessage } from '@/utils/constans';

/** 声明子组件的Prop */
defineProps<{
  message?: WSMessage
}>()

// props.message
</script>

<style scoped lang='scss'></style>
const readline = require('readline');
const event = require('./EventManager');
const { EVENT } = require('./Const');

/** 进度管理器 */
class ProgressManager {
  constructor() {
    this.jobs = new Map(); // 存储所有任务
    this.lastUpdate = 0; // 防止刷新过快
    this.totalDuration = 0; // 所有视频总时长
    this.completedDuration = 0; // 已完成的总时长

    event.on(EVENT.RESET_PROGRESS, this.reset.bind(this));
  }

  reset() {
    this.jobs.clear();
    this.lastUpdate = 0;
    this.totalDuration = 0;
    this.completedDuration = 0;
  }

  /** 添加新任务 */
  addJob(jobId, fileName) {
    if (!this.jobs.has(jobId)) {
      this.jobs.set(jobId, {
        id: jobId,
        fileName: fileName,
        totalDuration: 0,
        currentTime: 0,
        progress: 0,
        completed: false
      });
    } else {
      console.log('已经存在');
    }
  }

  /** 更新任务进度 */
  updateProgress(jobId, currentTime, totalDuration) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // 首次获取总时长
    if (job.totalDuration === 0 && totalDuration > 0) {
      job.totalDuration = totalDuration;
      this.totalDuration += totalDuration;
    }

    // 更新当前时间
    if (currentTime > job.currentTime) {
      // 减去旧的时间贡献，加上新的
      this.completedDuration -= job.currentTime;
      job.currentTime = currentTime;
      this.completedDuration += job.currentTime;

      // 计算进度百分比
      job.progress = job.totalDuration > 0 ? Math.min(100, (job.currentTime / job.totalDuration) * 100) : 0;
    }

    // console.log(`当前任务进度： ${job.progress}，视频时长：${job.totalDuration}，参数当前时间：${currentTime}，参数视频时长：${totalDuration}`);
    event.emit(EVENT.UPDATE_PROGRESS, this.buildProgressData());
    // this.refreshDisplay();
  }

  /** 标记任务完成 */
  completeJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job && !job.completed) {
      job.completed = true;
      job.progress = 100;
      // 确保总进度计算准确
      this.completedDuration += job.totalDuration - job.currentTime;
      job.currentTime = job.totalDuration;
      event.emit(EVENT.UPDATE_PROGRESS, this.buildProgressData());
      // this.refreshDisplay();
    }
  }

  /** 构建进度数据 */
  buildProgressData() {
    const totalProgress = this.totalDuration > 0 ? Math.min(100, (this.completedDuration / this.totalDuration) * 100) : 0;

    const progressData = {
      jobs: Array.from(this.jobs.values()).map(job => ({
        id: job.id,
        fileName: job.fileName,
        progress: job.progress,
        completed: job.completed
      })),
      totalProgress: totalProgress
    };
    return progressData;
  }

  /** 将进度打印到控制台显示 */
  refreshDisplay() {
    // 清除控制台并移动光标到顶部
    // readline.cursorTo(process.stdout, 0, 0);
    // readline.clearScreenDown(process.stdout);

    const totalProgress = this.totalDuration > 0 ? Math.min(100, (this.completedDuration / this.totalDuration) * 100) : 0;

    // 打印所有任务进度
    let output = '';
    this.jobs.forEach(job => {
      output += `${job.fileName} 进度: ${job.progress.toFixed(1)}%\n`;
    });

    // 添加总进度
    output += `\n总进度: ${totalProgress.toFixed(1)}%\n`;

    // process.stdout.write(output);
    console.log(output);
  }
}

module.exports = new ProgressManager();

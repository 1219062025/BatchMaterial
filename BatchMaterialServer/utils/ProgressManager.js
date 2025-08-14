const { spawn } = require('child_process');
const readline = require('readline');

/** 进度管理器 */
class ProgressManager {
  constructor() {
    this.jobs = new Map(); // 存储所有任务
    this.lastUpdate = 0; // 防止刷新过快
    this.totalDuration = 0; // 所有视频总时长
    this.completedDuration = 0; // 已完成的总时长
  }

  /** 添加新任务 */
  addJob(jobId, fileName) {
    this.jobs.set(jobId, {
      id: jobId,
      fileName: fileName,
      totalDuration: 0,
      currentTime: 0,
      progress: 0,
      completed: false
    });
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

    this.refreshDisplay();
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
      this.refreshDisplay();
    }
  }

  /** 刷新显示 */
  refreshDisplay() {
    // 限制刷新频率（每秒最多5次）
    const now = Date.now();
    if (now - this.lastUpdate < 200) return;
    this.lastUpdate = now;

    // 清除控制台并移动光标到顶部
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);

    // 计算总进度
    const totalProgress = this.totalDuration > 0 ? Math.min(100, (this.completedDuration / this.totalDuration) * 100) : 0;

    // 打印所有任务进度
    let output = '';
    this.jobs.forEach(job => {
      output += `${job.fileName} 进度: ${job.progress.toFixed(1)}%\n`;
    });

    // 添加总进度
    output += `\n总进度: ${totalProgress.toFixed(1)}%\n`;

    process.stdout.write(output);
  }
}

module.exports = new ProgressManager();

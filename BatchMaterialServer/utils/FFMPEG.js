const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { spawn, spawnSync } = require('child_process');
const { FFMPEG_DIR, OUTPUT_DIR, STATE_FILE, COVER_TYPE, FFPROBE_DIR, COVER_TITLE } = require('./Const');
const persistentFileManager = require('./PersistentFileManager');
const progressManager = require('./ProgressManager');

class FFMPEG {
  constructor() {}

  convert(file, options) {
    return new Promise((resolve, reject) => {
      try {
        const suffix = ['-1X1', '-4X5', '-4X5', '-9X16', '-16X9', '-16X9', ''][options.coverType];
        /** 素材文件临时路径 */
        const filePath = file.path;
        /** 填充背景文件临时路径 */
        const fillPath = options.filler ? options.filler.path : '';
        const splitName = file.originalname.split('.');
        /** 输出文件名 */
        const outputName = `${splitName[0]}${suffix}.${splitName[1]}`;
        /** 输出文件路径 */
        const outputPath = path.join(OUTPUT_DIR, outputName);

        let child;

        switch (options.coverType) {
          case COVER_TYPE.COVER_1x1:
            child = this.getCover1x1(filePath, outputPath, options);
            break;
          case COVER_TYPE.COVER_4x5_centercrop:
            child = this.getCoverCentercrop4x5(filePath, outputPath, options);
            break;
          case COVER_TYPE.COVER_4x5_putcenter:
            child = this.getCoverPutcenter4x5(filePath, outputPath, options);
            break;
          case COVER_TYPE.COVER_9x16:
            child = this.getCover9x16(filePath, outputPath, options);
            break;
          case COVER_TYPE.COVER_16x9_picbak:
            child = this.getCoverPicbak16x9(fillPath, filePath, outputPath, options);
            break;
          case COVER_TYPE.COVER_16x9_videobak:
            child = this.getCoverVideoBak16x9(fillPath, filePath, outputPath, options);
            break;
          case COVER_TYPE.COVER_ADD_AUDIO:
            child = this.getAddAudio(filePath, outputPath, options);
            break;
        }

        const jobId = uuidv4();
        progressManager.addJob(jobId, file.originalname);

        // 收集ffmpeg的输出信息，判断进度
        child.stderr.on('data', data => {
          try {
            const output = data.toString();

            // 解析总时长
            if (!progressManager.jobs.get(jobId).totalDuration) {
              const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
              if (durationMatch) {
                const [, h, m, s] = durationMatch;
                const totalSec = parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
                // console.log(`总时长：${totalSec}，h：${h}, m：${m}, s：${s}`);
                progressManager.updateProgress(jobId, 0, totalSec);
              }
            }

            // 解析当前时间
            const timeMatch = output.match(/time=(\d+):(\d+):(\d+\.\d+)/);
            if (timeMatch) {
              const [, h, m, s] = timeMatch;
              const currentSec = parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
              progressManager.updateProgress(jobId, currentSec);
              // console.log(`当前时间：${currentSec}，h：${h}, m：${m}, s：${s}`);
            }
          } catch (err) {
            reject({ success: false, message: `解析文件"${file.originalname}"的处理进度时发生错误，错误信息：${err.message}` });
          }
        });

        // 处理完成
        child.on('close', code => {
          if (code === 0) {
            progressManager.completeJob(jobId);
            const fileId = persistentFileManager.addFile(outputName, outputPath);
            resolve(fileId);
          } else {
            reject({ success: false, message: `FFmpeg进行类型${COVER_TITLE[options.coverType]}的处理时发生了错误，文件名："${file.originalname}"，退出码：${code}` });
          }
        });

        // 发生错误
        child.on('error', err => {
          progressManager.jobs.delete(jobId);
          reject({ success: false, message: `${err}` });
        });
      } catch (err) {
        reject({ success: false, message: `处理文件"${file.originalname}"时发生错误，错误信息：${err.message}` });
      }
    });
  }

  /** convert_videos_1x1 */
  getCover1x1(filePath, outputPath, options) {
    const { width, height, startCut, endCut, keepDuration } = options;
    // 首先获取视频时长以计算保留时长
    const args0 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result0 = spawnSync(FFPROBE_DIR, args0);
    const totalDuration = parseFloat(result0.stdout.toString().trim());
    let durationToKeep = keepDuration > 0 ? keepDuration : totalDuration - startCut - endCut;
    let startTime = keepDuration > 0 ? 0 : startCut;

    const args = [
      '-y',
      '-ss',
      startTime.toString(), // 跳过前x秒
      '-i',
      filePath,
      '-t',
      durationToKeep.toString(), // 保留的时长
      '-filter_complex',
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,boxblur=20:10[bg]; \
   [0:v]scale=-2:${width}:force_original_aspect_ratio=decrease[fg]; \
   [bg][fg]overlay=(W-w)/2:(H-h)/2,crop=${width}:${height}`,
      '-map',
      '0:a',
      '-c:a',
      'copy',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      outputPath
    ];

    const child = spawn(FFMPEG_DIR, args);
    return child;
  }

  /** convert_videos_4x5_centercrop */
  getCoverCentercrop4x5(filePath, outputPath, options) {
    const { width, height, startCut, endCut, keepDuration } = options;
    // 获取视频时长
    const args0 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result0 = spawnSync(FFPROBE_DIR, args0);
    const totalDuration = parseFloat(result0.stdout.toString().trim());
    let durationToKeep = keepDuration > 0 ? keepDuration : totalDuration - startCut - endCut;
    let startTime = keepDuration > 0 ? 0 : startCut;

    const args = ['-y', '-ss', startTime.toString(), '-i', filePath, '-t', durationToKeep.toString(), '-vf', `crop=720:900:0:(in_h-900)/2,scale=${width}:${height}`, '-c:a', 'copy', outputPath];

    const child = spawn(FFMPEG_DIR, args);
    return child;
  }

  /** convert_videos_4x5_putcenter */
  getCoverPutcenter4x5(filePath, outputPath, options) {
    const { width, height, startCut, endCut, keepDuration } = options;
    // 获取视频时长
    const args0 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result0 = spawnSync(FFPROBE_DIR, args0);
    const totalDuration = parseFloat(result0.stdout.toString().trim());
    let durationToKeep = keepDuration > 0 ? keepDuration : totalDuration - startCut - endCut;
    let startTime = keepDuration > 0 ? 0 : startCut;

    const args = [
      '-y',
      '-ss',
      startTime.toString(),
      '-i',
      filePath,
      '-t',
      durationToKeep.toString(),
      '-filter_complex',
      `[0:v]scale=-1:1000:force_original_aspect_ratio=decrease[fg];[0:v]scale=${width}:${height},boxblur=20:10[bg];[bg][fg]overlay=(W-w)/2:(H-h)/2`,
      '-c:a',
      'copy',
      outputPath
    ];

    const child = spawn(FFMPEG_DIR, args);
    return child;
  }

  /** convert_videos_9x16_videobak */
  getCover9x16(filePath, outputPath, options) {
    const { width, height, startCut, endCut, keepDuration } = options;
    // 获取视频时长
    const args0 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result0 = spawnSync(FFPROBE_DIR, args0);
    const totalDuration = parseFloat(result0.stdout.toString().trim());
    let durationToKeep = keepDuration > 0 ? keepDuration : totalDuration - startCut - endCut;
    let startTime = keepDuration > 0 ? 0 : startCut;

    const args = [
      '-y',
      '-ss',
      startTime.toString(),
      '-i',
      filePath,
      '-t',
      durationToKeep.toString(),
      '-filter_complex',
      `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,boxblur=20:10[bg]; \
   [0:v]scale=-2:${height}:force_original_aspect_ratio=decrease[fg]; \
   [bg][fg]overlay=(W-w)/2:(H-h)/2,crop=${width}:${height}`,
      '-map',
      '0:a',
      '-c:a',
      'copy',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      outputPath
    ];

    const child = spawn(FFMPEG_DIR, args);
    return child;
  }

  /** convert_videos_16x9_picbak */
  getCoverPicbak16x9(bakPath, filePath, outputPath, options) {
    const { width, height, startCut, endCut, keepDuration, useFiller } = options;
    // 获取视频时长
    const args0 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result0 = spawnSync(FFPROBE_DIR, args0);
    const totalDuration = parseFloat(result0.stdout.toString().trim());
    let durationToKeep = keepDuration > 0 ? keepDuration : totalDuration - startCut - endCut;
    let startTime = keepDuration > 0 ? 0 : startCut;

    let args;
    if (useFiller) {
      // 使用填充背景
      args = [
        '-y',
        '-i',
        bakPath,
        '-ss',
        startTime.toString(),
        '-i',
        filePath,
        '-t',
        durationToKeep.toString(),
        '-filter_complex',
        '[1:v]scale=-1:720:force_original_aspect_ratio=decrease[vid];[0:v][vid]overlay=(W-w)/2:(H-h)/2',
        '-c:a',
        'copy',
        outputPath
      ];
    } else {
      // 不使用填充背景，直接缩放视频
      args = [
        '-y',
        '-ss',
        startTime.toString(),
        '-i',
        filePath,
        '-t',
        durationToKeep.toString(),
        '-filter_complex',
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,boxblur=20:10[bg];[0:v]scale=-2:${height}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,crop=${width}:${height}`,
        '-map',
        '0:v',
        '-map',
        '0:a',
        '-c:a',
        'copy',
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        outputPath
      ];
    }

    const child = spawn(FFMPEG_DIR, args);
    return child;
  }

  /** convert_videos_16x9_videobak */
  getCoverVideoBak16x9(videoPath, filePath, outputPath, options) {
    const { width, height, startCut, endCut, keepDuration } = options;
    // 获取视频时长
    const args0 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result0 = spawnSync(FFPROBE_DIR, args0);
    const totalDuration = parseFloat(result0.stdout.toString().trim());
    let durationToKeep = keepDuration > 0 ? keepDuration : totalDuration - startCut - endCut;
    let startTime = keepDuration > 0 ? 0 : startCut;

    // 获取比特率
    const args1 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=bit_rate', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result1 = spawnSync(FFPROBE_DIR, args1);
    let bitrate = result1.stdout.toString().trim();

    // 设置默认比特率
    if (!bitrate || bitrate === 'N/A') {
      bitrate = '2500000';
    }

    const args = [
      '-y',
      '-stream_loop',
      '-1',
      '-i',
      videoPath,
      '-ss',
      startTime.toString(),
      '-i',
      filePath,
      '-t',
      durationToKeep.toString(),
      '-filter_complex',
      `[1:v]scale=-2:720:force_original_aspect_ratio=decrease[fg];[0:v][fg]overlay=(W-w)/2:(H-h)/2[v]`,
      '-map',
      '[v]',
      '-map',
      '1:a',
      '-c:v',
      'libx264',
      '-b:v',
      bitrate,
      '-c:a',
      'aac',
      outputPath
    ];

    const child = spawn(FFMPEG_DIR, args);
    return child;
  }

  /** 音轨混流 — 将音轨与视频音频并行混合 */
  getAddAudio(filePath, outputPath, options) {
    const { startCut, endCut, keepDuration, audioTracks } = options;

    // 获取视频时长
    const args0 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result0 = spawnSync(FFPROBE_DIR, args0);
    const totalDuration = parseFloat(result0.stdout.toString().trim());
    let durationToKeep = keepDuration > 0 ? keepDuration : totalDuration - startCut - endCut;
    let startTime = keepDuration > 0 ? 0 : startCut;

    // 构建 FFmpeg 输入和 filter_complex
    const inputs = ['-y', '-ss', startTime.toString(), '-i', filePath, '-t', durationToKeep.toString()];
    const filterParts = [];
    const mixInputs = ['[0:a]'];

    audioTracks.forEach((track, i) => {
      const inputIdx = i + 1;
      inputs.push('-i', track.file.path);

      const delayMs = Math.round(track.startAt * 1000);
      const label = `[a${i}]`;

      // 始终使用 adelay 滤镜（即使延迟为0也有效）
      filterParts.push(`[${inputIdx}:a]adelay=${delayMs}|${delayMs}${label}`);
      mixInputs.push(label);
    });

    const totalInputs = 1 + audioTracks.length; // 原始音频 + 音轨数
    filterParts.push(`${mixInputs.join('')}amix=inputs=${totalInputs}:duration=first:dropout_transition=2[a]`);

    const filterComplex = filterParts.join(';');

    const args = [...inputs, '-filter_complex', filterComplex, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', outputPath];

    const child = spawn(FFMPEG_DIR, args);
    return child;
  }
}
module.exports = new FFMPEG();

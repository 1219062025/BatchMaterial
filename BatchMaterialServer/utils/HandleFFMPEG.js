const { FFMPEG_DIR, OUTPUT_DIR, STATE_FILE, COVER_TYPE, FFPROBE_DIR } = require('../utils/Const');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const PersistentFileManager = require('../utils/PersistentFileManager');

const fileManager = new PersistentFileManager(STATE_FILE);

class HandleFFMPEG {
  constructor() {}

  convert(file, options) {
    return new Promise((resolve, reject) => {
      const suffix = ['-1X1', '-4X5', '-4X5', '-16X9', '-16X9'][options.coverType];
      const splitName = file.originalname.split('.');

      /** 素材文件临时路径 */
      const filePath = file.path;
      /** 填充背景文件临时路径 */
      const fillPath = options.fillFile.path;

      /** 输出文件名 */
      const outputName = `${splitName[0]}${suffix}.${splitName[1]}`;
      /** 输出文件路径 */
      const outputPath = path.join(OUTPUT_DIR, outputName);

      let child;

      switch (options.coverType) {
        case COVER_TYPE.COVER_1x1:
          child = this.getCover1x1(filePath, outputPath, Number(options.width), Number(options.height));
          break;
        case COVER_TYPE.COVER_4x5_centercrop:
          child = this.getCoverCentercrop4x5(filePath, outputPath, Number(options.width), Number(options.height));
          break;
        case COVER_TYPE.COVER_4x5_putcenter:
          child = this.getCoverPutcenter4x5(filePath, outputPath, Number(options.width), Number(options.height));
          break;
        case COVER_TYPE.COVER_16x9_picbak:
          child = this.getCoverPicbak16x9(fillPath, filePath, outputPath, Number(options.width), Number(options.height));
          break;
        case COVER_TYPE.COVER_16x9_videobak:
          child = this.getCoverVideoBak16x9(fillPath, filePath, outputPath, Number(options.width), Number(options.height));
          break;
      }

      // 收集标准输出
      child.stdout.on('data', data => {
        if (!output) {
          var output = '';
        }
        output += `${data.toString()}\n`;
      });

      // 收集错误输出
      child.stderr.on('data', data => {
        if (!errorOutput) {
          var errorOutput = '';
        }
        errorOutput += `${data.toString()}\n`;
      });

      // 处理完成
      child.on('close', code => {
        const fileId = fileManager.addFile(outputName, outputPath);
        resolve(fileId);
      });

      // 错误处理
      child.on('error', err => {
        reject(err);
      });
    });
  }

  /** convert_videos_1x1 */
  getCover1x1(filePath, outputPath, width, height) {
    const args = [
      '-y',
      '-i',
      filePath,
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
      '-shortest',
      outputPath
    ];

    const child = spawn(FFMPEG_DIR, args);

    return child;
  }

  /** convert_videos_4x5_centercrop */
  getCoverCentercrop4x5(filePath, outputPath, width, height) {
    const args = ['-y', '-i', filePath, '-vf', `crop=720:900:0:(in_h-900)/2,scale=${width}:${height}`, '-c:a', 'copy', outputPath];

    const child = spawn(FFMPEG_DIR, args);

    return child;
  }

  /** convert_videos_4x5_putcenter */
  getCoverPutcenter4x5(filePath, outputPath, width, height) {
    const args = ['-y', '-i', filePath, '-filter_complex', `[0:v]scale=-1:1000:force_original_aspect_ratio=decrease[fg];[0:v]scale=${width}:${height},boxblur=20:10[bg];[bg][fg]overlay=(W-w)/2:(H-h)/2`, '-c:a', 'copy', outputPath];

    const child = spawn(FFMPEG_DIR, args);

    return child;
  }

  /** convert_videos_16x9_picbak */
  getCoverPicbak16x9(bakPath, filePath, outputPath, width, height) {
    const args = ['-y', '-i', bakPath, '-i', filePath, '-filter_complex', '[1:v]scale=-1:720:force_original_aspect_ratio=decrease[vid];[0:v][vid]overlay=(W-w)/2:(H-h)/2', '-c:a', 'copy', outputPath];

    const child = spawn(FFMPEG_DIR, args);

    return child;
  }

  /** convert_videos_16x9_videobak */
  getCoverVideoBak16x9(videoPath, filePath, outputPath, width, height) {
    // 获取视频时长
    const args0 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result0 = spawnSync(FFPROBE_DIR, args0);
    const duration = parseFloat(result0.stdout.toString().trim());

    // 获取比特率
    const args1 = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=bit_rate', '-of', 'default=noprint_wrappers=1:nokey=1', filePath];
    const result1 = spawnSync(FFPROBE_DIR, args1);
    let bitrate = result1.stdout.toString().trim();

    // 设置默认比特率
    if (!bitrate || bitrate === 'N/A') {
      bitrate = '2500000';
    }

    const args = [
      '-y', // 覆盖输出文件
      '-stream_loop',
      '-1', // 无限循环背景视频
      '-i',
      videoPath, // 背景视频路径
      '-i',
      filePath, // 输入视频路径
      '-t',
      duration.toString(), // 设置输出时长
      '-filter_complex', // 复杂滤镜
      `[1:v]scale=-2:720:force_original_aspect_ratio=decrease[fg];[0:v][fg]overlay=(W-w)/2:(H-h)/2[v]`,
      '-map',
      '[v]', // 映射视频流
      '-map',
      '1:a', // 映射音频流
      '-c:v',
      'libx264', // 视频编码器
      '-b:v',
      bitrate, // 视频比特率
      '-c:a',
      'aac', // 音频编码器
      '-shortest', // 以最短流结束
      outputPath // 输出路径
    ];

    const child = spawn(FFMPEG_DIR, args);

    return child;
  }
}

module.exports = new HandleFFMPEG();

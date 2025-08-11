const path = require('path');

const ffmpeg_dir = process.env.IN_PKG === '1' ? path.join(process.cwd(), './ffmpeg/bin/ffmpeg.exe') : path.join(__dirname, '../public/ffmpeg/bin/ffmpeg.exe');

const ffprobe_dir = process.env.IN_PKG === '1' ? path.join(process.cwd(), './ffmpeg/bin/ffprobe.exe') : path.join(__dirname, '../public/ffmpeg/bin/ffprobe.exe');

const temp_dir = process.env.IN_PKG === '1' ? path.join(process.cwd(), './temp') : path.join(__dirname, '../temp');

const output_dir = process.env.IN_PKG === '1' ? path.join(process.cwd(), './output') : path.join(__dirname, '../output');

const state_dir = process.env.IN_PKG === '1' ? path.join(process.cwd(), './fileState.json') : path.join(__dirname, '../fileState.json');

const Const = {
  /** ffmpeg目录 */
  FFMPEG_DIR: ffmpeg_dir,
  /** ffprobe目录 */
  FFPROBE_DIR: ffprobe_dir,
  /** 临时处理目录 */
  TEMP_DIR: temp_dir,
  /** 文件输出目录 */
  OUTPUT_DIR: output_dir,
  /** 文件记录目录 */
  STATE_FILE: state_dir,
  /** 转换类型 */
  COVER_TYPE: {
    COVER_1x1: 0,
    COVER_4x5_centercrop: 1,
    COVER_4x5_putcenter: 2,
    COVER_16x9_picbak: 3,
    COVER_16x9_videobak: 4
  }
};

module.exports = Const;

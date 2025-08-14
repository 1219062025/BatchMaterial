import { UploadUserFile } from 'element-plus';

export enum COVER_TYPE {
  COVER_1x1,
  COVER_4x5_centercrop,
  COVER_4x5_putcenter,
  COVER_16x9_picbak,
  COVER_16x9_videobak
}

export enum CARD_TITLE {
  '1:1',
  '4:5（硬切）',
  '4:5（硬塞）',
  '16:9（填充图片背景）',
  '16:9（填充视频背景）'
}

export type QueueInfo = {
  /** 队列的转换类型 */
  coverType: COVER_TYPE;
  /** 队列的文件列表 */
  fileList: UploadUserFile[];
  /** 文件处理后的宽度 */
  width: number;
  /** 文件处理后的高度 */
  height: number;
  /** 队列的填充物背景文件（如果有的话） */
  filler?: UploadUserFile;
};

export enum PIC_BAK_TYPE {
  DEFAULT_IMG1,
  DEFAULT_IMG2,
  CUSTOM
}

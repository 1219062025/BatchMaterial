import { UploadUserFile } from 'element-plus';

export enum COVER_TYPE {
  COVER_1x1,
  COVER_4x5_centercrop,
  COVER_4x5_putcenter,
  COVER_9x16,
  COVER_16x9_picbak,
  COVER_16x9_videobak,
  COVER_ADD_AUDIO
}

export enum CARD_TITLE {
  '1:1',
  '4:5（硬切）',
  '4:5（硬塞）',
  '9:16',
  '16:9（填充图片背景）',
  '16:9（填充视频背景）',
  '音轨混流'
}

export type AudioTrack = {
  /** 音轨文件 */
  file: UploadUserFile;
  /** 音轨插入起始时间（秒） */
  startAt: number;
};

export type QueueInfo = {
  /** 队列的转换类型 */
  coverType: COVER_TYPE;
  /** 队列的文件列表 */
  fileList: UploadUserFile[];
  /** 文件处理后的宽度 */
  width: number;
  /** 文件处理后的高度 */
  height: number;
  /** 裁剪文件前startCut秒 */
  startCut: number;
  /** 裁剪文件后endCut秒 */
  endCut: number;
  /** 队列的填充物背景文件（如果有的话） */
  filler?: UploadUserFile;
  /** 是否启用填充背景（仅16:9图片背景队列有效） */
  useFiller?: boolean;
  /** 保留前keepDuration秒（与裁剪功能互斥） */
  keepDuration?: number;
  /** 音轨列表（仅音轨混流队列） */
  audioTracks?: AudioTrack[];
};

export type WSMessage = {
  /** 消息类型 */
  type: WS_MESSAGE;
  /** 连接id */
  connectionId: string;
  /** 数据 */
  data: any;
};

export enum PIC_BAK_TYPE {
  DEFAULT_IMG1,
  DEFAULT_IMG2,
  CUSTOM
}

export enum WS_MESSAGE {
  /** 连接成功 */
  CONNECTION_SUCCESS,
  /** 更新进度 */
  UPDATE_PROGRESS
}

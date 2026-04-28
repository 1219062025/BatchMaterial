const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const { TEMP_DIR, OUTPUT_DIR, STATE_FILE, COVER_TYPE, EVENT, WS_MESSAGE } = require('../utils/Const');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const persistentFileManager = require('../utils/PersistentFileManager');
const FFMPEG = require('../utils/FFMPEG');
const webSocketManager = require('../utils/WebSocketManager');
const event = require('../utils/EventManager');

[(TEMP_DIR, OUTPUT_DIR)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 创建多文件上传处理器
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TEMP_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
  })
});

router.post('/cover', upload.any(), async (req, res, next) => {
  try {
    // 实时发送任务处理进度
    const connectionId = req.body.connectionId;
    event.on(EVENT.UPDATE_PROGRESS, progressData => {
      const ws = webSocketManager.activeConnections.get(connectionId);
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: WS_MESSAGE.UPDATE_PROGRESS,
            connectionId,
            data: progressData
          })
        );
      }
    });

    // 解析元数据
    const meta = JSON.parse(req.body.meta);

    // 重组队列数据
    const queueData = [];
    meta.forEach((item, index) => {
      const queueItem = {
        coverType: item.coverType,
        fileList: [],
        filler: null,
        width: item.width,
        height: item.height,
        startCut: item.startCut,
        endCut: item.endCut,
        useFiller: item.useFiller !== undefined ? item.useFiller : true,
        keepDuration: item.keepDuration || 0,
        audioTracks: item.audioTracks || []
      };

      // 提取 fileList 文件
      for (let i = 0; i < item.fileCount; i++) {
        const field = `${index}.fileList.${i}`;
        const file = req.files.find(f => f.fieldname === field);
        if (file) queueItem.fileList.push(file);
      }

      // 提取 filler 文件
      if (item.hasFiller) {
        const fillerFile = req.files.find(f => f.fieldname === `${index}.filler`);
        if (fillerFile) queueItem.filler = fillerFile;
      }

      // 提取 audioTrack 文件
      if (item.audioTracks && item.audioTracks.length > 0) {
        item.audioTracks.forEach((track, audioIndex) => {
          const field = `${index}.audioTrack.${audioIndex}`;
          const audioFile = req.files.find(f => f.fieldname === field);
          if (audioFile) queueItem.audioTracks[audioIndex].file = audioFile;
        });
      }

      queueData.push(queueItem);
    });

    // 处理 queueData
    // 示例：queueData[0].fileList[0] 访问文件内容
    if (queueData.every(data => data.fileList.length === 0)) {
      return res.status(400).json({ success: false, message: '未检测到需要处理的文件' });
    }

    const results = [];

    // 循环每个队列
    for (let i = 0; i < queueData.length; i++) {
      const queue = queueData[i];

      // 循环队列中每个需要处理的文件（如果有的话）
      if (queue.fileList.length !== 0) {
        for (let j = 0; j < queue.fileList.length; j++) {
          const file = queue.fileList[j];
          file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

          const handlePromise = FFMPEG.convert(file, {
            coverType: queue.coverType,
            filler: queue.filler,
            width: Number(queue.width),
            height: Number(queue.height),
            startCut: Number(queue.startCut),
            endCut: Number(queue.endCut),
            useFiller: queue.useFiller,
            keepDuration: Number(queue.keepDuration),
            audioTracks: queue.audioTracks
          });

          results.push(handlePromise);
        }
      }
    }

    // 处理所有任务
    await Promise.all(results)
      .then(values => {
        res.status(200).json({ success: true, message: values });
      })
      .catch(reason => {
        res.status(500).json({ success: false, message: `${reason.message}` });
      })
      .finally(async () => {
        await fs.emptyDir(TEMP_DIR);
        event.emit(EVENT.RESET_PROGRESS);
      });
  } catch (err) {
    res.status(500).json({ success: false, message: `转换视频发生错误：${err.message}` });
  }
});

router.post('/download-video', async (req, res, next) => {
  const { fileIds } = req.body;

  res.setHeader('Content-Type', 'application/zip;charset=utf8');
  res.setHeader('Content-Disposition', 'attachment; filename="processed-videos.zip"');

  const archive = archiver('zip', {
    zlib: { level: 9 } // 最高压缩
  });

  archive.pipe(res);

  // 添加每个文件到压缩包
  for (const fileId of fileIds) {
    const fileInfo = persistentFileManager.state.files[fileId];
    archive.append(fs.createReadStream(fileInfo.outputPath), { name: Buffer.from(fileInfo.filename, 'utf8').toString() });
  }

  archive.on('error', function (err) {
    res.status(500).json({ success: false, message: `下载压缩包错误：${err}` });
  });

  archive.on('close', function (err) {
    persistentFileManager.cleanupCache();
  });

  archive.finalize();
});

module.exports = router;

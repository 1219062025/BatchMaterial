const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const archiver = require('archiver');
const { FFMPEG_DIR, TEMP_DIR, OUTPUT_DIR, STATE_FILE, COVER_TYPE } = require('../utils/Const');

const PersistentFileManager = require('../utils/PersistentFileManager');
const FFMPEG = require('../utils/FFMPEG');

[(TEMP_DIR, OUTPUT_DIR)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const fileManager = new PersistentFileManager(STATE_FILE);

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
    // 1. 解析元数据
    const meta = JSON.parse(req.body.meta);

    // 2. 重组队列数据
    const queueData = [];
    meta.forEach((item, index) => {
      const queueItem = {
        coverType: item.coverType,
        fileList: [],
        filler: null,
        width: item.width,
        height: item.height
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

      queueData.push(queueItem);
    });

    // 3. 处理 queueData（你的业务逻辑）
    // 示例：queueData[0].fileList[0].buffer 访问文件内容
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
            width: queue.width,
            height: queue.height
          });

          results.push(handlePromise);
        }
      }
    }

    await Promise.all(results)
      .then(values => {
        return res.status(200).json(values);
      })
      .catch(reason => {
        return res.status(500).json({ success: false, message: `FFMPEG处理失败：${reason.message}` });
      })
      .finally(async () => {
        await fs.emptyDir(TEMP_DIR);
      });
  } catch (err) {
    res.status(500).json({ success: false, message: `解析失败：${err}` });
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
    const fileInfo = fileManager.state.files[fileId];
    archive.append(fs.createReadStream(fileInfo.outputPath), { name: Buffer.from(fileInfo.filename, 'utf8').toString() });
  }

  archive.on('error', function (err) {
    console.log(err);
  });

  archive.on('close', function (err) {
    fileManager.cleanupCache();
  });

  archive.finalize();
});

module.exports = router;

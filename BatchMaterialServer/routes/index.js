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
const HandleFFMPEG = require('../utils/HandleFFMPEG');

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

router.post('/ffmpeg-video', async (req, res, next) => {
  // 确保ffmpeg.exe存在
  if (!fs.existsSync(FFMPEG_DIR)) return res.status(500).json({ message: 'ffmpeg.exe不存在' });

  upload.fields([{ name: 'videos' }, { name: 'fillFile' }])(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: '文件上传失败' });
    }

    if (!req.files['videos'].length) {
      return res.status(400).json({ message: '未接收到任何文件' });
    }

    const results = [];
    const fillFile = (req.files.fillFile && req.files.fillFile[0]) || {};
    const coverType = req.body.coverType;

    req.files['videos'].forEach(async file => {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
      results.push(HandleFFMPEG.convert(file, { coverType: Number(coverType), fillFile, width: req.body.width, height: req.body.height }));
    });

    await Promise.all(results)
      .then(values => {
        return res.status(200).json(values);
      })
      .catch(reason => {
        return res.status(500).send(reason);
      })
      .finally(async () => {
        await fs.emptyDir(TEMP_DIR);
      });
  });
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

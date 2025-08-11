const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const { OUTPUT_DIR, TEMP_DIR } = require('./Const');

// 文件管理器类 - 使用文件系统持久化状态
class PersistentFileManager {
  constructor(storagePath) {
    if (!PersistentFileManager.instance) {
      this.storagePath = storagePath;
      this.state = { files: {} };
      // 加载持久化状态
      this.loadState();
      this.cleanupCache();
      PersistentFileManager.instance = this;
    }

    return PersistentFileManager.instance;
  }

  /** 加载文件记录 */
  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.state = JSON.parse(data);
        console.log(`已加载文件状态，共 ${Object.keys(this.state.files).length} 个文件记录`);
      }
    } catch (err) {
      console.error('加载文件状态失败:', err);
    }
  }

  /** 添加新文件记录 */
  addFile(filename, outputPath) {
    const id = uuidv4();

    const date = new Date(Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    this.state.files[id] = {
      filename,
      outputPath,
      createdAt: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
      downloaded: false
    };
    this.saveState();
    return id;
  }

  /** 保存状态到文件记录 */
  saveState() {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.state, null, 2));
    } catch (err) {
      console.error('保存文件状态失败:', err);
    }
  }

  /** 清空文件记录 */
  cleanState() {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify({ files: {} }, null, 2));
    } catch (err) {
      console.error('清空文件状态失败:', err);
    }
  }

  /** 清理文件 */
  cleanFile(id) {
    if (!this.state.files[id]) return false;

    const { outputPath } = this.state.files[id];
    let allCleaned = true;

    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`已删除输出文件: ${outputPath}`);
      }
    } catch (err) {
      console.error(`删除输出文件失败: ${outputPath}`, err);
      allCleaned = false;
    }

    // 从状态中移除
    delete this.state.files[id];
    this.saveState();

    return allCleaned;
  }

  // 启动时清理所有文件
  async cleanupCache() {
    console.log('启动清理...');
    await fs.emptyDir(OUTPUT_DIR);
    await fs.emptyDir(TEMP_DIR);
    this.cleanState();
  }
}

module.exports = PersistentFileManager;

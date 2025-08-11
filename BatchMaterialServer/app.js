const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const open = require('open');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname + '\\.env') });

const indexRouter = require('./routes/index');

// 全局挂载中间件
app.use(cors()); // 处理跨域
app.use(bodyParser.json()); // 解析传入请求的JSON格式（application/json）的主体，并将其存储在req.body对象中以便后续处理
app.use(bodyParser.urlencoded({ extended: false })); // 解析传入请求的URL编码（application/x-www-form-urlencoded）数据，并将其转换为JavaScript对象存储在req.body中，extended成false时值为数组或字符串，为true时值可为任意类型
app.use(cookieParser()); // 解析cookie头，将其转化为对象存储在req.cookies属性中

const staticPath = path.join(__dirname, 'public', 'dist');

app.use(express.static(staticPath));

app.use('/', indexRouter);

app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('页面未找到');
  }
});

// 错误处理中间件（需要实际发送响应）
app.use(function (err, req, res, next) {
  // 设置响应状态码
  res.status(err.status || 500);

  // 发送错误响应
  res.json({
    error: {
      message: err.message
    }
  });
});

const port = 3007;
app.listen(port, () => {
  console.log(`当前环境为${process.env.IN_PKG === '1' ? 'EXE执行环境' : '开发环境'} ，浏览器地址为：http://127.0.0.1:${port}`);

  if (process.env.IN_PKG === '1') {
    console.log('请稍等，打开默认浏览器中...');
    open(`http://127.0.0.1:${port}`);
  }
});

module.exports = app;



# 批量素材处理工具

- BatchMaterialClient：vue3 + ts 前端
- BatchMaterialServer：Nodejs 后端

### 1.安装依赖
  分别去BatchMaterialClient、BatchMaterialServer文件夹下：
```javascript
	npm install
```

### 2.启动运行与打包成exe
- 启动：BatchMaterialClient目录下运行npm run dev，BatchMaterialServer目录下运行npm run dev即可将前后端都启动；
- 运行在开发环境/EXE环境：设置BatchMaterialServer/.env文件下IN_PKG的值为0时在开发环境下运行后端；设置BatchMaterialServer/.env文件下IN_PKG的值为1时在EXE环境下运行后端
- 打包成EXE：打包成EXE前，先在BatchMaterialClient目录下运行npm run build打包前端，得到dist文件夹。将dist文件夹复制到BatchMaterialServer/public目录下，接着在BatchMaterialServer根目录下运行命令"pkg ." （前提是先运行命令npm install pkg -g 安装pkg库），等待打包成EXE完成。会输出EXE应用程序到BatchMaterialServer/package.json文件下的pkg.outputPath属性指定的目录
- 运行EXE：双击即可，但要注意，一定要把BatchMaterialServer/public目录下的ffmpeg文件夹复制一份放到EXE执行程序同目录。因为批量素材处理工具的运行依赖于ffmpeg





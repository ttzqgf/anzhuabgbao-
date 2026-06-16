# 清账本 Android 打包项目

这个目录是“清账本”的 Android WebView 版本。应用内容来自 `outputs/mobile-ledger`，会离线打包进 APK，不需要联网使用。

## 用 Android Studio 生成 APK

1. 安装 Android Studio。
2. 打开本目录：`outputs/mobile-ledger-android`。
3. 等待 Android Studio 同步 Gradle。
4. 点击 `Build > Build Bundle(s) / APK(s) > Build APK(s)`。
5. 生成的调试安装包通常在 `app/build/outputs/apk/debug/app-debug.apk`。

## 用 GitHub 自动生成 APK

1. 打开 GitHub，创建一个新仓库，比如 `qing-ledger-android`。
2. 把本目录里的所有内容上传到仓库根目录。
3. 上传完成后，进入仓库的 `Actions` 页面。
4. 点左侧的 `Build APK`。
5. 如果没有自动运行，点 `Run workflow`。
6. 等运行结束后，打开那次运行记录，在页面底部的 `Artifacts` 区域下载 `qing-ledger-debug-apk`。
7. 下载后解压，里面的 `app-debug.apk` 就是安卓安装包。

## 项目信息

- 包名：`com.qingledger.app`
- 应用名：`清账本`
- 最低 Android：6.0
- 数据保存：WebView 本地存储

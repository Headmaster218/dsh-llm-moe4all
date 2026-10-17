# CI 缓存与草稿验收

本仓自带与其他维护插件相同的缓存动作、脚本和测试，不依赖公共 CI 仓库或远程运行脚本。只在 `ci/cache.json`、`ci/release.json` 配置本仓差异；公共实现修订需同步副本并分别提交。

缓存只保存 npm 下载包。key 区分实现版本、系统、架构、Node/npm 及根 lockfile、兼容 fixture、官方 DSH runtime fixture 的完整摘要；不包含 tag。成功的 main push/手动任务可保存，PR/tag 只恢复。缓存不可用时正常安装冻结依赖，不缓存 node_modules、profile、凭据、模型或发行包。原有三组 DSH 兼容测试、官方安装及自更新冒烟全部保留，缓存命中不跳过构建与测试。

手动从 main 运行 Release 工作流只创建 draft release；完成校验后才用 GITHUB_TOKEN 创建新版本 tag，因此不会再次触发公开 tag 发布。已有草稿或公开 Release、版本不符、指向其他 commit 的 tag 均拒绝覆盖。正常推送匹配版本的 tag 仍公开发布；草稿验收后显式公开同一份草稿，不重复推送 tag。草稿不会进入用户 OTA。

本机验证使用 `node --test ci/dependency-cache.test.mjs ci/release-mode.test.mjs`，必须设置隔离的 `MOE4ALL_CI_TEST_ROOT`。验收记录 main 冷缓存保存、草稿任务命中、兼容测试、下载 ZIP/tgz SHA256、版本和源码身份。不得使用真实生产 profile 或启动推理后端来跑这些 CI 测试。

# 澳门百家乐部署说明：game.saka77.cn

本工程来源：用户提供的 macau-baccarat-source(1).zip。保留原游戏源代码、附带的构建文件与测试报告。

## 目前状态（请先读）

- 已确认 ZIP 中含 React / Vite / Three.js 工程、`.github/workflows/pages.yml`、`dist/` 静态网页文件。
- 已解析附带的 `test-report.json`：238 个测试记录为通过、0 失败。这是**源码包附带的历史测试报告**，本次未能独立重跑测试（当前执行环境无法从 npm registry 获取依赖）。
- 已核对打包后的 `dist/index.html` 所引用的 JS/CSS 文件均在本包内；这不等同于 iPhone Safari 上实际 3D/触控验收。
- **尚未公开部署**。仍需由你创建 GitHub 仓库、开启 Pages、配置腾讯云 DNS。打包不等于上线。
- 当前账户已连接的 GitHub 用户名：`tanghaitian04-debug`。发现一个现存仓库 `Saka`，为避免覆盖，建议创建独立新仓库。

## 推荐路线：GitHub Pages（免费） + 腾讯云 DNSPod（管理域名）

### 第一步：在 GitHub 创建独立仓库

手机浏览器打开 `https://github.com/new`，用 `tanghaitian04-debug` 账号创建仓库：

- Repository name: `macau-baccarat`
- Visibility: `Public`（GitHub Free 的 Pages 建议使用公开仓库）
- 不勾选自动生成 README / .gitignore，避免首次上传冲突。

**请勿覆盖已有的 `tanghaitian04-debug/Saka` 仓库。**

### 第二步：上传完整源码

上传的是本部署包**解压后 `macau-baccarat/` 目录内部全部文件与目录**，包括隐藏的 `.github/workflows/pages.yml` 和 `package-lock.json`。不要只上传 ZIP 文件，也不要把整个顶层目录再次套进仓库。

如果你使用 Codex Cloud，可在新建的 `macau-baccarat` 仓库中让 Codex：

> 把我提供的澳门百家乐项目 ZIP 解压至仓库根目录，保留 src、public、tests、package-lock.json、.github/workflows/pages.yml、vite.config.ts 等项目文件，使用 npm ci、npm run test:report、npm run build 进行验证，然后将代码提交推送到 main 分支。保持纯虚拟筹码玩法，不添加任何真实支付能力。

注意：如果 Codex 无法直接接收压缩包，请在 Codex 任务中附上这个 ZIP 或把源代码上传到该仓库，不能仅告诉它一个本地文件名。

### 第三步：开启 GitHub Pages

打开 `https://github.com/tanghaitian04-debug/macau-baccarat/settings/pages`：

1. 在 **Build and deployment → Source** 选择 **GitHub Actions**。
2. 确认 `main` 分支已有代码和 `.github/workflows/pages.yml`。
3. 在 Actions 里查看 **Test and deploy GitHub Pages** 的结果，等待 `build`、`deploy` 两项成功。
4. 此时默认地址一般是 `https://tanghaitian04-debug.github.io/macau-baccarat/`。如不能打开，请先排查 Actions 构建错误。

### 第四步：先在 GitHub 绑定自定义域名

在仓库 **Settings → Pages → Custom domain** 输入：

    game.saka77.cn

保存。使用 GitHub Actions 作为发布源时，GitHub **不要求**项目根目录有 `CNAME` 文件；它在 Pages 设置中管理此值。

### 第五步：在腾讯云 DNSPod 新增一条 CNAME

登录域名 `saka77.cn` 的 DNS 解析 → **添加记录**：

| 字段 | 值 |
| --- | --- |
| 主机记录 | `game` |
| 记录类型 | `CNAME` |
| 线路类型 | `默认` |
| 记录值 | `tanghaitian04-debug.github.io` |
| TTL | `600` 秒 |

**不要**在记录值里写 `https://`、`/macau-baccarat` 或末尾路径。

这是新增 `game` 解析，不要修改、删除现有的 `@` A 记录，或旧站的 MX、TXT 记录。

如果 DNSPod 已有名为 `game` 的 A/AAAA/CNAME 记录，应先检查是否用于其他服务，再处理冲突，不能直接添加同名冲突记录。

### 第六步：打开 HTTPS 并验收

回到 GitHub Settings → Pages，确认 DNS Check 成功并开启 **Enforce HTTPS**。SSL 证书与 DNS 传播有时需等待，GitHub 文档提醒最长可能 24 小时。

最终地址：`https://game.saka77.cn`

用 iPhone Safari 做功能测试：入座、下注、音频解锁、发牌、慢速咪牌、结算、路单刷新恢复、横屏触摸。如果只能看到 2D 降级模式，先检查设备 WebGL 支持和页面控制台，而不是认为 3D 已验收通过。

## 文件内容

- `src/`：游戏源代码
- `tests/`：原始测试
- `dist/`：原始预构建的静态网页（可部署到任意静态 HTTP/HTTPS 托管）
- `.github/workflows/pages.yml`：推送到 main 后，自动运行测试和生产构建，并部署 Pages
- `test-report.json`：源 ZIP 自带的测试机器报告

## 备选：腾讯云托管

如果后续希望完全由腾讯云托管，可以选择腾讯云支持静态网站的托管产品，并上传 `dist/` **目录内部的全部文件**，然后在托管平台内配置自定义域名 `game.saka77.cn`。对应 DNS 记录值应使用腾讯云服务实际发放的 CNAME 地址，不再使用 `tanghaitian04-debug.github.io`。

注意：仅购买域名不意味着有网站服务器。不同腾讯云托管地域的备案要求、HTTPS 接入要求和计费条件可能不同，需以购买产品控制台和最新官方说明为准。

## 官方参考

- GitHub Pages 自定义域名： https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- Vite 官方 GitHub Pages 构建部署： https://vite.dev/guide/static-deploy

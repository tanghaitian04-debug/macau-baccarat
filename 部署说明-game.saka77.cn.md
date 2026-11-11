# 澳门百家乐部署记录

部署日期：2026-11-11（北京时间）。

## 已完成

- 独立仓库：https://github.com/tanghaitian04-debug/macau-baccarat
- 源码已提交到 main，包含 src、tests、public、package-lock.json 和 .github/workflows/pages.yml。
- 本地与 GitHub Actions 均完成238项测试，生产构建与 Pages 部署成功。
- 工作流：https://github.com/tanghaitian04-debug/macau-baccarat/actions/runs/43032714319
- Pages发布源为GitHub Actions，自定义域名为game.saka77.cn。
- DNSPod仅新增下列CNAME；原有4条记录保留，Saka仓库未修改。
- GitHub已签发证书，并开启Enforce HTTPS；刷新设置后仍保持开启。
- HTTPS页面返回200；页面的JavaScript和CSS均返回200，且内容哈希与本次构建一致。

| 主机记录 | 类型 | 线路 | 记录值 | TTL |
| --- | --- | --- | --- | --- |
| game | CNAME | 默认 | tanghaitian04-debug.github.io | 600秒 |

## 访问

https://game.saka77.cn/

这是纯虚拟筹码规则模拟，不支持真钱投注、充值、提现或兑换。设备需支持WebGL才能显示3D；云端验收浏览器不提供WebGL，显示明确提示后使用可继续真实牌局的二维降级模式。真实iPhone Safari上的3D画面、咪牌触控与性能仍需实机验收，不能把部署成功视为这些内容已经验收。

## 后续更新

将修改提交到本仓库main分支，工作流会自动安装依赖、运行测试、构建并发布。PR仅执行验证，不发布。

DNS记录值不包含https://或/macau-baccarat路径。现有主域名及其他记录不需要因本游戏而更改。

# 推送到 GitHub / Push to GitHub

仓库已初始化（分支 `main`，标签 `v0.2.0`，作者 Li Zhou），远程地址已设为
https://github.com/SHELLY000/wordtolatexZL 。确认 GitHub 上该仓库存在（空仓库即可，不要自动生成 README），然后：

```bash
cd wordtolatexZL
git push -u origin main --tags
```

（如果 GitHub 上已经有提交，先 `git pull --rebase origin main` 再推送。）

推送后：
1. Actions 会自动跑 CI（三平台测试、构建 `wordtex_studio.html` 产物、用 XeLaTeX 编译示例稿）。
2. 在 GitHub 发布 Release `v0.2.0`，把 `wordtex_studio.html` 作为附件上传，作者下载这一个文件即可。
3. 在 Zenodo 关联该仓库并取 DOI，填回 `CITATION.cff` 的 `doi:` 和 README 的 DOI 徽章。

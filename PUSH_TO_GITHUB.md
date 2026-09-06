# 推送到 GitHub / Push to GitHub

仓库已初始化（分支 `main`，标签 `v0.2.0`，作者 Li Zhou）。在 GitHub 上新建一个空仓库 `wordtex`（不要勾选 README/LICENSE），然后：

```bash
cd wordtex
# 把占位符换成你的 GitHub 用户名（例如 lizhou）
sed -i 's/YOUR-GITHUB-USER/lizhou/g' README.md README_START_HERE.md CITATION.cff package.json
git commit -am "Set repository URL"
git remote add origin https://github.com/lizhou/wordtex.git
git push -u origin main --tags
```

Windows PowerShell 里 `sed` 可换成：
```powershell
Get-ChildItem README.md,README_START_HERE.md,CITATION.cff,package.json | ForEach-Object { (Get-Content $_ -Raw) -replace 'YOUR-GITHUB-USER','lizhou' | Set-Content $_ -NoNewline }
```

推送后：
1. Actions 会自动跑 CI（三平台测试、构建 `wordtex_studio.html` 产物、用 XeLaTeX 编译示例稿）。
2. 在 GitHub 发布 Release `v0.2.0`，把 `wordtex_studio.html` 作为附件上传，作者下载这一个文件即可。
3. 在 Zenodo 关联该仓库并取 DOI，填回 `CITATION.cff` 的 `doi:` 和 README 的 DOI 徽章。

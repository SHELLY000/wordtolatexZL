# 改名 WordTeX → GalleyTeX：只含要改动的文件

## 1. 删除（6 个旧文件）
```bash
git rm -q wordtex_studio.html WordTeX_USER_MANUAL.md docs/USER_MANUAL.md scripts/autocompile/WordTeX-autocompile.bat scripts/autocompile/wordtex-autocompile.ps1 scripts/autocompile/wordtex-autocompile.sh
```

## 2. 覆盖（本包里的 25 个文件，按目录放到仓库对应位置）
新文件：galleytex_studio.html、GalleyTeX_USER_MANUAL.md、scripts/autocompile/GalleyTeX-autocompile.bat、galleytex-autocompile.ps1、galleytex-autocompile.sh
其余都是覆盖同名文件。RENAME.md 不用放进仓库。

## 3. 提交推送
```bash
git add -A
git status      # 应有 R（重命名）和 M（修改），没有 ??
git commit -m "Rename WordTeX to GalleyTeX"
git push
```

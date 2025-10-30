# 上传文件目录

这个目录用于存储用户上传的文件和生成的结果文件。

## 目录结构

```
uploads/
├── images/
│   ├── input/     # 用户上传的图片
│   └── results/   # 生成的图片结果
└── videos/
    ├── input/     # 用户上传的视频
    └── results/   # 生成的视频结果
```

## 文件组织

文件按年月进行组织，例如：
```
uploads/images/input/2025/01/uuid.png
uploads/images/results/2025/01/result_uuid.png
```
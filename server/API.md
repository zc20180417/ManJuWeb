# API 接口文档

## 基础信息

- 基础URL: `http://localhost:3001/api`
- 所有接口返回格式:
```json
{
  "success": true/false,
  "data": {},
  "message": "描述信息"
}
```

## 图片生成接口

### 1. 生成图片

**URL**: `POST /images/generate`

**请求头**:
```
Content-Type: multipart/form-data
```

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| prompt | string | 是 | 生成提示词 |
| model | string | 是 | 模型名称 |
| aspectRatio | string | 是 | 画面比例 |
| style | string | 是 | 风格 |
| images | file[] | 否 | 参考图片(最多5张) |
| apiKey | string | 是 | API密钥 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "taskId": "task_123456",
    "recordId": "record_123456"
  },
  "message": "图片生成任务已提交"
}
```

### 2. 检查图片生成状态

**URL**: `POST /images/status/:taskId`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| taskId | string | 是 | 任务ID |
| apiKey | string | 是 | API密钥 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "success",
    "data": [
      {
        "url": "https://example.com/result.png"
      }
    ]
  }
}
```

### 3. 获取图片历史记录

**URL**: `GET /images/history`

**查询参数**:
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "_id": "record_123456",
        "prompt": "一只可爱的小猫",
        "model": "nano-banana",
        "aspectRatio": "16:9",
        "style": "卡通风格",
        "inputImageNames": ["image1.png"],
        "resultImageName": "result_123456.png",
        "taskId": "task_123456",
        "status": "success",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

### 4. 获取单个图片记录

**URL**: `GET /images/:id`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 记录ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "record_123456",
    "prompt": "一只可爱的小猫",
    "model": "nano-banana",
    "aspectRatio": "16:9",
    "style": "卡通风格",
    "inputImageNames": ["image1.png"],
    "resultImageName": "result_123456.png",
    "taskId": "task_123456",
    "status": "success",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:05:00.000Z"
  }
}
```

## 视频生成接口

### 1. 生成视频

**URL**: `POST /videos/generate`

**请求头**:
```
Content-Type: multipart/form-data
```

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| prompt | string | 是 | 生成提示词 |
| model | string | 是 | 模型名称 |
| images | file[] | 否 | 参考图片(最多5张) |
| aspectRatio | string | 否 | 画面比例 |
| hd | boolean | 否 | 是否高清 |
| duration | string | 否 | 时长(秒) |
| enhancePrompt | boolean | 否 | 是否增强提示词 |
| watermark | boolean | 否 | 是否添加水印 |
| apiKey | string | 是 | API密钥 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "taskId": "task_123456",
    "recordId": "record_123456"
  },
  "message": "视频生成任务已提交"
}
```

### 2. 检查视频生成状态

**URL**: `POST /videos/status/:taskId`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| taskId | string | 是 | 任务ID |
| apiKey | string | 是 | API密钥 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "success",
    "data": {
      "output": "https://example.com/result.mp4"
    }
  }
}
```

### 3. 获取视频历史记录

**URL**: `GET /videos/history`

**查询参数**:
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "_id": "record_123456",
        "prompt": "一只可爱的小猫在玩耍",
        "model": "sora2",
        "inputImageNames": ["image1.png"],
        "aspectRatio": "16:9",
        "hd": true,
        "duration": "10",
        "enhancePrompt": true,
        "watermark": false,
        "resultVideoName": "video_123456.mp4",
        "taskId": "task_123456",
        "status": "success",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

### 4. 获取单个视频记录

**URL**: `GET /videos/:id`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 记录ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "_id": "record_123456",
    "prompt": "一只可爱的小猫在玩耍",
    "model": "sora2",
    "inputImageNames": ["image1.png"],
    "aspectRatio": "16:9",
    "hd": true,
    "duration": "10",
    "enhancePrompt": true,
    "watermark": false,
    "resultVideoName": "video_123456.mp4",
    "taskId": "task_123456",
    "status": "success",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:05:00.000Z"
  }
}
```

## 历史记录接口

### 1. 获取图片历史记录

**URL**: `GET /history/images`

**查询参数**:
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

### 2. 获取视频历史记录

**URL**: `GET /history/videos`

**查询参数**:
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

### 3. 获取所有历史记录

**URL**: `GET /history/all`

**查询参数**:
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| limit | number | 否 | 10 | 每页数量 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "_id": "record_123456",
        "prompt": "一只可爱的小猫",
        "model": "nano-banana",
        "resultImageName": "result_123456.png",
        "taskId": "task_123456",
        "status": "success",
        "type": "image",
        "createdAt": "2025-01-01T00:00:00.000Z"
      },
      {
        "_id": "record_789012",
        "prompt": "一只可爱的小猫在玩耍",
        "model": "sora2",
        "resultVideoName": "video_789012.mp4",
        "taskId": "task_789012",
        "status": "success",
        "type": "video",
        "createdAt": "2025-01-01T00:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2
    }
  }
}
```

## 错误响应格式

所有错误响应都遵循以下格式:
```json
{
  "success": false,
  "message": "错误描述信息"
}
```

常见错误码:
- 400: 请求参数错误
- 404: 资源不存在
- 500: 服务器内部错误
# API Documentation

Complete API reference for Scout Content Backend

Base URL: `http://localhost:3000/api/v1`

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": {...} or [...]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Authentication

Currently, the API is open (no authentication required). This is suitable for a demo/internal use.

For production, consider adding JWT authentication.

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## Content Endpoints

### 1. Get All Content

Retrieve a list of all content with optional filtering and pagination.

**Endpoint**: `GET /api/v1/content`

**Query Parameters**:
- `category_id` (integer) - Filter by category ID
- `type` (string) - Filter by type: `pdf`, `image`, `video`, `presentation`
- `featured` (boolean) - Filter featured content: `true` or `false`
- `search` (string) - Search in title and description
- `sortBy` (string) - Sort field (default: `created_at`)
- `sortDir` (string) - Sort direction: `ASC` or `DESC` (default: `DESC`)
- `limit` (integer) - Items per page (default: 50, max: 100)
- `offset` (integer) - Pagination offset (default: 0)

**Example Requests**:
```bash
# Get all content
GET /api/v1/content

# Get PDFs only
GET /api/v1/content?type=pdf

# Get content from specific category
GET /api/v1/content?category_id=2

# Search content
GET /api/v1/content?search=كشافة

# Paginated results
GET /api/v1/content?limit=20&offset=0

# Featured content only
GET /api/v1/content?featured=true
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "كتاب الكشافة",
      "title_ar": "كتاب الكشافة",
      "description": "Scout handbook",
      "category_id": 1,
      "category_name": "General",
      "category_name_ar": "عام",
      "type": "pdf",
      "file_path": "/path/to/file.pdf",
      "file_url": "/uploads/pdf/file.pdf",
      "thumbnail_path": "/path/to/thumbnail.jpg",
      "thumbnail_url": "/uploads/thumbnails/file_thumb.jpg",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "tags": ["general", "pdf"],
      "view_count": 45,
      "download_count": 12,
      "is_featured": 0,
      "created_at": "2024-01-15 10:30:00",
      "updated_at": "2024-01-15 10:30:00"
    }
  ],
  "pagination": {
    "total": 129,
    "limit": 50,
    "offset": 0,
    "pages": 3
  }
}
```

---

### 2. Get Single Content

Retrieve details of a specific content item.

**Endpoint**: `GET /api/v1/content/:id`

**Path Parameters**:
- `id` (integer) - Content ID

**Example**:
```bash
GET /api/v1/content/1
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "كتاب الكشافة",
    "description": "Complete scout handbook",
    "type": "pdf",
    "file_url": "/uploads/pdf/scout-handbook.pdf",
    "thumbnail_url": "/uploads/thumbnails/scout-handbook_thumb.jpg",
    "view_count": 46,
    ...
  }
}
```

**Note**: This endpoint automatically increments the view count.

---

### 3. Download/Stream File

Download or stream the actual file content.

**Endpoint**: `GET /api/v1/content/:id/file`

**Path Parameters**:
- `id` (integer) - Content ID

**Features**:
- Supports video streaming with range requests
- Auto-increments download count
- Proper content-type headers
- Inline display for supported types

**Example**:
```bash
GET /api/v1/content/1/file
```

**Response**: Binary file data with appropriate headers

**Headers Set**:
- `Content-Type`: File's MIME type
- `Content-Disposition`: inline; filename="..."
- `Content-Length`: File size
- `Content-Range`: (for video streaming)
- `Accept-Ranges`: bytes (for video streaming)

**For Videos**: Supports partial content (206) for streaming

---

### 4. Get Thumbnail

Retrieve the thumbnail image for content.

**Endpoint**: `GET /api/v1/content/:id/thumbnail`

**Path Parameters**:
- `id` (integer) - Content ID

**Example**:
```bash
GET /api/v1/content/1/thumbnail
```

**Response**: JPEG image file

**Thumbnail Types**:
- Images: Resized version (300x300)
- PDFs: Red placeholder with "PDF" text
- Videos: Blue placeholder with play icon
- Presentations: Orange placeholder with "PPT" text

---

### 5. Get Statistics

Get overall content statistics.

**Endpoint**: `GET /api/v1/content/stats`

**Example**:
```bash
GET /api/v1/content/stats
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total_content": 801,
    "total_pdf": 129,
    "total_images": 665,
    "total_videos": 7,
    "total_presentations": 0,
    "total_views": 1250,
    "total_downloads": 456
  }
}
```

---

### 6. Update Content

Update content metadata.

**Endpoint**: `PUT /api/v1/content/:id`

**Path Parameters**:
- `id` (integer) - Content ID

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "category_id": 2,
  "is_featured": true,
  "tags": ["tag1", "tag2"]
}
```

**Example**:
```bash
PUT /api/v1/content/1
Content-Type: application/json

{
  "title": "كتاب الكشافة المحدث",
  "is_featured": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "كتاب الكشافة المحدث",
    ...
  },
  "message": "Content updated successfully"
}
```

---

### 7. Delete Content

Delete content and its associated files.

**Endpoint**: `DELETE /api/v1/content/:id`

**Path Parameters**:
- `id` (integer) - Content ID

**Example**:
```bash
DELETE /api/v1/content/1
```

**Response**:
```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

**Note**: This deletes both database record and physical files.

---

## Category Endpoints

### 1. Get All Categories

Retrieve all categories with content counts.

**Endpoint**: `GET /api/v1/categories`

**Example**:
```bash
GET /api/v1/categories
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "General",
      "name_ar": "عام",
      "slug": "general",
      "description": "General scout content",
      "icon": "",
      "parent_id": null,
      "order_index": 0,
      "content_count": 45,
      "created_at": "2024-01-15 10:00:00"
    }
  ]
}
```

---

### 2. Get Category Tree

Get categories in hierarchical tree structure.

**Endpoint**: `GET /api/v1/categories/tree`

**Example**:
```bash
GET /api/v1/categories/tree
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Marahel",
      "name_ar": "المراحل",
      "slug": "marahel",
      "content_count": 25,
      "children": [
        {
          "id": 5,
          "name": "Cubs",
          "name_ar": "الأشبال",
          "slug": "cubs",
          "parent_id": 1,
          "content_count": 12,
          "children": []
        }
      ]
    }
  ]
}
```

---

### 3. Get Single Category

Retrieve a specific category by ID.

**Endpoint**: `GET /api/v1/categories/:id`

**Path Parameters**:
- `id` (integer) - Category ID

**Example**:
```bash
GET /api/v1/categories/1
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "General",
    "name_ar": "عام",
    "slug": "general",
    "description": "General scout content",
    "content_count": 45
  }
}
```

---

### 4. Get Category by Slug

Retrieve a category by its slug (URL-friendly name).

**Endpoint**: `GET /api/v1/categories/slug/:slug`

**Path Parameters**:
- `slug` (string) - Category slug

**Example**:
```bash
GET /api/v1/categories/slug/general
```

**Response**: Same as Get Single Category

---

### 5. Create Category

Create a new category.

**Endpoint**: `POST /api/v1/categories`

**Request Body**:
```json
{
  "name": "New Category",
  "name_ar": "فئة جديدة",
  "slug": "new-category",
  "description": "Description here",
  "icon": "📚",
  "parent_id": null,
  "order_index": 10
}
```

**Required Fields**: `name`, `slug`

**Example**:
```bash
POST /api/v1/categories
Content-Type: application/json

{
  "name": "Training",
  "name_ar": "التدريب",
  "slug": "training",
  "description": "Training materials"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 12,
    "name": "Training",
    "name_ar": "التدريب",
    "slug": "training",
    ...
  },
  "message": "Category created successfully"
}
```

---

### 6. Update Category

Update an existing category.

**Endpoint**: `PUT /api/v1/categories/:id`

**Path Parameters**:
- `id` (integer) - Category ID

**Request Body**: Same as Create Category (all fields optional)

**Example**:
```bash
PUT /api/v1/categories/1
Content-Type: application/json

{
  "name_ar": "عام - محدث",
  "order_index": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {...},
  "message": "Category updated successfully"
}
```

---

### 7. Delete Category

Delete a category.

**Endpoint**: `DELETE /api/v1/categories/:id`

**Path Parameters**:
- `id` (integer) - Category ID

**Example**:
```bash
DELETE /api/v1/categories/1
```

**Response**:
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Note**: Content in this category will have their `category_id` set to NULL.

---

## Utility Endpoints

### Health Check

Check if the API is running.

**Endpoint**: `GET /health`

**Example**:
```bash
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Mobile App Integration Examples

### React Native

```javascript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, Text, TouchableOpacity } from 'react-native';

const API_URL = 'http://your-server:3000/api/v1';

function ContentList() {
  const [content, setContent] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/content?type=pdf&limit=20`)
      .then(res => res.json())
      .then(data => setContent(data.data));
  }, []);

  return (
    <FlatList
      data={content}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Image
            source={{ uri: `${API_URL}/content/${item.id}/thumbnail` }}
            style={{ width: 100, height: 100 }}
          />
          <Text>{item.title}</Text>
          <TouchableOpacity onPress={() => downloadFile(item.id)}>
            <Text>Download</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

function downloadFile(contentId) {
  const fileUrl = `${API_URL}/content/${contentId}/file`;
  // Use react-native-fs or expo-file-system to download
}
```

### Flutter

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const String baseUrl = 'http://your-server:3000/api/v1';

  Future<List<Content>> getContent({String? type}) async {
    final url = type != null
      ? '$baseUrl/content?type=$type'
      : '$baseUrl/content';

    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
        .map((item) => Content.fromJson(item))
        .toList();
    }
    throw Exception('Failed to load content');
  }

  String getThumbnailUrl(int contentId) {
    return '$baseUrl/content/$contentId/thumbnail';
  }

  String getFileUrl(int contentId) {
    return '$baseUrl/content/$contentId/file';
  }
}
```

---

## Tips for Mobile Development

1. **Cache Thumbnails**: Use image caching libraries
2. **Offline Support**: Download files for offline access
3. **Pagination**: Load content in chunks (20-50 items)
4. **Search Debouncing**: Delay search requests by 300-500ms
5. **Error Handling**: Always handle network errors gracefully
6. **Loading States**: Show loading indicators during API calls
7. **Retry Logic**: Implement retry for failed requests

---

For more information, see README.md

package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	labelRecognized    = "recognized"
	labelNotRecognized = "not_recognized"
	maxFileSize        = 10 << 20 // 10MB
)

// SubmitCollection 接收前端上傳的 ROI 圖與標籤，存到 COLLECTION_STORAGE_PATH/{label}/ 下
func SubmitCollection(collectionRoot string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if collectionRoot == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "collection not configured"})
			return
		}

		label := strings.TrimSpace(strings.ToLower(c.PostForm("label")))
		if label != labelRecognized && label != labelNotRecognized {
			c.JSON(http.StatusBadRequest, gin.H{"error": "label must be 'recognized' or 'not_recognized'"})
			return
		}

		file, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing image file"})
			return
		}
		if file.Size > maxFileSize {
			c.JSON(http.StatusBadRequest, gin.H{"error": "image too large"})
			return
		}

		dir := filepath.Join(collectionRoot, label)
		if err := os.MkdirAll(dir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create directory"})
			return
		}

		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".png"
		}
		name := fmt.Sprintf("%d_%s%s", time.Now().UnixMilli(), uuid.New().String()[:8], ext)
		dst := filepath.Join(dir, name)
		if err := c.SaveUploadedFile(file, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"ok": true, "path": name})
	}
}

package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"certification-backend/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Persona webhook event (simplified; we care about data.attributes.status and data.id for inquiry)
type personaWebhookPayload struct {
	Data struct {
		ID         string `json:"id"`
		Type       string `json:"type"`
		Attributes struct {
			Status string `json:"status"`
		} `json:"attributes"`
	} `json:"data"`
}

func PersonaWebhook(secret string, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		body, err := c.GetRawData()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
			return
		}

		sigHeader := c.GetHeader("Persona-Signature")
		if sigHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Persona-Signature"})
			return
		}

		var tStr, v1 string
		for _, part := range strings.Split(sigHeader, ",") {
			part = strings.TrimSpace(part)
			if strings.HasPrefix(part, "t=") {
				tStr = strings.TrimPrefix(part, "t=")
			} else if strings.HasPrefix(part, "v1=") {
				v1 = strings.TrimPrefix(part, "v1=")
			}
		}
		if tStr == "" || v1 == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid Persona-Signature format"})
			return
		}

		payload := tStr + "." + string(body)
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write([]byte(payload))
		expected := hex.EncodeToString(mac.Sum(nil))
		if !hmac.Equal([]byte(v1), []byte(expected)) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
			return
		}

		var event personaWebhookPayload
		if err := json.Unmarshal(body, &event); err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
			return
		}

		inquiryID := event.Data.ID
		status := event.Data.Attributes.Status
		if inquiryID == "" {
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}

		receivedAt := time.Now().UTC()
		var inquiry model.Inquiry
		err = db.Where("inquiry_id = ?", inquiryID).First(&inquiry).Error
		if err == gorm.ErrRecordNotFound {
			inquiry = model.Inquiry{
				InquiryID:  inquiryID,
				Status:     status,
				Payload:    body,
				ReceivedAt: receivedAt,
				CreatedAt:  receivedAt,
				UpdatedAt:  receivedAt,
			}
			if err = db.Create(&inquiry).Error; err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "db error"})
				return
			}
		} else if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "db error"})
			return
		} else {
			if err = db.Model(&inquiry).Updates(map[string]interface{}{
				"status":      status,
				"payload":     body,
				"received_at": receivedAt,
				"updated_at": receivedAt,
			}).Error; err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "db error"})
				return
			}
		}

		auditID := uuid.New()
		audit := model.AuditLog{
			ID:         auditID,
			Action:     "inquiry.received",
			EntityType: strPtr("inquiry"),
			EntityID:   &inquiryID,
			InquiryID:  &inquiryID,
			Payload:    []byte(`{"status":"`+status+`"}`),
			CreatedAt:  receivedAt,
		}
		if err := db.Create(&audit).Error; err != nil {
			// non-fatal
		}

		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func strPtr(s string) *string { return &s }

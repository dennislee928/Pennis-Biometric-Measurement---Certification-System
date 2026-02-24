package model

import (
	"time"

	"github.com/google/uuid"
)

type Inquiry struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	InquiryID  string     `gorm:"type:text;uniqueIndex;not null"`
	Status     string     `gorm:"type:text;not null"`
	Payload    []byte     `gorm:"type:jsonb"`
	ReceivedAt time.Time  `gorm:"not null"`
	CreatedAt  time.Time  `gorm:"not null"`
	UpdatedAt  time.Time  `gorm:"not null"`
}

func (Inquiry) TableName() string { return "inquiries" }

type Certificate struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index"`
	InquiryID   string    `gorm:"type:text;uniqueIndex;not null"`
	Measurement []byte    `gorm:"type:jsonb;not null"`
	IssuedAt    time.Time `gorm:"not null"`
	Nonce       string    `gorm:"type:text;not null"`
	Signature   string    `gorm:"type:text;not null"`
	CreatedAt   time.Time `gorm:"not null"`
}

func (Certificate) TableName() string { return "certificates" }

type AuditLog struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Action     string     `gorm:"type:text;not null;index"`
	EntityType *string    `gorm:"type:text"`
	EntityID   *string    `gorm:"type:text"`
	UserID     *uuid.UUID `gorm:"type:uuid"`
	InquiryID  *string    `gorm:"type:text"`
	Payload    []byte     `gorm:"type:jsonb"`
	CreatedAt  time.Time  `gorm:"not null;index"`
}

func (AuditLog) TableName() string { return "audit_logs" }

# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o cert-backend .

# Run stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=UTC

WORKDIR /app
COPY --from=builder /app/cert-backend .

EXPOSE 8080

ENTRYPOINT ["./cert-backend"]

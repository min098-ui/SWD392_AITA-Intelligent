# Dockerfile for Isolated Java OpenJDK 17 Sandbox Runner
# SWD392 - AITA Sandbox Runner
FROM eclipse-temurin:17-alpine

# Security: Create non-root runner user
RUN addgroup -S -g 1001 runner && adduser -S -u 1001 -G runner runner

WORKDIR /app

RUN chown -R runner:runner /app

USER runner

CMD ["sh", "-c", "javac Main.java && java Main"]


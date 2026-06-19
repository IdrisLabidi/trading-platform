# Multi-stage build for the Spring Boot portfolio-service.
# Stage 1 ("builder") compiles the application into an executable JAR
# using a Gradle image that bundles the JDK.
# Stage 2 ("runtime") is a slim Amazon Corretto image that only contains
# the JRE plus the built JAR, which keeps the final image small and the
# attack surface low (we run as a non-root "spring" user).
FROM gradle:jdk26-corretto as builder
LABEL authors="youssef, idris"

WORKDIR /app

# Copy Gradle build files first to leverage Docker layer caching:
# dependencies are only re-downloaded when these files change.
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true

# Copy the source code and build the executable Spring Boot JAR,
# skipping tests because we assume tests are run in CI before building.
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# --- Runtime stage ---
FROM amazoncorretto:26-alpine-jdk

WORKDIR /app

# Create a non-root user to run the Spring Boot process.
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

# Copy only the built JAR from the builder stage.
COPY --from=builder /app/build/libs/*.jar app.jar

# Portfolio-service exposes port 8082 (see application.yaml).
EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]

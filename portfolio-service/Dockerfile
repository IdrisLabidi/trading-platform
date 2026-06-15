FROM gradle:jdk26-corretto as builder
LABEL authors="youssef"

WORKDIR /app

COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true

COPY src ./src
RUN gradle bootJar --no-daemon -x test

FROM amazoncorretto:26-alpine-jdk

WORKDIR /app

#Create a nonroot user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

#Copy only the built JAR from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]
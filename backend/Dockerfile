# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY backend/pom.xml .
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
RUN mvn -q -B -DskipTests package

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/target/ikea-server-0.1.0.jar app.jar
EXPOSE 8080
ENV IKEA_STATIC_PUBLIC_DIR=""
ENTRYPOINT ["java", "-jar", "app.jar"]

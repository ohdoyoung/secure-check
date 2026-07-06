FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY backend/pom.xml ./pom.xml
COPY backend/src ./src
RUN mvn -Dmaven.test.skip=true package

FROM eclipse-temurin:17-jre

WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=build /workspace/target/*.jar /app/app.jar
COPY backend/rules /app/rules
USER app

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-8080} -XX:MaxRAMPercentage=75.0 -jar /app/app.jar"]

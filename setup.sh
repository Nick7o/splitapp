#!/bin/bash


# 2. Baza Danych (Docker)
cat <<EOF > docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: splitapp_user
      POSTGRES_PASSWORD: supersecretpassword
      POSTGRES_DB: splitapp_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
EOF

# 3. Backend - Clean Architecture
mkdir backend
cd backend
dotnet new sln -n SplitApp
dotnet new classlib -n SplitApp.Domain
dotnet new classlib -n SplitApp.Application
dotnet new classlib -n SplitApp.Infrastructure
dotnet new webapi -n SplitApp.Api

dotnet sln add SplitApp.Domain/SplitApp.Domain.csproj
dotnet sln add SplitApp.Application/SplitApp.Application.csproj
dotnet sln add SplitApp.Infrastructure/SplitApp.Infrastructure.csproj
dotnet sln add SplitApp.Api/SplitApp.Api.csproj

# Referencje
dotnet add SplitApp.Application/SplitApp.Application.csproj reference SplitApp.Domain/SplitApp.Domain.csproj
dotnet add SplitApp.Infrastructure/SplitApp.Infrastructure.csproj reference SplitApp.Application/SplitApp.Application.csproj
dotnet add SplitApp.Api/SplitApp.Api.csproj reference SplitApp.Application/SplitApp.Application.csproj
dotnet add SplitApp.Api/SplitApp.Api.csproj reference SplitApp.Infrastructure/SplitApp.Infrastructure.csproj
cd ..

# 4. Frontend - React
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
cd ..

echo "====================================="
echo "GOTOWE! Projekt SplitApp stoi!"
echo "====================================="

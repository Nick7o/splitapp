#!/bin/bash

echo "Starting Database..."
docker-compose up -d

echo "Waiting for Database to be ready..."
sleep 3

echo "Applying Migrations..."
cd backend/SplitApp.Api
dotnet ef database update --project ../SplitApp.Infrastructure --startup-project .

echo "Starting Backend..."
dotnet run

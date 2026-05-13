#!/bin/bash
cd /home/nick/repos/splitapp/backend/SplitApp.Application
dotnet add package MediatR
cd ../SplitApp.Api
dotnet add package MediatR
dotnet add package Microsoft.EntityFrameworkCore.Design
cd ../SplitApp.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

#!/bin/bash

CONTAINER_NAME="local-postgres-your-app-name"
POSTGRES_PASSWORD="mysecretpassword"  # Change this to your desired password
POSTGRES_IMAGE="postgres"

# Check if the container exists
if [ $(docker ps -a -f name=^/${CONTAINER_NAME}$ --format '{{.Names}}') ]; then
    # Check if the container is running
    if [ $(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME) = "true" ]; then
        echo "Stopping PostgreSQL container..."
        docker stop $CONTAINER_NAME
    else
        echo "Starting PostgreSQL container..."
        docker start $CONTAINER_NAME

        echo "Connection URL: postgres://postgres:$POSTGRES_PASSWORD@localhost:5432/postgres"
    fi
else
    echo "Creating and starting a new PostgreSQL container..."
    docker pull $POSTGRES_IMAGE
    docker run --name $CONTAINER_NAME -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -d -p 5432:5432 $POSTGRES_IMAGE
fi

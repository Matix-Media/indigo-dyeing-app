#!/usr/bin/env bash
set -e

BACKEND_ENV_FILE="./backend/.env.local"
FRONTEND_ENV_LOCAL_FILE="./frontend/.env.local"
FRONTEND_ENV_FILE="./frontend/.env"
FRONTEND_ENV_EXAMPLE_FILE="./frontend/.env.example"
TMP_ENV_FILE=""

cleanup() {
    if [[ -n "$TMP_ENV_FILE" && -f "$TMP_ENV_FILE" ]]; then
        rm -f "$TMP_ENV_FILE"
    fi
}

trap cleanup EXIT

if [[ -f "$BACKEND_ENV_FILE" || -f "$FRONTEND_ENV_LOCAL_FILE" || -f "$FRONTEND_ENV_FILE" || -f "$FRONTEND_ENV_EXAMPLE_FILE" ]]; then
    TMP_ENV_FILE="$(mktemp)"

    if [[ -f "$BACKEND_ENV_FILE" ]]; then
        echo "Using $BACKEND_ENV_FILE"
        cat "$BACKEND_ENV_FILE" >> "$TMP_ENV_FILE"
        echo "" >> "$TMP_ENV_FILE"
    fi

    if [[ -f "$FRONTEND_ENV_LOCAL_FILE" ]]; then
        echo "Using $FRONTEND_ENV_LOCAL_FILE"
        cat "$FRONTEND_ENV_LOCAL_FILE" >> "$TMP_ENV_FILE"
        echo "" >> "$TMP_ENV_FILE"
    elif [[ -f "$FRONTEND_ENV_FILE" ]]; then
        echo "Using $FRONTEND_ENV_FILE"
        cat "$FRONTEND_ENV_FILE" >> "$TMP_ENV_FILE"
        echo "" >> "$TMP_ENV_FILE"
    elif [[ -f "$FRONTEND_ENV_EXAMPLE_FILE" ]]; then
        echo "Using $FRONTEND_ENV_EXAMPLE_FILE"
        cat "$FRONTEND_ENV_EXAMPLE_FILE" >> "$TMP_ENV_FILE"
        echo "" >> "$TMP_ENV_FILE"
    fi

    exec docker compose --env-file "$TMP_ENV_FILE" "$@"
fi

echo "No local env files found, using environment variables from shell"
exec docker compose "$@"

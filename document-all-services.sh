#!/bin/bash

# Script to document all DotEvolve services (Govnix + Floorix + Central Portal)

echo "========================================="
echo "Documenting All DotEvolve Services"
echo "========================================="
echo ""

# Function to document a service
document_service() {
    local service_name=$1
    local service_path=$2

    echo "📝 Documenting: $service_name"
    echo "   Path: $service_path"

    if [ -d "$service_path" ]; then
        node dist/cli.js directory "$service_path" --config ../.docrc.json
        echo "   ✅ Completed"
    else
        echo "   ⚠️  Directory not found, skipping"
    fi
    echo ""
}

# Get the workspace root (parent of documentation-tool)
WORKSPACE_ROOT="$(cd .. && pwd)"

# ── Central Portal ────────────────────────────────────────────────────────────
echo "--- Central Portal ---"
document_service "Portal API" "$WORKSPACE_ROOT/../dot-portal-api/src"
document_service "Admin Portal" "$WORKSPACE_ROOT/../dot-admin/src"
document_service "End-User Portal" "$WORKSPACE_ROOT/../dot-portal/src"

# ── Govnix ───────────────────────────────────────────────────────────────────
echo "--- Govnix ---"
document_service "API Gateway" "$WORKSPACE_ROOT/../govnix-api-gateway/api"
document_service "Workflow Service" "$WORKSPACE_ROOT/../govnix-workflow-service/src"
document_service "Rule Engine Service" "$WORKSPACE_ROOT/../govnix-rule-engine-service/src"
document_service "Frontend" "$WORKSPACE_ROOT/../govnix-app/src"
document_service "Admin Dashboard" "$WORKSPACE_ROOT/../govnix-admin/src"

# ── Floorix ──────────────────────────────────────────────────────────────
echo "--- Floorix ---"
document_service "Floorix API" "$WORKSPACE_ROOT/../floorix-api"
document_service "Floorix Client" "$WORKSPACE_ROOT/../floorix-app/src"
document_service "Floorix Admin" "$WORKSPACE_ROOT/../floorix-admin/src"

# ── Shared ────────────────────────────────────────────────────────────────────
echo "--- Shared ---"
document_service "Error Utils" "$WORKSPACE_ROOT/../dot-error-utils/src"

echo "========================================="
echo "✨ Documentation Complete!"
echo "========================================="

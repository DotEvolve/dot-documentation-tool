#!/bin/bash

# Script to document all DotEvolve services (dot-cOS + Foot Factory + Central Portal)

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

# ── dot-cOS ───────────────────────────────────────────────────────────────────
echo "--- dot-cOS ---"
document_service "API Gateway" "$WORKSPACE_ROOT/../dot-cos-api-gateway/api"
document_service "Workflow Service" "$WORKSPACE_ROOT/../dot-cos-workflow-service/src"
document_service "Rule Engine Service" "$WORKSPACE_ROOT/../dot-cos-rule-engine-service/src"
document_service "Frontend" "$WORKSPACE_ROOT/../dot-cos-frontend/src"
document_service "Admin Dashboard" "$WORKSPACE_ROOT/../dot-cos-admin-dashboard/src"

# ── Foot Factory ──────────────────────────────────────────────────────────────
echo "--- Foot Factory ---"
document_service "Foot Factory API" "$WORKSPACE_ROOT/../dot-foot-factory-api"
document_service "Foot Factory Client" "$WORKSPACE_ROOT/../dot-foot-factory-client/src"
document_service "Foot Factory Admin" "$WORKSPACE_ROOT/../dot-foot-factory-admin/src"

# ── Shared ────────────────────────────────────────────────────────────────────
echo "--- Shared ---"
document_service "Error Utils" "$WORKSPACE_ROOT/../dot-error-utils/src"

echo "========================================="
echo "✨ Documentation Complete!"
echo "========================================="

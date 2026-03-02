#!/bin/bash

# Script to document all services in the dot-cOS workspace

echo "========================================="
echo "Documenting All dot-cOS Services"
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

# Document each service
document_service "API Gateway" "$WORKSPACE_ROOT/../dot-cos-api-gateway/api"
document_service "API Gateway Root (file)" "$WORKSPACE_ROOT/../dot-cos-api-gateway/index.js"
document_service "Workflow Service" "$WORKSPACE_ROOT/../dot-cos-workflow-service/src"
document_service "Rule Engine Service" "$WORKSPACE_ROOT/../dot-cos-rule-engine-service/src"
document_service "Frontend" "$WORKSPACE_ROOT/../dot-cos-frontend/src"
document_service "Admin Dashboard" "$WORKSPACE_ROOT/../dot-cos-admin-dashboard/src"
document_service "MCA Extension" "$WORKSPACE_ROOT/../dot-cos-mca-extension/src"
document_service "Error Utils" "$WORKSPACE_ROOT/../dot-error-utils/src"

echo "========================================="
echo "✨ Documentation Complete!"
echo "========================================="

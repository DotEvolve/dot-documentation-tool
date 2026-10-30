#!/bin/bash

# Generic script to document multiple projects in a workspace directory
# Usage: ./document-workspace.sh <workspace_root_path>

if [ -z "$1" ]; then
  echo "Error: Please provide the workspace root path."
  echo "Usage: ./document-workspace.sh /path/to/workspace"
  exit 1
fi

WORKSPACE_ROOT=$1

# Build the tool first
echo "Building documentation tool..."
npm run build

echo "=========================================================="
echo "Starting Workspace Documentation Generation"
echo "Workspace: $WORKSPACE_ROOT"
echo "=========================================================="

# Function to document a project directory
document_project() {
  local project_name=$1
  local project_path=$2
  
  if [ -d "$project_path" ]; then
    echo ""
    echo "Processing $project_name..."
    echo "Path: $project_path"
    
    # Run the documentation tool in dry-run mode (change to write for production)
    node dist/cli.js directory "$project_path" --dry-run
    
    echo "✓ Finished $project_name"
  else
    echo "⚠ Skipping $project_name: Directory not found at $project_path"
  fi
}

# Example: iterate over subdirectories in the workspace
for dir in "$WORKSPACE_ROOT"/*/; do
  if [ -d "$dir" ]; then
    project_name=$(basename "$dir")
    
    # Skip hidden directories or node_modules
    if [[ "$project_name" == .* ]] || [[ "$project_name" == "node_modules" ]]; then
      continue
    fi
    
    document_project "$project_name" "$dir"
  fi
done

echo ""
echo "=========================================================="
echo "Workspace Documentation Generation Complete!"
echo "=========================================================="

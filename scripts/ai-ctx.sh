#!/usr/bin/env bash

set -euo pipefail

OUTPUT_MODE="clipboard"
OUTPUT_FILE="ai-context.txt"

if [[ $# -eq 0 ]]; then
  echo "❌ No input provided."
  echo "Usage: $0 <file|folder> [...] [--out file]"
  exit 1
fi

ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out)
      OUTPUT_MODE="file"
      OUTPUT_FILE="$2"
      shift 2
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

FILES=()

# ---------- Collect files ----------
for arg in "${ARGS[@]}"; do
  if [[ -d "$arg" ]]; then
    while IFS= read -r file; do
      FILES+=("$file")
    done <<EOF
$(find "$arg" -type f \
  -not -path '*/\.*' \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*')
EOF

  elif [[ -f "$arg" ]]; then
    FILES+=("$arg")
  else
    echo "⚠️ Skipped: $arg"
  fi
done

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "❌ No valid files found."
  exit 1
fi

# ---------- Sort & dedup (portable) ----------
SORTED_FILES=($(printf "%s\n" "${FILES[@]}" | sort -u))

# ---------- Generate ----------
generate_context() {
  echo "<context>"
  echo "Project codebase snapshot for AI analysis."
  echo ""

  for file in "${SORTED_FILES[@]}"; do
    [[ -f "$file" ]] || continue

    clean_path="${file#./}"

    echo "========================================"
    echo "FILE: $clean_path"
    echo "========================================"
    echo ""

    cat "$file"
    echo ""
    echo ""
  done

  echo "========================================"
  echo "END OF CONTEXT"
  echo "========================================"
  echo "</context>"
}

# ---------- Output ----------
if [[ "$OUTPUT_MODE" == "file" ]]; then
  generate_context > "$OUTPUT_FILE"
  echo "✅ Output written to $OUTPUT_FILE (${#SORTED_FILES[@]} files)"
else
  if command -v pbcopy >/dev/null 2>&1; then
    generate_context | pbcopy
    echo "✅ Copied to clipboard (${#SORTED_FILES[@]} files)"
  elif command -v xclip >/dev/null 2>&1; then
    generate_context | xclip -selection clipboard
    echo "✅ Copied to clipboard (${#SORTED_FILES[@]} files)"
  else
    echo "⚠️ Clipboard not supported, printing instead:"
    generate_context
  fi
fi



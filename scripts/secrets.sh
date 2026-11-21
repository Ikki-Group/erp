#!/usr/bin/env bash
#
# secrets.sh — encrypt/decrypt repo secrets with age (https://github.com/FiloSottile/age)
#
# Usage:
#   scripts/secrets.sh encrypt          Encrypt every file in the manifest to <path>.age
#   scripts/secrets.sh decrypt          Decrypt every <path>.age back to plaintext <path>
#   scripts/secrets.sh encrypt <path>   Encrypt a single file (also adds it to the manifest)
#   scripts/secrets.sh decrypt <path>   Decrypt a single <path>.age
#   scripts/secrets.sh status           Show which secrets are present / encrypted / stale
#
# Layout:
#   secrets/recipients.txt   Public key(s) — committed. Used to ENCRYPT.
#   secrets/.secrets-manifest List of plaintext paths to manage — committed.
#   .local/age.key           Your PRIVATE key — git-ignored (in .local/). Used to DECRYPT.
#                            Back this up yourself; losing it means you cannot decrypt.
#
# The private key path can be overridden with AGE_KEY_FILE.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RECIPIENTS_FILE="secrets/recipients.txt"
MANIFEST_FILE="secrets/.secrets-manifest"
KEY_FILE="${AGE_KEY_FILE:-.local/age.key}"

c_red=$'\033[31m'; c_grn=$'\033[32m'; c_yel=$'\033[33m'; c_dim=$'\033[2m'; c_rst=$'\033[0m'

die() { echo "${c_red}error:${c_rst} $*" >&2; exit 1; }
info() { echo "${c_dim}$*${c_rst}"; }

command -v age >/dev/null 2>&1 || die "age is not installed. See secrets/README.md for install steps."

read_manifest() {
  [[ -f "$MANIFEST_FILE" ]] || die "manifest not found: $MANIFEST_FILE"
  grep -v -e '^[[:space:]]*#' -e '^[[:space:]]*$' "$MANIFEST_FILE" || true
}

ensure_recipients() {
  [[ -f "$RECIPIENTS_FILE" ]] || die "recipients file not found: $RECIPIENTS_FILE (run: age-keygen to create a key, then add its public line here)"
  [[ -s "$RECIPIENTS_FILE" ]] || die "recipients file is empty: $RECIPIENTS_FILE"
}

ensure_key() {
  [[ -f "$KEY_FILE" ]] || die "private key not found: $KEY_FILE (generate with: age-keygen -o .local/age.key, or set AGE_KEY_FILE)"
}

encrypt_one() {
  local plain="$1"
  [[ -f "$plain" ]] || die "plaintext not found: $plain"
  age --encrypt --recipients-file "$RECIPIENTS_FILE" --output "$plain.age" "$plain"
  echo "  ${c_grn}encrypted${c_rst} $plain -> $plain.age"
}

decrypt_one() {
  local plain="$1"
  local enc="$plain.age"
  [[ -f "$enc" ]] || die "ciphertext not found: $enc"
  mkdir -p "$(dirname "$plain")"
  age --decrypt --identity "$KEY_FILE" --output "$plain" "$enc"
  echo "  ${c_grn}decrypted${c_rst} $enc -> $plain"
}

cmd_encrypt() {
  ensure_recipients
  if [[ $# -ge 1 ]]; then
    encrypt_one "$1"
    if ! read_manifest | grep -qxF "$1"; then
      echo "$1" >> "$MANIFEST_FILE"
      info "added $1 to $MANIFEST_FILE"
    fi
    return
  fi
  echo "Encrypting all manifest entries with $RECIPIENTS_FILE:"
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    if [[ -f "$path" ]]; then encrypt_one "$path"; else echo "  ${c_yel}skip${c_rst} (missing) $path"; fi
  done < <(read_manifest)
}

cmd_decrypt() {
  ensure_key
  if [[ $# -ge 1 ]]; then decrypt_one "$1"; return; fi
  echo "Decrypting all manifest entries with $KEY_FILE:"
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    if [[ -f "$path.age" ]]; then decrypt_one "$path"; else echo "  ${c_yel}skip${c_rst} (no ciphertext) $path"; fi
  done < <(read_manifest)
}

cmd_status() {
  printf "%-40s %-10s %-10s\n" "PATH" "PLAINTEXT" "ENCRYPTED"
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    local p="-" e="-"
    [[ -f "$path" ]] && p="yes"
    [[ -f "$path.age" ]] && e="yes"
    printf "%-40s %-10s %-10s\n" "$path" "$p" "$e"
  done < <(read_manifest)
}

case "${1:-}" in
  encrypt) shift; cmd_encrypt "$@" ;;
  decrypt) shift; cmd_decrypt "$@" ;;
  status)  shift; cmd_status ;;
  *) echo "usage: scripts/secrets.sh {encrypt|decrypt|status} [path]" >&2; exit 1 ;;
esac

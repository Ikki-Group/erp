# Secrets (age-encrypted)

We store env files and other sensitive configs in the repo **encrypted** with
[age](https://github.com/FiloSottile/age). Ciphertext (`*.age`) is committed;
plaintext stays gitignored.

## How it works

- **Public key** (`secrets/recipients.txt`) is committed. It only _encrypts_.
- **Private key** (`.local/age.key`) is git-ignored (lives in `.local/`). It _decrypts_.
- **Manifest** (`secrets/.secrets-manifest`) lists which plaintext files are managed.
- Encrypting `apps/server/.env` produces `apps/server/.env.age` (committed).

Anyone cloning the repo needs the private key to decrypt. Without it, the
committed `.age` blobs are useless.

## One-time setup

### 1. Install age

macOS (Homebrew):

```sh
brew install age
```

Other platforms: see https://github.com/FiloSottile/age#installation

### 2. Generate a keypair (do this once, keep the key safe)

```sh
age-keygen -o .local/age.key
```

The key is written to `.local/age.key`, which is git-ignored, so it stays on
your machine and is never committed. `age-keygen` also prints the **public key**
(`Public key: age1...`) to the terminal — copy that line into
`secrets/recipients.txt` (replace the placeholder), then commit `recipients.txt`.

> Back up `.local/age.key` somewhere safe (password manager). If you lose it, you
> cannot decrypt. It never leaves your machine via git.

## Daily use

```sh
scripts/secrets.sh status     # see what's present / encrypted
scripts/secrets.sh encrypt    # encrypt every manifest file -> *.age (commit these)
scripts/secrets.sh decrypt    # restore plaintext from *.age (after a fresh clone)
```

Encrypt or decrypt a single file:

```sh
scripts/secrets.sh encrypt apps/server/.env
scripts/secrets.sh decrypt apps/server/.env
```

Encrypting a new file also adds it to the manifest automatically.

## Adding a new secret file (any config, not just .env)

1. Make sure the plaintext path is gitignored (see root `.gitignore`).
2. `scripts/secrets.sh encrypt path/to/config.json`
3. Commit `path/to/config.json.age` and the updated `secrets/.secrets-manifest`.

## Sharing with a teammate / another machine

Each person generates their own keypair and adds their public line to
`secrets/recipients.txt`. Then someone with access re-runs
`scripts/secrets.sh encrypt` so the ciphertext is encrypted to all recipients,
and commits the result. Now every listed recipient can decrypt with their own key.

## Overriding the key location

The default is `.local/age.key`. Override it with:

```sh
AGE_KEY_FILE=/path/to/other.key scripts/secrets.sh decrypt
```

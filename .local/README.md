# .local

Machine-local scratch space. **Everything you drop in here is git-ignored** —
put anything you want: loose secrets, decrypted configs, notes, scratch scripts,
temp dumps. Nothing here is committed except this `README.md` and the
`.gitignore` that does the ignoring.

## Rules

- Safe to put secrets here. It will never be committed.
- Do not rely on it being shared — it exists only on your machine.
- If you want something version-controlled and secured, encrypt it with age
  instead (see `../secrets/README.md`).

## Convention

- The age **private key** lives here at `.local/age.key` (git-ignored). Generate
  it with `age-keygen -o .local/age.key`. **Back it up yourself** (password
  manager) — if you lose it you cannot decrypt anything.
- Override the key location with `AGE_KEY_FILE=/path/to/key`.

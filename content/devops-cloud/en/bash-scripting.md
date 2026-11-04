---
# id is permanent: progress and XP are tied to it. Never change it.
id: 38283563-1fc0-4b84-a4ef-6ea93390fb66
slug: bash-scripting
title: Automate It with Bash
part: linux-for-servers
order: 4
xp: 10
topics: [Bash, Variables, Loops, Exit codes, set -euo pipefail]
updated: 2026-11-01
---

## A story first {#story}

Every Friday night Tania ships a release. She knows the steps by heart: pull the code, run the tests, back up the old version, put the new version in place, restart the service, open the site and check. Eight steps, by hand, every time.

One Friday, very late, exhausted, she forgot step four: the backup. The new version had a bug. There was nothing to roll back to.

The problem isn't Tania. The problem is that **people can't do the same job perfectly over and over**. Computers can. Write a recipe card and anyone, at any time, can cook the same dish the same way. In DevOps that recipe card is called a **script**.

Everything you've learned in the last three chapters (commands, pipes, permissions, services) comes together here. By the end of this chapter you will:

- Write and run a Bash script.
- Use variables, conditions, loops and functions.
- Understand what an **exit code** is, and how a script says whether it succeeded.
- Make scripts safe with `set -euo pipefail`, and avoid the quoting mistake that wipes data in production.
- Build a real backup script that can run every day from cron.
- Know when to leave Bash behind for Python or Go.

## Your first script {#first-script}

Create a file called `hello.sh`:

```bash
#!/usr/bin/env bash
# my first script
echo "Hello from $(hostname)"
echo "Today is $(date +%A)"
```

Then give it permission to run, and run it:

```bash
chmod +x hello.sh
./hello.sh
```

```text
Hello from web-01
Today is Saturday
```

The first line, `#!/usr/bin/env bash`, is called the **shebang**. It tells the kernel, "run this file with `bash`". Leave it out and the file might run in some other shell, where some Bash features won't work.

The `./` in `./hello.sh` means "the hello.sh in this folder". For security, Linux doesn't look for programs in the current folder, so you have to write it.

## Variables {#variables}

```bash
name="Tania"
count=3
echo "Hello, $name. You have $count releases this week."
```

Three rules; break them and you get strange errors:

1. **No spaces on either side of `=`.** Write `name = "Tania"` and Bash thinks `name` is a command.
2. **Always put variables in double quotes when you use them:** `"$name"`. You'll see why in the safety section shortly; it's the single most important rule.
3. **If letters follow the name, use `{}`:** `"${name}_backup"`, otherwise Bash looks for a variable called `$name_backup`.

A few useful forms:

```bash
today=$(date +%F)                 # a command's output into a variable (2026-11-01)
files=$(ls /var/log | wc -l)
total=$(( count * 2 + 1 ))        # arithmetic
dir="${BACKUP_DIR:-/var/backups}" # a default value if BACKUP_DIR isn't set
```

### Input to a script: arguments {#arguments}

```bash
./deploy.sh shop production
```

Inside the script:

| Variable | Value |
| --- | --- |
| `$0` | The script's name (`./deploy.sh`) |
| `$1`, `$2` | The first and second arguments (`shop`, `production`) |
| `$#` | How many arguments (`2`) |
| `"$@"` | All the arguments, each one separately |

```bash
#!/usr/bin/env bash
if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <app> <environment>" >&2
  exit 1
fi
app="$1"
env="$2"
echo "Deploying $app to $env"
```

Notice `>&2`: the usage message goes to stderr, because it's an error.

## Exit codes: did it succeed? {#exit-codes}

Every command returns a number when it finishes, called the **exit code**. The rule is very simple:

- **`0` means success.**
- **Any other number means some problem.**

The last command's exit code is in `$?`:

```bash
ls /etc > /dev/null
echo $?        # 0
ls /nope 2> /dev/null
echo $?        # 2
```

This matters because cron, systemd, CI pipelines and monitoring all decide whether your script succeeded by looking at the exit code. If your script always returns `0`, nobody will know when it breaks.

You can chain commands with exit codes:

```bash
make test && make deploy          # deploy only if the tests pass
ping -c1 db.internal || echo "DB unreachable" >&2   # a message if it fails
```

## Conditions {#conditions}

```bash
if [[ -f /etc/nginx/nginx.conf ]]; then
  echo "Nginx config found"
elif [[ -d /etc/nginx ]]; then
  echo "Folder exists but no config"
else
  echo "Nginx not installed"
fi
```

The checks you'll use most inside `[[ ... ]]`:

| Check | Meaning |
| --- | --- |
| `-f path` | The file exists |
| `-d path` | The folder exists |
| `-z "$var"` | The variable is empty |
| `-n "$var"` | The variable isn't empty |
| `"$a" == "$b"` | The text is equal |
| `$x -gt 10` | The number is greater (`-lt` less, `-eq` equal, `-ge`, `-le`) |

And any command can go straight into an `if`; its exit code is the condition:

```bash
if systemctl is-active --quiet nginx; then
  echo "nginx is running"
fi
```

## Loops {#loops}

```bash
# Over a list
for server in web-01 web-02 web-03; do
  echo "Checking $server"
  ssh "$server" uptime
done

# Over files
for f in /var/log/nginx/*.log; do
  echo "$f: $(wc -l < "$f") lines"
done

# Reading a file line by line
while IFS= read -r host; do
  echo "Pinging $host"
done < hosts.txt
```

Memorise `while IFS= read -r line`. `-r` stops backslashes from being changed, and `IFS=` keeps the blank space at the start of each line. It's the safe way to read a file line by line.

For many possible values, `case`:

```bash
case "$env" in
  production) replicas=3 ;;
  staging)    replicas=1 ;;
  *)          echo "Unknown env: $env" >&2; exit 1 ;;
esac
```

## Functions {#functions}

```bash
log() {
  echo "[$(date '+%F %T')] $*"
}

backup_db() {
  local db="$1"
  log "Backing up $db"
  pg_dump "$db" > "/var/backups/$db-$(date +%F).sql"
}

backup_db shop
```

`local` keeps a variable inside the function only, so it can't accidentally change a variable outside. Functions return exit codes too: the last command's, or your own with `return 1`.

## Safety: the mistakes that wipe data {#safety}

Bash's default behaviour is very "forgiving". When a command fails, it carries on to the next line. A variable that doesn't exist is silently treated as empty. That forgiveness is exactly what's dangerous in production.

Look at a realistic kind of mistake:

```bash
#!/usr/bin/env bash
cd "$DEPLOY_DIR"
rm -rf ./*
```

What if `DEPLOY_DIR` isn't set? `cd ""` does nothing, and you stay wherever you were, perhaps your home folder. Then `rm -rf ./*`. And what if `cd` fails (the folder doesn't exist)? Bash still goes on to the next line.

The fix is this one line at the start of every script:

```bash
set -euo pipefail
```

| Piece | What it does |
| --- | --- |
| `-e` | If any command fails (exit code not 0), the script stops right there |
| `-u` | Using a variable that isn't set stops the script with an error |
| `-o pipefail` | If any part of a pipe fails, the whole pipe counts as failed (by default only the last part is checked) |

```diagram
strict-mode
The same script runs twice. On the left, no protection: one step fails but the script keeps going and deletes the wrong folder. On the right, set -euo pipefail: it stops at the first mistake.
```

Three more protections:

**1. Always quote.** See what happens when a file name has a space:

```bash
file="my report.txt"
rm $file       # tries to delete "my" and "report.txt", two separate files!
rm "$file"     # right: one file, "my report.txt"
```

**2. Make sure a variable isn't empty before deleting.** `${VAR:?}` stops with an error if the variable is empty or unset:

```bash
rm -rf "${BUILD_DIR:?}/"*     # if BUILD_DIR is empty, it will never delete "/"
```

**3. Clean up at the end, no matter what.** With `trap` you can say what to run when the script ends (successfully or not):

```bash
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
# do whatever you like in $tmp; however the script ends, it gets deleted
```

> [!tip] Use ShellCheck
> `shellcheck` is a small tool that reads your script and points out unquoted variables, wrong conditions, and hundreds of other common mistakes. `sudo apt install shellcheck`, then `shellcheck deploy.sh`. There's a VS Code extension too. Put it in CI and nobody can merge a dangerous script.

## Hands-on: a real backup script {#hands-on}

Now put it all together. We'll build a script that:

1. Backs up a folder as a dated `.tar.gz`.
2. Keeps only the last 7 backups and deletes the older ones.
3. Logs every step with the time.
4. Returns a non-zero exit code if anything goes wrong, so cron or monitoring can find out.

`backup.sh` (the same job is given side by side in Python and Go; switch tabs to compare):

```bash tabs
#!/usr/bin/env bash
# Usage: backup.sh <source-dir> <backup-dir> [keep]
set -euo pipefail

src="${1:?usage: backup.sh <source-dir> <backup-dir> [keep]}"
dest="${2:?usage: backup.sh <source-dir> <backup-dir> [keep]}"
keep="${3:-7}"

log() { echo "[$(date '+%F %T')] $*"; }

[[ -d "$src" ]] || { log "source not found: $src" >&2; exit 1; }
mkdir -p "$dest"

name="$(basename "$src")-$(date +%Y%m%d-%H%M%S).tar.gz"
log "creating $dest/$name"
tar -czf "$dest/$name" -C "$(dirname "$src")" "$(basename "$src")"

# Newest first; everything after the first $keep goes.
mapfile -t old < <(ls -1t "$dest"/*.tar.gz | tail -n +"$((keep + 1))")
for f in "${old[@]}"; do
  log "removing old backup $f"
  rm -f -- "$f"
done

log "done, $(ls -1 "$dest"/*.tar.gz | wc -l) backups kept"
```

```python tabs
#!/usr/bin/env python3
"""Usage: backup.py <source-dir> <backup-dir> [keep]"""
import sys, tarfile, time
from datetime import datetime
from pathlib import Path


def log(msg: str) -> None:
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {msg}", flush=True)


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__, file=sys.stderr)
        return 1
    src, dest = Path(sys.argv[1]), Path(sys.argv[2])
    keep = int(sys.argv[3]) if len(sys.argv) > 3 else 7
    if not src.is_dir():
        log(f"source not found: {src}")
        return 1
    dest.mkdir(parents=True, exist_ok=True)

    archive = dest / f"{src.name}-{time.strftime('%Y%m%d-%H%M%S')}.tar.gz"
    log(f"creating {archive}")
    with tarfile.open(archive, "w:gz") as tar:
        tar.add(src, arcname=src.name)

    backups = sorted(dest.glob("*.tar.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
    for old in backups[keep:]:
        log(f"removing old backup {old}")
        old.unlink()
    log(f"done, {min(len(backups), keep)} backups kept")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

```go tabs
// Usage: backup <source-dir> <backup-dir> [keep]
package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"time"
)

func main() {
	log.SetFlags(log.LstdFlags)
	if len(os.Args) < 3 {
		fmt.Fprintln(os.Stderr, "usage: backup <source-dir> <backup-dir> [keep]")
		os.Exit(1)
	}
	src, dest := os.Args[1], os.Args[2]
	keep := 7
	if len(os.Args) > 3 {
		n, err := strconv.Atoi(os.Args[3])
		if err != nil {
			log.Fatalf("keep must be a number: %v", err)
		}
		keep = n
	}
	if fi, err := os.Stat(src); err != nil || !fi.IsDir() {
		log.Fatalf("source not found: %s", src)
	}
	if err := os.MkdirAll(dest, 0o755); err != nil {
		log.Fatal(err)
	}

	name := fmt.Sprintf("%s-%s.tar.gz", filepath.Base(src), time.Now().Format("20060102-150405"))
	archive := filepath.Join(dest, name)
	log.Printf("creating %s", archive)
	tar := exec.Command("tar", "-czf", archive, "-C", filepath.Dir(src), filepath.Base(src))
	tar.Stderr = os.Stderr
	if err := tar.Run(); err != nil {
		log.Fatalf("tar failed: %v", err) // exits with status 1
	}

	backups, _ := filepath.Glob(filepath.Join(dest, "*.tar.gz"))
	sort.Slice(backups, func(i, j int) bool { return modTime(backups[i]).After(modTime(backups[j])) })
	for i, f := range backups {
		if i < keep {
			continue
		}
		log.Printf("removing old backup %s", f)
		if err := os.Remove(f); err != nil {
			log.Fatal(err)
		}
	}
	log.Printf("done, %d backups kept", min(len(backups), keep))
}

func modTime(path string) time.Time {
	fi, err := os.Stat(path)
	if err != nil {
		return time.Time{}
	}
	return fi.ModTime()
}
```

Run it:

```bash
mkdir -p ~/lab/site && echo "hello" > ~/lab/site/index.html
chmod +x backup.sh
./backup.sh ~/lab/site ~/lab/backups 3
```

```text
[2026-11-01 10:41:07] creating /home/tania/lab/backups/site-20261101-104107.tar.gz
[2026-11-01 10:41:07] done, 1 backups kept
```

Run it a few times (at least a second apart each time), and from the fourth run you'll see the old ones being deleted, with exactly 3 left. Now make a mistake on purpose: `./backup.sh /nope ~/lab/backups`, then `echo $?`. You'll get `1`. That number is what monitoring watches.

Finally, put it in cron (from the last chapter):

```text
30 2 * * * /opt/scripts/backup.sh /srv/app /var/backups/app 7 >> /var/log/backup.log 2>&1
```

> [!tip] Poke at it a little
> Add a `--dry-run` option to the script: when given, it only says what it would delete, without deleting anything. Hint: start with `dry_run=false`, then `if [[ "${1:-}" == "--dry-run" ]]; then dry_run=true; shift; fi`, and where it deletes, `if $dry_run; then log "would remove $f"; else rm -f -- "$f"; fi`. Then run `shellcheck backup.sh` and see whether any warnings come up.

## When to leave Bash behind {#when-not-bash}

Bash is excellent when the job is **gluing other programs together**: run commands, move files, restart services. But when you see these signs, move to Python or Go:

- The script has grown **past 100 lines** and is hard to read.
- You're working with **JSON or YAML**. (For small jobs `jq` is great: `curl -s api/status | jq -r '.version'`, but when it gets complicated, Python.)
- The **error handling** is complicated: retries, timeouts, partial failures.
- You need to write **tests**, or many people will be changing the script.
- It has to run on Windows too.

That's exactly why the Python and Go versions of the backup are given above: the same job, so you can compare for yourself which one is easier to manage as it grows.

## What matters in production {#production}

- **Write idempotent scripts.** Running the same script twice should give the same result, not damage. Habits like `mkdir -p` (does nothing if it exists) and "check whether it's there before adding it". If a deploy breaks halfway, you can safely run it again.
- **Stop two copies running at once.** If a script that cron runs every 5 minutes takes 7 minutes one time, two copies run together. Prevent it with `flock`: `*/5 * * * * flock -n /tmp/sync.lock /opt/scripts/sync.sh`.
- **Log with timestamps.** Like the `log` function above, with the time on every line. It's the only clue to understanding at breakfast what happened at 3 a.m.
- **No secrets in scripts.** Write a password or token straight into a script and it ends up in Git. Read it from an environment variable or a secret manager (coming in later DevOps parts).
- **Scripts are code, so keep them in Git.** Review, history, and CI running ShellCheck. The most mysterious outages come from situations like "there's a script on the server somewhere".

## Recap {#recap}

- A script starts with `#!/usr/bin/env bash`; to run it, `chmod +x` and `./script.sh`.
- Variables: `name="x"` (no spaces around `=`), used as `"$name"` (always quoted). `$(...)` is a command's output, `$((...))` arithmetic, `${VAR:-default}` a default value.
- `$1 $2` are arguments, `$#` the count, `"$@"` all of them.
- Exit code `0` means success, anything else failure. cron, systemd and CI all watch it. `&&` runs on success, `||` on failure.
- `if [[ ]]`, `for`, `while IFS= read -r`, `case`, and functions with `local`.
- `set -euo pipefail` at the start of every script. `${VAR:?}` before deleting, `trap ... EXIT` to clean up at the end, and `shellcheck`.
- Bash is for gluing. For big jobs, JSON-heavy ones, or ones that need tests: Python or Go.

## Check yourself {#quiz}

**1.** What error do you get from `greeting = "hello"`, and why?

> [!tip]- Answer
> An error like `greeting: command not found`. Because there are spaces around `=`, Bash doesn't treat it as a variable assignment; it tries to run a command called `greeting`, with `=` and `"hello"` as two arguments. The right way: `greeting="hello"`.

**2.** A script written without `set -e` has a line `cp config.yml /etc/app/` that fails. What happens next? And with `set -e`?

> [!tip]- Answer
> Without `set -e`, Bash shows an error message and carries on to the next line as if nothing happened. The next line might restart the service with an old or missing config, and the script may even return `0` at the end. With `set -e`, the script stops the moment `cp` fails and returns a non-zero exit code, so cron or CI finds out something broke.

**3.** What dangers are in the line `rm -rf $DIR/*`? Write it safely.

> [!tip]- Answer
> Two dangers. First, if `DIR` is unset or empty it becomes `rm -rf /*`, an attempt to wipe the whole server. Second, without quotes, if `DIR` contains a space Bash treats it as several separate paths and may delete the wrong things. The safe form: `rm -rf -- "${DIR:?}"/*`. `${DIR:?}` stops the script if it's empty, the quotes keep the name in one piece, and `--` makes sure a file name starting with `-` isn't taken as an option.

**4.** `curl -s https://example.com/data.json | jq '.items'` ran, `curl` failed (no network), but `$?` shows `0`. Why? How do you fix it?

> [!tip]- Answer
> By default, a pipe's exit code is that of the **last** command, here `jq`. `jq` finished successfully even with empty input, so `0`. With `set -o pipefail`, the whole pipe counts as failed if any part fails. Add `curl -f` too, so curl itself fails on HTTP errors (400/500).

**5.** A cron script runs every minute and sometimes takes two minutes. What can go wrong, and how do you prevent it?

> [!tip]- Answer
> The next run starts before the previous one has finished, so the same job runs twice at once: two writers on the same file, the same row processed twice, or the server's load climbing. Run it with `flock -n /tmp/job.lock /path/to/script.sh`: if someone holds the lock, the new one quietly exits. At the same time, ask whether it really needs to run that often.

**6.** The backup script above has one big weakness: the backups and the real data are on the same server. If the server's disk dies, both are gone. How would you improve it?

> [!tip]- Hint
> Send the backups somewhere else. The simple way: at the end, `rsync -a "$dest/" backup-host:/backups/app/`, or upload to cloud storage (`aws s3 cp "$dest/$name" s3://my-backups/app/`, coming in the cloud chapter). The good rule is called **3-2-1**: 3 copies, in 2 kinds of storage, 1 in another location. And remember: a backup you've never restored from is a backup you don't know works. Test a restore now and then.

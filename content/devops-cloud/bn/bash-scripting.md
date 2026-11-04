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

## শুরুর আগে একটা গল্প {#story}

প্রতি শুক্রবার রাতে তানিয়া একটা release দেয়। ধাপগুলো তার মুখস্থ: code নামাও, test চালাও, পুরোনো version এর backup নাও, নতুন version বসাও, service restart দাও, site খুলে দেখো। আটটা ধাপ, প্রতিবার হাতে।

এক শুক্রবার, রাত অনেক, ক্লান্ত। সে চার নম্বর ধাপ, backup নেওয়াটা, ভুলে গেল। নতুন version এ একটা bug ছিল। ফেরত যাওয়ার মতো কিছু ছিল না।

সমস্যাটা তানিয়ার না। সমস্যা হলো **মানুষ একই কাজ বারবার নিখুঁতভাবে করতে পারে না**। Computer পারে। একটা recipe card লিখে রাখলে যে কেউ, যেকোনো সময়, একই রান্না একই ভাবে করতে পারে। DevOps এ সেই recipe card এর নাম **script**।

আগের তিনটা chapter এ তুমি যা শিখেছো (command, pipe, permission, service), সব এক জায়গায় জোড়া লাগে এখানে। এই chapter শেষে তুমি:

- একটা Bash script লিখে চালাতে পারবে।
- Variable, condition, loop আর function ব্যবহার করতে পারবে।
- **Exit code** কী, আর script কীভাবে বলে সে সফল হলো কিনা, সেটা বুঝবে।
- `set -euo pipefail` দিয়ে script কে নিরাপদ করতে পারবে, আর quoting এর যে ভুল production এ data মুছে দেয়, সেটা এড়াতে পারবে।
- একটা আসল backup script বানাবে, যেটা cron দিয়ে প্রতিদিন চলতে পারে।
- কখন Bash ছেড়ে Python বা Go তে যাওয়া উচিত, সেটা জানবে।

## প্রথম script {#first-script}

একটা file বানাও `hello.sh`:

```bash
#!/usr/bin/env bash
# আমার প্রথম script
echo "Hello from $(hostname)"
echo "Today is $(date +%A)"
```

তারপর চালানোর অনুমতি দাও আর চালাও:

```bash
chmod +x hello.sh
./hello.sh
```

```text
Hello from web-01
Today is Saturday
```

প্রথম লাইন `#!/usr/bin/env bash` এর নাম **shebang**। এটা kernel কে বলে, "এই file টা `bash` দিয়ে চালাও"। এটা না দিলে file টা হয়তো অন্য কোনো shell এ চলবে, আর Bash এর কিছু জিনিস কাজ করবে না।

`./hello.sh` এর `./` মানে "এই folder এর hello.sh"। Linux নিরাপত্তার জন্য এখনকার folder এ program খোঁজে না, তাই এটা লিখতে হয়।

## Variable {#variables}

```bash
name="Tania"
count=3
echo "Hello, $name. You have $count releases this week."
```

তিনটা নিয়ম, যেগুলো ভাঙলে অদ্ভুত error আসে:

1. **`=` এর দুই পাশে কোনো ফাঁকা জায়গা না।** `name = "Tania"` লিখলে Bash মনে করে `name` একটা command।
2. **Variable ব্যবহারের সময় সবসময় double quote এ রাখো:** `"$name"`। কেন, সেটা একটু পরে safety অংশে দেখবে, এটাই সবচেয়ে জরুরি নিয়ম।
3. **নামের পরে অক্ষর থাকলে `{}` দাও:** `"${name}_backup"`, না হলে Bash `$name_backup` নামে variable খুঁজবে।

কাজের কয়েকটা রূপ:

```bash
today=$(date +%F)                 # command এর output variable এ (2026-11-01)
files=$(ls /var/log | wc -l)
total=$(( count * 2 + 1 ))        # অংক
dir="${BACKUP_DIR:-/var/backups}" # BACKUP_DIR না থাকলে default মান
```

### Script এ input: argument {#arguments}

```bash
./deploy.sh shop production
```

Script এর ভেতরে:

| Variable | মান |
| --- | --- |
| `$0` | Script এর নাম (`./deploy.sh`) |
| `$1`, `$2` | প্রথম, দ্বিতীয় argument (`shop`, `production`) |
| `$#` | কয়টা argument (`2`) |
| `"$@"` | সবগুলো argument, প্রতিটা আলাদা ভাবে |

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

খেয়াল করো `>&2`: usage এর বার্তাটা stderr এ যাচ্ছে, কারণ এটা একটা error।

## Exit code: সফল হলো কিনা {#exit-codes}

প্রতিটা command শেষ হলে একটা সংখ্যা ফেরত দেয়, তার নাম **exit code**। নিয়ম খুব সহজ:

- **`0` মানে সফল।**
- **অন্য যেকোনো সংখ্যা মানে কোনো সমস্যা।**

শেষ command এর exit code থাকে `$?` এ:

```bash
ls /etc > /dev/null
echo $?        # 0
ls /nope 2> /dev/null
echo $?        # 2
```

এটা জানা জরুরি কারণ cron, systemd, CI pipeline, monitoring, সবাই exit code দেখেই বোঝে তোমার script সফল হলো কিনা। তোমার script সবসময় `0` ফেরত দিলে, ভাঙলেও কেউ জানবে না।

Exit code দিয়ে command জোড়া লাগানো যায়:

```bash
make test && make deploy          # test সফল হলেই deploy
ping -c1 db.internal || echo "DB unreachable" >&2   # ব্যর্থ হলে বার্তা
```

## Condition {#conditions}

```bash
if [[ -f /etc/nginx/nginx.conf ]]; then
  echo "Nginx config found"
elif [[ -d /etc/nginx ]]; then
  echo "Folder exists but no config"
else
  echo "Nginx not installed"
fi
```

`[[ ... ]]` এর ভেতরে সবচেয়ে বেশি লাগে এগুলো:

| পরীক্ষা | মানে |
| --- | --- |
| `-f path` | File আছে |
| `-d path` | Folder আছে |
| `-z "$var"` | Variable খালি |
| `-n "$var"` | Variable খালি না |
| `"$a" == "$b"` | Text সমান |
| `$x -gt 10` | সংখ্যা বড় (`-lt` ছোট, `-eq` সমান, `-ge`, `-le`) |

আর যেকোনো command সরাসরি `if` এ বসানো যায়, তার exit code ই শর্ত:

```bash
if systemctl is-active --quiet nginx; then
  echo "nginx is running"
fi
```

## Loop {#loops}

```bash
# একটা তালিকার ওপর
for server in web-01 web-02 web-03; do
  echo "Checking $server"
  ssh "$server" uptime
done

# File এর ওপর
for f in /var/log/nginx/*.log; do
  echo "$f: $(wc -l < "$f") lines"
done

# একটা file লাইন ধরে ধরে পড়া
while IFS= read -r host; do
  echo "Pinging $host"
done < hosts.txt
```

`while IFS= read -r line` টা মুখস্থ করে রাখো। `-r` backslash কে বদলাতে দেয় না, আর `IFS=` লাইনের শুরুর ফাঁকা জায়গা রেখে দেয়। File লাইন ধরে পড়ার এটাই নিরাপদ উপায়।

অনেক রকম মানের জন্য `case`:

```bash
case "$env" in
  production) replicas=3 ;;
  staging)    replicas=1 ;;
  *)          echo "Unknown env: $env" >&2; exit 1 ;;
esac
```

## Function {#functions}

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

`local` দিলে variable টা শুধু function এর ভেতরে থাকে, বাইরের কোনো variable কে ভুল করে বদলে দেয় না। Function ও exit code ফেরত দেয়: শেষ command এর টা, অথবা `return 1` লিখে নিজে।

## নিরাপত্তা: যে ভুলগুলো data মুছে দেয় {#safety}

Bash এর default আচরণ খুব "ক্ষমাশীল"। কোনো command fail করলেও পরের লাইনে চলে যায়। না থাকা variable কে চুপচাপ খালি ধরে নেয়। এই ক্ষমাশীলতাই production এ বিপদ।

একটা বাস্তব ধরনের ভুল দেখো:

```bash
#!/usr/bin/env bash
cd "$DEPLOY_DIR"
rm -rf ./*
```

`DEPLOY_DIR` যদি set না থাকে? `cd ""` কিছুই করে না, তুমি থেকে যাও যেখানে ছিলে, হয়তো তোমার home folder এ। তারপর `rm -rf ./*`। আর যদি `cd` fail করে (folder নেই)? Bash তবুও পরের লাইনে যায়।

সমাধান হলো প্রতিটা script এর শুরুতে এই একটা লাইন:

```bash
set -euo pipefail
```

| অংশ | কী করে |
| --- | --- |
| `-e` | কোনো command fail করলে (exit code ০ না) script সেখানেই থামবে |
| `-u` | Set না থাকা variable ব্যবহার করলে error দিয়ে থামবে |
| `-o pipefail` | Pipe এর যেকোনো অংশ fail করলে পুরো pipe কে fail ধরবে (default এ শুধু শেষ অংশ দেখা হয়) |

```diagram
strict-mode
একই script দুইবার চলে। বামে কোনো সুরক্ষা নেই: একটা ধাপ fail করলেও script এগিয়ে যায় আর ভুল folder মুছে দেয়। ডানে set -euo pipefail: প্রথম ভুলেই থেমে যায়।
```

আরো তিনটা সুরক্ষা:

**১. সবসময় quote দাও।** File এর নামে ফাঁকা জায়গা থাকলে কী হয় দেখো:

```bash
file="my report.txt"
rm $file       # মুছতে চেষ্টা করবে "my" আর "report.txt", দুটো আলাদা file!
rm "$file"     # ঠিক: একটা file, "my report.txt"
```

**২. মোছার আগে variable খালি কিনা নিশ্চিত করো।** `${VAR:?}` variable খালি বা না থাকলে error দিয়ে থামে:

```bash
rm -rf "${BUILD_DIR:?}/"*     # BUILD_DIR খালি হলে কখনো "/" মুছবে না
```

**৩. যাই হোক, শেষে পরিষ্কার করো।** `trap` দিয়ে বলা যায় script শেষ হলে (সফল বা ব্যর্থ) কী চালাতে হবে:

```bash
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
# এখন $tmp এ যা খুশি করো, script যেভাবেই শেষ হোক, মুছে যাবে
```

> [!tip] ShellCheck ব্যবহার করো
> `shellcheck` একটা ছোট tool, যেটা তোমার script পড়ে quote না দেওয়া variable, ভুল শর্ত, আর এরকম শত শত সাধারণ ভুল ধরিয়ে দেয়। `sudo apt install shellcheck`, তারপর `shellcheck deploy.sh`। VS Code এর extension ও আছে। CI তে বসালে কেউ বিপজ্জনক script merge করতে পারবে না।

## নিজের হাতে: একটা আসল backup script {#hands-on}

এবার সব জোড়া লাগাও। আমরা এমন একটা script বানাবো যেটা:

1. একটা folder কে তারিখ সহ `.tar.gz` এ backup করে।
2. শুধু শেষ ৭টা backup রাখে, পুরোনোগুলো মুছে ফেলে।
3. প্রতিটা ধাপ সময় সহ log করে।
4. কিছু ভুল হলে non-zero exit code দেয়, যাতে cron বা monitoring জানতে পারে।

`backup.sh` (একই কাজ Python আর Go তেও পাশাপাশি দেওয়া আছে, tab বদলে দেখো):

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

চালিয়ে দেখো:

```bash
mkdir -p ~/lab/site && echo "hello" > ~/lab/site/index.html
chmod +x backup.sh
./backup.sh ~/lab/site ~/lab/backups 3
```

```text
[2026-11-01 10:41:07] creating /home/tania/lab/backups/site-20261101-104107.tar.gz
[2026-11-01 10:41:07] done, 1 backups kept
```

কয়েকবার চালাও (প্রতিবার অন্তত এক সেকেন্ড পর), দেখবে চতুর্থবার থেকে পুরোনোগুলো মুছে যাচ্ছে আর ঠিক ৩টা থাকছে। এবার ইচ্ছা করে ভুল করো: `./backup.sh /nope ~/lab/backups`, তারপর `echo $?`। `1` আসবে। Monitoring এই সংখ্যাটাই দেখে।

শেষে cron এ বসাও (আগের chapter):

```text
30 2 * * * /opt/scripts/backup.sh /srv/app /var/backups/app 7 >> /var/log/backup.log 2>&1
```

> [!tip] নিজে একটু খোঁচাও
> Script এ একটা `--dry-run` option যোগ করো: দিলে শুধু বলবে কী কী মুছতো, আসলে মুছবে না। Hint: শুরুতে `dry_run=false`, তারপর `if [[ "${1:-}" == "--dry-run" ]]; then dry_run=true; shift; fi`, আর মোছার জায়গায় `if $dry_run; then log "would remove $f"; else rm -f -- "$f"; fi`। এরপর `shellcheck backup.sh` চালিয়ে দেখো কোনো সতর্কতা আসে কিনা।

## কখন Bash ছেড়ে দেবে {#when-not-bash}

Bash অসাধারণ যখন কাজটা হলো **অন্য program গুলোকে জোড়া লাগানো**: command চালাও, file সরাও, service restart দাও। কিন্তু কিছু লক্ষণ দেখলে Python বা Go তে যাও:

- Script **১০০ লাইনের বেশি** হয়ে গেছে, আর পড়তে কষ্ট হচ্ছে।
- **JSON বা YAML** নিয়ে কাজ করতে হচ্ছে। (ছোট কাজে `jq` দারুণ: `curl -s api/status | jq -r '.version'`, কিন্তু জটিল হলে Python।)
- **Error handling** জটিল: retry, timeout, আংশিক ব্যর্থতা।
- **Test** লিখতে হবে, বা অনেক মানুষ মিলে script টা বদলাবে।
- Windows এও চলতে হবে।

উপরের backup এর Python আর Go version এই কারণেই দেওয়া: একই কাজ, কিন্তু বড় হলে কোনটা সামলানো সহজ, নিজেই তুলনা করে দেখো।

## Production এ যা যা কাজে লাগে {#production}

- **Idempotent script লেখো।** একই script দুইবার চালালে একই ফল হওয়া উচিত, ক্ষতি না। `mkdir -p` (থাকলে কিছু করে না), "যোগ করার আগে আছে কিনা দেখো", এই ধরনের অভ্যাস। Deploy মাঝপথে ভাঙলে নিশ্চিন্তে আবার চালানো যায়।
- **একসাথে দুইবার চলা আটকাও।** cron এ প্রতি ৫ মিনিটে চলা একটা script যদি একবার ৭ মিনিট নেয়, দুইটা copy একসাথে চলবে। `flock` দিয়ে এটা আটকাও: `*/5 * * * * flock -n /tmp/sync.lock /opt/scripts/sync.sh`।
- **সময় সহ log।** উপরের `log` function এর মতো, প্রতিটা লাইনে সময়। রাত তিনটার ঘটনা সকালে বুঝতে এটাই একমাত্র সূত্র।
- **Secret script এ না।** Password বা token সরাসরি script এ লিখলে সেটা Git এ চলে যায়। Environment variable বা secret manager থেকে পড়ো (DevOps এর পরের part গুলোতে আসছে)।
- **Script ও code, তাই Git এ রাখো।** Review, history, আর ShellCheck চালানো CI। "সার্ভারে কোথাও একটা script আছে" ধরনের অবস্থা থেকেই সবচেয়ে বড় রহস্যময় outage গুলো আসে।

## এক নজরে {#recap}

- Script শুরু হয় `#!/usr/bin/env bash` দিয়ে, চালাতে `chmod +x` আর `./script.sh`।
- Variable: `name="x"` (`=` এর পাশে ফাঁকা না), ব্যবহার `"$name"` (সবসময় quote)। `$(...)` command এর output, `$((...))` অংক, `${VAR:-default}` default মান।
- `$1 $2` argument, `$#` সংখ্যা, `"$@"` সবগুলো।
- Exit code `0` মানে সফল, বাকি সব ব্যর্থ। cron, systemd, CI সবাই এটা দেখে। `&&` সফল হলে চালায়, `||` ব্যর্থ হলে।
- `if [[ ]]`, `for`, `while IFS= read -r`, `case`, আর `local` সহ function।
- প্রতিটা script এর শুরুতে `set -euo pipefail`। মোছার আগে `${VAR:?}`, শেষে পরিষ্কারের জন্য `trap ... EXIT`, আর `shellcheck`।
- Bash জোড়া লাগানোর জন্য। বড়, JSON-ভারী, বা test লাগে এমন কাজে Python বা Go।

## নিজেকে যাচাই করো {#quiz}

**১.** `greeting = "hello"` লিখলে কী error আসবে, আর কেন?

> [!tip]- উত্তর
> `greeting: command not found` ধরনের error। `=` এর দুই পাশে ফাঁকা জায়গা থাকায় Bash এটাকে variable assignment না ভেবে `greeting` নামের একটা command চালানোর চেষ্টা করে, যাকে `=` আর `"hello"` দুইটা argument দেওয়া হয়েছে। ঠিক লেখা: `greeting="hello"`।

**২.** একটা script `set -e` ছাড়া লেখা, তার একটা লাইন `cp config.yml /etc/app/` fail করলো। তারপর কী হবে? আর `set -e` থাকলে?

> [!tip]- উত্তর
> `set -e` ছাড়া Bash error message দেখিয়ে পরের লাইনে চলে যায়, যেন কিছুই হয়নি। পরের লাইন হয়তো service restart দেয়, পুরোনো বা না থাকা config নিয়ে, আর শেষে script `0` ও ফেরত দিতে পারে। `set -e` থাকলে `cp` fail করা মাত্রই script থেমে যায়, non-zero exit code দেয়, তাই cron বা CI জানতে পারে কিছু ভেঙেছে।

**৩.** `rm -rf $DIR/*` লাইনটায় কী কী বিপদ আছে? নিরাপদ করে লেখো।

> [!tip]- উত্তর
> দুইটা বিপদ। এক, `DIR` set না থাকলে বা খালি হলে এটা হয়ে যায় `rm -rf /*`, পুরো server মুছে ফেলার চেষ্টা। দুই, quote না থাকায় `DIR` এ ফাঁকা জায়গা থাকলে Bash এটাকে কয়েকটা আলাদা path ধরে ভুল জিনিস মুছতে পারে। নিরাপদ রূপ: `rm -rf -- "${DIR:?}"/*`। `${DIR:?}` খালি হলে script থামিয়ে দেয়, quote নামটাকে এক টুকরো রাখে, আর `--` নিশ্চিত করে `-` দিয়ে শুরু হওয়া file এর নামকে option ভাবা হবে না।

**৪.** `curl -s https://example.com/data.json | jq '.items'` চালানো হলো, `curl` fail করলো (network নেই), কিন্তু `$?` দেখাচ্ছে `0`। কেন? ঠিক করবে কীভাবে?

> [!tip]- উত্তর
> Default এ pipe এর exit code হয় **শেষ** command এর, এখানে `jq` এর। খালি input পেয়েও `jq` সফলভাবে শেষ হয়েছে, তাই `0`। `set -o pipefail` দিলে pipe এর যেকোনো অংশ fail করলে পুরো pipe fail ধরা হয়। সাথে `curl -f` দিলে HTTP error (৪০০/৫০০) এও curl নিজে fail করে।

**৫.** একটা cron script প্রতি মিনিটে চলে আর কখনো কখনো দুই মিনিট নেয়। কী সমস্যা হতে পারে, আর কীভাবে আটকাবে?

> [!tip]- উত্তর
> আগেরটা শেষ হওয়ার আগেই পরেরটা শুরু হবে, তাই একই কাজ দুইবার একসাথে চলবে: একই file এ দুইজন লিখবে, একই row দুইবার process হবে, বা server এর load বাড়তে থাকবে। `flock -n /tmp/job.lock /path/to/script.sh` দিয়ে চালাও: lock কেউ ধরে রাখলে নতুনটা চুপচাপ বেরিয়ে যাবে। একই সাথে ভাবো, এত ঘন ঘন চালানোর দরকার আছে কিনা।

**৬.** উপরের backup script এ একটা বড় দুর্বলতা আছে: backup আর আসল data একই server এ। Server এর disk নষ্ট হলে দুটোই যাবে। কীভাবে উন্নত করবে?

> [!tip]- Hint
> Backup কে অন্য জায়গায় পাঠাও। সহজ উপায়: শেষে `rsync -a "$dest/" backup-host:/backups/app/` অথবা cloud storage এ upload (`aws s3 cp "$dest/$name" s3://my-backups/app/`, cloud এর chapter এ আসছে)। ভালো নিয়মের নাম **3-2-1**: ৩টা copy, ২ রকম জায়গায়, ১টা অন্য কোনো location এ। আর মনে রাখো, যে backup থেকে কখনো restore করে দেখোনি, সেটা backup কিনা তুমি জানো না। মাঝে মাঝে restore পরীক্ষা করো।

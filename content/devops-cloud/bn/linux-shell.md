---
# id is permanent: progress and XP are tied to it. Never change it.
id: 9f12029b-4bcd-4561-baec-2ec2b1a60653
slug: linux-shell
title: Living in the Terminal
part: linux-for-servers
order: 1
xp: 10
topics: [Shell, Filesystem, Pipes, grep/sed/awk]
updated: 2026-11-01
---

## শুরুর আগে একটা গল্প {#story}

রাত দুইটা। Phone বেজে উঠলো: "Site খুব slow, কিছু user এর page আসছেই না।" তুমি laptop খুললে। তোমার app চলছে Singapore এর একটা data center এ, একটা server এ। সেই server এর কোনো screen নেই, mouse নেই, desktop নেই। আছে শুধু একটা কালো জানালা, যেখানে লেখা:

```text
deploy@web-01:~$
```

এখান থেকেই তোমাকে বের করতে হবে কী হয়েছে। কোন log file এ error আছে, কোন IP থেকে হাজার হাজার request আসছে, disk ভরে গেছে কিনা। Click করার কিছু নেই। যা করবে, লিখে করবে।

এটাই DevOps এর প্রথম সত্য: **production server গুলো terminal দিয়ে চলে।** Cloud এর বেশিরভাগ server Linux, আর সেগুলোতে কোনো graphical interface থাকে না। তাই terminal এ আরাম করে ঘোরাফেরা করতে পারাটা কোনো "advanced skill" না, এটা গাড়ি চালানো শেখার আগে steering ধরতে শেখার মতো।

ভালো খবর হলো, terminal দেখতে ভয়ের হলেও এর নিয়ম খুব কম আর খুব সোজা। এই chapter শেষে তুমি:

- Terminal, shell আর kernel এর পার্থক্য বুঝবে।
- Linux এর filesystem এ কোন জিনিস কোথায় থাকে, সেটা জানবে।
- File আর folder বানানো, দেখা, সরানো আর মোছা আরামে করতে পারবে।
- **Pipe** দিয়ে ছোট ছোট tool জোড়া লাগিয়ে বড় কাজ করতে পারবে।
- `grep`, `sed`, `awk`, `sort`, `uniq` দিয়ে একটা আসল web server log বিশ্লেষণ করবে।
- Production server এ কোন অভ্যাস তোমাকে বিপদ থেকে বাঁচাবে, সেটা জানবে।

## Terminal, shell আর kernel {#what-is-a-shell}

তিনটা শব্দ প্রায়ই গুলিয়ে যায়:

| শব্দ | কী | উদাহরণ |
| --- | --- | --- |
| **Terminal** | যে জানালায় তুমি লেখো আর লেখা দেখো | GNOME Terminal, iTerm2, Windows Terminal |
| **Shell** | যে program তোমার লেখা command পড়ে, বোঝে, আর চালায় | `bash`, `zsh`, `fish` |
| **Kernel** | OS এর মূল অংশ, যে আসলে file খোলে, program চালায় | Linux kernel |

একটা রেস্টুরেন্টের মতো ভাবো। Terminal হলো order দেওয়ার কাউন্টার। Shell হলো waiter: তোমার কথা শোনে, বুঝে নেয়, রান্নাঘরে পাঠায়। Kernel হলো রান্নাঘর, যেখানে আসল কাজটা হয়। (Kernel নিয়ে বিস্তারিত আছে Operating Systems course এ।)

Shell যে লাইনটা দেখায়, তার নাম **prompt**:

```text
deploy@web-01:~/app$
```

- `deploy`: তুমি কোন user হিসেবে আছো
- `web-01`: কোন machine এ আছো (production এ এটা দেখে নেওয়া খুব জরুরি)
- `~/app`: এখন কোন folder এ আছো (`~` মানে তোমার home folder)
- `$`: সাধারণ user। `#` দেখলে বুঝবে তুমি **root**, মানে সব কিছু করার ক্ষমতা আছে, সাবধান।

> [!warning] কোন server এ আছো, আগে দেখো
> অনেক বড় outage এর শুরু একটাই ভুল: মনে করেছিল staging server এ আছে, আসলে ছিল production এ। Command চালানোর আগে prompt এর hostname টা এক নজর দেখার অভ্যাস করো।

## Filesystem: সব কিছুর শুরু `/` থেকে {#filesystem}

Windows এ আছে `C:`, `D:`। Linux এ আছে একটাই গাছ, যার গোড়া হলো `/` (বলে "root")। সব disk, সব folder, সব device এই এক গাছের কোনো না কোনো ডালে ঝুলে থাকে।

কোন জিনিস কোথায় থাকে, সেটা প্রায় সব Linux এ একই নিয়মে সাজানো:

| Folder | কী থাকে | কখন যাবে |
| --- | --- | --- |
| `/etc` | Configuration file | Nginx, SSH বা কোনো service এর setting বদলাতে |
| `/var/log` | Log file | কিছু ভাঙলে, সবার আগে এখানে |
| `/home/<user>` | User দের নিজস্ব file | তোমার নিজের কাজ, script |
| `/usr/bin`, `/bin` | Program গুলো | `ls`, `grep`, `python3` এখানে থাকে |
| `/opt` | বাইরে থেকে install করা app | কিছু company এর app এখানে বসায় |
| `/tmp` | অস্থায়ী file | Reboot এ প্রায়ই মুছে যায় |
| `/proc` | চলমান process আর kernel এর তথ্য | CPU, memory এর হাল জানতে |
| `/dev` | Device (disk, terminal) | Disk নিয়ে কাজ করতে |

Linux এর একটা বড় idea: **প্রায় সব কিছুই file**। Config একটা file, log একটা file, এমনকি তোমার CPU এর তথ্যও একটা file এর মতো পড়া যায়:

```bash
cat /proc/cpuinfo | head -5
```

এই idea টার জন্যই একই কয়েকটা tool (`cat`, `grep`, `less`) দিয়ে প্রায় সব কিছু দেখা যায়।

## ঘোরাফেরা {#navigation}

```bash
pwd                 # আমি এখন কোথায়? (print working directory)
ls                  # এখানে কী কী আছে
ls -la              # লুকানো file সহ, বিস্তারিত (permission, size, তারিখ)
cd /var/log         # এই folder এ যাও
cd ..               # এক ধাপ উপরে
cd ~                # নিজের home এ (শুধু cd লিখলেও হয়)
cd -                # আগে যেখানে ছিলাম সেখানে ফেরো
```

দুই রকম ঠিকানা আছে:

- **Absolute path** শুরু হয় `/` দিয়ে, যেকোনো জায়গা থেকে একই জিনিস বোঝায়: `/var/log/nginx/access.log`
- **Relative path** শুরু হয় যেখানে আছো সেখান থেকে: `nginx/access.log` (যদি তুমি `/var/log` এ থাকো)

`.` মানে "এই folder", আর `..` মানে "উপরের folder"।

তিনটা অভ্যাস তোমার দিনে ঘণ্টা বাঁচাবে:

- **Tab:** নামের প্রথম কয়েকটা অক্ষর লিখে Tab চাপো, shell বাকিটা পূরণ করে দেবে। দুইবার চাপলে সব মিল দেখাবে। Typo ও কমবে।
- **↑ arrow:** আগের command ফিরিয়ে আনে।
- **Ctrl+R:** পুরোনো command খোঁজো। একটু লিখলেই history থেকে মিল দেখায়। আবার Ctrl+R চাপলে আরো পুরোনোটা।

## File নিয়ে কাজ {#files}

```bash
mkdir -p app/logs        # folder বানাও (-p: মাঝের folder না থাকলে সেটাও)
touch app/notes.txt      # খালি file বানাও
cp app/notes.txt /tmp/   # copy
cp -r app app-backup     # পুরো folder copy (-r: ভেতরের সব সহ)
mv app-backup old-app    # নাম বদলাও বা সরাও (একই command)
rm app/notes.txt         # file মোছো
rm -r old-app            # folder মোছো
```

File এর ভেতরে দেখার জন্য:

```bash
cat file.txt             # পুরোটা একবারে দেখাও (ছোট file এর জন্য)
less /var/log/syslog     # পাতা ধরে দেখো: Space পরের পাতা, / দিয়ে খোঁজো, q দিয়ে বের হও
head -n 20 file.txt      # প্রথম ২০ লাইন
tail -n 50 file.txt      # শেষ ৫০ লাইন
tail -f app.log          # নতুন লাইন আসতেই দেখাও (live log), Ctrl+C দিয়ে থামাও
wc -l file.txt           # কয়টা লাইন
```

> [!danger] `rm` এর কোনো Recycle Bin নেই
> Terminal এ মোছা জিনিস ফেরত আসে না। `rm -rf` (জোর করে, প্রশ্ন না করে, ভেতরের সব সহ) লেখার আগে দুইবার পড়ো। আর `rm -rf /` বা `rm -rf ~/` এর মতো কিছু যদি কোনো blog বা forum থেকে copy করার পরামর্শ দেখো, চালিও না।

### সাহায্য কোথায় পাবে {#help}

কোনো command এর option মনে নেই? মুখস্থ করার দরকার নেই:

```bash
ls --help        # ছোট সারাংশ
man ls           # পুরো manual (q দিয়ে বের হও)
```

`tldr` নামের একটা tool install করলে (`tldr tar`) সবচেয়ে বেশি ব্যবহৃত উদাহরণগুলো সরাসরি দেখায়। নতুনদের জন্য দারুণ।

## Pipe আর redirection: ছোট tool, বড় কাজ {#pipes}

Linux এর সবচেয়ে সুন্দর idea এটা। প্রতিটা tool একটা ছোট কাজ ভালোভাবে করে, আর tool গুলো একে অপরের সাথে জোড়া লাগানো যায়, ঠিক Lego এর মতো।

প্রতিটা program এর তিনটা "নল" থাকে:

| নাম | নম্বর | কী |
| --- | --- | --- |
| **stdin** | 0 | Input যেখান থেকে আসে (সাধারণত keyboard) |
| **stdout** | 1 | সাধারণ output যেখানে যায় (সাধারণত screen) |
| **stderr** | 2 | Error message যেখানে যায় (এটাও screen, কিন্তু আলাদা নল) |

এই নলগুলো ঘুরিয়ে দেওয়া যায়:

```bash
ls -la > files.txt          # output screen এ না, file এ লেখো (পুরোনো লেখা মুছে)
echo "done" >> run.log      # file এর শেষে যোগ করো
python3 app.py 2> errors.log    # শুধু error গুলো file এ
python3 app.py > all.log 2>&1   # output আর error, দুটোই একই file এ
```

আর সবচেয়ে শক্তিশালী হলো **pipe** `|`: একটা program এর stdout সরাসরি পরের program এর stdin এ ঢুকিয়ে দেয়।

```bash
cat access.log | grep " 500 " | wc -l
```

এটা পড়ো বাম থেকে ডানে: log টা পড়ো, শুধু যে লাইনে 500 আছে সেগুলো রাখো, তারপর গোনো। কোনো অস্থায়ী file লাগলো না।

```diagram
pipe-flow
লাইনগুলো pipe দিয়ে এক tool থেকে পরের tool এ যায়। প্রতিটা ধাপ কিছু লাইন ছেঁকে ফেলে বা বদলায়, শেষে বাকি থাকে শুধু উত্তরটা।
```

## পাঁচটা power tool {#power-tools}

Log পড়া, config খোঁজা, data বের করা, DevOps এর রোজকার কাজের বেশিরভাগই এই কয়েকটা tool দিয়ে হয়।

### `grep`: খোঁজো {#grep}

```bash
grep "ERROR" app.log            # যে লাইনে ERROR আছে
grep -i "error" app.log         # বড়-ছোট হাতের অক্ষর না মেনে
grep -n "timeout" app.log       # লাইন নম্বর সহ
grep -v "healthcheck" access.log    # যে লাইনে healthcheck নেই (উল্টো)
grep -r "DATABASE_URL" /etc/myapp/  # পুরো folder জুড়ে খোঁজো
grep -E "500|502|503" access.log    # কয়েকটার যেকোনো একটা (regex)
```

### `sort` আর `uniq`: সাজাও আর গোনো {#sort-uniq}

`uniq` শুধু **পাশাপাশি** একই লাইনগুলো এক করে, তাই আগে `sort` করতে হয়:

```bash
sort ips.txt | uniq -c | sort -rn | head
```

মানে: সাজাও, একই গুলো গুনে এক করো, সংখ্যা অনুযায়ী বড় থেকে ছোট সাজাও, প্রথম ১০টা দেখাও। "সবচেয়ে বেশি কী" ধরনের প্রায় সব প্রশ্নের উত্তর এই এক লাইন।

### `awk`: column বের করো {#awk}

`awk` প্রতিটা লাইনকে ফাঁকা জায়গা ধরে column এ ভাগ করে। `$1` প্রথম column, `$2` দ্বিতীয়, এভাবে।

```bash
awk '{print $1}' access.log                 # শুধু প্রথম column (IP)
awk '$9 >= 500 {print $7}' access.log       # যেখানে ৯ নম্বর column 500 বা বেশি, সেখানে ৭ নম্বর দেখাও
```

### `sed`: বদলাও {#sed}

```bash
sed 's/staging/production/' config.txt       # প্রতিটা লাইনের প্রথম staging কে production করো (screen এ দেখায়)
sed -i 's/DEBUG=true/DEBUG=false/' .env       # file এর ভেতরেই বদলে দাও (-i)
```

> [!warning] `sed -i` সরাসরি file বদলায়
> আগে `-i` ছাড়া চালিয়ে output দেখো, ঠিক থাকলে তারপর `-i` দাও। অথবা `sed -i.bak ...` লিখলে আসল file এর একটা `.bak` copy থেকে যায়।

### `find`: file খুঁজে বের করো {#find}

```bash
find /var/log -name "*.log"                  # নাম ধরে
find /tmp -type f -mtime +7                  # ৭ দিনের বেশি পুরোনো file
find / -type f -size +500M 2>/dev/null       # ৫০০ MB এর বড় file (error গুলো ফেলে দিয়ে)
```

শেষেরটা খেয়াল করো: `2>/dev/null` মানে error গুলো (যেমন "Permission denied") একটা কালো গর্তে ফেলে দাও। `/dev/null` এ যা লেখো, হারিয়ে যায়।

## নিজের হাতে: একটা আসল log বিশ্লেষণ {#hands-on}

এবার রাত দুইটার সেই সমস্যায় ফিরি। নিচের command টা চালিয়ে একটা নমুনা Nginx log বানাও। (Linux, macOS বা Windows এর WSL, যেকোনোটায় চলবে।)

```bash
mkdir -p ~/lab && cd ~/lab
cat > access.log <<'EOF'
203.0.113.7 - - [01/Nov/2026:02:01:10 +0600] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0"
203.0.113.7 - - [01/Nov/2026:02:01:11 +0600] "GET /login HTTP/1.1" 200 1024 "-" "Mozilla/5.0"
198.51.100.23 - - [01/Nov/2026:02:01:12 +0600] "POST /api/orders HTTP/1.1" 500 87 "-" "okhttp/4.12"
198.51.100.23 - - [01/Nov/2026:02:01:12 +0600] "POST /api/orders HTTP/1.1" 500 87 "-" "okhttp/4.12"
192.0.2.55 - - [01/Nov/2026:02:01:13 +0600] "GET /healthz HTTP/1.1" 200 2 "-" "kube-probe/1.30"
198.51.100.23 - - [01/Nov/2026:02:01:14 +0600] "POST /api/orders HTTP/1.1" 502 157 "-" "okhttp/4.12"
203.0.113.9 - - [01/Nov/2026:02:01:15 +0600] "GET /products HTTP/1.1" 200 4096 "-" "Mozilla/5.0"
198.51.100.23 - - [01/Nov/2026:02:01:16 +0600] "POST /api/orders HTTP/1.1" 500 87 "-" "okhttp/4.12"
192.0.2.55 - - [01/Nov/2026:02:01:18 +0600] "GET /healthz HTTP/1.1" 200 2 "-" "kube-probe/1.30"
EOF
```

এই format এ (Nginx এর default "combined" format) column গুলো হলো: `$1` IP, `$7` path, `$9` status code।

**প্রশ্ন ১: কয়টা request fail করেছে (5xx)?**

```bash
awk '$9 >= 500' access.log | wc -l
```

```text
4
```

**প্রশ্ন ২: কোন path এ error হচ্ছে?**

```bash
awk '$9 >= 500 {print $7}' access.log | sort | uniq -c | sort -rn
```

```text
      4 /api/orders
```

**প্রশ্ন ৩: কোন IP সবচেয়ে বেশি request পাঠাচ্ছে? (healthcheck বাদ দিয়ে)**

```bash
grep -v healthz access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -3
```

```text
      4 198.51.100.23
      2 203.0.113.7
      1 203.0.113.9
```

তিনটা লাইনে তুমি জেনে গেলে: সমস্যা `/api/orders` এ, আর সেটা আসছে একটা mobile app (`okhttp`) থেকে। এখন তুমি জানো কোন service এর log খুলতে হবে। Dashboard বা কোনো tool ছাড়াই।

> [!tip] নিজে একটু খোঁচাও
> একটা লাইনে বের করো প্রতিটা status code কতবার এসেছে: `awk '{print $9}' access.log | sort | uniq -c`। তারপর চেষ্টা করো শুধু `POST` request গুলোর মোট bytes (`$10`) যোগ করতে। Hint: `awk` এ যোগ করা যায়, `awk '{s += $10} END {print s}'`।

## Production এ যা যা কাজে লাগে {#production}

- **বড় file এ `cat` না, `less` বা `tail`।** কয়েক GB এর log এ `cat` চালালে terminal আটকে যায়। `less` দরকার মতো পড়ে, আর `tail -n 100` শুধু শেষটুকু।
- **পুরোনো log প্রায়ই compressed থাকে।** `app.log.3.gz` এর মতো file এ সরাসরি খুঁজতে `zgrep "ERROR" app.log.3.gz`, দেখতে `zless`।
- **SSH কেটে গেলে চলমান কাজও কেটে যায়।** লম্বা কাজ (বড় backup, migration) চালানোর আগে `tmux` বা `screen` খোলো। Connection গেলেও কাজ চলতে থাকবে, পরে আবার ঢুকে দেখতে পারবে।
- **Copy-paste করা command চালানোর আগে পড়ো।** বিশেষ করে `curl ... | bash` এর মতো কিছু, যা internet থেকে script নামিয়ে সরাসরি চালায়। আগে script টা খুলে দেখো।
- **Disk ভরা প্রায়ই log এর জন্য।** `df -h` দিয়ে দেখো কোন disk কত ভরা, `du -sh /var/log/*` দিয়ে দেখো কে জায়গা খাচ্ছে। ভরা disk এ database আর app অদ্ভুত ভাবে ভাঙে।
- **একই কাজ বারবার করলে script লেখো।** Pipe দিয়ে বানানো লাইনগুলো পরে script এ বসানো যায়। সেটাই এই part এর শেষ chapter।

## এক নজরে {#recap}

- Terminal হলো জানালা, shell (যেমন `bash`) হলো command পড়ে চালানোর program, kernel আসল কাজ করে।
- Prompt দেখে বুঝবে কোন user, কোন machine, কোন folder। `#` মানে root।
- Linux এ একটাই গাছ, শুরু `/` থেকে। Config `/etc` এ, log `/var/log` এ, program `/usr/bin` এ।
- প্রায় সব কিছুই file, তাই একই কয়েকটা tool দিয়ে প্রায় সব দেখা যায়।
- `>` output কে file এ পাঠায়, `>>` যোগ করে, `2>` error পাঠায়, `|` এক program এর output পরের program এ দেয়।
- `grep` খোঁজে, `awk` column বের করে, `sort | uniq -c | sort -rn` গোনে, `sed` বদলায়, `find` file খোঁজে।
- Production এ: `less`/`tail` বড় file এর জন্য, `tmux` লম্বা কাজের জন্য, আর `rm` এর আগে দুইবার ভাবো।

## নিজেকে যাচাই করো {#quiz}

**১.** Prompt এ `root@db-prod-02:/var/lib/postgresql#` দেখলে তুমি তিনটা কী জিনিস জানতে পারো? কোনটা নিয়ে সবচেয়ে সাবধান হবে?

> [!tip]- উত্তর
> তুমি `root` user (সব ক্ষমতা আছে, `#` চিহ্নও সেটাই বলে), machine এর নাম `db-prod-02` (একটা production database server), আর এখন আছো `/var/lib/postgresql` এ, যেখানে database এর data থাকে। এখানে root হিসেবে একটা ভুল `rm` মানে production data হারানো। তাই এখানে প্রতিটা command দুইবার পড়ে চালাবে।

**২.** একটা app এর error log কোথায় থাকতে পারে, আর তার setting কোথায়? কোনো app এর ক্ষেত্রে নিশ্চিত না হলে কী দিয়ে খুঁজবে?

> [!tip]- উত্তর
> Log সাধারণত `/var/log/<app>/` এ, setting `/etc/<app>/` এ। নিশ্চিত না হলে `find / -name "*.log" -path "*myapp*" 2>/dev/null` বা `grep -r "myapp" /etc/ 2>/dev/null` দিয়ে খুঁজতে পারো। systemd দিয়ে চলা service হলে `journalctl -u myapp` ও দেখবে (তৃতীয় chapter এ বিস্তারিত)।

**৩.** `python3 app.py > out.log` চালানোর পর error গুলো তবুও screen এ আসছে, file এ যাচ্ছে না। কেন? ঠিক করবে কীভাবে?

> [!tip]- উত্তর
> `>` শুধু stdout (নম্বর 1) কে file এ পাঠায়। Error যায় stderr (নম্বর 2) দিয়ে, সেটা এখনো screen এ। দুটোই file এ পাঠাতে `python3 app.py > out.log 2>&1` লেখো। মানে: stdout যাও `out.log` এ, আর stderr যাও সেখানেই যেখানে stdout যাচ্ছে।

**৪.** `uniq -c ips.txt` চালালে একই IP কয়েক জায়গায় আলাদা আলাদা গোনা হচ্ছে। সমস্যা কী?

> [!tip]- উত্তর
> `uniq` শুধু পাশাপাশি থাকা একই লাইনগুলোকে এক করে। IP গুলো ছড়ানো থাকলে একই IP আলাদা দলে গোনা হয়। আগে `sort` করো, যাতে একই গুলো পাশাপাশি আসে: `sort ips.txt | uniq -c`।

**৫.** উপরের lab এর log থেকে একটা লাইনের command লেখো, যেটা বলবে কোন IP গুলো থেকে 5xx error এসেছে আর প্রতিটা থেকে কয়টা।

> [!tip]- উত্তর
> `awk '$9 >= 500 {print $1}' access.log | sort | uniq -c | sort -rn`। প্রথমে শুধু 5xx লাইনের IP বের হয়, তারপর সাজিয়ে গোনা হয়, শেষে বেশি থেকে কম সাজানো হয়। Lab এর log এ উত্তর আসবে `4 198.51.100.23`।

**৬.** তোমার server এর disk ৯৮% ভরা। কোন দুইটা command দিয়ে শুরু করবে, আর কী খুঁজবে?

> [!tip]- Hint
> প্রথমে `df -h`: কোন disk বা partition ভরা সেটা দেখো। তারপর সেই জায়গায় `du -sh /var/log/* | sort -h` (বা `/var/lib/*`, `/tmp/*`) দিয়ে দেখো কোন folder সবচেয়ে বড়। বেশিরভাগ সময় দোষী হয় rotate না হওয়া log, পুরোনো Docker image (`docker system df`), বা ভুলে ফেলে রাখা backup file। মোছার আগে নিশ্চিত হও file টা কোনো চলমান app এখনো লিখছে না।

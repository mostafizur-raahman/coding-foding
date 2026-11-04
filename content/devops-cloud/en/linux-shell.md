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

## A story first {#story}

2 a.m. Your phone rings: "The site is really slow, and some users can't load pages at all." You open your laptop. Your app runs on a server in a data centre in Singapore. That server has no screen, no mouse, no desktop. All it has is a black window that says:

```text
deploy@web-01:~$
```

From here you have to work out what's wrong. Which log file has the error, which IP is sending thousands of requests, whether the disk is full. There's nothing to click. Whatever you do, you do by typing.

That's the first truth of DevOps: **production servers are run from the terminal.** Most servers in the cloud run Linux, and they have no graphical interface. So moving around the terminal comfortably isn't an "advanced skill"; it's like learning to hold the steering wheel before you learn to drive.

The good news: the terminal looks scary, but its rules are few and very simple. By the end of this chapter you will:

- Understand the difference between a terminal, a shell and a kernel.
- Know where things live in the Linux filesystem.
- Create, view, move and delete files and folders with ease.
- Join small tools together with **pipes** to do big jobs.
- Analyse a real web server log with `grep`, `sed`, `awk`, `sort` and `uniq`.
- Know which habits keep you out of trouble on a production server.

## Terminal, shell and kernel {#what-is-a-shell}

Three words that often get mixed up:

| Word | What it is | Examples |
| --- | --- | --- |
| **Terminal** | The window you type into and read from | GNOME Terminal, iTerm2, Windows Terminal |
| **Shell** | The program that reads your command, understands it and runs it | `bash`, `zsh`, `fish` |
| **Kernel** | The core of the OS, which actually opens files and runs programs | The Linux kernel |

Think of a restaurant. The terminal is the counter where you order. The shell is the waiter: it listens, understands, and sends the order to the kitchen. The kernel is the kitchen, where the real work happens. (There's much more about the kernel in the Operating Systems course.)

The line the shell shows you is called the **prompt**:

```text
deploy@web-01:~/app$
```

- `deploy`: which user you are
- `web-01`: which machine you're on (checking this is crucial in production)
- `~/app`: which folder you're in now (`~` means your home folder)
- `$`: an ordinary user. If you see `#`, you're **root**, which means you can do anything. Careful.

> [!warning] Check which server you're on first
> Many big outages start with the same mistake: someone thought they were on the staging server, but they were on production. Get into the habit of glancing at the hostname in the prompt before running a command.

## The filesystem: everything starts at `/` {#filesystem}

Windows has `C:` and `D:`. Linux has a single tree whose root is `/` (pronounced "root"). Every disk, every folder and every device hangs from some branch of that one tree.

Where things live is laid out the same way on almost every Linux:

| Folder | What's in it | When you'll go there |
| --- | --- | --- |
| `/etc` | Configuration files | To change settings for Nginx, SSH or any service |
| `/var/log` | Log files | First stop whenever something breaks |
| `/home/<user>` | Users' own files | Your own work and scripts |
| `/usr/bin`, `/bin` | Programs | Where `ls`, `grep` and `python3` live |
| `/opt` | Apps installed from outside | Some companies put their apps here |
| `/tmp` | Temporary files | Often wiped on reboot |
| `/proc` | Info about running processes and the kernel | To check on the CPU and memory |
| `/dev` | Devices (disks, terminals) | When working with disks |

One big Linux idea: **almost everything is a file**. A config is a file, a log is a file, and even your CPU's details can be read like a file:

```bash
cat /proc/cpuinfo | head -5
```

Because of this idea, the same few tools (`cat`, `grep`, `less`) let you look at almost anything.

## Getting around {#navigation}

```bash
pwd                 # where am I now? (print working directory)
ls                  # what's here
ls -la              # including hidden files, in detail (permissions, size, date)
cd /var/log         # go into this folder
cd ..               # one level up
cd ~                # to my home folder (just cd works too)
cd -                # back to where I was before
```

There are two kinds of address:

- An **absolute path** starts with `/` and means the same thing from anywhere: `/var/log/nginx/access.log`
- A **relative path** starts from where you are: `nginx/access.log` (if you're in `/var/log`)

`.` means "this folder", and `..` means "the folder above".

Three habits that will save you hours a day:

- **Tab:** type the first few letters of a name and press Tab, and the shell fills in the rest. Press it twice to see every match. Fewer typos, too.
- **↑ arrow:** brings back the previous command.
- **Ctrl+R:** search old commands. Type a little and it shows a match from your history. Press Ctrl+R again for an older one.

## Working with files {#files}

```bash
mkdir -p app/logs        # create a folder (-p: create any missing folders in between)
touch app/notes.txt      # create an empty file
cp app/notes.txt /tmp/   # copy
cp -r app app-backup     # copy a whole folder (-r: with everything inside)
mv app-backup old-app    # rename or move (same command)
rm app/notes.txt         # delete a file
rm -r old-app            # delete a folder
```

To look inside a file:

```bash
cat file.txt             # show it all at once (for small files)
less /var/log/syslog     # page through it: Space for the next page, / to search, q to quit
head -n 20 file.txt      # the first 20 lines
tail -n 50 file.txt      # the last 50 lines
tail -f app.log          # show new lines as they arrive (a live log); Ctrl+C to stop
wc -l file.txt           # how many lines
```

> [!danger] `rm` has no Recycle Bin
> Anything you delete in the terminal is gone for good. Read it twice before typing `rm -rf` (forcefully, without asking, with everything inside). And if a blog or forum ever suggests copying something like `rm -rf /` or `rm -rf ~/`, don't run it.

### Where to get help {#help}

Can't remember a command's options? No need to memorise them:

```bash
ls --help        # a short summary
man ls           # the full manual (q to quit)
```

Install a tool called `tldr` (`tldr tar`) and it shows the most common examples directly. Great for beginners.

## Pipes and redirection: small tools, big jobs {#pipes}

This is Linux's most beautiful idea. Each tool does one small job well, and tools can be snapped together, just like Lego.

Every program has three "pipes":

| Name | Number | What it is |
| --- | --- | --- |
| **stdin** | 0 | Where input comes from (usually the keyboard) |
| **stdout** | 1 | Where normal output goes (usually the screen) |
| **stderr** | 2 | Where error messages go (also the screen, but a separate pipe) |

These pipes can be redirected:

```bash
ls -la > files.txt          # write output to a file instead of the screen (replacing what was there)
echo "done" >> run.log      # append to the end of a file
python3 app.py 2> errors.log    # only the errors go to a file
python3 app.py > all.log 2>&1   # both output and errors into the same file
```

And the most powerful of all is the **pipe** `|`: it feeds one program's stdout straight into the next program's stdin.

```bash
cat access.log | grep " 500 " | wc -l
```

Read it left to right: read the log, keep only lines containing 500, then count them. No temporary files needed.

```diagram
pipe-flow
Lines flow through the pipe from one tool to the next. Each step filters out or changes some lines, and at the end only the answer is left.
```

## Five power tools {#power-tools}

Reading logs, finding configs, pulling out data: most everyday DevOps work is done with these few tools.

### `grep`: search {#grep}

```bash
grep "ERROR" app.log            # lines containing ERROR
grep -i "error" app.log         # ignoring upper/lower case
grep -n "timeout" app.log       # with line numbers
grep -v "healthcheck" access.log    # lines WITHOUT healthcheck (inverted)
grep -r "DATABASE_URL" /etc/myapp/  # search a whole folder
grep -E "500|502|503" access.log    # any one of several (regex)
```

### `sort` and `uniq`: sort and count {#sort-uniq}

`uniq` only merges identical lines that are **next to each other**, so you have to `sort` first:

```bash
sort ips.txt | uniq -c | sort -rn | head
```

Meaning: sort, merge identical lines with a count, sort by count from biggest to smallest, show the first 10. This one line answers almost every "what's the most common" question.

### `awk`: pull out columns {#awk}

`awk` splits each line into columns on whitespace. `$1` is the first column, `$2` the second, and so on.

```bash
awk '{print $1}' access.log                 # only the first column (the IP)
awk '$9 >= 500 {print $7}' access.log       # where column 9 is 500 or more, show column 7
```

### `sed`: change {#sed}

```bash
sed 's/staging/production/' config.txt       # change the first staging on each line to production (shown on screen)
sed -i 's/DEBUG=true/DEBUG=false/' .env       # change it inside the file itself (-i)
```

> [!warning] `sed -i` changes the file directly
> Run it without `-i` first and check the output; if it looks right, then add `-i`. Or write `sed -i.bak ...` to keep a `.bak` copy of the original file.

### `find`: locate files {#find}

```bash
find /var/log -name "*.log"                  # by name
find /tmp -type f -mtime +7                  # files older than 7 days
find / -type f -size +500M 2>/dev/null       # files bigger than 500 MB (throwing errors away)
```

Notice the last one: `2>/dev/null` means throw the errors (like "Permission denied") into a black hole. Whatever you write to `/dev/null` disappears.

## Hands-on: analyse a real log {#hands-on}

Now back to that 2 a.m. problem. Run the command below to create a sample Nginx log. (It works on Linux, macOS, or WSL on Windows.)

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

In this format (Nginx's default "combined" format) the columns are: `$1` IP, `$7` path, `$9` status code.

**Question 1: how many requests failed (5xx)?**

```bash
awk '$9 >= 500' access.log | wc -l
```

```text
4
```

**Question 2: which path is erroring?**

```bash
awk '$9 >= 500 {print $7}' access.log | sort | uniq -c | sort -rn
```

```text
      4 /api/orders
```

**Question 3: which IP is sending the most requests? (leaving out the health check)**

```bash
grep -v healthz access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -3
```

```text
      4 198.51.100.23
      2 203.0.113.7
      1 203.0.113.9
```

In three lines you know: the problem is in `/api/orders`, and it's coming from a mobile app (`okhttp`). Now you know which service's logs to open. No dashboard or tool needed.

> [!tip] Poke at it a little
> In one line, find how many times each status code appeared: `awk '{print $9}' access.log | sort | uniq -c`. Then try adding up the total bytes (`$10`) of only the `POST` requests. Hint: `awk` can add, `awk '{s += $10} END {print s}'`.

## What matters in production {#production}

- **On big files, not `cat` but `less` or `tail`.** Run `cat` on a log several GB in size and your terminal locks up. `less` reads only what it needs, and `tail -n 100` shows just the end.
- **Old logs are often compressed.** To search a file like `app.log.3.gz` directly, use `zgrep "ERROR" app.log.3.gz`; to read it, `zless`.
- **When SSH drops, running work drops with it.** Before a long job (a big backup, a migration), open `tmux` or `screen`. Even if the connection goes, the work keeps running, and you can log back in to check on it.
- **Read copy-pasted commands before running them.** Especially something like `curl ... | bash`, which downloads a script from the internet and runs it straight away. Open the script and look first.
- **A full disk is often caused by logs.** `df -h` shows how full each disk is, and `du -sh /var/log/*` shows who's using the space. On a full disk, databases and apps break in strange ways.
- **If you do the same job again and again, write a script.** The lines you build with pipes can later go into a script. That's the last chapter of this part.

## Recap {#recap}

- The terminal is the window, the shell (like `bash`) is the program that reads and runs commands, and the kernel does the real work.
- The prompt tells you which user, which machine, which folder. `#` means root.
- Linux has a single tree starting at `/`. Configs live in `/etc`, logs in `/var/log`, programs in `/usr/bin`.
- Almost everything is a file, so the same few tools let you look at almost anything.
- `>` sends output to a file, `>>` appends, `2>` sends errors, and `|` gives one program's output to the next.
- `grep` searches, `awk` pulls out columns, `sort | uniq -c | sort -rn` counts, `sed` changes, `find` locates files.
- In production: `less`/`tail` for big files, `tmux` for long jobs, and think twice before `rm`.

## Check yourself {#quiz}

**1.** What three things do you learn from a prompt that says `root@db-prod-02:/var/lib/postgresql#`? Which one should make you most careful?

> [!tip]- Answer
> You're the `root` user (with full power, which the `#` also tells you), the machine is called `db-prod-02` (a production database server), and you're in `/var/lib/postgresql`, where the database's data lives. One wrong `rm` as root here means losing production data. So read every command here twice before running it.

**2.** Where might an app's error log live, and where are its settings? If you're not sure for a particular app, how will you find them?

> [!tip]- Answer
> Logs are usually in `/var/log/<app>/`, settings in `/etc/<app>/`. If you're not sure, search with `find / -name "*.log" -path "*myapp*" 2>/dev/null` or `grep -r "myapp" /etc/ 2>/dev/null`. For a service run by systemd, also check `journalctl -u myapp` (more in the third chapter).

**3.** After running `python3 app.py > out.log`, the errors still appear on screen instead of going to the file. Why? How do you fix it?

> [!tip]- Answer
> `>` only sends stdout (number 1) to the file. Errors go through stderr (number 2), which is still the screen. To send both to the file, write `python3 app.py > out.log 2>&1`. Meaning: stdout goes to `out.log`, and stderr goes wherever stdout is going.

**4.** Running `uniq -c ips.txt` counts the same IP separately in several places. What's wrong?

> [!tip]- Answer
> `uniq` only merges identical lines that are next to each other. When the IPs are scattered, the same IP gets counted in separate groups. `sort` first so identical lines sit together: `sort ips.txt | uniq -c`.

**5.** Write a one-line command for the lab log above that tells you which IPs produced 5xx errors, and how many from each.

> [!tip]- Answer
> `awk '$9 >= 500 {print $1}' access.log | sort | uniq -c | sort -rn`. First it pulls out the IPs from only the 5xx lines, then sorts and counts them, and finally orders them from most to least. For the lab log the answer is `4 198.51.100.23`.

**6.** Your server's disk is 98% full. Which two commands do you start with, and what are you looking for?

> [!tip]- Hint
> First `df -h`: see which disk or partition is full. Then in that place, `du -sh /var/log/* | sort -h` (or `/var/lib/*`, `/tmp/*`) to see which folder is biggest. Most of the time the culprit is logs that aren't being rotated, old Docker images (`docker system df`), or forgotten backup files. Before deleting anything, make sure no running app is still writing to that file.

---
# id is permanent: progress and XP are tied to it. Never change it.
id: 626a993b-e7b1-407b-aacf-de6fa4f13704
slug: processes-services
title: Processes and Services
part: linux-for-servers
order: 3
xp: 10
topics: [ps/top, Signals, systemd, journalctl, cron]
updated: 2026-11-01
---

## A story first {#story}

Picture the kitchen of a big restaurant. Lots of cooks work at once: one on rice, one on kebabs, one on desserts. Each wears an apron with a name and a number.

The kitchen has a **head chef**. They decide who comes in to work when the restaurant opens. If a cook suddenly falls ill and goes home, they put someone else in their place right away. On the wall hangs a **logbook** where everything gets written down all day: who did what, and what went wrong where. And there's a **routine board**: "Clean the fridge every night at 11", "Order spices every Monday morning."

Inside a Linux server it's exactly the same:

- Every cook is a **process**, and their number is the **PID**.
- The head chef is called **systemd**. It starts services, and restarts them if they fall over.
- The logbook on the wall is the **journal**, read with `journalctl`.
- The routine board is **cron**.

When your app goes to production, it will run as a process. Keeping it running, bringing it back when it crashes, reading its logs, and running regular jobs: that's this chapter. By the end you will:

- See what's running and who's eating CPU or memory, with `ps` and `top`.
- Understand what the numbers in the **load average** mean.
- Know what a signal is, and why `kill -9` isn't your first choice.
- Write a **systemd service** for your own app that restarts itself when it crashes.
- Search any service's logs with `journalctl`.
- Schedule regular jobs with `cron`, and avoid its common traps.

## Process: a program that's running {#processes}

The `python3` sitting on the disk is a **program**. When you run it, the kernel gives it memory, a number, and time on the CPU. Then it's a **process**. Many processes can run from the same program at once, like many cakes from one mould.

Every process has:

- **PID**: its own number
- **PPID**: the number of the process that started it (its "parent")
- **User**: which user it runs as (remember the last chapter?)

See every process:

```bash
ps aux | head -5
```

```text
USER       PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
root         1  0.0  0.3 168340 12912 ?    Ss   09:00   0:03 /sbin/init
root       612  0.0  0.2  15420  8920 ?    Ss   09:00   0:00 sshd: /usr/sbin/sshd -D
www-data   901  0.1  0.5  55280 21004 ?    S    09:01   0:12 nginx: worker process
app       1342 12.4  8.1 912344 330112 ?   Sl   09:05  14:02 python3 /opt/shop/app.py
```

The useful columns:

| Column | Meaning |
| --- | --- |
| `PID` | The process's number |
| `%CPU`, `%MEM` | How much CPU and memory it's using |
| `RSS` | How much RAM it really occupies (in KB) |
| `STAT` | State: `R` running, `S` sleeping/waiting, `D` stuck waiting on disk, `Z` zombie |
| `COMMAND` | The command it was started with |

Notice PID 1. The very first process the kernel starts after the server boots is PID 1, and on almost every Linux today that's **systemd**. Every other process descends from it.

To find a specific process:

```bash
pgrep -a python        # processes with python in the name, with PIDs
ps aux | grep nginx    # the old way, still used a lot
```

### `top`: the live view {#top}

`top` (or the prettier `htop`) shows every process live, sorted by CPU. Press `M` to sort by memory, and `q` to quit.

Right at the top is a line like:

```text
load average: 3.80, 2.10, 1.05
```

These three numbers are the average number of processes that were lined up to run over the last **1, 5 and 15 minutes** (running or waiting for the CPU, plus those stuck waiting on disk).

Think of the counters in a shop. If your server has 4 CPU cores, that's 4 counters. A load of 4 means every counter is busy and nobody's waiting. A load of 8 means each counter is serving one person with another standing in line. So to make sense of the load, first find out how many cores you have:

```bash
nproc
```

In the example above, `3.80, 2.10, 1.05` means the load is **rising** (it was low 15 minutes ago and is higher now). On a 4-core machine that's still manageable, but something has started. Keep an eye on it.

## Signals: sending a process a message {#signals}

The name of the `kill` command makes it sound like it only kills. Really it sends the process a **signal**, a tiny message. What the process does depends on which message it is.

| Signal | Number | Meaning | What the process can do |
| --- | --- | --- | --- |
| `SIGTERM` | 15 | "Please shut down" | Finish what it's doing, close files, then exit |
| `SIGINT` | 2 | Ctrl+C | Usually shuts down |
| `SIGHUP` | 1 | "Re-read your config" for many daemons | Programs like Nginx take the new settings without stopping |
| `SIGKILL` | 9 | "Die now" | Nothing at all; the kernel kills it directly |

```bash
kill 1342          # the default is SIGTERM
kill -HUP 901      # ask it to re-read its config
kill -9 1342       # the last resort
```

> [!warning] `kill -9` isn't first
> `SIGKILL` gives the process no chance at all. Half-written files, unfinished database transactions, open connections: everything is left exactly as it was. Send a plain `kill` (SIGTERM) first, wait a few seconds, and only if it still won't stop, use `-9`. A good app tidies up and exits when it gets SIGTERM. That's called **graceful shutdown**, and it's what keeps users' requests from being lost during a deploy.

### Foreground and background {#jobs}

Run a command in the terminal and the terminal stays tied up until it finishes (the foreground). Add `&` at the end and it runs in the background:

```bash
python3 -m http.server 8000 &     # run it in the background
jobs                              # this terminal's background jobs
fg %1                             # bring it back to the front
```

But close the terminal or lose your SSH connection and these jobs usually die too. `nohup` saves them to a degree, but it's **not the right way** to run an app in production. The right way is systemd.

## systemd: the head chef {#systemd}

systemd calls everything it can run a **unit**. The most common unit is a **service**, like `nginx.service` or `ssh.service`. They're controlled with `systemctl`:

```bash
systemctl status nginx          # is it running, its PID, the last few log lines
sudo systemctl start nginx      # start it
sudo systemctl stop nginx       # stop it
sudo systemctl restart nginx    # stop and start again
sudo systemctl reload nginx     # re-read config without stopping (if the service supports it)
sudo systemctl enable nginx     # start it whenever the server boots
sudo systemctl disable nginx    # don't start it at boot any more
systemctl --failed              # services that have failed and are lying there
```

> [!note] `start` and `enable` are different
> `start` runs it **now**. `enable` decides whether it starts on its own **at the next boot**. Install a new service and only `start` it, and it won't come back after the first reboot. For both at once: `sudo systemctl enable --now myapp`.

### Turn your own app into a service {#unit-file}

Say you have a Python app at `/opt/shop/app.py`. Write a file for it called `/etc/systemd/system/shop.service`:

```ini
[Unit]
Description=Shop web app
After=network-online.target
Wants=network-online.target

[Service]
User=app
Group=app
WorkingDirectory=/opt/shop
Environment=PORT=8000
EnvironmentFile=-/etc/shop/shop.env
ExecStart=/usr/bin/python3 /opt/shop/app.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

What each line says:

- `After=network-online.target`: start me after the network is up.
- `User=app`: run it as the `app` user, not root (least privilege, from the last chapter).
- `EnvironmentFile=-...`: read secrets and settings from this file (`-` means it's fine if the file doesn't exist). Don't write secrets directly in the unit file.
- `ExecStart`: the actual command. You need the full path here.
- `Restart=on-failure`: if the process dies for a bad reason, start it again. `RestartSec=5` means wait 5 seconds first.
- `WantedBy=multi-user.target`: once you `enable` it, it starts on a normal boot.

Then:

```bash
sudo systemctl daemon-reload          # tell systemd to read new or changed files
sudo systemctl enable --now shop
systemctl status shop
```

```diagram
systemd-restart
The app suddenly crashes. systemd notices, waits a few seconds, starts it again, and writes the whole thing down in the journal.
```

## journalctl: the logbook on the wall {#journald}

The stdout and stderr of every service run by systemd go into the journal automatically. Your app doesn't have to write to a separate log file; just printing to the screen is enough.

```bash
journalctl -u shop                    # all of the shop service's logs
journalctl -u shop -f                 # live, like tail -f
journalctl -u shop --since "10 min ago"
journalctl -u shop -p err             # only errors or worse
journalctl -b                         # everything since this boot
journalctl -u shop -n 50 --no-pager   # the last 50 lines, without a pager (handy in scripts)
```

The journal takes up disk space. See how big it's grown and trim it if needed:

```bash
journalctl --disk-usage
sudo journalctl --vacuum-time=14d     # delete everything older than 14 days
```

## cron: the routine board {#cron}

A backup every night, cleaning up old files every hour, a report every Monday: regular jobs like these are what **cron** is for. Open your own cron list:

```bash
crontab -e      # edit
crontab -l      # view
```

Each line has five time fields, then the command:

```text
# minute  hour  day-of-month  month  day-of-week  command
  30      2     *             *      *            /opt/scripts/backup.sh
```

| Field | Values | Example |
| --- | --- | --- |
| Minute | 0–59 | `30` |
| Hour | 0–23 | `2` means 2 a.m. |
| Day of month | 1–31 | `1` means the 1st of the month |
| Month | 1–12 | `*` means every month |
| Day of week | 0–7 (both 0 and 7 are Sunday) | `1` means Monday |

A few more examples:

```text
*/15 * * * *    /opt/scripts/cleanup.sh        # every 15 minutes
0 * * * *       /opt/scripts/hourly.sh         # at the start of every hour
0 9 * * 1       /opt/scripts/weekly-report.sh  # every Monday at 9 a.m.
0 0 1 * *       /opt/scripts/monthly.sh        # at midnight on the 1st of every month
```

If the time fields are hard to read, type them into the crontab.guru website and it explains them in plain language.

> [!warning] Three cron traps
> 1. **A tiny PATH.** cron runs with very little environment. A command that works in your terminal may be "command not found" under cron. So write full paths in your script (`/usr/bin/python3`, not just `python3`).
> 2. **Output disappears.** Nobody knows where the error went. Send it to a log at the end: `... >> /var/log/backup.log 2>&1`.
> 3. **Timezones.** Servers often run in UTC. "2 a.m." might mean 8 a.m. in Bangladesh. Check the server's timezone with `timedatectl`.

systemd has its own scheduler too: **timers**. Their advantage is that logs go straight to the journal, and a job missed while the server was off can be run later (`Persistent=true`). cron is simpler for small jobs; many people prefer timers for big production work.

## Hands-on: crash it and watch it come back {#hands-on}

On a Linux VM or server (systemd usually has to be switched on in WSL, so a VM is easier). First a service user and a tiny web server:

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin demo
sudo mkdir -p /opt/demo
echo "<h1>Hello from systemd</h1>" | sudo tee /opt/demo/index.html
```

Write `/etc/systemd/system/demo.service`:

```ini
[Unit]
Description=Demo static site
After=network-online.target

[Service]
User=demo
WorkingDirectory=/opt/demo
ExecStart=/usr/bin/python3 -m http.server 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Start it and look:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now demo
curl -s localhost:8000
systemctl status demo --no-pager | head -5
```

Now kill it on purpose, and watch what happens:

```bash
sudo kill -9 $(systemctl show -p MainPID --value demo)
sleep 4
systemctl status demo --no-pager | head -5
journalctl -u demo -n 6 --no-pager
```

```text
systemd[1]: demo.service: Main process exited, code=killed, status=9/KILL
systemd[1]: demo.service: Failed with result 'signal'.
systemd[1]: demo.service: Scheduled restart job, restart counter is at 1.
systemd[1]: Started demo.service - Demo static site.
```

You killed the process, systemd started it again by itself 3 seconds later, and wrote the whole thing down in the journal. When your app crashes at 2 a.m., this is exactly what lets you sleep.

> [!tip] Poke at it a little
> Now stop it with `sudo systemctl stop demo`. Did systemd start it again? Why not? Hint: `stop` is a shutdown you asked for, not a crash. Then change `Restart=always` to `Restart=on-failure`, run `daemon-reload`, and see what difference `kill` (SIGTERM, not `-9`) makes.

## What matters in production {#production}

- **Resource limits with systemd.** Write `MemoryMax=512M` and `CPUQuota=50%` in a unit file and one service can't eat the whole server. Underneath it uses Linux's **cgroups**, which is exactly what Docker does too.
- **The OOM killer.** When RAM runs out, the kernel picks a process and kills it. If your app suddenly vanishes without any error, check `journalctl -k | grep -i "out of memory"`.
- **Who's listening on which port.** `sudo ss -tlnp` shows which process is accepting connections on which port. The answer to a "Port already in use" error is usually here.
- **Watch out for restart loops.** If an app crashes the moment it starts, systemd keeps starting it, then gives up after a limit (`start-limit-hit`). Then look for the first error in `journalctl -u app`, not the last.
- **Test your graceful shutdown.** During a deploy systemd sends your app SIGTERM, then SIGKILL if it doesn't stop in time (`TimeoutStopSec`, 90 seconds by default). Check for yourself once that your app finishes in-flight requests and exits when it gets SIGTERM.
- **If you see a zombie (`Z`).** It's a process that has died but whose parent hasn't collected it yet. It uses no resources itself, but if many pile up, there's a bug in the parent process.

## Recap {#recap}

- A running program is a process, and each has a PID, a PPID and a user. PID 1 is systemd.
- `ps aux` shows every process, `top`/`htop` show them live. Read the load average against the number of CPU cores.
- `kill` sends a signal: SIGTERM is a polite request, SIGHUP often means "re-read your config", SIGKILL is the last resort.
- In production, run apps as systemd services, not with `&` or `nohup`.
- What matters in a unit file: `User`, `ExecStart` (full path), `Restart=on-failure`, `WantedBy`. Run `daemon-reload` after changing it.
- `start` runs it now, `enable` runs it at boot. Both at once: `enable --now`.
- `journalctl -u <service>` shows logs, `-f` live, `--since` by time, `-p err` only errors.
- cron's five fields: minute, hour, day of month, month, day of week. Write full paths, send output to a log, check the timezone.

## Check yourself {#quiz}

**1.** On an 8-core server the load average is `16.2, 15.8, 15.1`. What does that mean? Is the server OK?

> [!tip]- Answer
> For the last 15 minutes, on average about 16 processes have been lined up to run, but there are only 8 cores. So at any moment about 8 processes are waiting. The numbers are steady, so this isn't sudden; it's been going on for a while. The server is running slow. Use `top` to see who's eating CPU, and if `STAT` shows lots of `D`, the problem is really the disk, not the CPU.

**2.** A colleague wrote `kill -9 $(pgrep -f app.py)` in the deploy script. What can go wrong, and what's better?

> [!tip]- Answer
> SIGKILL gives the app no chance to tidy up: in-flight requests are cut off, users get errors, and half-written data or open transactions may be left behind. And `pgrep -f app.py` may accidentally catch some other process too (like `vim app.py`). Better: make the app a systemd service and run `sudo systemctl restart app`. systemd sends SIGTERM first, waits, and only then sends SIGKILL if needed.

**3.** You installed a new service and ran `sudo systemctl start myapp`, and everything worked. After the server rebooted yesterday, the app isn't running. What went wrong?

> [!tip]- Answer
> Only `start` was run, not `enable`. `start` only runs it for now; to start on its own at boot you need `enable`. To fix it: `sudo systemctl enable --now myapp`. Also check that the unit file's `[Install]` section has `WantedBy=multi-user.target`; without it, `enable` won't work.

**4.** When will `0 3 * * 1-5 /opt/scripts/report.sh` run?

> [!tip]- Answer
> Monday to Friday (`1-5`), every day at 3:00 a.m., in the server's timezone. If the server runs in UTC, that's 9 a.m. in Bangladesh (UTC+6).

**5.** A backup script works fine when run from the terminal, but does nothing under cron, and no error shows up anywhere. Which two things do you check first?

> [!tip]- Answer
> First, whether the commands in the script use full paths (`/usr/bin/pg_dump`), because cron's PATH is very small. Second, whether the output is going anywhere: add `>> /var/log/backup.log 2>&1` to the end of the crontab line, and next time you'll see the error. Also check that the script has execute permission (`chmod +x`), and that the user whose crontab it's in has permission to read the files it needs.

**6.** Your app sometimes vanishes without any error log, and then systemd starts it again. How do you find out what's happening?

> [!tip]- Hint
> In `journalctl -u app`, look at the lines just before the restart: if they say `status=9/KILL`, someone or something sent SIGKILL. Then check the kernel's log with `journalctl -k --since "1 hour ago" | grep -i -E "oom|killed process"`. If it's the OOM killer, RAM is running out: either the app has a memory leak, or `MemoryMax` is too low. `systemctl status app` shows memory use too; watch whether it grows over time.

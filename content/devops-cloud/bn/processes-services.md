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

## শুরুর আগে একটা গল্প {#story}

একটা বড় রেস্টুরেন্টের রান্নাঘর ভাবো। অনেক রাঁধুনি একসাথে কাজ করছে: কেউ ভাত, কেউ কাবাব, কেউ মিষ্টি। প্রত্যেকের একটা নাম আর একটা নম্বর লাগানো apron।

রান্নাঘরে একজন **হেড শেফ** আছেন। তিনি ঠিক করেন দোকান খোলার সময় কে কে কাজে আসবে। কোনো রাঁধুনি হঠাৎ অসুস্থ হয়ে চলে গেলে তিনি সাথে সাথে আরেকজনকে বসিয়ে দেন। দেয়ালে একটা **খাতা** ঝোলে, যেখানে সারাদিন কে কী করলো, কোথায় কী গোলমাল হলো, সব লেখা থাকে। আর একটা **রুটিন বোর্ড** আছে: "প্রতিদিন রাত ১১টায় ফ্রিজ পরিষ্কার", "প্রতি সোমবার সকালে মশলা অর্ডার"।

একটা Linux server এর ভেতরেও ঠিক এই ব্যবস্থা:

- প্রতিটা রাঁধুনি একটা **process**, তার নম্বর **PID**।
- হেড শেফের নাম **systemd**। সে service চালু করে, পড়ে গেলে আবার চালু করে।
- দেয়ালের খাতা হলো **journal**, পড়া হয় `journalctl` দিয়ে।
- রুটিন বোর্ড হলো **cron**।

তোমার app যখন production এ যাবে, সে একটা process হয়ে চলবে। তাকে চালু রাখা, crash করলে ফেরানো, log পড়া, আর নিয়মিত কাজ চালানো, এগুলোই এই chapter। শেষে তুমি:

- `ps` আর `top` দিয়ে দেখতে পারবে কী চলছে আর কে CPU বা memory খাচ্ছে।
- **Load average** এর সংখ্যাগুলোর মানে বুঝবে।
- Signal কী, আর `kill -9` কেন প্রথম পছন্দ না, সেটা জানবে।
- নিজের app এর জন্য একটা **systemd service** লিখতে পারবে, যেটা crash করলে নিজেই আবার চালু হয়।
- `journalctl` দিয়ে কোনো service এর log খুঁজতে পারবে।
- `cron` দিয়ে নিয়মিত কাজ schedule করতে পারবে, আর তার সাধারণ ফাঁদগুলো এড়াতে পারবে।

## Process: চলমান একটা program {#processes}

Disk এ পড়ে থাকা `python3` একটা **program**। তুমি যখন সেটা চালাও, kernel তাকে memory দেয়, একটা নম্বর দেয়, CPU তে সময় দেয়। তখন সেটা একটা **process**। একই program থেকে একসাথে অনেকগুলো process চলতে পারে, যেমন একই ছাঁচ থেকে অনেকগুলো পিঠা।

প্রতিটা process এর:

- **PID**: নিজের নম্বর
- **PPID**: যে process তাকে চালু করেছে তার নম্বর (তার "বাবা")
- **User**: কোন user হিসেবে চলছে (আগের chapter মনে আছে?)

সব process দেখো:

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

দরকারি column গুলো:

| Column | মানে |
| --- | --- |
| `PID` | Process এর নম্বর |
| `%CPU`, `%MEM` | কতটা CPU আর memory খাচ্ছে |
| `RSS` | আসলে কতটা RAM দখল করে আছে (KB তে) |
| `STAT` | অবস্থা: `R` চলছে, `S` ঘুমিয়ে অপেক্ষা করছে, `D` disk এর জন্য আটকে, `Z` zombie |
| `COMMAND` | কোন command দিয়ে চালু হয়েছিল |

খেয়াল করো PID 1। Server চালু হওয়ার পর kernel যে প্রথম process টা চালায়, সেটাই PID 1, আর আজকের প্রায় সব Linux এ সেটা **systemd**। বাকি সব process তার বংশধর।

নির্দিষ্ট process খুঁজতে:

```bash
pgrep -a python        # নামে python আছে এমন process, PID সহ
ps aux | grep nginx    # পুরোনো উপায়, এখনো খুব চলে
```

### `top`: live অবস্থা {#top}

`top` (আরো সুন্দর চাইলে `htop`) চালালে সব process live দেখায়, CPU অনুযায়ী সাজানো। `M` চাপলে memory অনুযায়ী, `q` দিয়ে বের হও।

একদম উপরে একটা লাইন থাকে:

```text
load average: 3.80, 2.10, 1.05
```

এই তিনটা সংখ্যা হলো গত **১, ৫ আর ১৫ মিনিটের** গড়ে কয়টা process চলার জন্য লাইনে ছিল (চলছিল বা CPU এর অপেক্ষায়, সাথে disk এর জন্য আটকে থাকারাও)।

একটা দোকানের কাউন্টার ভাবো। তোমার server এ যদি ৪টা CPU core থাকে, মানে ৪টা কাউন্টার। Load ৪ মানে সব কাউন্টার ব্যস্ত, কেউ অপেক্ষা করছে না। Load ৮ মানে প্রতিটা কাউন্টারে একজন সেবা নিচ্ছে আর একজন লাইনে দাঁড়িয়ে। তাই load এর মানে বুঝতে আগে জানো কয়টা core:

```bash
nproc
```

উপরের উদাহরণে `3.80, 2.10, 1.05` মানে load **বাড়ছে** (১৫ মিনিট আগে কম ছিল, এখন বেশি)। ৪ core এর machine এ এখনো সামলানো যায়, কিন্তু কিছু একটা শুরু হয়েছে, নজর রাখো।

## Signal: process কে বার্তা পাঠানো {#signals}

`kill` command এর নাম শুনে মনে হয় এটা শুধু মারে। আসলে এটা process কে একটা **signal** পাঠায়, একটা ছোট বার্তা। কোন বার্তা, তার ওপর নির্ভর করে process কী করবে।

| Signal | নম্বর | মানে | Process কী করতে পারে |
| --- | --- | --- | --- |
| `SIGTERM` | 15 | "ভদ্রভাবে বন্ধ হও" | হাতের কাজ শেষ করে, file বন্ধ করে, তারপর বের হয় |
| `SIGINT` | 2 | Ctrl+C | সাধারণত বন্ধ হয় |
| `SIGHUP` | 1 | অনেক daemon এর জন্য "config আবার পড়ো" | Nginx এর মতো program বন্ধ না হয়ে নতুন setting নেয় |
| `SIGKILL` | 9 | "এখনই মরো" | কিছুই করতে পারে না, kernel সরাসরি মেরে ফেলে |

```bash
kill 1342          # default হলো SIGTERM
kill -HUP 901      # config আবার পড়তে বলো
kill -9 1342       # শেষ উপায়
```

> [!warning] `kill -9` প্রথমে না
> `SIGKILL` process কে কোনো সুযোগই দেয় না। অর্ধেক লেখা file, শেষ না হওয়া database transaction, খোলা connection, সব যেমন ছিল তেমন পড়ে থাকে। আগে সাধারণ `kill` (SIGTERM) দাও, কয়েক সেকেন্ড অপেক্ষা করো, তবুও না থামলে তখন `-9`। একটা ভালো app SIGTERM পেলে নিজের কাজ গুছিয়ে বের হয়। এর নাম **graceful shutdown**, আর deploy এর সময় এটাই user দের request হারানো থেকে বাঁচায়।

### Foreground আর background {#jobs}

Terminal এ একটা command চালালে সেটা শেষ না হওয়া পর্যন্ত terminal আটকে থাকে (foreground)। শেষে `&` দিলে পেছনে চলে:

```bash
python3 -m http.server 8000 &     # পেছনে চালাও
jobs                              # এই terminal এর পেছনের কাজগুলো
fg %1                             # আবার সামনে আনো
```

কিন্তু terminal বন্ধ করলে বা SSH কেটে গেলে এই কাজগুলোও সাধারণত মরে যায়। `nohup` দিয়ে কিছুটা বাঁচানো যায়, তবে production এ app চালানোর **ঠিক উপায় এটা না**। ঠিক উপায় হলো systemd।

## systemd: হেড শেফ {#systemd}

systemd প্রতিটা চালানোর মতো জিনিসকে বলে একটা **unit**। সবচেয়ে সাধারণ unit হলো **service**, যেমন `nginx.service`, `ssh.service`। তাদের নিয়ন্ত্রণ করা হয় `systemctl` দিয়ে:

```bash
systemctl status nginx          # চলছে কিনা, PID, শেষ কয়েকটা log লাইন
sudo systemctl start nginx      # চালু করো
sudo systemctl stop nginx       # বন্ধ করো
sudo systemctl restart nginx    # বন্ধ করে আবার চালু
sudo systemctl reload nginx     # বন্ধ না করে config আবার পড়াও (যদি service সমর্থন করে)
sudo systemctl enable nginx     # server boot হলেই চালু হবে
sudo systemctl disable nginx    # boot এ আর চালু হবে না
systemctl --failed              # যেগুলো fail করে পড়ে আছে
```

> [!note] `start` আর `enable` আলাদা
> `start` **এখন** চালায়। `enable` ঠিক করে **পরের boot এ** নিজে থেকে চালু হবে কিনা। নতুন service বসিয়ে শুধু `start` দিলে প্রথম reboot এর পর সে আর চালু হবে না। দুটো একসাথে চাইলে: `sudo systemctl enable --now myapp`।

### নিজের app কে service বানাও {#unit-file}

ধরো তোমার একটা Python app আছে `/opt/shop/app.py` এ। তার জন্য `/etc/systemd/system/shop.service` নামে একটা file লেখো:

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

প্রতিটা লাইন কী বলে:

- `After=network-online.target`: network চালু হওয়ার পরে আমাকে চালু করো।
- `User=app`: root না, `app` user হিসেবে চালাও (least privilege, আগের chapter)।
- `EnvironmentFile=-...`: এই file থেকে secret আর setting পড়ো (`-` মানে file না থাকলেও চলবে)। Secret সরাসরি unit file এ লিখো না।
- `ExecStart`: আসল command। এখানে পুরো path দিতে হয়।
- `Restart=on-failure`: process ভুল কারণে মরে গেলে আবার চালু করো। `RestartSec=5` মানে ৫ সেকেন্ড অপেক্ষা করে।
- `WantedBy=multi-user.target`: `enable` করলে স্বাভাবিক boot এ চালু হবে।

তারপর:

```bash
sudo systemctl daemon-reload          # systemd কে নতুন বা বদলানো file পড়তে বলো
sudo systemctl enable --now shop
systemctl status shop
```

```diagram
systemd-restart
App টা হঠাৎ crash করলো। systemd সেটা টের পায়, কয়েক সেকেন্ড অপেক্ষা করে আবার চালু করে, আর পুরো ঘটনা journal এ লিখে রাখে।
```

## journalctl: দেয়ালের খাতা {#journald}

systemd দিয়ে চলা প্রতিটা service এর stdout আর stderr নিজে থেকেই journal এ জমা হয়। তোমার app কে আলাদা log file এ লিখতে হয় না, শুধু screen এ print করলেই হলো।

```bash
journalctl -u shop                    # shop service এর সব log
journalctl -u shop -f                 # live, tail -f এর মতো
journalctl -u shop --since "10 min ago"
journalctl -u shop -p err             # শুধু error বা তার চেয়ে গুরুতর
journalctl -b                         # এই boot থেকে সব কিছু
journalctl -u shop -n 50 --no-pager   # শেষ ৫০ লাইন, pager ছাড়া (script এ কাজে লাগে)
```

Journal disk এ জায়গা নেয়। কত বড় হয়েছে দেখো আর দরকার হলে ছাঁটো:

```bash
journalctl --disk-usage
sudo journalctl --vacuum-time=14d     # ১৪ দিনের পুরোনো সব মুছে ফেলো
```

## cron: রুটিন বোর্ড {#cron}

প্রতিদিন রাতে backup, প্রতি ঘণ্টায় পুরোনো file পরিষ্কার, প্রতি সোমবার report, এসব নিয়মিত কাজের জন্য **cron**। নিজের cron তালিকা খোলো:

```bash
crontab -e      # সম্পাদনা
crontab -l      # দেখো
```

প্রতিটা লাইনে পাঁচটা সময়ের ঘর, তারপর command:

```text
# মিনিট  ঘণ্টা  মাসের-দিন  মাস  সপ্তাহের-দিন  command
  30     2      *          *    *             /opt/scripts/backup.sh
```

| ঘর | মান | উদাহরণ |
| --- | --- | --- |
| মিনিট | 0–59 | `30` |
| ঘণ্টা | 0–23 | `2` মানে রাত ২টা |
| মাসের দিন | 1–31 | `1` মানে মাসের ১ তারিখ |
| মাস | 1–12 | `*` মানে প্রতি মাস |
| সপ্তাহের দিন | 0–7 (0 আর 7 দুটোই রবিবার) | `1` মানে সোমবার |

আরো কয়েকটা উদাহরণ:

```text
*/15 * * * *    /opt/scripts/cleanup.sh        # প্রতি ১৫ মিনিটে
0 * * * *       /opt/scripts/hourly.sh         # প্রতি ঘণ্টার শুরুতে
0 9 * * 1       /opt/scripts/weekly-report.sh  # প্রতি সোমবার সকাল ৯টায়
0 0 1 * *       /opt/scripts/monthly.sh        # প্রতি মাসের ১ তারিখ মাঝরাতে
```

সময়ের ঘরগুলো পড়তে কষ্ট হলে crontab.guru website এ লিখে দেখো, সাধারণ ভাষায় বুঝিয়ে দেয়।

> [!warning] cron এর তিনটা ফাঁদ
> 1. **PATH ছোট।** cron খুব কম environment নিয়ে চলে। Terminal এ যে command চলে, cron এ হয়তো "command not found"। তাই script এ পুরো path লেখো (`/usr/bin/python3`, শুধু `python3` না)।
> 2. **Output হারিয়ে যায়।** Error কোথায় গেল কেউ জানে না। শেষে log এ পাঠাও: `... >> /var/log/backup.log 2>&1`।
> 3. **Timezone।** Server প্রায়ই UTC তে চলে। "রাত ২টা" মানে বাংলাদেশে সকাল ৮টা হতে পারে। `timedatectl` দিয়ে server এর timezone দেখে নাও।

systemd এর নিজেরও একটা scheduler আছে, **timer**। এর সুবিধা হলো log সরাসরি journal এ যায়, আর server বন্ধ থাকায় কোনো কাজ বাদ পড়লে পরে চালিয়ে নেওয়া যায় (`Persistent=true`)। ছোট কাজে cron সহজ, বড় production কাজে timer অনেকে পছন্দ করে।

## নিজের হাতে: crash করো, ফিরে আসা দেখো {#hands-on}

একটা Linux VM বা server এ (WSL এ systemd সাধারণত চালু করতে হয়, তাই VM সহজ)। প্রথমে একটা service user আর ছোট একটা web server:

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin demo
sudo mkdir -p /opt/demo
echo "<h1>Hello from systemd</h1>" | sudo tee /opt/demo/index.html
```

`/etc/systemd/system/demo.service` লেখো:

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

চালু করো আর দেখো:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now demo
curl -s localhost:8000
systemctl status demo --no-pager | head -5
```

এবার ইচ্ছা করে মেরে ফেলো, আর দেখো কী হয়:

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

তুমি process টা মেরে ফেললে, systemd ৩ সেকেন্ড পরে নিজেই আবার চালু করলো, আর পুরো ঘটনা journal এ লিখে রাখলো। রাত দুইটায় তোমার app crash করলে ঠিক এটাই তোমাকে ঘুমাতে দেবে।

> [!tip] নিজে একটু খোঁচাও
> এবার `sudo systemctl stop demo` দিয়ে বন্ধ করো। systemd কি আবার চালু করলো? কেন না? Hint: `stop` হলো তোমার ইচ্ছায় বন্ধ, crash না। তারপর `Restart=always` বদলে `Restart=on-failure` করো, `daemon-reload` দাও, আর `kill` (SIGTERM, `-9` না) দিয়ে দেখো পার্থক্য কী হয়।

## Production এ যা যা কাজে লাগে {#production}

- **systemd দিয়ে resource এর সীমা।** Unit file এ `MemoryMax=512M` আর `CPUQuota=50%` লিখলে একটা service পুরো server খেয়ে ফেলতে পারে না। ভেতরে এটা Linux এর **cgroups** ব্যবহার করে, Docker ও ঠিক এটাই করে।
- **OOM killer।** RAM শেষ হয়ে গেলে kernel নিজে একটা process বেছে মেরে ফেলে। তোমার app হঠাৎ কোনো error ছাড়া উধাও হলে `journalctl -k | grep -i "out of memory"` দেখো।
- **কে কোন port এ শুনছে।** `sudo ss -tlnp` দেখায় কোন process কোন port এ connection নিচ্ছে। "Port already in use" error এর উত্তর প্রায়ই এখানে।
- **Restart loop এ সাবধান।** একটা app চালু হয়েই crash করলে systemd বারবার চালাতে থাকে, তারপর একটা সীমার পর হাল ছেড়ে দেয় (`start-limit-hit`)। তখন `journalctl -u app` এ প্রথম error টা খোঁজো, শেষেরটা না।
- **Graceful shutdown পরীক্ষা করো।** Deploy এর সময় systemd তোমার app কে SIGTERM পাঠায়, তারপর সময়মতো না থামলে SIGKILL (`TimeoutStopSec`, default ৯০ সেকেন্ড)। তোমার app SIGTERM পেয়ে চলমান request শেষ করে বের হয় কিনা, একবার নিজে দেখে নাও।
- **Zombie (`Z`) দেখলে।** এটা মরে যাওয়া process, যার বাবা এখনো খবর নেয়নি। নিজে কোনো resource খায় না, কিন্তু অনেকগুলো জমলে বুঝবে বাবা process এ bug আছে।

## এক নজরে {#recap}

- চলমান program হলো process, প্রতিটার PID, PPID আর user আছে। PID 1 হলো systemd।
- `ps aux` সব process দেখায়, `top`/`htop` live দেখায়। Load average কে CPU core এর সংখ্যার সাথে তুলনা করে পড়ো।
- `kill` signal পাঠায়: SIGTERM ভদ্র অনুরোধ, SIGHUP প্রায়ই "config আবার পড়ো", SIGKILL শেষ উপায়।
- Production এ app চালাও systemd service হিসেবে, `&` বা `nohup` দিয়ে না।
- Unit file এ আসল কথা: `User`, `ExecStart` (পুরো path), `Restart=on-failure`, `WantedBy`। বদলানোর পর `daemon-reload`।
- `start` এখন চালায়, `enable` boot এ চালায়। দুটো একসাথে `enable --now`।
- `journalctl -u <service>` log দেখায়, `-f` live, `--since` সময় ধরে, `-p err` শুধু error।
- cron এর পাঁচ ঘর: মিনিট, ঘণ্টা, মাসের দিন, মাস, সপ্তাহের দিন। পুরো path লেখো, output log এ পাঠাও, timezone দেখো।

## নিজেকে যাচাই করো {#quiz}

**১.** একটা ৮ core server এ load average `16.2, 15.8, 15.1`। এর মানে কী? Server কি ঠিক আছে?

> [!tip]- উত্তর
> গত ১৫ মিনিট ধরে গড়ে প্রায় ১৬টা process চলার জন্য লাইনে ছিল, অথচ core মাত্র ৮টা। মানে প্রতি মুহূর্তে প্রায় ৮টা process অপেক্ষা করছে। সংখ্যা স্থির, তাই এটা হঠাৎ না, অনেকক্ষণ ধরে চলছে। Server ধীর হয়ে আছে। `top` দিয়ে দেখো কে CPU খাচ্ছে, আর `STAT` এ অনেক `D` থাকলে সমস্যা আসলে disk এ, CPU তে না।

**২.** Deploy script এ সহকর্মী লিখেছে `kill -9 $(pgrep -f app.py)`। এতে কী সমস্যা হতে পারে, আর ভালো উপায় কী?

> [!tip]- উত্তর
> SIGKILL app কে কিছুই গুছানোর সুযোগ দেয় না: চলমান request কেটে যায়, user রা error পায়, অর্ধেক লেখা data বা খোলা transaction পড়ে থাকতে পারে। আর `pgrep -f app.py` ভুল করে অন্য কোনো process (যেমন `vim app.py`) ও ধরে ফেলতে পারে। ভালো উপায়: app কে systemd service বানাও আর `sudo systemctl restart app` দাও। systemd আগে SIGTERM দেয়, অপেক্ষা করে, তারপর দরকার হলে SIGKILL।

**৩.** নতুন একটা service বসিয়ে `sudo systemctl start myapp` দিলে, সব ঠিকঠাক চলছিল। কাল server reboot হওয়ার পর app আর চলছে না। কী ভুল হয়েছিল?

> [!tip]- উত্তর
> শুধু `start` দেওয়া হয়েছিল, `enable` না। `start` শুধু এখনকার জন্য চালায়, boot এ নিজে চালু হওয়ার জন্য `enable` লাগে। ঠিক করতে `sudo systemctl enable --now myapp`। Unit file এর `[Install]` অংশে `WantedBy=multi-user.target` আছে কিনা ও দেখো, না থাকলে `enable` কাজ করবে না।

**৪.** `0 3 * * 1-5 /opt/scripts/report.sh` কখন চলবে?

> [!tip]- উত্তর
> সোমবার থেকে শুক্রবার (`1-5`), প্রতিদিন রাত ৩টা ০ মিনিটে, server এর timezone অনুযায়ী। Server UTC তে থাকলে বাংলাদেশ সময়ে সেটা সকাল ৯টা (UTC+6)।

**৫.** একটা backup script terminal এ চালালে ঠিকঠাক চলে, কিন্তু cron এ কিছুই হয় না, কোনো error ও দেখা যায় না। কোন দুইটা জিনিস আগে দেখবে?

> [!tip]- উত্তর
> প্রথমত, script এর command গুলো পুরো path দিয়ে লেখা কিনা (`/usr/bin/pg_dump`), কারণ cron এর PATH খুব ছোট। দ্বিতীয়ত, output কোথাও যাচ্ছে কিনা: crontab লাইনের শেষে `>> /var/log/backup.log 2>&1` যোগ করো, তাহলে পরের বার error টা দেখতে পাবে। সাথে দেখো script এ execute permission (`chmod +x`) আছে কিনা, আর কোন user এর crontab এ লেখা, সেই user এর দরকারি file পড়ার অনুমতি আছে কিনা।

**৬.** তোমার app মাঝে মাঝে কোনো error log ছাড়াই উধাও হয়ে যায়, তারপর systemd আবার চালু করে। কীভাবে খুঁজবে কী হচ্ছে?

> [!tip]- Hint
> `journalctl -u app` এ ঠিক restart এর আগের লাইনগুলো দেখো: `status=9/KILL` লেখা থাকলে কেউ বা কিছু SIGKILL দিয়েছে। তারপর `journalctl -k --since "1 hour ago" | grep -i -E "oom|killed process"` দিয়ে kernel এর log দেখো। OOM killer হলে বুঝবে RAM শেষ হচ্ছে: হয় app এ memory leak, নয়তো `MemoryMax` খুব কম। `systemctl status app` এ memory ব্যবহারও দেখায়, সময়ের সাথে বাড়ছে কিনা নজর রাখো।

---
# id is permanent: progress and XP are tied to it. Never change it.
id: 8f4b7859-778a-4e83-ac55-5354e541db95
slug: users-permissions
title: Users, Permissions, Packages
part: linux-for-servers
order: 2
xp: 10
topics: [Users & groups, chmod/chown, sudo, apt/dnf, SSH keys]
updated: 2026-11-01
---

## শুরুর আগে একটা গল্প {#story}

একটা হোটেলের কথা ভাবো। প্রতিটা অতিথি একটা key card পায়, যেটা দিয়ে শুধু তার নিজের রুম খোলে। Housekeeping এর লোকের card দিয়ে একটা পুরো তলার সব রুম খোলে, কিন্তু হিসাবের অফিস খোলে না। আর ম্যানেজারের কাছে একটা master key আছে, যেটা দিয়ে সব খোলে। সেই চাবিটা তিনি পকেটে নিয়ে ঘোরেন না, লকারে রাখেন, আর দরকার হলে বের করেন।

একটা Linux server ঠিক এই হোটেল:

- প্রতিটা মানুষ আর প্রতিটা service একজন **user**।
- কয়েকজন মিলে একটা **group** (housekeeping দল)।
- প্রতিটা file আর folder এর গায়ে লেখা থাকে কে কী করতে পারবে, এটা **permission**।
- Master key এর নাম **root**, আর লকার থেকে সেটা ক্ষণিকের জন্য বের করার উপায় হলো **sudo**।

এর সাথে আরো দুইটা জিনিস না জানলে server চালানো যায় না: software install করা (**package manager**), আর server এ নিরাপদে ঢোকা (**SSH key**)। এই chapter শেষে তুমি:

- User, group আর UID কী, আর service গুলো কেন নিজের আলাদা user এ চলে, সেটা বুঝবে।
- `ls -l` এর `-rwxr-x---` পড়তে পারবে, আর `chmod`, `chown` দিয়ে permission ঠিক করতে পারবে।
- `sudo` কেন root হয়ে বসে থাকার চেয়ে ভালো, সেটা জানবে।
- `apt` বা `dnf` দিয়ে software install, update আর remove করতে পারবে।
- Password ছাড়া SSH key দিয়ে server এ ঢুকতে পারবে, আর password login বন্ধ করে server টাকে শক্ত করতে পারবে।

## User আর group {#users-groups}

Linux এ প্রতিটা user এর একটা নাম আর একটা নম্বর থাকে, যার নাম **UID**। Kernel আসলে নাম চেনে না, নম্বর চেনে। সবচেয়ে বিশেষ নম্বর হলো **0**: UID 0 মানেই **root**, যার কাছে সব কিছু করার ক্ষমতা।

তুমি কে, দেখো:

```bash
whoami
id
```

```text
deploy
uid=1001(deploy) gid=1001(deploy) groups=1001(deploy),27(sudo),999(docker)
```

মানে: তুমি `deploy`, তোমার UID 1001, আর তুমি `sudo` আর `docker` group এরও সদস্য।

সব user এর তালিকা থাকে `/etc/passwd` এ (নাম শুনে ভয় পেও না, এখানে আর password থাকে না, password এর hash থাকে `/etc/shadow` এ, যেটা শুধু root পড়তে পারে):

```bash
grep -E "deploy|www-data|postgres" /etc/passwd
```

```text
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
postgres:x:114:121:PostgreSQL administrator:/var/lib/postgresql:/bin/bash
deploy:x:1001:1001::/home/deploy:/bin/bash
```

`:` দিয়ে ভাগ করা column গুলো: নাম, (password এর জায়গা), UID, group ID, বিবরণ, home folder, আর login করলে কোন shell চলবে।

খেয়াল করো `www-data` এর shell হলো `/usr/sbin/nologin`। এটা একটা **service user**: Nginx এর মতো program এই user হিসেবে চলে, কিন্তু কোনো মানুষ এই user হয়ে login করতে পারে না।

> [!note] Service কেন নিজের user এ চলে
> ধরো তোমার web server এ একটা security bug আছে, আর একজন attacker সেটা দিয়ে command চালাতে পারছে। Web server যদি root হিসেবে চলে, attacker পুরো server এর মালিক। আর যদি `www-data` হিসেবে চলে, সে শুধু ততটুকুই পারবে যতটুকু `www-data` পারে। ক্ষতির পরিধি ছোট রাখার এই নীতির নাম **least privilege**: যার যতটুকু দরকার, ঠিক ততটুকুই ক্ষমতা।

User আর group বানানো:

```bash
sudo useradd -m -s /bin/bash rafi        # নতুন user, home folder সহ, bash shell
sudo passwd rafi                         # password ঠিক করো
sudo groupadd devs                       # নতুন group
sudo usermod -aG devs rafi               # rafi কে devs group এ যোগ করো
```

> [!warning] `usermod -aG` এর `-a` ভুলো না
> `-a` মানে "append", আগের group গুলো রেখে নতুনটা যোগ করো। `-a` ছাড়া `usermod -G devs rafi` চালালে rafi বাকি সব group থেকে বেরিয়ে যাবে, এমনকি `sudo` থেকেও। আর নতুন group এর ক্ষমতা পেতে user কে একবার logout করে আবার login করতে হয়।

## Permission: কে কী করতে পারবে {#permissions}

```bash
ls -l
```

```text
-rwxr-x--- 1 deploy devs 2048 Nov  1 10:00 deploy.sh
drwxr-xr-x 2 deploy devs 4096 Nov  1 10:00 releases
```

প্রথম অংশ `-rwxr-x---` টাই আসল কথা। এটা চার টুকরো:

| অংশ | মানে |
| --- | --- |
| `-` | ধরন: `-` সাধারণ file, `d` folder, `l` link |
| `rwx` | **Owner** (এখানে `deploy`) কী পারবে |
| `r-x` | **Group** (এখানে `devs`) এর সদস্যরা কী পারবে |
| `---` | **Others**, মানে বাকি সবাই কী পারবে |

আর তিনটা অক্ষর:

| অক্ষর | File এর জন্য | Folder এর জন্য |
| --- | --- | --- |
| `r` (read) | ভেতরের লেখা পড়া | ভেতরে কী কী আছে তার তালিকা দেখা |
| `w` (write) | লেখা বদলানো | ভেতরে file বানানো, মোছা, নাম বদলানো |
| `x` (execute) | Program হিসেবে চালানো | ভেতরে ঢোকা (`cd`) |

তাই `deploy.sh` এর ক্ষেত্রে: deploy পড়তে, লিখতে, চালাতে পারবে। `devs` group এর লোকেরা পড়তে আর চালাতে পারবে, বদলাতে পারবে না। বাকিরা কিছুই পারবে না।

```diagram
permission-bits
তিনজন একই file খুলতে চায়। Owner সব পারে, group এর সদস্য শুধু পড়তে আর চালাতে পারে, আর বাইরের কেউ ঢুকতেই পারে না।
```

### সংখ্যা দিয়ে permission {#octal}

প্রতিটা অক্ষরের একটা মান আছে: `r = 4`, `w = 2`, `x = 1`। যোগ করলে একটা অঙ্ক হয়, আর তিনটা অঙ্ক মিলে পুরো permission:

| সংখ্যা | অক্ষরে | কোথায় ব্যবহার হয় |
| --- | --- | --- |
| `755` | `rwxr-xr-x` | Program, script, সাধারণ folder |
| `644` | `rw-r--r--` | সাধারণ file: সবাই পড়বে, শুধু owner লিখবে |
| `700` | `rwx------` | শুধু owner এর folder (যেমন `~/.ssh`) |
| `600` | `rw-------` | গোপন file: private key, `.env`, password |

```bash
chmod 755 deploy.sh          # সংখ্যা দিয়ে
chmod u+x deploy.sh          # অক্ষর দিয়ে: owner (u) কে execute (x) দাও
chmod go-w config.yml        # group (g) আর others (o) থেকে write সরাও
chmod -R 750 releases/       # folder আর ভেতরের সব কিছুতে (-R)
```

Owner বা group বদলাতে `chown`:

```bash
sudo chown deploy:devs deploy.sh          # owner deploy, group devs
sudo chown -R www-data:www-data /var/www  # পুরো folder
```

> [!danger] `chmod 777` কখনো সমাধান না
> "Permission denied" দেখে অনেকে `chmod 777` চালিয়ে দেয়, মানে সবাইকে সব ক্ষমতা। সমস্যা মিটে যায়, আর তৈরি হয় নতুন বিপদ: server এর যেকোনো user বা হ্যাক হওয়া যেকোনো service এখন সেই file বদলাতে পারে। আসল প্রশ্ন হলো: **কে** এই file টা ব্যবহার করবে? তাকে owner বা group বানাও, আর ঠিক যতটুকু দরকার ততটুকু দাও।

### দুইটা বিশেষ bit {#special-bits}

মাঝে মাঝে `x` এর জায়গায় অন্য অক্ষর দেখবে:

- **setuid (`s`):** `ls -l /usr/bin/passwd` চালালে দেখবে `-rwsr-xr-x`। এর মানে program টা যে-ই চালাক, চলবে **owner** (root) এর ক্ষমতায়। তাই সাধারণ user ও `passwd` দিয়ে নিজের password বদলাতে পারে, যদিও `/etc/shadow` শুধু root লিখতে পারে। শক্তিশালী, তাই বিপজ্জনক: নিজের script এ কখনো setuid দিও না।
- **sticky bit (`t`):** `ls -ld /tmp` চালালে দেখবে `drwxrwxrwt`। সবাই `/tmp` এ লিখতে পারে, কিন্তু শেষের `t` এর জন্য কেউ অন্যের file মুছতে পারে না।

## sudo: master key, ক্ষণিকের জন্য {#sudo}

Root হিসেবে সারাদিন কাজ করা মানে master key পকেটে নিয়ে ঘোরা। একটা typo, আর পুরো server শেষ। তাই সাধারণ user হিসেবে কাজ করো, আর শুধু যে command এ দরকার, তার আগে `sudo` লেখো:

```bash
apt update                 # Permission denied
sudo apt update            # তোমার নিজের password চেয়ে root হিসেবে চালাবে
```

`sudo` এর তিনটা বড় সুবিধা:

1. **ক্ষণিকের ক্ষমতা।** শুধু ওই একটা command root হিসেবে চলে, বাকি সময় তুমি সাধারণ user।
2. **হিসাব থাকে।** কে কখন কী `sudo` দিয়ে চালালো, সেটা log হয় (`/var/log/auth.log` বা `journalctl`)। কিছু ভাঙলে খোঁজা যায়।
3. **নিয়ন্ত্রণ করা যায়।** কে `sudo` পাবে, সেটা ঠিক হয় `/etc/sudoers` এ। চাইলে একজনকে শুধু একটা নির্দিষ্ট command এর অনুমতি দেওয়া যায়।

`sudoers` file সরাসরি editor দিয়ে খুলো না। সবসময় `sudo visudo` দিয়ে খোলো, কারণ এটা save এর আগে ভুল আছে কিনা যাচাই করে। এই file এ একটা syntax ভুল মানে আর কেউ `sudo` চালাতে পারবে না।

## Package manager: software install এর ঠিক উপায় {#packages}

Windows এ আমরা website থেকে `.exe` নামিয়ে install করি। Linux এ এর বদলে আছে **package manager**: একটা বিশ্বস্ত ভাণ্ডার (repository) থেকে software নামায়, যাচাই করে, যা যা লাগে (dependency) সব সাথে install করে, আর পরে update ও করে।

কোন package manager, সেটা নির্ভর করে Linux এর কোন পরিবার:

| কাজ | Debian / Ubuntu (`apt`) | RHEL / Fedora / Amazon Linux (`dnf`) |
| --- | --- | --- |
| তালিকা হালনাগাদ | `sudo apt update` | (`dnf` নিজেই করে) |
| Install | `sudo apt install nginx` | `sudo dnf install nginx` |
| সব update | `sudo apt upgrade` | `sudo dnf upgrade` |
| Remove | `sudo apt remove nginx` | `sudo dnf remove nginx` |
| খোঁজা | `apt search redis` | `dnf search redis` |
| তথ্য | `apt show nginx` | `dnf info nginx` |

> [!note] `apt update` আর `apt upgrade` এক না
> `update` শুধু ভাণ্ডারের **তালিকা** হালনাগাদ করে: কোন package এর কোন নতুন version আছে। কিছু install বা বদলায় না। `upgrade` সেই তালিকা দেখে আসলে package গুলো নতুন version এ নেয়। তাই সাধারণত দুটো একসাথে: `sudo apt update && sudo apt upgrade`।

Repository থেকে আসা package গুলো **digital signature** দিয়ে সই করা থাকে। Package manager install এর আগে সই মিলিয়ে দেখে, তাই পথে কেউ বদলে দিলে ধরা পড়ে। এজন্যই random website এর script এর চেয়ে package manager অনেক নিরাপদ।

## SSH key: password ছাড়া, আরো নিরাপদে {#ssh-keys}

Server এ ঢোকার উপায় হলো **SSH**। Password দিয়েও ঢোকা যায়, কিন্তু internet এ থাকা প্রতিটা server এ সারাদিন bot রা হাজার হাজার password আন্দাজ করে দেখে। সমাধান হলো **key pair**।

একটা সহজ উপমা: তুমি অনেকগুলো **তালা** বানালে, আর সেগুলো বিভিন্ন server এর দরজায় লাগিয়ে দিলে। তালার **চাবি** একটাই, আর সেটা শুধু তোমার কাছে।

- **Public key** হলো তালা। যত খুশি server এ দিতে পারো, কেউ দেখে ফেললেও ক্ষতি নেই।
- **Private key** হলো চাবি। এটা কখনো তোমার machine থেকে বের হবে না, কাউকে দেবে না, কোথাও paste করবে না।

```bash
ssh-keygen -t ed25519 -C "rafi@laptop"     # key pair বানাও (passphrase দিও)
ssh-copy-id deploy@203.0.113.10            # public key টা server এ বসাও
ssh deploy@203.0.113.10                    # এখন password ছাড়াই ঢুকবে
```

`ssh-copy-id` আসলে তোমার public key টা server এর `~/.ssh/authorized_keys` file এ যোগ করে দেয়। SSH খুব কড়া: এই folder আর file এর permission বেশি খোলা থাকলে সে key গ্রাহ্যই করে না:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519
```

রোজ লম্বা command লেখা এড়াতে নিজের laptop এ `~/.ssh/config` এ একটা নাম দাও:

```text
Host web1
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519
```

এখন শুধু `ssh web1` লিখলেই হবে।

### Server টাকে শক্ত করো {#harden-ssh}

Key দিয়ে ঢুকতে পারলে password login আর root login পুরো বন্ধ করে দাও। Server এর `/etc/ssh/sshd_config` এ:

```text
PasswordAuthentication no
PermitRootLogin no
```

তারপর `sudo systemctl reload ssh` (কিছু distro তে service এর নাম `sshd`)।

> [!danger] নিজেকে বাইরে আটকে ফেলো না
> SSH এর setting বদলানোর সময় **একটা session খোলা রেখে দাও**। Reload এর পর একটা **নতুন** terminal থেকে ঢুকে দেখো ঠিক আছে কিনা। কোনো ভুল হলে খোলা session টা দিয়ে ঠিক করতে পারবে। দুইটা session বন্ধ করে ফেললে আর ঢোকার উপায় থাকবে না, তখন cloud console বা data center এ যেতে হবে।

## নিজের হাতে: একটা team এর জন্য shared folder {#hands-on}

পরিস্থিতি: `rafi` আর `nadia` দুইজনই `/srv/app` folder এ deploy করবে। দুজনেই একে অপরের file বদলাতে পারবে, কিন্তু বাইরের কেউ ভেতরে দেখতেও পারবে না। (নিজের machine এ VM বা WSL এ করো, অথবা একটা ছোট cloud server এ।)

```bash
# দুইজন user আর একটা group
sudo useradd -m -s /bin/bash rafi
sudo useradd -m -s /bin/bash nadia
sudo groupadd deployers
sudo usermod -aG deployers rafi
sudo usermod -aG deployers nadia

# Shared folder
sudo mkdir -p /srv/app
sudo chown root:deployers /srv/app
sudo chmod 2770 /srv/app
```

`2770` এর শেষের `770` মানে owner আর group সব পারবে, বাকিরা কিছু না। আর শুরুর `2` হলো **setgid** bit: এই folder এর ভেতরে যে-ই file বানাক, file এর group হবে `deployers`, বানানো লোকের নিজের group না। ফলে দুইজনই সব নতুন file বদলাতে পারবে।

যাচাই করো:

```bash
sudo -u rafi touch /srv/app/release-1.txt
ls -l /srv/app
sudo -u nadia sh -c 'echo "checked" >> /srv/app/release-1.txt'   # nadia কি লিখতে পারবে? দেখো
sudo -u www-data ls /srv/app                                      # Permission denied
```

```text
-rw-r--r-- 1 rafi deployers 0 Nov  1 10:20 release-1.txt
sh: 1: cannot create /srv/app/release-1.txt: Permission denied
```

দেখো, file এর group নিজে থেকেই `deployers`। কিন্তু একটা সমস্যা আছে: permission `rw-r--r--`, তাই group এর জন্য write নেই, আর nadia এর লেখা fail করলো। কারণ rafi এর **umask** (নতুন file এর default permission ঠিক করে) group write কেটে দেয়। সমাধান: `umask 002` (user এর `~/.bashrc` এ), অথবা নির্দিষ্ট file এ `chmod g+w`। এই ধরনের ছোট জিনিস production এ ঘণ্টার পর ঘণ্টা খায়, তাই একবার নিজের হাতে দেখে রাখা ভালো।

> [!tip] নিজে একটু খোঁচাও
> `umask` চালিয়ে দেখো তোমার এখনকার মান কত (সাধারণত `0022`)। তারপর `umask 002` দিয়ে একটা file বানিয়ে `ls -l` এ পার্থক্য দেখো। Hint: umask হলো যে bit গুলো **কেটে** দেওয়া হবে।

## Production এ যা যা কাজে লাগে {#production}

- **গোপন file এর permission `600`।** `.env`, database password, private key, TLS key, সব শুধু owner পড়বে। অনেক tool (SSH সহ) বেশি খোলা permission দেখলে কাজই করে না।
- **প্রতিটা service এর নিজের user।** `app`, `postgres`, `www-data` আলাদা। একটা হ্যাক হলে বাকিগুলো বাঁচে।
- **Security update নিয়মিত।** Ubuntu তে `unattended-upgrades` চালু করলে security patch নিজে থেকেই install হয়। বড় version upgrade গুলো হাতে, আগে staging এ পরীক্ষা করে।
- **Production এ package এর version ঠিক করে রাখো।** আজ install করলে এক version, কাল আরেক। Docker image বা Ansible দিয়ে version লিখে রাখলে প্রতিটা server একই রকম থাকে (পরের part গুলোতে আসছে)।
- **কে ঢুকছে, দেখো।** `last` দেখায় কে কখন login করেছে, আর `/var/log/auth.log` (বা `journalctl -u ssh`) এ ব্যর্থ চেষ্টাগুলো। হাজার হাজার ব্যর্থ চেষ্টা দেখলে চমকিও না, এটা internet এর স্বাভাবিক অবস্থা। `fail2ban` বারবার ভুল করা IP গুলো কিছুক্ষণের জন্য আটকে দেয়।
- **কাউকে চলে যেতে হলে তার access ও যাক।** Team ছাড়লে তার user lock করো (`sudo usermod -L <user>`) আর `authorized_keys` থেকে তার key সরাও।

## এক নজরে {#recap}

- প্রতিটা মানুষ আর service একজন user, পরিচয় তার UID দিয়ে। UID 0 মানে root, সব ক্ষমতা।
- Service গুলো নিজের user এ চলে (`www-data`, `postgres`), যাতে হ্যাক হলে ক্ষতি ছোট থাকে। এটাই least privilege।
- Permission তিন দলের জন্য (owner, group, others), তিন রকম (`r`, `w`, `x`)। Folder এ `x` মানে ভেতরে ঢোকা।
- `r=4, w=2, x=1`: `755` program আর folder, `644` সাধারণ file, `600` গোপন file। `777` কখনো না।
- `sudo` দিয়ে শুধু দরকারি command root হিসেবে চলে, আর সব log হয়। `sudoers` বদলাও শুধু `visudo` দিয়ে।
- `apt` (Ubuntu) আর `dnf` (RHEL পরিবার) সই করা ভাণ্ডার থেকে software আনে। `update` তালিকা আনে, `upgrade` আসলে বদলায়।
- SSH key: public key তালা, private key চাবি। Key দিয়ে ঢুকতে পারলে password আর root login বন্ধ করো, একটা session খোলা রেখে।

## নিজেকে যাচাই করো {#quiz}

**১.** `-rw-r-----  1 app  app  220 config.env` দেখে বলো: `app` user কী পারে, `app` group এর অন্য সদস্য কী পারে, আর বাকিরা কী পারে? সংখ্যায় এটা কত?

> [!tip]- উত্তর
> Owner `app` পড়তে আর লিখতে পারে (`rw-`)। `app` group এর সদস্যরা শুধু পড়তে পারে (`r--`)। বাকিরা কিছুই পারে না (`---`)। সংখ্যায় `640` (৪+২, ৪, ০)। গোপন config এর জন্য ভালো, যদি group এ শুধু বিশ্বস্ত service থাকে। আরো কড়া চাইলে `600`।

**২.** একটা folder এ `r` আছে কিন্তু `x` নেই। সেই folder এ কী করতে পারবে আর কী পারবে না?

> [!tip]- উত্তর
> `ls` দিয়ে ভেতরের file এর নামগুলো দেখতে পারবে (`r`), কিন্তু `cd` করে ঢুকতে বা ভেতরের কোনো file খুলতে পারবে না, কারণ folder এর ভেতরে যাওয়ার অনুমতি দেয় `x`। তাই folder এ সাধারণত `r` আর `x` একসাথে দেওয়া হয়।

**৩.** একজন সহকর্মী বললো, "Nginx এ permission error আসছিল, তাই পুরো `/var/www` এ `chmod -R 777` দিয়ে দিয়েছি, এখন চলছে।" তুমি কী বলবে আর ঠিক উপায়টা কী?

> [!tip]- উত্তর
> এতে server এর যেকোনো user বা হ্যাক হওয়া যেকোনো process website এর file বদলাতে পারবে, যেমন page এ ক্ষতিকর script বসাতে। ঠিক উপায়: Nginx কোন user এ চলে দেখো (সাধারণত `www-data`), তারপর `sudo chown -R www-data:www-data /var/www/site` (বা deploy user owner আর `www-data` group), folder এ `755` বা `750`, file এ `644` বা `640`। Nginx এর শুধু পড়া দরকার, লেখার না।

**৪.** `sudo usermod -G docker rafi` চালানোর পর rafi বলছে সে আর `sudo` চালাতে পারছে না। কী হলো?

> [!tip]- উত্তর
> `-a` (append) দেওয়া হয়নি। `-G` একা দিলে user এর group এর তালিকা পুরোটা বদলে শুধু `docker` বসে যায়, তাই rafi `sudo` group থেকে বেরিয়ে গেছে। ঠিক command হলো `sudo usermod -aG docker rafi`। এখন অন্য কোনো sudo ক্ষমতা থাকা user দিয়ে `sudo usermod -aG sudo rafi` চালিয়ে ঠিক করতে হবে।

**৫.** তোমার public key কাউকে email করা কি বিপজ্জনক? আর private key?

> [!tip]- উত্তর
> Public key পাঠানোয় কোনো সমস্যা নেই, এটা তালার মতো, যে কেউ দেখতে পারে। Server এর admin কে তোমার public key দিলেই সে তোমাকে access দিতে পারবে। Private key কখনো কাউকে পাঠাবে না, কোথাও upload করবে না। কারো হাতে গেলে সে তোমার নামে সব server এ ঢুকতে পারবে। ভুলে ফাঁস হলে সাথে সাথে নতুন key বানাও আর পুরোনো public key সব server এর `authorized_keys` থেকে সরাও।

**৬.** নতুন একটা Ubuntu server পেলে প্রথম আধা ঘণ্টায় তুমি কী কী করবে? তালিকা বানাও।

> [!tip]- Hint
> একটা ভালো শুরু: `sudo apt update && sudo apt upgrade`, নিজের জন্য একটা সাধারণ user বানিয়ে `sudo` group এ যোগ, `ssh-copy-id` দিয়ে key বসানো, নতুন session এ key দিয়ে ঢুকে নিশ্চিত হওয়া, তারপর `PasswordAuthentication no` আর `PermitRootLogin no`, firewall চালু (`ufw allow OpenSSH`, তারপর `ufw enable`), আর `unattended-upgrades`। প্রতিটা ধাপ কেন, সেটা নিজের ভাষায় লিখে রাখতে পারলে এটাই তোমার প্রথম runbook।

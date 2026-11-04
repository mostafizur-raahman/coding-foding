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

## A story first {#story}

Think of a hotel. Every guest gets a key card that opens only their own room. The housekeeping staff's cards open every room on a floor, but not the accounts office. And the manager has a master key that opens everything. They don't carry it around in a pocket; they keep it in a locker and take it out when needed.

A Linux server is exactly this hotel:

- Every person and every service is a **user**.
- Several of them together form a **group** (the housekeeping team).
- Every file and folder carries a label saying who can do what: its **permissions**.
- The master key is called **root**, and the way to take it out of the locker for a moment is **sudo**.

Two more things you can't run a server without: installing software (the **package manager**), and getting into the server safely (**SSH keys**). By the end of this chapter you will:

- Understand users, groups and UIDs, and why services run as their own separate users.
- Read the `-rwxr-x---` in `ls -l`, and fix permissions with `chmod` and `chown`.
- Know why `sudo` is better than sitting logged in as root.
- Install, update and remove software with `apt` or `dnf`.
- Log into a server with an SSH key instead of a password, and harden the server by switching password login off.

## Users and groups {#users-groups}

On Linux every user has a name and a number, called the **UID**. The kernel doesn't really know names, only numbers. The most special number is **0**: UID 0 means **root**, who can do anything.

See who you are:

```bash
whoami
id
```

```text
deploy
uid=1001(deploy) gid=1001(deploy) groups=1001(deploy),27(sudo),999(docker)
```

Meaning: you're `deploy`, your UID is 1001, and you're also a member of the `sudo` and `docker` groups.

The list of all users lives in `/etc/passwd` (don't let the name scare you: passwords aren't stored here any more; their hashes live in `/etc/shadow`, which only root can read):

```bash
grep -E "deploy|www-data|postgres" /etc/passwd
```

```text
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
postgres:x:114:121:PostgreSQL administrator:/var/lib/postgresql:/bin/bash
deploy:x:1001:1001::/home/deploy:/bin/bash
```

The columns, separated by `:`, are: name, (the password slot), UID, group ID, description, home folder, and which shell runs on login.

Notice that `www-data`'s shell is `/usr/sbin/nologin`. This is a **service user**: programs like Nginx run as this user, but no human can log in as it.

> [!note] Why services run as their own user
> Say your web server has a security bug and an attacker can use it to run commands. If the web server runs as root, the attacker owns the whole server. If it runs as `www-data`, they can do only as much as `www-data` can. Keeping the blast radius small like this is the principle of **least privilege**: everyone gets exactly as much power as they need, and no more.

Creating users and groups:

```bash
sudo useradd -m -s /bin/bash rafi        # a new user, with a home folder and the bash shell
sudo passwd rafi                         # set a password
sudo groupadd devs                       # a new group
sudo usermod -aG devs rafi               # add rafi to the devs group
```

> [!warning] Don't forget the `-a` in `usermod -aG`
> `-a` means "append": add the new group while keeping the old ones. Run `usermod -G devs rafi` without `-a` and rafi is removed from every other group, even `sudo`. And to get a new group's powers, the user has to log out and log back in once.

## Permissions: who can do what {#permissions}

```bash
ls -l
```

```text
-rwxr-x--- 1 deploy devs 2048 Nov  1 10:00 deploy.sh
drwxr-xr-x 2 deploy devs 4096 Nov  1 10:00 releases
```

The first part, `-rwxr-x---`, is what matters. It has four pieces:

| Piece | Meaning |
| --- | --- |
| `-` | Type: `-` a regular file, `d` a folder, `l` a link |
| `rwx` | What the **owner** (here `deploy`) can do |
| `r-x` | What members of the **group** (here `devs`) can do |
| `---` | What **others**, meaning everyone else, can do |

And the three letters:

| Letter | For a file | For a folder |
| --- | --- | --- |
| `r` (read) | Read the contents | See the list of what's inside |
| `w` (write) | Change the contents | Create, delete and rename files inside |
| `x` (execute) | Run it as a program | Go inside (`cd`) |

So for `deploy.sh`: deploy can read, write and run it. People in the `devs` group can read and run it but not change it. Everyone else can do nothing.

```diagram
permission-bits
Three people try to open the same file. The owner can do everything, a group member can only read and run it, and an outsider can't get in at all.
```

### Permissions as numbers {#octal}

Each letter has a value: `r = 4`, `w = 2`, `x = 1`. Add them up for one digit, and three digits together make the full permission:

| Number | In letters | Where it's used |
| --- | --- | --- |
| `755` | `rwxr-xr-x` | Programs, scripts, ordinary folders |
| `644` | `rw-r--r--` | Ordinary files: everyone reads, only the owner writes |
| `700` | `rwx------` | An owner-only folder (like `~/.ssh`) |
| `600` | `rw-------` | Secret files: private keys, `.env`, passwords |

```bash
chmod 755 deploy.sh          # with a number
chmod u+x deploy.sh          # with letters: give the owner (u) execute (x)
chmod go-w config.yml        # remove write from the group (g) and others (o)
chmod -R 750 releases/       # the folder and everything inside (-R)
```

To change the owner or group, `chown`:

```bash
sudo chown deploy:devs deploy.sh          # owner deploy, group devs
sudo chown -R www-data:www-data /var/www  # a whole folder
```

> [!danger] `chmod 777` is never the fix
> When people see "Permission denied", many just run `chmod 777`, meaning everyone gets every power. The problem goes away and a new danger appears: any user on the server, or any hacked service, can now change that file. The real question is: **who** will use this file? Make them the owner or the group, and give exactly as much as they need.

### Two special bits {#special-bits}

Sometimes you'll see another letter where the `x` should be:

- **setuid (`s`):** run `ls -l /usr/bin/passwd` and you'll see `-rwsr-xr-x`. It means whoever runs the program, it runs with the **owner's** (root's) power. That's how an ordinary user can change their own password with `passwd`, even though only root can write `/etc/shadow`. Powerful, and therefore dangerous: never put setuid on your own scripts.
- **sticky bit (`t`):** run `ls -ld /tmp` and you'll see `drwxrwxrwt`. Everyone can write to `/tmp`, but because of the trailing `t`, nobody can delete anyone else's files.

## sudo: the master key, for a moment {#sudo}

Working as root all day is like walking around with the master key in your pocket. One typo and the whole server is gone. So work as an ordinary user, and type `sudo` only before the command that needs it:

```bash
apt update                 # Permission denied
sudo apt update            # asks for your own password and runs it as root
```

`sudo` has three big advantages:

1. **Power for a moment.** Only that one command runs as root; the rest of the time you're an ordinary user.
2. **There's a record.** Who ran what with `sudo`, and when, is logged (`/var/log/auth.log` or `journalctl`). When something breaks, you can trace it.
3. **It can be controlled.** Who gets `sudo` is set in `/etc/sudoers`. You can even allow someone just one specific command.

Don't open the `sudoers` file directly in an editor. Always open it with `sudo visudo`, because it checks for mistakes before saving. One syntax error in this file and nobody can run `sudo` any more.

## Package managers: the right way to install software {#packages}

On Windows we download an `.exe` from a website and install it. On Linux there's a **package manager** instead: it downloads software from a trusted store (a repository), verifies it, installs everything it needs (dependencies) along with it, and updates it later too.

Which package manager depends on which Linux family:

| Job | Debian / Ubuntu (`apt`) | RHEL / Fedora / Amazon Linux (`dnf`) |
| --- | --- | --- |
| Refresh the list | `sudo apt update` | (`dnf` does it itself) |
| Install | `sudo apt install nginx` | `sudo dnf install nginx` |
| Update everything | `sudo apt upgrade` | `sudo dnf upgrade` |
| Remove | `sudo apt remove nginx` | `sudo dnf remove nginx` |
| Search | `apt search redis` | `dnf search redis` |
| Details | `apt show nginx` | `dnf info nginx` |

> [!note] `apt update` and `apt upgrade` aren't the same
> `update` only refreshes the repository's **list**: which packages have which new versions. It installs or changes nothing. `upgrade` uses that list to actually move packages to their new versions. So you usually run both together: `sudo apt update && sudo apt upgrade`.

Packages from a repository are signed with a **digital signature**. The package manager checks the signature before installing, so if someone tampered with a package on the way, it's caught. That's why a package manager is far safer than a script from a random website.

## SSH keys: no password, and safer {#ssh-keys}

The way into a server is **SSH**. You can log in with a password, but on every server on the internet, bots spend all day trying thousands of passwords. The solution is a **key pair**.

A simple analogy: you make lots of **padlocks** and fit them to the doors of different servers. There's only one **key** to those padlocks, and only you have it.

- The **public key** is the padlock. Give it to as many servers as you like; it does no harm if someone sees it.
- The **private key** is the key. It never leaves your machine: you never give it to anyone or paste it anywhere.

```bash
ssh-keygen -t ed25519 -C "rafi@laptop"     # create a key pair (set a passphrase)
ssh-copy-id deploy@203.0.113.10            # put the public key on the server
ssh deploy@203.0.113.10                    # now you get in without a password
```

`ssh-copy-id` really just appends your public key to the server's `~/.ssh/authorized_keys` file. SSH is very strict: if that folder or file has permissions that are too open, it ignores the key altogether:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519
```

To avoid typing long commands every day, give the server a name in `~/.ssh/config` on your laptop:

```text
Host web1
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519
```

Now just typing `ssh web1` is enough.

### Harden the server {#harden-ssh}

Once you can log in with a key, switch off password login and root login completely. In the server's `/etc/ssh/sshd_config`:

```text
PasswordAuthentication no
PermitRootLogin no
```

Then `sudo systemctl reload ssh` (on some distros the service is called `sshd`).

> [!danger] Don't lock yourself out
> While changing SSH settings, **keep one session open**. After the reload, log in from a **new** terminal to check that everything works. If something's wrong, you can fix it from the open session. Close both sessions and there's no way back in; then you'd need the cloud console or a trip to the data centre.

## Hands-on: a shared folder for a team {#hands-on}

The situation: `rafi` and `nadia` will both deploy into the `/srv/app` folder. Each should be able to change the other's files, but no outsider should even be able to look inside. (Do this in a VM or WSL on your machine, or on a small cloud server.)

```bash
# Two users and a group
sudo useradd -m -s /bin/bash rafi
sudo useradd -m -s /bin/bash nadia
sudo groupadd deployers
sudo usermod -aG deployers rafi
sudo usermod -aG deployers nadia

# The shared folder
sudo mkdir -p /srv/app
sudo chown root:deployers /srv/app
sudo chmod 2770 /srv/app
```

The `770` at the end of `2770` means the owner and group can do everything and everyone else nothing. The leading `2` is the **setgid** bit: whoever creates a file inside this folder, the file's group will be `deployers`, not the creator's own group. So both of them can change every new file.

Check it:

```bash
sudo -u rafi touch /srv/app/release-1.txt
ls -l /srv/app
sudo -u nadia sh -c 'echo "checked" >> /srv/app/release-1.txt'   # can nadia write? let's see
sudo -u www-data ls /srv/app                                      # Permission denied
```

```text
-rw-r--r-- 1 rafi deployers 0 Nov  1 10:20 release-1.txt
sh: 1: cannot create /srv/app/release-1.txt: Permission denied
```

See, the file's group became `deployers` on its own. But there's a problem: the permission is `rw-r--r--`, so the group has no write, and nadia's write failed. That's because rafi's **umask** (which sets the default permission for new files) strips group write. The fix: `umask 002` (in the user's `~/.bashrc`), or `chmod g+w` on the particular file. Small things like this eat hours in production, so it's worth seeing it with your own hands once.

> [!tip] Poke at it a little
> Run `umask` to see your current value (usually `0022`). Then create a file after `umask 002` and see the difference in `ls -l`. Hint: the umask is the set of bits that get **stripped**.

## What matters in production {#production}

- **Secret files get `600`.** `.env`, database passwords, private keys, TLS keys: only the owner reads them. Many tools (SSH included) refuse to work when they see permissions that are too open.
- **Every service gets its own user.** `app`, `postgres`, `www-data` are separate. If one is hacked, the others survive.
- **Security updates, regularly.** Turn on `unattended-upgrades` on Ubuntu and security patches install themselves. Do big version upgrades by hand, after testing on staging.
- **Pin package versions in production.** Install today and you get one version; tomorrow, another. Writing versions down with a Docker image or Ansible keeps every server identical (coming in later parts).
- **Watch who's getting in.** `last` shows who logged in and when, and `/var/log/auth.log` (or `journalctl -u ssh`) shows failed attempts. Don't be alarmed by thousands of failed attempts; that's the normal state of the internet. `fail2ban` blocks IPs that keep failing for a while.
- **When someone leaves, their access leaves too.** When someone leaves the team, lock their user (`sudo usermod -L <user>`) and remove their key from `authorized_keys`.

## Recap {#recap}

- Every person and service is a user, identified by a UID. UID 0 means root, with all power.
- Services run as their own users (`www-data`, `postgres`) so the damage stays small if one is hacked. That's least privilege.
- Permissions cover three parties (owner, group, others) and three kinds (`r`, `w`, `x`). On a folder, `x` means going inside.
- `r=4, w=2, x=1`: `755` for programs and folders, `644` for ordinary files, `600` for secret files. Never `777`.
- With `sudo` only the commands that need it run as root, and everything is logged. Change `sudoers` only with `visudo`.
- `apt` (Ubuntu) and `dnf` (the RHEL family) fetch software from signed repositories. `update` fetches the list, `upgrade` actually changes things.
- SSH keys: the public key is the padlock, the private key is the key. Once key login works, switch off password and root login, keeping one session open.

## Check yourself {#quiz}

**1.** Looking at `-rw-r-----  1 app  app  220 config.env`: what can the `app` user do, what can other members of the `app` group do, and what can everyone else do? What is it as a number?

> [!tip]- Answer
> The owner `app` can read and write (`rw-`). Members of the `app` group can only read (`r--`). Everyone else can do nothing (`---`). As a number it's `640` (4+2, 4, 0). Good for a secret config, as long as only trusted services are in the group. For something stricter, `600`.

**2.** A folder has `r` but no `x`. What can and can't you do with it?

> [!tip]- Answer
> You can see the names of the files inside with `ls` (`r`), but you can't `cd` into it or open any file inside, because going inside a folder is what `x` allows. That's why folders usually get `r` and `x` together.

**3.** A colleague says: "Nginx was throwing permission errors, so I ran `chmod -R 777` on all of `/var/www`, and now it works." What do you tell them, and what's the right way?

> [!tip]- Answer
> Now any user on the server, or any hacked process, can change the website's files, for example to plant a malicious script in a page. The right way: find which user Nginx runs as (usually `www-data`), then `sudo chown -R www-data:www-data /var/www/site` (or the deploy user as owner with `www-data` as the group), with `755` or `750` on folders and `644` or `640` on files. Nginx only needs to read, not write.

**4.** After running `sudo usermod -G docker rafi`, rafi says he can't run `sudo` any more. What happened?

> [!tip]- Answer
> The `-a` (append) was left out. With `-G` alone, the user's whole group list is replaced by just `docker`, so rafi was removed from the `sudo` group. The right command is `sudo usermod -aG docker rafi`. To fix it now, another user with sudo power has to run `sudo usermod -aG sudo rafi`.

**5.** Is it dangerous to email someone your public key? And your private key?

> [!tip]- Answer
> Sending your public key is no problem; it's like a padlock that anyone can see. Give a server's admin your public key and they can grant you access. Never send your private key to anyone or upload it anywhere. Whoever gets it can log into every server as you. If it leaks by accident, make a new key straight away and remove the old public key from `authorized_keys` on every server.

**6.** You've just been given a new Ubuntu server. What will you do in the first half hour? Make a list.

> [!tip]- Hint
> A good start: `sudo apt update && sudo apt upgrade`, create an ordinary user for yourself and add it to the `sudo` group, install your key with `ssh-copy-id`, confirm you can log in with the key in a new session, then `PasswordAuthentication no` and `PermitRootLogin no`, turn on the firewall (`ufw allow OpenSSH`, then `ufw enable`), and `unattended-upgrades`. If you can write down why each step matters in your own words, that's your first runbook.

# Conecthus Deployment Diagnosis - Patria Server (srv1559444)

## Problem Summary

The `conecthus.patriatechnology.com` domain was being routed to the ERP system instead of the Conecthus stack. The root cause was a conflicting nginx server block:

```nginx
server_name ~^(?<prod_tenant>[^.]+)\.patriatechnology\.com$;
```

This regex captures **any** subdomain of `patriatechnology.com` as an ERP tenant, including `conecthus`. Requests to `conecthus.patriatechnology.com` were matched by this default block and proxied to the ERP system on port 8090.

## Symptoms

- `https://conecthus.patriatechnology.com/` → ERP signup/login page (incorrect)
- `https://conecthus.patriatechnology.com/api` → ERP API response (incorrect)
- Expected: Frontend Conecthus + NestJS API on ports 5173/3005

## Root Cause

The nginx config had a catch-all tenant block that matched all subdomains:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ~^(?<prod_tenant>[^.]+)\.patriatechnology\.com$;
    ...
    location / {
        proxy_pass http://127.0.0.1:8090;  # ERP backend
        proxy_set_header X-Tenant $prod_tenant;
    }
}
```

Since `conecthus` matches `~^(?<prod_tenant>[^.]+)\.patriatechnology\.com$;`, it was routed to the ERP system.

## Solution

Added an explicit `server_name conecthus.patriatechnology.com;` block that takes precedence over the regex catch-all. The fix:

1. **Removed conflicting symlinks** that had the regex tenant block:
   - `api.patriatechnology.com` → removed from `sites-enabled`
   - `api.patriatechnology.com.bak-*` → removed from `sites-enabled`

2. **Created explicit Conecthus config** at `/etc/nginx/sites-available/conecthus.patriatechnology.com`:

```nginx
# HTTP → HTTPS redirect (port 80)
server {
    listen 80;
    listen [::]:80;
    server_name conecthus.patriatechnology.com;

    location /.well-known/acme-challenge/ {
        root /var/www/conecthus;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS → Conecthus services (port 443)
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name conecthus.patriatechnology.com;

    ssl_certificate /etc/letsencrypt/live/patriatechnology.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/patriatechnology.com/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3005/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    location /mqtt {
        proxy_pass http://127.0.0.1:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

3. **Validation steps** (run on srv1559444):
   ```bash
   # 1. Test config
   sudo nginx -t
   
   # 2. Reload
   sudo nginx -s reload
   
   # 3. Frontend
   curl -I https://conecthus.patriatechnology.com/
   # Expected: HTTP/2 200
   
   # 4. API
   curl -i https://conecthus.patriatechnology.com/api
   # Expected: NestJS response (401/404/etc), NOT "ERP API"
   
   # 5. Verify block in loaded config
   sudo nginx -T 2>/dev/null | grep -n -A 60 "server_name conecthus.patriatechnology.com"
   
   # 6. Verify tenant regex still exists (global unchanged)
   sudo nginx -T 2>/dev/null | grep -n "server_name ~^(?<prod_tenant>[^.]+)"
   ```

## Key Files Modified

- `/etc/nginx/sites-available/conecthus.patriatechnology.com` — new explicit block
- Removed: `/etc/nginx/sites-enabled/api.patriatechnology.com`, `*.bak-*` symlinks
- Symlink: `/etc/nginx/sites-enabled/conecthus.patriatechnology.com` → `/etc/nginx/sites-available/conecthus.patriatechnology.com`

## What Was NOT Changed

- ✅ Docker / Prisma / backend / frontend — left untouched (previously validated healthy)
- ✅ Redis / PostgreSQL / MQTT — left untouched
- ✅ Global tenant regex `server_name ~^(?<prod_tenant>[^.]+)\.patriatechnology\.com$;` — preserved (other subdomains still route to ERP)
- ✅ No code changes to NestJS, React, React Native, or Expo apps

## Success Criteria (all must pass)

1. `nginx -t` → `syntax is ok / test is successful`
2. `nginx -s reload` → success (no errors)
3. `curl -I https://conecthus.patriatechnology.com/` → `HTTP/2 200`
4. `curl -i https://conecthus.patriatechnology.com/api` → NestJS response (not "ERP API")
5. `nginx -T | grep server_name conecthus.patriatechnology.com` → explicit block present
6. `nginx -T | grep prod_tenant` → regex still exists for other tenants

## Nginx Variable Expansion Issue (PowerShell Remote)

When attempting to write the config via remote PowerShell, `$host`, `$request_uri`, `$scheme`, `$http_upgrade`, `$proxy_add_x_forwarded_for` were being expanded to `System.Management.Automation.Internal.Host.InternalHost`, breaking nginx syntax.

**Workaround**: Transfer the config file via SCP (binary transfer, no shell interpretation), then decode on the remote server:

```bash
# On local machine
scp -i ~/id_ed25519_patria /tmp/nginx_conecthus_v13.conf root@srv1559444.hstgr.cloud:/etc/nginx/sites-available/conecthus.patriatechnology.com

# On remote server (decodes Base64 or copies bytes directly)
base64 -d /tmp/b64_nginx.txt > /etc/nginx/sites-available/conecthus.patriatechnology.com
# OR simply: cp /tmp/nginx_conecthus_v13.conf /etc/nginx/sites-available/conecthus.patriatechnology.com
```

The SCP method preserves `$` variables literally since it transfers raw bytes, avoiding the remote PowerShell expansion issue entirely.

## Commands Executed on srv1559444

```bash
# Remove conflicting tenant blocks
rm /etc/nginx/sites-enabled/api.patriatechnology.com
rm /etc/nginx/sites-enabled/api.patriatechnology.com.bak-*
rm /etc/nginx/sites-enabled/api.patriatechnology.com.bak-pre-*

# Create conecthus symlink
ln -sf /etc/nginx/sites-available/conecthus.patriatechnology.com /etc/nginx/sites-enabled/conecthus.patriatechnology.com

# Test and reload
nginx -t
sudo nginx -s reload

# Validate
curl -I https://conecthus.patriatechnology.com/
curl -i https://conecthus.patriatechnology.com/api

# Verify config
nginx -T 2>/dev/null | grep -n -A 60 "server_name conecthus.patriatechnology.com"
nginx -T 2>/dev/null | grep -n "server_name ~^(?<prod_tenant>[^.]+)"
```
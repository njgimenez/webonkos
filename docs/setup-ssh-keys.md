# Configurar SSH Keys para GitHub

## Instrucciones Paso a Paso

### 1. Generar SSH Key
```bash
# Generar nueva clave SSH
ssh-keygen -t ed25519 -C "tu-email@example.com"

# Presiona Enter para usar ubicación por defecto
# Presiona Enter para no usar passphrase (o ingresa una si prefieres)
```

### 2. Iniciar SSH Agent
```bash
# Iniciar el agente SSH
eval "$(ssh-agent -s)"

# Agregar la clave SSH al agente
ssh-add ~/.ssh/id_ed25519
```

### 3. Copiar Clave Pública
```bash
# Mostrar la clave pública
cat ~/.ssh/id_ed25519.pub

# Copia todo el contenido (empieza con ssh-ed25519...)
```

### 4. Agregar Clave a GitHub
1. Ve a [GitHub.com](https://github.com) → Settings
2. En el menú lateral, click en **SSH and GPG keys**
3. Click en **New SSH key**
4. **Title**: `Onkos System - Local Machine`
5. **Key**: Pega la clave pública que copiaste
6. Click en **Add SSH key**

### 5. Probar Conexión SSH
```bash
# Probar conexión a GitHub
ssh -T git@github.com

# Deberías ver: "Hi username! You've successfully authenticated..."
```

### 6. Configurar Repositorio para SSH
```bash
# Cambiar URL del repositorio a SSH
git remote set-url origin git@github.com:usuario/repositorio.git

# Probar push
git push -u origin main
```

## Ventajas de SSH

### Pros
- No requiere tokens
- Más seguro
- No expira
- Funciona con todos los comandos git

### Contras
- Configuración inicial más compleja
- Requiere acceso a la máquina
- No funciona en CI/CD sin configuración adicional

## Después de Configurar SSH

```bash
# Subir rama main
git push -u origin main

# Crear y subir rama dev-IA
git checkout -b dev-IA
git push -u origin dev-IA
```

## Solución de Problemas

### Error: Permission denied (publickey)
```bash
# Verificar que la clave esté en el agente
ssh-add -l

# Si no aparece, agregarla
ssh-add ~/.ssh/id_ed25519
```

### Error: Host key verification failed
```bash
# Agregar GitHub a known_hosts
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
```

### Error: Could not resolve hostname
```bash
# Verificar conexión a internet
ping github.com

# Verificar configuración DNS
nslookup github.com
```

### Error: Connection timeout
```bash
# Verificar firewall
sudo ufw status

# Verificar proxy (si usas uno)
echo $http_proxy
echo $https_proxy
```

## Configuración para Múltiples Cuentas

Si tienes múltiples cuentas de GitHub:

### 1. Crear claves separadas
```bash
# Clave para cuenta personal
ssh-keygen -t ed25519 -C "personal@example.com" -f ~/.ssh/id_ed25519_personal

# Clave para cuenta de trabajo
ssh-keygen -t ed25519 -C "work@example.com" -f ~/.ssh/id_ed25519_work
```

### 2. Configurar SSH config
```bash
# Crear archivo de configuración
nano ~/.ssh/config
```

### 3. Agregar configuración
```
# Cuenta personal
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal

# Cuenta de trabajo
Host github.com-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work
```

### 4. Usar en repositorios
```bash
# Repositorio personal
git remote set-url origin git@github.com-personal:usuario/repositorio.git

# Repositorio de trabajo
git remote set-url origin git@github.com-work:empresa/repositorio.git
```

## Verificación Final

```bash
# Verificar configuración SSH
ssh -T git@github.com

# Verificar configuración del repositorio
git remote -v

# Hacer push de prueba
git push origin main
```
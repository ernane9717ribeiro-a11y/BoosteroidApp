# 📱 Como gerar o APK pelo celular (GitHub Actions)

Sem precisar de PC nem instalar nada pesado. O GitHub compila por você de graça!

---

## Passo a passo

### 1. Criar conta no GitHub (se não tiver)
- Acesse https://github.com no navegador do celular
- Clique em **Sign up** e crie sua conta grátis

### 2. Criar repositório
- Clique no **+** (canto superior direito) → **New repository**
- Nome: `BoosteroidApp`
- Deixe **Public** (ou Private)
- Clique em **Create repository**

### 3. Fazer upload dos arquivos
Você tem duas opções:

**Opção A — pelo navegador (mais fácil):**
- Na página do repositório, clique em **uploading an existing file**
- Extraia o ZIP no celular e faça upload de TODOS os arquivos
  (mantenha a estrutura de pastas!)
- Clique em **Commit changes**

**Opção B — pelo Termux (mais rápido):**
```bash
pkg install git
git clone https://github.com/SEU_USUARIO/BoosteroidApp
# copie os arquivos para dentro da pasta
cd BoosteroidApp
git add .
git commit -m "projeto"
git push
```

### 4. Aguardar a compilação
- Vá na aba **Actions** do repositório
- Você verá o workflow **"Build APK"** rodando (ícone amarelo = rodando)
- Aguarde ~3-5 minutos até ficar verde ✅

### 5. Baixar o APK
- Clique no workflow concluído
- Lá embaixo em **Artifacts**, clique em **Boosteroid-APK**
- Vai baixar um ZIP contendo o `app-debug.apk`
- Extraia e instale no celular!

---

## Instalar o APK

1. Vá em **Configurações → Segurança → Fontes desconhecidas** → Ativar
   (ou "Instalar apps desconhecidos" dependendo do Android)
2. Abra o gerenciador de arquivos, localize o `app-debug.apk`
3. Toque nele e instale

---

## Dúvidas

- **O workflow não aparece?** Verifique se a pasta `.github/workflows/build.yml`
  foi enviada corretamente.
- **Erro de compilação?** Abra a aba Actions, clique no workflow com ❌
  e veja o log de erro.
- **APK instalado mas não abre?** Certifique-se que seu Android é 7.0+.

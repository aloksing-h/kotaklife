# AEM Import Helper Reference Guide

This document outlines the setup, execution, and debugging steps for uploading migrated ZIP packages and mapping external assets to AEM using the `@adobe/aem-import-helper` tool.

---

## 1. Project Setup

Before running the upload command, ensure your local environment is configured correctly.

### Install the Helper

Ensure the tool is installed in your project as a development dependency:

```bash
npm install @adobe/aem-import-helper --save-dev
```

### Configure package.json

Your `package.json` must include the alias to trigger the tool. Add the following line to your `"scripts"` block:

```json
"aem-upload": "aem-import-helper aem upload"
```

### Configure Authentication Token

Save your active AEM Developer Console token inside a file named `token.txt` in your project's root directory.

> **Note:** AEM Local Development tokens expire every 24 hours. You will need to rotate this token daily.

---

## 2. Execution Command

Run the following command in your Git Bash terminal to upload your zip file and download/map the corresponding assets. Ensure you replace the file paths and target URL with your actual environment details.

```bash
npm run aem-upload -- --token token.txt --zip "C:\Users\Mahesh.kamble\Downloads\protection\kotak-life_what-are-insurance-riders-and-how-to-choose-them-in-a-term-plan.zip" --asset-mapping "C:\Users\Mahesh.kamble\Downloads\protection\asset-mapping.json" --target https://author-pXXXXX-eYYYYYY.adobeaemcloud.com
```

> **Tip:** The double dashes (`--`) before `--token` are required to pass arguments from npm directly to the underlying script.

---

## 3. Troubleshooting & Debugging Guide

If the process fails or hangs, identify the symptom below to apply the correct fix.

### SSL certificate problem: self signed certificate

- **Root Cause:** Corporate firewalls/proxies intercepting Node.js traffic to inject their own SSL certs.
- **Solution:** Run the following in your terminal before running the upload command:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

### 405 - Method Not Allowed

- **Root Cause:** The `--target` URL incorrectly includes UI paths.
- **Solution:** Remove the UI path. Use only the base environment URL (e.g., `https://author-p123-e456.adobeaemcloud.com`).

### 401 Unauthorized

- **Root Cause:** The local development token has expired.
- **Solution:** Generate a new token via **Cloud Manager > Developer Console > Integrations > Local Token**.

### Asset Path Mismatches / 0 files uploaded

- **Root Cause:** AEM paths are strictly case-sensitive and must be lowercase.
- **Solution:** Ensure your Asset Import Path and JSON use strictly lowercase naming (e.g., `/content/dam/assets-kotak`).

### Missing script: "aem-upload"

- **Root Cause:** Node cannot find the command alias in `package.json`.
- **Solution:** Verify you are in the correct root directory and that you saved the `package.json` file.

---

# Installation Guide — Resolving Dependency Issues

## Issue

After adding new packages (`joi`, `@nestjs/terminus`, `@nestjs/swagger`), you may encounter module resolution errors during build.

---

## Solution 1: Clean Install (Recommended)

### Windows (PowerShell)

```powershell
cd api

# Remove existing dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Clean npm cache
npm cache clean --force

# Install dependencies
npm install

# If peer dependency warnings appear, use:
npm install --legacy-peer-deps
```

### Linux/Mac (Bash)

```bash
cd api

# Remove existing dependencies
rm -rf node_modules package-lock.json

# Clean npm cache
npm cache clean --force

# Install dependencies
npm install

# If peer dependency warnings appear, use:
npm install --legacy-peer-deps
```

---

## Solution 2: Manual Package Installation

If clean install fails, install packages one by one:

```bash
cd api

# Install Joi for config validation
npm install joi --legacy-peer-deps

# Install Terminus for health checks
npm install @nestjs/terminus --legacy-peer-deps

# Install Swagger for API documentation
npm install @nestjs/swagger --legacy-peer-deps

# Install Swagger UI Express (peer dependency)
npm install swagger-ui-express --legacy-peer-deps
```

---

## Solution 3: Use Yarn (Alternative)

If npm continues to have issues:

```bash
cd api

# Install Yarn globally (if not installed)
npm install -g yarn

# Remove npm artifacts
rm -rf node_modules package-lock.json

# Install with Yarn
yarn install

# Build
yarn build

# Run
yarn start:dev
```

---

## Verify Installation

After successful installation, verify:

### 1. Check installed packages

```bash
npm list joi @nestjs/terminus @nestjs/swagger
```

Expected output:
```
api@0.0.1
├── @nestjs/swagger@11.x.x
├── @nestjs/terminus@11.x.x
└── joi@17.x.x
```

### 2. Build the project

```bash
npm run build
```

Should complete without errors.

### 3. Start development server

```bash
npm run start:dev
```

Should start without errors.

### 4. Test health endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

### 5. Test Swagger docs

Open browser: `http://localhost:3001/api/docs`

Should display interactive API documentation.

---

## Common Errors & Fixes

### Error: "Cannot find module 'rxjs'"

**Cause**: Peer dependency resolution issue

**Fix**:
```bash
npm install rxjs --legacy-peer-deps
```

### Error: "ERESOLVE unable to resolve dependency tree"

**Cause**: Conflicting peer dependencies

**Fix**:
```bash
npm install --legacy-peer-deps
```

### Error: "Module not found: @angular-devkit/core"

**Cause**: NestJS CLI dependency issue

**Fix**:
```bash
npm install -g @nestjs/cli@latest
npm install
```

### Error: "Cannot find module 'class-validator'"

**Cause**: Missing peer dependency

**Fix**:
```bash
npm install class-validator class-transformer --legacy-peer-deps
```

---

## Node Version Compatibility

Ensure you're using a compatible Node.js version:

```bash
node --version
```

**Recommended**: Node.js 18.x or 20.x

If using Node.js 24.x (as in your case), some packages may have compatibility issues. Consider using Node Version Manager (nvm):

### Install nvm (if not installed)

**Windows**: Download from https://github.com/coreybutler/nvm-windows

**Linux/Mac**:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Switch to Node 20

```bash
nvm install 20
nvm use 20
node --version  # Should show v20.x.x
```

Then retry installation:
```bash
cd api
rm -rf node_modules package-lock.json
npm install
```

---

## Alternative: Skip New Packages (Temporary)

If you need to proceed immediately without the new packages, you can temporarily skip them:

### 1. Remove config validation

Comment out in `api/src/app.module.ts`:
```typescript
// import { configValidationSchema } from './config/config.schema';

ConfigModule.forRoot({
  isGlobal: true,
  // validationSchema: configValidationSchema,  // Comment this out
}),
```

### 2. Remove health module

Comment out in `api/src/app.module.ts`:
```typescript
// import { HealthModule } from './health/health.module';

imports: [
  // ... other modules
  // HealthModule,  // Comment this out
],
```

### 3. Remove Swagger

Comment out in `api/src/main.ts`:
```typescript
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Comment out Swagger setup
// const config = new DocumentBuilder()...
// SwaggerModule.setup('api/docs', app, document);
```

### 4. Remove Swagger decorators

Comment out in controllers:
```typescript
// import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

// @ApiTags('Scanner')
// @ApiBearerAuth()
// @ApiOperation({ summary: '...' })
// @ApiResponse({ status: 200, type: ScanResultDto })
```

**Note**: This is a temporary workaround. The new packages provide important functionality and should be installed for production.

---

## Docker Alternative

If local installation continues to fail, use Docker:

### 1. Create Dockerfile (if not exists)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

### 2. Build and run

```bash
cd api
docker build -t morocco360-api .
docker run -p 3001:3001 --env-file .env morocco360-api
```

---

## Package Versions

If all else fails, lock to specific versions in `package.json`:

```json
{
  "dependencies": {
    "@nestjs/swagger": "^11.2.6",
    "@nestjs/terminus": "^11.1.1",
    "joi": "^17.13.3",
    "swagger-ui-express": "^5.0.1"
  }
}
```

Then:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## Get Help

If issues persist:

1. **Check Node version**: `node --version` (use 18.x or 20.x)
2. **Check npm version**: `npm --version` (use 9.x or 10.x)
3. **Clear all caches**:
   ```bash
   npm cache clean --force
   rm -rf ~/.npm
   ```
4. **Try Yarn**: `yarn install`
5. **Use Docker**: Build in container

---

## Success Checklist

After installation, verify:

- [ ] `npm run build` completes without errors
- [ ] `npm run start:dev` starts successfully
- [ ] `curl http://localhost:3001/health` returns 200
- [ ] `http://localhost:3001/api/docs` loads Swagger UI
- [ ] No console errors in terminal
- [ ] All tests pass: `npm run test`

---

## Next Steps

Once installation is successful:

1. ✅ Generate secrets for `.env`
2. ✅ Run migrations: `npm run migration:run`
3. ✅ Seed database: `npm run seed`
4. ✅ Test scanner flow
5. ✅ Review [Quick Start Guide](./QUICK_START.md)

---

**Need more help?** Check the [Troubleshooting section](./QUICK_START.md#9-common-issues) in the Quick Start Guide.

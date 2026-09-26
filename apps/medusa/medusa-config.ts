import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Uploaded files (product images, category images, CSV imports) go to Cloudflare R2
// through Medusa's S3 provider. Without a file module Medusa falls back to its
// local-disk provider, which in production saved images inside the container (gone on
// the next deploy) under http://localhost:9000/static/... URLs no browser can load.
// Local dev without R2 settings keeps that local provider.
const r2 = {
  endpoint: process.env.R2_ENDPOINT_URL,
  bucket: process.env.R2_BUCKET,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  // Public base URL the bucket is served from: a custom domain on the bucket
  // (e.g. https://media.strengthiva.com) or its r2.dev URL. No trailing slash.
  publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/+$/, ''),
}
const r2Configured = Object.values(r2).every(Boolean)

// Stopgap until R2 exists: keep the local-disk provider, but give it the public URL
// its files are actually served from (Medusa serves static/ at /static, and
// MEDUSA_STORE_DOMAIN proxies it), e.g. https://medusa-store.strengthiva.com/static.
// docker-compose.prod.yml mounts static/ on a volume so uploads survive deploys.
// Unset, the provider records http://localhost:9000/static/... URLs.
const localFilePublicUrl = process.env.LOCAL_FILE_PUBLIC_URL?.replace(/\/+$/, '')
if (process.env.NODE_ENV === 'production' && !r2Configured && !localFilePublicUrl) {
  console.warn(
    '[medusa-config] Neither R2_* nor LOCAL_FILE_PUBLIC_URL is set; uploaded images ' +
      'get unreachable http://localhost:9000/static/... URLs.'
  )
}

// Admin dashboard upload cap. The dashboard defaults to 1 MB, which rejected normal
// product photos. Build-time (inlined into the admin bundle).
const ADMIN_MAX_UPLOAD_BYTES = 10 * 1024 * 1024

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Bound the Postgres connection pool. Without this, db:migrate/startup on the
    // prod VPS storms medusa-db with connections and hangs (every deploy stalled at
    // "Running migrations..."). Dropped by accident when this config was rewritten
    // for the file module; restored to the known-good values the live image used.
    databaseDriverOptions: {
      pool: { min: 0, max: 60, acquireTimeoutMillis: 120000, createTimeoutMillis: 120000 },
    },
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  admin: {
    maxUploadFileSize: ADMIN_MAX_UPLOAD_BYTES,
  },
  modules: [
    ...(r2Configured
      ? [
          {
            resolve: '@medusajs/medusa/file',
            options: {
              providers: [
                {
                  resolve: '@medusajs/medusa/file-s3',
                  id: 'r2',
                  options: {
                    endpoint: r2.endpoint,
                    bucket: r2.bucket,
                    access_key_id: r2.accessKeyId,
                    secret_access_key: r2.secretAccessKey,
                    file_url: r2.publicUrl,
                    region: 'auto',
                    // Keys land under medusa/ so the bucket can be shared with the
                    // backend's other files (batch certificates).
                    prefix: 'medusa/',
                    // R2 has no object ACLs (public access is a bucket setting), so
                    // don't send Medusa's default public-read ACL header.
                    acl: false,
                    additional_client_config: { forcePathStyle: true },
                  },
                },
              ],
            },
          },
        ]
      : localFilePublicUrl
        ? [
            {
              resolve: '@medusajs/medusa/file',
              options: {
                providers: [
                  {
                    resolve: '@medusajs/medusa/file-local',
                    id: 'local',
                    options: { backend_url: localFilePublicUrl },
                  },
                ],
              },
            },
          ]
        : []),
    {
      // Providing our own Modules.AUTH entry replaces Medusa's default entirely
      // (config entries are merged by key, last one wins) — so "emailpass" has to
      // be listed explicitly too, or the admin dashboard login (which depends on
      // it — verified working during Phase 3 setup) would break.
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          {
            // Shared SSO with app.strengthiva.com — see
            // docs/platform-architecture/tech-specs/medusa/auth-provider-sso.md
            resolve: "./src/modules/strengthiva-sso",
            id: "strengthiva-sso",
            options: {
              fastapiUrl: process.env.FASTAPI_URL,
              serviceKey: process.env.MEDUSA_SERVICE_KEY,
            },
          },
        ],
      },
    },
    {
      // Unlike Modules.AUTH above, providing a Modules.PAYMENT entry does NOT
      // replace Medusa's built-in "system" (pp_system_default) provider — that
      // one is registered internally by the Payment Module itself, not through
      // this providers array — confirmed by checking /admin/payment-providers
      // after adding this and seeing both pp_system_default and
      // pp_razorpay_razorpay listed.
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            // Custom AbstractPaymentProvider — see docs/platform-architecture/
            // tech-specs/medusa/payments-razorpay.md for why this is hand-built
            // rather than using either of the two community plugins vetted first.
            resolve: "./src/modules/razorpay",
            id: "razorpay",
            options: {
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
              webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
  ],
})

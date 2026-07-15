import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
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

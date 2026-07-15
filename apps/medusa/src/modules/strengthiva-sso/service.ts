import {
  AbstractAuthModuleProvider,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse,
} from "@medusajs/framework/types"

type Options = {
  fastapiUrl: string
  serviceKey: string
}

type FastApiUser = {
  id: string
  email: string
  name: string
  email_verified: boolean
}

/**
 * Custom Medusa v2 Auth Module Provider — the Medusa side of shared SSO with
 * app.strengthiva.com (see docs/platform-architecture/tech-specs/medusa/
 * auth-provider-sso.md).
 *
 * Unlike @medusajs/auth-emailpass (which owns credentials directly) or
 * @medusajs/auth-github (which drives an OAuth redirect/callback dance), this
 * provider does neither — it validates a session token that was already issued
 * by Better Auth on the FastAPI/Next.js side, by calling FastAPI's
 * POST /api/v1/auth/validate-session server-to-server. FastAPI stays the sole
 * identity source of truth; this provider only creates/updates the Medusa-side
 * AuthIdentity that mirrors it.
 *
 * IMPORTANT — this provider does NOT create a Medusa Customer record. Medusa's
 * own architecture handles that as a separate step: after authenticate() below
 * succeeds, the caller (app./store.'s frontend code) uses the resulting auth
 * token to call POST /store/customers, which Medusa links to this AuthIdentity
 * automatically (the same pattern @medusajs/auth-emailpass's own `register`
 * follows — checking whether app_metadata is still empty/"claimable"). That
 * frontend-side call is store-frontend work, not part of this provider.
 */
class StrengthivaSsoAuthService extends AbstractAuthModuleProvider {
  static identifier = "strengthiva-sso"
  static DISPLAY_NAME = "Strengthiva SSO"

  protected config_: Options
  protected logger_: any

  static validateOptions(options: Record<string, unknown>) {
    if (!options.fastapiUrl) {
      throw new Error("strengthiva-sso: `fastapiUrl` option is required")
    }
    if (!options.serviceKey) {
      throw new Error("strengthiva-sso: `serviceKey` option is required")
    }
  }

  constructor({ logger }: { logger: any }, options: Options) {
    // @ts-ignore — matches the pattern used by Medusa's own bundled providers
    super(...arguments)
    this.config_ = options
    this.logger_ = logger
  }

  async register(
    _userData: AuthenticationInput,
    _authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    return {
      success: false,
      error:
        "strengthiva-sso does not support registration — accounts are created " +
        "via app.strengthiva.com, not through Medusa.",
    }
  }

  async authenticate(
    userData: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const body = (userData.body ?? {}) as { session_token?: unknown }
    const sessionToken = body.session_token

    if (!sessionToken || typeof sessionToken !== "string") {
      return { success: false, error: "session_token is required" }
    }

    let user: FastApiUser
    try {
      const response = await fetch(
        `${this.config_.fastapiUrl}/api/v1/auth/validate-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Medusa-Service-Key": this.config_.serviceKey,
          },
          body: JSON.stringify({ session_token: sessionToken }),
        }
      )
      if (!response.ok) {
        return { success: false, error: "Invalid or expired session" }
      }
      user = await response.json()
    } catch (error: any) {
      this.logger_?.error?.(
        `strengthiva-sso: failed to reach FastAPI validate-session — ${error.message}`
      )
      return { success: false, error: "Could not validate session" }
    }

    // The FastAPI user id is the entity_id — the stable link between a Better
    // Auth user and this Medusa AuthIdentity, mirroring how @medusajs/auth-github
    // uses the external provider's user id as entity_id.
    const entityId = user.id
    const userMetadata = { email: user.email, name: user.name }

    let authIdentity
    try {
      authIdentity = await authIdentityService.update(entityId, {
        user_metadata: userMetadata,
      })
    } catch (error: any) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        try {
          authIdentity = await authIdentityService.create({
            entity_id: entityId,
            user_metadata: userMetadata,
          })
        } catch (createError: any) {
          return { success: false, error: createError.message }
        }
      } else {
        return { success: false, error: error.message }
      }
    }

    return { success: true, authIdentity }
  }
}

export default StrengthivaSsoAuthService

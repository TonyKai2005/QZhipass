import http, {getErrorMessage} from './http'
import {type LoginInfo, saveLoginInfo} from './session'

type PortalLoginType = 'MOBILE_PWD' | 'MOBILE_CODE'

interface PortalLoginResponse {
  success?: boolean
  message?: string
  data?: Record<string, unknown>
  access_token?: unknown
}

const MOBILE_PATTERN = /^1[3-9]\d{9}$/

export function isValidMobile(mobile: string) {
  return MOBILE_PATTERN.test(mobile)
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function readIdentifier(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return readString(value)
}

function normalizeLoginInfo(response: PortalLoginResponse): LoginInfo {
  if (response.success === false) {
    throw new Error(response.message || '登录失败')
  }

  const payload = response.data && typeof response.data === 'object' ? response.data : {}
  const userId = readIdentifier(payload.id)
  const accessToken = readString(response.access_token)

  if (!userId) {
    throw new Error('登录成功但后端未返回 data.id')
  }

  if (!accessToken) {
    throw new Error('登录成功但后端未返回 access_token')
  }

  return {
    userId,
    accessToken
  }
}

async function login(
  loginType: PortalLoginType,
  credential: Record<string, string>,
  fallback: string
) {
  try {
    const { data } = await http.post<PortalLoginResponse>('/v1/auth/portal/login', {
      loginType,
      credential
    })
    const loginInfo = normalizeLoginInfo(data)

    saveLoginInfo(loginInfo)
    return loginInfo
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback))
  }
}

export async function loginByPassword(mobile: string, password: string) {
  return login(
    'MOBILE_PWD',
    {
      mobile,
      password
    },
    '手机号或密码登录失败'
  )
}

export async function sendSmsCode(mobile: string) {
  try {
    const { data } = await http.post<PortalLoginResponse>('/v1/auth/portal/send_code', {
      phone: mobile
    })

    if (data?.success === false) {
      throw new Error(data.message || '验证码发送失败')
    }

    return true
  } catch (error) {
    throw new Error(getErrorMessage(error, '验证码发送失败'))
  }
}

export async function loginBySms(mobile: string, smsCode: string) {
  return login(
    'MOBILE_CODE',
    {
      mobile,
      smsCode
    },
    '验证码登录失败'
  )
}

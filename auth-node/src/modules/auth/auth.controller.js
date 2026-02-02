/**
 * 인증 컨트롤러 - 모든 인증 관련 API 로직
 *
 * 【학습 개념: Controller의 역할】
 * MVC 패턴에서 Controller는:
 * - 요청(Request) 받기
 * - 입력 데이터 추출
 * - 비즈니스 로직 실행 (Model 호출)
 * - 응답(Response) 보내기
 *
 * Controller는 "교통 정리자" 역할:
 * - 직접 데이터베이스를 조작하지 않음 (Model이 함)
 * - 직접 HTML을 그리지 않음 (View가 함, 우리는 JSON API)
 */

const UserModel = require('../users/user.model');
const { verifyPassword } = require('../../utils/password');
const { generateTokens, verifyRefreshToken, generateAccessToken } = require('../../utils/token');
const { errors, asyncHandler } = require('../../middlewares/errorHandler');

/**
 * 회원가입
 * POST /api/auth/register
 *
 * 【인증 플로우: 회원가입】
 * 1. 이메일 중복 확인
 * 2. 비밀번호 해싱 (Model에서 처리)
 * 3. 사용자 생성
 * 4. 성공 응답 (토큰 발급은 별도 로그인에서)
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // 1. 이메일 중복 확인
  const existingUser = await UserModel.emailExists(email);
  if (existingUser) {
    throw errors.conflict('이미 사용 중인 이메일입니다');
  }

  // 2. 사용자 생성 (비밀번호 해싱은 Model에서)
  const user = await UserModel.create({ email, password, name });

  // 3. 성공 응답
  res.status(201).json({
    success: true,
    message: '회원가입이 완료되었습니다',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
      },
    },
  });
});

/**
 * JWT 로그인
 * POST /api/auth/login
 *
 * 【인증 플로우: JWT 로그인】
 * 1. 이메일로 사용자 찾기
 * 2. 비밀번호 검증
 * 3. JWT 토큰 생성 (Access + Refresh)
 * 4. 토큰 응답
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. 사용자 찾기
  const user = await UserModel.findByEmail(email);

  // 【보안 포인트】 이메일 존재 여부를 공개하지 않음
  // "이메일이 없습니다" 대신 "이메일 또는 비밀번호가 올바르지 않습니다"
  if (!user) {
    throw errors.unauthorized('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  // 2. 비밀번호 검증
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw errors.unauthorized('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  // 3. JWT 토큰 생성
  const tokens = generateTokens(user);

  // 4. 응답
  res.json({
    success: true,
    message: '로그인 성공',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    },
  });
});

/**
 * 토큰 갱신
 * POST /api/auth/refresh
 *
 * 【인증 플로우: 토큰 갱신】
 * 1. Refresh Token 검증
 * 2. 새 Access Token 발급
 *
 * 【보안 포인트】 Refresh Token 탈취 대응
 * 실제 서비스에서는 Refresh Token을 DB에 저장하고
 * 로그아웃 시 무효화하거나, 토큰 로테이션 적용
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // 1. Refresh Token 검증
  const verified = verifyRefreshToken(refreshToken);
  if (!verified.success) {
    throw errors.unauthorized('유효하지 않은 Refresh Token입니다');
  }

  // 2. 사용자 존재 확인
  const user = await UserModel.findById(verified.data.userId);
  if (!user) {
    throw errors.unauthorized('사용자를 찾을 수 없습니다');
  }

  // 3. 새 Access Token 발급
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  res.json({
    success: true,
    message: '토큰 갱신 성공',
    data: {
      accessToken: newAccessToken,
    },
  });
});

/**
 * 내 정보 조회 (JWT)
 * GET /api/auth/me
 *
 * authJWT 미들웨어를 통과하면 req.user에 사용자 정보가 있음
 */
const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

/**
 * Session 로그인
 * POST /api/auth/session/login
 *
 * 【인증 플로우: Session 로그인】
 * 1. 이메일/비밀번호 검증 (JWT와 동일)
 * 2. 세션에 사용자 정보 저장
 * 3. 세션 ID가 쿠키로 자동 전송됨
 */
const sessionLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. 사용자 찾기 및 비밀번호 검증
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw errors.unauthorized('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw errors.unauthorized('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  // 2. 세션에 사용자 정보 저장
  // express-session이 자동으로:
  // - 세션 생성/업데이트
  // - Session ID 쿠키 전송
  req.session.userId = user.id;
  req.session.email = user.email;

  res.json({
    success: true,
    message: '로그인 성공 (Session)',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
  });
});

/**
 * Session 로그아웃
 * POST /api/auth/session/logout
 *
 * 【Session vs JWT 로그아웃 비교】
 * - Session: 서버에서 세션 삭제 → 즉시 무효화
 * - JWT: 토큰 만료까지 유효 (블랙리스트 구현 필요)
 */
const sessionLogout = asyncHandler(async (req, res) => {
  // 세션 삭제
  req.session.destroy((err) => {
    if (err) {
      throw errors.internal('로그아웃 처리 중 오류가 발생했습니다');
    }

    // 쿠키도 삭제
    res.clearCookie('sessionId');

    res.json({
      success: true,
      message: '로그아웃 되었습니다',
    });
  });
});

/**
 * 내 정보 조회 (Session)
 * GET /api/auth/session/me
 */
const sessionGetMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  register,
  login,
  refresh,
  getMe,
  sessionLogin,
  sessionLogout,
  sessionGetMe,
};

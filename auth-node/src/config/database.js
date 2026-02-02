/**
 * PostgreSQL 데이터베이스 연결 설정
 *
 * 【학습 개념: Connection Pool】
 * - 데이터베이스 연결은 비용이 큰 작업입니다
 * - Pool은 미리 여러 연결을 만들어두고 재사용합니다
 * - 이렇게 하면 매 요청마다 연결/해제하는 비용을 줄일 수 있습니다
 *
 * 【학습 개념: SQL Injection 방지】
 * - 사용자 입력을 직접 SQL에 넣으면 공격당할 수 있습니다
 * - 예: "SELECT * FROM users WHERE id = " + userId
 *   → userId가 "1; DROP TABLE users;" 면 테이블 삭제됨!
 * - 해결책: Parameterized Query 사용 ($1, $2 등)
 *   → pool.query('SELECT * FROM users WHERE id = $1', [userId])
 */

const { Pool } = require('pg');

// Pool 생성: 환경변수에서 설정을 읽어옵니다
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Pool 설정
  max: 10,              // 최대 연결 수
  idleTimeoutMillis: 30000,  // 유휴 연결 제거 시간
  connectionTimeoutMillis: 2000,  // 연결 시도 제한 시간
});

// 연결 테스트 함수
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL 연결 성공!');
    client.release();  // 연결 반환 (중요!)
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL 연결 실패:', error.message);
    return false;
  }
};

// Users 테이블 생성 SQL
// 【학습 포인트】
// - SERIAL: 자동 증가하는 정수 (1, 2, 3...)
// - VARCHAR(n): 최대 n자의 문자열
// - UNIQUE: 중복 불가 (이메일은 고유해야 함)
// - NOT NULL: 필수 값
// - DEFAULT NOW(): 현재 시간 자동 입력
const createUsersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('✅ Users 테이블 준비 완료');
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error.message);
    throw error;
  }
};

// Session 저장용 테이블 생성
const createSessionTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      PRIMARY KEY ("sid")
    );

    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `;

  try {
    await pool.query(createTableQuery);
    console.log('✅ Session 테이블 준비 완료');
  } catch (error) {
    console.error('❌ Session 테이블 생성 실패:', error.message);
    throw error;
  }
};

// 데이터베이스 초기화
const initializeDatabase = async () => {
  const connected = await testConnection();
  if (connected) {
    await createUsersTable();
    await createSessionTable();
  }
  return connected;
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
};

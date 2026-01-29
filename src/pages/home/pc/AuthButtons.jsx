import React, { useEffect, useState } from "react";
import { useAuth } from "../../../providers/AuthProvider";

const API_BASE = "https://back-r4e1.onrender.com";

export default function AuthButtons() {
  const { isAuthed, username: userId, setAuth, logout } = useAuth();
  const [modal, setModal] = useState(null); // null | "login" | "signup"

  function openLogin() {
    setModal("login");
  }

  function openSignup() {
    setModal("signup");
  }

  function closeModal() {
    setModal(null);
  }

  function handleLogout() {
    logout();
  }

  // ESC로 닫기
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") closeModal();
    }
    if (modal) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  return (
    <>
      <style>{`
        /* ===== 모달(디스플레이 창) ===== */
        .auth-modal{
          position: fixed;
          inset: 0;
          z-index: 9999;
        }
  
        .auth-modal__overlay{
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.35);
        }
  
        .auth-modal__panel{
          position: relative;
          wusernameth: 420px;
          max-width: calc(100vw - 32px);
          margin: 90px auto 0;
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #82DAEB;
          box-shadow: 0 18px 40px rgba(0,0,0,0.18);
          padding: 16px 16px 18px;
        }
  
        .auth-modal__header{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #B4E6F0;
        }
  
        .auth-modal__title{
          margin: 0;
          font-size: 18px;
          color: #000000;
        }
  
        .auth-modal__close{
          background: #FFFFFF;
          color: #000000;
          border: 1px solid #82DAEB;
          border-radius: 8px;
          padding: 6px 10px;
          cursor: pointer;
        }
  
        .auth-modal__close:hover{
          background: #B4E6F0;
        }
  
        .auth-modal__body{
          padding-top: 14px;
        }
  
        /* ===== 폼 ===== */
        .auth-form{
          display: grid;
          gap: 12px;
        }
  
        .auth-field__label{
          font-size: 13px;
          color: #000000;
          margin-bottom: 6px;
          text-align: left;
        }
  
        .auth-field__input{
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #82DAEB;
          border-radius: 10px;
          outline: none;
          background: #FFFFFF;
          color: #000000;
          margin-bottom: 5px;
        }
  
        .auth-field__input:focus{
          border-color: #8DE0EF;
          box-shadow: 0 0 0 3px rgba(141,224,239,0.35);
        }
  
        .auth-form__actions{
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 6px;
          justify-content: center;
        }
  
        .auth-form__actions button{
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          border: 1px solid #82DAEB;
          background: #FFFFFF;
          color: #000000;
        }
  
        .auth-form__actions button:hover{
          background: #B4E6F0;
        }
  
        .auth-form__actions button:disabled{
          opacity: 0.6;
          cursor: not-allowed;
        }
  
        /* 메시지 */
        .auth-error{
          margin: 0;
          color: #000000;
          background: #B4E6F0;
          border: 1px solid #82DAEB;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 13px;
        }
  
        .auth-done{
          margin: 0;
          color: #000000;
          background: #A3E6F2;
          border: 1px solid #82DAEB;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 13px;
        }
      `}</style>
      {/* 기존 JSX 그대로 */}
      {!isAuthed ? (
        <div className="auth-actions">
          <button type="button" className="login" onClick={openLogin}>
            로그인
          </button>
          <button type="button" className="signin" onClick={openSignup}>
            회원가입
          </button>
        </div>
      ) : (
        <div className="auth-actions">
          <span style={{ color: "#000", marginRight: "15px", fontSize: 13 }}>
            {userId}님 환영합니다.
          </span>
          <button type="button" className="logout" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      )}

      {modal === "login" && (
        <AuthModal title="로그인" onClose={closeModal}>
          <LoginForm
            onSuccess={(token, username) => {
              setAuth(token, username);
              closeModal();
            }}
          />
        </AuthModal>
      )}

      {modal === "signup" && (
        <AuthModal title="회원가입" onClose={closeModal}>
          <SignupForm
            onGoLogin={() => {
              closeModal();
              openLogin(); // 또는 setModal("login")
            }}
          />
        </AuthModal>
      )}
    </>
  );
}

/** 공통 모달(오버레이 + 패널) */
function AuthModal({ title, onClose, children }) {
  return (
    <div className="auth-modal" role="dialog" aria-modal="true">
      {/* 오버레이 클릭 시 닫기 */}
      <div className="auth-modal__overlay" onClick={onClose} />
      <div className="auth-modal__panel">
        <div className="auth-modal__header">
          <h3 className="auth-modal__title">{title}</h3>
          <button type="button" className="auth-modal__close" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="auth-modal__body">{children}</div>
      </div>
    </div>
  );
}

/** 로그인 폼: /api/auth/login/ 연동 (성공 시 토큰 저장 + 로그인 상태 전환) */
function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.detail || `로그인 실패 (HTTP ${res.status})`
        );
      }

      // 백엔드 응답 키에 맞춰 1개로 고정 권장(현재는 여러 후보 허용)
      const token = data?.access;
      if (!token)
        throw new Error("토큰(access)이 응답에 포함되어 있지 않습니다.");
      onSuccess(token, username);
    } catch (err) {
      setErrorMsg(err?.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <div className="auth-field__label">아이디</div>
        <input
          className="auth-field__input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </label>

      <label className="auth-field">
        <div className="auth-field__label">비밀번호</div>
        <input
          className="auth-field__input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>

      {errorMsg && <p className="auth-error">{errorMsg}</p>}

      <div className="auth-form__actions">
        <button type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </div>
    </form>
  );
}

/** 회원가입 폼: /api/auth/signup/ 연동 (username, password JSON 전송) */
function SignupForm({ onGoLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [doneMsg, setDoneMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setDoneMsg("");

    if (password !== password2) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.detail || `회원가입 실패 (HTTP ${res.status})`
        );
      }

      setDoneMsg("회원가입이 완료되었습니다.");
    } catch (err) {
      setErrorMsg(err?.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <div className="auth-field__label">아이디/이메일</div>
        <input
          className="auth-field__input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          disabled={!!doneMsg}
        />
      </label>

      <label className="auth-field">
        <div className="auth-field__label">비밀번호</div>
        <input
          className="auth-field__input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={!!doneMsg}
        />
      </label>

      <label className="auth-field">
        <div className="auth-field__label">비밀번호 확인</div>
        <input
          className="auth-field__input"
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          autoComplete="new-password"
          disabled={!!doneMsg}
        />
      </label>

      {errorMsg && <p className="auth-error">{errorMsg}</p>}

      {doneMsg && (
        <div className="auth-done-wrap">
          <p className="auth-done">{doneMsg}</p>
        </div>
      )}

      <div className="auth-form__actions auth-form__actions--row">
        <button type="submit" disabled={loading || !!doneMsg}>
          {loading ? "처리 중..." : "회원가입"}
        </button>

        {doneMsg && (
          <button type="button" onClick={() => onGoLogin?.()}>
            로그인
          </button>
        )}
      </div>
    </form>
  );
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

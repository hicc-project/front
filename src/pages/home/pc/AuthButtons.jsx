import React, { useEffect, useState } from "react";

const API_BASE = "https://back-r4e1.onrender.com";

export default function AuthButtons() {
  const [isAuthed, setIsAuthed] = useState(() => {
    return !!localStorage.getItem("accessToken");
  });

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
    localStorage.removeItem("accessToken");
    setIsAuthed(false);
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
          width: 420px;
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
          <button type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      )}

      {modal === "login" && (
        <AuthModal title="로그인" onClose={closeModal}>
          <LoginForm
            onSuccess={(token) => {
              localStorage.setItem("accessToken", token);
              setIsAuthed(true);
              closeModal();
            }}
          />
        </AuthModal>
      )}

      {modal === "signup" && (
        <AuthModal title="회원가입" onClose={closeModal}>
          <SignupForm />
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

/** 로그인 폼: /api/auth/login/ 연동 */
function LoginForm({ onSuccess, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        credentials: "include", // 쿠키 기반이면 유지, 아니면 제거 가능
        body: JSON.stringify({ username: email, password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.detail || `로그인 실패 (HTTP ${res.status})`
        );
      }

      // 응답 토큰 키는 백엔드에 맞게 조정
      const token =
        data?.accessToken ||
        data?.token ||
        data?.jwt ||
        data?.data?.accessToken;

      if (!token) throw new Error("토큰이 응답에 포함되어 있지 않습니다.");

      onSuccess(token);
    } catch (err) {
      setErrorMsg(err?.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <div className="auth-field__label">이메일</div>
        <input
          className="auth-field__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
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

/** 회원가입 폼: 엔드포인트가 있으면 연결 */
function SignupForm({ onGoLogin }) {
  const [email, setEmail] = useState("");
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
      // TODO: 실제 회원가입 API가 있다면 여기서 fetch로 연결
      // const res = await fetch(`${API_BASE}/api/auth/signup/`, {...})

      setDoneMsg("회원가입 요청이 완료되었습니다. 로그인 해주세요.");
    } catch (err) {
      setErrorMsg(err?.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <div className="auth-field__label">이메일</div>
        <input
          className="auth-field__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
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
        />
      </label>

      {errorMsg && <p className="auth-error">{errorMsg}</p>}
      {doneMsg && <p className="auth-done">{doneMsg}</p>}

      <div className="auth-form__actions">
        <button type="submit" disabled={loading}>
          {loading ? "처리 중..." : "회원가입"}
        </button>
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

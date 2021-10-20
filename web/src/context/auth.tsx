import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../services/api";

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
};

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
};

interface AuthProviderProps {
  children: ReactNode;
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  };
};

const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=a150fafa3f9b81299ad9`;

  async function signIn(githubCode: string) {
    const response = await api.post<AuthResponse>("authenticate", {
      code: githubCode,
    });

    const { token, user } = response.data;

    localStorage.setItem("@nlwheat:token", token);

    api.defaults.headers.common.authorization = `Bearer ${token}`;

    setUser(user);
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem("@nlwheat:token");
  }

  useEffect(() => {
    const token = localStorage.getItem("@nlwheat:token");

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;

      api.get<User>("profile").then((response) => setUser(response.data));
    }
  }, []);

  useEffect(() => {
    const url = window.location.href;

    const hasGithubCode = url.includes("?code=");

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split("?code=");

      window.history.pushState({}, "", urlWithoutCode);
      signIn(githubCode);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signInUrl,
        signOut,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

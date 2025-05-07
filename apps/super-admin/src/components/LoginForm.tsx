import React, { useState } from "react";
import { Button, Input } from "@packages/ui";
import {
  LoginAdminDocument,
  LoginAdminMutation,
  LoginAdminMutationVariables,
} from "@/generated/graphql/graphql";
import { useMutation } from "@tanstack/react-query";
import { gqlClient } from "@/lib/gqlClient";
import { toast } from "sonner";

interface LoginFormProps {
  onLoginSuccess: (token: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation<
    LoginAdminMutation,
    Error,
    LoginAdminMutationVariables
  >({
    mutationFn: (variables) => gqlClient.request(LoginAdminDocument, variables),
    onSuccess: (data) => {
      if (data.loginAdmin?.token) {
        toast.success("Login successful!");
        onLoginSuccess(data.loginAdmin.token);
      } else {
        toast.error("Login Failed", {
          description: "Could not retrieve authentication token from server.",
        });
      }
    },
    onError: (error) => {
      console.error("Login Error:", error);
      toast.error("Login Failed", {
        description:
          error instanceof Error
            ? error.message
            : "Invalid credentials or server error.",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Missing fields", {
        description: "Please enter both email and password.",
      });
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h2 className="text-2xl font-semibold text-center">Admin Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? "Logging In..." : "Log In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

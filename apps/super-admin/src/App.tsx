import { useEffect, useState } from "react";
import { Redirect, Route, Router, Switch } from "wouter";
import { CommissionForm } from "./components/CommissionForm";
import { Dashboard } from "./components/Dashboard";
import { LoginForm } from "./components/LoginForm";
import { PaymentsTable } from "./components/PaymentsTable";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Sidebar } from "./components/Sidebar";
import "./index.css";
import { updateGqlClientHeaders } from "./lib/gqlClient";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem("adminToken")
  );

  useEffect(() => {
    updateGqlClientHeaders();
  }, [isAuthenticated]);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem("adminToken", token);
    setIsAuthenticated(true);
    updateGqlClientHeaders();
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {isAuthenticated && <Sidebar />}

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Switch>
            <Route path="/login">
              {isAuthenticated ? (
                <Redirect to="/" />
              ) : (
                <LoginForm onLoginSuccess={handleLoginSuccess} />
              )}
            </Route>

            <Route path="/">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/commission">
              <ProtectedRoute>
                <CommissionForm />
              </ProtectedRoute>
            </Route>
            <Route path="/payments">
              <ProtectedRoute>
                <PaymentsTable />
              </ProtectedRoute>
            </Route>

            <Route>
              {isAuthenticated ? (
                <div className="p-6 text-center text-gray-500">
                  404 - Page Not Found
                </div>
              ) : (
                <Redirect to="/login" />
              )}
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
}

export default App;

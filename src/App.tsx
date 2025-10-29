import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from 'react';
import supabase from './utils/supabase';
import { AuthProvider } from './contexts/AuthContext';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/Dashboardadmin";
import NotFound from "./pages/NotFound";
import DatabaseTest from "./components/DatabaseTest";
import ProfileDebugger from "./components/ProfileDebugger";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

// Test component to demonstrate Supabase connection
const TodosTest = () => {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getTodos() {
      try {
        const { data: todos, error } = await supabase.from('todos').select('*');
        
        if (error) {
          console.error('Error fetching todos:', error);
        } else {
          setTodos(todos || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    getTodos();
  }, []);

  if (loading) {
    return <div>Loading todos...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      <p className="mb-4">Todos from Supabase:</p>
      <ul className="list-disc list-inside">
        {todos.length > 0 ? (
          todos.map((todo, index) => (
            <li key={index}>{JSON.stringify(todo)}</li>
          ))
        ) : (
          <li>No todos found or table doesn't exist</li>
        )}
      </ul>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/test-supabase" element={<TodosTest />} />
            <Route path="/test-db" element={<DatabaseTest />} />
            <Route path="/debug-profile" element={<ProfileDebugger />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

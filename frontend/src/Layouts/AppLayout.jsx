import { Outlet } from 'react-router-dom';
import Sidebar from '../Components/Sidebar/Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-[#e5e2e1] overflow-hidden relative">

      {/* ── Background glow blobs ── */}
      <div className="fixed w-[420px] h-[420px] rounded-full blur-[120px] pointer-events-none z-0 bg-[#8ff6d0] opacity-[0.12] top-[-100px] left-[-100px]" />
      <div className="fixed w-[420px] h-[420px] rounded-full blur-[120px] pointer-events-none z-0 bg-blue-500  opacity-[0.10] bottom-[10%] right-[-50px]" />
      <div className="fixed w-[420px] h-[420px] rounded-full blur-[120px] pointer-events-none z-0 bg-[#ffdb3c] opacity-[0.04] top-[30%] left-[40%]" />

      {/* ── Sidebar ── */}
      <Sidebar />

      {/* ── Page content ── */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 relative z-10
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-white/10
                        [&::-webkit-scrollbar-thumb]:rounded-full">
        <Outlet />
      </main>

    </div>
  );
}
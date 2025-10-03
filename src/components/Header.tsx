import { Search, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-black text-white flex justify-between items-center px-5 py-2 text-sm">
      <div className="font-bold">LOGO</div>
      <nav className="flex gap-4">
        <Search className="w-5 h-5 cursor-pointer hover:text-gray-300 transition" />
        <Settings className="w-5 h-5 cursor-pointer hover:text-gray-300 transition" />
      </nav>
    </header>
  );
}

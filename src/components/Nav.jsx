import { logout } from "../firebase";

export default function Nav() {
  const links = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-xl font-bold text-white">Tech Tavern</div>
        <ul className="flex space-x-6">
          {links.map((link) => (
            <li key={link.name}>
              <a
                href={link.href}
                className="text-white hover:text-orange-500 transition-colors"
              >
                {link.name}
              </a>
            </li>
          ))}
          <li>
            <button
              className="text-white cursor-pointer hover:text-orange-500 transition-colors"
              onClick={logout}
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

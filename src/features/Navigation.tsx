"use client";

import { usePathname } from "next/navigation";
import { type ComponentType, useState } from "react";
import { CrossIcon, MenuIcon } from "../components/Icons";
import { Link } from "../components/Link";
import { useSyncOnLogin } from "../hooks/useSyncOnLogin";
import { AuthButton } from "./AuthButton";

interface NavigationItem {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/comparison",
    label: "Deck Comparison"
  },
  {
    href: "/matchup-records",
    label: "Matchup Records"
  },
  {
    href: "/saved-decks",
    label: "Saved Decks"
  }
];

export function Navigation() {
  useSyncOnLogin();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    // Remove basePath if present to compare routes correctly
    const normalizedPath = pathname.replace(/^\/pkmn-tools/, "") || "/";

    if (href === "/") {
      return normalizedPath === "/";
    }
    return normalizedPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 hover:no-underline"
              >
                Pokémon Tools
              </Link>
              <div className="flex space-x-6">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = isActiveLink(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:no-underline ${
                        isActive
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 hover:no-underline"
            >
              Pokémon Tools
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle mobile menu"
              type="button"
            >
              {isMobileMenuOpen ? (
                <CrossIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isActiveLink(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors hover:no-underline ${
                      isActive
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

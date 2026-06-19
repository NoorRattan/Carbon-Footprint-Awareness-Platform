import React, { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface NavItem {
  readonly label: string
  readonly to: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Log Activity', to: '/log' },
  { label: 'Insights', to: '/insights' },
  { label: 'Goals', to: '/goals' },
  { label: 'Learn', to: '/learn' },
]

/**
 * Main navigation bar with responsive mobile menu, skip link, and auth-aware user dropdown.
 * @returns The navigation bar component.
 */
const Navbar: React.FC = () => {
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    /**
     * Closes the user dropdown menu when clicking outside.
     * @param e - The mouse event.
     */
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Handles user sign out and closes the dropdown.
   */
  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOut()
  }

  const activeLinkClass = 'text-primary font-semibold'
  const inactiveLinkClass = 'text-slate-600 hover:text-primary transition-colors duration-200'

  return (
    <nav
      aria-label="Main navigation"
      className="bg-white border-b border-slate-200 sticky top-0 z-40"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between min-h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <span aria-hidden="true">🌿</span>
            EcoTrack
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Auth / User Area */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg px-2 py-1"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {user.displayName?.charAt(0)?.toUpperCase() ??
                        user.email?.charAt(0)?.toUpperCase() ??
                        'U'}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">
                    {user.displayName ?? user.email ?? 'User'}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 animate-fade-in">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="md:hidden p-2 text-slate-600 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-slate-200 bg-white animate-slide-up"
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-primary/5 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-slate-200">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false)
                      await signOut()
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-primary"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar

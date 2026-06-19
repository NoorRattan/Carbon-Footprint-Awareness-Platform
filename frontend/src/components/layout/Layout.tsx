import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * Main application layout wrapping all routes with Navbar, main content area, and Footer.
 * @returns The layout shell component.
 */
const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main
        id="main-content"
        aria-label="Main content"
        className="flex-1 container mx-auto px-4 py-8"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout

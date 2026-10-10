import React, { createContext, useContext, useState } from 'react';

interface MobileMenuContextType {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType>({
  isMenuOpen: false,
  openMenu: () => {},
  closeMenu: () => {},
  toggleMenu: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);

export const MobileMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <MobileMenuContext.Provider value={{ isMenuOpen, openMenu, closeMenu, toggleMenu }}>
      {children}
    </MobileMenuContext.Provider>
  );
};

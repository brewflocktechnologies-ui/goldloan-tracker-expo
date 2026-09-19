import React, { createContext, useContext, useState } from 'react';
import { useWindowDimensions } from 'react-native';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  mobileDrawerOpen: false,
  setMobileDrawerOpen: () => {},
  toggleSidebar: () => {},
  isDesktop: true,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleSidebar = () => {
    if (isDesktop) {
      setCollapsed(prev => !prev);
    } else {
      setMobileDrawerOpen(prev => !prev);
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        mobileDrawerOpen,
        setMobileDrawerOpen,
        toggleSidebar,
        isDesktop,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

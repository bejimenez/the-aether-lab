import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeSwitcher from './ThemeSwitcher';

const MobileMenu = ({ userProfile, user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      {/* Hamburger Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="p-2"
        aria-label="Open menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleMenu}
          />
          
          {/* Menu Content */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
            <div className="space-y-4">
              {/* User Info */}
              <div className="pb-3 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  Welcome, {userProfile?.username || user?.email || 'Demo User'}
                </p>
              </div>
              
              {/* Theme Switcher */}
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium">Theme</p>
                <ThemeSwitcher />
              </div>
              
              {/* Sign Out Button */}
              <Button
                variant="outline"
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileMenu;
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState } from 'react';

type CreateGroupModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CreateGroupModalContext = createContext<CreateGroupModalContextValue | null>(null);

export const CreateGroupModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <CreateGroupModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </CreateGroupModalContext.Provider>
  );
};

export const useCreateGroupModal = (): CreateGroupModalContextValue => {
  const context = useContext(CreateGroupModalContext);
  if (!context) {
    throw new Error('useCreateGroupModal must be used inside CreateGroupModalProvider');
  }

  return context;
};

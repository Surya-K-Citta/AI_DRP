// @ts-nocheck
import { useNavigate } from 'react-router-dom';

/**
 * Creates a click handler for links that supports Ctrl+Click/Cmd+Click to open in new tab
 * while using React Router navigation for normal clicks
 */
export const useLinkHandler = () => {
  const navigate = useNavigate();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    // Allow Ctrl+Click, Cmd+Click, and middle-click to open in new tab
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return; // Let browser handle it naturally
    }
    // Prevent default and use React Router for normal clicks
    e.preventDefault();
    navigate(path);
  };

  return handleLinkClick;
};


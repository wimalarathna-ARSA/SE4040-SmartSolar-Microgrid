// ============================================================================
// File: Footer.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Site-wide footer component.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import FrequenzGlobeFooter3D from './3d/FrequenzGlobeFooter3D';

const Footer = () => {
  return (
    <footer
      id="footer"
      className="position-relative text-light"
      style={{ backgroundColor: '#020202' }}
    >
    </footer>
  );
};

export default Footer;
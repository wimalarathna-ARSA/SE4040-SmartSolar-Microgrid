import React from 'react';

const MotionReveal = ({
  children,
  className = '',
  style = {},
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={`motion-reveal ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
};

export default MotionReveal;